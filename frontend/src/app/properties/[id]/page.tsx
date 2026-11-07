"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import { Property, getStoredProperties, DEFAULT_PROPERTY_PLACEHOLDER } from "@/lib/mock-data";

export default function PropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [property, setProperty] = useState<Property | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Booking Form State
  const [bookingMode, setBookingMode] = useState<"booking" | "viewing">("booking");
  const [bookingDate, setBookingDate] = useState(() => {
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    return tomorrow.toISOString().split("T")[0];
  });
  const [leaseDuration, setLeaseDuration] = useState("1 Year");
  const [timeSlot, setTimeSlot] = useState("11:00 AM - 12:00 PM");
  const [bookingType, setBookingType] = useState("in_person");
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userPhone, setUserPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(true);
  const [bookingTypesList, setBookingTypesList] = useState<
    { slug: string; type_name: string; description?: string; icon?: string }[]
  >([
    { slug: "in_person", type_name: "In-Person Private Viewing" },
    { slug: "video_tour", type_name: "Live Video Tour" },
    { slug: "inspection", type_name: "Technical Property Inspection" },
  ]);
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingResult, setBookingResult] = useState<any>(null);
  const [bookingError, setBookingError] = useState<string | null>(null);

  useEffect(() => {
    const list = getStoredProperties();
    const found = list.find((p) => p.id === id) || null;
    setProperty(found);
    setIsLoading(false);

    // Auto-prefill authenticated user details from localStorage
    if (typeof window !== "undefined") {
      try {
        const storedUser = localStorage.getItem("havenkey_user");
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          if (parsed.fullname || parsed.name) setUserName(parsed.fullname || parsed.name);
          if (parsed.email) setUserEmail(parsed.email);
          if (parsed.phone_no || parsed.phone) setUserPhone(parsed.phone_no || parsed.phone);
        }
      } catch (e) {
        // ignore
      }
    }

    // Dynamically load active booking types from Supabase API
    fetch("/api/bookings/types")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.types) && data.types.length > 0) {
          setBookingTypesList(data.types);
        }
      })
      .catch((err) => console.warn("Failed to load booking types dynamically:", err));
  }, [id]);

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBookingError(null);

    if (!userName.trim()) {
      setBookingError("Please enter your full name.");
      return;
    }
    if (!userEmail.trim() || !userEmail.includes("@")) {
      setBookingError("Please provide a valid email address for verification.");
      return;
    }
    if (!userPhone.trim()) {
      setBookingError("Please enter your phone / WhatsApp contact number.");
      return;
    }
    if (!agreedToTerms) {
      setBookingError("Please accept the terms and agreement policies to proceed.");
      return;
    }

    setIsSubmittingBooking(true);

    try {
      let currentUserId: string | null = null;
      if (typeof window !== "undefined") {
        try {
          const stored = localStorage.getItem("havenkey_user");
          if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed?.id) currentUserId = parsed.id;
          }
        } catch {}
      }

      const isRent = (property?.transactionType || property?.listing_type || "rent") === "rent";
      const rentAmount = isRent ? Number(property?.price || 0) : undefined;
      const depositVal = isRent ? Number(property?.price || 0) * 2 : Number(property?.price || 0) * 0.1;

      // Calculate lease end date
      let calculatedEndDate = bookingDate;
      if (isRent) {
        const d = new Date(bookingDate);
        if (leaseDuration === "6 Months") d.setMonth(d.getMonth() + 6);
        else if (leaseDuration === "2 Years") d.setFullYear(d.getFullYear() + 2);
        else if (leaseDuration === "3 Years") d.setFullYear(d.getFullYear() + 3);
        else d.setFullYear(d.getFullYear() + 1);
        calculatedEndDate = d.toISOString().split("T")[0];
      }

      const res = await fetch("/api/properties/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: id,
          listingType: property?.transactionType || property?.listing_type || "rent",
          bookingMode,
          bookingType: bookingMode === "booking" ? (isRent ? "rent_booking" : "sale_booking") : bookingType,
          userName,
          userEmail,
          userPhone,
          startDate: bookingDate,
          endDate: calculatedEndDate,
          duration: leaseDuration,
          monthlyRent: rentAmount,
          securityDeposit: depositVal,
          tokenAmount: isRent ? undefined : depositVal,
          timeSlot,
          notes,
          agreedToTerms,
          userId: currentUserId,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to confirm booking.");
      }

      setBookingSuccess(true);
      setBookingResult(json.booking);
    } catch (err: any) {
      setBookingError(err.message || "An error occurred while booking. Please try again.");
    } finally {
      setIsSubmittingBooking(false);
    }
  };

  if (isLoading) {
    return (
      <>
        <Navbar />
        <main className="w-full pt-28 pb-16 bg-[#f8f9fb] min-h-[60vh] flex items-center justify-center">
          <div className="flex items-center gap-3 text-sm text-[#44474e]">
            <span className="material-symbols-outlined animate-spin text-[24px] text-[#076a64]">
              progress_activity
            </span>
            <span>Loading property details...</span>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (!property) {
    return (
      <>
        <Navbar />
        <main className="w-full pt-28 pb-20 bg-[#f8f9fb] min-h-[60vh]">
          <div className="max-w-[800px] mx-auto px-6 text-center">
            <div className="bg-white p-8 sm:p-12 rounded-2xl border border-[#e7e8ea] shadow-sm">
              <span className="material-symbols-outlined text-[56px] text-[#8093bb]">
                domain_disabled
              </span>
              <h1 className="text-2xl font-bold text-[#001637] font-plus-jakarta mt-3">
                Property Not Found
              </h1>
              <p className="text-sm text-[#44474e] mt-2 max-w-md mx-auto">
                The requested property listing (ID: <span className="font-mono text-xs">{id}</span>) does not exist in the database or may have been removed.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
                <Link
                  href="/properties"
                  className="px-5 py-2.5 bg-[#001637] text-white text-xs font-semibold rounded-lg hover:bg-[#172b4d] transition-colors"
                >
                  Browse Available Properties
                </Link>
                <Link
                  href="/admin/dashboard"
                  className="px-5 py-2.5 bg-[#076a64] text-white text-xs font-semibold rounded-lg hover:bg-[#00201e] transition-colors"
                >
                  Manage Listings in Admin
                </Link>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const transaction = property.transactionType || property.listing_type || "rent";
  const bedrooms = property.beds ?? property.bedroom ?? 0;
  const bathrooms = property.baths ?? property.bathroom ?? 0;
  const areaDisplay = property.size || `${property.area_value ?? 10} ${property.area_unit ?? "Marla"}`;
  const priceDisplay = property.priceFormatted || `PKR ${Number(property.price).toLocaleString()}`;
  const pricePeriod = property.pricePeriod || (transaction === "rent" ? "/ mo" : "");
  const heroImage = property.images?.[0] || property.imageUrl || property.image_url || DEFAULT_PROPERTY_PLACEHOLDER;
  const landlordName = property.landlord?.name || "Verified Landlord";
  const landlordInitials = property.landlord?.initials || "PK";
  const landlordPhone = property.landlord?.phone || "+92 300 1234567";
  const landlordEmail = property.landlord?.email || "concierge@havenkey.pk";
  const landlordRating = property.landlord?.rating || 5.0;
  const amenitiesList = property.amenities && property.amenities.length > 0
    ? property.amenities
    : ["24/7 Security", "Backup Power", "Gated Access", "Dedicated Parking", "FBR Tax Compliant"];

  return (
    <>
      <Navbar />

      <main className="w-full pt-24 pb-16 bg-[#f8f9fb]">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-12">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs text-[#44474e] mb-4">
            <Link href="/" className="hover:text-[#001637] transition-colors">
              Home
            </Link>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <Link href="/properties" className="hover:text-[#001637] transition-colors">
              Properties
            </Link>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-[#001637] font-semibold truncate">{property.title}</span>
          </div>

          {/* Property Header */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2.5 py-1 bg-[#001637] text-white rounded-md text-xs font-semibold tracking-wide uppercase">
                  {transaction === "rent" ? "For Rent" : "For Sale"}
                </span>
                <span className="px-2.5 py-1 bg-[#a1f1e9] text-[#076a64] rounded-md text-xs font-semibold tracking-wide uppercase">
                  {property.status || "available"}
                </span>
                {property.verified && (
                  <span className="px-2.5 py-1 bg-[#076a64]/10 text-[#076a64] rounded-md text-xs font-semibold flex items-center gap-1 border border-[#076a64]/20">
                    <span className="material-symbols-outlined text-[14px]">verified</span>
                    Biometric Verified Title
                  </span>
                )}
                <span className="text-xs text-[#75777f]">Ref #{property.id}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#001637] font-plus-jakarta tracking-tight">
                {property.title}
              </h1>
              <div className="flex items-center gap-1 text-[#44474e] text-sm mt-1">
                <span className="material-symbols-outlined text-[18px] text-[#076a64]">
                  location_on
                </span>
                <span>{property.location}</span>
                {property.address && property.address !== property.location && (
                  <span className="text-xs text-[#75777f]">({property.address})</span>
                )}
              </div>
            </div>

            {/* Price Box */}
            <div className="flex items-baseline lg:items-end flex-col bg-white p-4 rounded-xl border border-[#e7e8ea] shadow-sm">
              <span className="text-xs uppercase text-[#44474e] font-semibold">
                {transaction === "rent" ? "Monthly Rental Rate" : "Asking Price"}
              </span>
              <p className="text-2xl sm:text-3xl font-bold text-[#001637] font-plus-jakarta mt-0.5">
                {priceDisplay}{" "}
                {pricePeriod && (
                  <span className="text-sm font-normal text-[#44474e]">
                    {pricePeriod}
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Gallery Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-8">
            <div className="lg:col-span-8 rounded-2xl overflow-hidden aspect-[16/10] bg-[#edeef0] border border-[#e7e8ea] shadow-sm">
              <img
                src={property.images?.[0] || heroImage}
                alt={property.imageAlt || property.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="lg:col-span-4 flex flex-col gap-4">
              <div className="rounded-xl overflow-hidden flex-1 bg-[#edeef0] border border-[#e7e8ea] shadow-sm">
                <img
                  src={property.images?.[1] || property.images?.[0] || heroImage}
                  alt="Interior architecture"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="rounded-xl overflow-hidden flex-1 bg-[#edeef0] border border-[#e7e8ea] shadow-sm relative group cursor-pointer">
                <img
                  src={property.images?.[2] || property.images?.[0] || heroImage}
                  alt="Balcony view"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-[#001637]/60 flex items-center justify-center text-white text-sm font-semibold gap-2 backdrop-blur-xs">
                  <span className="material-symbols-outlined text-[20px]">photo_library</span>
                  {property.images && property.images.length > 3
                    ? `+${property.images.length - 2} More Photos`
                    : "Verified Architectural Photos"}
                </div>
              </div>
            </div>
          </div>

          {/* Additional Contained Image Blocks (if more than 3 photos) */}
          {property.images && property.images.length > 3 && (
            <div className="p-4 bg-white rounded-2xl border border-[#e7e8ea] shadow-sm mb-8">
              <h4 className="text-xs font-bold text-[#001637] mb-3 flex items-center gap-1.5 uppercase tracking-wider">
                <span className="material-symbols-outlined text-[16px] text-[#076a64]">grid_view</span>
                Full Property Image Gallery ({property.images.length} Contained Blocks)
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {property.images.map((img, idx) => (
                  <div
                    key={`${img}-${idx}`}
                    className="aspect-square rounded-xl overflow-hidden border border-[#e7e8ea] bg-[#f2f4f6] relative group"
                  >
                    <img
                      src={img}
                      alt={`Photo ${idx + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <span className="absolute bottom-1 right-1 px-1.5 py-0.2 bg-black/60 text-white text-[9px] rounded font-mono">
                      #{idx + 1}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Details & Sidebar Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Main Content */}
            <div className="lg:col-span-8 flex flex-col gap-8">
              {/* Core Specs Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 bg-white rounded-xl border border-[#e7e8ea] shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#f2f4f6] flex items-center justify-center text-[#076a64]">
                    <span className="material-symbols-outlined text-[22px]">bed</span>
                  </div>
                  <div>
                    <span className="text-xs text-[#44474e]">Bedrooms</span>
                    <p className="text-base font-bold text-[#001637]">{bedrooms} Beds</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#f2f4f6] flex items-center justify-center text-[#076a64]">
                    <span className="material-symbols-outlined text-[22px]">bathtub</span>
                  </div>
                  <div>
                    <span className="text-xs text-[#44474e]">Bathrooms</span>
                    <p className="text-base font-bold text-[#001637]">{bathrooms} Baths</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#f2f4f6] flex items-center justify-center text-[#076a64]">
                    <span className="material-symbols-outlined text-[22px]">straighten</span>
                  </div>
                  <div>
                    <span className="text-xs text-[#44474e]">Plot / Size</span>
                    <p className="text-base font-bold text-[#001637]">{areaDisplay}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#f2f4f6] flex items-center justify-center text-[#076a64]">
                    <span className="material-symbols-outlined text-[22px]">apartment</span>
                  </div>
                  <div>
                    <span className="text-xs text-[#44474e]">Category</span>
                    <p className="text-base font-bold text-[#001637] capitalize">
                      {property.property_type || property.category || "Property"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="bg-white p-6 rounded-xl border border-[#e7e8ea] shadow-sm">
                <h3 className="text-lg font-bold text-[#001637] font-plus-jakarta mb-3">
                  Property Description
                </h3>
                <p className="text-sm text-[#44474e] leading-relaxed whitespace-pre-line">
                  {property.description}
                </p>
              </div>

              {/* Amenities Grid */}
              <div className="bg-white p-6 rounded-xl border border-[#e7e8ea] shadow-sm">
                <h3 className="text-lg font-bold text-[#001637] font-plus-jakarta mb-4">
                  Features &amp; Verified Amenities
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {amenitiesList.map((amenity) => (
                    <div
                      key={amenity}
                      className="flex items-center gap-2 p-3 bg-[#f2f4f6] rounded-lg text-xs font-semibold text-[#001637]"
                    >
                      <span className="material-symbols-outlined text-[18px] text-[#076a64]">
                        check_circle
                      </span>
                      <span>{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Biometric Landlord Profile Card */}
              <div className="bg-white p-6 rounded-xl border border-[#e7e8ea] shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-[#172b4d] text-white flex items-center justify-center text-lg font-bold">
                    {landlordInitials}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-bold text-[#001637]">
                        {landlordName}
                      </h4>
                      <span className="px-2 py-0.5 bg-[#a1f1e9] text-[#076a64] text-[10px] font-bold rounded-full uppercase">
                        Biometric Verified
                      </span>
                    </div>
                    <p className="text-xs text-[#44474e] mt-0.5">
                      Direct Property Owner • Rating: {landlordRating} / 5.0 ★
                    </p>
                    <p className="text-xs text-[#75777f] mt-0.5">
                      ID: NADRA CNIC Verified &amp; Registered Escrow
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <a
                    href={`tel:${landlordPhone}`}
                    className="flex-1 sm:flex-initial px-4 py-2 bg-[#f2f4f6] hover:bg-[#edeef0] text-[#001637] text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">call</span>
                    Call Owner
                  </a>
                  <a
                    href={`mailto:${landlordEmail}`}
                    className="flex-1 sm:flex-initial px-4 py-2 bg-[#076a64] hover:bg-[#00201e] text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">mail</span>
                    Inquire
                  </a>
                </div>
              </div>
            </div>

            {/* Right Sticky Sidebar: Rent / Sale Online Booking & Viewing */}
            <div className="lg:col-span-4 sticky top-28 bg-white p-6 rounded-xl border border-[#e7e8ea] shadow-md">
              {bookingSuccess ? (
                <div className="text-center py-3">
                  <div className="w-14 h-14 bg-[#e6f7f6] text-[#076a64] rounded-full flex items-center justify-center mx-auto mb-3 border border-[#a1f1e9]">
                    <span className="material-symbols-outlined text-[32px]">mark_email_read</span>
                  </div>
                  <h3 className="text-lg font-bold text-[#001637] font-plus-jakarta mb-1">
                    {bookingMode === "booking"
                      ? transaction === "rent"
                        ? "Rental Booking Confirmed!"
                        : "Purchase Reservation Confirmed!"
                      : "Viewing Scheduled!"}
                  </h3>
                  <p className="text-xs text-[#44474e] mb-4">
                    Your online booking has been registered and dual verification emails have been dispatched.
                  </p>

                  <div className="bg-[#f2f4f6] rounded-lg p-3 text-left text-xs space-y-1.5 mb-4 border border-[#e7e8ea]">
                    <div className="flex justify-between">
                      <span className="text-[#75777f]">Reference ID:</span>
                      <span className="font-mono font-semibold text-[#001637]">
                        #{bookingResult?.id ? bookingResult.id.slice(0, 8) : "CONFIRMED"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#75777f]">Property:</span>
                      <span className="font-semibold text-[#001637] truncate max-w-[180px]">{property.title}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#75777f]">Type:</span>
                      <span className="font-semibold text-[#076a64] uppercase">{transaction}</span>
                    </div>
                    {transaction === "rent" && bookingMode === "booking" ? (
                      <>
                        <div className="flex justify-between">
                          <span className="text-[#75777f]">Monthly Rent:</span>
                          <span className="font-semibold text-[#076a64]">{priceDisplay} / mo</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#75777f]">Security Deposit:</span>
                          <span className="font-semibold text-[#001637]">PKR {(Number(property.price || 0) * 2).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#75777f]">Move-in Date:</span>
                          <span className="font-semibold text-[#076a64]">{bookingDate}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#75777f]">Duration:</span>
                          <span className="text-[#191c1e]">{leaseDuration}</span>
                        </div>
                      </>
                    ) : transaction === "sale" && bookingMode === "booking" ? (
                      <>
                        <div className="flex justify-between">
                          <span className="text-[#75777f]">Agreed Price:</span>
                          <span className="font-semibold text-[#076a64]">{priceDisplay}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#75777f]">Token Deposit:</span>
                          <span className="font-semibold text-[#001637]">PKR {(Number(property.price || 0) * 0.1).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#75777f]">Closing Date:</span>
                          <span className="font-semibold text-[#076a64]">{bookingDate}</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex justify-between">
                          <span className="text-[#75777f]">Viewing Date:</span>
                          <span className="font-semibold text-[#076a64]">{bookingDate}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#75777f]">Time Slot:</span>
                          <span className="font-semibold text-[#076a64]">{timeSlot}</span>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="p-3 bg-[#e6f7f6] rounded-lg text-left text-[11px] text-[#076a64] flex items-start gap-2 mb-4 border border-[#a1f1e9]">
                    <span className="material-symbols-outlined text-[16px] shrink-0 mt-0.5">verified</span>
                    <span>
                      Verification email sent to <strong>{userEmail}</strong> and the property owner ({landlordName}). Check your inbox for agreement documents!
                    </span>
                  </div>

                  <button
                    onClick={() => setBookingSuccess(false)}
                    className="w-full py-2.5 bg-[#f2f4f6] hover:bg-[#edeef0] text-[#001637] text-xs font-semibold rounded-lg transition-colors"
                  >
                    Modify / Make Another Booking
                  </button>
                </div>
              ) : (
                <>
                  {/* Mode Selector Tabs (Online Booking vs Viewing) */}
                  <div className="flex rounded-lg bg-[#f2f4f6] p-1 mb-4 border border-[#e7e8ea]">
                    <button
                      type="button"
                      onClick={() => setBookingMode("booking")}
                      className={`flex-1 py-1.5 text-xs font-semibold rounded-md flex items-center justify-center gap-1.5 transition-all ${
                        bookingMode === "booking"
                          ? "bg-white text-[#076a64] shadow-sm font-bold"
                          : "text-[#75777f] hover:text-[#001637]"
                      }`}
                    >
                      <span className="material-symbols-outlined text-[15px]">verified_user</span>
                      <span>Online Booking</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setBookingMode("viewing")}
                      className={`flex-1 py-1.5 text-xs font-semibold rounded-md flex items-center justify-center gap-1.5 transition-all ${
                        bookingMode === "viewing"
                          ? "bg-white text-[#076a64] shadow-sm font-bold"
                          : "text-[#75777f] hover:text-[#001637]"
                      }`}
                    >
                      <span className="material-symbols-outlined text-[15px]">calendar_month</span>
                      <span>Schedule Viewing</span>
                    </button>
                  </div>

                  <h3 className="text-lg font-bold text-[#001637] font-plus-jakarta mb-1">
                    {bookingMode === "booking"
                      ? transaction === "rent"
                        ? "Book for Rent (Digital Lease)"
                        : "Book Property (Purchase Token)"
                      : "Schedule a Private Viewing"}
                  </h3>
                  <p className="text-xs text-[#44474e] mb-3">
                    {bookingMode === "booking"
                      ? transaction === "rent"
                        ? "Instant online rental reservation with biometric escrow guarantee."
                        : "Reserve property purchase with digital token escrow protection."
                      : "Book an in-person or live video tour directly with verified concierges."}
                  </p>

                  {/* Financial Breakdown Summary Box for Online Booking */}
                  {bookingMode === "booking" && (
                    <div className="p-3 bg-[#e6f7f6] rounded-lg border border-[#a1f1e9] mb-4 text-xs space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-[#001637] font-semibold">
                          {transaction === "rent" ? "Monthly Rent:" : "Agreed Purchase Price:"}
                        </span>
                        <span className="text-sm font-bold text-[#076a64]">
                          {priceDisplay} {pricePeriod}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[11px] text-[#44474e] pt-0.5">
                        <span>
                          {transaction === "rent" ? "Security Deposit (2 Months Escrow):" : "Token Reservation Deposit (10%):"}
                        </span>
                        <span className="font-semibold text-[#001637]">
                          PKR{" "}
                          {transaction === "rent"
                            ? (Number(property.price || 0) * 2).toLocaleString()
                            : (Number(property.price || 0) * 0.1).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  )}

                  {bookingError && (
                    <div className="p-3 mb-4 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-start gap-2">
                      <span className="material-symbols-outlined text-[16px] shrink-0 mt-0.5">error</span>
                      <span>{bookingError}</span>
                    </div>
                  )}

                  <form onSubmit={handleBookingSubmit} className="flex flex-col gap-3">
                    {/* If Viewing Mode: Show Type Selector */}
                    {bookingMode === "viewing" && (
                      <div>
                        <label className="text-xs font-semibold text-[#44474e] block mb-1">
                          Viewing / Tour Type
                        </label>
                        <select
                          value={bookingType}
                          onChange={(e) => setBookingType(e.target.value)}
                          className="w-full h-10 px-3 bg-[#f2f4f6] text-xs text-[#191c1e] rounded-lg border border-[#e7e8ea] focus:outline-none focus:border-[#076a64]"
                        >
                          {bookingTypesList.map((t) => (
                            <option key={t.slug} value={t.slug}>
                              {t.type_name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Dates Configuration */}
                    {bookingMode === "booking" && transaction === "rent" ? (
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs font-semibold text-[#44474e] block mb-1">
                            Move-in Date
                          </label>
                          <input
                            type="date"
                            value={bookingDate}
                            onChange={(e) => setBookingDate(e.target.value)}
                            required
                            className="w-full h-10 px-2.5 bg-[#f2f4f6] text-xs text-[#191c1e] rounded-lg border border-[#e7e8ea] focus:outline-none focus:border-[#076a64]"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-[#44474e] block mb-1">
                            Lease Duration
                          </label>
                          <select
                            value={leaseDuration}
                            onChange={(e) => setLeaseDuration(e.target.value)}
                            className="w-full h-10 px-2.5 bg-[#f2f4f6] text-xs text-[#191c1e] rounded-lg border border-[#e7e8ea] focus:outline-none focus:border-[#076a64]"
                          >
                            <option>1 Year (Standard)</option>
                            <option>6 Months</option>
                            <option>2 Years</option>
                            <option>3 Years</option>
                          </select>
                        </div>
                      </div>
                    ) : bookingMode === "booking" && transaction === "sale" ? (
                      <div>
                        <label className="text-xs font-semibold text-[#44474e] block mb-1">
                          Proposed Transfer / Closing Date
                        </label>
                        <input
                          type="date"
                          value={bookingDate}
                          onChange={(e) => setBookingDate(e.target.value)}
                          required
                          className="w-full h-10 px-3 bg-[#f2f4f6] text-xs text-[#191c1e] rounded-lg border border-[#e7e8ea] focus:outline-none focus:border-[#076a64]"
                        />
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs font-semibold text-[#44474e] block mb-1">
                            Viewing Date
                          </label>
                          <input
                            type="date"
                            value={bookingDate}
                            onChange={(e) => setBookingDate(e.target.value)}
                            required
                            className="w-full h-10 px-2.5 bg-[#f2f4f6] text-xs text-[#191c1e] rounded-lg border border-[#e7e8ea] focus:outline-none focus:border-[#076a64]"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-[#44474e] block mb-1">
                            Preferred Slot
                          </label>
                          <select
                            value={timeSlot}
                            onChange={(e) => setTimeSlot(e.target.value)}
                            className="w-full h-10 px-2.5 bg-[#f2f4f6] text-xs text-[#191c1e] rounded-lg border border-[#e7e8ea] focus:outline-none focus:border-[#076a64]"
                          >
                            <option>11:00 AM - 12:00 PM</option>
                            <option>02:00 PM - 03:00 PM</option>
                            <option>04:30 PM - 05:30 PM</option>
                            <option>06:00 PM - 07:00 PM</option>
                          </select>
                        </div>
                      </div>
                    )}

                    {/* User Full Name */}
                    <div>
                      <label className="text-xs font-semibold text-[#44474e] block mb-1">
                        Your Full Name
                      </label>
                      <input
                        type="text"
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                        placeholder="e.g. Waleed Hassan"
                        required
                        className="w-full h-10 px-3 bg-[#f2f4f6] text-xs text-[#191c1e] rounded-lg border border-[#e7e8ea] focus:outline-none focus:border-[#076a64]"
                      />
                    </div>

                    {/* Email Address */}
                    <div>
                      <label className="text-xs font-semibold text-[#44474e] block mb-1">
                        Email Address <span className="text-[#076a64] font-normal">(for verification)</span>
                      </label>
                      <input
                        type="email"
                        value={userEmail}
                        onChange={(e) => setUserEmail(e.target.value)}
                        placeholder="e.g. waleed@havenkey.pk"
                        required
                        className="w-full h-10 px-3 bg-[#f2f4f6] text-xs text-[#191c1e] rounded-lg border border-[#e7e8ea] focus:outline-none focus:border-[#076a64]"
                      />
                    </div>

                    {/* Phone / WhatsApp */}
                    <div>
                      <label className="text-xs font-semibold text-[#44474e] block mb-1">
                        Phone / WhatsApp
                      </label>
                      <input
                        type="tel"
                        value={userPhone}
                        onChange={(e) => setUserPhone(e.target.value)}
                        placeholder="+92 300 0000000"
                        required
                        className="w-full h-10 px-3 bg-[#f2f4f6] text-xs text-[#191c1e] rounded-lg border border-[#e7e8ea] focus:outline-none focus:border-[#076a64]"
                      />
                    </div>

                    {/* Special Notes / Move-in Requirements */}
                    <div>
                      <label className="text-xs font-semibold text-[#44474e] block mb-1">
                        Special Instructions / Requirements <span className="text-gray-400 font-normal">(optional)</span>
                      </label>
                      <textarea
                        rows={2}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder={
                          transaction === "rent"
                            ? "Number of family occupants, parking needs, or move-in notes..."
                            : "Token transfer questions or closing requirements..."
                        }
                        className="w-full p-2.5 bg-[#f2f4f6] text-xs text-[#191c1e] rounded-lg border border-[#e7e8ea] focus:outline-none focus:border-[#076a64] resize-none"
                      />
                    </div>

                    {/* Terms & Agreement Checkbox */}
                    <div className="flex items-start gap-2 pt-1">
                      <input
                        id="agreedToTermsCheckbox"
                        type="checkbox"
                        checked={agreedToTerms}
                        onChange={(e) => setAgreedToTerms(e.target.checked)}
                        className="mt-0.5 h-4 w-4 rounded border-[#e7e8ea] text-[#076a64] focus:ring-[#076a64]"
                      />
                      <label htmlFor="agreedToTermsCheckbox" className="text-[11px] text-[#44474e] leading-snug cursor-pointer select-none">
                        {bookingMode === "booking"
                          ? transaction === "rent"
                            ? `I confirm my intent to rent this property at ${priceDisplay}/mo, agree to HavenKey's digital tenancy terms, and authorize HavenKey to notify the property owner.`
                            : `I confirm my intent to purchase this property, agree to HavenKey's token reservation terms, and authorize HavenKey to notify the property owner.`
                          : `I agree to HavenKey's viewing policies, verify that my details are accurate, and authorize HavenKey to notify the property owner.`}
                      </label>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmittingBooking || !agreedToTerms}
                      className="w-full h-11 bg-[#076a64] hover:bg-[#00201e] disabled:opacity-60 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-all shadow-sm mt-1"
                    >
                      {isSubmittingBooking ? (
                        <>
                          <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                          <span>Confirming Booking &amp; Sending Emails...</span>
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-[18px]">verified</span>
                          <span>
                            {bookingMode === "booking"
                              ? transaction === "rent"
                                ? "Confirm Online Rental Booking"
                                : "Confirm Online Purchase Booking"
                              : "Confirm Tour Booking"}
                          </span>
                        </>
                      )}
                    </button>

                    <div className="p-2 bg-[#f2f4f6] rounded-lg flex items-start gap-2 text-[11px] text-[#44474e]">
                      <span className="material-symbols-outlined text-[15px] text-[#076a64] shrink-0 mt-0.5">
                        verified_user
                      </span>
                      <span>
                        Protected by HavenKey biometric verification and zero-brokerage escrow.
                      </span>
                    </div>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
