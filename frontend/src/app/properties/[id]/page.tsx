import Link from "next/link";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import { mockProperties } from "@/lib/mock-data";
import { notFound } from "next/navigation";

export function generateStaticParams() {
  return mockProperties.map((property) => ({
    id: property.id,
  }));
}

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const property = mockProperties.find((p) => p.id === id) || mockProperties[0];

  if (!property) {
    notFound();
  }

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
                  {property.transactionType === "rent" ? "For Rent" : "For Sale"}
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
              </div>
            </div>

            {/* Price Box */}
            <div className="flex items-baseline lg:items-end flex-col bg-white p-4 rounded-xl border border-[#e7e8ea] shadow-sm">
              <span className="text-xs uppercase text-[#44474e] font-semibold">
                {property.transactionType === "rent" ? "Monthly Rental Rate" : "Asking Price"}
              </span>
              <p className="text-2xl sm:text-3xl font-bold text-[#001637] font-plus-jakarta mt-0.5">
                {property.priceFormatted}{" "}
                {property.pricePeriod && (
                  <span className="text-sm font-normal text-[#44474e]">
                    {property.pricePeriod}
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Gallery Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-8">
            <div className="lg:col-span-8 rounded-2xl overflow-hidden aspect-[16/10] bg-[#edeef0] border border-[#e7e8ea] shadow-sm">
              <img
                src={property.imageUrl}
                alt={property.imageAlt}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="lg:col-span-4 flex flex-col gap-4">
              <div className="rounded-xl overflow-hidden flex-1 bg-[#edeef0] border border-[#e7e8ea] shadow-sm">
                <img
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAExGAZu9bjGZfBZuKeg2v80L2uTkQN5uPxYd5OvjIX4vnFIJ7swxpQLQaPoACbCFAgRrQckFPI4nAtLvyLf62LN9hlpd9e2EJf81POrnesjp7uGz1g4-jeZ-pt0A5it-gAtDzruihO5Jfv2TwTfNg1HjBvpAoPIP2OTvDjOw2j-v79E2qGB2mc4cSo3xoyboDl8FJaT1QsH5xdQdgboB6bwRLI6sh2R_q6Xe3NUTQ"
                  alt="Interior architecture"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="rounded-xl overflow-hidden flex-1 bg-[#edeef0] border border-[#e7e8ea] shadow-sm relative group cursor-pointer">
                <img
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCJhKcNxUOfL6-Y4VmklswhpN0T0BXa_7MfbvcOcA5ynslw0iREIolQCg_woiKUWRSAWhcxFwOaeVFl4M0-Ul2QyzS8a-YluVBY2ivvU2ac1ZS4lj-btoPXwJiZ4YlqA4h2N_dY18SNcU5TowTmuO_pyVKdle4tpBZZkosdMnngjk7p3ljDWbVhTIoFJzVQq127w1BtEl890dYNFicQNJm4blcwVmo9hCOak_sODp4"
                  alt="Balcony view"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-[#001637]/60 flex items-center justify-center text-white text-sm font-semibold gap-2 backdrop-blur-xs">
                  <span className="material-symbols-outlined text-[20px]">photo_library</span>
                  View All 18 Photos
                </div>
              </div>
            </div>
          </div>

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
                    <p className="text-base font-bold text-[#001637]">{property.beds} Master Beds</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#f2f4f6] flex items-center justify-center text-[#076a64]">
                    <span className="material-symbols-outlined text-[22px]">bathtub</span>
                  </div>
                  <div>
                    <span className="text-xs text-[#44474e]">Bathrooms</span>
                    <p className="text-base font-bold text-[#001637]">{property.baths} Baths</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#f2f4f6] flex items-center justify-center text-[#076a64]">
                    <span className="material-symbols-outlined text-[22px]">straighten</span>
                  </div>
                  <div>
                    <span className="text-xs text-[#44474e]">Plot / Size</span>
                    <p className="text-base font-bold text-[#001637]">{property.size}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#f2f4f6] flex items-center justify-center text-[#076a64]">
                    <span className="material-symbols-outlined text-[22px]">verified_user</span>
                  </div>
                  <div>
                    <span className="text-xs text-[#44474e]">Landlord KYC</span>
                    <p className="text-base font-bold text-[#076a64]">Passed 100%</p>
                  </div>
                </div>
              </div>

              {/* Architectural Description */}
              <div className="bg-white p-6 rounded-xl border border-[#e7e8ea] shadow-sm">
                <h3 className="text-lg font-bold text-[#001637] font-plus-jakarta mb-3">
                  Property Overview &amp; Architectural Summary
                </h3>
                <p className="text-sm text-[#44474e] leading-relaxed">
                  {property.description} Designed with modern architectural minimalism, this property balances
                  editorial polish with high-density enterprise utility. Features generous canvas framing,
                  razor-thin structural dividers, soft multi-layered ambient depth, and luminous white surfaces
                  against pale architectural gray backdrops.
                </p>
                <div className="mt-4 pt-4 border-t border-[#edeef0] grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-[#75777f]">Property ID:</span>
                    <span className="font-semibold text-[#001637] ml-1">{property.id}</span>
                  </div>
                  <div>
                    <span className="text-[#75777f]">Possession:</span>
                    <span className="font-semibold text-[#076a64] ml-1">Immediate</span>
                  </div>
                  <div>
                    <span className="text-[#75777f]">Zoning:</span>
                    <span className="font-semibold text-[#001637] ml-1">Approved Residential</span>
                  </div>
                </div>
              </div>

              {/* Amenities Grid */}
              <div className="bg-white p-6 rounded-xl border border-[#e7e8ea] shadow-sm">
                <h3 className="text-lg font-bold text-[#001637] font-plus-jakarta mb-4">
                  Features &amp; Verified Amenities
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {property.amenities.map((amenity) => (
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
                    {property.landlord.initials}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-bold text-[#001637]">
                        {property.landlord.name}
                      </h4>
                      <span className="px-2 py-0.5 bg-[#a1f1e9] text-[#076a64] text-[10px] font-bold rounded-full uppercase">
                        Biometric Verified
                      </span>
                    </div>
                    <p className="text-xs text-[#44474e] mt-0.5">
                      Direct Property Owner • Rating: {property.landlord.rating} / 5.0 ★
                    </p>
                    <p className="text-xs text-[#75777f] mt-0.5">
                      ID: NADRA CNIC Verified &amp; Registered Escrow
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <a
                    href={`tel:${property.landlord.phone}`}
                    className="flex-1 sm:flex-initial px-4 py-2 bg-[#f2f4f6] hover:bg-[#edeef0] text-[#001637] text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">call</span>
                    Call Owner
                  </a>
                  <a
                    href={`mailto:${property.landlord.email}`}
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
