"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import {
  mockAdminStats,
  mockKycQueue,
  mockProperties,
  Property,
  getStoredProperties,
  saveStoredProperties,
} from "@/lib/mock-data";

// Self-contained default placeholder (no external links)
const DEFAULT_PLACEHOLDER =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='800' height='600' viewBox='0 0 800 600'><rect width='800' height='600' fill='%23001637'/><g fill='%23a1f1e9' text-anchor='middle' font-family='system-ui,sans-serif'><text x='400' y='280' font-size='44'>🏡</text><text x='400' y='335' font-size='18' font-weight='600'>No Image Uploaded</text></g></svg>";

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
  images: string[];

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
  imageUrl: "",
  images: [],

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
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState<"properties" | "kyc" | "escrow" | "documents" | "complaints">("properties");
  const [properties, setProperties] = useState<Property[]>([]);
  const [kycList, setKycList] = useState(mockKycQueue);
  const [approvedCount, setApprovedCount] = useState(0);
  const [liveStats, setLiveStats] = useState<any>({
    totalProperties: 0,
    rentProperties: 0,
    saleProperties: 0,
    escrow: { formatted: "PKR 0" },
    complaints: { total: 0, pending: 0, resolved: 0 },
    users: { total: 0, landlords: 0 },
  });

  // Tenant Complaints State
  interface AdminComplaint {
    id: string;
    user_id: string | null;
    property_id: string | null;
    agreement_id: string | null;
    title: string;
    description: string;
    status: "pending" | "in_progress" | "resolved" | "rejected";
    created_at: string;
    properties?: {
      id: string;
      title: string;
      location: string;
    } | null;
    users?: {
      id: string;
      fullname: string;
      email: string;
      phone_no: string;
    } | null;
  }
  const [complaintsList, setComplaintsList] = useState<AdminComplaint[]>([]);
  const [isLoadingComplaints, setIsLoadingComplaints] = useState(false);
  const [complaintSearch, setComplaintSearch] = useState("");
  const [complaintStatusFilter, setComplaintStatusFilter] = useState("all");
  const [updatingComplaintId, setUpdatingComplaintId] = useState<string | null>(null);


  // Document Management State (RAG System)
  interface IndexedDoc {
    docId: string;
    sourceKey: string;
    filename: string;
    chunkCount: number;
    createdAt: string;
  }
  const [documents, setDocuments] = useState<IndexedDoc[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [docToDelete, setDocToDelete] = useState<IndexedDoc | null>(null);
  const [isDeletingDoc, setIsDeletingDoc] = useState(false);
  const [docSearchQuery, setDocSearchQuery] = useState("");
  const docFileInputRef = useRef<HTMLInputElement>(null);

  // Property Table Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  // Modal State for Create & Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPropertyId, setEditingPropertyId] = useState<string | null>(null);
  const [formData, setFormData] = useState<PropertyFormData>(INITIAL_FORM);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Delete Confirmation State
  const [propertyToDelete, setPropertyToDelete] = useState<Property | null>(null);

  // Notification Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchDocuments = async () => {
    try {
      setIsLoadingDocs(true);
      const res = await fetch("/api/admin/documents");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setDocuments(json.data);
      }
    } catch (err: any) {
      console.error("Failed to fetch documents:", err);
    } finally {
      setIsLoadingDocs(false);
    }
  };

  const fetchComplaints = async () => {
    try {
      setIsLoadingComplaints(true);
      const res = await fetch("/api/complaints");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setComplaintsList(json.data);
      }
    } catch (err: any) {
      console.error("Failed to fetch complaints:", err);
    } finally {
      setIsLoadingComplaints(false);
    }
  };

  const handleUpdateComplaintStatus = async (id: string, newStatus: string) => {
    try {
      setUpdatingComplaintId(id);
      const res = await fetch("/api/complaints", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to update complaint status");
      }

      setComplaintsList((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status: newStatus as any } : c))
      );
      showToast(`Complaint #${id.slice(0, 8)} status marked as "${newStatus.replace("_", " ")}".`);

      // Refresh live stats
      fetch("/api/stats")
        .then((r) => r.json())
        .then((j) => {
          if (j.success && j.data) setLiveStats(j.data);
        })
        .catch(() => {});
    } catch (err: any) {
      showToast(`Error updating complaint: ${err.message}`);
    } finally {
      setUpdatingComplaintId(null);
    }
  };

  useEffect(() => {
    if (activeTab === "documents") {
      fetchDocuments();
    }
    if (activeTab === "complaints") {
      fetchComplaints();
    }
  }, [activeTab]);

  const handleUploadDocument = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validExts = [".pdf", ".txt"];
    const hasValidExt = validExts.some((ext) => file.name.toLowerCase().endsWith(ext));
    if (!hasValidExt) {
      showToast("Invalid file format. Please upload a PDF or TXT file.");
      if (docFileInputRef.current) docFileInputRef.current.value = "";
      return;
    }

    try {
      setIsUploadingDoc(true);
      setUploadProgress("Extracting text & computing 384-d embeddings...");

      const fd = new FormData();
      fd.append("file", file);

      const res = await fetch("/api/admin/documents", {
        method: "POST",
        headers: {
          "x-admin-role": "admin",
        },
        body: fd,
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Upload failed");
      }

      showToast(`Successfully indexed "${file.name}" into ${json.data.chunkCount} chunks!`);
      await fetchDocuments();
    } catch (err: any) {
      showToast(`Upload error: ${err.message}`);
    } finally {
      setIsUploadingDoc(false);
      setUploadProgress(null);
      if (docFileInputRef.current) docFileInputRef.current.value = "";
    }
  };

  const handleDeleteDocument = async () => {
    if (!docToDelete) return;
    try {
      setIsDeletingDoc(true);
      const res = await fetch(`/api/admin/documents?sourceKey=${encodeURIComponent(docToDelete.sourceKey)}`, {
        method: "DELETE",
        headers: {
          "x-admin-role": "admin",
        },
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to delete");
      }
      showToast(`Document "${docToDelete.filename}" removed from knowledge base.`);
      setDocToDelete(null);
      await fetchDocuments();
    } catch (err: any) {
      showToast(`Delete failed: ${err.message}`);
    } finally {
      setIsDeletingDoc(false);
    }
  };

  // Convert file from device to Data URL (Base64) for instant rendering and resilient local fallback
  const readFileAsDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => resolve("");
      reader.readAsDataURL(file);
    });
  };

  // Image Upload Handlers using Multer
  const handleImageFilesSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingImages(true);
    const fileArray = Array.from(files);

    // 1. Convert device files to Data URLs immediately so they render into blocks instantly
    const dataUrls = await Promise.all(fileArray.map((f) => readFileAsDataUrl(f)));
    const validDataUrls = dataUrls.filter(Boolean);

    setFormData((prev) => {
      const merged = [...prev.images, ...validDataUrls];
      return {
        ...prev,
        images: merged,
        imageUrl: merged[0] || "",
      };
    });

    // Clear validation error on upload
    setFormErrors((prev) => {
      const next = { ...prev };
      delete next.images;
      return next;
    });

    // 2. Upload to backend Multer endpoint
    try {
      const uploadData = new FormData();
      fileArray.forEach((file) => {
        uploadData.append("images", file);
      });

      const res = await fetch("http://localhost:5000/api/upload", {
        method: "POST",
        body: uploadData,
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.urls)) {
          // Replace base64 preview items with permanent Multer static URLs
          setFormData((prev) => {
            const nonLocal = prev.images.filter((img) => !validDataUrls.includes(img));
            const finalMerged = [...nonLocal, ...json.urls];
            return {
              ...prev,
              images: finalMerged,
              imageUrl: finalMerged[0] || "",
            };
          });
          showToast(`Uploaded ${json.urls.length} image(s) via Multer!`);
        }
      } else {
        showToast(`${fileArray.length} image(s) added to property gallery!`);
      }
    } catch {
      showToast(`${fileArray.length} image(s) added to property gallery!`);
    } finally {
      setIsUploadingImages(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setFormData((prev) => {
      const updated = prev.images.filter((_, idx) => idx !== indexToRemove);
      return {
        ...prev,
        images: updated,
        imageUrl: updated[0] || "",
      };
    });
    showToast("Image removed from gallery.");
  };

  const handleSetCoverImage = (indexToCover: number) => {
    setFormData((prev) => {
      const target = prev.images[indexToCover];
      const others = prev.images.filter((_, idx) => idx !== indexToCover);
      const updated = [target, ...others];
      return {
        ...prev,
        images: updated,
        imageUrl: target,
      };
    });
    showToast("Primary cover image set!");
  };

  // Synchronize properties with localStorage & Verify Admin Authorization
  useEffect(() => {
    // 0. Security Guard: Verify Admin Sign-In
    try {
      const stored = typeof window !== "undefined" ? localStorage.getItem("havenkey_user") : null;
      if (!stored) {
        setIsAuthorized(false);
        window.location.href = "/login?redirect=/admin/dashboard&reason=admin_required";
        return;
      }
      const parsed = JSON.parse(stored);
      if (parsed.role !== "admin") {
        setIsAuthorized(false);
        window.location.href = "/login?redirect=/admin/dashboard&reason=admin_required";
        return;
      }
      setIsAuthorized(true);
    } catch {
      setIsAuthorized(false);
      window.location.href = "/login?redirect=/admin/dashboard&reason=admin_required";
      return;
    }

    const loaded = getStoredProperties();
    setProperties(loaded);

    // Auto-open Add Property modal if URL has ?add=true
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("add") === "true") {
        setEditingPropertyId(null);
        setFormData({
          ...INITIAL_FORM,
          imageUrl: "",
          images: [],
        });
        setFormErrors({});
        setIsModalOpen(true);
      }
    }

    // Fetch properties directly from Supabase API
    fetch("/api/properties", { cache: "no-store" })
      .then((res) => res.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data)) {
          setProperties(json.data);
          saveStoredProperties(json.data);
        }
      })
      .catch(() => {});

    // Fetch live statistics from Supabase
    fetch("/api/stats", { cache: "no-store" })
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) {
          setLiveStats(json.data);
        }
      })
      .catch(() => {});

    // Fetch initial complaints list from Supabase
    fetchComplaints();

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

  // Filtered Complaints for Admin View
  const filteredComplaints = useMemo(() => {
    return complaintsList.filter((c) => {
      if (complaintStatusFilter !== "all" && c.status !== complaintStatusFilter) {
        return false;
      }
      if (complaintSearch.trim()) {
        const q = complaintSearch.toLowerCase();
        const matchTitle = (c.title || "").toLowerCase().includes(q);
        const matchDesc = (c.description || "").toLowerCase().includes(q);
        const matchId = (c.id || "").toLowerCase().includes(q);
        const matchProp = (c.properties?.title || "").toLowerCase().includes(q) || (c.properties?.location || "").toLowerCase().includes(q);
        const matchUser = (c.users?.fullname || "").toLowerCase().includes(q) || (c.users?.email || "").toLowerCase().includes(q) || (c.users?.phone_no || "").toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchId && !matchProp && !matchUser) return false;
      }
      return true;
    });
  }, [complaintsList, complaintStatusFilter, complaintSearch]);

  // Open modal for Create
  const handleOpenCreate = () => {
    setEditingPropertyId(null);
    setFormData({
      ...INITIAL_FORM,
      imageUrl: "",
      images: [],
    });
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
    const img = property.imageUrl || property.image_url || "";
    const imgList = Array.isArray(property.images) && property.images.length > 0
      ? property.images
      : img ? [img] : [];

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
      imageUrl: imgList[0] || img || "",
      images: imgList,

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
    if (!formData.images || formData.images.length === 0) {
      errs.images = "Please upload at least 1 property image from your device.";
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

    const imagesToSave = formData.images;
    const primaryImg = imagesToSave[0] || "";

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
            image_url: primaryImg,
            images: imagesToSave,
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
            imageUrl: primaryImg,
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
          body: JSON.stringify({ ...formData, images: imagesToSave, image_url: primaryImg }),
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

      let currentOwnerId: string | undefined;
      try {
        const stored = typeof window !== "undefined" ? localStorage.getItem("havenkey_user") : null;
        if (stored) {
          const u = JSON.parse(stored);
          if (u.id) currentOwnerId = u.id;
        }
      } catch {}

      const newProperty: Property = {
        id: newId,
        owner_id: currentOwnerId || "62844602-775a-4f74-a680-e2b51b2c7776",
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
        image_url: primaryImg,
        images: imagesToSave,
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
        imageUrl: primaryImg,
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
  const handleConfirmDelete = async () => {
    if (!propertyToDelete) return;
    const target = propertyToDelete;
    const updated = properties.filter((p) => p.id !== target.id);
    setProperties(updated);
    saveStoredProperties(updated);
    showToast(`Property "${target.title}" has been deleted.`);
    setPropertyToDelete(null);

    // Synchronize delete with backend API and Supabase
    try {
      await fetch(`http://localhost:5000/api/properties/${target.id}`, {
        method: "DELETE",
      });
    } catch {}
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

  // Security Barrier: Do not render admin console until authorized
  if (isAuthorized === null || isAuthorized === false) {
    return (
      <div className="min-h-screen bg-[#001637] flex flex-col items-center justify-center p-6 text-white text-center">
        <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mb-4 ring-2 ring-[#a1f1e9] shadow-xl animate-pulse">
          <span className="material-symbols-outlined text-[32px] text-[#a1f1e9]">lock</span>
        </div>
        <h2 className="text-xl font-bold font-plus-jakarta mb-2">Restricted Access: Admin Sign In Required</h2>
        <p className="text-xs text-[#8093bb] max-w-md mb-6 leading-relaxed">
          The Admin Operations Console is restricted to verified HavenKey administrators. You must sign in with an Administrator account to view or manage platform assets.
        </p>
        <Link
          href="/login?redirect=/admin/dashboard&reason=admin_required"
          className="px-6 py-2.5 bg-[#076a64] hover:bg-[#a1f1e9] hover:text-[#001637] text-white font-bold text-xs rounded-xl transition-all shadow-lg flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-[18px]">login</span>
          <span>Sign In as Admin</span>
        </Link>
      </div>
    );
  }

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
            <Link
              href="/properties/add"
              className="px-4 py-2.5 bg-[#076a64] hover:bg-[#00201e] text-white text-xs font-bold rounded-lg transition-all flex items-center gap-2 shadow-sm"
            >
              <span className="material-symbols-outlined text-[18px]">add_photo_alternate</span>
              <span>+ Upload New Property</span>
            </Link>
            <button
              type="button"
              onClick={handleOpenCreate}
              className="hidden sm:inline-flex px-4 py-2.5 bg-[#001637] hover:bg-[#172b4d] text-white text-xs font-bold rounded-lg transition-all items-center gap-2 shadow-sm"
            >
              <span className="material-symbols-outlined text-[18px] text-[#a1f1e9]">add_circle</span>
              <span>Quick Modal</span>
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
              <span className="material-symbols-outlined text-[12px]">trending_up</span> Live in Supabase
            </span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-[#e7e8ea] shadow-xs">
            <span className="text-[11px] text-[#75777f] uppercase font-semibold">Verified Landlords</span>
            <p className="text-xl font-bold text-[#001637] font-plus-jakarta mt-1">
              {liveStats.users?.landlords || 1}
            </p>
            <span className="text-[10px] text-[#076a64] font-semibold flex items-center gap-0.5 mt-1">
              <span className="material-symbols-outlined text-[12px]">verified</span> Real DB Accounts
            </span>
          </div>

          <div
            onClick={() => setActiveTab("complaints")}
            className="bg-white p-4 rounded-xl border border-[#e7e8ea] shadow-xs cursor-pointer hover:border-[#ba1a1a] hover:shadow-md transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-[#75777f] uppercase font-semibold group-hover:text-[#ba1a1a] transition-colors">
                Active Complaints
              </span>
              <span className="material-symbols-outlined text-[16px] text-[#ba1a1a] opacity-0 group-hover:opacity-100 transition-opacity">
                arrow_forward
              </span>
            </div>
            <p className="text-xl font-bold text-[#ba1a1a] font-plus-jakarta mt-1">
              {complaintsList.length || (liveStats.complaints?.total ?? 0)}
            </p>
            <span className="text-[10px] text-[#ba1a1a] font-semibold flex items-center gap-0.5 mt-1">
              <span className="material-symbols-outlined text-[12px]">assignment_late</span>{" "}
              {complaintsList.length > 0
                ? complaintsList.filter((c) => c.status === "pending").length
                : (liveStats.complaints?.pending ?? 0)}{" "}
              Pending Action
            </span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-[#e7e8ea] shadow-xs">
            <span className="text-[11px] text-[#75777f] uppercase font-semibold">Portfolio Value</span>
            <p className="text-xl font-bold text-[#001637] font-plus-jakarta mt-1">
              {liveStats.escrow?.formatted || "PKR 0"}
            </p>
            <span className="text-[10px] text-[#10b981] font-semibold flex items-center gap-0.5 mt-1">
              <span className="material-symbols-outlined text-[12px]">account_balance</span> Live Listings Volume
            </span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-[#e7e8ea] shadow-xs">
            <span className="text-[11px] text-[#75777f] uppercase font-semibold">For Rent / Sale</span>
            <p className="text-xl font-bold text-[#076a64] font-plus-jakarta mt-1">
              {properties.filter((p) => (p.transactionType || p.listing_type) === "rent").length} / {properties.filter((p) => (p.transactionType || p.listing_type) === "sale").length}
            </p>
            <span className="text-[10px] text-[#44474e] font-semibold flex items-center gap-0.5 mt-1">
              Rent vs Sale Portfolio
            </span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-[#e7e8ea] shadow-xs">
            <span className="text-[11px] text-[#75777f] uppercase font-semibold">Listing Verification</span>
            <p className="text-xl font-bold text-[#001637] font-plus-jakarta mt-1">
              100%
            </p>
            <span className="text-[10px] text-[#10b981] font-semibold flex items-center gap-0.5 mt-1">
              <span className="material-symbols-outlined text-[12px]">shield</span> Biometric Title Verified
            </span>
          </div>
        </div>



        {/* Tab Switcher */}
        <div className="flex items-center gap-2 border-b border-[#e7e8ea] mb-6 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab("properties")}
            className={`pb-3 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
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
            className={`pb-3 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
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
            className={`pb-3 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
              activeTab === "escrow"
                ? "border-[#001637] text-[#001637]"
                : "border-transparent text-[#75777f] hover:text-[#001637]"
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">account_balance</span>
            <span>Escrow &amp; Bank Liquidity</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("documents")}
            className={`pb-3 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
              activeTab === "documents"
                ? "border-[#001637] text-[#001637]"
                : "border-transparent text-[#75777f] hover:text-[#001637]"
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">library_books</span>
            <span>Knowledge Base (RAG)</span>
            <span className="px-2 py-0.5 bg-[#edeef0] text-[#001637] rounded-full text-[10px]">
              {documents.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("complaints")}
            className={`pb-3 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
              activeTab === "complaints"
                ? "border-[#ba1a1a] text-[#ba1a1a]"
                : "border-transparent text-[#75777f] hover:text-[#ba1a1a]"
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">report_problem</span>
            <span>Tenant Complaints</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                complaintsList.some((c) => c.status === "pending")
                  ? "bg-[#ba1a1a] text-white animate-pulse"
                  : "bg-[#edeef0] text-[#001637]"
              }`}
            >
              {complaintsList.length}
            </span>
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
                              src={p.images?.[0] || p.imageUrl || p.image_url || DEFAULT_PLACEHOLDER}
                              alt={p.title}
                              className="w-12 h-12 rounded-lg object-cover bg-gray-100 border border-[#e7e8ea] shrink-0"
                            />
                            <div className="max-w-xs">
                              <span className="font-bold text-[#001637] block truncate">
                                {p.title}
                              </span>
                              <div className="flex items-center gap-1.5 text-[10px] text-[#75777f] mt-0.5">
                                <span className="font-mono">ID: {p.id}</span>
                                {p.images && p.images.length > 1 && (
                                  <span className="px-1.5 py-0.2 bg-[#a1f1e9] text-[#076a64] rounded font-bold">
                                    {p.images.length} photos
                                  </span>
                                )}
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

        {/* =================================================================== */}
        {/* TAB 4: COMPANY KNOWLEDGE BASE & RAG DOCUMENTS                       */}
        {/* =================================================================== */}
        {activeTab === "documents" && (
          <div className="space-y-6 mb-8">
            {/* Header & Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-xl border border-[#e7e8ea] shadow-xs">
                <span className="text-[11px] text-[#75777f] uppercase font-semibold">Indexed Documents</span>
                <p className="text-xl font-bold text-[#001637] font-plus-jakarta mt-1">
                  {documents.length}
                </p>
                <span className="text-[10px] text-[#076a64] font-semibold flex items-center gap-0.5 mt-1">
                  <span className="material-symbols-outlined text-[12px]">check_circle</span> Active in RAG
                </span>
              </div>

              <div className="bg-white p-4 rounded-xl border border-[#e7e8ea] shadow-xs">
                <span className="text-[11px] text-[#75777f] uppercase font-semibold">Total Vector Chunks</span>
                <p className="text-xl font-bold text-[#001637] font-plus-jakarta mt-1">
                  {documents.reduce((acc, d) => acc + (d.chunkCount || 0), 0)}
                </p>
                <span className="text-[10px] text-[#75777f] font-semibold flex items-center gap-0.5 mt-1">
                  <span className="material-symbols-outlined text-[12px]">layers</span> 180–220 tokens/chunk
                </span>
              </div>

              <div className="bg-white p-4 rounded-xl border border-[#e7e8ea] shadow-xs">
                <span className="text-[11px] text-[#75777f] uppercase font-semibold">Embedding Model</span>
                <p className="text-sm font-bold text-[#001637] font-plus-jakarta mt-1.5 truncate">
                  all-MiniLM-L6-v2
                </p>
                <span className="text-[10px] text-[#076a64] font-semibold flex items-center gap-0.5 mt-1">
                  <span className="material-symbols-outlined text-[12px]">memory</span> 384-Dim Local ONNX
                </span>
              </div>

              <div className="bg-white p-4 rounded-xl border border-[#e7e8ea] shadow-xs">
                <span className="text-[11px] text-[#75777f] uppercase font-semibold">Vector Storage</span>
                <p className="text-sm font-bold text-[#001637] font-plus-jakarta mt-1.5 truncate">
                  Supabase pgvector
                </p>
                <span className="text-[10px] text-[#076a64] font-semibold flex items-center gap-0.5 mt-1">
                  <span className="material-symbols-outlined text-[12px]">database</span> HNSW Cosine Index
                </span>
              </div>
            </div>

            {/* Document Upload Card */}
            <div className="bg-white p-6 rounded-2xl border border-[#e7e8ea] shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <div>
                  <h4 className="text-base font-bold text-[#001637] font-plus-jakarta flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#076a64]">upload_file</span>
                    Upload Company Document
                  </h4>
                  <p className="text-xs text-[#44474e] mt-0.5">
                    Upload official company policies, terms &amp; conditions, tenancy rules, or escrow guidelines (PDF or TXT, max 15MB).
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    ref={docFileInputRef}
                    type="file"
                    accept=".pdf,.txt,text/plain,application/pdf"
                    onChange={handleUploadDocument}
                    disabled={isUploadingDoc}
                    className="hidden"
                    id="rag-doc-upload"
                  />
                  <label
                    htmlFor="rag-doc-upload"
                    className={`px-4 py-2 bg-[#076a64] hover:bg-[#00201e] text-white text-xs font-semibold rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer ${
                      isUploadingDoc ? "opacity-50 pointer-events-none" : ""
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">add</span>
                    <span>{isUploadingDoc ? "Indexing Document..." : "Select Document from Device"}</span>
                  </label>
                </div>
              </div>

              {/* Upload Progress Bar */}
              {isUploadingDoc && (
                <div className="p-4 bg-[#f2f4f6] rounded-xl border border-[#e7e8ea] mb-2 flex items-center gap-3">
                  <span className="material-symbols-outlined text-[20px] text-[#076a64] animate-spin">
                    progress_activity
                  </span>
                  <div className="flex-1">
                    <div className="flex justify-between text-xs font-semibold text-[#001637] mb-1">
                      <span>{uploadProgress || "Processing document..."}</span>
                      <span className="text-[#076a64]">Tokenizing &amp; Computing Embeddings</span>
                    </div>
                    <div className="w-full h-1.5 bg-[#e7e8ea] rounded-full overflow-hidden">
                      <div className="h-full bg-[#076a64] animate-pulse w-3/4" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Document Listing Table */}
            <div className="bg-white rounded-2xl border border-[#e7e8ea] shadow-sm overflow-hidden">
              <div className="p-4 border-b border-[#e7e8ea] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-[#001637] font-plus-jakarta">
                    Knowledge Base Documents ({documents.length})
                  </h4>
                  <button
                    type="button"
                    onClick={fetchDocuments}
                    disabled={isLoadingDocs}
                    className="p-1 text-[#75777f] hover:text-[#001637] rounded-lg transition-colors"
                    title="Refresh document list"
                  >
                    <span className={`material-symbols-outlined text-[16px] ${isLoadingDocs ? "animate-spin" : ""}`}>
                      refresh
                    </span>
                  </button>
                </div>

                <div className="relative w-full sm:w-64">
                  <span className="material-symbols-outlined absolute left-3 top-2.5 text-[16px] text-[#75777f]">
                    search
                  </span>
                  <input
                    type="text"
                    placeholder="Search documents..."
                    value={docSearchQuery}
                    onChange={(e) => setDocSearchQuery(e.target.value)}
                    className="w-full h-9 pl-9 pr-3 text-xs bg-[#f8f9fb] rounded-lg border border-[#e7e8ea] focus:outline-none focus:border-[#076a64]"
                  />
                </div>
              </div>

              {isLoadingDocs ? (
                <div className="p-12 text-center text-xs text-[#75777f] flex flex-col items-center gap-2">
                  <span className="material-symbols-outlined text-[24px] text-[#076a64] animate-spin">
                    progress_activity
                  </span>
                  Loading knowledge base index...
                </div>
              ) : documents.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="w-12 h-12 rounded-full bg-[#f2f4f6] text-[#75777f] flex items-center justify-center mx-auto mb-3">
                    <span className="material-symbols-outlined text-[24px]">folder_open</span>
                  </div>
                  <h5 className="text-sm font-bold text-[#001637]">No documents uploaded yet</h5>
                  <p className="text-xs text-[#75777f] max-w-sm mx-auto mt-1 mb-4">
                    Upload your first company policy or tenancy document to activate the AI knowledge retrieval pipeline.
                  </p>
                  <label
                    htmlFor="rag-doc-upload"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#001637] hover:bg-[#172b4d] text-white text-xs font-semibold rounded-xl cursor-pointer shadow-xs transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">upload_file</span>
                    Upload First Document
                  </label>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#f8f9fb] text-[#75777f] uppercase font-semibold border-b border-[#e7e8ea]">
                      <tr>
                        <th className="px-6 py-3">Document</th>
                        <th className="px-4 py-3">Document ID</th>
                        <th className="px-4 py-3">Chunks</th>
                        <th className="px-4 py-3">Indexed Date</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-6 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e7e8ea]">
                      {documents
                        .filter((d) =>
                          d.filename.toLowerCase().includes(docSearchQuery.toLowerCase()) ||
                          d.docId.toLowerCase().includes(docSearchQuery.toLowerCase())
                        )
                        .map((doc) => {
                          const isPdf = doc.filename.toLowerCase().endsWith(".pdf");
                          return (
                            <tr key={doc.sourceKey} className="hover:bg-[#f8f9fb] transition-colors">
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div
                                    className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                                      isPdf
                                        ? "bg-red-50 text-red-600"
                                        : "bg-blue-50 text-blue-600"
                                    }`}
                                  >
                                    <span className="material-symbols-outlined text-[20px]">
                                      {isPdf ? "picture_as_pdf" : "description"}
                                    </span>
                                  </div>
                                  <div>
                                    <p className="font-semibold text-[#001637] text-xs">
                                      {doc.filename}
                                    </p>
                                    <span className="text-[10px] text-[#75777f]">
                                      {isPdf ? "Portable Document Format (PDF)" : "Plain Text Document (TXT)"}
                                    </span>
                                  </div>
                                </div>
                              </td>

                              <td className="px-4 py-4 font-mono text-[11px] text-[#75777f]">
                                <span className="px-2 py-0.5 bg-[#edeef0] rounded-md">
                                  {doc.docId.slice(0, 8)}...
                                </span>
                              </td>

                              <td className="px-4 py-4">
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#f2f4f6] text-[#001637] font-bold rounded-lg text-xs">
                                  <span className="material-symbols-outlined text-[14px] text-[#076a64]">
                                    layers
                                  </span>
                                  {doc.chunkCount} {doc.chunkCount === 1 ? "chunk" : "chunks"}
                                </span>
                              </td>

                              <td className="px-4 py-4 text-[#75777f] text-xs">
                                {doc.createdAt
                                  ? new Date(doc.createdAt).toLocaleDateString("en-PK", {
                                      month: "short",
                                      day: "numeric",
                                      year: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })
                                  : "Recently"}
                              </td>

                              <td className="px-4 py-4">
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-[#a1f1e9] text-[#076a64] text-[10px] font-bold rounded-full uppercase">
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#076a64]" />
                                  Indexed
                                </span>
                              </td>

                              <td className="px-6 py-4 text-right">
                                <button
                                  type="button"
                                  onClick={() => setDocToDelete(doc)}
                                  className="px-3 py-1.5 text-xs text-red-600 hover:text-white hover:bg-red-600 border border-red-200 rounded-lg transition-all inline-flex items-center gap-1 font-semibold"
                                >
                                  <span className="material-symbols-outlined text-[14px]">delete</span>
                                  Delete
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 5: TENANT COMPLAINTS RESOLUTION HUB                             */}
        {/* =================================================================== */}
        {activeTab === "complaints" && (
          <div className="space-y-6 mb-8">
            {/* Header & Quick Telemetry KPI Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-xl border border-[#e7e8ea] shadow-xs">
                <span className="text-[11px] text-[#75777f] uppercase font-semibold">Total Logged Tickets</span>
                <p className="text-xl font-bold text-[#001637] font-plus-jakarta mt-1">
                  {complaintsList.length}
                </p>
                <span className="text-[10px] text-[#076a64] font-semibold flex items-center gap-0.5 mt-1">
                  <span className="material-symbols-outlined text-[12px]">database</span> Synced with Supabase
                </span>
              </div>

              <div className="bg-white p-4 rounded-xl border border-red-100 bg-red-50/20 shadow-xs">
                <span className="text-[11px] text-[#ba1a1a] uppercase font-semibold">Pending Action</span>
                <p className="text-xl font-bold text-[#ba1a1a] font-plus-jakarta mt-1">
                  {complaintsList.filter((c) => c.status === "pending").length}
                </p>
                <span className="text-[10px] text-[#ba1a1a] font-semibold flex items-center gap-0.5 mt-1">
                  <span className="material-symbols-outlined text-[12px]">priority_high</span> Awaiting Investigation
                </span>
              </div>

              <div className="bg-white p-4 rounded-xl border border-amber-100 bg-amber-50/20 shadow-xs">
                <span className="text-[11px] text-amber-800 uppercase font-semibold">In Progress</span>
                <p className="text-xl font-bold text-amber-700 font-plus-jakarta mt-1">
                  {complaintsList.filter((c) => c.status === "in_progress").length}
                </p>
                <span className="text-[10px] text-amber-700 font-semibold flex items-center gap-0.5 mt-1">
                  <span className="material-symbols-outlined text-[12px]">build</span> Active Vendor / Landlord Dispatch
                </span>
              </div>

              <div className="bg-white p-4 rounded-xl border border-emerald-100 bg-emerald-50/20 shadow-xs">
                <span className="text-[11px] text-emerald-800 uppercase font-semibold">Resolved</span>
                <p className="text-xl font-bold text-[#076a64] font-plus-jakarta mt-1">
                  {complaintsList.filter((c) => c.status === "resolved").length}
                </p>
                <span className="text-[10px] text-[#076a64] font-semibold flex items-center gap-0.5 mt-1">
                  <span className="material-symbols-outlined text-[12px]">check_circle</span> Satisfactorily Closed
                </span>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#e7e8ea] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-lg">
                <span className="material-symbols-outlined text-[18px] text-[#75777f] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  search
                </span>
                <input
                  type="text"
                  value={complaintSearch}
                  onChange={(e) => setComplaintSearch(e.target.value)}
                  placeholder="Search by ticket ID, tenant name, email, property, or issue..."
                  className="w-full h-10 pl-9 pr-3 bg-[#f2f4f6] rounded-xl text-xs text-[#001637] placeholder:text-[#75777f] border border-[#e7e8ea] focus:bg-white focus:border-[#ba1a1a] outline-none transition-all"
                />
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1.5 bg-[#f2f4f6] p-1 rounded-xl border border-[#e7e8ea]">
                  {(["all", "pending", "in_progress", "resolved"] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setComplaintStatusFilter(st)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition-all ${
                        complaintStatusFilter === st
                          ? "bg-white text-[#001637] shadow-xs font-bold"
                          : "text-[#75777f] hover:text-[#001637]"
                      }`}
                    >
                      {st === "all" ? "All Tickets" : st.replace("_", " ")}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={fetchComplaints}
                  disabled={isLoadingComplaints}
                  title="Refresh complaints from Supabase"
                  className="h-10 px-3.5 bg-white text-[#001637] hover:bg-[#f2f4f6] border border-[#e7e8ea] text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 shadow-xs"
                >
                  <span
                    className={`material-symbols-outlined text-[16px] text-[#75777f] ${
                      isLoadingComplaints ? "animate-spin text-[#ba1a1a]" : ""
                    }`}
                  >
                    refresh
                  </span>
                  <span>Refresh</span>
                </button>
              </div>
            </div>

            {/* Complaints List Container */}
            <div className="bg-white rounded-2xl border border-[#e7e8ea] shadow-xs overflow-hidden">
              <div className="px-6 py-4 border-b border-[#edeef0] flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-[#001637] font-plus-jakarta flex items-center gap-2">
                    <span className="material-symbols-outlined text-[20px] text-[#ba1a1a]">report_problem</span>
                    Tenant Complaints &amp; Maintenance Requests
                  </h4>
                  <p className="text-xs text-[#75777f] mt-0.5">
                    Showing {filteredComplaints.length} of {complaintsList.length} tickets recorded in Supabase.
                  </p>
                </div>
              </div>

              {isLoadingComplaints ? (
                <div className="p-12 text-center text-xs text-[#75777f] flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-[22px] animate-spin text-[#ba1a1a]">
                    progress_activity
                  </span>
                  Loading complaints from Supabase...
                </div>
              ) : filteredComplaints.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                    <span className="material-symbols-outlined text-[26px]">task_alt</span>
                  </div>
                  <h5 className="text-sm font-bold text-[#001637]">No complaints found</h5>
                  <p className="text-xs text-[#75777f] max-w-sm mx-auto mt-1">
                    {complaintSearch || complaintStatusFilter !== "all"
                      ? "No tickets match your active search or status filters. Try clearing your search."
                      : "Great news! There are currently no active tenant complaints logged in the database."}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-[#edeef0]">
                  {filteredComplaints.map((c) => {
                    const matchCat = (c.description || "").match(/^\[Category:\s*([^\]]+)\]\s*([\s\S]*)$/);
                    const categoryName = matchCat ? matchCat[1] : "General Maintenance";
                    const cleanDesc = matchCat ? matchCat[2] : c.description;
                    const isUpdating = updatingComplaintId === c.id;

                    return (
                      <div
                        key={c.id}
                        className="p-5 sm:p-6 hover:bg-[#fafbfc] transition-colors"
                      >
                        {/* Top Meta Line: Ticket ID, Category Chip, Date, Status */}
                        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="px-2.5 py-1 bg-[#edeef0] text-[#001637] font-mono text-[11px] font-bold rounded-lg border border-[#e7e8ea]">
                              #{c.id.slice(0, 8)}
                            </span>
                            <span className="px-2.5 py-1 bg-[#f2f4f6] text-[#44474e] text-xs font-semibold rounded-lg border border-[#e7e8ea] flex items-center gap-1">
                              <span className="material-symbols-outlined text-[14px] text-[#076a64]">build_circle</span>
                              {categoryName}
                            </span>
                            <span className="text-[11px] text-[#75777f] flex items-center gap-1">
                              <span className="material-symbols-outlined text-[13px]">schedule</span>
                              {new Date(c.created_at).toLocaleDateString("en-PK", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>

                          <div>
                            {c.status === "pending" && (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 text-[#ba1a1a] text-xs font-bold rounded-full border border-red-200">
                                <span className="w-2 h-2 rounded-full bg-[#ba1a1a] animate-pulse" />
                                Pending Action
                              </span>
                            )}
                            {c.status === "in_progress" && (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-800 text-xs font-bold rounded-full border border-amber-200">
                                <span className="material-symbols-outlined text-[14px] animate-spin text-amber-600">sync</span>
                                In Progress
                              </span>
                            )}
                            {c.status === "resolved" && (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-[#076a64] text-xs font-bold rounded-full border border-emerald-200">
                                <span className="material-symbols-outlined text-[14px]">check_circle</span>
                                Resolved
                              </span>
                            )}
                            {c.status === "rejected" && (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 text-gray-700 text-xs font-bold rounded-full border border-gray-300">
                                <span className="material-symbols-outlined text-[14px]">cancel</span>
                                Closed
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Complaint Title & Clean Description */}
                        <div className="mb-4">
                          <h4 className="text-sm sm:text-base font-bold text-[#001637] font-plus-jakarta mb-1.5">
                            {c.title}
                          </h4>
                          <div className="p-3 bg-[#f8f9fb] rounded-xl border border-[#edeef0] text-xs text-[#333538] whitespace-pre-wrap leading-relaxed">
                            {cleanDesc}
                          </div>
                        </div>

                        {/* Tenant & Property Association Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                          {/* Tenant Info */}
                          <div className="p-3 bg-white rounded-xl border border-[#e7e8ea] flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#001637] text-white flex items-center justify-center font-bold text-xs shrink-0">
                              {c.users?.fullname ? c.users.fullname.slice(0, 2).toUpperCase() : "TN"}
                            </div>
                            <div className="min-w-0 flex-1">
                              <span className="text-[10px] uppercase font-bold text-[#75777f] tracking-wide">
                                Tenant / Resident
                              </span>
                              <p className="text-xs font-bold text-[#001637] truncate mt-0.5">
                                {c.users?.fullname || "Anonymous Tenant"}
                              </p>
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-[11px] text-[#44474e]">
                                {c.users?.email && (
                                  <a
                                    href={`mailto:${c.users.email}?subject=Regarding HavenKey Complaint %23${c.id.slice(0, 8)}`}
                                    className="text-[#076a64] hover:underline flex items-center gap-1 truncate"
                                  >
                                    <span className="material-symbols-outlined text-[13px]">mail</span>
                                    {c.users.email}
                                  </a>
                                )}
                                {c.users?.phone_no && (
                                  <a
                                    href={`tel:${c.users.phone_no}`}
                                    className="text-[#44474e] hover:text-[#001637] flex items-center gap-1"
                                  >
                                    <span className="material-symbols-outlined text-[13px]">phone</span>
                                    {c.users.phone_no}
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Property Info */}
                          <div className="p-3 bg-white rounded-xl border border-[#e7e8ea] flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#a1f1e9] text-[#076a64] flex items-center justify-center shrink-0">
                              <span className="material-symbols-outlined text-[18px]">apartment</span>
                            </div>
                            <div className="min-w-0 flex-1">
                              <span className="text-[10px] uppercase font-bold text-[#75777f] tracking-wide">
                                Property Affected
                              </span>
                              <p className="text-xs font-bold text-[#001637] truncate mt-0.5">
                                {c.properties?.title || "Property Unassigned / General"}
                              </p>
                              <p className="text-[11px] text-[#75777f] flex items-center gap-1 truncate mt-1">
                                <span className="material-symbols-outlined text-[13px]">location_on</span>
                                {c.properties?.location || "Pakistan"}
                              </p>
                            </div>
                            {c.property_id && (
                              <Link
                                href={`/properties/${c.property_id}`}
                                target="_blank"
                                className="px-2.5 py-1 text-[11px] font-semibold text-[#076a64] hover:bg-[#f2f4f6] rounded-lg transition-colors border border-[#a1f1e9] shrink-0"
                              >
                                View Listing
                              </Link>
                            )}
                          </div>
                        </div>

                        {/* Admin Action Buttons & Status Controllers */}
                        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#f2f4f6]">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-[#75777f] font-semibold">Change Status:</span>

                            {c.status !== "in_progress" && (
                              <button
                                type="button"
                                disabled={isUpdating}
                                onClick={() => handleUpdateComplaintStatus(c.id, "in_progress")}
                                className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 disabled:opacity-50"
                              >
                                <span className="material-symbols-outlined text-[15px]">build</span>
                                <span>Mark In Progress</span>
                              </button>
                            )}

                            {c.status !== "resolved" && (
                              <button
                                type="button"
                                disabled={isUpdating}
                                onClick={() => handleUpdateComplaintStatus(c.id, "resolved")}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-50"
                              >
                                <span className="material-symbols-outlined text-[15px]">done_all</span>
                                <span>Resolve Ticket</span>
                              </button>
                            )}

                            {c.status !== "pending" && (
                              <button
                                type="button"
                                disabled={isUpdating}
                                onClick={() => handleUpdateComplaintStatus(c.id, "pending")}
                                className="px-3 py-1.5 bg-[#f2f4f6] hover:bg-[#e7e8ea] text-[#ba1a1a] border border-[#e7e8ea] text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 disabled:opacity-50"
                              >
                                <span className="material-symbols-outlined text-[15px]">history</span>
                                <span>Reopen (Pending)</span>
                              </button>
                            )}
                          </div>

                          {c.users?.email && (
                            <a
                              href={`mailto:${c.users.email}?subject=Update on HavenKey Complaint Ticket %23${c.id.slice(0, 8)}: ${encodeURIComponent(c.title)}&body=Dear ${encodeURIComponent(c.users?.fullname || "Tenant")},%0D%0A%0D%0ARegarding your complaint regarding "${encodeURIComponent(c.title)}" at ${encodeURIComponent(c.properties?.title || "your rental unit")}:%0D%0A%0D%0A`}
                              className="px-3 py-1.5 bg-white text-[#001637] hover:bg-[#f2f4f6] border border-[#e7e8ea] text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5"
                            >
                              <span className="material-symbols-outlined text-[15px] text-[#076a64]">send</span>
                              <span>Email Tenant Directly</span>
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* =================================================================== */}
      {/* MODAL: DELETE DOCUMENT CONFIRMATION                                 */}
      {/* =================================================================== */}
      {docToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 border border-[#e7e8ea] shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-[28px]">delete_forever</span>
            </div>

            <h3 className="text-base font-bold text-[#001637] text-center font-plus-jakarta">
              Delete Document from Knowledge Base?
            </h3>

            <p className="text-xs text-[#44474e] text-center mt-2 leading-relaxed">
              Are you sure you want to permanently delete{" "}
              <strong className="text-[#001637]">"{docToDelete.filename}"</strong>?
              <br />
              All <strong className="text-red-600">{docToDelete.chunkCount} vector chunks</strong> and embeddings will be immediately purged from Supabase.
            </p>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDocToDelete(null)}
                disabled={isDeletingDoc}
                className="px-4 py-2 bg-white text-[#44474e] hover:text-[#001637] border border-[#e7e8ea] text-xs font-semibold rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteDocument}
                disabled={isDeletingDoc}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-xl transition-colors shadow-sm flex items-center gap-1.5"
              >
                {isDeletingDoc ? (
                  <>
                    <span className="material-symbols-outlined text-[16px] animate-spin">
                      progress_activity
                    </span>
                    Deleting...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[16px]">delete</span>
                    Confirm Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

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

              {/* Row 7: Pure Device Image Upload Block (Multer Processing - No Links) */}
              <div className="p-4 bg-[#f2f4f6] rounded-xl border border-[#e7e8ea] space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <label className="block text-xs font-bold text-[#001637] flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[18px] text-[#076a64]">add_photo_alternate</span>
                      Upload Property Photos (From Device) <span className="text-red-500">*</span>
                    </label>
                    <p className="text-[11px] text-[#75777f]">
                      Upload photos directly from your computer or mobile device. No URL links. Select multiple images to build your gallery.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {isUploadingImages && (
                      <span className="text-[11px] text-[#076a64] font-bold flex items-center gap-1 animate-pulse">
                        <span className="material-symbols-outlined text-[14px] animate-spin">sync</span>
                        Uploading via Multer...
                      </span>
                    )}
                    <span className="text-[11px] font-bold px-2.5 py-1 bg-white text-[#076a64] rounded-full border border-[#e7e8ea] shrink-0">
                      {formData.images.length} Photo{formData.images.length === 1 ? "" : "s"} Contained
                    </span>
                  </div>
                </div>

                {/* Validation Error Message */}
                {formErrors.images && (
                  <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-600 text-xs font-semibold">
                    <span className="material-symbols-outlined text-[16px]">error</span>
                    <span>{formErrors.images}</span>
                  </div>
                )}

                {/* Hidden File Input for Native File Picker */}
                <input
                  type="file"
                  ref={fileInputRef}
                  multiple
                  accept="image/png,image/jpeg,image/webp,image/jpg"
                  onChange={handleImageFilesSelect}
                  className="hidden"
                />

                {/* Prominent Upload Box / Dropzone */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-[#076a64]/40 hover:border-[#076a64] bg-white rounded-xl p-5 text-center cursor-pointer transition-all hover:bg-[#f0faf9] group shadow-xs"
                >
                  <div className="w-12 h-12 mx-auto rounded-full bg-[#e6f7f5] group-hover:bg-[#a1f1e9] flex items-center justify-center text-[#076a64] transition-colors mb-2">
                    <span className="material-symbols-outlined text-[28px]">cloud_upload</span>
                  </div>
                  <p className="text-xs font-bold text-[#001637]">
                    Click here to choose images from your computer
                  </p>
                  <p className="text-[11px] text-[#75777f] mt-0.5">
                    Select one or multiple photos (PNG, JPG, JPEG, WebP) • Processed automatically by Multer
                  </p>
                  <button
                    type="button"
                    disabled={isUploadingImages}
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    className="mt-3 px-4 py-2 bg-[#076a64] hover:bg-[#00201e] text-white text-xs font-bold rounded-lg inline-flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">file_upload</span>
                    <span>{isUploadingImages ? "Uploading..." : "Browse & Upload Images"}</span>
                  </button>
                </div>

                {/* Contained Image Blocks Gallery */}
                {formData.images.length > 0 && (
                  <div className="pt-2">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold text-[#001637]">
                        Contained Photo Gallery ({formData.images.length})
                      </span>
                      <span className="text-[10px] text-[#75777f]">
                        Hover over a photo to make it the Primary Cover or Delete
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
                      {formData.images.map((imgUrl, index) => (
                        <div
                          key={`${imgUrl.slice(0, 30)}-${index}`}
                          className={`relative aspect-square rounded-xl overflow-hidden border-2 ${
                            index === 0 ? "border-[#076a64] ring-2 ring-[#a1f1e9]" : "border-[#d2d4d7]"
                          } bg-slate-900 group shadow-xs transition-all`}
                        >
                          <img
                            src={imgUrl}
                            alt={`Uploaded property photo ${index + 1}`}
                            className="w-full h-full object-cover"
                          />

                          {/* Top Left Badge: Cover vs Order */}
                          <div className="absolute top-1.5 left-1.5 z-10 pointer-events-none">
                            {index === 0 ? (
                              <span className="px-2 py-0.5 bg-[#076a64] text-white text-[10px] font-bold rounded-md shadow-md flex items-center gap-1">
                                <span className="material-symbols-outlined text-[12px]">star</span>
                                Cover
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 bg-black/60 backdrop-blur-xs text-white text-[9px] font-semibold rounded">
                                #{index + 1}
                              </span>
                            )}
                          </div>

                          {/* Hover Overlay Actions */}
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2 z-20">
                            {index !== 0 && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSetCoverImage(index);
                                }}
                                title="Set as Primary Cover Photo"
                                className="w-8 h-8 bg-white hover:bg-[#076a64] hover:text-white rounded-lg flex items-center justify-center text-[#001637] transition-colors shadow-md"
                              >
                                <span className="material-symbols-outlined text-[16px]">star</span>
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveImage(index);
                              }}
                              title="Delete photo"
                              className="w-8 h-8 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center justify-center transition-colors shadow-md"
                            >
                              <span className="material-symbols-outlined text-[16px]">delete</span>
                            </button>
                          </div>
                        </div>
                      ))}

                      {/* Add More Photos Block Tile */}
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploadingImages}
                        className="aspect-square rounded-xl border-2 border-dashed border-[#076a64]/50 hover:border-[#076a64] bg-white hover:bg-[#f0faf9] flex flex-col items-center justify-center text-[#076a64] transition-all p-2 gap-1 cursor-pointer group shadow-2xs"
                      >
                        <span className="material-symbols-outlined text-[26px] group-hover:scale-110 transition-transform">
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
                src={propertyToDelete.images?.[0] || propertyToDelete.imageUrl || propertyToDelete.image_url || DEFAULT_PLACEHOLDER}
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
