import 'package:flutter/foundation.dart';
import 'package:mailer/mailer.dart';
import 'package:mailer/smtp_server.dart';

class EmailService {
  // SMTP credentials from .env.local
  static const String _smtpUser = 'dawworld86@gmail.com';
  static const String _smtpPass = 'pbnujrfakorquxld';
  static const String _fromEmail = 'dawworld86@gmail.com';
  static const String _fromName = 'HavenKey Concierge';

  static SmtpServer get _smtpServer => gmail(_smtpUser, _smtpPass);

  /// Dispatches booking confirmation emails to both the applicant and the property owner.
  static Future<Map<String, bool>> sendBookingEmails({
    required String bookingId,
    required String propertyTitle,
    required String propertyLocation,
    required String listingType,
    required double price,
    required String bookingDate,
    required String timeSlot,
    required String bookingTypeName,
    required String userName,
    required String userEmail,
    required String userPhone,
    required String ownerName,
    required String ownerEmail,
    String? duration,
    String? endDate,
    String? notes,
  }) async {
    bool userEmailSent = false;
    bool ownerEmailSent = false;

    final isRent = listingType.toLowerCase() == 'rent';
    final formattedPrice = 'PKR ${price.toStringAsFixed(0)}';
    final shortId = bookingId.length > 8 ? bookingId.substring(0, 8).toUpperCase() : bookingId.toUpperCase();

    // 1. Send Email to Applicant / User who booked
    try {
      final userHtml = _buildUserEmailHtml(
        shortId: shortId,
        propertyTitle: propertyTitle,
        propertyLocation: propertyLocation,
        isRent: isRent,
        formattedPrice: formattedPrice,
        bookingDate: bookingDate,
        endDate: endDate,
        duration: duration,
        timeSlot: timeSlot,
        bookingTypeName: bookingTypeName,
        userName: userName,
        ownerName: ownerName,
        ownerEmail: ownerEmail,
        notes: notes,
      );

      final userMessage = Message()
        ..from = const Address(_fromEmail, _fromName)
        ..recipients.add(userEmail)
        ..subject = '[HavenKey] Booking Confirmation: $propertyTitle (#$shortId)'
        ..html = userHtml;

      await send(userMessage, _smtpServer);
      userEmailSent = true;
      debugPrint('[EmailService] Successfully dispatched confirmation email to applicant: $userEmail');
    } catch (e) {
      debugPrint('[EmailService] Error sending email to applicant ($userEmail): $e');
    }

    // 2. Send Alert Email to Property Owner / Landlord
    try {
      final targetOwnerEmail = ownerEmail.isNotEmpty && ownerEmail.contains('@')
          ? ownerEmail
          : 'dawworld86@gmail.com';

      final ownerHtml = _buildOwnerEmailHtml(
        shortId: shortId,
        propertyTitle: propertyTitle,
        propertyLocation: propertyLocation,
        isRent: isRent,
        formattedPrice: formattedPrice,
        bookingDate: bookingDate,
        endDate: endDate,
        duration: duration,
        timeSlot: timeSlot,
        bookingTypeName: bookingTypeName,
        userName: userName,
        userEmail: userEmail,
        userPhone: userPhone,
        ownerName: ownerName,
        notes: notes,
      );

      final ownerMessage = Message()
        ..from = const Address(_fromEmail, _fromName)
        ..recipients.add(targetOwnerEmail)
        ..subject = '[HavenKey Landlord Alert] New Booking Registered: $propertyTitle (#$shortId)'
        ..html = ownerHtml;

      await send(ownerMessage, _smtpServer);
      ownerEmailSent = true;
      debugPrint('[EmailService] Successfully dispatched alert email to owner: $targetOwnerEmail');
    } catch (e) {
      debugPrint('[EmailService] Error sending email to owner ($ownerEmail): $e');
    }

    return {
      'userEmailSent': userEmailSent,
      'ownerEmailSent': ownerEmailSent,
    };
  }

