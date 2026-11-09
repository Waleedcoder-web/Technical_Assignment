"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import { getStoredProperties, saveStoredProperties } from "@/lib/mock-data";
import CustomDropdown from "@/components/ui/custom-dropdown";

interface ReservedItem {
  id: string;
  title: string;
  location: string;
  price: number | string;
  image?: string;
  ownerName: string;
  ownerEmail: string;
  startDate: string;
  endDate: string;
  durationText: string;
  durationMonths: number;
  daysRemaining: number;
  status: "reserved" | "auto_unreserved" | "unreserved";
}

export default function ReservationsPage() {
  const [reservedList, setReservedList] = useState<ReservedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<{ name: string; email: string; phone: string }>({
    name: "Waleed Hassan",
    email: "waleed@havenkey.pk",
    phone: "+92 300 1234567",
  });

  // Departure Modal State
  const [departureTarget, setDepartureTarget] = useState<ReservedItem | null>(null);
  const [departureReason, setDepartureReason] = useState("End of stay / Relocation");
  const [isProcessingDeparture, setIsProcessingDeparture] = useState(false);
  const [departureNotice, setDepartureNotice] = useState<string | null>(null);
  const [departureError, setDepartureError] = useState<string | null>(null);

  // Tour / Stay Duration Adjustment State
  const [editingDurationItem, setEditingDurationItem] = useState<ReservedItem | null>(null);
  const [editDurationNumber, setEditDurationNumber] = useState(1);
  const [editDurationUnit, setEditDurationUnit] = useState<"days" | "weeks" | "months">("days");

  const handleSaveAdjustedDuration = () => {
    if (!editingDurationItem) return;
    const now = new Date();
    const num = Math.max(1, editDurationNumber || 1);
    const newEnd = new Date(now);
    if (editDurationUnit === "days") newEnd.setDate(newEnd.getDate() + num);
    else if (editDurationUnit === "weeks") newEnd.setDate(newEnd.getDate() + num * 7);
    else if (editDurationUnit === "months") newEnd.setMonth(newEnd.getMonth() + num);

    const unitLabel = num === 1 ? editDurationUnit.replace(/s$/, "") : editDurationUnit;
    const newDurationText = `${num} ${unitLabel.charAt(0).toUpperCase() + unitLabel.slice(1)} ${editDurationUnit === "days" && num <= 7 ? "(Tour Stay)" : ""}`.trim();
    const newEndStr = newEnd.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
    const diffMs = newEnd.getTime() - now.getTime();
    const newDaysLeft = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

    if (typeof window !== "undefined") {
      try {
        const rawMeta = localStorage.getItem("havenkey_reserved_metadata") || "{}";
        const metaMap = JSON.parse(rawMeta);
        metaMap[editingDurationItem.id] = {
          ...metaMap[editingDurationItem.id],
          id: editingDurationItem.id,
          title: editingDurationItem.title,
          startDate: now.toISOString().split("T")[0],
          endDate: newEnd.toISOString().split("T")[0],
          duration: newDurationText,
        };
        localStorage.setItem("havenkey_reserved_metadata", JSON.stringify(metaMap));
      } catch {}
    }

    setReservedList((prev) =>
      prev.map((item) =>
        item.id === editingDurationItem.id
          ? {
              ...item,
              durationText: newDurationText,
              endDate: newEndStr,
              daysRemaining: newDaysLeft,
              status: newDaysLeft <= 0 ? "auto_unreserved" : "reserved",
            }
          : item
      )
    );

    setEditingDurationItem(null);
  };

  useEffect(() => {
    // 1. Sync User profile
    if (typeof window !== "undefined") {
      try {
        const rawUser = localStorage.getItem("havenkey_user");
        if (rawUser) {
          const parsed = JSON.parse(rawUser);
          setUserProfile({
            name: parsed.fullname || parsed.name || "Waleed Hassan",
            email: parsed.email || "waleed@havenkey.pk",
            phone: parsed.phone_no || parsed.phone || "+92 300 1234567",
          });
        }
      } catch {}
    }

    // 2. Discover reserved properties
    const loadReservations = async () => {
      try {
        let propIds: string[] = [];
        if (typeof window !== "undefined") {
          try {
            const rawUser = localStorage.getItem("havenkey_user");
            let userId = "";
            if (rawUser) {
              const u = JSON.parse(rawUser);
              userId = u.id || "";
            }
            const rawScoped = userId ? localStorage.getItem(`havenkey_reserved_${userId}`) : null;
            const raw = localStorage.getItem("havenkey_reserved_properties");
            if (rawScoped) {
              const parsed = JSON.parse(rawScoped);
              if (Array.isArray(parsed)) propIds = parsed;
            } else if (raw) {
              const parsed = JSON.parse(raw);
              if (Array.isArray(parsed)) propIds = parsed;
            }
          } catch {}
        }

        const localList = getStoredProperties();
        const items: ReservedItem[] = [];
        const now = new Date();

        for (const pId of propIds) {
          let foundInDatabase = false;
          let title = "";
          let location = "";
          let price: any = 0;
          let image = "";
          let ownerName = "Property Owner";
          let ownerEmail = "concierge@havenkey.pk";
          let liveStatus: "reserved" | "unreserved" = "reserved";

          const localMatch = localList.find((p) => p.id === pId);
          if (localMatch) {
            foundInDatabase = true;
            title = localMatch.title;
            location = localMatch.location || localMatch.address || "";
            price = localMatch.price || 0;
            if (localMatch.images?.[0]) image = localMatch.images[0];
            if (localMatch.status === "available") {
              liveStatus = "unreserved";
            }
          }

          try {
            const res = await fetch(`/api/properties/${pId}`, { cache: "no-store" });
            const data = await res.json();
            if (data.success && data.data) {
              foundInDatabase = true;
              title = data.data.title || title;
              location = data.data.location || data.data.address || location;
              price = data.data.price || price;
              if (data.data.images?.[0]) image = data.data.images[0];
              if (data.data.status === "available") {
                liveStatus = "unreserved";
              }
            }
          } catch {}

          // If this property does not exist in Supabase or local state, it was deleted! Purge from localStorage
          if (!foundInDatabase) {
            if (typeof window !== "undefined") {
              try {
                const rawUser = localStorage.getItem("havenkey_user");
                if (rawUser) {
                  const u = JSON.parse(rawUser);
                  if (u.id) {
                    const rawScoped = localStorage.getItem(`havenkey_reserved_${u.id}`);
                    if (rawScoped) {
                      const parsedScoped = JSON.parse(rawScoped);
                      if (Array.isArray(parsedScoped)) {
                        localStorage.setItem(`havenkey_reserved_${u.id}`, JSON.stringify(parsedScoped.filter((id) => id !== pId)));
                      }
                    }
                  }
                }
                const rawGen = localStorage.getItem("havenkey_reserved_properties");
                if (rawGen) {
                  const parsedGen = JSON.parse(rawGen);
                  if (Array.isArray(parsedGen)) {
                    localStorage.setItem("havenkey_reserved_properties", JSON.stringify(parsedGen.filter((id) => id !== pId)));
                  }
                }
                const rawMeta = localStorage.getItem("havenkey_reserved_metadata");
                if (rawMeta) {
                  const metaMap = JSON.parse(rawMeta);
                  delete metaMap[pId];
                  localStorage.setItem("havenkey_reserved_metadata", JSON.stringify(metaMap));
                }
              } catch {}
            }
            continue; // Do not show deleted/ghost properties!
          }

          // Also check live booking status from Supabase
          try {
            const bRes = await fetch(`/api/bookings?propertyId=${pId}`, { cache: "no-store" });
            const bJson = await bRes.json();
            if (bJson.success && Array.isArray(bJson.data) && bJson.data.length > 0) {
              const latest = bJson.data[0];
              if (latest.status === "completed" || latest.status === "unreserved") {
                liveStatus = "unreserved";
              }
            }
          } catch {}

          // Check if custom / manual duration was saved
          let durationLabel = "6 Months";
          let startDateStr = "";
          let endDateStr = "";
          let daysLeft = 180;

          let savedMeta: any = null;
          if (typeof window !== "undefined") {
            try {
              const rawMeta = localStorage.getItem("havenkey_reserved_metadata") || "{}";
              const metaMap = JSON.parse(rawMeta);
              if (metaMap[pId]) savedMeta = metaMap[pId];
            } catch {}
          }

          if (savedMeta?.status === "unreserved" || savedMeta?.status === "completed") {
            liveStatus = "unreserved";
          }

          if (savedMeta?.duration) {
            durationLabel = savedMeta.duration;
            const sDate = savedMeta.startDate ? new Date(savedMeta.startDate) : new Date(now);
            startDateStr = sDate.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

            if (savedMeta.endDate) {
              const eDate = new Date(savedMeta.endDate);
              endDateStr = eDate.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
              const diffMs = eDate.getTime() - now.getTime();
              daysLeft = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
            } else {
              const eDate = new Date(sDate);
              eDate.setDate(eDate.getDate() + 1);
              endDateStr = eDate.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
              daysLeft = 1;
            }
          } else {
            // Default 6-month tenancy window
            const start = new Date(now.getFullYear(), now.getMonth(), 15);
            const end = new Date(start);
            end.setMonth(end.getMonth() + 6);
            startDateStr = start.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
            endDateStr = end.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
            const diffMs = end.getTime() - now.getTime();
            daysLeft = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
          }

          const itemFinalStatus: "reserved" | "auto_unreserved" | "unreserved" =
            liveStatus === "unreserved" ? "unreserved" : daysLeft <= 0 ? "auto_unreserved" : "reserved";

          // If unreserved, clean from active reserved keys
          if (itemFinalStatus === "unreserved" && typeof window !== "undefined") {
            try {
              const rawUser = localStorage.getItem("havenkey_user");
              if (rawUser) {
                const u = JSON.parse(rawUser);
                if (u.id) {
                  const rawScoped = localStorage.getItem(`havenkey_reserved_${u.id}`);
                  if (rawScoped) {
                    const parsed = JSON.parse(rawScoped);
                    if (Array.isArray(parsed) && parsed.includes(pId)) {
                      localStorage.setItem(`havenkey_reserved_${u.id}`, JSON.stringify(parsed.filter((id) => id !== pId)));
                    }
                  }
                }
              }
              const rawGen = localStorage.getItem("havenkey_reserved_properties");
              if (rawGen) {
                const parsedGen = JSON.parse(rawGen);
                if (Array.isArray(parsedGen) && parsedGen.includes(pId)) {
                  localStorage.setItem("havenkey_reserved_properties", JSON.stringify(parsedGen.filter((id) => id !== pId)));
                }
              }
            } catch {}
          }

          const item: ReservedItem = {
            id: pId,
            title,
            location,
            price,
            image,
            ownerName,
            ownerEmail,
            startDate: startDateStr,
            endDate: endDateStr,
            durationText: durationLabel,
            durationMonths: durationLabel.toLowerCase().includes("month") ? 6 : 1,
            daysRemaining: daysLeft,
            status: itemFinalStatus,
          };

          // If time finished (<= 0 days left), automatically trigger unreserve API
          if (daysLeft <= 0 && itemFinalStatus !== "unreserved") {
            triggerAutoUnreserve(item);
          }

          items.push(item);
        }

        setReservedList(items);
      } finally {
        setLoadingReserved(false);
      }
    };

    const triggerAutoUnreserve = async (item: ReservedItem) => {
      try {
        await fetch("/api/properties/unreserve", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            propertyId: item.id,
            propertyTitle: item.title,
            ownerName: item.ownerName,
            ownerEmail: item.ownerEmail,
            userName: userProfile.name,
            userEmail: userProfile.email,
            userPhone: userProfile.phone,
            reason: "6-Month Tenancy Duration Concluded (Automatically Unreserved)",
            isAutomatic: true,
          }),
        });
      } catch (e) {
        console.warn("Auto-unreserve trigger warning:", e);
      }
    };

    loadReservations();
  }, []);

  const [loadingReserved, setLoadingReserved] = useState(true);

  const handleExecuteDeparture = async () => {
    if (!departureTarget) return;
    setIsProcessingDeparture(true);
    setDepartureError(null);

    try {
      const res = await fetch("/api/properties/unreserve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: departureTarget.id,
          propertyTitle: departureTarget.title,
          ownerName: departureTarget.ownerName,
          ownerEmail: departureTarget.ownerEmail,
          userName: userProfile.name,
          userEmail: userProfile.email,
          userPhone: userProfile.phone,
          reason: departureReason,
          isAutomatic: false,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to process departure.");
      }

      // 1. Remove from all localStorage reserved lists
      if (typeof window !== "undefined") {
        try {
          const raw = localStorage.getItem("havenkey_reserved_properties");
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
              const updated = parsed.filter((id) => id !== departureTarget.id);
              localStorage.setItem("havenkey_reserved_properties", JSON.stringify(updated));
            }
          }

          // Clean scoped user key
          const rawUser = localStorage.getItem("havenkey_user");
          if (rawUser) {
            const u = JSON.parse(rawUser);
            if (u.id) {
              const rawScoped = localStorage.getItem(`havenkey_reserved_${u.id}`);
              if (rawScoped) {
                const parsedScoped = JSON.parse(rawScoped);
                if (Array.isArray(parsedScoped)) {
                  const updatedScoped = parsedScoped.filter((id: string) => id !== departureTarget.id);
                  localStorage.setItem(`havenkey_reserved_${u.id}`, JSON.stringify(updatedScoped));
                }
              }
            }
          }

          // Mark metadata as unreserved
          const rawMeta = localStorage.getItem("havenkey_reserved_metadata");
          if (rawMeta) {
            const metaMap = JSON.parse(rawMeta);
            if (metaMap[departureTarget.id]) {
              metaMap[departureTarget.id].status = "unreserved";
              localStorage.setItem("havenkey_reserved_metadata", JSON.stringify(metaMap));
            }
          }

          // Set property back to available in local mock
          const localProps = getStoredProperties();
          const mod = localProps.map((p) =>
            p.id === departureTarget.id ? { ...p, status: "available" as any } : p
          );
          saveStoredProperties(mod);

          // Dispatch sync event
          window.dispatchEvent(new Event("havenkey_properties_change"));
        } catch {}
      }

      // 2. Update local state
      setReservedList((prev) =>
        prev.map((item) =>
          item.id === departureTarget.id ? { ...item, status: "unreserved" } : item
        )
      );

      setDepartureNotice(
        `Departure successfully recorded for '${departureTarget.title}'. The listing has returned to AVAILABLE and confirmation emails have been sent to ${departureTarget.ownerName} (${departureTarget.ownerEmail}) and you.`
      );
      setDepartureTarget(null);
    } catch (err: any) {
      setDepartureError(err.message || "Failed to unreserve property. Please try again.");
    } finally {
      setIsProcessingDeparture(false);
    }
  };

  return (
    <>
      <Navbar />

      <main className="w-full pt-28 pb-20 bg-[#f8f9fb] min-h-screen">
        <div className="max-w-[1240px] mx-auto px-6 lg:px-8">
          {/* Header Banner */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-[#e7e8ea] shadow-sm mb-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 bg-[#a1f1e9] text-[#076a64] text-xs font-bold rounded-full uppercase tracking-wider flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">lock</span>
                    Active Bookings &amp; Leases
                  </span>
                  <span className="px-2.5 py-1 bg-amber-100 text-amber-900 text-xs font-bold rounded-full uppercase tracking-wider">
                    Automatic 6-Month Unreserve Enabled
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-[#001637] font-plus-jakarta mt-2">
                  Reserved Properties &amp; Departure Portal
                </h1>
                <p className="text-xs sm:text-sm text-[#44474e] mt-1 max-w-2xl">
                  Review your reserved listings, monitor lease durations, file maintenance complaints,
                  or initiate departure / unreservation with automatic email dispatch to the landlord.
                </p>
              </div>

              <div className="flex items-center gap-2 self-start md:self-auto">
                <Link
                  href="/complaints"
                  className="px-4 py-2 bg-[#ba1a1a] hover:bg-[#93000a] text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <span className="material-symbols-outlined text-[16px]">report_problem</span>
                  File Complaint
                </Link>
                <Link
                  href="/properties"
                  className="px-4 py-2 bg-[#f2f4f6] hover:bg-[#edeef0] text-[#001637] text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">search</span>
                  Browse More
                </Link>
              </div>
            </div>
          </div>

          {departureNotice && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-start gap-3 shadow-xs">
              <span className="material-symbols-outlined text-[20px] text-emerald-600 shrink-0">check_circle</span>
              <div>
                <strong className="block font-semibold mb-0.5">Property Unreserved &amp; Departed!</strong>
                <span>{departureNotice}</span>
              </div>
            </div>
          )}

          {/* Reserved Properties List */}
          {loadingReserved ? (
            <div className="bg-white p-12 rounded-2xl border border-[#e7e8ea] text-center text-xs text-[#75777f]">
              <span className="material-symbols-outlined animate-spin text-[28px] text-[#076a64] block mb-2 mx-auto">
                progress_activity
              </span>
              Loading your reserved properties and lease timelines...
            </div>
          ) : reservedList.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl border border-[#e7e8ea] text-center shadow-sm">
              <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-200">
                <span className="material-symbols-outlined text-[36px]">domain_disabled</span>
              </div>
              <h3 className="text-lg font-bold text-[#001637] font-plus-jakarta mb-1.5">
                No Active Reservations
              </h3>
              <p className="text-xs text-[#44474e] max-w-md mx-auto mb-5 leading-relaxed">
                You currently have no properties reserved under your account. When you complete an online booking or lease reservation, it will show up here.
              </p>
              <Link
                href="/properties"
                className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#076a64] hover:bg-[#00201e] text-white text-xs font-semibold rounded-lg transition-colors shadow-sm"
              >
                <span className="material-symbols-outlined text-[16px]">search</span>
                Explore Available Properties
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {reservedList.map((item) => {
                const isUnreserved = item.status === "unreserved" || item.status === "auto_unreserved";
                const percentPassed = Math.min(100, Math.round(((180 - item.daysRemaining) / 180) * 100));

                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-2xl border border-[#e7e8ea] overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-0">
                      {/* Thumbnail */}
                      <div className="md:col-span-4 relative min-h-[200px] md:min-h-full bg-[#f2f4f6]">
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                          <span
                            className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider shadow-sm flex items-center gap-1 ${
                              isUnreserved
                                ? "bg-gray-100 text-gray-700 border border-gray-300"
                                : "bg-[#a1f1e9] text-[#076a64] border border-[#076a64]/20"
                            }`}
                          >
                            <span className="material-symbols-outlined text-[14px]">
                              {isUnreserved ? "event_available" : "lock"}
                            </span>
                            {isUnreserved ? "Available / Unreserved" : "Reserved For You"}
                          </span>
                        </div>
                      </div>

                      {/* Content & Timeline */}
                      <div className="md:col-span-8 p-6 flex flex-col justify-between">
                        <div>
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#edeef0]">
                            <div>
                              <h3 className="text-lg font-bold text-[#001637] font-plus-jakarta">
                                {item.title}
                              </h3>
                              <p className="text-xs text-[#75777f] flex items-center gap-1 mt-0.5">
                                <span className="material-symbols-outlined text-[14px]">location_on</span>
                                {item.location}
                              </p>
                            </div>
                            <div className="text-right">
                              <span className="text-xs text-[#75777f] block">Rent / Value:</span>
                              <span className="text-base font-bold text-[#076a64] font-plus-jakarta">
                                PKR {Number(item.price).toLocaleString()}
                              </span>
                            </div>
                          </div>

                          {/* Stay / Tour Duration & Automatic Unreserve Countdown */}
                          <div className="mt-4 p-4 bg-[#f8f9fb] rounded-xl border border-[#e7e8ea]">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2 mb-2">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="material-symbols-outlined text-[18px] text-[#076a64]">schedule</span>
                                <span className="font-semibold text-[#001637]">
                                  {item.durationText || "Stay Duration"}:
                                </span>
                                <span className="text-[#44474e]">
                                  {item.startDate} &rarr; <strong>{item.endDate}</strong>
                                </span>
                              </div>

                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                  item.daysRemaining <= 0
                                    ? "bg-red-100 text-red-800"
                                    : item.daysRemaining <= 3
                                    ? "bg-amber-100 text-amber-800"
                                    : "bg-emerald-100 text-emerald-800"
                                }`}
                              >
                                {item.daysRemaining <= 0
                                  ? "Term Finished (Auto-Unreserved)"
                                  : `⏳ ${item.daysRemaining} Day${item.daysRemaining === 1 ? "" : "s"} Left`}
                              </span>
                            </div>

                            {/* Progress bar */}
                            <div className="w-full bg-[#e7e8ea] h-2 rounded-full overflow-hidden">
                              <div
                                className="bg-[#076a64] h-full transition-all duration-500 rounded-full"
                                style={{ width: `${percentPassed}%` }}
                              />
                            </div>

                            <p className="text-[11px] text-[#75777f] mt-2 flex items-center gap-1">
                              <span className="material-symbols-outlined text-[13px] text-[#076a64]">info</span>
                              When this reservation period ({item.durationText || "stay"}) finishes, the system will automatically unreserve the property and return it to AVAILABLE.
                            </p>
                          </div>

                          {/* Landlord Contact Info Strip */}
                          <div className="mt-3 flex flex-wrap items-center justify-between text-xs text-[#75777f] gap-3">
                            <div>
                              Landlord: <strong className="text-[#001637]">{item.ownerName}</strong> ({item.ownerEmail})
                            </div>
                            <div className="text-[11px]">
                              Status: <strong className={isUnreserved ? "text-gray-600" : "text-emerald-700"}>
                                {isUnreserved ? "Vacated / Completed" : "Active Reservation"}
                              </strong>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="mt-6 pt-4 border-t border-[#edeef0] flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Link
                              href={`/properties/${item.id}`}
                              className="px-3.5 py-2 bg-[#f2f4f6] hover:bg-[#edeef0] text-[#001637] text-xs font-semibold rounded-lg transition-colors flex items-center gap-1"
                            >
                              <span className="material-symbols-outlined text-[15px]">visibility</span>
                              View Listing
                            </Link>

                            {!isUnreserved && (
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingDurationItem(item);
                                  setEditDurationNumber(item.daysRemaining > 0 ? item.daysRemaining : 1);
                                  setEditDurationUnit(
                                    item.durationText.toLowerCase().includes("week")
                                      ? "weeks"
                                      : item.durationText.toLowerCase().includes("month")
                                      ? "months"
                                      : "days"
                                  );
                                }}
                                className="px-3 py-2 bg-[#e6f7f6] hover:bg-[#d0f3f0] text-[#076a64] text-xs font-semibold rounded-lg border border-[#a1f1e9] transition-colors flex items-center gap-1"
                              >
                                <span className="material-symbols-outlined text-[15px]">edit_calendar</span>
                                <span>Adjust Tour / Stay Days</span>
                              </button>
                            )}

                            {!isUnreserved && (
                              <Link
                                href={`/complaints?propertyId=${item.id}`}
                                className="px-3.5 py-2 bg-[#fff8f7] hover:bg-[#ffdad6] text-[#ba1a1a] text-xs font-semibold rounded-lg border border-[#ffdad6] transition-colors flex items-center gap-1"
                              >
                                <span className="material-symbols-outlined text-[15px]">report_problem</span>
                                File Complaint
                              </Link>
                            )}
                          </div>

                          {!isUnreserved ? (
                            <button
                              type="button"
                              onClick={() => {
                                setDepartureTarget(item);
                                setDepartureError(null);
                              }}
                              className="px-4 py-2 bg-[#ba1a1a] hover:bg-[#93000a] text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-sm transition-colors"
                            >
                              <span className="material-symbols-outlined text-[16px]">logout</span>
                              <span>Process Departure / Unreserve</span>
                            </button>
                          ) : (
                            <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-3 py-1.5 rounded-lg flex items-center gap-1">
                              <span className="material-symbols-outlined text-[16px]">check_circle</span>
                              Departure Completed
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Departure Confirmation Modal */}
          {departureTarget && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
              <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#e7e8ea] animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between pb-3 border-b border-[#edeef0]">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-full bg-red-100 text-[#ba1a1a] flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[20px]">logout</span>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#001637]">
                        Initiate Departure &amp; Unreserve
                      </h4>
                      <p className="text-[11px] text-[#75777f]">
                        {departureTarget.title}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setDepartureTarget(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <span className="material-symbols-outlined text-[20px]">close</span>
                  </button>
                </div>

                {departureError && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px]">error</span>
                    <span>{departureError}</span>
                  </div>
                )}

                <div className="mt-4 space-y-3 text-xs">
                  <p className="text-[#44474e] leading-relaxed">
                    By unreserving this property, you are confirming your scheduled or early departure.
                    The property listing will immediately revert to <strong className="text-[#076a64]">AVAILABLE</strong> for other applicants on HavenKey.
                  </p>

                  <div className="p-3 bg-[#f8f9fb] rounded-xl border border-[#e7e8ea] space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-[#75777f]">Property:</span>
                      <strong className="text-[#001637]">{departureTarget.title}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#75777f]">Landlord:</span>
                      <strong className="text-[#001637]">{departureTarget.ownerName} ({departureTarget.ownerEmail})</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#75777f]">Departure Date:</span>
                      <strong className="text-[#076a64]">{new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</strong>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-[#44474e] block mb-1">
                      Reason for Departure / Unreserving:
                    </label>
                    <CustomDropdown
                      value={departureReason}
                      onChange={setDepartureReason}
                      options={[
                        { value: "End of stay / Relocation", label: "End of stay / Relocation", icon: "flight_takeoff" },
                        { value: "Early lease departure / Job relocation", label: "Early lease departure / Job relocation", icon: "work" },
                        { value: "Mutual cancellation with landlord", label: "Mutual cancellation with landlord", icon: "handshake" },
                        { value: "6-Month tenancy period finished", label: "6-Month tenancy period finished", icon: "event_repeat" },
                        { value: "Other reason", label: "Other personal reason", icon: "help" },
                      ]}
                      icon="logout"
                    />
                  </div>

                  <p className="text-[11px] text-[#75777f] flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[15px] text-[#076a64]">mail</span>
                    A formal departure confirmation email will be delivered to <strong>{departureTarget.ownerEmail}</strong> and your inbox.
                  </p>
                </div>

                <div className="mt-6 pt-3 border-t border-[#edeef0] flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setDepartureTarget(null)}
                    className="px-4 py-2 bg-[#f2f4f6] text-[#44474e] text-xs font-semibold rounded-lg hover:bg-[#edeef0] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleExecuteDeparture}
                    disabled={isProcessingDeparture}
                    className="px-4 py-2 bg-[#ba1a1a] hover:bg-[#93000a] text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-sm transition-colors disabled:opacity-60"
                  >
                    {isProcessingDeparture ? (
                      <>
                        <span className="material-symbols-outlined text-[15px] animate-spin">progress_activity</span>
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[15px]">check</span>
                        <span>Confirm Departure &amp; Unreserve</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Adjust Tour / Stay Duration Modal */}
          {editingDurationItem && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
              <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#e7e8ea] animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between pb-3 border-b border-[#edeef0]">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-full bg-[#e6f7f6] text-[#076a64] flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[20px]">edit_calendar</span>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#001637]">
                        Adjust Tour / Stay Duration
                      </h4>
                      <p className="text-[11px] text-[#75777f]">
                        {editingDurationItem.title}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setEditingDurationItem(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <span className="material-symbols-outlined text-[20px]">close</span>
                  </button>
                </div>

                <div className="mt-4 space-y-4 text-xs">
                  <p className="text-[#44474e] leading-relaxed">
                    Set the exact duration for this reservation (e.g. <strong>1 Day for a short tour</strong>, 3 Days, 2 Weeks, or 6 Months).
                    When this time expires, the property status will automatically reset to Available.
                  </p>

                  <div className="p-3 bg-[#f8f9fb] rounded-xl border border-[#e7e8ea] space-y-2">
                    <label className="text-[11px] font-semibold text-[#44474e] block">
                      Enter Duration:
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <input
                          type="number"
                          min={1}
                          max={365}
                          value={editDurationNumber}
                          onChange={(e) => setEditDurationNumber(parseInt(e.target.value) || 1)}
                          className="w-full h-10 px-3 bg-white text-xs font-semibold text-[#001637] rounded-lg border border-[#e7e8ea] focus:outline-none focus:border-[#076a64]"
                          placeholder="e.g. 1"
                        />
                      </div>
                      <div>
                        <CustomDropdown
                          value={editDurationUnit}
                          onChange={(val) => setEditDurationUnit(val as any)}
                          buttonClassName="!bg-white"
                          options={[
                            { value: "days", label: "Days" },
                            { value: "weeks", label: "Weeks" },
                            { value: "months", label: "Months" },
                          ]}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 pt-1 text-[11px] text-[#076a64] font-medium">
                      <span className="material-symbols-outlined text-[15px]">timer</span>
                      <span>
                        Effective Duration: <strong>{editDurationNumber} {editDurationNumber === 1 ? editDurationUnit.replace(/s$/, "") : editDurationUnit} {editDurationUnit === "days" && editDurationNumber <= 7 ? "(Tour Stay)" : ""}</strong>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-3 border-t border-[#edeef0] flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingDurationItem(null)}
                    className="px-4 py-2 bg-[#f2f4f6] text-[#44474e] text-xs font-semibold rounded-lg hover:bg-[#edeef0] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveAdjustedDuration}
                    className="px-4 py-2 bg-[#076a64] hover:bg-[#054e49] text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-sm transition-colors"
                  >
                    <span className="material-symbols-outlined text-[15px]">save</span>
                    <span>Save Duration &amp; Update Countdown</span>
                  </button>
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
