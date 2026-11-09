"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import { getStoredProperties, saveStoredProperties } from "@/lib/mock-data";

function BookingVerifyContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id") || "";
  const initialAction = searchParams.get("action")?.toLowerCase() || "";
  const propertyId = searchParams.get("propertyId") || "";

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [currentInfo, setCurrentInfo] = useState<any>(null);

  // Sync property status to client localStorage
  const syncLocalPropertyStatus = (propId: string, newStatus: string) => {
    if (!propId) return;
    try {
      const list = getStoredProperties();
      const updated = list.map((p) =>
        p.id === propId ? { ...p, status: newStatus as any } : p
      );
      saveStoredProperties(updated);
    } catch (e) {
      console.warn("Failed to update localStorage property status:", e);
    }
  };

  const handleAction = async (actionChoice: "yes" | "no") => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/bookings/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          action: actionChoice,
          propertyId: propertyId || currentInfo?.propertyId,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to process verification.");
      }
      setResult(data);
      if (data.propertyId && data.propertyStatus) {
        syncLocalPropertyStatus(data.propertyId, data.propertyStatus);
      }
    } catch (err: any) {
      setError(err.message || "An error occurred during verification.");
    } finally {
      setSubmitting(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!id && !propertyId) {
      setError("No booking reference ID or property ID provided.");
      setLoading(false);
      return;
    }

    if (initialAction === "yes" || initialAction === "no") {
      // Execute automatically from email link
      handleAction(initialAction as "yes" | "no");
    } else {
      // Fetch current status and wait for user's Yes/No click
      fetch(`/api/bookings/verify?id=${encodeURIComponent(id)}&propertyId=${encodeURIComponent(propertyId)}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.success) {
            setCurrentInfo(data);
          } else {
            setError(data.message || "Could not retrieve booking details.");
          }
        })
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    }
  }, [id, initialAction, propertyId]);

  return (
    <main className="w-full pt-28 pb-20 bg-[#f8f9fb] min-h-[70vh] flex items-center justify-center">
      <div className="max-w-[580px] w-full mx-auto px-6">
        <div className="bg-white rounded-2xl border border-[#e7e8ea] shadow-sm p-6 sm:p-8 text-center">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-[#44474e]">
              <span className="material-symbols-outlined text-[36px] text-[#076a64] animate-spin">
                progress_activity
              </span>
              <p className="text-sm font-medium">Processing verification request...</p>
            </div>
          ) : error ? (
            <div className="py-6">
              <div className="w-14 h-14 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-200">
                <span className="material-symbols-outlined text-[32px]">error</span>
              </div>
              <h2 className="text-xl font-bold text-[#001637] font-plus-jakarta mb-2">
                Verification Error
              </h2>
              <p className="text-xs text-red-600 max-w-sm mx-auto mb-6">{error}</p>
              <Link
                href="/properties"
                className="px-5 py-2.5 bg-[#001637] text-white text-xs font-semibold rounded-lg hover:bg-[#172b4d] transition-colors inline-block"
              >
                Browse Available Properties
              </Link>
            </div>
          ) : result ? (
            <div className="py-4">
              {result.action === "yes" ? (
                <>
                  <div className="w-16 h-16 bg-[#e6f7f6] text-[#076a64] rounded-full flex items-center justify-center mx-auto mb-4 border border-[#a1f1e9]">
                    <span className="material-symbols-outlined text-[36px]">verified</span>
                  </div>
                  <span className="px-3 py-1 bg-[#a1f1e9] text-[#076a64] rounded-full text-xs font-bold tracking-wide uppercase inline-block mb-2">
                    User Confirmed &bull; YES
                  </span>
                  <h2 className="text-2xl font-bold text-[#001637] font-plus-jakarta mb-2">
                    Booking Confirmed &amp; Verified!
                  </h2>
                  <p className="text-xs text-[#44474e] max-w-md mx-auto mb-5">
                    {result.message}
                  </p>

                  <div className="bg-[#f2f4f6] rounded-xl p-4 text-left text-xs space-y-2 mb-6 border border-[#e7e8ea]">
                    <div className="flex justify-between">
                      <span className="text-[#75777f]">Reference ID:</span>
                      <span className="font-mono font-semibold text-[#001637]">#{id.slice(0, 8)}</span>
                    </div>
                    {result.propertyTitle && (
                      <div className="flex justify-between">
                        <span className="text-[#75777f]">Property:</span>
                        <span className="font-semibold text-[#001637] truncate max-w-[240px]">
                          {result.propertyTitle}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-[#75777f]">Booking Status:</span>
                      <span className="font-bold text-[#076a64] uppercase">{result.bookingStatus}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#75777f]">Reservation Status:</span>
                      <span className="font-bold text-[#076a64] uppercase flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">verified</span>
                        Reserved For You
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-rose-200">
                    <span className="material-symbols-outlined text-[36px]">cancel</span>
                  </div>
                  <span className="px-3 py-1 bg-rose-100 text-rose-700 rounded-full text-xs font-bold tracking-wide uppercase inline-block mb-2">
                    User Cancelled &bull; NO
                  </span>
                  <h2 className="text-2xl font-bold text-[#001637] font-plus-jakarta mb-2">
                    Booking Cancelled
                  </h2>
                  <p className="text-xs text-[#44474e] max-w-md mx-auto mb-5">
                    {result.message}
                  </p>

                  <div className="bg-[#f2f4f6] rounded-xl p-4 text-left text-xs space-y-2 mb-6 border border-[#e7e8ea]">
                    <div className="flex justify-between">
                      <span className="text-[#75777f]">Reference ID:</span>
                      <span className="font-mono font-semibold text-[#001637]">#{id.slice(0, 8)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#75777f]">Booking Status:</span>
                      <span className="font-bold text-rose-600 uppercase">{result.bookingStatus}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#75777f]">Property Availability:</span>
                      <span className="font-bold text-[#076a64] uppercase">Released to Available</span>
                    </div>
                  </div>
                </>
              )}

              <div className="flex flex-wrap items-center justify-center gap-3">
                {result.propertyId && (
                  <Link
                    href={`/properties/${result.propertyId}`}
                    className="px-5 py-2.5 bg-[#076a64] text-white text-xs font-semibold rounded-lg hover:bg-[#00201e] transition-colors"
                  >
                    View Property Details
                  </Link>
                )}
                <Link
                  href="/properties"
                  className="px-5 py-2.5 bg-[#001637] text-white text-xs font-semibold rounded-lg hover:bg-[#172b4d] transition-colors"
                >
                  Browse Properties
                </Link>
              </div>
            </div>
          ) : (
            // Awaiting user's interactive YES or NO choice
            <div className="py-4">
              <div className="w-14 h-14 bg-[#eaf1fb] text-[#001637] rounded-full flex items-center justify-center mx-auto mb-4 border border-[#c9d8ea]">
                <span className="material-symbols-outlined text-[32px]">help</span>
              </div>
              <h2 className="text-2xl font-bold text-[#001637] font-plus-jakarta mb-2">
                Confirm Your Booking Request
              </h2>
              <p className="text-xs text-[#44474e] max-w-md mx-auto mb-5">
                The property <strong className="text-[#001637]">{currentInfo?.propertyTitle || "Listing"}</strong> has been temporarily held and <strong>Reserved For You</strong>. Please confirm your answer:
              </p>

              <div className="bg-[#f2f4f6] rounded-xl p-4 text-left text-xs space-y-2 mb-6 border border-[#e7e8ea]">
                <div className="flex justify-between">
                  <span className="text-[#75777f]">Reference:</span>
                  <span className="font-mono font-semibold text-[#001637]">#{id.slice(0, 8)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#75777f]">Current Status:</span>
                  <span className="font-bold text-amber-600 uppercase">Pending Your Answer</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => handleAction("yes")}
                  disabled={submitting}
                  className="w-full sm:w-auto px-6 py-3 bg-[#076a64] hover:bg-[#00201e] text-white text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-all shadow-sm disabled:opacity-60"
                >
                  <span className="material-symbols-outlined text-[18px]">check_circle</span>
                  <span>YES &mdash; Confirm Booking</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAction("no")}
                  disabled={submitting}
                  className="w-full sm:w-auto px-6 py-3 bg-[#ba1a1a] hover:bg-[#93000a] text-white text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-all shadow-sm disabled:opacity-60"
                >
                  <span className="material-symbols-outlined text-[18px]">cancel</span>
                  <span>NO &mdash; Cancel Booking</span>
                </button>
              </div>

              <p className="text-[11px] text-[#75777f] mt-4">
                Clicking <strong>NO</strong> will cancel the agreement and instantly release the property back to available.
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

export default function BookingVerifyPage() {
  return (
    <>
      <Navbar />
      <Suspense
        fallback={
          <div className="w-full pt-32 pb-20 flex justify-center text-xs text-[#75777f]">
            Loading verification page...
          </div>
        }
      >
        <BookingVerifyContent />
      </Suspense>
      <Footer />
    </>
  );
}
