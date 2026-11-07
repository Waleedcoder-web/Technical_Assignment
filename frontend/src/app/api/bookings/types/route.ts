import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export interface BookingType {
  id?: number;
  type_name: string;
  slug: string;
  description: string;
  icon?: string;
}

const DEFAULT_BOOKING_TYPES: BookingType[] = [
  {
    type_name: "In-Person Private Viewing",
    slug: "in_person",
    description: "Walk through the property on-site with a verified HavenKey agent or owner.",
    icon: "person",
  },
  {
    type_name: "Live Video Tour",
    slug: "video_tour",
    description: "Virtual guided interactive walkthrough via video call.",
    icon: "videocam",
  },
  {
    type_name: "Technical Property Inspection",
    slug: "inspection",
    description: "Comprehensive inspection of structure, plumbing, electrical, and HVAC.",
    icon: "engineering",
  },
];

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("booking_types")
      .select("*")
      .order("id", { ascending: true });

    if (!error && data && data.length > 0) {
      return NextResponse.json({
        success: true,
        types: data,
        source: "database",
      });
    }

    return NextResponse.json({
      success: true,
      types: DEFAULT_BOOKING_TYPES,
      source: "catalog",
    });
  } catch (err: any) {
    return NextResponse.json({
      success: true,
      types: DEFAULT_BOOKING_TYPES,
      source: "fallback",
    });
  }
}
