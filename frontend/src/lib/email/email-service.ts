import nodemailer from "nodemailer";

export interface BookingEmailData {
  bookingId: string;
  propertyTitle: string;
  propertyLocation: string;
  propertyPrice?: string;
  bookingDate: string;
  timeSlot: string;
  bookingType: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  ownerName: string;
  ownerEmail: string;
  notes?: string;
}

/**
 * Creates and returns the Nodemailer transporter using environment variables.
 * Returns null if SMTP is not configured.
 */
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
 * Dispatches verification email to the prospective tenant / user.
 */
export async function sendUserBookingConfirmation(data: BookingEmailData): Promise<{ success: boolean; simulated?: boolean }> {
  const transporter = getTransporter();

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Your HavenKey Viewing Confirmation</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8f9fb; margin: 0; padding: 24px; color: #191c1e;">
  <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e7e8ea; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #076a64 0%, #001637 100%); padding: 32px 24px; text-align: center; color: #ffffff;">
      <h1 style="margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">HavenKey</h1>
      <p style="margin: 6px 0 0 0; font-size: 13px; color: #a1f1e9; letter-spacing: 0.5px;">VERIFIED REAL ESTATE ECOSYSTEM</p>
    </div>

    <!-- Body -->
    <div style="padding: 28px 24px;">
      <div style="background-color: #e6f7f6; border-left: 4px solid #076a64; padding: 12px 16px; border-radius: 4px; margin-bottom: 20px;">
        <p style="margin: 0; color: #076a64; font-weight: 600; font-size: 14px;">Viewing Request Received &amp; Awaiting Owner Confirmation</p>
      </div>

      <p style="font-size: 14px; line-height: 1.5; color: #44474e;">
        Hello <strong>${data.userName}</strong>,
      </p>
      <p style="font-size: 14px; line-height: 1.5; color: #44474e;">
        Thank you for choosing HavenKey. Your viewing request for <strong>${data.propertyTitle}</strong> has been logged and sent to the property owner for review.
      </p>

      <!-- Booking Summary Box -->
      <div style="background: #f2f4f6; border-radius: 8px; padding: 18px; margin: 20px 0; border: 1px solid #e7e8ea;">
        <h3 style="margin: 0 0 12px 0; font-size: 14px; color: #001637; text-transform: uppercase; letter-spacing: 0.5px;">Appointment Details</h3>
        
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <tr>
            <td style="padding: 6px 0; color: #75777f; width: 140px;">Booking Ref:</td>
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
          <tr>
            <td style="padding: 6px 0; color: #75777f;">Date:</td>
            <td style="padding: 6px 0; font-weight: 600; color: #076a64;">${data.bookingDate}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #75777f;">Time Slot:</td>
            <td style="padding: 6px 0; font-weight: 600; color: #076a64;">${data.timeSlot}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #75777f;">Viewing Type:</td>
            <td style="padding: 6px 0; color: #191c1e;">${data.bookingType}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #75777f;">Property Owner:</td>
            <td style="padding: 6px 0; color: #191c1e;">${data.ownerName}</td>
          </tr>
        </table>
      </div>

      <p style="font-size: 12px; color: #75777f; line-height: 1.5;">
        <strong>HavenKey Security Notice:</strong> All viewings and lease agreements are covered by our zero-brokerage and tenancy escrow guarantee. Never make cash payments before signing a digital tenancy agreement on HavenKey.
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
    console.log("\n=======================================================");
    console.log("[EmailService] (SIMULATED USER EMAIL)");
    console.log(`To: ${data.userEmail} (${data.userName})`);
    console.log(`Subject: [HavenKey] Your Viewing Request for ${data.propertyTitle}`);
    console.log(`Date: ${data.bookingDate} | Time: ${data.timeSlot} | Type: ${data.bookingType}`);
    console.log("=======================================================\n");
    return { success: true, simulated: true };
  }

  try {
    await transporter.sendMail({
      from: FROM_EMAIL,
      to: data.userEmail,
      subject: `[HavenKey] Viewing Confirmation: ${data.propertyTitle}`,
      html: htmlContent,
    });
    return { success: true };
  } catch (err: any) {
    console.error("[EmailService] Failed to send user email:", err.message);
    return { success: false };
  }
}

/**
 * Dispatches viewing notification email to the property owner / landlord.
 */
