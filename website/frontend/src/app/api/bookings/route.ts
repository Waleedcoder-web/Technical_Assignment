import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") || searchParams.get("user_id");
    const email = searchParams.get("email") || searchParams.get("user_email");
    const propertyId = searchParams.get("propertyId") || searchParams.get("property_id");

    let query = supabaseAdmin.from("bookings").select("*").order("created_at", { ascending: false });

    if (propertyId) {
      query = query.eq("property_id", propertyId);
    }

    if (userId) {
      query = query.eq("user_id", userId);
    } else if (email) {
      query = query.eq("user_email", email.trim().toLowerCase());
    }

    const { data: bookings, error } = await query;
    if (error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 400 });
    }

    return NextResponse.json(
      {
        success: true,
        count: bookings?.length || 0,
        data: bookings || [],
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: `Failed to fetch bookings: ${err.message}` },
      { status: 500 }
    );
  }
}
