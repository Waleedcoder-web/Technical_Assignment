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
          This property has been temporarily marked as <strong>Not Available</strong>. Please submit your answer below to verify or cancel your reservation:
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
          The property is now reserved. The applicant has been sent a verification email requiring them to confirm with <strong>YES</strong> (finalize booking) or <strong>NO</strong> (cancel &amp; release back to available).
        </p>
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
