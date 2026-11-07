import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

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
        query = query.or(`id.eq.${cleanId},booking_id.eq.${cleanId}`);
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

  // If booking not found yet but agreement found, check booking by agreement's booking_id
  if (!booking && agreement?.booking_id) {
    try {
      const { data: bData } = await supabaseAdmin
        .from("bookings")
        .select("*")
        .eq("id", agreement.booking_id)
        .maybeSingle();
      if (bData) booking = bData;
    } catch {}
  }

  // 3. Look up property info
  if (propertyId) {
    try {
      const { data: pData } = await supabaseAdmin
        .from("properties")
        .select("id, title, location, status, price, listing_type")
        .eq("id", propertyId)
        .maybeSingle();
      if (pData) {
        propertyTitle = pData.title || propertyTitle;
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

  // If Action is YES: Confirm Booking, Activate Agreement, Keep Property 'not available'
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

    // Update agreements
    if (agreement?.id) {
      await supabaseAdmin
        .from("agreements")
        .update({ status: "active", updated_at: timestamp })
        .eq("id", agreement.id);
    }

    // Ensure property status is 'not available'
    if (propertyId) {
      await supabaseAdmin
        .from("properties")
        .update({ status: "not available" })
        .eq("id", propertyId);
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
      message: "Thank you! Your booking has been confirmed & verified. The property is officially reserved.",
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

    return {
      success: true,
      action: "no",
      userResponse: "NO",
      bookingStatus: "cancelled",
      agreementStatus: "cancelled",
      propertyStatus: "available",
      propertyId,
      propertyTitle,
      message: "Booking cancelled as requested. The property status has been released back to Available.",
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