  // =========================================================================
  // USER CONFIRMATION EMAIL TEMPLATE
  // =========================================================================
  static String _buildUserEmailHtml({
    required String shortId,
    required String propertyTitle,
    required String propertyLocation,
    required bool isRent,
    required String formattedPrice,
    required String bookingDate,
    required String timeSlot,
    required String bookingTypeName,
    required String userName,
    required String ownerName,
    required String ownerEmail,
    String? duration,
    String? endDate,
    String? notes,
  }) {
    return '''
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Booking Confirmation - HavenKey</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8f9fb; margin: 0; padding: 24px; color: #191c1e;">
  <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e7e8ea; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #076a64 0%, #001637 100%); padding: 32px 24px; text-align: center; color: #ffffff;">
      <h1 style="margin: 0; font-size: 26px; font-weight: 700; letter-spacing: -0.5px;">HavenKey</h1>
      <p style="margin: 6px 0 0 0; font-size: 13px; color: #a1f1e9; letter-spacing: 0.8px; font-weight: 600;">BOOKING CONFIRMATION &bull; SBP REGULATED</p>
    </div>

    <!-- Body -->
    <div style="padding: 28px 24px;">
      <div style="background-color: #e6f7f6; border-left: 4px solid #076a64; padding: 12px 16px; border-radius: 4px; margin-bottom: 20px;">
        <p style="margin: 0; color: #076a64; font-weight: 700; font-size: 14px;">✓ Reservation Officially Registered</p>
        <p style="margin: 4px 0 0 0; color: #44474e; font-size: 12px;">No email confirmation required &mdash; your booking is active and locked in.</p>
      </div>

      <p style="font-size: 14px; line-height: 1.5; color: #44474e;">
        Hello <strong>$userName</strong>,
      </p>
      <p style="font-size: 14px; line-height: 1.5; color: #44474e;">
        Your booking for <strong>$propertyTitle</strong> has been successfully registered. The property status has been updated to <strong>Reserved</strong> on HavenKey.
      </p>

      <!-- Details Box -->
      <div style="background: #f2f4f6; border-radius: 8px; padding: 18px; margin: 20px 0; border: 1px solid #e7e8ea;">
        <h3 style="margin: 0 0 12px 0; font-size: 13px; color: #001637; text-transform: uppercase; letter-spacing: 0.5px;">Booking Details</h3>
        
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <tr>
            <td style="padding: 6px 0; color: #75777f; width: 140px;">Booking Ref:</td>
            <td style="padding: 6px 0; font-weight: 700; font-family: monospace; color: #001637;">#$shortId</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #75777f;">Property:</td>
            <td style="padding: 6px 0; font-weight: 600; color: #001637;">$propertyTitle</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #75777f;">Location:</td>
            <td style="padding: 6px 0; color: #191c1e;">$propertyLocation</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #75777f;">Type:</td>
            <td style="padding: 6px 0; font-weight: 600; color: #076a64;">$bookingTypeName</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #75777f;">Scheduled Date:</td>
            <td style="padding: 6px 0; font-weight: 600; color: #001637;">$bookingDate</td>
          </tr>
          ${duration != null && duration.isNotEmpty ? '''
          <tr>
            <td style="padding: 6px 0; color: #75777f;">Stay / Duration:</td>
            <td style="padding: 6px 0; font-weight: 600; color: #001637;">$duration</td>
          </tr>
          ''' : ''}
          ${endDate != null && endDate.isNotEmpty ? '''
          <tr>
            <td style="padding: 6px 0; color: #75777f;">Departure / End Date:</td>
            <td style="padding: 6px 0; font-weight: 600; color: #076a64;">$endDate</td>
          </tr>
          ''' : ''}
          <tr>
            <td style="padding: 6px 0; color: #75777f;">Time Slot:</td>
            <td style="padding: 6px 0; font-weight: 600; color: #001637;">$timeSlot</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #75777f;">${isRent ? 'Monthly Rent' : 'Price'}:</td>
            <td style="padding: 6px 0; font-weight: 700; color: #076a64;">$formattedPrice ${isRent ? '/ mo' : ''}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #75777f;">Owner / Host:</td>
            <td style="padding: 6px 0; color: #191c1e;">$ownerName</td>
          </tr>
          ${notes != null && notes.isNotEmpty ? '''
          <tr>
            <td style="padding: 6px 0; color: #75777f;">Notes:</td>
            <td style="padding: 6px 0; color: #191c1e;">$notes</td>
          </tr>
          ''' : ''}
        </table>
      </div>

      <div style="background: #ffffff; border: 1px solid #076a64; border-radius: 8px; padding: 14px 16px; margin: 20px 0;">
        <p style="margin: 0; font-size: 12.5px; color: #076a64; font-weight: 600;">
          &#x1F6E1; SBP Escrow Protection Active
        </p>
        <p style="margin: 4px 0 0 0; font-size: 11.5px; color: #44474e;">
          Your identity and reservation are secured under HavenKey Sovereign Property protocols. The property owner has been notified and will coordinate with you.
        </p>
      </div>

      <p style="font-size: 12px; color: #75777f; line-height: 1.5;">
        Need assistance or want to reschedule? Contact HavenKey Concierge at <strong>support@havenkey.pk</strong> or call 051-8889900.
      </p>
    </div>

    <!-- Footer -->
    <div style="background: #f2f4f6; padding: 16px 24px; text-align: center; font-size: 11px; color: #75777f; border-top: 1px solid #e7e8ea;">
      &copy; 2026 HavenKey Real Estate Management Platform. Pakistan's Premier SBP-Compliant PropTech.
    </div>
  </div>
</body>
</html>
''';
  }

