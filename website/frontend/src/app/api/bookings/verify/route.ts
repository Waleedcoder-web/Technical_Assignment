import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { sendBookingStatusConfirmationEmail } from "@/lib/email/email-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function processVerification(reqId: string, action?: string, explicitPropId?: string) {
  const cleanId = (reqId || "").trim();
  const cleanAction = (action || "").toLowerCase().trim();

  let booking: any = null;
  let agreement: any = null;
  let propertyId: string | null = explicitPropId || null;
  let propertyTitle: string = "HavenKey Property";

  // 1. Look up in bookings table
  if (cleanId && UUID_REGEX.test(cleanId)) {
    try {
      const { data: bData } = await supabaseAdmin
        .from("bookings")
        .select("*")
        .eq("id", cleanId)
        .maybeSingle();
      if (bData) {
        booking = bData;
        propertyId = propertyId || bData.property_id;
      }
    } catch (e: any) {
      console.warn("[VerifyAPI] Bookings fetch warning:", e.message);
    }
  }

  // 2. Look up in agreements table
  if (cleanId) {
    try {
      let query = supabaseAdmin.from("agreements").select("*");
      if (UUID_REGEX.test(cleanId)) {
        query = query.or(`id.eq.${cleanId},agreement_doc.ilike.%${cleanId.slice(0, 8)}%`);
      } else {
        query = query.ilike("agreement_doc", `%${cleanId}%`);
      }
      const { data: aData } = await query.maybeSingle();
      if (aData) {
        agreement = aData;
        propertyId = propertyId || aData.property_id;
      }
    } catch (e: any) {
      console.warn("[VerifyAPI] Agreements fetch warning:", e.message);
    }
  }

  // Also check agreements by property_id if propertyId is known
  if (!agreement && propertyId) {
    try {
      const { data: aPropData } = await supabaseAdmin
        .from("agreements")
        .select("*")
        .eq("property_id", propertyId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (aPropData) {
        agreement = aPropData;
      }
    } catch {}
  }

  // 3. Look up property info
  let propertyPrice = 0;
  let propertyListingType = "rent";
  let propertyOwnerId: string | null = null;
  if (propertyId) {
    try {
      const { data: pData } = await supabaseAdmin
        .from("properties")
        .select("id, title, location, status, price, listing_type, owner_id")
        .eq("id", propertyId)
        .maybeSingle();
      if (pData) {
        propertyTitle = pData.title || propertyTitle;
        propertyPrice = Number(pData.price || 0);
        propertyListingType = pData.listing_type || propertyListingType;
        propertyOwnerId = pData.owner_id || null;
      }
    } catch (e: any) {
      console.warn("[VerifyAPI] Property fetch warning:", e.message);
    }
  }

  // If no action is supplied, return current state
  if (!cleanAction || (cleanAction !== "yes" && cleanAction !== "no")) {
    return {
      success: true,
      requiresAction: true,
      booking: booking || agreement || { id: cleanId },
      propertyId,
      propertyTitle,
      currentStatus: booking?.status || agreement?.status || "pending",
    };
  }

  const timestamp = new Date().toISOString();

  // If Action is YES: Confirm Booking, Activate/Create Agreement, Keep Property 'not available'
  if (cleanAction === "yes") {
    // Update bookings
    if (booking?.id) {
      const newNotes = booking.notes
        ? `${booking.notes} | User Confirmed: YES at ${timestamp}`
        : `User Confirmed: YES at ${timestamp}`;
      await supabaseAdmin
        .from("bookings")
        .update({ status: "confirmed", notes: newNotes, updated_at: timestamp })
        .eq("id", booking.id);
    }

    // Update or Insert agreements in database
    if (agreement?.id) {
      await supabaseAdmin
        .from("agreements")
        .update({ status: "confirmed", updated_at: timestamp })
        .eq("id", agreement.id);
    } else if (propertyId) {
      // Agreement does not exist yet; create it in agreements table!
      try {
        const sDate = booking?.booking_date || timestamp.split("T")[0];
        const d = new Date(sDate);
        d.setFullYear(d.getFullYear() + 1);
        const eDate = d.toISOString().split("T")[0];
        const rent = propertyPrice || 250000;
        const deposit = propertyListingType === "sale" ? rent * 0.1 : rent * 2;

        const { data: newAgr, error: agrErr } = await supabaseAdmin
          .from("agreements")
          .insert([
            {
              property_id: propertyId,
              owner_id: booking?.owner_id || propertyOwnerId,
              tenant_id: booking?.user_id || null,
              start_date: sDate,
              end_date: eDate,
              monthly_rent: rent,
              security_deposit: deposit,
              agreement_doc: `HAVENKEY-BOOKING-${cleanId.slice(0, 8)}`,
              status: "confirmed",
            },
          ])
          .select()
          .maybeSingle();

        if (newAgr) {
          agreement = newAgr;
        } else if (agrErr) {
          console.warn("[VerifyAPI] Agreement insert error:", agrErr.message);
        }
      } catch (err: any) {
        console.warn("[VerifyAPI] Exception creating agreement on confirmation:", err.message);
      }
    }

    // Ensure property status is 'not available'
    if (propertyId) {
      await supabaseAdmin
        .from("properties")
        .update({ status: "not available" })
        .eq("id", propertyId);
    }

    // Resolve participant contacts for confirmation email
    const finalUserName = booking?.user_name || "Valued Customer";
    const finalUserEmail = booking?.user_email || "customer@havenkey.pk";
    let finalOwnerName = "Property Landlord";
    let finalOwnerEmail = "landlord@havenkey.pk";

    const ownerId = booking?.owner_id || agreement?.owner_id;
    if (ownerId) {
      try {
        const { data: oUser } = await supabaseAdmin
          .from("users")
          .select("fullname, email")
          .eq("id", ownerId)
          .maybeSingle();
        if (oUser) {
          finalOwnerName = oUser.fullname || finalOwnerName;
          finalOwnerEmail = oUser.email || finalOwnerEmail;
        }
      } catch {}
    }

    // Dispatch status confirmation email for YES
    try {
      await sendBookingStatusConfirmationEmail({
        bookingId: cleanId,
        action: "yes",
        propertyTitle,
        userName: finalUserName,
        userEmail: finalUserEmail,
        ownerName: finalOwnerName,
        ownerEmail: finalOwnerEmail,
        monthlyRent: agreement?.monthly_rent,
      });
    } catch (e: any) {
      console.warn("[VerifyAPI] Email dispatch warning:", e.message);
    }

    return {
      success: true,
      action: "yes",
      userResponse: "YES",
      bookingStatus: "confirmed",
      agreementStatus: "active",
      propertyStatus: "not available",
      propertyId,
      propertyTitle,
      message: "Thank you! Your booking has been confirmed & verified. A confirmation email has been dispatched.",
    };
  }

  // If Action is NO: Cancel Booking, Cancel Agreement, Revert Property to 'available'
  if (cleanAction === "no") {
    // Update bookings
    if (booking?.id) {
      const newNotes = booking.notes
        ? `${booking.notes} | User Cancelled: NO at ${timestamp}`
        : `User Cancelled: NO at ${timestamp}`;
      await supabaseAdmin
        .from("bookings")
        .update({ status: "cancelled", notes: newNotes, updated_at: timestamp })
        .eq("id", booking.id);
    }

    // Update agreements
    if (agreement?.id) {
      await supabaseAdmin
        .from("agreements")
        .update({ status: "cancelled", updated_at: timestamp })
        .eq("id", agreement.id);
    }

    // REVERT property status back to 'available' so others can book
    if (propertyId) {
      await supabaseAdmin
        .from("properties")
        .update({ status: "available" })
        .eq("id", propertyId);
    }

    // Resolve participant contacts for confirmation email
    const finalUserName = booking?.user_name || "Valued Customer";
    const finalUserEmail = booking?.user_email || "customer@havenkey.pk";
    let finalOwnerName = "Property Landlord";
    let finalOwnerEmail = "landlord@havenkey.pk";

    const ownerId = booking?.owner_id || agreement?.owner_id;
    if (ownerId) {
      try {
        const { data: oUser } = await supabaseAdmin
          .from("users")
          .select("fullname, email")
          .eq("id", ownerId)
          .maybeSingle();
        if (oUser) {
          finalOwnerName = oUser.fullname || finalOwnerName;
          finalOwnerEmail = oUser.email || finalOwnerEmail;
        }
      } catch {}
    }

    // Dispatch status confirmation email for NO
    try {
      await sendBookingStatusConfirmationEmail({
        bookingId: cleanId,
        action: "no",
        propertyTitle,
        userName: finalUserName,
        userEmail: finalUserEmail,
        ownerName: finalOwnerName,
        ownerEmail: finalOwnerEmail,
        monthlyRent: agreement?.monthly_rent,
      });
    } catch (e: any) {
      console.warn("[VerifyAPI] Email dispatch warning:", e.message);
    }

    return {
      success: true,
      action: "no",
      userResponse: "NO",
      bookingStatus: "cancelled",
      agreementStatus: "cancelled",
      propertyStatus: "available",
      propertyId,
      propertyTitle,
      message: "Booking cancelled as requested. The property status has been released back to Available and a cancellation email has been dispatched.",
    };
  }

  return { success: false, message: "Invalid verification action." };
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id") || "";
    const action = searchParams.get("action") || "";
    const propertyId = searchParams.get("propertyId") || "";

    if (!id && !propertyId) {
      return NextResponse.json({ success: false, message: "Booking ID or Property ID is required." }, { status: 400 });
    }

    const result = await processVerification(id, action, propertyId);
    return NextResponse.json(result, { status: 200 });
  } catch (err: any) {
    console.error("[VerifyAPI] GET Error:", err);
    return NextResponse.json({ success: false, message: err.message || "Failed to process verification." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const id = body.id || body.bookingId || body.agreementId || "";
    const action = body.action || body.response || "";
    const propertyId = body.propertyId || body.property_id || "";

    if (!id && !propertyId) {
      return NextResponse.json({ success: false, message: "Booking ID or Property ID is required." }, { status: 400 });
    }

    const result = await processVerification(id, action, propertyId);
    return NextResponse.json(result, { status: 200 });
  } catch (err: any) {
    console.error("[VerifyAPI] POST Error:", err);
    return NextResponse.json({ success: false, message: err.message || "Failed to process verification." }, { status: 500 });
  }
}
