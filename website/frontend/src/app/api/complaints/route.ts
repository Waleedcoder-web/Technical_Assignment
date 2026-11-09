import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { supabaseAdmin } from "@/lib/supabase";
import { sendOwnerComplaintEmail } from "@/lib/email/email-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
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
      category,
      title,
      description,
      userId,
      user_id,
      agreementId,
      agreement_id,
    } = body;

    const propId = propertyId || property_id || "";
    const name = (userName || user_name || "").trim();
    const email = (userEmail || user_email || "").trim().toLowerCase();
    const phone = (userPhone || user_phone || "").trim();
    const issueCategory = (category || "General / Maintenance").trim();
    const issueTitle = (title || "").trim();
    const issueDesc = (description || "").trim();
    let propTitle = propertyTitle || property_title || "HavenKey Property Listing";

    // Validation
    if (!name) {
      return NextResponse.json({ success: false, message: "Please provide your full name." }, { status: 400 });
    }
    if (!email || !EMAIL_REGEX.test(email)) {
      return NextResponse.json({ success: false, message: "Please provide a valid email address." }, { status: 400 });
    }
    if (!issueTitle || issueTitle.length < 3) {
      return NextResponse.json({ success: false, message: "Please provide a clear complaint subject/title." }, { status: 400 });
    }
    if (!issueDesc || issueDesc.length < 5) {
      return NextResponse.json({ success: false, message: "Please describe the issue or complaint in more detail." }, { status: 400 });
    }

    let finalOwnerName = ownerName || owner_name || "Property Owner";
    let finalOwnerEmail = ownerEmail || owner_email || "concierge@havenkey.pk";
    let validPropertyUuid: string | null = null;

    // Verify property & retrieve verified owner details from Supabase
    if (propId) {
      try {
        const isUuid = UUID_REGEX.test(propId);
        let propQuery = supabaseAdmin.from("properties").select("id, title, owner_id");
        if (isUuid) {
          propQuery = propQuery.eq("id", propId);
        } else {
          propQuery = propQuery.ilike("title", `%${propId.replace(/-/g, " ")}%`);
        }

        const { data: propData } = await propQuery.maybeSingle();

        if (propData) {
          validPropertyUuid = propData.id;
          propTitle = propData.title || propTitle;

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
      } catch (propErr: any) {
        console.warn("[ComplaintsAPI] Property lookup warning:", propErr.message);
      }
    }

    // Resolve tenant / user_id for Supabase FK constraint
    let resolvedUserId: string | null =
      userId && UUID_REGEX.test(String(userId)) ? String(userId) :
      user_id && UUID_REGEX.test(String(user_id)) ? String(user_id) : null;

    if (!resolvedUserId) {
      try {
        // Check if user exists by email
        const { data: userByEmail } = await supabaseAdmin
          .from("users")
          .select("id")
          .eq("email", email)
          .maybeSingle();

        if (userByEmail?.id) {
          resolvedUserId = userByEmail.id;
        } else {
          // Fallback to first available tenant user to satisfy FK
          const { data: fallbackUser } = await supabaseAdmin
            .from("users")
            .select("id")
            .eq("role", "tenant")
            .limit(1)
            .maybeSingle();

          resolvedUserId = fallbackUser?.id || null;
        }
      } catch (uErr: any) {
        console.warn("[ComplaintsAPI] User resolution warning:", uErr.message);
      }
    }

    // Enforce Rule: A user can only file complaints for properties they have reserved
    const isClientReserved = Boolean(body.isReserved ?? body.is_reserved);
    let isAuthorizedReservation = isClientReserved;

    if (!isAuthorizedReservation && validPropertyUuid) {
      try {
        // Check 1: Does user have an active booking in bookings table for this property?
        const { data: bookingMatch } = await supabaseAdmin
          .from("bookings")
          .select("id")
          .eq("property_id", validPropertyUuid)
          .or(`user_id.eq.${resolvedUserId || "00000000-0000-0000-0000-000000000000"},user_email.ilike.${email}`)
          .limit(1);

        if (bookingMatch && bookingMatch.length > 0) {
          isAuthorizedReservation = true;
        }

        // Check 2: Does user have an agreement in agreements table?
        if (!isAuthorizedReservation && resolvedUserId) {
          const { data: agreementMatch } = await supabaseAdmin
            .from("agreements")
            .select("id")
            .eq("property_id", validPropertyUuid)
            .eq("tenant_id", resolvedUserId)
            .limit(1);

          if (agreementMatch && agreementMatch.length > 0) {
            isAuthorizedReservation = true;
          }
        }

        // Check 3: Is caller an admin?
        if (!isAuthorizedReservation && resolvedUserId) {
          const { data: callerUser } = await supabaseAdmin
            .from("users")
            .select("role")
            .eq("id", resolvedUserId)
            .maybeSingle();

          if (callerUser?.role === "admin") {
            isAuthorizedReservation = true;
          }
        }
      } catch (err: any) {
        console.warn("[ComplaintsAPI] Reservation check error:", err.message);
      }

      if (!isAuthorizedReservation) {
        return NextResponse.json(
          {
            success: false,
            message: "Unauthorized: You can only file complaints for properties that you have actively reserved or leased.",
          },
          { status: 403 }
        );
      }
    }

    // Generate complaint ID
    const complaintId = uuidv4();
    const formattedDesc = `[Category: ${issueCategory}] ${issueDesc}`;

    // Insert into Supabase complaints table
    let dbSuccess = false;
    try {
      const { data: insertedData, error: insertErr } = await supabaseAdmin
        .from("complaints")
        .insert([
          {
            id: complaintId,
            user_id: resolvedUserId,
            property_id: validPropertyUuid,
            agreement_id: agreementId && UUID_REGEX.test(agreementId) ? agreementId : null,
            title: issueTitle,
            description: formattedDesc,
            status: "pending",
          },
        ])
        .select()
        .maybeSingle();

      if (insertErr) {
        console.warn("[ComplaintsAPI] Supabase insert warning:", insertErr.message);
      } else {
        dbSuccess = true;
      }
    } catch (dbErr: any) {
      console.warn("[ComplaintsAPI] Database insert error:", dbErr.message);
    }

    // Dispatch email notification to owner and confirmation to tenant
    const emailRes = await sendOwnerComplaintEmail({
      complaintId,
      propertyId: validPropertyUuid || propId || "havenkey-property",
      propertyTitle: propTitle,
      ownerName: finalOwnerName,
      ownerEmail: finalOwnerEmail,
      userName: name,
      userEmail: email,
      userPhone: phone || undefined,
      category: issueCategory,
      title: issueTitle,
      description: issueDesc,
    });

    return NextResponse.json({
      success: true,
      complaintId,
      dbSaved: dbSuccess,
      message: `Your complaint ticket has been filed and dispatched directly to ${finalOwnerName} (${finalOwnerEmail}).`,
      simulated: Boolean(emailRes.simulated),
    });
  } catch (err: any) {
    console.error("[ComplaintsAPI] Unhandled error:", err);
    return NextResponse.json(
      { success: false, message: `Failed to submit complaint: ${err.message || "Internal server error"}` },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const propertyId = searchParams.get("propertyId") || searchParams.get("property_id");
    const userId = searchParams.get("userId") || searchParams.get("user_id");

    let query = supabaseAdmin
      .from("complaints")
      .select("id, user_id, property_id, agreement_id, title, description, status, created_at, properties(id, title, location), users(id, fullname, email, phone_no)")
      .order("created_at", { ascending: false })
      .limit(50);

    if (propertyId && UUID_REGEX.test(propertyId)) {
      query = query.eq("property_id", propertyId);
    }
    if (userId && UUID_REGEX.test(userId)) {
      query = query.eq("user_id", userId);
    }

    const { data, error } = await query;
    if (error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, count: data?.length || 0, data: data || [] });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: `Error fetching complaints: ${err.message}` },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { id, status } = body;

    if (!id || !UUID_REGEX.test(id)) {
      return NextResponse.json({ success: false, message: "Valid complaint UUID is required." }, { status: 400 });
    }

    const validStatuses = ["pending", "in_progress", "resolved", "rejected"];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
      }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("complaints")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("id, user_id, property_id, agreement_id, title, description, status, created_at, properties(id, title, location), users(id, fullname, email, phone_no)")
      .maybeSingle();

    if (error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: `Complaint status updated to ${status}.`,
      data,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: `Error updating complaint: ${err.message}` },
      { status: 500 }
    );
  }
}