  // =========================================================================
  // OWNER ALERT EMAIL TEMPLATE
  // =========================================================================
  static String _buildOwnerEmailHtml({
    required String shortId,
    required String propertyTitle,
    required String propertyLocation,
    required bool isRent,
    required String formattedPrice,
    required String bookingDate,
    required String timeSlot,
    required String bookingTypeName,
    required String userName,
    required String userEmail,
    required String userPhone,
    required String ownerName,
    String? duration,
    String? endDate,
    String? notes,
  }) {
    return '''
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>New Booking Alert - HavenKey</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8f9fb; margin: 0; padding: 24px; color: #191c1e;">
  <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e7e8ea; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #001637 0%, #076a64 100%); padding: 32px 24px; text-align: center; color: #ffffff;">
      <h1 style="margin: 0; font-size: 24px; font-weight: 700;">HavenKey Landlord Alert</h1>
      <p style="margin: 6px 0 0 0; font-size: 13px; color: #a1f1e9; letter-spacing: 0.5px; font-weight: 600;">NEW BOOKING REGISTERED</p>
    </div>

    <!-- Body -->
    <div style="padding: 28px 24px;">
      <p style="font-size: 14px; line-height: 1.5; color: #44474e;">
        Hello <strong>$ownerName</strong>,
      </p>
      <p style="font-size: 14px; line-height: 1.5; color: #44474e;">
        A new booking has been registered for your property <strong>$propertyTitle</strong>. The listing status has automatically been marked as <strong>Not Available / Reserved</strong> on HavenKey.
      </p>

      <!-- Details Box -->
      <div style="background: #f2f4f6; border-radius: 8px; padding: 18px; margin: 20px 0; border: 1px solid #e7e8ea; font-size: 13px;">
        <h3 style="margin: 0 0 12px 0; font-size: 13px; color: #001637; text-transform: uppercase; letter-spacing: 0.5px;">Applicant &amp; Booking Details</h3>
        
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <tr>
            <td style="padding: 6px 0; color: #75777f; width: 140px;">Booking Ref:</td>
            <td style="padding: 6px 0; font-weight: 700; font-family: monospace; color: #001637;">#$shortId</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #75777f;">Property:</td>
            <td style="padding: 6px 0; font-weight: 600; color: #001637;">$propertyTitle</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #75777f;">Location:</td>
            <td style="padding: 6px 0; color: #191c1e;">$propertyLocation</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #75777f;">Applicant Name:</td>
            <td style="padding: 6px 0; font-weight: 700; color: #001637;">$userName</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #75777f;">Applicant Email:</td>
            <td style="padding: 6px 0; font-weight: 600; color: #076a64;">$userEmail</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #75777f;">Applicant Phone:</td>
            <td style="padding: 6px 0; font-weight: 600; color: #001637;">$userPhone</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #75777f;">Booking Type:</td>
            <td style="padding: 6px 0; font-weight: 600; color: #076a64;">$bookingTypeName</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #75777f;">Scheduled Date:</td>
            <td style="padding: 6px 0; font-weight: 600; color: #001637;">$bookingDate</td>
          </tr>
          ${duration != null && duration.isNotEmpty ? '''
          <tr>
            <td style="padding: 6px 0; color: #75777f;">Stay / Duration:</td>
            <td style="padding: 6px 0; font-weight: 600; color: #001637;">$duration</td>
          </tr>
          ''' : ''}
          ${endDate != null && endDate.isNotEmpty ? '''
          <tr>
            <td style="padding: 6px 0; color: #75777f;">Departure / End Date:</td>
            <td style="padding: 6px 0; font-weight: 600; color: #076a64;">$endDate</td>
          </tr>
          ''' : ''}
          <tr>
            <td style="padding: 6px 0; color: #75777f;">Time Slot:</td>
            <td style="padding: 6px 0; font-weight: 600; color: #001637;">$timeSlot</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #75777f;">Agreed Price:</td>
            <td style="padding: 6px 0; font-weight: 700; color: #076a64;">$formattedPrice</td>
          </tr>
          ${notes != null && notes.isNotEmpty ? '''
          <tr>
            <td style="padding: 6px 0; color: #75777f;">Applicant Notes:</td>
            <td style="padding: 6px 0; color: #191c1e;">$notes</td>
          </tr>
          ''' : ''}
        </table>
      </div>

      <div style="background: #e6f7f6; border-left: 4px solid #076a64; padding: 12px 16px; border-radius: 4px; margin: 20px 0;">
        <p style="margin: 0; color: #076a64; font-weight: 700; font-size: 13px;">Next Steps for Landlord:</p>
        <p style="margin: 4px 0 0 0; color: #44474e; font-size: 12px;">
          You can contact the applicant directly at <strong>$userPhone</strong> or via email at <strong>$userEmail</strong> to coordinate entry and keys.
        </p>
      </div>
    </div>

    <!-- Footer -->
    <div style="background: #f2f4f6; padding: 16px 24px; text-align: center; font-size: 11px; color: #75777f; border-top: 1px solid #e7e8ea;">
      &copy; 2026 HavenKey Real Estate Management Platform.
    </div>
  </div>
</body>
</html>
''';
  }

