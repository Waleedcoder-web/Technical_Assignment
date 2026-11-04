"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SearchTerminal() {
  const router = useRouter();
  const [transactionType, setTransactionType] = useState<"rent" | "sale">("rent");
  const [location, setLocation] = useState("lahore-dha6");
  const [propertyType, setPropertyType] = useState("all");
  const [budget, setBudget] = useState("350k-700k");
  const [size, setSize] = useState("10-marla");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = new URLSearchParams({
      type: transactionType,
      loc: location,
      cat: propertyType,
      budget,
      size,
    }).toString();
    router.push(`/properties?${query}`);
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6 lg:p-8 relative z-20 border border-[#e7e8ea]">
      {/* Transaction Type Switcher & Badge */}
      <div className="flex items-center justify-between pb-6 gap-4 flex-wrap">
        <div className="inline-flex bg-[#edeef0] rounded-lg p-1">
          <button
            type="button"
            onClick={() => setTransactionType("rent")}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
              transactionType === "rent"
                ? "bg-[#172b4d] text-white shadow-sm"
                : "text-[#44474e] hover:text-[#001637]"
            }`}
          >
            For Rent
          </button>
          <button
            type="button"
            onClick={() => setTransactionType("sale")}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
              transactionType === "sale"
                ? "bg-[#172b4d] text-white shadow-sm"
                : "text-[#44474e] hover:text-[#001637]"
            }`}
          >
            For Sale
          </button>
        </div>

        <div className="hidden md:flex items-center gap-1.5 text-[#44474e] text-xs font-semibold">
          <span className="material-symbols-outlined text-[16px] text-[#076a64]">
            shield_with_heart
          </span>
          <span>Digitized Biometric Landlord Registry</span>
        </div>
      </div>

      {/* Filter Inputs Grid */}
      <form onSubmit={handleSearch}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
          {/* Location */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold text-[#44474e] uppercase tracking-wider flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">location_on</span>
              Location
            </label>
            <div className="relative">
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full h-11 bg-[#f2f4f6] text-[#191c1e] text-sm rounded-lg px-3 pr-8 appearance-none focus:outline-none focus:bg-[#edeef0] transition-colors cursor-pointer border border-transparent focus:border-[#076a64]"
              >
                <option value="islamabad-f7">Islamabad • Sector F-7</option>
                <option value="lahore-dha6">Lahore • DHA Phase 6</option>
                <option value="karachi-clifton">Karachi • Clifton Block 4</option>
                <option value="islamabad-e11">Islamabad • Sector E-11</option>
                <option value="rawalpindi-bahria">Rawalpindi • Bahria Town</option>
              </select>
              <span className="material-symbols-outlined absolute right-2.5 top-3 text-[18px] text-[#75777f] pointer-events-none">
                expand_more
              </span>
            </div>
          </div>

          {/* Property Type */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold text-[#44474e] uppercase tracking-wider flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">apartment</span>
              Type
            </label>
            <div className="relative">
              <select
                value={propertyType}
                onChange={(e) => setPropertyType(e.target.value)}
                className="w-full h-11 bg-[#f2f4f6] text-[#191c1e] text-sm rounded-lg px-3 pr-8 appearance-none focus:outline-none focus:bg-[#edeef0] transition-colors cursor-pointer border border-transparent focus:border-[#076a64]"
              >
                <option value="all">All Architectural Types</option>
                <option value="houses">Houses &amp; Villas</option>
                <option value="apartments">Luxury Apartments</option>
                <option value="flats">Modern Flats</option>
                <option value="plots">Plots &amp; Land</option>
              </select>
              <span className="material-symbols-outlined absolute right-2.5 top-3 text-[18px] text-[#75777f] pointer-events-none">
                expand_more
              </span>
            </div>
          </div>

          {/* Budget Range */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold text-[#44474e] uppercase tracking-wider flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">payments</span>
              Budget (PKR)
            </label>
            <div className="relative">
              <select
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className="w-full h-11 bg-[#f2f4f6] text-[#191c1e] text-sm rounded-lg px-3 pr-8 appearance-none focus:outline-none focus:bg-[#edeef0] transition-colors cursor-pointer border border-transparent focus:border-[#076a64]"
              >
                <option value="any">Any Budget</option>
                <option value="under-150k">&lt; 150,000 / mo</option>
                <option value="150k-350k">150,000 – 350,000 / mo</option>
                <option value="350k-700k">350,000 – 700,000 / mo</option>
                <option value="over-700k">&gt; 700,000 / mo</option>
              </select>
              <span className="material-symbols-outlined absolute right-2.5 top-3 text-[18px] text-[#75777f] pointer-events-none">
                expand_more
              </span>
            </div>
          </div>

          {/* Size / Marla */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold text-[#44474e] uppercase tracking-wider flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">straighten</span>
              Size / Marla
            </label>
            <div className="relative">
              <select
                value={size}
                onChange={(e) => setSize(e.target.value)}
                className="w-full h-11 bg-[#f2f4f6] text-[#191c1e] text-sm rounded-lg px-3 pr-8 appearance-none focus:outline-none focus:bg-[#edeef0] transition-colors cursor-pointer border border-transparent focus:border-[#076a64]"
              >
                <option value="any">Any Size</option>
                <option value="5-marla">5 Marla (1,125 sq ft)</option>
                <option value="10-marla">10 Marla (2,250 sq ft)</option>
                <option value="1-kanal">1 Kanal / 20 Marla</option>
                <option value="2-kanal">2+ Kanal Luxury</option>
              </select>
              <span className="material-symbols-outlined absolute right-2.5 top-3 text-[18px] text-[#75777f] pointer-events-none">
                expand_more
              </span>
            </div>
          </div>

          {/* Search Button */}
          <div>
            <button
              type="submit"
              className="w-full h-11 bg-[#001637] text-white hover:bg-[#172b4d] text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition-all shadow-sm group"
            >
              <span className="material-symbols-outlined text-[20px] transition-transform group-hover:scale-110">
                search
              </span>
              <span>Search Properties</span>
            </button>
          </div>
        </div>
      </form>

      {/* Quick Trending Badges */}
      <div className="mt-4 pt-3 border-t border-[#edeef0] flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-semibold text-[#44474e] uppercase tracking-wider mr-1">
          Trending:
        </span>
        {["DHA Villas", "3-Bed Luxury Flat", "10 Marla Plot", "Penthouse with Terrace"].map(
          (tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => router.push(`/properties?q=${encodeURIComponent(tag)}`)}
              className="px-3 py-1 bg-[#edeef0] hover:bg-[#e7e8ea] rounded-full text-xs text-[#191c1e] transition-colors flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[14px] text-[#076a64]">
                trending_up
              </span>
              {tag}
            </button>
          )
        )}
      </div>
    </div>
  );
}