export async function sendOwnerBookingNotification(data: BookingEmailData): Promise<{ success: boolean; simulated?: boolean }> {
  const transporter = getTransporter();

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>New Viewing Appointment - HavenKey</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8f9fb; margin: 0; padding: 24px; color: #191c1e;">
  <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e7e8ea; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #001637 0%, #076a64 100%); padding: 32px 24px; text-align: center; color: #ffffff;">
      <h1 style="margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">HavenKey</h1>
      <p style="margin: 6px 0 0 0; font-size: 13px; color: #a1f1e9; letter-spacing: 0.5px;">OWNER CONCIERGE NOTIFICATION</p>
    </div>

    <!-- Body -->
    <div style="padding: 28px 24px;">
      <div style="background-color: #eaf1fb; border-left: 4px solid #001637; padding: 12px 16px; border-radius: 4px; margin-bottom: 20px;">
        <p style="margin: 0; color: #001637; font-weight: 600; font-size: 14px;">Action Required: New Property Viewing Scheduled</p>
      </div>

      <p style="font-size: 14px; line-height: 1.5; color: #44474e;">
        Hello <strong>${data.ownerName}</strong>,
      </p>
      <p style="font-size: 14px; line-height: 1.5; color: #44474e;">
        A verified prospective tenant has scheduled a viewing appointment for your property <strong>${data.propertyTitle}</strong>.
      </p>

      <!-- Tenant Info Box -->
      <div style="background: #f2f4f6; border-radius: 8px; padding: 18px; margin: 20px 0; border: 1px solid #e7e8ea;">
        <h3 style="margin: 0 0 12px 0; font-size: 14px; color: #001637; text-transform: uppercase; letter-spacing: 0.5px;">Prospective Tenant Information</h3>
        
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <tr>
            <td style="padding: 6px 0; color: #75777f; width: 140px;">Tenant Name:</td>
            <td style="padding: 6px 0; font-weight: 600; color: #001637;">${data.userName}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #75777f;">Email:</td>
            <td style="padding: 6px 0; color: #076a64; font-weight: 500;">
              <a href="mailto:${data.userEmail}" style="color: #076a64; text-decoration: none;">${data.userEmail}</a>
            </td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #75777f;">Phone / WhatsApp:</td>
            <td style="padding: 6px 0; font-weight: 600; color: #001637;">${data.userPhone}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #75777f;">Requested Date:</td>
            <td style="padding: 6px 0; font-weight: 600; color: #076a64;">${data.bookingDate}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #75777f;">Requested Slot:</td>
            <td style="padding: 6px 0; font-weight: 600; color: #076a64;">${data.timeSlot}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #75777f;">Viewing Type:</td>
            <td style="padding: 6px 0; color: #191c1e;">${data.bookingType}</td>
          </tr>
          ${
            data.notes
              ? `
          <tr>
            <td style="padding: 6px 0; color: #75777f; vertical-align: top;">Tenant Notes:</td>
            <td style="padding: 6px 0; color: #191c1e; font-style: italic;">"${data.notes}"</td>
          </tr>
          `
              : ""
          }
        </table>
      </div>

      <p style="font-size: 13px; color: #44474e; line-height: 1.5;">
        Please ensure the property is accessible at the requested time slot. You can reach out directly to the prospective tenant via phone or WhatsApp above.
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
    console.log("\n=======================================================");
    console.log("[EmailService] (SIMULATED OWNER EMAIL)");
    console.log(`To: ${data.ownerEmail} (${data.ownerName})`);
    console.log(`Subject: [HavenKey] New Viewing Request for ${data.propertyTitle}`);
    console.log(`From Prospective Tenant: ${data.userName} (${data.userEmail}, ${data.userPhone})`);
    console.log(`Date: ${data.bookingDate} | Slot: ${data.timeSlot} | Type: ${data.bookingType}`);
    console.log("=======================================================\n");
    return { success: true, simulated: true };
  }

  try {
    await transporter.sendMail({
      from: FROM_EMAIL,
      to: data.ownerEmail,
      subject: `[HavenKey Alert] New Viewing Request: ${data.propertyTitle}`,
      html: htmlContent,
    });
    return { success: true };
  } catch (err: any) {
    console.error("[EmailService] Failed to send owner email:", err.message);
    return { success: false };
  }
}