  /// Dispatches formal complaint notification email to the property owner and acknowledgment to the tenant.
  static Future<Map<String, bool>> sendComplaintEmails({
    required String complaintId,
    required String propertyTitle,
    required String ownerName,
    required String ownerEmail,
    required String userName,
    required String userEmail,
    required String userPhone,
    required String category,
    required String title,
    required String description,
  }) async {
    bool ownerSent = false;
    bool userSent = false;
    final shortId = complaintId.length > 8 ? complaintId.substring(0, 8).toUpperCase() : complaintId.toUpperCase();
    final targetOwner = ownerEmail.isNotEmpty && ownerEmail.contains('@') ? ownerEmail : 'dawworld86@gmail.com';

    // 1. Send Alert to Owner
    try {
      final ownerHtml = '''
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; background: #f8f9fb; margin: 0; padding: 24px;">
  <div style="max-width: 600px; margin: auto; background: #fff; border-radius: 12px; border: 1px solid #e7e8ea; overflow: hidden;">
    <div style="background: #ba1a1a; padding: 20px 24px; color: #fff;">
      <h2 style="margin: 0; font-size: 18px;">[HavenKey Support] Maintenance / Tenant Complaint (#$shortId)</h2>
      <p style="margin: 4px 0 0 0; font-size: 12px; opacity: 0.9;">Property: $propertyTitle</p>
    </div>
    <div style="padding: 24px;">
      <p style="font-size: 14px; color: #44474e;">Hello <strong>$ownerName</strong>,</p>
      <p style="font-size: 14px; color: #44474e;">A tenant complaint has been officially registered on HavenKey for your property <strong>$propertyTitle</strong>.</p>
      <div style="background: #fff8f7; border: 1px solid #ffdad6; border-radius: 8px; padding: 16px; margin: 16px 0; font-size: 13px;">
        <p style="margin: 0 0 8px 0;"><strong>Category:</strong> $category</p>
        <p style="margin: 0 0 8px 0;"><strong>Subject:</strong> $title</p>
        <p style="margin: 0 0 8px 0;"><strong>Tenant:</strong> $userName ($userPhone • $userEmail)</p>
        <p style="margin: 8px 0 0 0; color: #191c1e; background: #fff; padding: 10px; border-radius: 6px; border: 1px solid #e7e8ea;"><strong>Description:</strong><br/>$description</p>
      </div>
      <p style="font-size: 12px; color: #75777f;">Please contact the tenant promptly or coordinate with HavenKey Facility Support to inspect and resolve this issue.</p>
    </div>
    <div style="background: #f2f4f6; padding: 14px 24px; text-align: center; font-size: 11px; color: #75777f;">
      &copy; 2026 HavenKey Tenant Support Network.
    </div>
  </div>
</body>
</html>
''';

      final msg = Message()
        ..from = const Address(_fromEmail, _fromName)
        ..recipients.add(targetOwner)
        ..subject = '[HavenKey Alert] Tenant Complaint Filed: $title (#$shortId)'
        ..html = ownerHtml;

      await send(msg, _smtpServer);
      ownerSent = true;
    } catch (e) {
      debugPrint('[EmailService] Complaint email to owner failed: $e');
    }

    // 2. Send Confirmation to Tenant
    try {
      final userHtml = '''
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; background: #f8f9fb; margin: 0; padding: 24px;">
  <div style="max-width: 600px; margin: auto; background: #fff; border-radius: 12px; border: 1px solid #e7e8ea; overflow: hidden;">
    <div style="background: #001637; padding: 20px 24px; color: #fff;">
      <h2 style="margin: 0; font-size: 18px;">Complaint Ticket Registered (#$shortId)</h2>
      <p style="margin: 4px 0 0 0; font-size: 12px; color: #a1f1e9;">HavenKey Resident Care</p>
    </div>
    <div style="padding: 24px;">
      <p style="font-size: 14px; color: #44474e;">Dear <strong>$userName</strong>,</p>
      <p style="font-size: 14px; color: #44474e;">Your complaint regarding <strong>$propertyTitle</strong> has been logged and immediately dispatched to the property owner ($ownerName).</p>
      <div style="background: #f8f9fb; border: 1px solid #e7e8ea; border-radius: 8px; padding: 16px; margin: 16px 0; font-size: 13px;">
        <p style="margin: 0 0 6px 0;"><strong>Ticket Ref:</strong> #$shortId</p>
        <p style="margin: 0 0 6px 0;"><strong>Subject:</strong> $title</p>
        <p style="margin: 0 0 6px 0;"><strong>Category:</strong> $category</p>
        <p style="margin: 0;"><strong>Status:</strong> <span style="color: #ba1a1a; font-weight: bold;">Pending Review</span></p>
      </div>
      <p style="font-size: 12px; color: #75777f;">Our standard resolution SLA is 24 hours. You can track progress in your Resident Portal.</p>
    </div>
    <div style="background: #f2f4f6; padding: 14px 24px; text-align: center; font-size: 11px; color: #75777f;">
      &copy; 2026 HavenKey Tenant Support Network.
    </div>
  </div>
</body>
</html>
''';

      final msg = Message()
        ..from = const Address(_fromEmail, _fromName)
        ..recipients.add(userEmail)
        ..subject = '[HavenKey Support] Ticket Acknowledgment: $title (#$shortId)'
        ..html = userHtml;

      await send(msg, _smtpServer);
      userSent = true;
    } catch (e) {
      debugPrint('[EmailService] Complaint acknowledgment to tenant failed: $e');
    }

    return {'ownerSent': ownerSent, 'userSent': userSent};
  }

