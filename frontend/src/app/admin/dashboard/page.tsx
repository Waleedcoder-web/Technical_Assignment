"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  mockAdminStats,
  mockKycQueue,
  mockProperties,
  Property,
  getStoredProperties,
  saveStoredProperties,
} from "@/lib/mock-data";

// Pre-curated verified Pakistani luxury architecture images for easy selection
const PRESET_IMAGES = [
  {
    label: "Karachi Penthouse",
    url: "https://lh3.googleusercontent.com/aida-public/AB6AXuDB2zpoWyl8ZcxyZ9VTBmFnJeOqr2YddS6o6SLXrvuRvseNAmS3xoQSGB8k_vY-hA1XZgefrIb33z0cnS8Sku2G_vqjGUakGorvgncrREPjor6Dwog7GWHryfDglOCx7zujV6EkB2G3K6YXem0f0V138qVfm-y-eaPxeXFJYu1BqO8EcnFseQIrgIT236znyncit7FVaY7Y9FFeaJOy3sRJ2gwLjOPuZ-3DHnmL7Vo",
  },
  {
    label: "Lahore DHA Villa",
    url: "https://lh3.googleusercontent.com/aida-public/AB6AXuD9aR3vX_K6k5l9H9eM6b8G0u_hJ_1K7zY-9w2P8_aQ1-xR3o5t7Y6u8_eI0w9q-zX2c4v7b1n3m5k7j9h-w0e8r6t4y2u0i8o6p4a2s0d8f6g4h2j0k8l6z4x2c0v8b6n4m2",
  },
  {
    label: "Islamabad Margalla Ridge",
    url: "https://lh3.googleusercontent.com/aida-public/AB6AXuCH0Y4q_K9v8b2M6c8X0u_hJ_1K7zY-9w2P8_aQ1-xR3o5t7Y6u8_eI0w9q-zX2c4v7b1n3m5k7j9h-w0e8r6t4y2u0i8o6p4a2s0d8f6g4h2j0k8l6z4x2c0v8b6n4m2",
  },
  {
    label: "Executive Apartment",
    url: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80",
  },
];

interface PropertyFormData {
  owner_id: string;
  title: string;
  description: string;
  property_type: "villas" | "apartments" | "flats" | "plots";
  listing_type: "rent" | "sale";
  price: number;
  area_value: number;
  area_unit: "Marla" | "Kanal" | "Sq Ft" | "Sq Yd";
  bedroom: number;
  bathroom: number;
  location: string;
  address: string;
  status: "available" | "rented" | "sold" | "pending";
  imageUrl: string;

  // UI convenience aliases
  category: "villas" | "apartments" | "flats" | "plots";
  transactionType: "rent" | "sale";
  pricePeriod: string;
  city: string;
  beds: number;
  baths: number;
  size: string;
  landlordName: string;
  landlordPhone: string;
  landlordEmail: string;
  amenitiesStr: string;
  featured: boolean;
  verified: boolean;
}

