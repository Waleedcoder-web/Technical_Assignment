"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import CustomDropdown from "./custom-dropdown";

export default function SearchTerminal() {
  const router = useRouter();
  const [keyword, setKeyword] = useState("");
  const [transactionType, setTransactionType] = useState<"rent" | "sale">("rent");
  const [location, setLocation] = useState("all");
  const [propertyType, setPropertyType] = useState("all");
  const [budget, setBudget] = useState("any");
  const [size, setSize] = useState("any");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();

    if (keyword.trim()) params.set("q", keyword.trim());
    if (transactionType) params.set("type", transactionType);
    if (location && location !== "all") params.set("loc", location);
    if (propertyType && propertyType !== "all") params.set("cat", propertyType);
    if (budget && budget !== "any") params.set("budget", budget);
    if (size && size !== "any") params.set("size", size);

    const queryString = params.toString();
    router.push(`/properties${queryString ? `?${queryString}` : ""}`);
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 lg:p-8 relative z-20 border border-[#e7e8ea]">
      {/* Transaction Type Switcher & Badge */}
      <div className="flex items-center justify-between pb-5 gap-4 flex-wrap">
        <div className="inline-flex bg-[#edeef0] rounded-xl p-1">
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

      <form onSubmit={handleSearch}>
        {/* Prominent Primary Keyword Search Bar */}
        <div className="relative mb-4">
          <span className="material-symbols-outlined absolute left-4 top-3.5 text-[22px] text-[#076a64]">
            search
          </span>
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Search by city, area, property name, or keyword (e.g. DHA Lahore, 12 Marla Luxury Villa, Bahria)..."
            className="w-full h-12 pl-12 pr-28 bg-[#f2f4f6] hover:bg-[#edeef0] text-sm text-[#191c1e] font-medium rounded-xl border border-[#e7e8ea] focus:border-[#076a64] focus:bg-white focus:outline-none transition-all shadow-inner"
          />
          {keyword && (
            <button
              type="button"
              onClick={() => setKeyword("")}
              className="absolute right-24 top-3 text-[#75777f] hover:text-[#001637] p-1"
              title="Clear"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          )}
          <button
            type="submit"
            className="absolute right-1.5 top-1.5 h-9 px-4 bg-[#076a64] hover:bg-[#00201e] text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all shadow-sm"
          >
            <span>Search</span>
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </button>
        </div>

        {/* Filter Inputs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
          {/* Location */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold text-[#44474e] uppercase tracking-wider flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">location_on</span>
              City / Location
            </label>
            <CustomDropdown
              value={location}
              onChange={setLocation}
              buttonClassName="!h-11"
              options={[
                { value: "all", label: "All Cities & Locations", icon: "explore" },
                { value: "Lahore", label: "Lahore (All Areas)", icon: "location_city" },
                { value: "DHA Phase 6", label: "Lahore • DHA Phase 6", icon: "location_city" },
                { value: "Karachi", label: "Karachi (All Areas)", icon: "location_city" },
                { value: "Clifton", label: "Karachi • Clifton", icon: "location_city" },
                { value: "Islamabad", label: "Islamabad (All Sectors)", icon: "location_city" },
                { value: "Rawalpindi", label: "Rawalpindi / Bahria", icon: "location_city" },
              ]}
            />
          </div>

          {/* Property Type */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold text-[#44474e] uppercase tracking-wider flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">apartment</span>
              Type
            </label>
            <CustomDropdown
              value={propertyType}
              onChange={setPropertyType}
              buttonClassName="!h-11"
              options={[
                { value: "all", label: "All Architectural Types", icon: "domain" },
                { value: "villas", label: "Houses & Villas", icon: "villa" },
                { value: "apartments", label: "Luxury Apartments", icon: "apartment" },
                { value: "flats", label: "Modern Flats", icon: "holiday_village" },
                { value: "plots", label: "Plots & Land", icon: "landscape" },
              ]}
            />
          </div>

          {/* Budget Range */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold text-[#44474e] uppercase tracking-wider flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">payments</span>
              Budget (PKR)
            </label>
            <CustomDropdown
              value={budget}
              onChange={setBudget}
              buttonClassName="!h-11"
              options={[
                { value: "any", label: "Any Budget", icon: "payments" },
                { value: "under-150k", label: "< PKR 150,000", icon: "wallet" },
                { value: "150k-350k", label: "PKR 150,000 – 350,000", icon: "wallet" },
                { value: "350k-700k", label: "PKR 350,000 – 700,000", icon: "wallet" },
                { value: "over-700k", label: "> PKR 700,000", icon: "diamond" },
              ]}
            />
          </div>

          {/* Size / Marla */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold text-[#44474e] uppercase tracking-wider flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">straighten</span>
              Size / Marla
            </label>
            <CustomDropdown
              value={size}
              onChange={setSize}
              buttonClassName="!h-11"
              options={[
                { value: "any", label: "Any Size", icon: "straighten" },
                { value: "5-marla", label: "5 Marla (1,125 sq ft)", badge: "5 Marla" },
                { value: "10-marla", label: "10 Marla (2,250 sq ft)", badge: "10 Marla" },
                { value: "12-marla", label: "12 Marla (2,700 sq ft)", badge: "12 Marla" },
                { value: "1-kanal", label: "1 Kanal / 20 Marla", badge: "1 Kanal" },
                { value: "2-kanal", label: "2+ Kanal Luxury", badge: "2+ Kanal" },
              ]}
            />
          </div>
        </div>
      </form>

      {/* Quick Trending Badges */}
      <div className="mt-4 pt-3 border-t border-[#edeef0] flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-semibold text-[#44474e] uppercase tracking-wider mr-1 flex items-center gap-1">
          <span className="material-symbols-outlined text-[14px] text-[#076a64]">trending_up</span>
          Quick Search:
        </span>
        {[
          { label: "DHA Lahore", query: "DHA" },
          { label: "12 Marla Villas", query: "12 Marla" },
          { label: "Houses & Villas", cat: "villas" },
          { label: "For Rent", type: "rent" },
          { label: "For Sale", type: "sale" },
        ].map((tag) => (
          <button
            key={tag.label}
            type="button"
            onClick={() => {
              const p = new URLSearchParams();
              if (tag.query) p.set("q", tag.query);
              if (tag.cat) p.set("cat", tag.cat);
              if (tag.type) p.set("type", tag.type);
              router.push(`/properties?${p.toString()}`);
            }}
            className="px-3 py-1 bg-[#edeef0] hover:bg-[#e7e8ea] hover:text-[#001637] rounded-full text-xs text-[#44474e] font-medium transition-colors flex items-center gap-1"
          >
            {tag.label}
          </button>
        ))}
      </div>
    </div>
  );
}
