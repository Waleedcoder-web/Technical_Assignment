"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import { Property, getStoredProperties } from "@/lib/mock-data";

export default function PropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [property, setProperty] = useState<Property | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const list = getStoredProperties();
    const found = list.find((p) => p.id === id) || null;
    setProperty(found);
    setIsLoading(false);
  }, [id]);

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
  const heroImage = property.imageUrl || property.image_url || "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80";
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

            {/* Right Sticky Sidebar: Viewing Scheduler */}
            <div className="lg:col-span-4 sticky top-28 bg-white p-6 rounded-xl border border-[#e7e8ea] shadow-md">
              <h3 className="text-lg font-bold text-[#001637] font-plus-jakarta mb-1">
                Schedule a Private Viewing
              </h3>
              <p className="text-xs text-[#44474e] mb-5">
                Book an in-person or live video tour directly with verified HavenKey concierges.
              </p>

              <form className="flex flex-col gap-4">
                <div>
                  <label className="text-xs font-semibold text-[#44474e] block mb-1">
                    Select Viewing Date
                  </label>
                  <input
                    type="date"
                    defaultValue="2026-11-08"
                    className="w-full h-10 px-3 bg-[#f2f4f6] text-xs text-[#191c1e] rounded-lg border border-[#e7e8ea] focus:outline-none focus:border-[#076a64]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#44474e] block mb-1">
                    Preferred Time Slot
                  </label>
                  <select className="w-full h-10 px-3 bg-[#f2f4f6] text-xs text-[#191c1e] rounded-lg border border-[#e7e8ea] focus:outline-none focus:border-[#076a64]">
                    <option>11:00 AM - 12:00 PM</option>
                    <option>02:00 PM - 03:00 PM</option>
                    <option>04:30 PM - 05:30 PM</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#44474e] block mb-1">
                    Your Name
                  </label>
                  <input
                    type="text"
                    defaultValue="Waleed Hassan"
                    className="w-full h-10 px-3 bg-[#f2f4f6] text-xs text-[#191c1e] rounded-lg border border-[#e7e8ea] focus:outline-none focus:border-[#076a64]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#44474e] block mb-1">
                    Phone / WhatsApp
                  </label>
                  <input
                    type="tel"
                    defaultValue="+92 300 0000000"
                    className="w-full h-10 px-3 bg-[#f2f4f6] text-xs text-[#191c1e] rounded-lg border border-[#e7e8ea] focus:outline-none focus:border-[#076a64]"
                  />
                </div>

                <button
                  type="button"
                  className="w-full h-11 bg-[#076a64] hover:bg-[#00201e] text-white text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition-all shadow-sm mt-2"
                >
                  <span className="material-symbols-outlined text-[18px]">calendar_month</span>
                  Confirm Tour Booking
                </button>

                <div className="p-3 bg-[#f2f4f6] rounded-lg flex items-start gap-2 text-[11px] text-[#44474e]">
                  <span className="material-symbols-outlined text-[16px] text-[#076a64] shrink-0 mt-0.5">
                    verified
                  </span>
                  <span>
                    Your tour booking is protected by HavenKey zero-brokerage &amp; escrow guarantee.
                  </span>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
