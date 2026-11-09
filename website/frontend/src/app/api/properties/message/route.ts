import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { sendLandlordInquiryMessage } from "@/lib/email/email-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
      senderName,
      sender_name,
      senderEmail,
      sender_email,
      senderPhone,
      sender_phone,
      subject,
      message,
    } = body;

    const propId = propertyId || property_id;
    const name = (senderName || sender_name || "").trim();
    const email = (senderEmail || sender_email || "").trim().toLowerCase();
    const phone = (senderPhone || sender_phone || "").trim();
    const msg = (message || "").trim();
    const title = propertyTitle || property_title || "HavenKey Property Listing";
    const sub = (subject || "").trim();

    if (!name) {
      return NextResponse.json({ success: false, message: "Please provide your full name." }, { status: 400 });
    }
    if (!email || !EMAIL_REGEX.test(email)) {
      return NextResponse.json({ success: false, message: "Please provide a valid email address." }, { status: 400 });
    }
    if (!msg || msg.length < 5) {
      return NextResponse.json({ success: false, message: "Please write a message of at least 5 characters." }, { status: 400 });
    }

    let finalOwnerName = ownerName || owner_name || "Property Owner / Concierge";
    let finalOwnerEmail = ownerEmail || owner_email || "concierge@havenkey.pk";

    // If ownerEmail is generic or missing and propId exists, lookup owner in Supabase
    if (propId && (!ownerEmail || ownerEmail.includes("concierge@havenkey.pk"))) {
      try {
        const { data: propData } = await supabaseAdmin
          .from("properties")
          .select("owner_id, title")
          .eq("id", propId)
          .maybeSingle();

        if (propData?.owner_id) {
          const { data: userData } = await supabaseAdmin
            .from("users")
            .select("fullname, email")
            .eq("id", propData.owner_id)
            .maybeSingle();

          if (userData?.email) {
            finalOwnerName = userData.fullname || finalOwnerName;
            finalOwnerEmail = userData.email;
          }
        }
      } catch (lookupErr: any) {
        console.warn("[MessageAPI] Owner lookup warning:", lookupErr.message);
      }
    }

    // Dispatch email to owner
    const emailRes = await sendLandlordInquiryMessage({
      propertyId: propId || "havenkey-property",
      propertyTitle: title,
      ownerName: finalOwnerName,
      ownerEmail: finalOwnerEmail,
      senderName: name,
      senderEmail: email,
      senderPhone: phone || undefined,
      subject: sub || undefined,
      message: msg,
    });

    return NextResponse.json({
      success: true,
      message: `Your message has been delivered to ${finalOwnerName}! They have been notified via email.`,
      simulated: Boolean(emailRes.simulated),
    });
  } catch (err: any) {
    console.error("[MessageAPI] Exception handling message:", err);
    return NextResponse.json(
      { success: false, message: `Failed to send message: ${err.message || "Internal server error"}` },
      { status: 500 }
    );
  }
}
