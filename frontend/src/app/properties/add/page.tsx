"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import { Property, getStoredProperties, saveStoredProperties } from "@/lib/mock-data";

export default function AddPropertyPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form states matching database schema
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [propertyType, setPropertyType] = useState<"villas" | "apartments" | "flats" | "plots">("villas");
  const [listingType, setListingType] = useState<"rent" | "sale">("rent");
  const [price, setPrice] = useState<number | "">(250000);
  const [areaValue, setAreaValue] = useState<number | "">(10);
  const [areaUnit, setAreaUnit] = useState<"Marla" | "Kanal" | "Sq Ft" | "Sq Yd">("Marla");
  const [bedroom, setBedroom] = useState<number>(4);
  const [bathroom, setBathroom] = useState<number>(4);
  const [location, setLocation] = useState("Lahore");
  const [address, setAddress] = useState("DHA Phase 6, Sector J, Street 4");
  const [status, setStatus] = useState<"available" | "rented" | "sold" | "pending">("available");

  // Pure Device Image Upload States (NO links!)
  const [images, setImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  // Convert device file to Data URL for instant, permanent local preview
  const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => resolve("");
      reader.readAsDataURL(file);
    });
  };

  // Handle image files from device
  const handleDeviceImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const fileList = Array.from(files);

    // 1. Convert files to Data URLs immediately
    const dataUrls = await Promise.all(fileList.map((f) => fileToDataUrl(f)));
    const validDataUrls = dataUrls.filter(Boolean);

    setImages((prev) => [...prev, ...validDataUrls]);
    setErrors((prev) => {
      const copy = { ...prev };
      delete copy.images;
      return copy;
    });

    // 2. Upload to backend Multer endpoint
    try {
      const formData = new FormData();
      fileList.forEach((file) => {
        formData.append("images", file);
      });

      const res = await fetch("http://localhost:5000/api/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.urls)) {
          // Replace base64 items with permanent Multer URLs
          setImages((prev) => {
            const nonLocal = prev.filter((img) => !validDataUrls.includes(img));
            return [...nonLocal, ...json.urls];
          });
          showToast(`Uploaded ${json.urls.length} photo(s) from device!`);
        }
      } else {
        showToast(`${fileList.length} photo(s) loaded from device!`);
      }
    } catch {
      showToast(`${fileList.length} photo(s) loaded from device!`);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    showToast("Photo removed.");
  };

  const handleSetCover = (index: number) => {
    setImages((prev) => {
      const target = prev[index];
      const others = prev.filter((_, i) => i !== index);
      return [target, ...others];
    });
    showToast("Cover photo updated!");
  };

  // Validation
  const validate = () => {
    const err: Record<string, string> = {};
    if (!title.trim() || title.trim().length < 4) {
      err.title = "Please enter a property title (at least 4 characters).";
    }
    if (!price || Number(price) <= 0) {
      err.price = "Please enter a valid price in PKR.";
    }
    if (!location.trim()) {
      err.location = "City / Major Location is required.";
    }
    if (!address.trim()) {
      err.address = "Detailed street address is required.";
    }
    if (images.length === 0) {
      err.images = "Please upload at least 1 image from your device.";
    }
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const numPrice = Number(price);
    const numArea = Number(areaValue) || 10;
    const formattedPrice = `PKR ${numPrice.toLocaleString()}`;

    const newProperty: Property = {
      id: `prop-${Date.now()}`,
      owner_id: "usr-admin-01",
      title: title.trim(),
      description: description.trim() || `${title} located in ${location}.`,
      property_type: propertyType,
      listing_type: listingType,
      price: numPrice,
      area_value: numArea,
      area_unit: areaUnit,
      bedroom,
      bathroom,
      location: location.trim(),
      address: address.trim(),
      status,
      image_url: images[0] || "",
      images: images,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),

      // UI convenience aliases
      category: propertyType,
      transactionType: listingType,
      priceFormatted: formattedPrice,
      pricePeriod: listingType === "rent" ? "/ mo" : "",
      city: location.trim().split(",")[0].trim() || location.trim(),
      beds: bedroom,
      baths: bathroom,
      size: `${numArea} ${areaUnit}`,
      imageUrl: images[0] || "",
      imageAlt: title.trim(),
      featured: true,
      verified: true,
      landlord: {
        name: "Admin Landlord",
        initials: "AL",
        verified: true,
        rating: 5.0,
        phone: "+92 300 1234567",
        email: "admin@gmail.com",
      },
      amenities: ["24/7 Security", "Backup Power", "Dedicated Parking", "Biometric Title Verified"],
    };

    // 1. Save to LocalStorage immediately
    const existing = getStoredProperties();
    const updated = [newProperty, ...existing];
    saveStoredProperties(updated);

    // 2. Background POST to backend API
    try {
      await fetch("http://localhost:5000/api/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newProperty),
      });
    } catch {
      // LocalStorage already has it
    }

    // 3. Dispatch global sync event and redirect to properties catalog
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("havenkey_properties_change"));
    }

    showToast("Property published successfully!");
    setTimeout(() => {
      router.push("/properties");
    }, 600);
  };

  return (
    <>
      <Navbar />

      <main className="w-full pt-28 pb-20 bg-[#f8f9fb] min-h-screen">
        <div className="max-w-4xl mx-auto px-6">
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
            <span className="text-[#001637] font-semibold">Upload Property</span>
          </div>

          {/* Toast Notification */}
          {toast && (
            <div className="fixed bottom-6 right-6 z-50 px-4 py-3 bg-[#001637] text-white text-xs font-bold rounded-xl shadow-2xl flex items-center gap-2 border border-[#a1f1e9]/30 animate-in fade-in slide-in-from-bottom-3">
              <span className="material-symbols-outlined text-[18px] text-[#a1f1e9]">check_circle</span>
              <span>{toast}</span>
            </div>
          )}

          {/* Page Card */}
          <div className="bg-white rounded-2xl border border-[#e7e8ea] shadow-sm overflow-hidden">
            {/* Header Banner */}
            <div className="p-6 md:p-8 bg-[#001637] text-white">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-[#076a64] flex items-center justify-center text-white shadow-md">
                  <span className="material-symbols-outlined text-[24px]">add_photo_alternate</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold font-plus-jakarta tracking-tight">
                    Upload &amp; Add New Property
                  </h1>
                  <p className="text-xs text-[#a1f1e9] mt-0.5">
                    Upload photos directly from your device and list your property instantly.
                  </p>
                </div>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6 text-xs">
              {/* SECTION 1: PURE DEVICE IMAGE UPLOADER */}
              <div className="p-5 bg-[#f2f4f6] rounded-2xl border-2 border-[#076a64]/20 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h2 className="text-sm font-bold text-[#001637] flex items-center gap-2">
                      <span className="material-symbols-outlined text-[20px] text-[#076a64]">cloud_upload</span>
                      <span>Upload Images from Device</span>
                      <span className="text-red-500 font-bold">*</span>
                    </h2>
                    <p className="text-[11px] text-[#75777f] mt-0.5">
                      Select photos directly from your computer or phone. No URL links. You can upload multiple images.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {isUploading && (
                      <span className="text-xs font-bold text-[#076a64] flex items-center gap-1 animate-pulse">
                        <span className="material-symbols-outlined text-[14px] animate-spin">sync</span>
                        Uploading...
                      </span>
                    )}
                    <span className="px-3 py-1 bg-white text-[#076a64] rounded-full font-bold text-xs border border-[#e7e8ea] shadow-2xs">
                      {images.length} Image{images.length === 1 ? "" : "s"} Selected
                    </span>
                  </div>
                </div>

                {/* Validation Error if no image uploaded */}
                {errors.images && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-600 font-bold text-xs">
                    <span className="material-symbols-outlined text-[18px]">error</span>
                    <span>{errors.images}</span>
                  </div>
                )}

                {/* Hidden File Input */}
                <input
                  type="file"
                  ref={fileInputRef}
                  multiple
                  accept="image/png,image/jpeg,image/webp,image/jpg"
                  onChange={handleDeviceImageUpload}
                  className="hidden"
                />

                {/* Prominent Upload Button & Dropzone */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-[#076a64]/50 hover:border-[#076a64] bg-white rounded-xl p-8 text-center cursor-pointer transition-all hover:bg-[#e6f7f5]/40 group"
                >
                  <div className="w-14 h-14 mx-auto rounded-full bg-[#e6f7f5] group-hover:bg-[#a1f1e9] flex items-center justify-center text-[#076a64] transition-colors mb-3 shadow-xs">
                    <span className="material-symbols-outlined text-[32px]">add_a_photo</span>
                  </div>
                  <p className="text-sm font-bold text-[#001637]">
                    Click here to choose photos from your device
                  </p>
                  <p className="text-xs text-[#75777f] mt-1">
                    Select 1 or multiple pictures (PNG, JPG, JPEG, WebP)
                  </p>
                  <button
                    type="button"
                    disabled={isUploading}
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    className="mt-4 px-5 py-2.5 bg-[#076a64] hover:bg-[#00201e] text-white font-bold text-xs rounded-xl inline-flex items-center gap-2 transition-colors shadow-sm cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">file_upload</span>
                    <span>{isUploading ? "Uploading..." : "Select Images From Computer / Phone"}</span>
                  </button>
                </div>

                {/* Contained Preview Blocks Grid */}
                {images.length > 0 && (
                  <div className="pt-2">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-bold text-xs text-[#001637]">
                        Contained Image Blocks ({images.length})
                      </span>
                      <span className="text-[11px] text-[#75777f]">
                        First image is your Cover Photo • Hover to Delete or Change Cover
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
                      {images.map((imgUrl, idx) => (
                        <div
                          key={`${imgUrl.slice(0, 30)}-${idx}`}
                          className={`relative aspect-square rounded-xl overflow-hidden border-2 ${
                            idx === 0 ? "border-[#076a64] ring-2 ring-[#a1f1e9]" : "border-[#d2d4d7]"
                          } bg-slate-900 group shadow-sm transition-all`}
                        >
                          <img
                            src={imgUrl}
                            alt={`Uploaded property image ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />

                          {/* Top Badge: Cover vs Order */}
                          <div className="absolute top-1.5 left-1.5 z-10 pointer-events-none">
                            {idx === 0 ? (
                              <span className="px-2 py-0.5 bg-[#076a64] text-white text-[10px] font-bold rounded shadow-md flex items-center gap-1">
                                <span className="material-symbols-outlined text-[12px]">star</span>
                                Cover
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 bg-black/60 backdrop-blur-xs text-white text-[9px] font-semibold rounded">
                                #{idx + 1}
                              </span>
                            )}
                          </div>

                          {/* Hover Actions Overlay */}
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2 z-20">
                            {idx !== 0 && (
                              <button
                                type="button"
                                onClick={() => handleSetCover(idx)}
                                title="Set as Cover Photo"
                                className="w-8 h-8 bg-white hover:bg-[#076a64] hover:text-white rounded-lg flex items-center justify-center text-[#001637] transition-colors shadow-md cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-[16px]">star</span>
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(idx)}
                              title="Delete photo"
                              className="w-8 h-8 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center justify-center transition-colors shadow-md cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-[16px]">delete</span>
                            </button>
                          </div>
                        </div>
                      ))}

                      {/* Add More Photos Block */}
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="aspect-square rounded-xl border-2 border-dashed border-[#076a64]/50 hover:border-[#076a64] bg-white hover:bg-[#e6f7f5]/40 flex flex-col items-center justify-center text-[#076a64] transition-all p-2 gap-1 cursor-pointer group shadow-2xs"
                      >
                        <span className="material-symbols-outlined text-[28px] group-hover:scale-110 transition-transform">
                          add_photo_alternate
                        </span>
                        <span className="text-[10px] font-bold text-center leading-tight">
                          + Add More
                        </span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION 2: PROPERTY DETAILS */}
              <div className="space-y-4 pt-2">
                <h2 className="text-sm font-bold text-[#001637] border-b border-[#edeef0] pb-2">
                  Property Asset Details
                </h2>

                {/* Title */}
                <div>
                  <label className="block text-xs font-semibold text-[#191c1e] mb-1">
                    Property Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Modern 10 Marla Luxury Villa with Garden"
                    className={`w-full h-11 px-3.5 bg-[#f2f4f6] rounded-xl border ${
                      errors.title ? "border-red-500 bg-red-50/20" : "border-[#e7e8ea]"
                    } focus:bg-white focus:border-[#076a64] outline-none text-xs transition-all`}
                  />
                  {errors.title && <p className="text-red-600 text-[11px] mt-1 font-semibold">{errors.title}</p>}
                </div>

                {/* Property Type, Listing Type, Status */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#191c1e] mb-1">
                      Property Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={propertyType}
                      onChange={(e) => setPropertyType(e.target.value as any)}
                      className="w-full h-11 px-3 bg-[#f2f4f6] rounded-xl border border-[#e7e8ea] focus:bg-white outline-none font-semibold text-[#001637]"
                    >
                      <option value="villas">Villas</option>
                      <option value="apartments">Apartments</option>
                      <option value="flats">Flats</option>
                      <option value="plots">Plots</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#191c1e] mb-1">
                      Listing Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={listingType}
                      onChange={(e) => setListingType(e.target.value as any)}
                      className="w-full h-11 px-3 bg-[#f2f4f6] rounded-xl border border-[#e7e8ea] focus:bg-white outline-none font-semibold text-[#001637]"
                    >
                      <option value="rent">For Rent</option>
                      <option value="sale">For Sale</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#191c1e] mb-1">
                      Status <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as any)}
                      className="w-full h-11 px-3 bg-[#f2f4f6] rounded-xl border border-[#e7e8ea] focus:bg-white outline-none font-semibold text-[#076a64]"
                    >
                      <option value="available">Available</option>
                      <option value="pending">Pending</option>
                      <option value="rented">Rented</option>
                      <option value="sold">Sold</option>
                    </select>
                  </div>
                </div>

                {/* Price & Area */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#191c1e] mb-1">
                      Price in PKR <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={price}
                      onChange={(e) => setPrice(e.target.value ? Number(e.target.value) : "")}
                      placeholder="250000"
                      className={`w-full h-11 px-3.5 bg-[#f2f4f6] rounded-xl border ${
                        errors.price ? "border-red-500 bg-red-50/20" : "border-[#e7e8ea]"
                      } focus:bg-white focus:border-[#076a64] outline-none text-xs transition-all`}
                    />
                    {errors.price && <p className="text-red-600 text-[11px] mt-1 font-semibold">{errors.price}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#191c1e] mb-1">
                      Area Value <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="0.5"
                      value={areaValue}
                      onChange={(e) => setAreaValue(e.target.value ? Number(e.target.value) : "")}
                      placeholder="10"
                      className="w-full h-11 px-3.5 bg-[#f2f4f6] rounded-xl border border-[#e7e8ea] focus:bg-white outline-none text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#191c1e] mb-1">
                      Area Unit <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={areaUnit}
                      onChange={(e) => setAreaUnit(e.target.value as any)}
                      className="w-full h-11 px-3 bg-[#f2f4f6] rounded-xl border border-[#e7e8ea] focus:bg-white outline-none font-semibold text-[#001637]"
                    >
                      <option value="Marla">Marla</option>
                      <option value="Kanal">Kanal</option>
                      <option value="Sq Ft">Sq Ft</option>
                      <option value="Sq Yd">Sq Yd</option>
                    </select>
                  </div>
                </div>

                {/* Bedrooms & Bathrooms */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#191c1e] mb-1">Bedrooms</label>
                    <input
                      type="number"
                      min="0"
                      max="20"
                      value={bedroom}
                      onChange={(e) => setBedroom(Number(e.target.value))}
                      className="w-full h-11 px-3 bg-[#f2f4f6] rounded-xl border border-[#e7e8ea] focus:bg-white outline-none text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#191c1e] mb-1">Bathrooms</label>
                    <input
                      type="number"
                      min="0"
                      max="20"
                      value={bathroom}
                      onChange={(e) => setBathroom(Number(e.target.value))}
                      className="w-full h-11 px-3 bg-[#f2f4f6] rounded-xl border border-[#e7e8ea] focus:bg-white outline-none text-xs"
                    />
                  </div>
                </div>

                {/* Location & Address */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#191c1e] mb-1">
                      City / Location <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g. Lahore, DHA Phase 6"
                      className={`w-full h-11 px-3.5 bg-[#f2f4f6] rounded-xl border ${
                        errors.location ? "border-red-500 bg-red-50/20" : "border-[#e7e8ea]"
                      } focus:bg-white focus:border-[#076a64] outline-none text-xs transition-all`}
                    />
                    {errors.location && <p className="text-red-600 text-[11px] mt-1 font-semibold">{errors.location}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#191c1e] mb-1">
                      Detailed Street Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="e.g. House 42, Street 7, Sector J"
                      className={`w-full h-11 px-3.5 bg-[#f2f4f6] rounded-xl border ${
                        errors.address ? "border-red-500 bg-red-50/20" : "border-[#e7e8ea]"
                      } focus:bg-white focus:border-[#076a64] outline-none text-xs transition-all`}
                    />
                    {errors.address && <p className="text-red-600 text-[11px] mt-1 font-semibold">{errors.address}</p>}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-semibold text-[#191c1e] mb-1">Description</label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide a detailed description of the property, features, proximity to schools, etc."
                    className="w-full p-3 bg-[#f2f4f6] rounded-xl border border-[#e7e8ea] focus:bg-white focus:border-[#076a64] outline-none text-xs transition-all"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-[#edeef0] flex items-center justify-end gap-3">
                <Link
                  href="/properties"
                  className="px-5 py-2.5 bg-[#edeef0] hover:bg-[#e7e8ea] text-[#001637] font-bold rounded-xl transition-colors"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="px-6 py-2.5 bg-[#076a64] hover:bg-[#00201e] text-white font-bold rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">cloud_done</span>
                  <span>Publish Property with Photos</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
