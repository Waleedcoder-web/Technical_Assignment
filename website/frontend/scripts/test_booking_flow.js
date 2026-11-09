/**
 * End-to-End Verification Test for Property Booking & Email Notification Pipeline
 * Tests:
 * 1. Fetching dynamic booking types from /api/bookings/types
 * 2. Form validation: Rejection when required email is missing or invalid
 * 3. Form validation: Rejection when terms agreement is false
 * 4. Full booking submission to /api/properties/book with all required fields
 * 5. Verification of dual email dispatch to user and owner
 */

const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

// Read Supabase credentials dynamically from .env.local
const envPath = path.resolve(__dirname, "../.env.local");
let SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
let SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (trimmed.startsWith("NEXT_PUBLIC_SUPABASE_URL=")) {
      SUPABASE_URL = trimmed.split("=")[1]?.trim() || SUPABASE_URL;
    }
    if (trimmed.startsWith("SUPABASE_SERVICE_ROLE_KEY=")) {
      SUPABASE_SERVICE_KEY = trimmed.split("=")[1]?.trim() || SUPABASE_SERVICE_KEY;
    }
  }
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const BASE_URL = "http://localhost:3000";

async function runTests() {
  console.log("==================================================");
  console.log(" HavenKey Automated Property Booking & Email Tests");
  console.log("==================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`[PASS] ${message}`);
      passed++;
    } else {
      console.error(`[FAIL] ${message}`);
      failed++;
    }
  }

  // --- Test 1: Dynamic Booking Types API ---
  console.log("--> Test 1: Fetching Dynamic Booking Types");
  const typesRes = await fetch(`${BASE_URL}/api/bookings/types`);
  const typesData = await typesRes.json();

  assert(typesRes.status === 200, "API returned status 200");
  assert(typesData.success === true, "Response has success: true");
  assert(Array.isArray(typesData.types) && typesData.types.length >= 3, `Returned ${typesData.types?.length} booking types`);
  
  const slugs = (typesData.types || []).map((t) => t.slug);
  console.log("Available types:", slugs.join(", "));
  assert(slugs.includes("in_person"), "Has 'in_person' viewing type");
  assert(slugs.includes("video_tour"), "Has 'video_tour' live tour type");
  assert(slugs.includes("inspection"), "Has 'inspection' technical type");

  // Fetch a sample property ID from properties
  const { data: sampleProps } = await supabase.from("properties").select("id, title, owner_id").limit(1);
  const targetPropertyId = sampleProps && sampleProps[0] ? sampleProps[0].id : "lumina-sky-karachi";
  console.log(`\nUsing target property: ${targetPropertyId}`);

  // --- Test 2: Validation - Missing / Invalid Email ---
  console.log("\n--> Test 2: Validation Check - Missing or Invalid Email");
  const invalidEmailRes = await fetch(`${BASE_URL}/api/properties/book`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      propertyId: targetPropertyId,
      userName: "Test User",
      userEmail: "invalid-email-string",
      userPhone: "+92 300 1234567",
      bookingDate: "2026-11-10",
      timeSlot: "11:00 AM - 12:00 PM",
      agreedToTerms: true,
    }),
  });
  const invalidEmailData = await invalidEmailRes.json();
  assert(invalidEmailRes.status === 400, "API rejected invalid email with HTTP 400");
  assert(invalidEmailData.success === false, "Response confirms failure");

  // --- Test 3: Validation - Missing Terms Agreement ---
  console.log("\n--> Test 3: Validation Check - Terms Agreement Unchecked");
  const noTermsRes = await fetch(`${BASE_URL}/api/properties/book`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      propertyId: targetPropertyId,
      userName: "Test User",
      userEmail: "tenant@havenkey.pk",
      userPhone: "+92 300 1234567",
      bookingDate: "2026-11-10",
      timeSlot: "11:00 AM - 12:00 PM",
      agreedToTerms: false,
    }),
  });
  const noTermsData = await noTermsRes.json();
  assert(noTermsRes.status === 400, "API rejected missing terms agreement with HTTP 400");
  assert(noTermsData.success === false, "Response confirms failure");

  // --- Test 4: Complete Valid Booking Submission & Dual Email Dispatch ---
  console.log("\n--> Test 4: Complete Valid Booking Submission with Dual Verification Emails");
  const validBookingPayload = {
    propertyId: targetPropertyId,
    userName: "Waleed Hassan",
    userEmail: "waleed@havenkey.pk",
    userPhone: "+92 300 9876543",
    bookingDate: "2026-11-12",
    timeSlot: "02:00 PM - 03:00 PM",
    bookingType: "in_person",
    notes: "Interested in the garden area and backup power capacity.",
    agreedToTerms: true,
  };

  const bookingRes = await fetch(`${BASE_URL}/api/properties/book`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(validBookingPayload),
  });

  const bookingData = await bookingRes.json();
  assert(bookingRes.status === 201, `API returned status 201 (got: ${bookingRes.status})`);
  assert(bookingData.success === true, "Response has success: true");
  assert(Boolean(bookingData.booking?.id), `Booking ID generated: ${bookingData.booking?.id}`);
  assert(bookingData.booking?.user?.email === "waleed@havenkey.pk", "User email recorded");
  assert(bookingData.booking?.bookingType === "in_person", "Booking type stored as 'in_person'");
  assert(bookingData.booking?.emailsSent?.user === true, "Verification email sent to prospective tenant");
  assert(bookingData.booking?.emailsSent?.owner === true, "Notification email sent to property owner");

  console.log("\nBooking Details Result:", {
    bookingId: bookingData.booking?.id,
    property: bookingData.booking?.propertyTitle,
    tenant: bookingData.booking?.user,
    owner: bookingData.booking?.owner,
    emailsDispatched: bookingData.booking?.emailsSent,
  });

  console.log("\n==================================================");
  console.log(` Results: ${passed} PASSED, ${failed} FAILED`);
  console.log("==================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
