import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { sendPropertyUnreservedNotificationEmail } from "@/lib/email/email-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      propertyId,
      property_id,
      propertyTitle,
      property_title,
      ownerName,
      owner_name,
      ownerEmail,
      owner_email,
      userName,
      user_name,
      userEmail,
      user_email,
      userPhone,
      user_phone,
      reason,
      departureDate,
      departure_date,
      isAutomatic,
      is_automatic,
    } = body;

    const propId = propertyId || property_id;
    if (!propId) {
      return NextResponse.json({ success: false, message: "Property ID is required." }, { status: 400 });
    }

    const name = (userName || user_name || "Valued Resident").trim();
    const email = (userEmail || user_email || "tenant@havenkey.pk").trim().toLowerCase();
    const phone = (userPhone || user_phone || "").trim();
    const isAuto = Boolean(isAutomatic ?? is_automatic ?? false);
    const customReason = reason ? String(reason).trim() : isAuto ? "6-Month Tenancy Period Concluded (Automatic Unreserve)" : "Tenant Initiated Departure & Early Vacate";
    const depDate = departureDate || departure_date || new Date().toISOString().split("T")[0];

    let resolvedTitle = propertyTitle || property_title || "HavenKey Property Listing";
    let finalOwnerName = ownerName || owner_name || "Property Owner / Concierge";
    let finalOwnerEmail = ownerEmail || owner_email || "concierge@havenkey.pk";

    // 1. Fetch live property details & owner info from Supabase
    try {
      const isUuid = UUID_REGEX.test(propId);
      let query = supabaseAdmin.from("properties").select("id, title, owner_id");
      if (isUuid) {
        query = query.eq("id", propId);
      } else {
        query = query.ilike("title", `%${propId.replace(/-/g, " ")}%`);
      }

      const { data: propData } = await query.maybeSingle();

      if (propData) {
        resolvedTitle = propData.title || resolvedTitle;

        if (propData.owner_id) {
          const { data: ownerUser } = await supabaseAdmin
            .from("users")
            .select("fullname, email")
            .eq("id", propData.owner_id)
            .maybeSingle();

          if (ownerUser?.email) {
            finalOwnerName = ownerUser.fullname || finalOwnerName;
            finalOwnerEmail = ownerUser.email;
          }
        }
      }
    } catch (err: any) {
      console.warn("[UnreserveAPI] Property lookup warning:", err.message);
    }

    const timestamp = new Date().toISOString();

    // 2. Set property status back to 'available' in Supabase
    try {
      const isUuid = UUID_REGEX.test(propId);
      if (isUuid) {
        await supabaseAdmin
          .from("properties")
          .update({ status: "available", updated_at: timestamp })
          .eq("id", propId);
      }
    } catch (dbErr: any) {
      console.warn("[UnreserveAPI] Property status update warning:", dbErr.message);
    }

    // 3. Update associated agreements and bookings to unreserved/completed
    try {
      if (UUID_REGEX.test(propId)) {
        await Promise.all([
          supabaseAdmin
            .from("agreements")
            .update({ status: "terminated", end_date: depDate, updated_at: timestamp })
            .eq("property_id", propId)
            .in("status", ["confirmed", "active", "pending"]),
          supabaseAdmin
            .from("bookings")
            .update({
              status: "completed",
              notes: `Departure completed (${customReason}) at ${timestamp}`,
              updated_at: timestamp,
            })
            .eq("property_id", propId)
            .in("status", ["confirmed", "pending", "unreserved"]),
        ]);
      }
    } catch (bkErr: any) {
      console.warn("[UnreserveAPI] Booking status update warning:", bkErr.message);
    }

    // 4. Dispatch live email notifications to both owner and tenant
    const emailRes = await sendPropertyUnreservedNotificationEmail({
      propertyId: propId,
      propertyTitle: resolvedTitle,
      ownerName: finalOwnerName,
      ownerEmail: finalOwnerEmail,
      userName: name,
      userEmail: email,
      userPhone: phone || undefined,
      reason: customReason,
      departureDate: depDate,
      isAutomatic: isAuto,
    });

    return NextResponse.json({
      success: true,
      propertyId: propId,
      propertyStatus: "available",
      isAutomatic: isAuto,
      message: `Property '${resolvedTitle}' has been unreserved and set back to AVAILABLE. Notification emails dispatched to ${finalOwnerName} (${finalOwnerEmail}) and ${name}.`,
      simulated: Boolean(emailRes.simulated),
    });
  } catch (err: any) {
    console.error("[UnreserveAPI] Unhandled error:", err);
    return NextResponse.json(
      { success: false, message: `Failed to unreserve property: ${err.message || "Internal server error"}` },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const checkExpiry = searchParams.get("checkExpiry") === "true";

    // Auto-expiry check: look for agreements where end_date <= current date
    const expiredCount: string[] = [];
    if (checkExpiry) {
      const today = new Date().toISOString().split("T")[0];
      const { data: expiredAgreements } = await supabaseAdmin
        .from("agreements")
        .select("id, property_id, start_date, end_date, owner_id, tenant_id")
        .eq("status", "active")
        .lte("end_date", today);

      if (expiredAgreements && expiredAgreements.length > 0) {
        for (const agr of expiredAgreements) {
          if (agr.property_id) {
            await supabaseAdmin
              .from("properties")
              .update({ status: "available" })
              .eq("id", agr.property_id);

            await supabaseAdmin
              .from("agreements")
              .update({ status: "completed" })
              .eq("id", agr.id);

            expiredCount.push(agr.property_id);
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      expiredCount: expiredCount.length,
      unreservedProperties: expiredCount,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