const INITIAL_FORM: PropertyFormData = {
  owner_id: "usr-admin-01",
  title: "",
  description: "",
  property_type: "villas",
  listing_type: "rent",
  price: 250000,
  area_value: 10,
  area_unit: "Marla",
  bedroom: 4,
  bathroom: 4,
  location: "Lahore",
  address: "DHA Phase 6, Sector J, Street 4",
  status: "available",
  imageUrl: PRESET_IMAGES[0].url,

  category: "villas",
  transactionType: "rent",
  pricePeriod: "/ mo",
  city: "Lahore",
  beds: 4,
  baths: 4,
  size: "10 Marla (2,250 sq ft)",
  landlordName: "Admin Owner",
  landlordPhone: "+92 300 1234567",
  landlordEmail: "admin@gmail.com",
  amenitiesStr: "24/7 Security, Backup Generator, Dedicated Parking, Central Air Conditioning",
  featured: false,
  verified: true,
};

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<"properties" | "kyc" | "escrow">("properties");
  const [properties, setProperties] = useState<Property[]>(mockProperties);
  const [kycList, setKycList] = useState(mockKycQueue);
  const [approvedCount, setApprovedCount] = useState(0);

  // Property Table Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  // Modal State for Create & Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPropertyId, setEditingPropertyId] = useState<string | null>(null);
  const [formData, setFormData] = useState<PropertyFormData>(INITIAL_FORM);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Delete Confirmation State
  const [propertyToDelete, setPropertyToDelete] = useState<Property | null>(null);

  // Notification Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Synchronize properties with localStorage
  useEffect(() => {
    const loaded = getStoredProperties();
    setProperties(loaded);

    const handleSync = () => {
      setProperties(getStoredProperties());
    };
    window.addEventListener("havenkey_properties_change", handleSync);
    return () => window.removeEventListener("havenkey_properties_change", handleSync);
  }, []);

  // Filtered Properties for Admin View
  const filteredProperties = useMemo(() => {
    return properties.filter((p) => {
      const pCat = p.category || p.property_type;
      const pType = p.transactionType || p.listing_type;
      if (categoryFilter !== "all" && pCat !== categoryFilter) return false;
      if (typeFilter !== "all" && pType !== typeFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = p.title.toLowerCase().includes(q);
        const matchLoc = p.location.toLowerCase().includes(q);
        const matchAddress = (p.address || "").toLowerCase().includes(q);
        const matchCity = (p.city || p.location || "").toLowerCase().includes(q);
        const matchLandlord = (p.landlord?.name || "").toLowerCase().includes(q);
        if (!matchTitle && !matchLoc && !matchAddress && !matchCity && !matchLandlord) return false;
      }
      return true;
    });
  }, [properties, categoryFilter, typeFilter, searchQuery]);

  // Open modal for Create
  const handleOpenCreate = () => {
    setEditingPropertyId(null);
    setFormData(INITIAL_FORM);
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Open modal for Edit
  const handleOpenEdit = (property: Property) => {
    setEditingPropertyId(property.id);
    const pType = ((property.property_type || property.category || "villas") as "villas" | "apartments" | "flats" | "plots");
    const lType = ((property.listing_type || property.transactionType || "rent") as "rent" | "sale");
    const beds = property.bedroom ?? property.beds ?? 4;
    const baths = property.bathroom ?? property.baths ?? 4;
    const aVal = property.area_value ?? 10;
    const aUnit = ((property.area_unit || "Marla") as "Marla" | "Kanal" | "Sq Ft" | "Sq Yd");
    const loc = property.location || "Lahore";
    const addr = property.address || property.location || "DHA Phase 6, Sector J";
    const img = property.imageUrl || property.image_url || PRESET_IMAGES[0].url;

    setFormData({
      owner_id: property.owner_id || "usr-admin-01",
      title: property.title,
      description: property.description || "",
      property_type: pType,
      listing_type: lType,
      price: property.price,
      area_value: aVal,
      area_unit: aUnit,
      bedroom: beds,
      bathroom: baths,
      location: loc,
      address: addr,
      status: ((property.status || "available") as "available" | "rented" | "sold" | "pending"),
      imageUrl: img,

      category: pType,
      transactionType: lType,
      pricePeriod: property.pricePeriod || (lType === "rent" ? "/ mo" : ""),
      city: property.city || loc.split(",")[0].trim() || "Lahore",
      beds: beds,
      baths: baths,
      size: property.size || `${aVal} ${aUnit}`,
      landlordName: property.landlord?.name || "Verified Landlord",
      landlordPhone: property.landlord?.phone || "+92 300 0000000",
      landlordEmail: property.landlord?.email || "landlord@havenkey.pk",
      amenitiesStr: (property.amenities || []).join(", "),
      featured: property.featured ?? false,
      verified: property.verified ?? true,
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Form Validation
  const validateForm = () => {
    const errs: Record<string, string> = {};
    if (!formData.title.trim() || formData.title.trim().length < 5) {
      errs.title = "Title must be at least 5 characters.";
    }
    if (!formData.location.trim() || formData.location.trim().length < 2) {
      errs.location = "City / Major Location is required.";
    }
    if (!formData.address.trim() || formData.address.trim().length < 4) {
      errs.address = "Street / Sector address is required.";
    }
    if (!formData.price || formData.price <= 0) {
      errs.price = "Price must be a positive number.";
    }
    if (!formData.area_value || formData.area_value <= 0) {
      errs.area_value = "Area value must be greater than 0.";
    }
    if (!formData.landlordName.trim()) {
      errs.landlordName = "Landlord name is required.";
    }
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Submit Handler (Create or Update)
  const handleSaveProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const formattedPrice = `PKR ${Number(formData.price).toLocaleString()}`;
    const amenities = formData.amenitiesStr
      .split(",")
      .map((a) => a.trim())
      .filter(Boolean);

    const initials = formData.landlordName
      .split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "LL";

    let updatedList: Property[];

    if (editingPropertyId) {
      // UPDATE existing property
      updatedList = properties.map((item) => {
        if (item.id === editingPropertyId) {
          const updatedItem: Property = {
            ...item,
            owner_id: formData.owner_id || item.owner_id || "usr-admin-01",
            title: formData.title.trim(),
            description: formData.description.trim() || `${formData.title} situated in prime ${formData.location}.`,
            property_type: formData.property_type,
            listing_type: formData.listing_type,
            price: Number(formData.price),
            area_value: Number(formData.area_value),
            area_unit: formData.area_unit,
            bedroom: Number(formData.bedroom),
            bathroom: Number(formData.bathroom),
            location: formData.location.trim(),
            address: formData.address.trim(),
            status: formData.status,
            image_url: formData.imageUrl.trim() || PRESET_IMAGES[0].url,
            updated_at: new Date().toISOString(),

            // Compatibility aliases for UI
            category: formData.property_type,
            transactionType: formData.listing_type,
            priceFormatted: formattedPrice,
            pricePeriod: formData.listing_type === "rent" ? formData.pricePeriod || "/ mo" : "",
            city: formData.city.trim() || formData.location.trim(),
            beds: Number(formData.bedroom),
            baths: Number(formData.bathroom),
            size: `${formData.area_value} ${formData.area_unit}`,
            sizeCategory: formData.area_unit === "Kanal" ? "1-kanal" : "10-marla",
            imageUrl: formData.imageUrl.trim() || PRESET_IMAGES[0].url,
            imageAlt: formData.title,
            featured: formData.featured,
            verified: formData.verified,
            landlord: {
              name: formData.landlordName.trim(),
              initials,
              verified: formData.verified,
              rating: item.landlord?.rating || 4.9,
              phone: formData.landlordPhone.trim(),
              email: formData.landlordEmail.trim(),
            },
            amenities: amenities.length > 0 ? amenities : ["24/7 Security", "Backup Power"],
          };
          return updatedItem;
        }
        return item;
      });

      // Try background update to backend API
      try {
        fetch(`http://localhost:5000/api/properties/${editingPropertyId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        }).catch(() => {});
      } catch {}

      showToast(`Property "${formData.title}" updated successfully!`);
    } else {
      // CREATE new property
      const slug = formData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      const newId = `${slug}-${Date.now().toString().slice(-4)}`;

      const newProperty: Property = {
        id: newId,
        owner_id: formData.owner_id || "usr-admin-01",
        title: formData.title.trim(),
        description: formData.description.trim() || `${formData.title} located in ${formData.location}.`,
        property_type: formData.property_type,
        listing_type: formData.listing_type,
        price: Number(formData.price),
        area_value: Number(formData.area_value),
        area_unit: formData.area_unit,
        bedroom: Number(formData.bedroom),
        bathroom: Number(formData.bathroom),
        location: formData.location.trim(),
        address: formData.address.trim(),
        status: formData.status,
        image_url: formData.imageUrl.trim() || PRESET_IMAGES[0].url,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),

        // Compatibility aliases for UI
        category: formData.property_type,
        transactionType: formData.listing_type,
        priceFormatted: formattedPrice,
        pricePeriod: formData.listing_type === "rent" ? formData.pricePeriod || "/ mo" : "",
        city: formData.city.trim() || formData.location.trim(),
        beds: Number(formData.bedroom),
        baths: Number(formData.bathroom),
        size: `${formData.area_value} ${formData.area_unit}`,
        sizeCategory: formData.area_unit === "Kanal" ? "1-kanal" : "10-marla",
        imageUrl: formData.imageUrl.trim() || PRESET_IMAGES[0].url,
        imageAlt: formData.title,
        featured: formData.featured,
        verified: formData.verified,
        landlord: {
          name: formData.landlordName.trim(),
          initials,
          verified: formData.verified,
          rating: 5.0,
          phone: formData.landlordPhone.trim(),
          email: formData.landlordEmail.trim(),
        },
        amenities: amenities.length > 0 ? amenities : ["24/7 Security", "Gated Community", "Backup Power"],
      };

      // Try background insert to backend API
      try {
        fetch("http://localhost:5000/api/properties", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newProperty),
        }).catch(() => {});
      } catch {}

      updatedList = [newProperty, ...properties];
      showToast(`Property "${formData.title}" created and published!`);
    }

    setProperties(updatedList);
    saveStoredProperties(updatedList);
    setIsModalOpen(false);
  };

  // Delete Handler
  const handleConfirmDelete = () => {
    if (!propertyToDelete) return;
    const updated = properties.filter((p) => p.id !== propertyToDelete.id);
    setProperties(updated);
    saveStoredProperties(updated);
    showToast(`Property "${propertyToDelete.title}" has been deleted.`);
    setPropertyToDelete(null);
  };

  // KYC Actions
  const handleApproveKyc = (id: string) => {
    setKycList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: "Verified & Live" } : item))
    );
    setApprovedCount((c) => c + 1);
    showToast(`KYC verification approved for request ${id}.`);
  };

  const handleRejectKyc = (id: string) => {
    setKycList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: "Rejected - Incomplete Title" } : item))
    );
    showToast(`KYC request ${id} flagged as rejected.`);
  };

  return (
    <div className="min-h-screen bg-[#f8f9fb] flex flex-col font-inter">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2 bg-[#001637] text-white px-4 py-3 rounded-xl shadow-xl border border-[#076a64] animate-bounce">
          <span className="material-symbols-outlined text-[#a1f1e9] text-[20px]">check_circle</span>
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Admin Top Header */}
      <header className="h-20 bg-[#001637] text-white px-6 lg:px-12 flex items-center justify-between border-b border-[#172b4d] sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center text-white">
              <span className="material-symbols-outlined text-[22px] text-[#a1f1e9]">
                admin_panel_settings
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold tracking-tight text-white font-plus-jakarta">
                Haven<span className="text-[#a1f1e9]">Key</span> Admin Portal
              </span>
              <span className="text-[10px] text-[#8093bb] uppercase tracking-wider font-semibold">
                Operations &amp; Regulatory Escrow
              </span>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-white/5 rounded-lg border border-white/10 text-xs text-[#d7e2ff]">
            <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse" />
            <span>Escrow Gateway: Nominal</span>
          </div>

          <Link
            href="/properties"
            className="px-3.5 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">visibility</span>
            <span>View Public Site</span>
          </Link>

          <div className="w-8 h-8 rounded-full bg-[#076a64] text-white flex items-center justify-center text-xs font-bold ring-2 ring-[#a1f1e9]">
            AD
          </div>
        </div>
      </header>

      {/* Main Admin Dashboard Content */}
      <main className="max-w-[1440px] mx-auto px-6 lg:px-12 py-8 w-full flex-1">
        {/* Page Title & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#e7e8ea] gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider font-bold text-[#076a64]">
                Operations Telemetry
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#001637] font-plus-jakarta mt-1">
              Admin Operations Console
            </h1>
            <p className="text-xs text-[#44474e] mt-0.5">
              Full CRUD management for verified Pakistani property assets, landlord KYC deeds, and escrow deposits.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleOpenCreate}
              className="px-4 py-2.5 bg-[#001637] hover:bg-[#076a64] text-white text-xs font-bold rounded-lg transition-all flex items-center gap-2 shadow-sm"
            >
              <span className="material-symbols-outlined text-[18px] text-[#a1f1e9]">add_circle</span>
              <span>Add New Property</span>
            </button>
          </div>
        </div>

        {/* 6 Core Metric KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
          <div className="bg-white p-4 rounded-xl border border-[#e7e8ea] shadow-xs">
            <span className="text-[11px] text-[#75777f] uppercase font-semibold">Active Listings</span>
            <p className="text-xl font-bold text-[#001637] font-plus-jakarta mt-1">
              {properties.length}
            </p>
            <span className="text-[10px] text-[#10b981] font-semibold flex items-center gap-0.5 mt-1">
              <span className="material-symbols-outlined text-[12px]">trending_up</span> Live in Market
            </span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-[#e7e8ea] shadow-xs">
            <span className="text-[11px] text-[#75777f] uppercase font-semibold">Verified Landlords</span>
            <p className="text-xl font-bold text-[#001637] font-plus-jakarta mt-1">
              {mockAdminStats.verifiedLandlords}
            </p>
            <span className="text-[10px] text-[#076a64] font-semibold flex items-center gap-0.5 mt-1">
              <span className="material-symbols-outlined text-[12px]">verified</span> 100% Biometric
            </span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-[#e7e8ea] shadow-xs">
            <span className="text-[11px] text-[#75777f] uppercase font-semibold">Pending KYC Queue</span>
            <p className="text-xl font-bold text-[#ba1a1a] font-plus-jakarta mt-1">
              {kycList.filter((k) => k.status.includes("Pending") || k.status.includes("Audit")).length}
            </p>
            <span className="text-[10px] text-[#ba1a1a] font-semibold flex items-center gap-0.5 mt-1">
              <span className="material-symbols-outlined text-[12px]">schedule</span> Avg wait: 28m
            </span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-[#e7e8ea] shadow-xs">
            <span className="text-[11px] text-[#75777f] uppercase font-semibold">Monthly Escrow</span>
            <p className="text-xl font-bold text-[#001637] font-plus-jakarta mt-1">
              {mockAdminStats.monthlyEscrow}
            </p>
            <span className="text-[10px] text-[#10b981] font-semibold flex items-center gap-0.5 mt-1">
              <span className="material-symbols-outlined text-[12px]">lock</span> Bank Guaranteed
            </span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-[#e7e8ea] shadow-xs">
            <span className="text-[11px] text-[#75777f] uppercase font-semibold">For Rent / Sale</span>
            <p className="text-xl font-bold text-[#076a64] font-plus-jakarta mt-1">
              {properties.filter((p) => p.transactionType === "rent").length} / {properties.filter((p) => p.transactionType === "sale").length}
            </p>
            <span className="text-[10px] text-[#44474e] font-semibold flex items-center gap-0.5 mt-1">
              Rent vs Sale Portfolio
            </span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-[#e7e8ea] shadow-xs">
            <span className="text-[11px] text-[#75777f] uppercase font-semibold">Compliance Score</span>
            <p className="text-xl font-bold text-[#001637] font-plus-jakarta mt-1">
              {mockAdminStats.complianceScore}
            </p>
            <span className="text-[10px] text-[#10b981] font-semibold flex items-center gap-0.5 mt-1">
              <span className="material-symbols-outlined text-[12px]">shield</span> Audit Passed
            </span>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 border-b border-[#e7e8ea] mb-6">
          <button
            type="button"
            onClick={() => setActiveTab("properties")}
            className={`pb-3 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === "properties"
                ? "border-[#001637] text-[#001637]"
                : "border-transparent text-[#75777f] hover:text-[#001637]"
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">real_estate_agent</span>
            <span>Properties Portfolio (CRUD)</span>
            <span className="px-2 py-0.5 bg-[#edeef0] text-[#001637] rounded-full text-[10px]">
              {properties.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("kyc")}
            className={`pb-3 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === "kyc"
                ? "border-[#001637] text-[#001637]"
                : "border-transparent text-[#75777f] hover:text-[#001637]"
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">verified_user</span>
            <span>Landlord KYC Queue</span>
            <span className="px-2 py-0.5 bg-[#edeef0] text-[#001637] rounded-full text-[10px]">
              {kycList.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("escrow")}
            className={`pb-3 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === "escrow"
                ? "border-[#001637] text-[#001637]"
                : "border-transparent text-[#75777f] hover:text-[#001637]"
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">account_balance</span>
            <span>Escrow &amp; Bank Liquidity</span>
          </button>
        </div>

        {/* =================================================================== */}
        {/* TAB 1: PROPERTIES PORTFOLIO FULL CRUD                               */}
        {/* =================================================================== */}
        {activeTab === "properties" && (
          <div className="bg-white rounded-2xl border border-[#e7e8ea] shadow-sm overflow-hidden mb-8">
            {/* Filter & Search Bar */}
            <div className="p-4 sm:p-6 border-b border-[#edeef0] flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <span className="material-symbols-outlined text-[18px] text-[#75777f] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  search
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by title, location, city, or landlord..."
                  className="w-full h-10 pl-9 pr-3 bg-[#f2f4f6] rounded-lg text-xs text-[#001637] placeholder:text-[#75777f] border border-[#e7e8ea] focus:bg-white focus:border-[#076a64] outline-none transition-all"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="h-10 px-3 bg-[#f2f4f6] text-xs font-semibold text-[#001637] rounded-lg border border-[#e7e8ea] focus:bg-white outline-none cursor-pointer"
                >
                  <option value="all">All Categories</option>
                  <option value="villas">Villas</option>
                  <option value="apartments">Apartments</option>
                  <option value="flats">Flats</option>
                  <option value="plots">Plots</option>
                </select>

                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="h-10 px-3 bg-[#f2f4f6] text-xs font-semibold text-[#001637] rounded-lg border border-[#e7e8ea] focus:bg-white outline-none cursor-pointer"
                >
                  <option value="all">All Types</option>
                  <option value="rent">For Rent</option>
                  <option value="sale">For Sale</option>
                </select>

                <button
                  type="button"
                  onClick={handleOpenCreate}
                  className="h-10 px-4 bg-[#076a64] hover:bg-[#00201e] text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-xs shrink-0"
                >
                  <span className="material-symbols-outlined text-[18px]">add</span>
                  <span>New Property</span>
                </button>
              </div>
            </div>

            {/* Properties Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#f2f4f6] text-[#44474e] uppercase text-[11px] tracking-wider border-b border-[#e7e8ea]">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Asset / Title</th>
                    <th className="py-3 px-4 font-semibold">Category &amp; Type</th>
                    <th className="py-3 px-4 font-semibold">Location</th>
                    <th className="py-3 px-4 font-semibold">Price (PKR)</th>
                    <th className="py-3 px-4 font-semibold">Specs (Beds / Size)</th>
                    <th className="py-3 px-4 font-semibold">Landlord</th>
                    <th className="py-3 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#edeef0]">
                  {filteredProperties.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-[#75777f]">
                        <span className="material-symbols-outlined text-4xl text-[#75777f]/40 mb-2 block">
                          domain_disabled
                        </span>
                        <p className="font-semibold text-sm text-[#001637]">No properties matched your criteria</p>
                        <p className="text-xs text-[#75777f] mt-1">
                          Try adjusting search filters or create a new property listing.
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setSearchQuery("");
                            setCategoryFilter("all");
                            setTypeFilter("all");
                          }}
                          className="mt-3 px-3 py-1.5 bg-[#edeef0] text-xs font-semibold rounded-lg hover:bg-[#e7e8ea] text-[#001637]"
                        >
                          Reset Filters
                        </button>
                      </td>
                    </tr>
                  ) : (
                    filteredProperties.map((p) => (
                      <tr key={p.id} className="hover:bg-[#f8f9fb] transition-colors group">
                        {/* Title & Thumbnail */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={p.imageUrl}
                              alt={p.title}
                              className="w-12 h-12 rounded-lg object-cover bg-gray-100 border border-[#e7e8ea] shrink-0"
                            />
                            <div className="max-w-xs">
                              <span className="font-bold text-[#001637] block truncate">
                                {p.title}
                              </span>
                              <div className="flex items-center gap-1.5 text-[10px] text-[#75777f] mt-0.5">
                                <span className="font-mono">ID: {p.id}</span>
                                {p.featured && (
                                  <span className="px-1.5 py-0.2 bg-[#001637] text-white rounded font-bold">
                                    Featured
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Category & Type */}
                        <td className="py-3.5 px-4">
                          <div className="flex flex-col gap-1 items-start">
                            <span className="px-2 py-0.5 bg-[#edeef0] text-[#001637] font-bold rounded capitalize text-[10px]">
                              {p.category}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                p.transactionType === "rent"
                                  ? "bg-[#a1f1e9] text-[#076a64]"
                                  : "bg-[#001637] text-white"
                              }`}
                            >
                              {p.transactionType === "rent" ? "For Rent" : "For Sale"}
                            </span>
                          </div>
                        </td>

                        {/* Location */}
                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-[#001637] block">{p.city}</span>
                          <span className="text-[11px] text-[#75777f] truncate block max-w-xs">
                            {p.location}
                          </span>
                        </td>

                        {/* Price */}
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-[#001637] block">
                            {p.priceFormatted}
                          </span>
                          {p.pricePeriod && (
                            <span className="text-[10px] text-[#75777f]">{p.pricePeriod}</span>
                          )}
                        </td>

                        {/* Specs */}
                        <td className="py-3.5 px-4 text-[#44474e]">
                          <span className="font-medium text-[#001637] block">{p.size}</span>
                          <span className="text-[11px] text-[#75777f]">
                            {p.beds} Beds • {p.baths} Baths
                          </span>
                        </td>

                        {/* Landlord */}
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-[#001637] block">{p.landlord?.name}</span>
                          <span className="text-[10px] text-[#076a64] font-semibold flex items-center gap-0.5">
                            <span className="material-symbols-outlined text-[12px]">verified</span>
                            Biometric OK
                          </span>
                        </td>

                        {/* Actions (Update, Delete, View) */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Link
                              href={`/properties/${p.id}`}
                              target="_blank"
                              title="View Public Page"
                              className="w-8 h-8 rounded-lg bg-[#f2f4f6] hover:bg-[#edeef0] text-[#001637] flex items-center justify-center transition-colors"
                            >
                              <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                            </Link>

                            <button
                              type="button"
                              onClick={() => handleOpenEdit(p)}
                              title="Edit Property"
                              className="w-8 h-8 rounded-lg bg-[#076a64]/10 hover:bg-[#076a64] text-[#076a64] hover:text-white flex items-center justify-center transition-colors"
                            >
                              <span className="material-symbols-outlined text-[16px]">edit</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setPropertyToDelete(p)}
                              title="Delete Property"
                              className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-600 text-red-600 hover:text-white flex items-center justify-center transition-colors"
                            >
                              <span className="material-symbols-outlined text-[16px]">delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 2: LANDLORD KYC VERIFICATION QUEUE                              */}
        {/* =================================================================== */}
        {activeTab === "kyc" && (
          <div className="bg-white rounded-2xl border border-[#e7e8ea] shadow-sm overflow-hidden mb-8">
            <div className="p-6 border-b border-[#edeef0] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#076a64]" />
                  <h3 className="text-lg font-bold text-[#001637] font-plus-jakarta">
                    Biometric Landlord KYC &amp; Title Verification Queue
                  </h3>
                </div>
                <p className="text-xs text-[#44474e] mt-0.5">
                  Review submitted deeds, NADRA biometric identities, and approve listings for live publication.
                </p>
              </div>

              {approvedCount > 0 && (
                <span className="px-3 py-1 bg-[#a1f1e9] text-[#076a64] text-xs font-bold rounded-full">
                  {approvedCount} item(s) approved in this session
                </span>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#f2f4f6] text-[#44474e] uppercase text-[11px] tracking-wider border-b border-[#e7e8ea]">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Queue ID</th>
                    <th className="py-3 px-4 font-semibold">Landlord Applicant</th>
                    <th className="py-3 px-4 font-semibold">Property Asset</th>
                    <th className="py-3 px-4 font-semibold">Verification Documents</th>
                    <th className="py-3 px-4 font-semibold">Trust Score</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                    <th className="py-3 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#edeef0]">
                  {kycList.map((item) => (
                    <tr key={item.id} className="hover:bg-[#f8f9fb] transition-colors">
                      <td className="py-4 px-4 font-mono font-semibold text-[#001637]">{item.id}</td>
                      <td className="py-4 px-4 font-bold text-[#001637]">
                        {item.landlord}
                        <span className="block text-[10px] text-[#75777f] font-normal">
                          Submitted {item.submittedAt}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-[#44474e] max-w-xs truncate">{item.property}</td>
                      <td className="py-4 px-4 text-[#001637] font-medium">
                        <span className="inline-flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px] text-[#076a64]">task</span>
                          {item.documentType}
                        </span>
                      </td>
                      <td className="py-4 px-4 font-bold text-[#076a64]">{item.trustScore}</td>
                      <td className="py-4 px-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            item.status.includes("Verified")
                              ? "bg-[#a1f1e9] text-[#076a64]"
                              : item.status.includes("Rejected")
                              ? "bg-[#ffdad6] text-[#ba1a1a]"
                              : "bg-[#ffddb9] text-[#241300]"
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        {item.status === "Pending Review" || item.status === "Under Audit" ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleApproveKyc(item.id)}
                              className="px-2.5 py-1 bg-[#076a64] hover:bg-[#00201e] text-white rounded text-[11px] font-semibold transition-colors"
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRejectKyc(item.id)}
                              className="px-2.5 py-1 bg-[#edeef0] hover:bg-[#ffdad6] text-[#ba1a1a] rounded text-[11px] font-semibold transition-colors"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-[#75777f]">Resolved</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 3: PLATFORM COMPLIANCE & ESCROW HEALTH SUMMARY                  */}
        {/* =================================================================== */}
        {activeTab === "escrow" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-white p-6 rounded-2xl border border-[#e7e8ea] shadow-sm">
              <h4 className="text-base font-bold text-[#001637] mb-2 font-plus-jakarta">
                State Escrow Liquidity Breakdown
              </h4>
              <p className="text-xs text-[#44474e] mb-4">
                Protected security deposits deposited in insured Pakistani banking reserves.
              </p>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span>Habib Bank Limited (HBL) Escrow</span>
                    <span>PKR 240.2M (50%)</span>
                  </div>
                  <div className="w-full h-2 bg-[#edeef0] rounded-full overflow-hidden">
                    <div className="h-full bg-[#001637] w-1/2" />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span>Meezan Bank Islamic Escrow</span>
                    <span>PKR 180.5M (37%)</span>
                  </div>
                  <div className="w-full h-2 bg-[#edeef0] rounded-full overflow-hidden">
                    <div className="h-full bg-[#076a64] w-[37%]" />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span>Standard Chartered Custody</span>
                    <span>PKR 61.8M (13%)</span>
                  </div>
                  <div className="w-full h-2 bg-[#edeef0] rounded-full overflow-hidden">
                    <div className="h-full bg-[#172b4d] w-[13%]" />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-[#e7e8ea] shadow-sm">
              <h4 className="text-base font-bold text-[#001637] mb-2 font-plus-jakarta">
                System Audit &amp; Biometric Integrations
              </h4>
              <p className="text-xs text-[#44474e] mb-4">
                Real-time synchronization status with Pakistani regulatory and land record authorities.
              </p>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-2.5 bg-[#f2f4f6] rounded-lg">
                  <span className="flex items-center gap-2 text-[#001637] font-semibold">
                    <span className="material-symbols-outlined text-[16px] text-[#076a64]">check_circle</span>
                    NADRA Biometric Verisys API
                  </span>
                  <span className="text-[11px] text-[#076a64] font-bold">Connected • 18ms</span>
                </div>
                <div className="flex items-center justify-between p-2.5 bg-[#f2f4f6] rounded-lg">
                  <span className="flex items-center gap-2 text-[#001637] font-semibold">
                    <span className="material-symbols-outlined text-[16px] text-[#076a64]">check_circle</span>
                    FBR Active Taxpayer Verification
                  </span>
                  <span className="text-[11px] text-[#076a64] font-bold">Connected • 42ms</span>
                </div>
                <div className="flex items-center justify-between p-2.5 bg-[#f2f4f6] rounded-lg">
                  <span className="flex items-center gap-2 text-[#001637] font-semibold">
                    <span className="material-symbols-outlined text-[16px] text-[#076a64]">check_circle</span>
                    Punjab Land Records Authority (PLRA)
                  </span>
                  <span className="text-[11px] text-[#076a64] font-bold">Connected • 65ms</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* =================================================================== */}
      {/* MODAL: ADD / EDIT PROPERTY FORM                                     */}
      {/* =================================================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-3xl my-8 border border-[#e7e8ea] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 bg-[#001637] text-white flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold font-plus-jakarta flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#a1f1e9]">
                    {editingPropertyId ? "edit_document" : "add_business"}
                  </span>
                  {editingPropertyId ? "Edit Property Asset" : "Add New Property Listing"}
                </h3>
                <p className="text-xs text-[#8093bb] mt-0.5">
                  {editingPropertyId
                    ? "Modify real estate parameters, price valuations, or landlord details."
                    : "Publish a newly verified property asset to HavenKey's nationwide catalog."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveProperty} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              {/* Row 1: Title */}
              <div>
                <label className="block text-xs font-semibold text-[#191c1e] mb-1">
                  Property Asset Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Executive 10 Marla Modern Villa"
                  className={`w-full h-10 px-3 bg-[#f2f4f6] rounded-lg border ${
                    formErrors.title ? "border-red-500 bg-red-50/20" : "border-[#e7e8ea]"
                  } focus:bg-white focus:border-[#076a64] outline-none transition-all`}
                />
                {formErrors.title && <p className="text-red-600 text-[11px] mt-1">{formErrors.title}</p>}
              </div>

              {/* Row 2: Property Type, Listing Type, Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#191c1e] mb-1">
                    Property Type (property_type) <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.property_type}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        property_type: e.target.value as "villas" | "apartments" | "flats" | "plots",
                        category: e.target.value as "villas" | "apartments" | "flats" | "plots",
                      })
                    }
                    className="w-full h-10 px-3 bg-[#f2f4f6] rounded-lg border border-[#e7e8ea] focus:bg-white outline-none"
                  >
                    <option value="villas">Villas</option>
                    <option value="apartments">Apartments</option>
                    <option value="flats">Flats</option>
                    <option value="plots">Plots</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#191c1e] mb-1">
                    Listing Type (listing_type) <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.listing_type}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        listing_type: e.target.value as "rent" | "sale",
                        transactionType: e.target.value as "rent" | "sale",
                        pricePeriod: e.target.value === "rent" ? "/ mo" : "",
                      })
                    }
                    className="w-full h-10 px-3 bg-[#f2f4f6] rounded-lg border border-[#e7e8ea] focus:bg-white outline-none"
                  >
                    <option value="rent">For Rent</option>
                    <option value="sale">For Sale</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#191c1e] mb-1">
                    Listing Status (status) <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        status: e.target.value as "available" | "rented" | "sold" | "pending",
                      })
                    }
                    className="w-full h-10 px-3 bg-[#f2f4f6] rounded-lg border border-[#e7e8ea] focus:bg-white outline-none font-semibold text-[#076a64]"
                  >
                    <option value="available">Available</option>
                    <option value="pending">Pending</option>
                    <option value="rented">Rented</option>
                    <option value="sold">Sold</option>
                  </select>
                </div>
              </div>

              {/* Row 3: Price & Period */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#191c1e] mb-1">
                    Price in PKR (price) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    placeholder="250000"
                    className={`w-full h-10 px-3 bg-[#f2f4f6] rounded-lg border ${
                      formErrors.price ? "border-red-500 bg-red-50/20" : "border-[#e7e8ea]"
                    } focus:bg-white focus:border-[#076a64] outline-none transition-all`}
                  />
                  {formErrors.price && <p className="text-red-600 text-[11px] mt-1">{formErrors.price}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#191c1e] mb-1">Price Period / Suffix</label>
                  <input
                    type="text"
                    value={formData.pricePeriod}
                    onChange={(e) => setFormData({ ...formData, pricePeriod: e.target.value })}
                    placeholder="/ mo or Total"
                    className="w-full h-10 px-3 bg-[#f2f4f6] rounded-lg border border-[#e7e8ea] focus:bg-white focus:border-[#076a64] outline-none transition-all"
                  />
                </div>
              </div>

              {/* Row 4: Area Value & Area Unit */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#191c1e] mb-1">
                    Area Value (area_value) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="0.5"
                    value={formData.area_value}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        area_value: Number(e.target.value),
                        size: `${e.target.value} ${formData.area_unit}`,
                      })
                    }
                    placeholder="10"
                    className={`w-full h-10 px-3 bg-[#f2f4f6] rounded-lg border ${
                      formErrors.area_value ? "border-red-500 bg-red-50/20" : "border-[#e7e8ea]"
                    } focus:bg-white focus:border-[#076a64] outline-none transition-all`}
                  />
                  {formErrors.area_value && (
                    <p className="text-red-600 text-[11px] mt-1">{formErrors.area_value}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#191c1e] mb-1">
                    Area Unit (area_unit) <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.area_unit}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        area_unit: e.target.value as "Marla" | "Kanal" | "Sq Ft" | "Sq Yd",
                        size: `${formData.area_value} ${e.target.value}`,
                      })
                    }
                    className="w-full h-10 px-3 bg-[#f2f4f6] rounded-lg border border-[#e7e8ea] focus:bg-white outline-none"
                  >
                    <option value="Marla">Marla</option>
                    <option value="Kanal">Kanal</option>
                    <option value="Sq Ft">Sq Ft</option>
                    <option value="Sq Yd">Sq Yd</option>
                  </select>
                </div>
              </div>

              {/* Row 5: Bedrooms & Bathrooms */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#191c1e] mb-1">
                    Bedrooms (bedroom)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    value={formData.bedroom}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        bedroom: Number(e.target.value),
                        beds: Number(e.target.value),
                      })
                    }
                    className="w-full h-10 px-3 bg-[#f2f4f6] rounded-lg border border-[#e7e8ea] focus:bg-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#191c1e] mb-1">
                    Bathrooms (bathroom)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    value={formData.bathroom}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        bathroom: Number(e.target.value),
                        baths: Number(e.target.value),
                      })
                    }
                    className="w-full h-10 px-3 bg-[#f2f4f6] rounded-lg border border-[#e7e8ea] focus:bg-white outline-none"
                  />
                </div>
              </div>

              {/* Row 6: Location (City) & Detailed Street Address */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#191c1e] mb-1">
                    Location / City (location) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        location: e.target.value,
                        city: e.target.value.split(",")[0].trim(),
                      })
                    }
                    placeholder="e.g. Lahore, DHA Phase 6"
                    className={`w-full h-10 px-3 bg-[#f2f4f6] rounded-lg border ${
                      formErrors.location ? "border-red-500 bg-red-50/20" : "border-[#e7e8ea]"
                    } focus:bg-white focus:border-[#076a64] outline-none transition-all`}
                  />
                  {formErrors.location && (
                    <p className="text-red-600 text-[11px] mt-1">{formErrors.location}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#191c1e] mb-1">
                    Detailed Address (address) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="e.g. House 42, Street 7, Sector J"
                    className={`w-full h-10 px-3 bg-[#f2f4f6] rounded-lg border ${
                      formErrors.address ? "border-red-500 bg-red-50/20" : "border-[#e7e8ea]"
                    } focus:bg-white focus:border-[#076a64] outline-none transition-all`}
                  />
                  {formErrors.address && (
                    <p className="text-red-600 text-[11px] mt-1">{formErrors.address}</p>
                  )}
                </div>
              </div>

              {/* Row 6: Image URL & Presets */}
              <div>
                <label className="block text-xs font-semibold text-[#191c1e] mb-1">Property Image URL</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="url"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    placeholder="https://..."
                    className="flex-1 h-10 px-3 bg-[#f2f4f6] rounded-lg border border-[#e7e8ea] focus:bg-white outline-none text-xs"
                  />
                  {formData.imageUrl && (
                    <img
                      src={formData.imageUrl}
                      alt="Preview"
                      className="w-10 h-10 rounded-lg object-cover border border-[#e7e8ea] shrink-0"
                    />
                  )}
                </div>
                {/* Preset Fast Selection */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] text-[#75777f] font-semibold">Or pick architectural preset:</span>
                  {PRESET_IMAGES.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setFormData({ ...formData, imageUrl: preset.url })}
                      className="px-2 py-1 bg-[#edeef0] hover:bg-[#076a64] hover:text-white rounded text-[10px] font-semibold transition-colors"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Row 7: Description */}
              <div>
                <label className="block text-xs font-semibold text-[#191c1e] mb-1">Description</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Highlight structural features, floor layout, proximity to commercial sectors, and security setup..."
                  className="w-full p-3 bg-[#f2f4f6] rounded-lg border border-[#e7e8ea] focus:bg-white focus:border-[#076a64] outline-none text-xs resize-none"
                />
              </div>

              {/* Row 8: Landlord Details */}
              <div className="p-3 bg-[#f2f4f6] rounded-xl border border-[#e7e8ea] space-y-3">
                <span className="text-[11px] font-bold text-[#001637] uppercase tracking-wider block">
                  Landlord &amp; Concierge Verification
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#44474e] mb-1">
                      Landlord Legal Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.landlordName}
                      onChange={(e) => setFormData({ ...formData, landlordName: e.target.value })}
                      placeholder="e.g. Waleed Hassan"
                      className="w-full h-9 px-2.5 bg-white rounded-lg border border-[#e7e8ea] text-xs outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#44474e] mb-1">Phone</label>
                    <input
                      type="text"
                      value={formData.landlordPhone}
                      onChange={(e) => setFormData({ ...formData, landlordPhone: e.target.value })}
                      placeholder="+92 300 1234567"
                      className="w-full h-9 px-2.5 bg-white rounded-lg border border-[#e7e8ea] text-xs outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#44474e] mb-1">Email</label>
                    <input
                      type="email"
                      value={formData.landlordEmail}
                      onChange={(e) => setFormData({ ...formData, landlordEmail: e.target.value })}
                      placeholder="landlord@havenkey.pk"
                      className="w-full h-9 px-2.5 bg-white rounded-lg border border-[#e7e8ea] text-xs outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Row 9: Amenities */}
              <div>
                <label className="block text-xs font-semibold text-[#191c1e] mb-1">
                  Amenities (comma separated)
                </label>
                <input
                  type="text"
                  value={formData.amenitiesStr}
                  onChange={(e) => setFormData({ ...formData, amenitiesStr: e.target.value })}
                  placeholder="24/7 Security, Backup Generator, Solar Inverter, Servant Quarter"
                  className="w-full h-10 px-3 bg-[#f2f4f6] rounded-lg border border-[#e7e8ea] focus:bg-white outline-none text-xs"
                />
              </div>

              {/* Row 10: Checkboxes */}
              <div className="flex flex-wrap items-center gap-6 pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formData.verified}
                    onChange={(e) => setFormData({ ...formData, verified: e.target.checked })}
                    className="w-4 h-4 rounded text-[#076a64] focus:ring-0"
                  />
                  <span className="text-xs font-semibold text-[#001637]">
                    Biometrically Verified &amp; Title Cleared
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formData.featured}
                    onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                    className="w-4 h-4 rounded text-[#076a64] focus:ring-0"
                  />
                  <span className="text-xs font-semibold text-[#001637]">
                    Feature on Homepage Carousel
                  </span>
                </label>
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-[#edeef0] flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-[#edeef0] hover:bg-[#e7e8ea] text-[#001637] text-xs font-bold rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#076a64] hover:bg-[#00201e] text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <span className="material-symbols-outlined text-[16px]">save</span>
                  <span>{editingPropertyId ? "Save Property Changes" : "Publish Property Asset"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL: DELETE CONFIRMATION DIALOG                                   */}
      {/* =================================================================== */}
      {propertyToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 border border-[#e7e8ea] shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-2xl">delete_forever</span>
            </div>

            <h3 className="text-base font-bold text-[#001637] font-plus-jakarta mb-1">
              Delete Property Listing?
            </h3>
            <p className="text-xs text-[#44474e] leading-relaxed mb-4">
              Are you sure you want to delete <span className="font-bold text-[#001637]">{propertyToDelete.title}</span>? This will remove the listing from all public search indexes, rental catalogs, and escrow mappings.
            </p>

            <div className="p-3 bg-[#f2f4f6] rounded-xl flex items-center gap-3 mb-5 border border-[#e7e8ea]">
              <img
                src={propertyToDelete.imageUrl}
                alt={propertyToDelete.title}
                className="w-10 h-10 rounded-lg object-cover"
              />
              <div className="overflow-hidden">
                <span className="font-bold text-xs text-[#001637] block truncate">
                  {propertyToDelete.title}
                </span>
                <span className="text-[11px] text-[#75777f]">
                  {propertyToDelete.city} • {propertyToDelete.priceFormatted}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setPropertyToDelete(null)}
                className="px-4 py-2 bg-[#edeef0] hover:bg-[#e7e8ea] text-[#001637] text-xs font-bold rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <span className="material-symbols-outlined text-[16px]">delete</span>
                <span>Confirm Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
