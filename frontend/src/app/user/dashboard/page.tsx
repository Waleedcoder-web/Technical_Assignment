"use client";

import { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import PropertyCard from "@/components/ui/property-card";
import { mockProperties, mockCustomerLeases } from "@/lib/mock-data";

export default function CustomerDashboardPage() {
  const [activeTab, setActiveTab] = useState<"lease" | "saved" | "maintenance" | "documents">(
    "lease"
  );
  const [paySuccess, setPaySuccess] = useState(false);

  const activeLease = mockCustomerLeases[0];
  const savedProperties = mockProperties.slice(0, 3);

  return (
    <>
      <Navbar />

      <main className="w-full pt-24 pb-16 bg-[#f8f9fb] min-h-screen">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-12">
          {/* User Profile Banner */}
          <div className="bg-white rounded-2xl p-6 lg:p-8 border border-[#e7e8ea] shadow-sm mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-[#001637] text-white flex items-center justify-center text-xl font-bold ring-4 ring-[#a1f1e9]/50 shadow-md">
                WH
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl font-bold text-[#001637] font-plus-jakarta">
                    Waleed Hassan
                  </h1>
                  <span className="px-2.5 py-0.5 bg-[#a1f1e9] text-[#076a64] text-xs font-bold rounded-full flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">verified</span>
                    NADRA Biometric Verified Tenant
                  </span>
                </div>
                <p className="text-xs text-[#44474e] mt-1">
                  Customer ID: #HK-TEN-9021 • Account Tier: Verified Resident &amp; Escrow Protected
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/properties"
                className="px-4 py-2 bg-[#f2f4f6] hover:bg-[#edeef0] text-[#001637] text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[18px]">search</span>
                Browse More
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
            <div className="bg-white p-5 rounded-xl border border-[#e7e8ea] shadow-sm">
              <div className="flex items-center justify-between text-[#44474e] text-xs mb-2">
                <span>Active Leases</span>
                <span className="material-symbols-outlined text-[20px] text-[#076a64]">
                  real_estate_agent
                </span>
              </div>
              <p className="text-2xl font-bold text-[#001637] font-plus-jakarta">1 Property</p>
              <p className="text-[11px] text-[#076a64] mt-1 font-semibold flex items-center gap-1">
                <span className="material-symbols-outlined text-[12px]">check_circle</span>
                Current &amp; Verified
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-[#e7e8ea] shadow-sm">
              <div className="flex items-center justify-between text-[#44474e] text-xs mb-2">
                <span>Next Rent Due</span>
                <span className="material-symbols-outlined text-[20px] text-[#076a64]">
                  schedule
                </span>
              </div>
              <p className="text-2xl font-bold text-[#001637] font-plus-jakarta">PKR 380,000</p>
              <p className="text-[11px] text-[#75777f] mt-1">Due in 12 days (15 Nov 2026)</p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-[#e7e8ea] shadow-sm">
              <div className="flex items-center justify-between text-[#44474e] text-xs mb-2">
                <span>Escrow Protected Deposit</span>
                <span className="material-symbols-outlined text-[20px] text-[#076a64]">
                  lock
                </span>
              </div>
              <p className="text-2xl font-bold text-[#076a64] font-plus-jakarta">PKR 760,000</p>
              <p className="text-[11px] text-[#076a64] mt-1 font-semibold flex items-center gap-1">
                <span className="material-symbols-outlined text-[12px]">shield</span>
                Bank Escrow Locked
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-[#e7e8ea] shadow-sm">
              <div className="flex items-center justify-between text-[#44474e] text-xs mb-2">
                <span>Saved Watchlist</span>
                <span className="material-symbols-outlined text-[20px] text-[#076a64]">
                  favorite
                </span>
              </div>
              <p className="text-2xl font-bold text-[#001637] font-plus-jakarta">3 Listings</p>
              <p className="text-[11px] text-[#75777f] mt-1">Price drop alerts active</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-[#e7e8ea] mb-8 pb-1">
            {[
              { id: "lease", label: "My Active Lease", icon: "home" },
              { id: "saved", label: "Saved Properties", icon: "favorite" },
              { id: "maintenance", label: "Maintenance Tickets", icon: "build" },
              { id: "documents", label: "Tenant Document Vault", icon: "folder" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`px-4 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
                  activeTab === tab.id
                    ? "bg-[#172b4d] text-white shadow-sm"
                    : "text-[#44474e] hover:text-[#001637] hover:bg-[#edeef0]"
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* TAB 1: ACTIVE LEASE */}
          {activeTab === "lease" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Lease Card */}
              <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-[#e7e8ea] shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#edeef0] gap-4">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#076a64]">
                      Active Tenancy Agreement
                    </span>
                    <h3 className="text-xl font-bold text-[#001637] font-plus-jakarta mt-0.5">
                      {activeLease.propertyTitle}
                    </h3>
                    <p className="text-xs text-[#44474e] mt-1">{activeLease.unit}</p>
                  </div>
                  <span className="px-3 py-1 bg-[#a1f1e9] text-[#076a64] text-xs font-bold rounded-full w-fit">
                    Agreement #{activeLease.id}
                  </span>
                </div>

                <div className="py-6 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs border-b border-[#edeef0]">
                  <div>
                    <span className="text-[#75777f]">Landlord:</span>
                    <p className="font-bold text-[#001637] mt-0.5">{activeLease.landlordName}</p>
                  </div>
                  <div>
                    <span className="text-[#75777f]">Monthly Rent:</span>
                    <p className="font-bold text-[#001637] mt-0.5">{activeLease.monthlyRent}</p>
                  </div>
                  <div>
                    <span className="text-[#75777f]">Next Due Date:</span>
                    <p className="font-bold text-[#076a64] mt-0.5">{activeLease.nextDueDate}</p>
                  </div>
                  <div>
                    <span className="text-[#75777f]">Contract Expiry:</span>
                    <p className="font-bold text-[#001637] mt-0.5">{activeLease.leaseExpiry}</p>
                  </div>
                </div>

                {/* Payment Action Bar */}
                <div className="pt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <p className="text-xs text-[#44474e]">
                      Protected Tenancy Escrow:
                    </p>
                    <p className="text-sm font-semibold text-[#076a64] flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px]">verified</span>
                      {activeLease.depositProtected}
                    </p>
                  </div>

                  {paySuccess ? (
                    <div className="px-4 py-2 bg-[#a1f1e9] text-[#076a64] rounded-lg text-xs font-bold flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px]">check_circle</span>
                      Rent Paid for November 2026!
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setPaySuccess(true)}
                      className="px-6 py-2.5 bg-[#076a64] hover:bg-[#00201e] text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-all shadow-sm"
                    >
                      <span className="material-symbols-outlined text-[18px]">payments</span>
                      Pay PKR 380,000 via Escrow
                    </button>
                  )}
                </div>
              </div>

              {/* Quick Actions Sidebar */}
              <div className="lg:col-span-4 flex flex-col gap-4">
                <div className="bg-white p-5 rounded-xl border border-[#e7e8ea] shadow-sm">
                  <h4 className="text-sm font-bold text-[#001637] mb-3">Lease Documents</h4>
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => alert("Downloading Digital Lease Agreement (PDF)...")}
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
                      onClick={() => alert("Downloading Escrow Receipt...")}
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
                    Need emergency plumbing, electrical maintenance, or legal lease renewal?
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab("maintenance")}
                    className="w-full py-2 bg-[#172b4d] text-white hover:bg-[#001637] text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[16px]">build</span>
                    Open Maintenance Ticket
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SAVED PROPERTIES */}
          {activeTab === "saved" && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-[#001637]">
                  Your Saved Watchlist ({savedProperties.length})
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {savedProperties.map((p) => (
                  <PropertyCard key={p.id} property={p} />
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: MAINTENANCE TICKETS */}
          {activeTab === "maintenance" && (
            <div className="bg-white rounded-2xl p-6 border border-[#e7e8ea] shadow-sm">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#edeef0]">
                <div>
                  <h3 className="text-lg font-bold text-[#001637]">Maintenance &amp; Repairs</h3>
                  <p className="text-xs text-[#44474e]">
                    Direct dispatch with landlord approval and verified service specialists.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => alert("Ticket form opened")}
                  className="px-4 py-2 bg-[#076a64] text-white text-xs font-semibold rounded-lg hover:bg-[#00201e] transition-colors flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[16px]">add</span>
                  New Request
                </button>
              </div>

              <div className="flex flex-col gap-3">
                <div className="p-4 bg-[#f2f4f6] rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center text-[#076a64] shadow-xs">
                      <span className="material-symbols-outlined text-[20px]">ac_unit</span>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#001637]">
                        Central HVAC Seasonal Service
                      </h4>
                      <p className="text-[11px] text-[#75777f]">Ticket #MNT-202 • Submitted 3 days ago</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 bg-[#a1f1e9] text-[#076a64] text-xs font-semibold rounded-full">
                    Completed
                  </span>
                </div>

                <div className="p-4 bg-[#f2f4f6] rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center text-[#076a64] shadow-xs">
                      <span className="material-symbols-outlined text-[20px]">water_drop</span>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#001637]">
                        Master Bath Shower Pressure Calibration
                      </h4>
                      <p className="text-[11px] text-[#75777f]">Ticket #MNT-204 • Submitted today</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 bg-[#ffddb9] text-[#241300] text-xs font-semibold rounded-full">
                    Technician Assigned
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: TENANT DOCUMENT VAULT */}
          {activeTab === "documents" && (
            <div className="bg-white rounded-2xl p-6 border border-[#e7e8ea] shadow-sm">
              <h3 className="text-lg font-bold text-[#001637] mb-4">
                Verified Tenant Document Vault
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-[#f2f4f6] rounded-xl border border-[#e7e8ea]">
                  <span className="material-symbols-outlined text-[24px] text-[#076a64]">
                    fingerprint
                  </span>
                  <h4 className="text-xs font-bold text-[#001637] mt-2">NADRA Biometric KYC</h4>
                  <p className="text-[11px] text-[#75777f] mt-1">Verified on 12 Jan 2026</p>
                  <span className="inline-block mt-3 px-2 py-0.5 bg-[#a1f1e9] text-[#076a64] text-[10px] font-bold rounded">
                    Verified
                  </span>
                </div>

                <div className="p-4 bg-[#f2f4f6] rounded-xl border border-[#e7e8ea]">
                  <span className="material-symbols-outlined text-[24px] text-[#076a64]">
                    gavel
                  </span>
                  <h4 className="text-xs font-bold text-[#001637] mt-2">Legal Stamp Tenancy Deed</h4>
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
                  <p className="text-[11px] text-[#75777f] mt-1">PKR 760,000 Insured</p>
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
