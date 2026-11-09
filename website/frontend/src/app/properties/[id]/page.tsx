"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import { Property, getStoredProperties, saveStoredProperties, DEFAULT_PROPERTY_PLACEHOLDER } from "@/lib/mock-data";
import CustomDropdown from "@/components/ui/custom-dropdown";

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
  const [isCustomDuration, setIsCustomDuration] = useState(false);
  const [customDurationValue, setCustomDurationValue] = useState(1);
  const [customDurationUnit, setCustomDurationUnit] = useState<"days" | "weeks" | "months" | "years">("days");

  const getCalculatedEndDate = () => {
    const d = new Date(bookingDate || Date.now());
    if (isCustomDuration) {
      const val = Number(customDurationValue || 1);
      if (customDurationUnit === "days") d.setDate(d.getDate() + val);
      else if (customDurationUnit === "weeks") d.setDate(d.getDate() + val * 7);
      else if (customDurationUnit === "months") d.setMonth(d.getMonth() + val);
      else if (customDurationUnit === "years") d.setFullYear(d.getFullYear() + val);
    } else {
      if (leaseDuration.includes("1 Day")) d.setDate(d.getDate() + 1);
      else if (leaseDuration.includes("2 Days")) d.setDate(d.getDate() + 2);
      else if (leaseDuration.includes("3 Days")) d.setDate(d.getDate() + 3);
      else if (leaseDuration.includes("1 Week")) d.setDate(d.getDate() + 7);
      else if (leaseDuration.includes("1 Month")) d.setMonth(d.getMonth() + 1);
      else if (leaseDuration.includes("6 Months")) d.setMonth(d.getMonth() + 6);
      else if (leaseDuration.includes("2 Years")) d.setFullYear(d.getFullYear() + 2);
      else if (leaseDuration.includes("3 Years")) d.setFullYear(d.getFullYear() + 3);
      else d.setFullYear(d.getFullYear() + 1);
    }
    return d.toISOString().split("T")[0];
  };

  const getEffectiveDurationText = () => {
    if (isCustomDuration) {
      const val = Number(customDurationValue || 1);
      const unit = val === 1 ? customDurationUnit.replace(/s$/, "") : customDurationUnit;
      return `${val} ${unit.charAt(0).toUpperCase() + unit.slice(1)} ${val <= 7 && customDurationUnit === "days" ? "(Tour Stay)" : ""}`.trim();
    }
    return leaseDuration;
  };
  const [timeSlot, setTimeSlot] = useState("11:00 AM - 12:00 PM");
  const [bookingType, setBookingType] = useState("in_person");
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userPhone, setUserPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(true);
  const [userAnswer, setUserAnswer] = useState<"yes" | "no">("yes");
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

  // Landlord Direct Message State
  const [showMessageForm, setShowMessageForm] = useState(false);
  const [msgSubject, setMsgSubject] = useState("General Inquiry");
  const [msgSenderName, setMsgSenderName] = useState("");
  const [msgSenderEmail, setMsgSenderEmail] = useState("");
  const [msgSenderPhone, setMsgSenderPhone] = useState("");
  const [msgContent, setMsgContent] = useState("");
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [msgSuccess, setMsgSuccess] = useState<string | null>(null);
  const [msgError, setMsgError] = useState<string | null>(null);

  // Complaint Filing State
  const [showComplaintForm, setShowComplaintForm] = useState(false);
  const [complaintCategory, setComplaintCategory] = useState("Maintenance / Repairs");
  const [complaintTitle, setComplaintTitle] = useState("");
  const [complaintDescription, setComplaintDescription] = useState("");
  const [complaintSenderName, setComplaintSenderName] = useState("");
  const [complaintSenderEmail, setComplaintSenderEmail] = useState("");
  const [complaintSenderPhone, setComplaintSenderPhone] = useState("");
  const [isSubmittingComplaint, setIsSubmittingComplaint] = useState(false);
  const [complaintSuccess, setComplaintSuccess] = useState<string | null>(null);
  const [complaintError, setComplaintError] = useState<string | null>(null);
  const [isReservedByUser, setIsReservedByUser] = useState(false);

  useEffect(() => {
    const list = getStoredProperties();
    const found = list.find((p) => p.id === id) || null;
    setProperty(found);
    setIsLoading(false);

    // Check if current user has reserved this property
    if (typeof window !== "undefined") {
      try {
        const reservedList = JSON.parse(localStorage.getItem("havenkey_reserved_properties") || "[]");
        if (Array.isArray(reservedList) && reservedList.includes(id)) {
          setIsReservedByUser(true);
        }
      } catch (e) {
        // ignore
      }
    }

    // Fetch live status & data from Supabase API to ensure up-to-date availability
    fetch(`/api/properties/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setProperty((prev) => {
            if (!prev) return data.data;
            return {
              ...prev,
              status: data.data.status || prev.status,
              title: data.data.title || prev.title,
              price: data.data.price || prev.price,
            };
          });
        }
      })
      .catch((err) => console.warn("Failed to fetch live property status:", err));

    // Auto-prefill authenticated user details from localStorage
    if (typeof window !== "undefined") {
      try {
        const storedUser = localStorage.getItem("havenkey_user");
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          if (parsed.fullname || parsed.name) {
            setUserName(parsed.fullname || parsed.name);
            setMsgSenderName(parsed.fullname || parsed.name);
            setComplaintSenderName(parsed.fullname || parsed.name);
          }
          if (parsed.email) {
            setUserEmail(parsed.email);
            setMsgSenderEmail(parsed.email);
            setComplaintSenderEmail(parsed.email);
          }
          if (parsed.phone_no || parsed.phone) {
            setUserPhone(parsed.phone_no || parsed.phone);
            setMsgSenderPhone(parsed.phone_no || parsed.phone);
            setComplaintSenderPhone(parsed.phone_no || parsed.phone);
          }
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
    if (userAnswer !== "yes") {
      setBookingError("Please select 'YES — I agree & confirm' to proceed with your booking reservation.");
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

      // Calculate dynamic lease/stay end date (supports 1 day tour, custom days, etc.)
      const finalDuration = getEffectiveDurationText();
      const calculatedEndDate = getCalculatedEndDate();

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
          duration: finalDuration,
          monthlyRent: rentAmount,
          securityDeposit: depositVal,
          tokenAmount: isRent ? undefined : depositVal,
          timeSlot,
          notes,
          agreedToTerms,
          userAnswer,
          userId: currentUserId,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to confirm booking.");
      }

      setBookingSuccess(true);
      setBookingResult(json.booking);
      setIsReservedByUser(true);

      // Immediately set property status to 'not available' in local state
      setProperty((prev) => (prev ? { ...prev, status: "not available" as any } : null));

      // Record reserved property in user's localStorage
      try {
        const reservedList = JSON.parse(localStorage.getItem("havenkey_reserved_properties") || "[]");
        if (!reservedList.includes(id)) {
          reservedList.push(id);
          localStorage.setItem("havenkey_reserved_properties", JSON.stringify(reservedList));
        }

        if (currentUserId) {
          const userKey = `havenkey_reserved_${currentUserId}`;
          const userReserved = JSON.parse(localStorage.getItem(userKey) || "[]");
          if (!userReserved.includes(id)) {
            userReserved.push(id);
            localStorage.setItem(userKey, JSON.stringify(userReserved));
          }
        }

        // Store rich reservation metadata with custom duration for /reservations
        const rawMap = localStorage.getItem("havenkey_reserved_metadata") || "{}";
        const metaMap = JSON.parse(rawMap);
        metaMap[id] = {
          id,
          title: property?.title,
          location: property?.location || property?.address,
          price: property?.price,
          startDate: bookingDate,
          endDate: calculatedEndDate,
          duration: finalDuration,
        };
        localStorage.setItem("havenkey_reserved_metadata", JSON.stringify(metaMap));
      } catch (e) {
        // ignore
      }

      // Update localStorage so other pages/views reflect 'not available'
      try {
        const allProps = getStoredProperties();
        const updated = allProps.map((p) =>
          p.id === id ? { ...p, status: "not available" as any } : p
        );
        saveStoredProperties(updated);
      } catch (e) {
        console.warn("Failed to update localStorage:", e);
      }
    } catch (err: any) {
      setBookingError(err.message || "An error occurred while booking. Please try again.");
    } finally {
      setIsSubmittingBooking(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsgError(null);
    setMsgSuccess(null);

    const name = (msgSenderName || userName || "").trim();
    const email = (msgSenderEmail || userEmail || "").trim();
    const phone = (msgSenderPhone || userPhone || "").trim();

    if (!name) {
      setMsgError("Please enter your name.");
      return;
    }
    if (!email || !email.includes("@")) {
      setMsgError("Please enter a valid email address.");
      return;
    }
    if (!msgContent.trim() || msgContent.trim().length < 5) {
      setMsgError("Please write a message of at least 5 characters.");
      return;
    }

    setIsSendingMessage(true);
    try {
      const res = await fetch("/api/properties/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: id,
          propertyTitle: property?.title,
          ownerName: landlordName,
          ownerEmail: landlordEmail,
          senderName: name,
          senderEmail: email,
          senderPhone: phone,
          subject: msgSubject,
          message: msgContent,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to send message to owner.");
      }

      setMsgSuccess(data.message || "Your message was delivered to the owner successfully!");
      setMsgContent("");
    } catch (err: any) {
      setMsgError(err.message || "Could not send message. Please try again.");
    } finally {
      setIsSendingMessage(false);
    }
  };

  const handleComplaintSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setComplaintError(null);
    setComplaintSuccess(null);

    const name = (complaintSenderName || userName || "").trim();
    const email = (complaintSenderEmail || userEmail || "").trim();
    const phone = (complaintSenderPhone || userPhone || "").trim();
    const title = complaintTitle.trim();
    const desc = complaintDescription.trim();

    if (!name) {
      setComplaintError("Please enter your name.");
      return;
    }
    if (!email || !email.includes("@")) {
      setComplaintError("Please enter a valid email address.");
      return;
    }
    if (!title || title.length < 3) {
      setComplaintError("Please provide a subject for the complaint.");
      return;
    }
    if (!desc || desc.length < 5) {
      setComplaintError("Please provide a detailed description of the issue.");
      return;
    }

    setIsSubmittingComplaint(true);
    try {
      const res = await fetch("/api/complaints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: id,
          propertyTitle: property?.title,
          ownerName: landlordName,
          ownerEmail: landlordEmail,
          userName: name,
          userEmail: email,
          userPhone: phone,
          category: complaintCategory,
          title: title,
          description: desc,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to submit complaint.");
      }

      setComplaintSuccess(
        data.message || "Your complaint ticket has been filed and sent to the owner."
      );
      setComplaintTitle("");
      setComplaintDescription("");
    } catch (err: any) {
      setComplaintError(err.message || "Could not submit complaint. Please try again.");
    } finally {
      setIsSubmittingComplaint(false);
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
                {property.status === "not available" ? (
                  <span className="px-2.5 py-1 bg-amber-100 text-amber-800 rounded-md text-xs font-bold tracking-wide uppercase flex items-center gap-1 border border-amber-200">
                    <span className="material-symbols-outlined text-[13px]">lock</span>
                    Reserved (Booked)
                  </span>
                ) : (
                  <span className="px-2.5 py-1 bg-[#a1f1e9] text-[#076a64] rounded-md text-xs font-semibold tracking-wide uppercase">
                    {property.status || "available"}
                  </span>
                )}
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

              {/* Biometric Landlord Profile & Contact / Message Card */}
              <div className="bg-white p-6 rounded-xl border border-[#e7e8ea] shadow-sm">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-[#172b4d] text-white flex items-center justify-center text-lg font-bold shrink-0">
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
                        Direct Property Owner &bull; Rating: {landlordRating} / 5.0 ★
                      </p>
                      <p className="text-xs text-[#75777f] mt-0.5">
                        ID: NADRA CNIC Verified &bull; Registered Escrow
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
                    <button
                      type="button"
                      onClick={() => {
                        setShowMessageForm(!showMessageForm);
                        if (showComplaintForm) setShowComplaintForm(false);
                      }}
                      className="flex-1 sm:flex-initial px-4 py-2.5 bg-[#076a64] hover:bg-[#00201e] text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        {showMessageForm ? "expand_less" : "chat"}
                      </span>
                      {showMessageForm ? "Close Form" : "Send Message"}
                    </button>

                    {/* ONLY display Complaint option if property is reserved by this user */}
                    {(isReservedByUser || bookingSuccess) && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowComplaintForm(!showComplaintForm);
                          if (showMessageForm) setShowMessageForm(false);
                        }}
                        className="flex-1 sm:flex-initial px-4 py-2.5 bg-[#ba1a1a] hover:bg-[#93000a] text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                      >
                        <span className="material-symbols-outlined text-[16px]">
                          {showComplaintForm ? "expand_less" : "report_problem"}
                        </span>
                        {showComplaintForm ? "Close Form" : "File Complaint"}
                      </button>
                    )}
                  </div>
                </div>

                {/* Direct Contact Info Strip */}
                <div className="mt-4 pt-4 border-t border-[#e7e8ea] grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-[#f8f9fb] p-3.5 rounded-lg border border-[#e7e8ea]">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-[#076a64]/10 text-[#076a64] flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[16px]">phone_iphone</span>
                    </div>
                    <div>
                      <span className="text-[#75777f] text-[11px] block">Direct Phone / WhatsApp:</span>
                      <a
                        href={`tel:${landlordPhone}`}
                        className="font-semibold text-[#001637] hover:text-[#076a64] transition-colors font-mono"
                      >
                        {landlordPhone}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-[#076a64]/10 text-[#076a64] flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[16px]">mail</span>
                    </div>
                    <div>
                      <span className="text-[#75777f] text-[11px] block">Direct Email:</span>
                      <a
                        href={`mailto:${landlordEmail}`}
                        className="font-semibold text-[#001637] hover:text-[#076a64] transition-colors truncate max-w-[210px] block"
                      >
                        {landlordEmail}
                      </a>
                    </div>
                  </div>
                </div>

                {/* Send Message Form */}
                {showMessageForm && (
                  <form onSubmit={handleSendMessage} className="mt-5 pt-4 border-t border-[#e7e8ea] space-y-3 bg-[#ffffff] p-4 rounded-xl border border-[#a1f1e9]/60 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="text-sm font-bold text-[#001637] font-plus-jakarta flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[18px] text-[#076a64]">chat</span>
                          Send Message to {landlordName}
                        </h5>
                        <p className="text-[11px] text-[#75777f]">
                          Regarding: {property.title}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowMessageForm(false)}
                        className="text-[#75777f] hover:text-[#001637] text-xs flex items-center"
                      >
                        <span className="material-symbols-outlined text-[18px]">close</span>
                      </button>
                    </div>

                    {msgSuccess && (
                      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-start gap-2">
                        <span className="material-symbols-outlined text-[16px] text-emerald-600 mt-0.5 shrink-0">check_circle</span>
                        <span>{msgSuccess}</span>
                      </div>
                    )}

                    {msgError && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-start gap-2">
                        <span className="material-symbols-outlined text-[16px] text-red-600 mt-0.5 shrink-0">error</span>
                        <span>{msgError}</span>
                      </div>
                    )}

                    {/* Quick Topic Chips */}
                    <div>
                      <label className="text-[11px] font-semibold text-[#44474e] block mb-1">
                        Select Inquiry Topic:
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          "Is this property still available?",
                          "I would like to schedule a private tour",
                          "Rent & Security deposit inquiry",
                          "Are tenancy terms negotiable?",
                        ].map((topic) => (
                          <button
                            key={topic}
                            type="button"
                            onClick={() => {
                              setMsgSubject(topic);
                              if (!msgContent) {
                                setMsgContent(`Hello ${landlordName}, I am interested in ${property.title}. ${topic}. Please connect with me.`);
                              }
                            }}
                            className={`px-2.5 py-1 text-[11px] rounded-full border transition-all ${
                              msgSubject === topic
                                ? "bg-[#076a64] text-white border-[#076a64] font-semibold"
                                : "bg-[#f2f4f6] text-[#44474e] border-[#e7e8ea] hover:bg-white"
                            }`}
                          >
                            {topic}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div>
                        <label className="text-[11px] font-semibold text-[#44474e] block mb-1">
                          Your Name
                        </label>
                        <input
                          type="text"
                          value={msgSenderName}
                          onChange={(e) => setMsgSenderName(e.target.value)}
                          placeholder="Your full name"
                          required
                          className="w-full h-9 px-2.5 bg-[#f2f4f6] text-xs text-[#191c1e] rounded-lg border border-[#e7e8ea] focus:outline-none focus:border-[#076a64]"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-[#44474e] block mb-1">
                          Your Email
                        </label>
                        <input
                          type="email"
                          value={msgSenderEmail}
                          onChange={(e) => setMsgSenderEmail(e.target.value)}
                          placeholder="your.email@example.com"
                          required
                          className="w-full h-9 px-2.5 bg-[#f2f4f6] text-xs text-[#191c1e] rounded-lg border border-[#e7e8ea] focus:outline-none focus:border-[#076a64]"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-[#44474e] block mb-1">
                          Phone / WhatsApp <span className="text-gray-400 font-normal">(optional)</span>
                        </label>
                        <input
                          type="tel"
                          value={msgSenderPhone}
                          onChange={(e) => setMsgSenderPhone(e.target.value)}
                          placeholder="+92 300 0000000"
                          className="w-full h-9 px-2.5 bg-[#f2f4f6] text-xs text-[#191c1e] rounded-lg border border-[#e7e8ea] focus:outline-none focus:border-[#076a64]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-[#44474e] block mb-1">
                        Your Message to {landlordName}
                      </label>
                      <textarea
                        rows={3}
                        value={msgContent}
                        onChange={(e) => setMsgContent(e.target.value)}
                        placeholder={`Write your inquiry for ${landlordName}...`}
                        required
                        className="w-full p-2.5 bg-[#f2f4f6] text-xs text-[#191c1e] rounded-lg border border-[#e7e8ea] focus:outline-none focus:border-[#076a64] resize-none"
                      />
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] text-[#75777f]">
                        The owner will receive this directly in their email inbox.
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setShowMessageForm(false)}
                          className="px-3.5 py-1.5 bg-[#f2f4f6] hover:bg-[#edeef0] text-[#44474e] text-xs font-semibold rounded-lg transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isSendingMessage}
                          className="px-4 py-1.5 bg-[#076a64] hover:bg-[#00201e] disabled:opacity-60 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
                        >
                          {isSendingMessage ? (
                            <>
                              <span className="material-symbols-outlined text-[15px] animate-spin">progress_activity</span>
                              <span>Sending...</span>
                            </>
                          ) : (
                            <>
                              <span className="material-symbols-outlined text-[15px]">send</span>
                              <span>Send Message</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </form>
                )}

                {/* File Complaint Form (Only if reserved by this user) */}
                {(isReservedByUser || bookingSuccess) && showComplaintForm && (
                  <form onSubmit={handleComplaintSubmit} className="mt-5 pt-4 border-t border-[#e7e8ea] space-y-3 bg-[#fff8f7] p-4 sm:p-5 rounded-xl border border-[#ffdad6] shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="text-sm font-bold text-[#ba1a1a] font-plus-jakarta flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[18px] text-[#ba1a1a]">report_problem</span>
                          File a Complaint to {landlordName}
                        </h5>
                        <p className="text-[11px] text-[#75777f]">
                          Regarding: {property.title} &bull; Directly dispatched to owner email
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowComplaintForm(false)}
                        className="text-[#75777f] hover:text-[#001637] text-xs flex items-center"
                      >
                        <span className="material-symbols-outlined text-[18px]">close</span>
                      </button>
                    </div>

                    {complaintSuccess && (
                      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-start gap-2">
                        <span className="material-symbols-outlined text-[16px] text-emerald-600 mt-0.5 shrink-0">check_circle</span>
                        <div>
                          <strong className="block font-semibold">Complaint Registered &amp; Dispatched!</strong>
                          <span>{complaintSuccess}</span>
                        </div>
                      </div>
                    )}

                    {complaintError && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-start gap-2">
                        <span className="material-symbols-outlined text-[16px] text-red-600 mt-0.5 shrink-0">error</span>
                        <span>{complaintError}</span>
                      </div>
                    )}

                    {/* Complaint Category Chips */}
                    <div>
                      <label className="text-[11px] font-semibold text-[#44474e] block mb-1">
                        Select Complaint / Issue Category:
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          "Maintenance & Repairs",
                          "Plumbing & Water Leakage",
                          "Electrical & Power",
                          "HVAC & Cooling",
                          "Structural Damage",
                          "Security & Locks",
                          "Noise & Neighbors",
                          "Tenancy / Deposit Terms",
                        ].map((cat) => (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => setComplaintCategory(cat)}
                            className={`px-2.5 py-1 text-[11px] rounded-full border transition-all ${
                              complaintCategory === cat
                                ? "bg-[#ba1a1a] text-white border-[#ba1a1a] font-semibold shadow-xs"
                                : "bg-white text-[#44474e] border-[#e7e8ea] hover:bg-[#f2f4f6]"
                            }`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-[#44474e] block mb-1">
                        Complaint Subject / Headline *
                      </label>
                      <input
                        type="text"
                        value={complaintTitle}
                        onChange={(e) => setComplaintTitle(e.target.value)}
                        placeholder="e.g. Broken water heater in main bathroom / Electrical socket sparks"
                        required
                        className="w-full h-9 px-2.5 bg-white text-xs text-[#191c1e] rounded-lg border border-[#e7e8ea] focus:outline-none focus:border-[#ba1a1a]"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div>
                        <label className="text-[11px] font-semibold text-[#44474e] block mb-1">
                          Your Name *
                        </label>
                        <input
                          type="text"
                          value={complaintSenderName}
                          onChange={(e) => setComplaintSenderName(e.target.value)}
                          placeholder="Your full name"
                          required
                          className="w-full h-9 px-2.5 bg-white text-xs text-[#191c1e] rounded-lg border border-[#e7e8ea] focus:outline-none focus:border-[#ba1a1a]"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-[#44474e] block mb-1">
                          Your Email *
                        </label>
                        <input
                          type="email"
                          value={complaintSenderEmail}
                          onChange={(e) => setComplaintSenderEmail(e.target.value)}
                          placeholder="your.email@example.com"
                          required
                          className="w-full h-9 px-2.5 bg-white text-xs text-[#191c1e] rounded-lg border border-[#e7e8ea] focus:outline-none focus:border-[#ba1a1a]"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-[#44474e] block mb-1">
                          Phone / WhatsApp <span className="text-gray-400 font-normal">(optional)</span>
                        </label>
                        <input
                          type="tel"
                          value={complaintSenderPhone}
                          onChange={(e) => setComplaintSenderPhone(e.target.value)}
                          placeholder="+92 300 0000000"
                          className="w-full h-9 px-2.5 bg-white text-xs text-[#191c1e] rounded-lg border border-[#e7e8ea] focus:outline-none focus:border-[#ba1a1a]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-[#44474e] block mb-1">
                        Detailed Description of Complaint / Issue *
                      </label>
                      <textarea
                        rows={3}
                        value={complaintDescription}
                        onChange={(e) => setComplaintDescription(e.target.value)}
                        placeholder={`Please describe the issue in detail so ${landlordName} can take immediate corrective action...`}
                        required
                        className="w-full p-2.5 bg-white text-xs text-[#191c1e] rounded-lg border border-[#e7e8ea] focus:outline-none focus:border-[#ba1a1a] resize-none"
                      />
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] text-[#75777f]">
                        A formal complaint ticket will be recorded in Supabase and sent to {landlordEmail}.
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setShowComplaintForm(false)}
                          className="px-3.5 py-1.5 bg-[#f2f4f6] hover:bg-[#edeef0] text-[#44474e] text-xs font-semibold rounded-lg transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isSubmittingComplaint}
                          className="px-4 py-1.5 bg-[#ba1a1a] hover:bg-[#93000a] disabled:opacity-60 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
                        >
                          {isSubmittingComplaint ? (
                            <>
                              <span className="material-symbols-outlined text-[15px] animate-spin">progress_activity</span>
                              <span>Submitting...</span>
                            </>
                          ) : (
                            <>
                              <span className="material-symbols-outlined text-[15px]">send</span>
                              <span>Submit Complaint</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </form>
                )}
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

                  <div className="p-3 bg-[#e6f7f6] rounded-lg text-left text-[11px] text-[#076a64] flex items-start gap-2 mb-3 border border-[#a1f1e9]">
                    <span className="material-symbols-outlined text-[16px] shrink-0 mt-0.5">verified</span>
                    <div>
                      <p className="font-semibold text-[#001637] mb-0.5">
                        Verification email dispatched to {userEmail}
                      </p>
                      <p className="text-[#44474e] leading-relaxed">
                        Please check your <strong>Primary Inbox</strong> as well as your <strong>Spam / Junk folder</strong>. You can also verify or cancel directly using the link below:
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 mb-3">
                    <a
                      href={`/bookings/verify?id=${bookingResult?.bookingId || bookingResult?.id || id}&action=yes&propertyId=${id}`}
                      className="w-full py-2.5 bg-[#076a64] hover:bg-[#05514c] text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <span className="material-symbols-outlined text-[16px]">task_alt</span>
                      Verify &amp; Confirm Booking Online
                    </a>
                    <a
                      href="/reservations"
                      className="w-full py-2 bg-white hover:bg-[#f2f4f6] text-[#076a64] border border-[#076a64] text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[15px]">inventory_2</span>
                      View In My Reservations
                    </a>
                  </div>

                  <button
                    onClick={() => setBookingSuccess(false)}
                    className="w-full py-2 bg-[#f2f4f6] hover:bg-[#edeef0] text-[#75777f] text-xs font-medium rounded-lg transition-colors"
                  >
                    Modify / Make Another Booking
                  </button>
                </div>
              ) : property.status === "not available" ? (
                <div className="text-center py-6">
                  <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-200">
                    <span className="material-symbols-outlined text-[32px]">lock</span>
                  </div>
                  <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-bold tracking-wide uppercase inline-block mb-2">
                    Listing Reserved
                  </span>
                  <h3 className="text-lg font-bold text-[#001637] font-plus-jakarta mb-1.5">
                    Property Currently Reserved
                  </h3>
                  <p className="text-xs text-[#44474e] mb-5 leading-relaxed">
                    This property has already been reserved. Online bookings are currently closed for this listing.
                  </p>
                  <Link
                    href="/properties"
                    className="w-full py-2.5 bg-[#001637] hover:bg-[#172b4d] text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                  >
                    <span className="material-symbols-outlined text-[16px]">search</span>
                    Browse Available Properties
                  </Link>
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
                        <CustomDropdown
                          value={bookingType}
                          onChange={setBookingType}
                          options={bookingTypesList.map((t) => ({
                            value: t.slug,
                            label: t.type_name,
                            icon: "tour",
                          }))}
                          icon="apartment"
                        />
                      </div>
                    )}

                    {/* Dates Configuration */}
                    {bookingMode === "booking" && transaction === "rent" ? (
                      <>
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
                              className="w-full h-10 px-2.5 bg-[#f2f4f6] text-xs text-[#191c1e] rounded-xl border border-[#e7e8ea] focus:outline-none focus:border-[#076a64]"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-[#44474e] block mb-1">
                              Stay / Tour Duration
                            </label>
                            <CustomDropdown
                              value={isCustomDuration ? "custom" : leaseDuration}
                              onChange={(val) => {
                                if (val === "custom") {
                                  setIsCustomDuration(true);
                                } else {
                                  setIsCustomDuration(false);
                                  setLeaseDuration(val);
                                }
                              }}
                              options={[
                                { value: "1 Day", label: "1 Day" },
                                { value: "2 Days", label: "2 Days" },
                                { value: "3 Days", label: "3 Days" },
                                { value: "1 Week", label: "1 Week" },
                                { value: "1 Month", label: "1 Month" },
                                { value: "6 Months", label: "6 Months" },
                                { value: "1 Year", label: "1 Year" },
                                { value: "custom", label: "Enter Duration Manually" },
                              ]}
                            />
                          </div>
                        </div>

                        {/* Manual / Custom Duration Inputs (1 day, 3 days, custom days, etc.) */}
                        {isCustomDuration && (
                          <div className="p-3 bg-[#e6f7f6]/70 rounded-xl border border-[#a1f1e9] space-y-2 mt-1">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-bold text-[#076a64] flex items-center gap-1">
                                <span className="material-symbols-outlined text-[15px]">edit_calendar</span>
                                Manual Duration (Tour or Custom Stay)
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setIsCustomDuration(false);
                                  setLeaseDuration("1 Day");
                                }}
                                className="text-[10px] text-[#75777f] hover:text-[#001637] underline"
                              >
                                Reset
                              </button>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="text-[10px] font-semibold text-[#44474e] block mb-0.5">
                                  Enter Number
                                </label>
                                <input
                                  type="number"
                                  min={1}
                                  max={365}
                                  value={customDurationValue}
                                  onChange={(e) => setCustomDurationValue(Math.max(1, parseInt(e.target.value) || 1))}
                                  className="w-full h-10 px-2.5 bg-white text-xs text-[#191c1e] rounded-xl border border-[#e7e8ea] focus:outline-none focus:border-[#076a64]"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] font-semibold text-[#44474e] block mb-0.5">
                                  Unit
                                </label>
                                <CustomDropdown
                                  value={customDurationUnit}
                                  onChange={(val) => setCustomDurationUnit(val as any)}
                                  buttonClassName="!bg-white"
                                  options={[
                                    { value: "days", label: "Days" },
                                    { value: "weeks", label: "Weeks" },
                                    { value: "months", label: "Months" },
                                    { value: "years", label: "Years" },
                                  ]}
                                />
                              </div>
                            </div>

                            <div className="text-[11px] text-[#076a64] font-medium flex items-center justify-between pt-1 border-t border-[#a1f1e9]/60">
                              <span>Stay: <strong>{getEffectiveDurationText()}</strong></span>
                              <span>Departure / Auto-Unreserve: <strong>{getCalculatedEndDate()}</strong></span>
                            </div>
                          </div>
                        )}
                      </>
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
                          className="w-full h-10 px-3 bg-[#f2f4f6] text-xs text-[#191c1e] rounded-xl border border-[#e7e8ea] focus:outline-none focus:border-[#076a64]"
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
                            className="w-full h-10 px-2.5 bg-[#f2f4f6] text-xs text-[#191c1e] rounded-xl border border-[#e7e8ea] focus:outline-none focus:border-[#076a64]"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-[#44474e] block mb-1">
                            Preferred Slot
                          </label>
                          <CustomDropdown
                            value={timeSlot}
                            onChange={setTimeSlot}
                            options={[
                              { value: "11:00 AM - 12:00 PM", label: "11:00 AM - 12:00 PM", icon: "wb_sunny" },
                              { value: "02:00 PM - 03:00 PM", label: "02:00 PM - 03:00 PM", icon: "light_mode" },
                              { value: "04:30 PM - 05:30 PM", label: "04:30 PM - 05:30 PM", icon: "wb_twilight" },
                              { value: "06:00 PM - 07:00 PM", label: "06:00 PM - 07:00 PM", icon: "dark_mode" },
                            ]}
                            icon="schedule"
                          />
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

                    {/* User Decision Confirmation: Yes or No */}
                    <div className="p-3 bg-[#e6f7f6] rounded-lg border border-[#a1f1e9] text-xs">
                      <label className="font-semibold text-[#001637] block mb-1.5">
                        Do you confirm this booking agreement?
                      </label>
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-1.5 cursor-pointer font-bold text-[#076a64]">
                          <input
                            type="radio"
                            name="userConfirmChoice"
                            value="yes"
                            checked={userAnswer === "yes"}
                            onChange={() => setUserAnswer("yes")}
                            className="text-[#076a64] focus:ring-[#076a64]"
                          />
                          <span>YES — I agree &amp; confirm</span>
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer font-bold text-[#ba1a1a]">
                          <input
                            type="radio"
                            name="userConfirmChoice"
                            value="no"
                            checked={userAnswer === "no"}
                            onChange={() => setUserAnswer("no")}
                            className="text-[#ba1a1a] focus:ring-[#ba1a1a]"
                          />
                          <span>NO — Cancel</span>
                        </label>
                      </div>
                      {userAnswer === "no" && (
                        <p className="text-[11px] text-[#ba1a1a] mt-1.5 font-medium">
                          You selected NO. The property will not be booked and remains available.
                        </p>
                      )}
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
                      disabled={isSubmittingBooking || !agreedToTerms || userAnswer === "no"}
                      className="w-full h-11 bg-[#076a64] hover:bg-[#00201e] disabled:opacity-60 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-all shadow-sm mt-1"
                    >
                      {isSubmittingBooking ? (
                        <>
                          <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                          <span>Confirming Booking &amp; Sending Emails...</span>
                        </>
                      ) : userAnswer === "no" ? (
                        <>
                          <span className="material-symbols-outlined text-[18px]">block</span>
                          <span>Booking Declined (Select YES to proceed)</span>
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
