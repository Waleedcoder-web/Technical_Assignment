import nodemailer from "nodemailer";

export interface BookingEmailData {
  bookingId: string;
  propertyId?: string;
  propertyTitle: string;
  propertyLocation: string;
  listingType?: "rent" | "sale" | string;
  propertyPrice?: number | string;
  monthlyRent?: number;
  securityDeposit?: number;
  tokenAmount?: number;
  startDate?: string;
  endDate?: string;
  duration?: string;
  bookingDate?: string;
  timeSlot?: string;
  bookingType: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  ownerName: string;
  ownerEmail: string;
  notes?: string;
}

function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  const secure = process.env.SMTP_SECURE === "true" || port === 465;

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });
}

const FROM_EMAIL =
  process.env.SMTP_FROM ||
  process.env.EMAIL_FROM ||
  `"HavenKey Concierge" <no-reply@havenkey.pk>`;

/**
 * Dispatches verification email to the user (tenant/buyer).
 */
export async function sendUserBookingConfirmation(data: BookingEmailData): Promise<{ success: boolean; simulated?: boolean }> {
  const transporter = getTransporter();

  const isRent = data.listingType === "rent" || data.bookingType === "rent_booking";
  const isSale = data.listingType === "sale" || data.bookingType === "sale_booking";

  let headerTitle = "Viewing Request Confirmation";
  let subHeader = "Your appointment has been registered and sent to the owner.";
  let badgeText = "Viewing Request Received";
  let subjectText = `[HavenKey] Viewing Confirmation: ${data.propertyTitle}`;

  if (isRent) {
    headerTitle = "Online Rental Booking Confirmation";
    subHeader = "Your digital tenancy lease reservation has been registered.";
    badgeText = "Rental Booking & Lease Agreement Pending";
    subjectText = `[HavenKey] Rental Booking Confirmation: ${data.propertyTitle}`;
  } else if (isSale) {
    headerTitle = "Online Purchase Reservation Confirmation";
    subHeader = "Your property purchase token reservation has been registered.";
    badgeText = "Purchase Token Reservation Pending";
    subjectText = `[HavenKey] Property Purchase Reservation: ${data.propertyTitle}`;
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const verifyYesUrl = `${baseUrl}/bookings/verify?id=${encodeURIComponent(data.bookingId)}&action=yes${data.propertyId ? `&propertyId=${encodeURIComponent(data.propertyId)}` : ""}`;
  const verifyNoUrl = `${baseUrl}/bookings/verify?id=${encodeURIComponent(data.bookingId)}&action=no${data.propertyId ? `&propertyId=${encodeURIComponent(data.propertyId)}` : ""}`;

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${headerTitle}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8f9fb; margin: 0; padding: 24px; color: #191c1e;">
  <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e7e8ea; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #076a64 0%, #001637 100%); padding: 32px 24px; text-align: center; color: #ffffff;">
      <h1 style="margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">HavenKey</h1>
      <p style="margin: 6px 0 0 0; font-size: 13px; color: #a1f1e9; letter-spacing: 0.5px;">${headerTitle.toUpperCase()}</p>
    </div>

    <!-- Body -->
    <div style="padding: 28px 24px;">
      <div style="background-color: #e6f7f6; border-left: 4px solid #076a64; padding: 12px 16px; border-radius: 4px; margin-bottom: 20px;">
        <p style="margin: 0; color: #076a64; font-weight: 600; font-size: 14px;">${badgeText}</p>
      </div>

      <p style="font-size: 14px; line-height: 1.5; color: #44474e;">
        Hello <strong>${data.userName}</strong>,
      </p>
      <p style="font-size: 14px; line-height: 1.5; color: #44474e;">
        ${subHeader}
      </p>

      <!-- Summary Box -->
      <div style="background: #f2f4f6; border-radius: 8px; padding: 18px; margin: 20px 0; border: 1px solid #e7e8ea;">
        <h3 style="margin: 0 0 12px 0; font-size: 14px; color: #001637; text-transform: uppercase; letter-spacing: 0.5px;">Booking &amp; Agreement Details</h3>
        
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <tr>
            <td style="padding: 6px 0; color: #75777f; width: 150px;">Reference ID:</td>
            <td style="padding: 6px 0; font-weight: 600; font-family: monospace; color: #001637;">#${data.bookingId.slice(0, 8)}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #75777f;">Property:</td>
            <td style="padding: 6px 0; font-weight: 600; color: #001637;">${data.propertyTitle}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #75777f;">Location:</td>
            <td style="padding: 6px 0; color: #191c1e;">${data.propertyLocation}</td>
          </tr>

          ${
            isRent
              ? `
          <tr>
            <td style="padding: 6px 0; color: #75777f;">Monthly Rent:</td>
            <td style="padding: 6px 0; font-weight: 600; color: #076a64;">PKR ${Number(data.monthlyRent || data.propertyPrice || 0).toLocaleString()} / mo</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #75777f;">Security Deposit:</td>
            <td style="padding: 6px 0; font-weight: 600; color: #001637;">PKR ${Number(data.securityDeposit || 0).toLocaleString()} (Escrow Protected)</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #75777f;">Move-in Date:</td>
            <td style="padding: 6px 0; font-weight: 600; color: #076a64;">${data.startDate || data.bookingDate}</td>
          </tr>
          ${
            data.duration
              ? `
          <tr>
            <td style="padding: 6px 0; color: #75777f;">Lease Duration:</td>
            <td style="padding: 6px 0; color: #191c1e;">${data.duration}</td>
          </tr>
          `
              : ""
          }
          `
              : isSale
              ? `
          <tr>
            <td style="padding: 6px 0; color: #75777f;">Property Price:</td>
            <td style="padding: 6px 0; font-weight: 600; color: #076a64;">PKR ${Number(data.propertyPrice || 0).toLocaleString()}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #75777f;">Token Reservation:</td>
            <td style="padding: 6px 0; font-weight: 600; color: #001637;">PKR ${Number(data.tokenAmount || data.securityDeposit || 0).toLocaleString()} (Escrow Held)</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #75777f;">Target Closing Date:</td>
            <td style="padding: 6px 0; font-weight: 600; color: #076a64;">${data.startDate || data.bookingDate}</td>
          </tr>
          `
              : `
          <tr>
            <td style="padding: 6px 0; color: #75777f;">Viewing Date:</td>
            <td style="padding: 6px 0; font-weight: 600; color: #076a64;">${data.bookingDate}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #75777f;">Time Slot:</td>
            <td style="padding: 6px 0; font-weight: 600; color: #076a64;">${data.timeSlot}</td>
          </tr>
          `
          }

          <tr>
            <td style="padding: 6px 0; color: #75777f;">Property Owner:</td>
            <td style="padding: 6px 0; color: #191c1e;">${data.ownerName} (${data.ownerEmail})</td>
          </tr>
        </table>
      </div>

      <!-- User Yes / No Verification Action Block -->
      <div style="background: #ffffff; border: 2px solid #076a64; border-radius: 10px; padding: 22px 20px; margin: 24px 0; text-align: center; box-shadow: 0 4px 12px rgba(7, 106, 100, 0.08);">
        <h4 style="margin: 0 0 8px 0; color: #001637; font-size: 16px; font-weight: 700;">Action Required: Do You Confirm This Booking?</h4>
        <p style="margin: 0 0 16px 0; font-size: 13px; color: #44474e; line-height: 1.5;">
          This property is currently held and <strong>Reserved For You</strong>. Please submit your answer below to verify or cancel your reservation:
        </p>
        
        <table style="margin: 0 auto; border-collapse: separate; border-spacing: 12px 0;">
          <tr>
            <td>
              <a href="${verifyYesUrl}" style="display: inline-block; background-color: #076a64; color: #ffffff; font-weight: 700; font-size: 13px; text-decoration: none; padding: 12px 24px; border-radius: 6px; box-shadow: 0 2px 4px rgba(7, 106, 100, 0.2);">
                &#x2714; YES &mdash; Confirm Booking
              </a>
            </td>
            <td>
              <a href="${verifyNoUrl}" style="display: inline-block; background-color: #ba1a1a; color: #ffffff; font-weight: 700; font-size: 13px; text-decoration: none; padding: 12px 24px; border-radius: 6px; box-shadow: 0 2px 4px rgba(186, 26, 26, 0.2);">
                &#x2716; NO &mdash; Cancel Booking
              </a>
            </td>
          </tr>
        </table>

        <p style="margin: 14px 0 0 0; font-size: 11px; color: #75777f; line-height: 1.4;">
          <strong>Selecting YES:</strong> Verifies your booking and activates your digital agreement.<br />
          <strong>Selecting NO:</strong> Cancels this booking and automatically releases the property back to <em>Available</em>.
        </p>
      </div>

      <p style="font-size: 12px; color: #75777f; line-height: 1.5;">
        <strong>HavenKey Tenancy &amp; Escrow Guarantee:</strong> All rental security deposits and token reservations on HavenKey are held securely in our digital escrow until lease signing or verification inspection.
      </p>
    </div>

    <!-- Footer -->
    <div style="background: #f2f4f6; padding: 16px 24px; text-align: center; font-size: 11px; color: #75777f; border-top: 1px solid #e7e8ea;">
      &copy; 2026 HavenKey Real Estate Management Platform. Pakistan's Premier Biometric Real Estate Ecosystem.
    </div>
  </div>
</body>
</html>
`;

  if (!transporter) {
    console.log(`[EmailService] (SIMULATED USER EMAIL) To: ${data.userEmail} | Subject: ${subjectText}`);
    return { success: true, simulated: true };
  }

  try {
    await transporter.sendMail({
      from: FROM_EMAIL,
      to: data.userEmail,
      subject: subjectText,
      html: htmlContent,
    });
    return { success: true };
  } catch (err: any) {
    console.error("[EmailService] Failed to send user email:", err.message);
    return { success: false };
  }
}

/**
 * Dispatches notification email to the property owner / landlord.
 */
export async function sendOwnerBookingNotification(data: BookingEmailData): Promise<{ success: boolean; simulated?: boolean }> {
  const transporter = getTransporter();

  const isRent = data.listingType === "rent" || data.bookingType === "rent_booking";
  const isSale = data.listingType === "sale" || data.bookingType === "sale_booking";

  let headerTitle = "New Viewing Appointment";
  let badgeTitle = "Action Required: New Viewing Scheduled";
  let subjectText = `[HavenKey Alert] New Viewing Request: ${data.propertyTitle}`;

  if (isRent) {
    headerTitle = "New Rental Booking Received";
    badgeTitle = "Action Required: New Digital Tenancy Booking";
    subjectText = `[HavenKey Alert] New Rental Booking: ${data.propertyTitle}`;
  } else if (isSale) {
    headerTitle = "New Property Purchase Booking";
    badgeTitle = "Action Required: New Purchase Token Reservation";
    subjectText = `[HavenKey Alert] New Property Purchase Booking: ${data.propertyTitle}`;
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const ownerVerifyYesUrl = `${baseUrl}/bookings/verify?id=${encodeURIComponent(data.bookingId)}&action=yes&role=owner${data.propertyId ? `&propertyId=${encodeURIComponent(data.propertyId)}` : ""}`;
  const ownerVerifyNoUrl = `${baseUrl}/bookings/verify?id=${encodeURIComponent(data.bookingId)}&action=no&role=owner${data.propertyId ? `&propertyId=${encodeURIComponent(data.propertyId)}` : ""}`;

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${headerTitle}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8f9fb; margin: 0; padding: 24px; color: #191c1e;">
  <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e7e8ea; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #001637 0%, #076a64 100%); padding: 32px 24px; text-align: center; color: #ffffff;">
      <h1 style="margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">HavenKey</h1>
      <p style="margin: 6px 0 0 0; font-size: 13px; color: #a1f1e9; letter-spacing: 0.5px;">${headerTitle.toUpperCase()}</p>
    </div>

    <!-- Body -->
    <div style="padding: 28px 24px;">
      <div style="background-color: #eaf1fb; border-left: 4px solid #001637; padding: 12px 16px; border-radius: 4px; margin-bottom: 20px;">
        <p style="margin: 0; color: #001637; font-weight: 600; font-size: 14px;">${badgeTitle}</p>
      </div>

      <p style="font-size: 14px; line-height: 1.5; color: #44474e;">
        Hello <strong>${data.ownerName}</strong>,
      </p>
      <p style="font-size: 14px; line-height: 1.5; color: #44474e;">
        A verified user has submitted an online booking for your property <strong>${data.propertyTitle}</strong>.
      </p>

      <!-- Tenant / Buyer Info Box -->
      <div style="background: #f2f4f6; border-radius: 8px; padding: 18px; margin: 20px 0; border: 1px solid #e7e8ea;">
        <h3 style="margin: 0 0 12px 0; font-size: 14px; color: #001637; text-transform: uppercase; letter-spacing: 0.5px;">Applicant Information</h3>
        
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <tr>
            <td style="padding: 6px 0; color: #75777f; width: 140px;">Applicant Name:</td>
            <td style="padding: 6px 0; font-weight: 600; color: #001637;">${data.userName}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #75777f;">Email Address:</td>
            <td style="padding: 6px 0; color: #076a64; font-weight: 500;">
              <a href="mailto:${data.userEmail}" style="color: #076a64; text-decoration: none;">${data.userEmail}</a>
            </td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #75777f;">Phone / WhatsApp:</td>
            <td style="padding: 6px 0; font-weight: 600; color: #001637;">${data.userPhone}</td>
          </tr>

          ${
            isRent
              ? `
          <tr>
            <td style="padding: 6px 0; color: #75777f;">Proposed Rent:</td>
            <td style="padding: 6px 0; font-weight: 600; color: #076a64;">PKR ${Number(data.monthlyRent || data.propertyPrice || 0).toLocaleString()} / mo</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #75777f;">Security Deposit:</td>
            <td style="padding: 6px 0; font-weight: 600; color: #001637;">PKR ${Number(data.securityDeposit || 0).toLocaleString()}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #75777f;">Move-in Date:</td>
            <td style="padding: 6px 0; font-weight: 600; color: #076a64;">${data.startDate || data.bookingDate}</td>
          </tr>
          `
              : isSale
              ? `
          <tr>
            <td style="padding: 6px 0; color: #75777f;">Purchase Price:</td>
            <td style="padding: 6px 0; font-weight: 600; color: #076a64;">PKR ${Number(data.propertyPrice || 0).toLocaleString()}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #75777f;">Token Deposit:</td>
            <td style="padding: 6px 0; font-weight: 600; color: #001637;">PKR ${Number(data.tokenAmount || data.securityDeposit || 0).toLocaleString()}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #75777f;">Closing Date:</td>
            <td style="padding: 6px 0; font-weight: 600; color: #076a64;">${data.startDate || data.bookingDate}</td>
          </tr>
          `
              : `
          <tr>
            <td style="padding: 6px 0; color: #75777f;">Requested Slot:</td>
            <td style="padding: 6px 0; font-weight: 600; color: #076a64;">${data.bookingDate} (${data.timeSlot})</td>
          </tr>
          `
          }

          ${
            data.notes
              ? `
          <tr>
            <td style="padding: 6px 0; color: #75777f; vertical-align: top;">Applicant Notes:</td>
            <td style="padding: 6px 0; color: #191c1e; font-style: italic;">"${data.notes}"</td>
          </tr>
          `
              : ""
          }
        </table>
      </div>

      <!-- Property Status & Verification Notice -->
      <div style="background-color: #fcf1e5; border-left: 4px solid #ba1a1a; padding: 12px 16px; border-radius: 4px; margin: 18px 0;">
        <p style="margin: 0; color: #852a00; font-size: 13px; font-weight: 600;">
          Listing Status: Marked as <em>Not Available</em> (Booked)
        </p>
        <p style="margin: 4px 0 0 0; color: #53433a; font-size: 12px; line-height: 1.4;">
          The property is now reserved. Both applicant and owner can confirm with <strong>YES</strong> or cancel with <strong>NO</strong>.
        </p>
      </div>

      <!-- Landlord Direct Action Block -->
      <div style="background: #ffffff; border: 2px solid #001637; border-radius: 10px; padding: 20px; margin: 20px 0; text-align: center; box-shadow: 0 4px 12px rgba(0, 22, 55, 0.08);">
        <h4 style="margin: 0 0 8px 0; color: #001637; font-size: 15px; font-weight: 700;">Landlord Direct Action: Confirm or Release Listing</h4>
        <p style="margin: 0 0 14px 0; font-size: 12px; color: #44474e; line-height: 1.5;">
          Confirm this booking to finalize tenancy, or decline to release the listing immediately back to available:
        </p>
        
        <table style="margin: 0 auto; border-collapse: separate; border-spacing: 12px 0;">
          <tr>
            <td>
              <a href="${ownerVerifyYesUrl}" style="display: inline-block; background-color: #076a64; color: #ffffff; font-weight: 700; font-size: 13px; text-decoration: none; padding: 11px 22px; border-radius: 6px;">
                &#x2714; YES &mdash; Accept Booking
              </a>
            </td>
            <td>
              <a href="${ownerVerifyNoUrl}" style="display: inline-block; background-color: #ba1a1a; color: #ffffff; font-weight: 700; font-size: 13px; text-decoration: none; padding: 11px 22px; border-radius: 6px;">
                &#x2716; NO &mdash; Decline Booking
              </a>
            </td>
          </tr>
        </table>
      </div>

      <p style="font-size: 13px; color: #44474e; line-height: 1.5;">
        You can connect directly with the applicant via phone or WhatsApp above, or review the booking in your HavenKey Landlord Dashboard.
      </p>
    </div>

    <!-- Footer -->
    <div style="background: #f2f4f6; padding: 16px 24px; text-align: center; font-size: 11px; color: #75777f; border-top: 1px solid #e7e8ea;">
      &copy; 2026 HavenKey Real Estate Management Platform. Pakistan's Premier Biometric Real Estate Ecosystem.
    </div>
  </div>
</body>
</html>
`;

  if (!transporter) {
    console.log(`[EmailService] (SIMULATED OWNER EMAIL) To: ${data.ownerEmail} | Subject: ${subjectText}`);
    return { success: true, simulated: true };
  }

  try {
    await transporter.sendMail({
      from: FROM_EMAIL,
      to: data.ownerEmail,
      subject: subjectText,
      html: htmlContent,
    });
    return { success: true };
  } catch (err: any) {
    console.error("[EmailService] Failed to send owner email:", err.message);
    return { success: false };
  }
}

export interface BookingStatusEmailData {
  bookingId: string;
  action: "yes" | "no";
  propertyTitle: string;
  propertyLocation?: string;
  userName: string;
  userEmail: string;
  ownerName: string;
  ownerEmail: string;
  propertyPrice?: number | string;
  monthlyRent?: number;
  startDate?: string;
  actorRole?: string;
}

/**
 * Dispatches confirmation emails after a YES or NO decision has been submitted.
 * Notifies both the User and Property Owner of the official confirmed or cancelled status.
 */
export async function sendBookingStatusConfirmationEmail(
  data: BookingStatusEmailData
): Promise<{ success: boolean; simulated?: boolean }> {
  const transporter = getTransporter();
  const isYes = data.action === "yes";

  const userSubject = isYes
    ? `[HavenKey Confirmed] Your Booking is Verified: ${data.propertyTitle}`
    : `[HavenKey Notice] Booking Cancelled: ${data.propertyTitle}`;

  const ownerSubject = isYes
    ? `[HavenKey Confirmed] Booking Verified & Confirmed for ${data.propertyTitle}`
    : `[HavenKey Notice] Booking Cancelled: ${data.propertyTitle}`;

  const userHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${isYes ? "Booking Confirmed" : "Booking Cancelled"}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8f9fb; margin: 0; padding: 24px; color: #191c1e;">
  <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e7e8ea; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
    <div style="background: linear-gradient(135deg, ${isYes ? "#076a64 0%, #001637 100%" : "#ba1a1a 0%, #201a1a 100%"}); padding: 32px 24px; text-align: center; color: #ffffff;">
      <h1 style="margin: 0; font-size: 24px; font-weight: 700;">HavenKey</h1>
      <p style="margin: 6px 0 0 0; font-size: 13px; color: #ffffff; letter-spacing: 0.5px;">
        ${isYes ? "BOOKING OFFICIALLY CONFIRMED &bull; ANSWER: YES" : "BOOKING CANCELLED &bull; ANSWER: NO"}
      </p>
    </div>
    <div style="padding: 28px 24px;">
      <div style="background-color: ${isYes ? "#e6f7f6" : "#fce8e6"}; border-left: 4px solid ${isYes ? "#076a64" : "#ba1a1a"}; padding: 12px 16px; border-radius: 4px; margin-bottom: 20px;">
        <p style="margin: 0; color: ${isYes ? "#076a64" : "#ba1a1a"}; font-weight: 600; font-size: 14px;">
          ${isYes ? "Booking Status: CONFIRMED &amp; RESERVED" : "Booking Status: CANCELLED"}
        </p>
      </div>
      <p style="font-size: 14px; line-height: 1.5; color: #44474e;">
        Hello <strong>${data.userName}</strong>,
      </p>
      <p style="font-size: 14px; line-height: 1.5; color: #44474e;">
        ${
          isYes
            ? `Your booking for <strong>${data.propertyTitle}</strong> has been officially confirmed via email verification. The property is officially <strong>Reserved For You</strong> and your tenancy reservation is secured.`
            : `Your booking for <strong>${data.propertyTitle}</strong> has been cancelled as requested. The property status has been released back to <strong>Available</strong>.`
        }
      </p>
      <div style="background: #f2f4f6; border-radius: 8px; padding: 16px; margin: 20px 0; border: 1px solid #e7e8ea; font-size: 13px;">
        <p style="margin: 0 0 8px 0; font-weight: 600; color: #001637;">Booking Summary</p>
        <p style="margin: 4px 0; color: #75777f;">Reference: <strong style="color: #001637;">#${data.bookingId.slice(0, 8)}</strong></p>
        <p style="margin: 4px 0; color: #75777f;">Property: <strong style="color: #001637;">${data.propertyTitle}</strong></p>
        <p style="margin: 4px 0; color: #75777f;">Status: <strong style="color: ${isYes ? "#076a64" : "#ba1a1a"};">${isYes ? "Confirmed (Active Agreement)" : "Cancelled (Property Released)"}</strong></p>
      </div>
    </div>
    <div style="background: #f2f4f6; padding: 16px 24px; text-align: center; font-size: 11px; color: #75777f; border-top: 1px solid #e7e8ea;">
      &copy; 2026 HavenKey Real Estate Management Platform.
    </div>
  </div>
</body>
</html>
`;

  const ownerHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${isYes ? "Booking Confirmed" : "Booking Cancelled"}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8f9fb; margin: 0; padding: 24px; color: #191c1e;">
  <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e7e8ea; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
    <div style="background: linear-gradient(135deg, ${isYes ? "#001637 0%, #076a64 100%" : "#3c0000 0%, #ba1a1a 100%"}); padding: 32px 24px; text-align: center; color: #ffffff;">
      <h1 style="margin: 0; font-size: 24px; font-weight: 700;">HavenKey Landlord Alert</h1>
      <p style="margin: 6px 0 0 0; font-size: 13px; color: #ffffff; letter-spacing: 0.5px;">
        ${isYes ? "BOOKING CONFIRMED &bull; ANSWER: YES" : "BOOKING CANCELLED &bull; ANSWER: NO"}
      </p>
    </div>
    <div style="padding: 28px 24px;">
      <p style="font-size: 14px; line-height: 1.5; color: #44474e;">
        Hello <strong>${data.ownerName}</strong>,
      </p>
      <p style="font-size: 14px; line-height: 1.5; color: #44474e;">
        ${
          isYes
            ? `The booking for your property <strong>${data.propertyTitle}</strong> by applicant <strong>${data.userName}</strong> (${data.userEmail}) has been confirmed (Answer: YES). The property remains <strong>Not Available</strong>.`
            : `The booking for your property <strong>${data.propertyTitle}</strong> has been cancelled (Answer: NO). The property status has automatically been reverted to <strong>Available</strong> for new inquiries.`
        }
      </p>
      <div style="background: #f2f4f6; border-radius: 8px; padding: 16px; margin: 20px 0; border: 1px solid #e7e8ea; font-size: 13px;">
        <p style="margin: 4px 0; color: #75777f;">Reference: <strong style="color: #001637;">#${data.bookingId.slice(0, 8)}</strong></p>
        <p style="margin: 4px 0; color: #75777f;">Property: <strong style="color: #001637;">${data.propertyTitle}</strong></p>
        <p style="margin: 4px 0; color: #75777f;">Applicant: <strong style="color: #001637;">${data.userName} (${data.userEmail})</strong></p>
        <p style="margin: 4px 0; color: #75777f;">Current Status: <strong style="color: ${isYes ? "#076a64" : "#ba1a1a"};">${isYes ? "CONFIRMED" : "CANCELLED"}</strong></p>
      </div>
    </div>
    <div style="background: #f2f4f6; padding: 16px 24px; text-align: center; font-size: 11px; color: #75777f; border-top: 1px solid #e7e8ea;">
      &copy; 2026 HavenKey Real Estate Management Platform.
    </div>
  </div>
</body>
</html>
`;

  if (!transporter) {
    console.log(`[EmailService] (SIMULATED STATUS CONFIRMATION) To: ${data.userEmail} & ${data.ownerEmail} | Action: ${data.action.toUpperCase()}`);
    return { success: true, simulated: true };
  }

    try {
      await Promise.all([
        transporter.sendMail({
          from: FROM_EMAIL,
          to: data.userEmail,
          subject: userSubject,
          html: userHtml,
        }),
        transporter.sendMail({
          from: FROM_EMAIL,
          to: data.ownerEmail,
          subject: ownerSubject,
          html: ownerHtml,
        }),
      ]);
      return { success: true };
    } catch (err: any) {
      console.error("[EmailService] Failed to send status confirmation emails:", err.message);
      return { success: false };
    }
  }

export interface OwnerInquiryMessageData {
  propertyId: string;
  propertyTitle: string;
  ownerName: string;
  ownerEmail: string;
  senderName: string;
  senderEmail: string;
  senderPhone?: string;
  subject?: string;
  message: string;
}

/**
 * Dispatches direct applicant inquiry message to the property owner.
 */
export async function sendLandlordInquiryMessage(
  data: OwnerInquiryMessageData
): Promise<{ success: boolean; simulated?: boolean }> {
  const transporter = getTransporter();
  const subjectText = `[HavenKey Message] New inquiry from ${data.senderName} regarding ${data.propertyTitle}`;

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>New Message From Verified Applicant</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8f9fb; margin: 0; padding: 24px; color: #191c1e;">
  <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e7e8ea; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #076a64 0%, #001637 100%); padding: 32px 24px; text-align: center; color: #ffffff;">
      <h1 style="margin: 0; font-size: 24px; font-weight: 700;">HavenKey</h1>
      <p style="margin: 6px 0 0 0; font-size: 13px; color: #a1f1e9; letter-spacing: 0.5px;">DIRECT APPLICANT MESSAGE</p>
    </div>

    <!-- Body -->
    <div style="padding: 28px 24px;">
      <div style="background-color: #e6f7f6; border-left: 4px solid #076a64; padding: 12px 16px; border-radius: 4px; margin-bottom: 20px;">
        <p style="margin: 0; color: #076a64; font-weight: 600; font-size: 14px;">
          New message received regarding: <strong>${data.propertyTitle}</strong>
        </p>
      </div>

      <p style="font-size: 14px; line-height: 1.5; color: #44474e;">
        Hello <strong>${data.ownerName}</strong>,
      </p>
      <p style="font-size: 14px; line-height: 1.5; color: #44474e;">
        A verified applicant has sent you a direct message via HavenKey regarding your property listing.
      </p>

      <!-- Sender Details Box -->
      <div style="background: #f2f4f6; border-radius: 8px; padding: 16px; margin: 18px 0; border: 1px solid #e7e8ea; font-size: 13px;">
        <p style="margin: 3px 0; color: #75777f;">Sender Name: <strong style="color: #001637;">${data.senderName}</strong></p>
        <p style="margin: 3px 0; color: #75777f;">Email: <strong style="color: #076a64;">${data.senderEmail}</strong></p>
        ${data.senderPhone ? `<p style="margin: 3px 0; color: #75777f;">Phone / WhatsApp: <strong style="color: #001637;">${data.senderPhone}</strong></p>` : ""}
        ${data.subject ? `<p style="margin: 3px 0; color: #75777f;">Subject: <strong style="color: #001637;">${data.subject}</strong></p>` : ""}
      </div>

      <!-- Message Content Box -->
      <div style="background: #ffffff; border-left: 4px solid #001637; padding: 16px 20px; margin: 20px 0; border-radius: 0 8px 8px 0; box-shadow: 0 2px 6px rgba(0,0,0,0.04); font-size: 14px; line-height: 1.6; color: #191c1e;">
        <p style="margin: 0 0 6px 0; font-size: 11px; text-transform: uppercase; color: #75777f; font-weight: 700; letter-spacing: 0.5px;">Message Content:</p>
        <div style="font-style: italic; white-space: pre-line;">"${data.message}"</div>
      </div>

      <!-- Direct Contact CTA -->
      <div style="text-align: center; margin: 26px 0 10px 0;">
        <a href="mailto:${data.senderEmail}?subject=Re: Inquiry regarding ${encodeURIComponent(data.propertyTitle)}" style="display: inline-block; background-color: #076a64; color: #ffffff; font-weight: 700; font-size: 13px; text-decoration: none; padding: 12px 24px; border-radius: 6px; margin-right: 8px;">
          Reply to Applicant
        </a>
        ${
          data.senderPhone
            ? `<a href="https://wa.me/${data.senderPhone.replace(/[^0-9]/g, "")}" style="display: inline-block; background-color: #001637; color: #ffffff; font-weight: 700; font-size: 13px; text-decoration: none; padding: 12px 24px; border-radius: 6px;">
                Chat on WhatsApp
              </a>`
            : ""
        }
      </div>
    </div>

    <!-- Footer -->
    <div style="background: #f2f4f6; padding: 16px 24px; text-align: center; font-size: 11px; color: #75777f; border-top: 1px solid #e7e8ea;">
      &copy; 2026 HavenKey Real Estate Management Platform.
    </div>
  </div>
</body>
</html>
`;

  if (!transporter) {
    console.log(`[EmailService] (SIMULATED INQUIRY MESSAGE) To: ${data.ownerEmail} | From: ${data.senderName} (${data.senderEmail})`);
    return { success: true, simulated: true };
  }

  try {
    await transporter.sendMail({
      from: FROM_EMAIL,
      to: data.ownerEmail,
      replyTo: data.senderEmail,
      subject: subjectText,
      html: htmlContent,
    });
    return { success: true };
  } catch (err: any) {
    console.error("[EmailService] Failed to send landlord inquiry email:", err.message);
    return { success: false };
  }
}

export interface OwnerComplaintEmailData {
  complaintId: string;
  propertyId: string;
  propertyTitle: string;
  ownerName: string;
  ownerEmail: string;
  userName: string;
  userEmail: string;
  userPhone?: string;
  category?: string;
  title: string;
  description: string;
}

/**
 * Dispatches complaint / maintenance notification to property owner and confirmation to tenant.
 */
export async function sendOwnerComplaintEmail(
  data: OwnerComplaintEmailData
): Promise<{ success: boolean; simulated?: boolean }> {
  const transporter = getTransporter();
  const refCode = data.complaintId.slice(0, 8);
  const categoryLabel = (data.category || "General / Maintenance").toUpperCase();

  const ownerSubject = `[URGENT: Complaint Ticket #${refCode}] ${data.title} - ${data.propertyTitle}`;
  const userSubject = `[Complaint Registered #${refCode}] Your report for ${data.propertyTitle} has been submitted`;

  const ownerHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>New Tenant Complaint / Maintenance Request</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8f9fb; margin: 0; padding: 24px; color: #191c1e;">
  <div style="max-width: 620px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e7e8ea; overflow: hidden; box-shadow: 0 4px 14px rgba(0,0,0,0.06);">
    
    <!-- Urgent Alert Header -->
    <div style="background: linear-gradient(135deg, #ba1a1a 0%, #001637 100%); padding: 30px 24px; text-align: center; color: #ffffff;">
      <h1 style="margin: 0; font-size: 24px; font-weight: 700;">HavenKey</h1>
      <p style="margin: 6px 0 0 0; font-size: 13px; color: #ffdad6; letter-spacing: 0.5px; font-weight: 600;">
        TENANT COMPLAINT &amp; MAINTENANCE ALERT
      </p>
    </div>

    <!-- Main Content -->
    <div style="padding: 28px 24px;">
      <div style="background-color: #ffdad6; border-left: 4px solid #ba1a1a; padding: 12px 16px; border-radius: 4px; margin-bottom: 20px;">
        <p style="margin: 0; color: #93000a; font-weight: 700; font-size: 13px;">
          ACTION REQUIRED: A resident has filed a complaint ticket for your review.
        </p>
      </div>

      <p style="font-size: 14px; line-height: 1.5; color: #44474e;">
        Hello <strong>${data.ownerName}</strong>,
      </p>
      <p style="font-size: 14px; line-height: 1.5; color: #44474e;">
        A formal complaint / maintenance request has been submitted for your property: <strong>${data.propertyTitle}</strong>.
      </p>

      <!-- Complaint Info Box -->
      <div style="background: #f2f4f6; border-radius: 8px; padding: 16px; margin: 18px 0; border: 1px solid #e7e8ea; font-size: 13px;">
        <p style="margin: 4px 0; color: #75777f;">Ticket Reference: <strong style="color: #001637; font-family: monospace;">#${refCode}</strong></p>
        <p style="margin: 4px 0; color: #75777f;">Property: <strong style="color: #001637;">${data.propertyTitle}</strong></p>
        <p style="margin: 4px 0; color: #75777f;">Category: <span style="background: #e7e8ea; padding: 2px 8px; border-radius: 4px; font-weight: 700; color: #ba1a1a;">${categoryLabel}</span></p>
        <p style="margin: 4px 0; color: #75777f;">Status: <strong style="color: #ba1a1a;">PENDING REVIEW</strong></p>
        <p style="margin: 4px 0; color: #75777f;">Submitted By: <strong style="color: #001637;">${data.userName}</strong> (${data.userEmail})</p>
        ${data.userPhone ? `<p style="margin: 4px 0; color: #75777f;">Phone / WhatsApp: <strong style="color: #001637;">${data.userPhone}</strong></p>` : ""}
      </div>

      <!-- Complaint Subject & Details -->
      <div style="background: #ffffff; border-left: 4px solid #ba1a1a; padding: 16px 20px; margin: 20px 0; border-radius: 0 8px 8px 0; box-shadow: 0 2px 6px rgba(0,0,0,0.04); font-size: 14px; line-height: 1.6; color: #191c1e; border-top: 1px solid #f2f4f6; border-right: 1px solid #f2f4f6; border-bottom: 1px solid #f2f4f6;">
        <p style="margin: 0 0 6px 0; font-size: 12px; text-transform: uppercase; color: #ba1a1a; font-weight: 800; letter-spacing: 0.5px;">
          Subject: ${data.title}
        </p>
        <div style="white-space: pre-line; color: #44474e; font-size: 13px;">${data.description}</div>
      </div>

      <!-- Action Buttons -->
      <div style="text-align: center; margin: 26px 0 10px 0;">
        <a href="mailto:${data.userEmail}?subject=Re: Complaint Ticket #${refCode} - ${encodeURIComponent(data.title)}" style="display: inline-block; background-color: #076a64; color: #ffffff; font-weight: 700; font-size: 13px; text-decoration: none; padding: 12px 24px; border-radius: 6px; margin-right: 8px;">
          Reply to Tenant
        </a>
        ${
          data.userPhone
            ? `<a href="https://wa.me/${data.userPhone.replace(/[^0-9]/g, "")}" style="display: inline-block; background-color: #001637; color: #ffffff; font-weight: 700; font-size: 13px; text-decoration: none; padding: 12px 24px; border-radius: 6px;">
                Chat on WhatsApp
              </a>`
            : ""
        }
      </div>
    </div>

    <!-- Footer -->
    <div style="background: #f2f4f6; padding: 16px 24px; text-align: center; font-size: 11px; color: #75777f; border-top: 1px solid #e7e8ea;">
      &copy; 2026 HavenKey Real Estate Management Platform &bull; Automated Complaint Dispatch
    </div>
  </div>
</body>
</html>
`;

  const userHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Complaint Ticket Registered</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8f9fb; margin: 0; padding: 24px; color: #191c1e;">
  <div style="max-width: 620px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e7e8ea; overflow: hidden; box-shadow: 0 4px 14px rgba(0,0,0,0.06);">
    <div style="background: linear-gradient(135deg, #076a64 0%, #001637 100%); padding: 30px 24px; text-align: center; color: #ffffff;">
      <h1 style="margin: 0; font-size: 24px; font-weight: 700;">HavenKey</h1>
      <p style="margin: 6px 0 0 0; font-size: 13px; color: #a1f1e9; letter-spacing: 0.5px;">COMPLAINT DISPATCH CONFIRMATION</p>
    </div>

    <div style="padding: 28px 24px;">
      <p style="font-size: 14px; line-height: 1.5; color: #44474e;">
        Hello <strong>${data.userName}</strong>,
      </p>
      <p style="font-size: 14px; line-height: 1.5; color: #44474e;">
        Your complaint ticket has been recorded and delivered directly to the property owner (<strong>${data.ownerName}</strong>).
      </p>

      <div style="background: #f2f4f6; border-radius: 8px; padding: 16px; margin: 18px 0; border: 1px solid #e7e8ea; font-size: 13px;">
        <p style="margin: 4px 0; color: #75777f;">Ticket Reference: <strong style="color: #001637; font-family: monospace;">#${refCode}</strong></p>
        <p style="margin: 4px 0; color: #75777f;">Property: <strong style="color: #001637;">${data.propertyTitle}</strong></p>
        <p style="margin: 4px 0; color: #75777f;">Category: <strong>${categoryLabel}</strong></p>
        <p style="margin: 4px 0; color: #75777f;">Subject: <strong>${data.title}</strong></p>
        <p style="margin: 4px 0; color: #75777f;">Status: <strong style="color: #076a64;">Pending Landlord Action</strong></p>
      </div>

      <p style="font-size: 13px; line-height: 1.5; color: #75777f;">
        The landlord has been notified via their registered email. You will receive an update once the owner or facility team responds.
      </p>
    </div>

    <div style="background: #f2f4f6; padding: 16px 24px; text-align: center; font-size: 11px; color: #75777f; border-top: 1px solid #e7e8ea;">
      &copy; 2026 HavenKey Real Estate Management Platform.
    </div>
  </div>
</body>
</html>
`;

  if (!transporter) {
    console.log(`[EmailService] (SIMULATED COMPLAINT EMAIL) To: ${data.ownerEmail} & ${data.userEmail} | Ticket #${refCode}`);
    return { success: true, simulated: true };
  }

  try {
    await Promise.all([
      transporter.sendMail({
        from: FROM_EMAIL,
        to: data.ownerEmail,
        replyTo: data.userEmail,
        subject: ownerSubject,
        html: ownerHtml,
      }),
      transporter.sendMail({
        from: FROM_EMAIL,
        to: data.userEmail,
        subject: userSubject,
        html: userHtml,
      }),
    ]);
    return { success: true };
  } catch (err: any) {
    console.error("[EmailService] Failed to send complaint emails:", err.message);
    return { success: false };
  }
}

export interface PropertyUnreservedEmailData {
  propertyId: string;
  propertyTitle: string;
  ownerName: string;
  ownerEmail: string;
  userName: string;
  userEmail: string;
  userPhone?: string;
  reason?: string;
  departureDate?: string;
  isAutomatic?: boolean;
}

/**
 * Dispatches notification emails when a property is unreserved / vacated (manual departure or auto lease expiry).
 */
export async function sendPropertyUnreservedNotificationEmail(
  data: PropertyUnreservedEmailData
): Promise<{ success: boolean; simulated?: boolean }> {
  const transporter = getTransporter();
  const dateStr =
    data.departureDate ||
    new Date().toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  const isAuto = Boolean(data.isAutomatic);
  const headline = isAuto
    ? "Lease Term Expired — Property Automatically Unreserved"
    : "Notice of Tenant Departure & Property Unreserved";
  const defaultReason = isAuto
    ? "Scheduled tenancy duration (e.g. 6 months) has concluded. Property automatically returned to available inventory."
    : "Tenant initiated early departure / unreservation of the property.";

  const ownerSubject = `[HavenKey] ${headline}: ${data.propertyTitle}`;
  const userSubject = `[HavenKey] Departure Completed: ${data.propertyTitle} is now Unreserved`;

  const ownerHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${headline}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8f9fb; margin: 0; padding: 24px; color: #191c1e;">
  <div style="max-width: 620px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e7e8ea; overflow: hidden; box-shadow: 0 4px 14px rgba(0,0,0,0.06);">
    <div style="background: linear-gradient(135deg, #076a64 0%, #001637 100%); padding: 30px 24px; text-align: center; color: #ffffff;">
      <h1 style="margin: 0; font-size: 24px; font-weight: 700;">HavenKey</h1>
      <p style="margin: 6px 0 0 0; font-size: 13px; color: #a1f1e9; letter-spacing: 0.5px; font-weight: 600;">
        PROPERTY DEPARTURE &amp; UNRESERVE NOTICE
      </p>
    </div>

    <div style="padding: 28px 24px;">
      <div style="background-color: #e6f7f6; border-left: 4px solid #076a64; padding: 12px 16px; border-radius: 4px; margin-bottom: 20px;">
        <p style="margin: 0; color: #076a64; font-weight: 700; font-size: 13px;">
          LISTING STATUS UPDATED: Property is now AVAILABLE for new bookings.
        </p>
      </div>

      <p style="font-size: 14px; line-height: 1.5; color: #44474e;">
        Hello <strong>${data.ownerName}</strong>,
      </p>
      <p style="font-size: 14px; line-height: 1.5; color: #44474e;">
        Please be informed that <strong>${data.propertyTitle}</strong> has been unreserved and the departure process has been recorded.
      </p>

      <div style="background: #f2f4f6; border-radius: 8px; padding: 16px; margin: 18px 0; border: 1px solid #e7e8ea; font-size: 13px;">
        <p style="margin: 4px 0; color: #75777f;">Property: <strong style="color: #001637;">${data.propertyTitle}</strong></p>
        <p style="margin: 4px 0; color: #75777f;">Departure Date: <strong style="color: #001637;">${dateStr}</strong></p>
        <p style="margin: 4px 0; color: #75777f;">New Inventory Status: <strong style="color: #076a64; font-size: 14px;">AVAILABLE (OPEN FOR BOOKINGS)</strong></p>
        <p style="margin: 4px 0; color: #75777f;">Tenant: <strong style="color: #001637;">${data.userName}</strong> (${data.userEmail})</p>
        ${data.userPhone ? `<p style="margin: 4px 0; color: #75777f;">Tenant Phone: <strong style="color: #001637;">${data.userPhone}</strong></p>` : ""}
        <p style="margin: 4px 0; color: #75777f;">Reason: <em>${data.reason || defaultReason}</em></p>
      </div>

      <p style="font-size: 13px; line-height: 1.5; color: #75777f;">
        The property listing has been reopened on the HavenKey marketplace and is now visible to prospective tenants and buyers.
      </p>
    </div>

    <div style="background: #f2f4f6; padding: 16px 24px; text-align: center; font-size: 11px; color: #75777f; border-top: 1px solid #e7e8ea;">
      &copy; 2026 HavenKey Real Estate Management Platform.
    </div>
  </div>
</body>
</html>
`;

  const userHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Departure &amp; Unreserve Confirmation</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8f9fb; margin: 0; padding: 24px; color: #191c1e;">
  <div style="max-width: 620px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e7e8ea; overflow: hidden; box-shadow: 0 4px 14px rgba(0,0,0,0.06);">
    <div style="background: linear-gradient(135deg, #076a64 0%, #001637 100%); padding: 30px 24px; text-align: center; color: #ffffff;">
      <h1 style="margin: 0; font-size: 24px; font-weight: 700;">HavenKey</h1>
      <p style="margin: 6px 0 0 0; font-size: 13px; color: #a1f1e9; letter-spacing: 0.5px;">DEPARTURE &amp; UNRESERVE CONFIRMATION</p>
    </div>

    <div style="padding: 28px 24px;">
      <p style="font-size: 14px; line-height: 1.5; color: #44474e;">
        Hello <strong>${data.userName}</strong>,
      </p>
      <p style="font-size: 14px; line-height: 1.5; color: #44474e;">
        Your departure from <strong>${data.propertyTitle}</strong> has been confirmed. The property has been unreserved and the owner (<strong>${data.ownerName}</strong>) has been formally notified via email.
      </p>

      <div style="background: #f2f4f6; border-radius: 8px; padding: 16px; margin: 18px 0; border: 1px solid #e7e8ea; font-size: 13px;">
        <p style="margin: 4px 0; color: #75777f;">Property: <strong style="color: #001637;">${data.propertyTitle}</strong></p>
        <p style="margin: 4px 0; color: #75777f;">Effective Date: <strong style="color: #001637;">${dateStr}</strong></p>
        <p style="margin: 4px 0; color: #75777f;">Reservation Status: <strong style="color: #076a64;">UNRESERVED / COMPLETED</strong></p>
        <p style="margin: 4px 0; color: #75777f;">Reason / Trigger: <em>${data.reason || defaultReason}</em></p>
      </div>

      <p style="font-size: 13px; line-height: 1.5; color: #75777f;">
        Any escrow deposit inspection or settlement will follow the standard verified protocol. Thank you for using HavenKey!
      </p>
    </div>

    <div style="background: #f2f4f6; padding: 16px 24px; text-align: center; font-size: 11px; color: #75777f; border-top: 1px solid #e7e8ea;">
      &copy; 2026 HavenKey Real Estate Management Platform.
    </div>
  </div>
</body>
</html>
`;

  if (!transporter) {
    console.log(`[EmailService] (SIMULATED UNRESERVED EMAIL) To: ${data.ownerEmail} & ${data.userEmail} | ${data.propertyTitle}`);
    return { success: true, simulated: true };
  }

  try {
    await Promise.all([
      transporter.sendMail({
        from: FROM_EMAIL,
        to: data.ownerEmail,
        replyTo: data.userEmail,
        subject: ownerSubject,
        html: ownerHtml,
      }),
      transporter.sendMail({
        from: FROM_EMAIL,
        to: data.userEmail,
        subject: userSubject,
        html: userHtml,
      }),
    ]);
    return { success: true };
  } catch (err: any) {
    console.error("[EmailService] Failed to send unreserve emails:", err.message);
    return { success: false };
  }
}



