"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import PropertyCard from "@/components/ui/property-card";
import { mockProperties, Property, getStoredProperties, saveStoredProperties } from "@/lib/mock-data";
import CustomDropdown from "@/components/ui/custom-dropdown";

function PropertiesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [propertiesList, setPropertiesList] = useState<Property[]>([]);
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedCity, setSelectedCity] = useState<string>("all");
  const [selectedBudget, setSelectedBudget] = useState<string>("any");
  const [selectedSize, setSelectedSize] = useState<string>("any");
  const [verifiedOnly, setVerifiedOnly] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<string>("featured");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  // Sync admin status
  useEffect(() => {
    try {
      const stored = localStorage.getItem("havenkey_user");
      if (stored) {
        const u = JSON.parse(stored);
        if (u.role === "admin" || u.email?.toLowerCase().includes("admin")) {
          setIsAdmin(true);
        }
      }
    } catch {}
  }, []);

  // 1. Sync search params from URL on load and navigation

  useEffect(() => {
    const qParam = searchParams.get("q") || searchParams.get("search") || searchParams.get("query");
    const typeParam = searchParams.get("type") || searchParams.get("listing_type");
    const catParam = searchParams.get("cat") || searchParams.get("category");
    const locParam = searchParams.get("loc") || searchParams.get("city") || searchParams.get("location");
    const budgetParam = searchParams.get("budget");
    const sizeParam = searchParams.get("size");

    if (qParam !== null) setSearchQuery(qParam);
    if (typeParam && (typeParam === "rent" || typeParam === "sale" || typeParam === "all")) {
      setSelectedType(typeParam);
    }
    if (catParam) {
      if (catParam.toLowerCase().includes("house") || catParam.toLowerCase().includes("villa")) {
        setSelectedCategory("villas");
      } else {
        setSelectedCategory(catParam);
      }
    }
    if (locParam) {
      setSelectedCity(locParam);
    }
    if (budgetParam) {
      setSelectedBudget(budgetParam);
    }
    if (sizeParam) {
      setSelectedSize(sizeParam);
    }
  }, [searchParams]);

  // 2. Fetch live properties from Supabase / API
  useEffect(() => {
    fetch("/api/properties", { cache: "no-store" })
      .then((res) => res.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data)) {
          setPropertiesList(json.data);
          saveStoredProperties(json.data);
        } else {
          fetch("http://localhost:5000/api/properties", { cache: "no-store" })
            .then((r) => r.json())
            .then((j) => {
              if (j.success && Array.isArray(j.data)) {
                setPropertiesList(j.data);
                saveStoredProperties(j.data);
              }
            })
            .catch(() => {});
        }
      })
      .catch(() => {
        fetch("http://localhost:5000/api/properties", { cache: "no-store" })
          .then((r) => r.json())
          .then((j) => {
            if (j.success && Array.isArray(j.data)) {
              setPropertiesList(j.data);
              saveStoredProperties(j.data);
            }
          })
          .catch(() => {});
      })
      .finally(() => {
        setIsLoading(false);
      });

    const handler = () => setPropertiesList(getStoredProperties());
    window.addEventListener("havenkey_properties_change", handler);
    return () => window.removeEventListener("havenkey_properties_change", handler);
  }, []);

  // 3. Clear all filters
  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedType("all");
    setSelectedCategory("all");
    setSelectedCity("all");
    setSelectedBudget("any");
    setSelectedSize("any");
    setVerifiedOnly(false);
    setSortBy("featured");
    router.replace("/properties");
  };

  // 4. Live filtering
  const filteredProperties = useMemo(() => {
    return propertiesList
      .filter((property) => {
        // Rent / Sale filter
        const propType = (property.transactionType || property.listing_type || "").toLowerCase();
        if (selectedType !== "all" && propType !== selectedType.toLowerCase()) {
          return false;
        }

        // Category filter (support houses/villas alias)
        const propCat = (property.category || property.property_type || "").toLowerCase();
        if (selectedCategory !== "all") {
          const targetCat = selectedCategory.toLowerCase();
          if (targetCat === "villas" || targetCat === "houses") {
            if (!propCat.includes("villa") && !propCat.includes("house") && !propCat.includes("home")) {
              return false;
            }
          } else if (targetCat === "apartments") {
            if (!propCat.includes("apartment")) return false;
          } else if (targetCat === "flats") {
            if (!propCat.includes("flat")) return false;
          } else if (targetCat === "plots") {
            if (!propCat.includes("plot")) return false;
          } else if (!propCat.includes(targetCat)) {
            return false;
          }
        }

        // City / Location filter
        const propLocation = `${property.city || ""} ${property.location || ""} ${property.address || ""}`.toLowerCase();
        if (selectedCity !== "all") {
          const cleanCity = selectedCity.toLowerCase().replace(/-/g, " ");
          const searchTokens = cleanCity.split(/\s+/).filter(Boolean);
          const hasMatch = searchTokens.some((token) => propLocation.includes(token));
          if (!hasMatch) return false;
        }

        // Verified only
        if (verifiedOnly && !property.verified) {
          return false;
        }

        // Budget range filter
        if (selectedBudget !== "any") {
          const price = Number(property.price || 0);
          if (selectedBudget === "under-150k" && price >= 150000) return false;
          if (selectedBudget === "150k-350k" && (price < 150000 || price > 350000)) return false;
          if (selectedBudget === "350k-700k" && (price < 350000 || price > 700000)) return false;
          if (selectedBudget === "over-700k" && price <= 700000) return false;
        }

        // Size filter
        if (selectedSize !== "any") {
          const area = Number(property.area_value || property.beds || 0);
          const unit = (property.area_unit || "Marla").toLowerCase();
          if (selectedSize === "5-marla" && (area > 6 || unit.includes("kanal"))) return false;
          if (selectedSize === "10-marla" && (area < 8 || area > 11 || unit.includes("kanal"))) return false;
          if (selectedSize === "12-marla" && (area < 11 || area > 14 || unit.includes("kanal"))) return false;
          if (selectedSize === "1-kanal" && (area < 18 && !unit.includes("kanal"))) return false;
          if (selectedSize === "2-kanal" && ((area < 38 && !unit.includes("kanal")) || (unit.includes("kanal") && area < 2))) return false;
        }

        // Text Search Query: Matches Title, Location, Address, Description, Property Type, or Landlord Name
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase().trim();
          const tokens = query.split(/\s+/).filter(Boolean);

          const searchableText = [
            property.title,
            property.location,
            property.address,
            property.description,
            property.property_type,
            property.category,
            property.listing_type,
            property.transactionType,
            property.landlord?.name,
            `${property.area_value || ""} ${property.area_unit || ""}`,
            String(property.price || ""),
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

          // Every token should match somewhere in the property details
          const allTokensMatch = tokens.every((token) => searchableText.includes(token));
          if (!allTokensMatch) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "price-asc") return Number(a.price) - Number(b.price);
        if (sortBy === "price-desc") return Number(b.price) - Number(a.price);
        return 0; // featured default
      });
  }, [
    propertiesList,
    selectedType,
    selectedCategory,
    selectedCity,
    selectedBudget,
    selectedSize,
    verifiedOnly,
    sortBy,
    searchQuery,
  ]);

  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    selectedType !== "all" ||
    selectedCategory !== "all" ||
    selectedCity !== "all" ||
    selectedBudget !== "any" ||
    selectedSize !== "any" ||
    verifiedOnly;

  return (
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
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold text-[#001637] font-plus-jakarta tracking-tight">
              Verified Properties in Pakistan
            </h1>
            <p className="text-sm text-[#44474e] mt-1">
              Live database of apartments, modern villas, and commercial plots with legal biometric title verification.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {isAdmin && (
              <Link
                href="/properties/add"
                className="px-4 py-2.5 bg-[#076a64] hover:bg-[#00201e] text-white text-xs font-bold rounded-lg transition-all shadow-sm flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[18px]">add_photo_alternate</span>
                <span>+ Upload / Add Property</span>
              </Link>
            )}
            <div className="hidden sm:flex items-center gap-2 text-xs font-semibold px-3 py-2 bg-white border border-[#e7e8ea] rounded-lg shadow-sm">

              <span className="material-symbols-outlined text-[16px] text-[#076a64]">verified</span>
              <span>{filteredProperties.length} Properties Found</span>
            </div>
          </div>
        </div>

        {/* Primary Interactive Search Bar & Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#e7e8ea] p-5 mb-8">
          {/* Top row: search input & transaction type & sort */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center pb-4 border-b border-[#edeef0]">
            {/* Search Input Bar */}
            <div className="md:col-span-6 relative">
              <span className="material-symbols-outlined absolute left-3.5 top-3 text-[20px] text-[#076a64]">
                search
              </span>
              <input
                type="text"
                placeholder="Search by city, area, title, or keyword (e.g. DHA Lahore, Luxury Villa, 12 Marla)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-11 pl-11 pr-10 bg-[#f2f4f6] text-sm text-[#191c1e] rounded-xl focus:outline-none focus:bg-white border border-transparent focus:border-[#076a64] transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-3 text-[#75777f] hover:text-[#001637] transition-colors p-0.5"
                  title="Clear search"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              )}
            </div>

            {/* Rent / Sale Filter Switcher */}
            <div className="md:col-span-3 flex items-center bg-[#edeef0] rounded-xl p-1">
              <button
                type="button"
                onClick={() => setSelectedType("all")}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
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
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
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
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  selectedType === "sale"
                    ? "bg-[#172b4d] text-white shadow-sm"
                    : "text-[#44474e] hover:text-[#001637]"
                }`}
              >
                Sale
              </button>
            </div>

            {/* Sorting Dropdown */}
            <div className="md:col-span-3 flex items-center justify-end gap-2">
              <label className="text-xs text-[#44474e] whitespace-nowrap font-medium">Sort:</label>
              <div className="w-full sm:w-48">
                <CustomDropdown
                  value={sortBy}
                  onChange={setSortBy}
                  buttonClassName="!h-10"
                  options={[
                    { value: "featured", label: "Featured First", icon: "star" },
                    { value: "price-asc", label: "Price: Low to High", icon: "trending_up" },
                    { value: "price-desc", label: "Price: High to Low", icon: "trending_down" },
                  ]}
                />
              </div>
            </div>
          </div>

          {/* Bottom row: Category pills, City filter, and Verified toggle */}
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

            <div className="flex items-center gap-4 flex-wrap">
              {/* City select */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#44474e] font-semibold">City:</span>
                <div className="w-36">
                  <CustomDropdown
                    value={selectedCity}
                    onChange={setSelectedCity}
                    buttonClassName="!h-9 text-xs"
                    options={[
                      { value: "all", label: "All Cities", icon: "location_city" },
                      { value: "Lahore", label: "Lahore", icon: "location_on" },
                      { value: "Karachi", label: "Karachi", icon: "location_on" },
                      { value: "Islamabad", label: "Islamabad", icon: "location_on" },
                      { value: "Rawalpindi", label: "Rawalpindi", icon: "location_on" },
                    ]}
                  />
                </div>
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
                  Verified Only
                </span>
              </label>

              {/* Reset button if active */}
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="text-xs text-red-600 hover:text-red-700 font-semibold flex items-center gap-1 transition-colors"
                >
                  <span className="material-symbols-outlined text-[15px]">restart_alt</span>
                  <span>Clear All</span>
                </button>
              )}
            </div>
          </div>

          {/* Active Filter Badges */}
          {hasActiveFilters && (
            <div className="mt-4 pt-3 border-t border-[#edeef0] flex flex-wrap items-center gap-2 text-xs">
              <span className="text-[#75777f] font-semibold">Active Filters:</span>

              {searchQuery.trim() && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#f2f4f6] text-[#001637] rounded-full border border-[#e7e8ea]">
                  <span>Keyword: &ldquo;{searchQuery}&rdquo;</span>
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="hover:text-red-600 font-bold"
                  >
                    &times;
                  </button>
                </span>
              )}

              {selectedType !== "all" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#f2f4f6] text-[#001637] rounded-full border border-[#e7e8ea] capitalize">
                  <span>Type: {selectedType}</span>
                  <button
                    type="button"
                    onClick={() => setSelectedType("all")}
                    className="hover:text-red-600 font-bold"
                  >
                    &times;
                  </button>
                </span>
              )}

              {selectedCategory !== "all" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#f2f4f6] text-[#001637] rounded-full border border-[#e7e8ea] capitalize">
                  <span>Category: {selectedCategory}</span>
                  <button
                    type="button"
                    onClick={() => setSelectedCategory("all")}
                    className="hover:text-red-600 font-bold"
                  >
                    &times;
                  </button>
                </span>
              )}

              {selectedCity !== "all" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#f2f4f6] text-[#001637] rounded-full border border-[#e7e8ea] capitalize">
                  <span>City: {selectedCity}</span>
                  <button
                    type="button"
                    onClick={() => setSelectedCity("all")}
                    className="hover:text-red-600 font-bold"
                  >
                    &times;
                  </button>
                </span>
              )}

              <span className="text-[#076a64] font-bold ml-auto">
                Showing {filteredProperties.length} of {propertiesList.length} listings
              </span>
            </div>
          )}
        </div>

        {/* Property Grid */}
        {isLoading ? (
          <div className="w-full py-20 bg-white rounded-2xl border border-[#e7e8ea] text-center p-8">
            <span className="material-symbols-outlined text-[36px] text-[#076a64] animate-spin block mb-2 mx-auto">
              progress_activity
            </span>
            <p className="text-xs text-[#75777f]">Loading live properties from database...</p>
          </div>
        ) : filteredProperties.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProperties.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        ) : propertiesList.length === 0 ? (
          <div className="w-full py-16 bg-white rounded-2xl border border-[#e7e8ea] text-center p-8 shadow-sm">
            <span className="material-symbols-outlined text-[48px] text-[#8093bb]">
              real_estate_agent
            </span>
            <h3 className="text-lg font-bold text-[#001637] mt-3">No Properties Listed Yet</h3>
            <p className="text-xs text-[#44474e] mt-1 max-w-md mx-auto">
              Real database listings will show up here automatically when uploaded.
            </p>
            {isAdmin && (
              <Link
                href="/properties/add"
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-[#076a64] text-white text-xs font-semibold rounded-lg hover:bg-[#00201e] transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">add_photo_alternate</span>
                <span>+ Upload Property</span>
              </Link>
            )}
          </div>

        ) : (
          <div className="w-full py-16 bg-white rounded-2xl border border-[#e7e8ea] text-center p-8 shadow-sm">
            <span className="material-symbols-outlined text-[48px] text-[#8093bb]">
              search_off
            </span>
            <h3 className="text-lg font-bold text-[#001637] mt-3">No matching properties found</h3>
            <p className="text-xs text-[#44474e] mt-1 max-w-md mx-auto">
              {searchQuery.trim()
                ? `No properties matched "${searchQuery}". Try searching for 'Lahore', 'DHA', 'Villa', or clearing your filters.`
                : "Try adjusting your filters or search keywords to explore more available listings."}
            </p>
            <button
              type="button"
              onClick={handleResetFilters}
              className="mt-4 inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#001637] hover:bg-[#172b4d] text-white text-xs font-semibold rounded-lg transition-colors shadow-sm"
            >
              <span className="material-symbols-outlined text-[16px]">restart_alt</span>
              <span>Clear Search & Show All {propertiesList.length} Properties</span>
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

export default function PropertiesPage() {
  return (
    <>
      <Navbar />
      <Suspense
        fallback={
          <main className="w-full pt-28 pb-16 bg-[#f8f9fb] min-h-screen text-center">
            <span className="material-symbols-outlined text-[36px] text-[#076a64] animate-spin block mb-2 mx-auto">
              progress_activity
            </span>
            <p className="text-xs text-[#75777f]">Loading HavenKey properties...</p>
          </main>
        }
      >
        <PropertiesContent />
      </Suspense>
      <Footer />
    </>
  );
}