  /// Dispatches departure / unreserve confirmation emails to landlord and resident.
  static Future<Map<String, bool>> sendUnreserveEmails({
    required String propertyTitle,
    required String ownerName,
    required String ownerEmail,
    required String userName,
    required String userEmail,
    required String userPhone,
    required String departureDate,
    required String reason,
    required bool isAutomatic,
  }) async {
    bool ownerSent = false;
    bool userSent = false;
    final targetOwner = ownerEmail.isNotEmpty && ownerEmail.contains('@') ? ownerEmail : 'dawworld86@gmail.com';

    // 1. Dispatch to Owner
    try {
      final ownerHtml = '''
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; background: #f8f9fb; margin: 0; padding: 24px;">
  <div style="max-width: 600px; margin: auto; background: #fff; border-radius: 12px; border: 1px solid #e7e8ea; overflow: hidden;">
    <div style="background: #076a64; padding: 20px 24px; color: #fff;">
      <h2 style="margin: 0; font-size: 18px;">[HavenKey Notice] Property Departure &amp; Listing Reverted to Available</h2>
      <p style="margin: 4px 0 0 0; font-size: 12px; opacity: 0.9;">Property: $propertyTitle</p>
    </div>
    <div style="padding: 24px;">
      <p style="font-size: 14px; color: #44474e;">Hello <strong>$ownerName</strong>,</p>
      <p style="font-size: 14px; color: #44474e;">This is an official notice that tenant <strong>$userName</strong> has concluded tenancy / departed from <strong>$propertyTitle</strong> on <strong>$departureDate</strong>.</p>
      <div style="background: #f2f4f6; border: 1px solid #e7e8ea; border-radius: 8px; padding: 16px; margin: 16px 0; font-size: 13px;">
        <p style="margin: 0 0 8px 0;"><strong>Departure Reason:</strong> $reason</p>
        <p style="margin: 0 0 8px 0;"><strong>Mode:</strong> ${isAutomatic ? 'Automatic Duration Conclusion' : 'Resident Initiated Departure'}</p>
        <p style="margin: 0 0 8px 0;"><strong>Tenant Contact:</strong> $userName ($userPhone • $userEmail)</p>
        <p style="margin: 0; color: #076a64; font-weight: bold;">Listing Status: REVERTED TO AVAILABLE (Live in Market)</p>
      </div>
      <p style="font-size: 12px; color: #75777f;">Your listing has returned to the live property catalog on HavenKey and can now accept new inquiries and lease reservations.</p>
    </div>
    <div style="background: #f2f4f6; padding: 14px 24px; text-align: center; font-size: 11px; color: #75777f;">
      &copy; 2026 HavenKey Real Estate Management Platform.
    </div>
  </div>
</body>
</html>
''';

      final msg = Message()
        ..from = const Address(_fromEmail, _fromName)
        ..recipients.add(targetOwner)
        ..subject = '[HavenKey Notice] Listing Available: $propertyTitle Departure Completed'
        ..html = ownerHtml;

      await send(msg, _smtpServer);
      ownerSent = true;
    } catch (e) {
      debugPrint('[EmailService] Departure email to owner failed: $e');
    }

    // 2. Dispatch to Resident
    try {
      final userHtml = '''
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; background: #f8f9fb; margin: 0; padding: 24px;">
  <div style="max-width: 600px; margin: auto; background: #fff; border-radius: 12px; border: 1px solid #e7e8ea; overflow: hidden;">
    <div style="background: #001637; padding: 20px 24px; color: #fff;">
      <h2 style="margin: 0; font-size: 18px;">Departure &amp; Unreservation Confirmation</h2>
      <p style="margin: 4px 0 0 0; font-size: 12px; color: #a1f1e9;">HavenKey Resident Care</p>
    </div>
    <div style="padding: 24px;">
      <p style="font-size: 14px; color: #44474e;">Dear <strong>$userName</strong>,</p>
      <p style="font-size: 14px; color: #44474e;">Your departure from <strong>$propertyTitle</strong> has been recorded successfully. The property reservation has been concluded.</p>
      <div style="background: #f8f9fb; border: 1px solid #e7e8ea; border-radius: 8px; padding: 16px; margin: 16px 0; font-size: 13px;">
        <p style="margin: 0 0 6px 0;"><strong>Effective Departure Date:</strong> $departureDate</p>
        <p style="margin: 0 0 6px 0;"><strong>Reason:</strong> $reason</p>
        <p style="margin: 0;"><strong>Status:</strong> <span style="color: #076a64; font-weight: bold;">Unreserved &amp; Concluded</span></p>
      </div>
      <p style="font-size: 12px; color: #75777f;">Thank you for choosing HavenKey. Our concierge is available 24/7 if you need assistance with escrow deposits or your next property search.</p>
    </div>
    <div style="background: #f2f4f6; padding: 14px 24px; text-align: center; font-size: 11px; color: #75777f;">
      &copy; 2026 HavenKey Resident Care.
    </div>
  </div>
</body>
</html>
''';

      final msg = Message()
        ..from = const Address(_fromEmail, _fromName)
        ..recipients.add(userEmail)
        ..subject = '[HavenKey] Departure Confirmation: $propertyTitle'
        ..html = userHtml;

      await send(msg, _smtpServer);
      userSent = true;
    } catch (e) {
      debugPrint('[EmailService] Departure email to tenant failed: $e');
    }

    return {'ownerSent': ownerSent, 'userSent': userSent};
  }
}

