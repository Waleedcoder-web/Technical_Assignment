"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import { getStoredProperties } from "@/lib/mock-data";

interface ReservedProperty {
  id: string;
  title: string;
  location?: string;
  address?: string;
  price?: number | string;
  ownerName?: string;
  ownerEmail?: string;
}

export default function ComplaintsPage() {
  const [reservedProperties, setReservedProperties] = useState<ReservedProperty[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("");
  const [loadingReserved, setLoadingReserved] = useState(true);

  // Form State
  const [category, setCategory] = useState("Maintenance / Repairs");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [userName, setUserName] = useState("Waleed Hassan");
  const [userEmail, setUserEmail] = useState("waleed@havenkey.pk");
  const [userPhone, setUserPhone] = useState("+92 300 1234567");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // History State
  const [complaintHistory, setComplaintHistory] = useState<any[]>([]);

  useEffect(() => {
    // 1. Prefill user profile from localStorage if available
    if (typeof window !== "undefined") {
      try {
        const storedUser = localStorage.getItem("havenkey_user");
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          if (parsed.fullname || parsed.name) setUserName(parsed.fullname || parsed.name);
          if (parsed.email) setUserEmail(parsed.email);
          if (parsed.phone_no || parsed.phone) setUserPhone(parsed.phone_no || parsed.phone);
        }
      } catch (e) {
        // ignore
      }
    }

    // 2. Discover user's reserved properties from database
    const loadReserved = async () => {
      try {
        let reservedIds: string[] = [];
        let userId = "";
        if (typeof window !== "undefined") {
          try {
            const rawUser = localStorage.getItem("havenkey_user");
            if (rawUser) {
              const u = JSON.parse(rawUser);
              userId = u.id || "";
            }
            const rawScoped = userId ? localStorage.getItem(`havenkey_reserved_${userId}`) : null;
            const raw = localStorage.getItem("havenkey_reserved_properties");
            if (rawScoped) {
              const parsed = JSON.parse(rawScoped);
              if (Array.isArray(parsed)) reservedIds = parsed;
            } else if (raw) {
              const parsed = JSON.parse(raw);
              if (Array.isArray(parsed)) reservedIds = parsed;
            }
          } catch {
            // ignore
          }
        }

        // Fetch live properties from Supabase database
        const res = await fetch("/api/properties");
        const json = await res.json();
        const liveProps = json.success && Array.isArray(json.data) ? json.data : [];

        const collected: ReservedProperty[] = [];

        // Strictly include ONLY properties that the user has actually reserved
        if (reservedIds.length > 0) {
          for (const pId of reservedIds) {
            const found = liveProps.find((p: any) => p.id === pId);
            if (found && found.status !== "available") {
              collected.push({
                id: found.id,
                title: found.title,
                location: found.location || found.address || "Pakistan",
                price: found.price,
                ownerName: found.landlord?.name || "Ahmed Khan",
                ownerEmail: found.landlord?.email || "dawworld86@gmail.com",
              });
            }
          }
        }

        setReservedProperties(collected);
        if (collected.length > 0) {
          setSelectedPropertyId(collected[0].id);
        } else {
          setSelectedPropertyId("");
        }
      } catch (err) {
        console.warn("Failed to load properties for complaints:", err);
      } finally {
        setLoadingReserved(false);
      }
    };

    loadReserved();

    // 3. Fetch past real complaints strictly for this user (or all if admin)
    let userFilter = "";
    let activeUser: any = null;
    try {
      const stored = localStorage.getItem("havenkey_user");
      if (stored) {
        activeUser = JSON.parse(stored);
        if (activeUser?.id && activeUser.role !== "admin") {
          userFilter = `?userId=${encodeURIComponent(activeUser.id)}`;
        }
      }
    } catch {}

    fetch(`/api/complaints${userFilter}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) {
          let list = data.data;
          if (activeUser && activeUser.role !== "admin") {
            list = list.filter(
              (c: any) =>
                c.user_id === activeUser.id ||
                (c.users?.email && c.users.email.toLowerCase() === activeUser.email?.toLowerCase())
            );
          }
          setComplaintHistory(list);
        }
      })
      .catch((e) => console.warn("Failed to load complaints history:", e));
  }, []);


  const selectedProperty =
    reservedProperties.find((p) => p.id === selectedPropertyId) || reservedProperties[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!selectedProperty || reservedProperties.length === 0) {
      setFormError("You can only file maintenance complaints for properties that you have actively reserved or leased.");
      return;
    }
    if (!title.trim() || title.trim().length < 3) {
      setFormError("Please enter a valid complaint subject / title.");
      return;
    }
    if (!description.trim() || description.trim().length < 5) {
      setFormError("Please provide a detailed description of the issue.");
      return;
    }

    let currentUserId: string | null = null;
    try {
      const raw = localStorage.getItem("havenkey_user");
      if (raw) {
        const parsed = JSON.parse(raw);
        currentUserId = parsed.id || null;
      }
    } catch {}

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/complaints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: selectedProperty.id,
          propertyTitle: selectedProperty.title,
          ownerName: selectedProperty.ownerName || "Ahmed Khan",
          ownerEmail: selectedProperty.ownerEmail || "dawworld86@gmail.com",
          userId: currentUserId,
          isReserved: true,
          userName: userName.trim(),
          userEmail: userEmail.trim(),
          userPhone: userPhone.trim(),
          category,
          title: title.trim(),
          description: description.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to submit complaint.");
      }

      setFormSuccess(
        data.message ||
          `Complaint registered successfully! An email alert has been dispatched to the property owner (${selectedProperty.ownerEmail || "dawworld86@gmail.com"}).`
      );

      const newTicket = {
        id: data.complaintId || `CMP-${Date.now().toString().slice(-4)}`,
        title: title.trim(),
        description: `[Category: ${category}] ${description.trim()}`,
        status: "pending",
        created_at: new Date().toISOString(),
      };

      setComplaintHistory((prev) => [newTicket, ...prev]);
      setTitle("");
      setDescription("");
    } catch (err: any) {
      setFormError(err.message || "Could not file complaint. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Navbar />

      <main className="w-full pt-28 pb-20 bg-[#f8f9fb] min-h-screen">
        <div className="max-w-[1200px] mx-auto px-6 lg:px-8">
          {/* Header Banner */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-[#e7e8ea] shadow-sm mb-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 bg-red-100 text-[#ba1a1a] text-xs font-bold rounded-full uppercase tracking-wider flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">report_problem</span>
                    Tenant Support Portal
                  </span>
                  <span className="px-2.5 py-1 bg-[#a1f1e9] text-[#076a64] text-xs font-bold rounded-full uppercase tracking-wider">
                    Reserved Properties Only
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-[#001637] font-plus-jakarta mt-2">
                  Maintenance Tickets &amp; Tenant Complaints
                </h1>
                <p className="text-xs sm:text-sm text-[#44474e] mt-1 max-w-2xl">
                  File formal maintenance requests or service complaints for your booked and reserved properties.
                  Every complaint is logged in Supabase and dispatched immediately to the property owner's inbox.
                </p>
              </div>

              <div className="flex items-center gap-2 self-start md:self-auto">
                <Link
                  href="/user/dashboard"
                  className="px-4 py-2 bg-[#f2f4f6] hover:bg-[#edeef0] text-[#001637] text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">dashboard</span>
                  My Dashboard
                </Link>
                <Link
                  href="/properties"
                  className="px-4 py-2 bg-[#001637] hover:bg-[#172b4d] text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <span className="material-symbols-outlined text-[16px]">search</span>
                  Browse Properties
                </Link>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left 8 Cols: Complaint Form & Property Selector */}
            <div className="lg:col-span-8 space-y-6">
              {loadingReserved ? (
                <div className="bg-white p-8 rounded-2xl border border-[#e7e8ea] text-center text-xs text-[#75777f]">
                  <span className="material-symbols-outlined animate-spin text-[24px] text-[#076a64] block mb-2 mx-auto">
                    progress_activity
                  </span>
                  Loading your reserved properties...
                </div>
              ) : reservedProperties.length === 0 ? (
                <div className="bg-white p-8 rounded-2xl border border-[#e7e8ea] text-center shadow-sm">
                  <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-3 border border-amber-200">
                    <span className="material-symbols-outlined text-[32px]">domain_disabled</span>
                  </div>
                  <h3 className="text-base font-bold text-[#001637] font-plus-jakarta mb-1">
                    No Reserved Properties Found
                  </h3>
                  <p className="text-xs text-[#44474e] max-w-md mx-auto mb-4">
                    Complaints can only be filed for properties that you have booked or reserved. Once you reserve a listing, you will be able to submit maintenance and facility complaints directly to the owner.
                  </p>
                  <Link
                    href="/properties"
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#076a64] hover:bg-[#00201e] text-white text-xs font-semibold rounded-lg transition-colors shadow-sm"
                  >
                    <span className="material-symbols-outlined text-[16px]">search</span>
                    Explore &amp; Reserve Properties
                  </Link>
                </div>
              ) : (
                <div className="bg-white rounded-2xl p-6 sm:p-7 border border-[#e7e8ea] shadow-sm">
                  {/* Step 1: Select Reserved Property */}
                  <div className="mb-6 pb-6 border-b border-[#edeef0]">
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-xs font-bold uppercase tracking-wider text-[#001637] flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px] text-[#076a64]">
                          real_estate_agent
                        </span>
                        Step 1: Choose Your Reserved Property
                      </label>
                      <span className="text-[11px] font-semibold text-[#076a64] bg-[#a1f1e9]/60 px-2 py-0.5 rounded-full">
                        {reservedProperties.length} Reserved Listing{reservedProperties.length > 1 ? "s" : ""}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {reservedProperties.map((prop) => (
                        <div
                          key={prop.id}
                          onClick={() => setSelectedPropertyId(prop.id)}
                          className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                            selectedPropertyId === prop.id
                              ? "border-[#ba1a1a] bg-[#fff8f7] shadow-xs ring-1 ring-[#ba1a1a]"
                              : "border-[#e7e8ea] bg-[#f8f9fb] hover:bg-white"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h4 className="text-xs font-bold text-[#001637] line-clamp-1">
                                {prop.title}
                              </h4>
                              <p className="text-[11px] text-[#75777f] mt-0.5">{prop.location}</p>
                              <p className="text-[10px] text-[#44474e] mt-1">
                                Owner: <strong className="text-[#001637]">{prop.ownerName || "Ahmed Khan"}</strong>
                              </p>
                            </div>
                            <span
                              className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                                selectedPropertyId === prop.id
                                  ? "bg-[#ba1a1a] text-white"
                                  : "border border-[#c4c7c5]"
                              }`}
                            >
                              {selectedPropertyId === prop.id && (
                                <span className="material-symbols-outlined text-[12px]">check</span>
                              )}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Step 2: Complaint Form */}
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-[#edeef0]">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-[#ba1a1a] flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px]">edit_note</span>
                        Step 2: Enter Complaint &amp; Maintenance Details
                      </h3>
                      <span className="text-[11px] text-[#75777f]">
                        Selected: <strong>{selectedProperty?.title}</strong>
                      </span>
                    </div>

                    {formSuccess && (
                      <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-start gap-2.5">
                        <span className="material-symbols-outlined text-[18px] text-emerald-600 mt-0.5 shrink-0">
                          check_circle
                        </span>
                        <div>
                          <strong className="block font-semibold">Complaint Registered &amp; Dispatched!</strong>
                          <span>{formSuccess}</span>
                        </div>
                      </div>
                    )}

                    {formError && (
                      <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2.5">
                        <span className="material-symbols-outlined text-[18px] text-red-600 mt-0.5 shrink-0">
                          error
                        </span>
                        <span>{formError}</span>
                      </div>
                    )}

                    {/* Category Selector Chips */}
                    <div>
                      <label className="text-[11px] font-semibold text-[#44474e] block mb-1.5">
                        Select Complaint / Issue Category:
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          "Maintenance & Repairs",
                          "Plumbing & Water Leakage",
                          "Electrical & Power",
                          "HVAC & Cooling",
                          "Structural Damage",
                          "Security & Locks",
                          "Noise & Neighbors",
                          "Tenancy / Deposit Terms",
                        ].map((cat) => (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => setCategory(cat)}
                            className={`px-3 py-1.5 text-[11px] rounded-full border transition-all ${
                              category === cat
                                ? "bg-[#ba1a1a] text-white border-[#ba1a1a] font-semibold shadow-xs"
                                : "bg-[#f8f9fb] text-[#44474e] border-[#e7e8ea] hover:bg-white"
                            }`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Complaint Subject */}
                    <div>
                      <label className="text-[11px] font-semibold text-[#44474e] block mb-1">
                        Complaint Subject / Headline *
                      </label>
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g. Master bathroom water leakage / Main circuit breaker trip"
                        required
                        className="w-full h-10 px-3 bg-[#f8f9fb] text-xs text-[#191c1e] rounded-lg border border-[#e7e8ea] focus:outline-none focus:border-[#ba1a1a]"
                      />
                    </div>

                    {/* Contact Details */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-[11px] font-semibold text-[#44474e] block mb-1">
                          Your Full Name *
                        </label>
                        <input
                          type="text"
                          value={userName}
                          onChange={(e) => setUserName(e.target.value)}
                          placeholder="Your Name"
                          required
                          className="w-full h-10 px-3 bg-[#f8f9fb] text-xs text-[#191c1e] rounded-lg border border-[#e7e8ea] focus:outline-none focus:border-[#ba1a1a]"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-[#44474e] block mb-1">
                          Your Email Address *
                        </label>
                        <input
                          type="email"
                          value={userEmail}
                          onChange={(e) => setUserEmail(e.target.value)}
                          placeholder="your.email@example.com"
                          required
                          className="w-full h-10 px-3 bg-[#f8f9fb] text-xs text-[#191c1e] rounded-lg border border-[#e7e8ea] focus:outline-none focus:border-[#ba1a1a]"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-[#44474e] block mb-1">
                          Phone / WhatsApp <span className="text-gray-400 font-normal">(optional)</span>
                        </label>
                        <input
                          type="tel"
                          value={userPhone}
                          onChange={(e) => setUserPhone(e.target.value)}
                          placeholder="+92 300 0000000"
                          className="w-full h-10 px-3 bg-[#f8f9fb] text-xs text-[#191c1e] rounded-lg border border-[#e7e8ea] focus:outline-none focus:border-[#ba1a1a]"
                        />
                      </div>
                    </div>

                    {/* Detailed Description */}
                    <div>
                      <label className="text-[11px] font-semibold text-[#44474e] block mb-1">
                        Detailed Description of Complaint / Issue *
                      </label>
                      <textarea
                        rows={4}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder={`Explain the issue clearly so the owner (${selectedProperty?.ownerName || "Ahmed Khan"}) and maintenance staff can inspect and resolve it immediately...`}
                        required
                        className="w-full p-3 bg-[#f8f9fb] text-xs text-[#191c1e] rounded-lg border border-[#e7e8ea] focus:outline-none focus:border-[#ba1a1a] resize-none"
                      />
                    </div>

                    {/* Footer Dispatch Action */}
                    <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-[#edeef0]">
                      <span className="text-[11px] text-[#75777f] flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px] text-[#076a64]">verified</span>
                        The property owner will immediately receive an alert at <strong>{selectedProperty?.ownerEmail || "dawworld86@gmail.com"}</strong>.
                      </span>

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-5 py-2.5 bg-[#ba1a1a] hover:bg-[#93000a] text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 shadow-sm transition-colors disabled:opacity-60"
                      >
                        {isSubmitting ? (
                          <>
                            <span className="material-symbols-outlined text-[16px] animate-spin">
                              progress_activity
                            </span>
                            <span>Dispatching...</span>
                          </>
                        ) : (
                          <>
                            <span className="material-symbols-outlined text-[16px]">send</span>
                            <span>Submit Complaint to Owner</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>

            {/* Right 4 Cols: Selected Property Preview & Complaint History */}
            <div className="lg:col-span-4 space-y-6">
              {/* Selected Property Card */}
              {selectedProperty && (
                <div className="bg-white p-5 rounded-2xl border border-[#e7e8ea] shadow-sm">
                  <div className="flex items-center justify-between pb-3 border-b border-[#edeef0] mb-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#076a64] bg-[#a1f1e9]/60 px-2.5 py-0.5 rounded-full">
                      Reserved Listing
                    </span>
                    <Link
                      href={`/properties/${selectedProperty.id}`}
                      className="text-[11px] font-semibold text-[#076a64] hover:underline flex items-center gap-0.5"
                    >
                      <span>View Listing</span>
                      <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                    </Link>
                  </div>

                  <h3 className="text-sm font-bold text-[#001637] font-plus-jakarta">
                    {selectedProperty.title}
                  </h3>
                  <p className="text-xs text-[#75777f] mt-0.5">{selectedProperty.location}</p>

                  <div className="mt-4 pt-3 border-t border-[#edeef0] text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[#75777f]">Landlord / Owner:</span>
                      <span className="font-semibold text-[#001637]">
                        {selectedProperty.ownerName || "Ahmed Khan"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#75777f]">Owner Email:</span>
                      <span className="font-mono text-[11px] text-[#076a64] truncate max-w-[170px]">
                        {selectedProperty.ownerEmail || "dawworld86@gmail.com"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#75777f]">Reservation Status:</span>
                      <span className="font-bold text-emerald-700">Reserved For You</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Complaints History Card */}
              <div className="bg-white p-5 rounded-2xl border border-[#e7e8ea] shadow-sm">
                <div className="flex items-center justify-between pb-3 border-b border-[#edeef0] mb-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#001637] flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-[#ba1a1a]">history</span>
                    Recent Tickets ({complaintHistory.length})
                  </h4>
                </div>

                {complaintHistory.length === 0 ? (
                  <p className="text-xs text-[#75777f] py-4 text-center">
                    No complaints registered yet.
                  </p>
                ) : (
                  <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                    {complaintHistory.map((ticket, idx) => {
                      const isCompleted =
                        ticket.status === "completed" || ticket.status === "resolved";
                      const isInProgress =
                        ticket.status === "in_progress" ||
                        ticket.status === "technician_assigned";
                      const refCode = ticket.id ? ticket.id.slice(0, 8) : `CMP-${idx + 1}`;

                      return (
                        <div
                          key={ticket.id || idx}
                          className="p-3 bg-[#f8f9fb] rounded-xl border border-[#e7e8ea] text-xs"
                        >
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="font-mono text-[10px] text-[#75777f]">#{refCode}</span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                                isCompleted
                                  ? "bg-[#a1f1e9] text-[#076a64]"
                                  : isInProgress
                                  ? "bg-[#ffddb9] text-[#241300]"
                                  : "bg-[#ffdad6] text-[#ba1a1a]"
                              }`}
                            >
                              {isCompleted ? "Resolved" : isInProgress ? "In Progress" : "Pending"}
                            </span>
                          </div>
                          <h5 className="font-bold text-[#001637] line-clamp-1">{ticket.title}</h5>
                          <p className="text-[11px] text-[#44474e] line-clamp-2 mt-0.5">
                            {ticket.description}
                          </p>
                          <span className="text-[10px] text-[#75777f] block mt-1">
                            {new Date(ticket.created_at || Date.now()).toLocaleDateString("en-GB", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
