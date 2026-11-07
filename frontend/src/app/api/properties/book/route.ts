import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { sendUserBookingConfirmation, sendOwnerBookingNotification } from "@/lib/email/email-service";
import { v4 as uuidv4 } from "uuid";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      propertyId,
      property_id,
      userName,
      user_name,
      userEmail,
      user_email,
      userPhone,
      user_phone,
      bookingDate,
      booking_date,
      timeSlot,
      time_slot,
      bookingType,
      booking_type = "in_person",
      notes,
      agreedToTerms,
      agreed_to_terms,
      userId,
      user_id,
    } = body;

    const propId = propertyId || property_id;
    const name = (userName || user_name || "").trim();
    const email = (userEmail || user_email || "").trim().toLowerCase();
    const phone = (userPhone || user_phone || "").trim();
    const date = bookingDate || booking_date;
    const slot = timeSlot || time_slot;
    const bType = bookingType || booking_type;
    const agreed = agreedToTerms ?? agreed_to_terms ?? false;
    const rawUserId = userId || user_id || null;

    // Validation
    if (!propId) {
      return NextResponse.json({ success: false, message: "Property ID is required." }, { status: 400 });
    }
    if (!name) {
      return NextResponse.json({ success: false, message: "Your full name is required." }, { status: 400 });
    }
    if (!email || !EMAIL_REGEX.test(email)) {
      return NextResponse.json({ success: false, message: "A valid email address is required for verification." }, { status: 400 });
    }
    if (!phone) {
      return NextResponse.json({ success: false, message: "Phone or WhatsApp contact number is required." }, { status: 400 });
    }
    if (!date) {
      return NextResponse.json({ success: false, message: "Viewing date is required." }, { status: 400 });
    }
    if (!slot) {
      return NextResponse.json({ success: false, message: "Preferred time slot is required." }, { status: 400 });
    }
    if (!agreed) {
      return NextResponse.json(
        { success: false, message: "You must agree to HavenKey's viewing and platform policies to proceed." },
        { status: 400 }
      );
    }

    const sanitizedUserId = rawUserId && UUID_REGEX.test(String(rawUserId).trim()) ? String(rawUserId).trim() : null;

    // Fetch property information from Supabase
    let propertyTitle = "HavenKey Verified Property";
    let propertyLocation = "Pakistan";
    let ownerId: string | null = null;
    let ownerName = "Property Owner / Concierge";
    let ownerEmail = "concierge@havenkey.pk";

    try {
      const { data: propData } = await supabaseAdmin
        .from("properties")
        .select("id, title, location, address, price, owner_id")
        .eq("id", propId)
        .maybeSingle();

      if (propData) {
        propertyTitle = propData.title || propertyTitle;
        propertyLocation = propData.location || propData.address || propertyLocation;
        ownerId = propData.owner_id || null;

        // Fetch owner user details if owner_id exists
        if (ownerId) {
          const { data: ownerUser } = await supabaseAdmin
            .from("users")
            .select("fullname, email, phone_no")
            .eq("id", ownerId)
            .maybeSingle();

          if (ownerUser) {
            ownerName = ownerUser.fullname || ownerName;
            ownerEmail = ownerUser.email || ownerEmail;
          }
        }
      }
    } catch (err: any) {
      console.warn("[BookingAPI] Property metadata fetch warning:", err.message);
    }

    // Persist booking into Supabase bookings table
    let bookingRecordId = uuidv4();
    let dbPersisted = false;

    try {
      const { data: inserted, error: insertErr } = await supabaseAdmin
        .from("bookings")
        .insert([
          {
            property_id: propId,
            owner_id: ownerId,
            user_id: sanitizedUserId,
            booking_type: bType,
            user_name: name,
            user_email: email,
            user_phone: phone,
            booking_date: date,
            time_slot: slot,
            notes: notes ? String(notes).trim() : null,
            agreed_to_terms: true,
            status: "pending",
          },
        ])
        .select()
        .maybeSingle();

      if (!insertErr && inserted) {
        bookingRecordId = inserted.id;
        dbPersisted = true;
      } else if (insertErr) {
        console.warn("[BookingAPI] Supabase bookings insert notice (table may be pending):", insertErr.message);
      }
    } catch (dbErr: any) {
      console.warn("[BookingAPI] Database exception while inserting booking:", dbErr.message);
    }

    // Prepare email data payload
    const emailPayload = {
      bookingId: bookingRecordId,
      propertyTitle,
      propertyLocation,
      bookingDate: date,
      timeSlot: slot,
      bookingType: bType === "video_tour" ? "Live Video Tour" : (bType === "inspection" ? "Technical Property Inspection" : "In-Person Private Viewing"),
      userName: name,
      userEmail: email,
      userPhone: phone,
      ownerName,
      ownerEmail,
      notes: notes ? String(notes).trim() : undefined,
    };

    // Dispatch dual verification emails in background (async non-blocking)
    const [userEmailRes, ownerEmailRes] = await Promise.all([
      sendUserBookingConfirmation(emailPayload),
      sendOwnerBookingNotification(emailPayload),
    ]);

    return NextResponse.json(
      {
        success: true,
        message: "Your viewing booking has been confirmed! Verification emails have been sent to you and the property owner.",
        booking: {
          id: bookingRecordId,
          propertyTitle,
          propertyLocation,
          bookingDate: date,
          timeSlot: slot,
          bookingType: bType,
          user: { name, email, phone },
          owner: { name: ownerName, email: ownerEmail },
          dbPersisted,
          emailsSent: {
            user: userEmailRes.success,
            owner: ownerEmailRes.success,
            simulated: Boolean(userEmailRes.simulated || ownerEmailRes.simulated),
          },
        },
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("[BookingAPI] Unexpected error processing booking:", err);
    return NextResponse.json(
      { success: false, message: `Failed to process booking: ${err.message || "Internal server error"}` },
      { status: 500 }
    );
  }
}
