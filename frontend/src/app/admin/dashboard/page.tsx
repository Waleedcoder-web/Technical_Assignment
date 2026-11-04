"use client";

import { useState } from "react";
import Link from "next/link";
import { mockAdminStats, mockKycQueue } from "@/lib/mock-data";

export default function AdminDashboardPage() {
  const [kycList, setKycList] = useState(mockKycQueue);
  const [approvedCount, setApprovedCount] = useState(0);

  const handleApprove = (id: string) => {
    setKycList((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status: "Verified & Live" } : item
      )
    );
    setApprovedCount((c) => c + 1);
  };

  const handleReject = (id: string) => {
    setKycList((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status: "Rejected - Incomplete Title" } : item
      )
    );
  };

  return (
    <div className="min-h-screen bg-[#f8f9fb] flex flex-col font-inter">
      {/* Admin Top Header */}
      <header className="h-20 bg-[#001637] text-white px-6 lg:px-12 flex items-center justify-between border-b border-[#172b4d]">
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
            href="/"
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
        {/* Page Title & Subtitle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#e7e8ea] gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider font-bold text-[#076a64]">
                Operations Telemetry
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#001637] font-plus-jakarta mt-1">
              Admin Operations &amp; Verification Console
            </h1>
            <p className="text-xs text-[#44474e] mt-0.5">
              Monitor active Pakistani real estate assets, landlord biometric KYC verifications, and escrow transactions.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => alert("Exporting Regulatory Compliance Audit (CSV)...")}
              className="px-4 py-2 bg-white border border-[#e7e8ea] text-[#001637] text-xs font-semibold rounded-lg hover:bg-[#edeef0] transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <span className="material-symbols-outlined text-[16px]">download</span>
              Export Compliance CSV
            </button>
          </div>
        </div>

        {/* 6 Core Metric KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
          <div className="bg-white p-4 rounded-xl border border-[#e7e8ea] shadow-xs">
            <span className="text-[11px] text-[#75777f] uppercase font-semibold">Active Listings</span>
            <p className="text-xl font-bold text-[#001637] font-plus-jakarta mt-1">
              {mockAdminStats.activeProperties}
            </p>
            <span className="text-[10px] text-[#10b981] font-semibold flex items-center gap-0.5 mt-1">
              <span className="material-symbols-outlined text-[12px]">trending_up</span> +8.4% this mo
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
              {mockAdminStats.pendingApprovals}
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
            <span className="text-[11px] text-[#75777f] uppercase font-semibold">Occupancy Rate</span>
            <p className="text-xl font-bold text-[#076a64] font-plus-jakarta mt-1">
              {mockAdminStats.occupancyRate}
            </p>
            <span className="text-[10px] text-[#44474e] font-semibold flex items-center gap-0.5 mt-1">
              Top: Clifton &amp; DHA 6
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

        {/* Landlord KYC Verification Queue Table */}
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
                    <td className="py-4 px-4 font-mono font-semibold text-[#001637]">
                      {item.id}
                    </td>
                    <td className="py-4 px-4 font-bold text-[#001637]">
                      {item.landlord}
                      <span className="block text-[10px] text-[#75777f] font-normal">
                        Submitted {item.submittedAt}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-[#44474e] max-w-xs truncate">
                      {item.property}
                    </td>
                    <td className="py-4 px-4 text-[#001637] font-medium">
                      <span className="inline-flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px] text-[#076a64]">
                          task
                        </span>
                        {item.documentType}
                      </span>
                    </td>
                    <td className="py-4 px-4 font-bold text-[#076a64]">
                      {item.trustScore}
                    </td>
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
                            onClick={() => handleApprove(item.id)}
                            className="px-2.5 py-1 bg-[#076a64] hover:bg-[#00201e] text-white rounded text-[11px] font-semibold transition-colors"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => handleReject(item.id)}
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

        {/* Platform Compliance & Escrow Health Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
      </main>
    </div>
  );
}
