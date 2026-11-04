"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import PropertyCard from "@/components/ui/property-card";
import { mockProperties, Property } from "@/lib/mock-data";

export default function PropertiesPage() {
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedCity, setSelectedCity] = useState<string>("all");
  const [verifiedOnly, setVerifiedOnly] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<string>("featured");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const filteredProperties = useMemo(() => {
    return mockProperties.filter((property) => {
      if (selectedType !== "all" && property.transactionType !== selectedType) {
        return false;
      }
      if (selectedCategory !== "all" && property.category !== selectedCategory) {
        return false;
      }
      if (selectedCity !== "all" && property.city.toLowerCase() !== selectedCity.toLowerCase()) {
        return false;
      }
      if (verifiedOnly && !property.verified) {
        return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = property.title.toLowerCase().includes(query);
        const matchesLocation = property.location.toLowerCase().includes(query);
        const matchesDescription = property.description.toLowerCase().includes(query);
        if (!matchesTitle && !matchesLocation && !matchesDescription) {
          return false;
        }
      }
      return true;
    }).sort((a, b) => {
      if (sortBy === "price-asc") return a.price - b.price;
      if (sortBy === "price-desc") return b.price - a.price;
      return 0; // featured default
    });
  }, [selectedType, selectedCategory, selectedCity, verifiedOnly, sortBy, searchQuery]);

  return (
    <>
      <Navbar />

      <main className="w-full pt-24 pb-16 bg-[#f8f9fb] min-h-screen">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-12">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs text-[#44474e] mb-4">
            <Link href="/" className="hover:text-[#001637] transition-colors">
              Home
            </Link>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-[#001637] font-semibold">Properties</span>
          </div>

          {/* Page Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold text-[#001637] font-plus-jakarta tracking-tight">
                Verified Properties in Pakistan
              </h1>
              <p className="text-sm text-[#44474e] mt-1">
                Explore luxury apartments, modern villas, and commercial plots with legal biometric title verification.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 bg-white border border-[#e7e8ea] rounded-lg shadow-sm">
              <span className="material-symbols-outlined text-[16px] text-[#076a64]">verified</span>
              <span>Showing {filteredProperties.length} Properties</span>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="bg-white rounded-xl shadow-sm border border-[#e7e8ea] p-5 mb-8">
            {/* Top row: search & transaction type */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center pb-4 border-b border-[#edeef0]">
              <div className="md:col-span-6 relative">
                <span className="material-symbols-outlined absolute left-3 top-3 text-[18px] text-[#75777f]">
                  search
                </span>
                <input
                  type="text"
                  placeholder="Search by neighborhood, project, or keyword (e.g. DHA, Penthouse)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-11 pl-10 pr-4 bg-[#f2f4f6] text-sm text-[#191c1e] rounded-lg focus:outline-none focus:bg-[#edeef0] border border-transparent focus:border-[#076a64] transition-all"
                />
              </div>

              {/* Rent / Sale Filter */}
              <div className="md:col-span-3 flex items-center bg-[#edeef0] rounded-lg p-1">
                <button
                  type="button"
                  onClick={() => setSelectedType("all")}
                  className={`flex-1 py-1.5 rounded-md text-xs font-semibold transition-all ${
                    selectedType === "all"
                      ? "bg-[#172b4d] text-white shadow-sm"
                      : "text-[#44474e] hover:text-[#001637]"
                  }`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedType("rent")}
                  className={`flex-1 py-1.5 rounded-md text-xs font-semibold transition-all ${
                    selectedType === "rent"
                      ? "bg-[#172b4d] text-white shadow-sm"
                      : "text-[#44474e] hover:text-[#001637]"
                  }`}
                >
                  Rent
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedType("sale")}
                  className={`flex-1 py-1.5 rounded-md text-xs font-semibold transition-all ${
                    selectedType === "sale"
                      ? "bg-[#172b4d] text-white shadow-sm"
                      : "text-[#44474e] hover:text-[#001637]"
                  }`}
                >
                  Sale
                </button>
              </div>

              {/* Sorting */}
              <div className="md:col-span-3 flex items-center justify-end gap-2">
                <label className="text-xs text-[#44474e] whitespace-nowrap">Sort:</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="h-10 bg-[#f2f4f6] text-xs font-semibold text-[#191c1e] rounded-lg px-3 pr-6 appearance-none focus:outline-none cursor-pointer border border-[#e7e8ea]"
                >
                  <option value="featured">Featured First</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                </select>
              </div>
            </div>

            {/* Bottom row: Category pills & City filter */}
            <div className="pt-4 flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-[#44474e] font-semibold mr-1">Category:</span>
                {[
                  { id: "all", label: "All Types" },
                  { id: "villas", label: "Houses & Villas" },
                  { id: "apartments", label: "Apartments" },
                  { id: "flats", label: "Modern Flats" },
                  { id: "plots", label: "Prime Plots" },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      selectedCategory === cat.id
                        ? "bg-[#076a64] text-white shadow-sm"
                        : "bg-[#f2f4f6] text-[#44474e] hover:bg-[#edeef0] hover:text-[#001637]"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-4">
                {/* City select */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#44474e] font-semibold">City:</span>
                  <select
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    className="h-9 bg-[#f2f4f6] text-xs font-semibold text-[#191c1e] rounded-lg px-3 appearance-none focus:outline-none cursor-pointer border border-[#e7e8ea]"
                  >
                    <option value="all">All Cities</option>
                    <option value="Karachi">Karachi</option>
                    <option value="Lahore">Lahore</option>
                    <option value="Islamabad">Islamabad</option>
                    <option value="Rawalpindi">Rawalpindi</option>
                  </select>
                </div>

                {/* Verified Landlords toggle */}
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={verifiedOnly}
                    onChange={(e) => setVerifiedOnly(e.target.checked)}
                    className="w-4 h-4 rounded text-[#076a64] focus:ring-[#076a64]"
                  />
                  <span className="text-xs font-semibold text-[#001637]">
                    Verified Landlords
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Property Grid */}
          {filteredProperties.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProperties.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          ) : (
            <div className="w-full py-16 bg-white rounded-xl border border-[#e7e8ea] text-center p-8">
              <span className="material-symbols-outlined text-[48px] text-[#8093bb]">
                search_off
              </span>
              <h3 className="text-lg font-bold text-[#001637] mt-3">No matching properties found</h3>
              <p className="text-xs text-[#44474e] mt-1 max-w-md mx-auto">
                Try adjusting your filters or search keywords to explore more available listings across Pakistan.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedType("all");
                  setSelectedCategory("all");
                  setSelectedCity("all");
                  setVerifiedOnly(false);
                  setSearchQuery("");
                }}
                className="mt-4 px-4 py-2 bg-[#172b4d] text-white text-xs font-semibold rounded-lg hover:bg-[#001637] transition-colors"
              >
                Reset All Filters
              </button>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}
