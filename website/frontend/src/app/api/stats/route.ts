import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // 1. Fetch real properties
    const { data: properties, error: propErr } = await supabaseAdmin
      .from("properties")
      .select("id, title, property_type, listing_type, price, status");

    // 2. Fetch real complaints
    const { data: complaints, error: compErr } = await supabaseAdmin
      .from("complaints")
      .select("id, status");

    // 3. Fetch real users
    const { data: users, error: userErr } = await supabaseAdmin
      .from("users")
      .select("id, role");


    const props = properties || [];
    const comps = complaints || [];
    const usrs = users || [];

    const totalProperties = props.length;
    const rentProperties = props.filter((p) => (p.listing_type || "").toLowerCase() === "rent").length;
    const saleProperties = props.filter((p) => (p.listing_type || "").toLowerCase() === "sale").length;

    // Categories breakdown
    const housesCount = props.filter((p) => {
      const t = (p.property_type || "").toLowerCase();
      return t.includes("villa") || t.includes("house") || t.includes("home");
    }).length;

    const apartmentsCount = props.filter((p) => {
      const t = (p.property_type || "").toLowerCase();
      return t.includes("apartment");
    }).length;

    const flatsCount = props.filter((p) => {
      const t = (p.property_type || "").toLowerCase();
      return t.includes("flat");
    }).length;

    const plotsCount = props.filter((p) => {
      const t = (p.property_type || "").toLowerCase();
      return t.includes("plot");
    }).length;

    // Escrow / volume
    const totalVolume = props.reduce((acc, p) => acc + (Number(p.price) || 0), 0);

    // Complaints breakdown
    const totalComplaints = comps.length;
    const pendingComplaints = comps.filter(
      (c) => c.status === "pending" || c.status === "in_progress" || c.status === "technician_assigned"
    ).length;
    const resolvedComplaints = comps.filter(
      (c) => c.status === "resolved" || c.status === "completed"
    ).length;

    // Users breakdown
    const totalUsers = usrs.length;
    const verifiedLandlords = usrs.filter(
      (u) => (u.role === "landlord" || u.role === "owner" || u.role === "admin")
    ).length;

    return NextResponse.json({
      success: true,
      data: {
        totalProperties,
        rentProperties,
        saleProperties,
        categories: {
          houses: housesCount,
          apartments: apartmentsCount,
          flats: flatsCount,
          plots: plotsCount,
        },
        escrow: {
          totalVolume,
          formatted: totalVolume > 1_000_000
            ? `PKR ${(totalVolume / 1_000_000).toFixed(1)}M`
            : `PKR ${totalVolume.toLocaleString()}`,
        },
        complaints: {
          total: totalComplaints,
          pending: pendingComplaints,
          resolved: resolvedComplaints,
        },
        users: {
          total: totalUsers,
          landlords: verifiedLandlords || totalUsers,
        },
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: `Failed to compute stats: ${err.message}` },
      { status: 500 }
    );
  }
}
