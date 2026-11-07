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
      listingType,
      listing_type,
      userName,
      user_name,
      userEmail,
      user_email,
      userPhone,
      user_phone,
      startDate,
      start_date,
      endDate,
      end_date,
      duration,
      bookingDate,
      booking_date,
      timeSlot,
      time_slot,
      bookingType,
      booking_type,
      monthlyRent,
      monthly_rent,
      securityDeposit,
      security_deposit,
      tokenAmount,
      token_amount,
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
    const lType = (listingType || listing_type || "rent").toLowerCase();
    const sDate = startDate || start_date || bookingDate || booking_date;
    const eDate = endDate || end_date;
    const slot = timeSlot || time_slot || "11:00 AM - 12:00 PM";
    const bType = bookingType || booking_type || (lType === "rent" ? "rent_booking" : "sale_booking");
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
    if (!sDate) {
      return NextResponse.json({ success: false, message: "Start date / move-in date is required." }, { status: 400 });
    }
    if (!agreed) {
      return NextResponse.json(
        { success: false, message: "You must agree to HavenKey's booking & tenancy policies to proceed." },
        { status: 400 }
      );
    }

    const sanitizedUserId = rawUserId && UUID_REGEX.test(String(rawUserId).trim()) ? String(rawUserId).trim() : null;

    // Fetch property information from Supabase
    let propertyTitle = "HavenKey Verified Property";
    let propertyLocation = "Pakistan";
    let propertyPrice = 0;
    let ownerId: string | null = null;
    let ownerName = "Property Owner / Concierge";
    let ownerEmail = "concierge@havenkey.pk";

    try {
      const { data: propData } = await supabaseAdmin
        .from("properties")
        .select("id, title, location, address, price, owner_id, listing_type")
        .eq("id", propId)
        .maybeSingle();

      if (propData) {
        propertyTitle = propData.title || propertyTitle;
        propertyLocation = propData.location || propData.address || propertyLocation;
        propertyPrice = Number(propData.price || 0);
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

    // Determine financial amounts
    const finalRent = Number(monthlyRent || monthly_rent || propertyPrice);
    const finalDeposit = Number(securityDeposit || security_deposit || (lType === "rent" ? finalRent * 2 : finalRent * 0.1));
    const finalToken = Number(tokenAmount || token_amount || finalDeposit);

    // Calculate end date if not provided (default 1 year for rent)
    let calculatedEndDate = eDate;
    if (!calculatedEndDate) {
      const d = new Date(sDate);
      d.setFullYear(d.getFullYear() + 1);
      calculatedEndDate = d.toISOString().split("T")[0];
    }

    const bookingRecordId = uuidv4();
    let agreementId: string | null = null;
    let dbPersisted = false;

    // 1. Persist in agreements table (Digital Tenancy / Purchase Token Reservation)
    try {
      const { data: agrInserted, error: agrErr } = await supabaseAdmin
        .from("agreements")
        .insert([
          {
            property_id: propId,
            owner_id: ownerId,
            tenant_id: sanitizedUserId,
            start_date: sDate,
            end_date: lType === "rent" ? calculatedEndDate : sDate,
            monthly_rent: lType === "rent" ? finalRent : propertyPrice,
            security_deposit: lType === "rent" ? finalDeposit : finalToken,
            agreement_doc: `HAVENKEY-${lType.toUpperCase()}-BOOKING-${bookingRecordId.slice(0, 8)}`,
            status: "pending",
          },
        ])
        .select()
        .maybeSingle();

      if (!agrErr && agrInserted) {
        agreementId = agrInserted.id;
        dbPersisted = true;
      } else if (agrErr) {
        console.warn("[BookingAPI] Supabase agreements insert warning:", agrErr.message);
      }
    } catch (agrErr: any) {
      console.warn("[BookingAPI] Exception inserting into agreements:", agrErr.message);
    }

    // 2. Persist in bookings table for tracking
    try {
      const { error: bkErr } = await supabaseAdmin
        .from("bookings")
        .insert([
          {
            id: bookingRecordId,
            property_id: propId,
            owner_id: ownerId,
            user_id: sanitizedUserId,
            booking_type: bType,
            user_name: name,
            user_email: email,
            user_phone: phone,
            booking_date: sDate,
            time_slot: slot,
            notes: notes ? String(notes).trim() : null,
            agreed_to_terms: true,
            status: "pending",
          },
        ]);

      if (!bkErr) dbPersisted = true;
    } catch (bkErr: any) {
      console.warn("[BookingAPI] Exception inserting into bookings:", bkErr.message);
    }

    // Prepare email data payload
    const emailPayload = {
      bookingId: agreementId || bookingRecordId,
      propertyTitle,
      propertyLocation,
      listingType: lType,
      propertyPrice,
      monthlyRent: finalRent,
      securityDeposit: finalDeposit,
      tokenAmount: finalToken,
      startDate: sDate,
      endDate: calculatedEndDate,
      duration: duration || "1 Year",
      bookingDate: sDate,
      timeSlot: slot,
      bookingType: bType,
      userName: name,
      userEmail: email,
      userPhone: phone,
      ownerName,
      ownerEmail,
      notes: notes ? String(notes).trim() : undefined,
    };

    // Dispatch dual verification emails (User + Owner)
    const [userEmailRes, ownerEmailRes] = await Promise.all([
      sendUserBookingConfirmation(emailPayload),
      sendOwnerBookingNotification(emailPayload),
    ]);

    const isRent = lType === "rent";
    const confirmationMsg = isRent
      ? "Your online rental booking has been registered! Verification emails have been sent to you and the property owner."
      : "Your online purchase reservation has been registered! Verification emails have been sent to you and the property owner.";

    return NextResponse.json(
      {
        success: true,
        message: confirmationMsg,
        booking: {
          id: agreementId || bookingRecordId,
          agreementId,
          propertyTitle,
          propertyLocation,
          listingType: lType,
          startDate: sDate,
          endDate: calculatedEndDate,
          duration: duration || "1 Year",
          monthlyRent: finalRent,
          securityDeposit: finalDeposit,
          tokenAmount: finalToken,
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
