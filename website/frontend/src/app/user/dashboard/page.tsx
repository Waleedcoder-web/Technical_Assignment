"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import PropertyCard from "@/components/ui/property-card";
import { Property } from "@/lib/mock-data";

export default function CustomerDashboardPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  const [activeTab, setActiveTab] = useState<"properties" | "lease" | "maintenance" | "saved" | "documents">(
    "properties"
  );
  const [paySuccess, setPaySuccess] = useState(false);

  // User-specific data state
  const [myProperties, setMyProperties] = useState<Property[]>([]);
  const [isLoadingProps, setIsLoadingProps] = useState(true);

  const [complaintsList, setComplaintsList] = useState<any[]>([]);
  const [isLoadingComplaints, setIsLoadingComplaints] = useState(true);

  const [reservedProperties, setReservedProperties] = useState<any[]>([]);
  const [liveProperties, setLiveProperties] = useState<Property[]>([]);

  // Complaint submission form state
  const [showNewComplaintForm, setShowNewComplaintForm] = useState(false);
  const [complaintCategory, setComplaintCategory] = useState("Maintenance / Repairs");
  const [complaintTitle, setComplaintTitle] = useState("");
  const [complaintDesc, setComplaintDesc] = useState("");
  const [complaintPropertyId, setComplaintPropertyId] = useState("");
  const [complaintSubmitting, setComplaintSubmitting] = useState(false);
  const [complaintNotice, setComplaintNotice] = useState<string | null>(null);
  const [complaintNoticeError, setComplaintNoticeError] = useState<string | null>(null);

  useEffect(() => {
    // 1. Authenticate user from localStorage
    let user: any = null;
    try {
      const stored = localStorage.getItem("havenkey_user");
      if (stored) {
        user = JSON.parse(stored);
      }
    } catch {
      user = null;
    }

    if (!user) {
      router.push("/login?redirect=/user/dashboard");
      return;
    }

    setCurrentUser(user);
    setIsLoadingAuth(false);

    // Default tab based on role: landlords/sellers start at properties, tenants at lease/properties
    if (user.role === "landlord" || user.role === "seller") {
      setActiveTab("properties");
    }

    // 2. Fetch live properties owned by THIS user strictly from Supabase
    fetch(`/api/properties?owner_id=${encodeURIComponent(user.id)}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data)) {
          // Double verify owner_id matches user.id
          const userProps = json.data.filter((p: any) => p.owner_id === user.id);
          setMyProperties(userProps);
        }
      })
      .catch((e) => console.warn("Failed to fetch user properties:", e))
      .finally(() => setIsLoadingProps(false));

    // 3. Fetch complaints filed by THIS user strictly from Supabase
    fetch(`/api/complaints?userId=${encodeURIComponent(user.id)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) {
          // Strictly isolate to this user's ID or email
          const userComplaints = data.data.filter(
            (c: any) =>
              c.user_id === user.id ||
              (c.users?.email && c.users.email.toLowerCase() === user.email?.toLowerCase())
          );
          setComplaintsList(userComplaints);
        }
      })
      .catch((e) => console.warn("Failed to fetch user complaints:", e))
      .finally(() => setIsLoadingComplaints(false));

    // 4. Fetch all live properties for reservation lookup and selector dropdown
    fetch("/api/properties")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data)) {
          setLiveProperties(json.data);

          // Check if user has personal reserved properties in localStorage
          try {
            const rawUserReserved = localStorage.getItem(`havenkey_reserved_${user.id}`);
            const rawGeneralReserved = localStorage.getItem("havenkey_reserved_properties");
            let userReservedIds: string[] = [];
            if (rawUserReserved) {
              const parsed = JSON.parse(rawUserReserved);
              if (Array.isArray(parsed)) userReservedIds = parsed;
            } else if (rawGeneralReserved) {
              const parsed = JSON.parse(rawGeneralReserved);
              if (Array.isArray(parsed)) userReservedIds = parsed;
            }

            if (userReservedIds.length > 0) {
              const matched = json.data.filter((p: any) => userReservedIds.includes(p.id) && p.status !== "available");
              setReservedProperties(matched);
              if (matched[0]) {
                setComplaintPropertyId(matched[0].id);
              } else {
                setComplaintPropertyId("");
              }
            } else {
              setReservedProperties([]);
              setComplaintPropertyId("");
            }
          } catch {}
        }
      })
      .catch(() => {});
  }, [router]);

  // Handle complaint submission
  const handleDashboardComplaintSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setComplaintNotice(null);
    setComplaintNoticeError(null);

    if (!currentUser) return;

    if (!complaintTitle.trim()) {
      setComplaintNoticeError("Please enter a complaint subject.");
      return;
    }
    if (!complaintDesc.trim()) {
      setComplaintNoticeError("Please describe the issue in detail.");
      return;
    }

    const selectedProp = reservedProperties.find((p) => p.id === complaintPropertyId);
    if (!selectedProp) {
      setComplaintNoticeError("You can only file complaints for properties that you have actively reserved or leased.");
      return;
    }

    setComplaintSubmitting(true);
    try {
      const res = await fetch("/api/complaints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: selectedProp.id,
          propertyTitle: selectedProp.title || "HavenKey Property",
          ownerName: selectedProp.landlord?.name || "Property Owner",
          ownerEmail: selectedProp.landlord?.email || "owner@havenkey.pk",
          userId: currentUser.id,
          isReserved: true,
          userName: currentUser.fullname || currentUser.name || "Verified Resident",
          userEmail: currentUser.email,
          userPhone: currentUser.phone_no || currentUser.phone || "+92 300 0000000",
          category: complaintCategory,
          title: complaintTitle,
          description: complaintDesc,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to submit complaint.");
      }

      const newTicket = {
        id: data.complaintId || `CMP-${Date.now().toString().slice(-4)}`,
        title: complaintTitle,
        description: `[Category: ${complaintCategory}] ${complaintDesc}`,
        category: complaintCategory,
        status: "pending",
        created_at: new Date().toISOString(),
        properties: selectedProp ? { id: selectedProp.id, title: selectedProp.title, location: selectedProp.location } : null,
        users: { fullname: currentUser.fullname || currentUser.name, email: currentUser.email },
      };

      setComplaintsList((prev) => [newTicket, ...prev]);
      setComplaintNotice(data.message || "Your complaint ticket was filed and dispatched to the property owner!");
      setComplaintTitle("");
      setComplaintDesc("");
      setShowNewComplaintForm(false);
    } catch (err: any) {
      setComplaintNoticeError(err.message || "Submission failed. Please try again.");
    } finally {
      setComplaintSubmitting(false);
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return "US";
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  if (isLoadingAuth || !currentUser) {
    return (
      <div className="min-h-screen bg-[#f8f9fb] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <span className="material-symbols-outlined text-[36px] text-[#076a64] animate-spin">
            progress_activity
          </span>
          <p className="text-xs text-[#75777f] font-semibold">Loading your personal dashboard...</p>
        </div>
      </div>
    );
  }

  const userName = currentUser.fullname || currentUser.name || "HavenKey User";
  const userInitials = getInitials(userName);
  const userRole = currentUser.role || "tenant";
  const userRoleDisplay = userRole.charAt(0).toUpperCase() + userRole.slice(1);
  const customerId = `#HK-${userRole.slice(0, 3).toUpperCase()}-${currentUser.id?.slice(0, 6) || "9021"}`;

  return (
    <>
      <Navbar />

      <main className="w-full pt-24 pb-16 bg-[#f8f9fb] min-h-screen">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-12">
          {/* User Profile Banner */}
          <div className="bg-white rounded-2xl p-6 lg:p-8 border border-[#e7e8ea] shadow-sm mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-[#001637] text-white flex items-center justify-center text-xl font-bold ring-4 ring-[#a1f1e9]/50 shadow-md">
                {userInitials}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl font-bold text-[#001637] font-plus-jakarta">
                    {userName}
                  </h1>
                  <span className="px-2.5 py-0.5 bg-[#a1f1e9] text-[#076a64] text-xs font-bold rounded-full flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">verified</span>
                    NADRA Biometric Verified {userRoleDisplay}
                  </span>
                  {userRole === "admin" && (
                    <Link
                      href="/admin/dashboard"
                      className="px-2.5 py-0.5 bg-[#001637] text-[#a1f1e9] text-xs font-bold rounded-full flex items-center gap-1 hover:bg-[#172b4d]"
                    >
                      <span className="material-symbols-outlined text-[14px]">admin_panel_settings</span>
                      Open Admin Console
                    </Link>
                  )}
                </div>
                <p className="text-xs text-[#44474e] mt-1">
                  Customer ID: {customerId} • Email: {currentUser.email} • Role: {userRoleDisplay}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/properties"
                className="px-4 py-2 bg-[#f2f4f6] hover:bg-[#edeef0] text-[#001637] text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[18px]">search</span>
                Browse Properties
              </Link>
              <Link
                href="/ai-assistant"
                className="px-4 py-2 bg-[#076a64] hover:bg-[#00201e] text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <span className="material-symbols-outlined text-[18px]">smart_toy</span>
                Ask AI Advisor
              </Link>
            </div>
          </div>

          {/* Quick Metrics KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {/* KPI 1: My Properties */}
            <div
              onClick={() => setActiveTab("properties")}
              className="bg-white p-5 rounded-xl border border-[#e7e8ea] shadow-sm cursor-pointer hover:border-[#076a64] transition-all group"
            >
              <div className="flex items-center justify-between text-[#44474e] text-xs mb-2">
                <span className="font-semibold group-hover:text-[#076a64]">My Properties</span>
                <span className="material-symbols-outlined text-[20px] text-[#076a64]">
                  real_estate_agent
                </span>
              </div>
              <p className="text-2xl font-bold text-[#001637] font-plus-jakarta">
                {myProperties.length} {myProperties.length === 1 ? "Listing" : "Listings"}
              </p>
              <p className="text-[11px] text-[#076a64] mt-1 font-semibold flex items-center gap-1">
                <span className="material-symbols-outlined text-[12px]">verified</span>
                Owned &amp; Verified in Supabase
              </p>
            </div>

            {/* KPI 2: My Maintenance Tickets */}
            <div
              onClick={() => setActiveTab("maintenance")}
              className="bg-white p-5 rounded-xl border border-[#e7e8ea] shadow-sm cursor-pointer hover:border-[#ba1a1a] transition-all group"
            >
              <div className="flex items-center justify-between text-[#44474e] text-xs mb-2">
                <span className="font-semibold group-hover:text-[#ba1a1a]">My Complaints</span>
                <span className="material-symbols-outlined text-[20px] text-[#ba1a1a]">
                  build
                </span>
              </div>
              <p className="text-2xl font-bold text-[#ba1a1a] font-plus-jakarta">
                {complaintsList.length} {complaintsList.length === 1 ? "Ticket" : "Tickets"}
              </p>
              <p className="text-[11px] text-[#ba1a1a] mt-1 font-semibold flex items-center gap-1">
                <span className="material-symbols-outlined text-[12px]">schedule</span>
                {complaintsList.filter((c) => c.status === "pending").length} Pending Action
              </p>
            </div>

            {/* KPI 3: Leases & Bookings */}
            <div
              onClick={() => setActiveTab("lease")}
              className="bg-white p-5 rounded-xl border border-[#e7e8ea] shadow-sm cursor-pointer hover:border-[#076a64] transition-all group"
            >
              <div className="flex items-center justify-between text-[#44474e] text-xs mb-2">
                <span className="font-semibold group-hover:text-[#076a64]">My Bookings</span>
                <span className="material-symbols-outlined text-[20px] text-[#076a64]">
                  lock
                </span>
              </div>
              <p className="text-2xl font-bold text-[#076a64] font-plus-jakarta">
                {reservedProperties.length} {reservedProperties.length === 1 ? "Reservation" : "Reservations"}
              </p>
              <p className="text-[11px] text-[#076a64] mt-1 font-semibold flex items-center gap-1">
                <span className="material-symbols-outlined text-[12px]">shield</span>
                Bank Escrow Protected
              </p>
            </div>

            {/* KPI 4: Document Vault */}
            <div
              onClick={() => setActiveTab("documents")}
              className="bg-white p-5 rounded-xl border border-[#e7e8ea] shadow-sm cursor-pointer hover:border-[#172b4d] transition-all group"
            >
              <div className="flex items-center justify-between text-[#44474e] text-xs mb-2">
                <span className="font-semibold group-hover:text-[#001637]">Document Vault</span>
                <span className="material-symbols-outlined text-[20px] text-[#172b4d]">
                  folder
                </span>
              </div>
              <p className="text-2xl font-bold text-[#001637] font-plus-jakarta">3 Documents</p>
              <p className="text-[11px] text-[#10b981] mt-1 font-semibold flex items-center gap-1">
                <span className="material-symbols-outlined text-[12px]">check_circle</span>
                NADRA &amp; Deed Verified
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-[#e7e8ea] mb-8 pb-1 overflow-x-auto">
            {[
              { id: "properties", label: "My Properties", icon: "domain", count: myProperties.length },
              { id: "lease", label: "My Leases & Bookings", icon: "home", count: reservedProperties.length },
              { id: "maintenance", label: "My Complaints", icon: "build", count: complaintsList.length },
              { id: "documents", label: "Document Vault", icon: "folder" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`px-4 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? "bg-[#172b4d] text-white shadow-sm"
                    : "text-[#44474e] hover:text-[#001637] hover:bg-[#edeef0]"
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
                <span>{tab.label}</span>
                {typeof tab.count === "number" && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      activeTab === tab.id
                        ? "bg-white/20 text-white"
                        : "bg-[#e7e8ea] text-[#001637]"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* =================================================================== */}
          {/* TAB 1: MY PROPERTIES (User-specific properties strictly)             */}
          {/* =================================================================== */}
          {activeTab === "properties" && (
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 pb-4 border-b border-[#edeef0] gap-3">
                <div>
                  <h3 className="text-lg font-bold text-[#001637] flex items-center gap-2 font-plus-jakarta">
                    <span className="material-symbols-outlined text-[#076a64]">domain</span>
                    My Properties &amp; Listed Assets ({myProperties.length})
                  </h3>
                  <p className="text-xs text-[#75777f]">
                    Showing only real property records registered under your account in Supabase.
                  </p>
                </div>

                <Link
                  href="/properties"
                  className="px-4 py-2 bg-[#001637] hover:bg-[#172b4d] text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 self-start sm:self-auto shadow-xs"
                >
                  <span className="material-symbols-outlined text-[16px]">travel_explore</span>
                  <span>Explore Marketplace</span>
                </Link>
              </div>

              {isLoadingProps ? (
                <div className="p-12 text-center text-xs text-[#75777f] flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-[22px] animate-spin text-[#076a64]">
                    progress_activity
                  </span>
                  Fetching your registered properties from Supabase...
                </div>
              ) : myProperties.length === 0 ? (
                <div className="bg-white p-12 text-center rounded-2xl border border-dashed border-[#c4c7c5] shadow-xs">
                  <div className="w-16 h-16 rounded-full bg-[#f2f4f6] text-[#75777f] flex items-center justify-center mx-auto mb-3">
                    <span className="material-symbols-outlined text-[32px]">real_estate_agent</span>
                  </div>
                  <h4 className="text-sm font-bold text-[#001637] font-plus-jakarta">
                    No properties listed under your account
                  </h4>
                  <p className="text-xs text-[#75777f] max-w-md mx-auto mt-1 mb-5 leading-relaxed">
                    You currently have 0 active property listings in the database. Only verified platform administrators can publish properties on HavenKey.
                  </p>
                  <div className="flex items-center justify-center gap-3">
                    <Link
                      href="/properties"
                      className="px-5 py-2.5 bg-[#076a64] hover:bg-[#00201e] text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-[18px]">search</span>
                      <span>Browse Available Properties</span>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {myProperties.map((p) => (
                    <PropertyCard key={p.id} property={p} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* =================================================================== */}
          {/* TAB 2: MY ACTIVE LEASE & BOOKINGS                                  */}
          {/* =================================================================== */}
          {activeTab === "lease" && (
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 pb-4 border-b border-[#edeef0] gap-3">
                <div>
                  <h3 className="text-lg font-bold text-[#001637] flex items-center gap-2 font-plus-jakarta">
                    <span className="material-symbols-outlined text-[#076a64]">home</span>
                    My Tenancy Agreements &amp; Reservations ({reservedProperties.length})
                  </h3>
                  <p className="text-xs text-[#75777f]">
                    Biometric-verified tenancy agreements and bank-backed escrow deposit guarantees.
                  </p>
                </div>
              </div>

              {reservedProperties.length === 0 ? (
                <div className="bg-white p-12 text-center rounded-2xl border border-dashed border-[#c4c7c5] shadow-xs">
                  <div className="w-16 h-16 rounded-full bg-teal-50 text-[#076a64] flex items-center justify-center mx-auto mb-3">
                    <span className="material-symbols-outlined text-[32px]">house</span>
                  </div>
                  <h4 className="text-sm font-bold text-[#001637] font-plus-jakarta">
                    No active tenancy agreement found
                  </h4>
                  <p className="text-xs text-[#75777f] max-w-md mx-auto mt-1 mb-5 leading-relaxed">
                    You have not reserved or leased any properties yet. Once you reserve a verified home, your digital lease contract, payment schedule, and escrow receipt will appear here.
                  </p>
                  <Link
                    href="/properties"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#076a64] hover:bg-[#00201e] text-white text-xs font-bold rounded-xl transition-all shadow-sm"
                  >
                    <span className="material-symbols-outlined text-[18px]">search</span>
                    <span>Browse Properties to Rent</span>
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  {/* Lease Card */}
                  <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-[#e7e8ea] shadow-sm">
                    {reservedProperties.map((leaseProp, index) => (
                      <div key={leaseProp.id} className={index > 0 ? "pt-6 border-t border-[#edeef0]" : ""}>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#edeef0] gap-4">
                          <div>
                            <span className="text-[11px] font-bold uppercase tracking-wider text-[#076a64]">
                              Active Tenancy Agreement
                            </span>
                            <h3 className="text-xl font-bold text-[#001637] font-plus-jakarta mt-0.5">
                              {leaseProp.title}
                            </h3>
                            <p className="text-xs text-[#44474e] mt-1">{leaseProp.location || leaseProp.address}</p>
                          </div>
                          <span className="px-3 py-1 bg-[#a1f1e9] text-[#076a64] text-xs font-bold rounded-full w-fit">
                            Agreement #{leaseProp.id.slice(0, 8)}
                          </span>
                        </div>

                        <div className="py-6 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs border-b border-[#edeef0]">
                          <div>
                            <span className="text-[#75777f]">Landlord:</span>
                            <p className="font-bold text-[#001637] mt-0.5">
                              {leaseProp.landlord?.name || "Ahmed Khan"}
                            </p>
                          </div>
                          <div>
                            <span className="text-[#75777f]">Monthly Rent:</span>
                            <p className="font-bold text-[#001637] mt-0.5">
                              PKR {Number(leaseProp.price || 0).toLocaleString()} / mo
                            </p>
                          </div>
                          <div>
                            <span className="text-[#75777f]">Next Due Date:</span>
                            <p className="font-bold text-[#076a64] mt-0.5">15th of Every Month</p>
                          </div>
                          <div>
                            <span className="text-[#75777f]">Contract Status:</span>
                            <p className="font-bold text-emerald-600 mt-0.5 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                              Active &amp; Escrowed
                            </p>
                          </div>
                        </div>

                        {/* Payment Action Bar */}
                        <div className="pt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div>
                            <p className="text-xs text-[#44474e]">Protected Tenancy Escrow:</p>
                            <p className="text-sm font-semibold text-[#076a64] flex items-center gap-1">
                              <span className="material-symbols-outlined text-[16px]">verified</span>
                              PKR {(Number(leaseProp.price || 0) * 2).toLocaleString()} Security Deposit Locked
                            </p>
                          </div>

                          {paySuccess ? (
                            <div className="px-4 py-2 bg-[#a1f1e9] text-[#076a64] rounded-lg text-xs font-bold flex items-center gap-1">
                              <span className="material-symbols-outlined text-[16px]">check_circle</span>
                              Rent Paid for Current Month!
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setPaySuccess(true)}
                              className="px-6 py-2.5 bg-[#076a64] hover:bg-[#00201e] text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-all shadow-sm"
                            >
                              <span className="material-symbols-outlined text-[18px]">payments</span>
                              Pay PKR {Number(leaseProp.price || 0).toLocaleString()} via Escrow
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Quick Actions Sidebar */}
                  <div className="lg:col-span-4 flex flex-col gap-4">
                    <div className="bg-white p-5 rounded-xl border border-[#e7e8ea] shadow-sm">
                      <h4 className="text-sm font-bold text-[#001637] mb-3">Lease Documents</h4>
                      <div className="flex flex-col gap-2">
                        <button
                          type="button"
                          onClick={() => alert("Downloading Digital Biometric Lease Agreement (PDF)...")}
                          className="w-full p-2.5 bg-[#f2f4f6] hover:bg-[#edeef0] text-[#001637] rounded-lg text-xs font-semibold flex items-center justify-between transition-colors"
                        >
                          <span className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-[18px] text-[#076a64]">
                              description
                            </span>
                            Biometric Signed Lease.pdf
                          </span>
                          <span className="material-symbols-outlined text-[16px]">download</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => alert("Downloading Bank Escrow Guarantee Receipt...")}
                          className="w-full p-2.5 bg-[#f2f4f6] hover:bg-[#edeef0] text-[#001637] rounded-lg text-xs font-semibold flex items-center justify-between transition-colors"
                        >
                          <span className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-[18px] text-[#076a64]">
                              receipt_long
                            </span>
                            Deposit Escrow Receipt.pdf
                          </span>
                          <span className="material-symbols-outlined text-[16px]">download</span>
                        </button>
                      </div>
                    </div>

                    <div className="bg-white p-5 rounded-xl border border-[#e7e8ea] shadow-sm">
                      <h4 className="text-sm font-bold text-[#001637] mb-2">Concierge &amp; Support</h4>
                      <p className="text-xs text-[#44474e] leading-relaxed mb-3">
                        Need emergency plumbing, electrical repairs, or landlord mediation?
                      </p>
                      <button
                        type="button"
                        onClick={() => setActiveTab("maintenance")}
                        className="w-full py-2 bg-[#172b4d] text-white hover:bg-[#001637] text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5"
                      >
                        <span className="material-symbols-outlined text-[16px]">build</span>
                        File Maintenance Ticket
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* =================================================================== */}
          {/* TAB 3: MY COMPLAINTS & MAINTENANCE TICKETS                          */}
          {/* =================================================================== */}
          {activeTab === "maintenance" && (
            <div className="bg-white rounded-2xl p-6 border border-[#e7e8ea] shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 pb-4 border-b border-[#edeef0] gap-3">
                <div>
                  <h3 className="text-lg font-bold text-[#001637] flex items-center gap-2 font-plus-jakarta">
                    <span className="material-symbols-outlined text-[#ba1a1a]">build</span>
                    My Maintenance Tickets &amp; Complaints ({complaintsList.length})
                  </h3>
                  <p className="text-xs text-[#75777f]">
                    Live maintenance tickets submitted by your account. Dispatched directly to property owners.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowNewComplaintForm(!showNewComplaintForm)}
                  className="px-4 py-2 bg-[#ba1a1a] hover:bg-[#93000a] text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm self-start sm:self-auto"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {showNewComplaintForm ? "close" : "add"}
                  </span>
                  <span>{showNewComplaintForm ? "Close Form" : "File New Ticket"}</span>
                </button>
              </div>

              {complaintNotice && (
                <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-start gap-2">
                  <span className="material-symbols-outlined text-[16px] text-emerald-600 mt-0.5 shrink-0">check_circle</span>
                  <span>{complaintNotice}</span>
                </div>
              )}

              {complaintNoticeError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-start gap-2">
                  <span className="material-symbols-outlined text-[16px] text-red-600 mt-0.5 shrink-0">error</span>
                  <span>{complaintNoticeError}</span>
                </div>
              )}

              {/* Form to submit complaint */}
              {showNewComplaintForm && (
                reservedProperties.length === 0 ? (
                  <div className="mb-6 p-5 bg-amber-50 rounded-xl border border-amber-200">
                    <div className="flex items-center gap-2 text-amber-900 font-bold text-xs mb-1">
                      <span className="material-symbols-outlined text-[18px] text-amber-700">warning</span>
                      <span>No Reserved Properties</span>
                    </div>
                    <p className="text-xs text-amber-800 leading-relaxed mb-3">
                      Under HavenKey platform policy, a user can only file complaints for properties they have actively reserved or leased. You currently have 0 active reservations.
                    </p>
                    <Link
                      href="/properties"
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#076a64] hover:bg-[#00201e] text-white text-xs font-semibold rounded-lg transition-colors shadow-sm"
                    >
                      <span className="material-symbols-outlined text-[15px]">search</span>
                      <span>Explore &amp; Reserve Properties</span>
                    </Link>
                  </div>
                ) : (
                  <form
                    onSubmit={handleDashboardComplaintSubmit}
                    className="mb-6 p-5 bg-[#fff8f7] rounded-xl border border-[#ffdad6] space-y-3"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-[#ffdad6]">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[#ba1a1a] flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px]">report_problem</span>
                        File Complaint or Repair Request
                      </h4>
                    </div>

                    {/* Property Selector */}
                    <div>
                      <label className="text-[11px] font-semibold text-[#44474e] block mb-1">
                        Select Your Reserved Property:
                      </label>
                      <select
                        value={complaintPropertyId}
                        onChange={(e) => setComplaintPropertyId(e.target.value)}
                        className="w-full h-9 px-3 bg-white text-xs text-[#191c1e] rounded-lg border border-[#e7e8ea] focus:outline-none focus:border-[#ba1a1a]"
                      >
                        {reservedProperties.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.title} ({p.location || p.address || "Lahore"})
                          </option>
                        ))}
                      </select>
                    </div>

                  {/* Category Chips */}
                  <div>
                    <label className="text-[11px] font-semibold text-[#44474e] block mb-1">
                      Category:
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        "Maintenance & Repairs",
                        "Plumbing & Water",
                        "Electrical & Power",
                        "HVAC & Cooling",
                        "Structural Damage",
                        "Security & Locks",
                      ].map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setComplaintCategory(cat)}
                          className={`px-2.5 py-1 text-[11px] rounded-full border transition-all ${
                            complaintCategory === cat
                              ? "bg-[#ba1a1a] text-white border-[#ba1a1a] font-semibold"
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
                      Complaint Subject *
                    </label>
                    <input
                      type="text"
                      value={complaintTitle}
                      onChange={(e) => setComplaintTitle(e.target.value)}
                      placeholder="e.g. Master bathroom water leakage / AC gas leakage"
                      required
                      className="w-full h-9 px-3 bg-white text-xs text-[#191c1e] rounded-lg border border-[#e7e8ea] focus:outline-none focus:border-[#ba1a1a]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-[#44474e] block mb-1">
                      Detailed Description *
                    </label>
                    <textarea
                      rows={3}
                      value={complaintDesc}
                      onChange={(e) => setComplaintDesc(e.target.value)}
                      placeholder="Explain the issue clearly so the landlord and maintenance technicians can resolve it promptly..."
                      required
                      className="w-full p-2.5 bg-white text-xs text-[#191c1e] rounded-lg border border-[#e7e8ea] focus:outline-none focus:border-[#ba1a1a] resize-none"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <span className="text-[11px] text-[#75777f]">
                      Owner will receive an instant email notification.
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setShowNewComplaintForm(false)}
                        className="px-3.5 py-1.5 bg-[#f2f4f6] text-[#44474e] text-xs font-semibold rounded-lg hover:bg-[#edeef0]"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={complaintSubmitting}
                        className="px-4 py-1.5 bg-[#ba1a1a] hover:bg-[#93000a] text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-sm disabled:opacity-60"
                      >
                        {complaintSubmitting ? (
                          <>
                            <span className="material-symbols-outlined text-[15px] animate-spin">progress_activity</span>
                            <span>Sending...</span>
                          </>
                        ) : (
                          <>
                            <span className="material-symbols-outlined text-[15px]">send</span>
                            <span>Dispatch Ticket</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              ))}

              {/* Complaints List strictly for this user */}
              {isLoadingComplaints ? (
                <div className="p-8 text-center text-xs text-[#75777f] flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-[20px] animate-spin text-[#ba1a1a]">
                    progress_activity
                  </span>
                  Loading your filed complaints...
                </div>
              ) : complaintsList.length === 0 ? (
                <div className="p-8 text-center bg-[#f8f9fb] rounded-xl border border-dashed border-[#c4c7c5]">
                  <span className="material-symbols-outlined text-[36px] text-[#75777f] mb-2 block mx-auto">
                    assignment_turned_in
                  </span>
                  <h4 className="text-xs font-bold text-[#001637]">No maintenance complaints filed yet</h4>
                  <p className="text-[11px] text-[#75777f] mt-1 max-w-sm mx-auto">
                    Live database records only. Once a maintenance ticket is submitted by your account, it will appear here.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {complaintsList.map((ticket, idx) => {
                    const isCompleted = ticket.status === "resolved";
                    const isInProgress = ticket.status === "in_progress";
                    const refId = ticket.id ? (ticket.id.length > 12 ? ticket.id.slice(0, 8) : ticket.id) : `CMP-${idx + 1}`;

                    return (
                      <div
                        key={ticket.id || idx}
                        className="p-4 bg-[#f2f4f6] hover:bg-[#e7e8ea]/60 transition-colors rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-[#e7e8ea]"
                      >
                        <div className="flex items-start sm:items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center text-[#ba1a1a] shadow-xs shrink-0 mt-0.5 sm:mt-0">
                            <span className="material-symbols-outlined text-[20px]">
                              build
                            </span>
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-xs font-bold text-[#001637]">
                                {ticket.title}
                              </h4>
                              {ticket.properties?.title && (
                                <span className="px-2 py-0.5 bg-white text-[10px] font-semibold text-[#076a64] rounded border border-[#e7e8ea]">
                                  {ticket.properties.title}
                                </span>
                              )}
                            </div>
                            {ticket.description && (
                              <p className="text-[11px] text-[#44474e] mt-0.5 line-clamp-1">
                                {ticket.description}
                              </p>
                            )}
                            <p className="text-[10px] text-[#75777f] mt-0.5">
                              Ticket #{refId} &bull; {new Date(ticket.created_at || Date.now()).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                            </p>
                          </div>
                        </div>

                        <div className="self-end sm:self-center">
                          <span
                            className={`px-2.5 py-1 text-xs font-semibold rounded-full uppercase text-[10px] tracking-wider ${
                              isCompleted
                                ? "bg-[#a1f1e9] text-[#076a64]"
                                : isInProgress
                                ? "bg-[#ffddb9] text-[#241300]"
                                : "bg-[#ffdad6] text-[#ba1a1a]"
                            }`}
                          >
                            {isCompleted ? "Resolved" : isInProgress ? "In Progress" : "Pending Review"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* =================================================================== */}
          {/* TAB 4: TENANT DOCUMENT VAULT                                       */}
          {/* =================================================================== */}
          {activeTab === "documents" && (
            <div className="bg-white rounded-2xl p-6 border border-[#e7e8ea] shadow-sm">
              <h3 className="text-lg font-bold text-[#001637] mb-4 font-plus-jakarta">
                Verified Document Vault for {userName}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-[#f2f4f6] rounded-xl border border-[#e7e8ea]">
                  <span className="material-symbols-outlined text-[24px] text-[#076a64]">
                    fingerprint
                  </span>
                  <h4 className="text-xs font-bold text-[#001637] mt-2">NADRA Biometric KYC</h4>
                  <p className="text-[11px] text-[#75777f] mt-1">
                    CNIC: {currentUser.cnic || currentUser.CNIC || "61101-*******-1"}
                  </p>
                  <span className="inline-block mt-3 px-2 py-0.5 bg-[#a1f1e9] text-[#076a64] text-[10px] font-bold rounded">
                    Verified
                  </span>
                </div>

                <div className="p-4 bg-[#f2f4f6] rounded-xl border border-[#e7e8ea]">
                  <span className="material-symbols-outlined text-[24px] text-[#076a64]">
                    gavel
                  </span>
                  <h4 className="text-xs font-bold text-[#001637] mt-2">Legal Digital Tenancy Deed</h4>
                  <p className="text-[11px] text-[#75777f] mt-1">Registered &amp; Notarized</p>
                  <span className="inline-block mt-3 px-2 py-0.5 bg-[#a1f1e9] text-[#076a64] text-[10px] font-bold rounded">
                    Active
                  </span>
                </div>

                <div className="p-4 bg-[#f2f4f6] rounded-xl border border-[#e7e8ea]">
                  <span className="material-symbols-outlined text-[24px] text-[#076a64]">
                    shield
                  </span>
                  <h4 className="text-xs font-bold text-[#001637] mt-2">Escrow Bond Certificate</h4>
                  <p className="text-[11px] text-[#75777f] mt-1">Bank Escrow Insured</p>
                  <span className="inline-block mt-3 px-2 py-0.5 bg-[#a1f1e9] text-[#076a64] text-[10px] font-bold rounded">
                    Insured
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}
