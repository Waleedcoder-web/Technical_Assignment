import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category") || searchParams.get("property_type");
    const city = searchParams.get("city") || searchParams.get("location");
    const type = searchParams.get("type") || searchParams.get("listing_type");
    const search = searchParams.get("search");
    const limit = searchParams.get("limit");
    const ownerId = searchParams.get("ownerId") || searchParams.get("owner_id") || searchParams.get("userId") || searchParams.get("user_id");

    let query = supabaseAdmin.from("properties").select("*").order("created_at", { ascending: false });

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (ownerId && isUuid.test(ownerId)) {
      query = query.eq("owner_id", ownerId);
    }

    if (category && category !== "all") {
      query = query.ilike("property_type", `%${category}%`);
    }
    if (city && city !== "all") {
      query = query.ilike("location", `%${city}%`);
    }
    if (type && type !== "all") {
      query = query.ilike("listing_type", `%${type}%`);
    }
    if (search && search.trim()) {
      const q = search.trim();
      query = query.or(`title.ilike.%${q}%,location.ilike.%${q}%,address.ilike.%${q}%,description.ilike.%${q}%`);
    }
    if (limit && Number(limit) > 0) {
      query = query.limit(Number(limit));
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 400 });
    }

    const properties = (data || []).map((p: any) => ({
      ...p,
      // Compatibility aliases
      category: p.property_type || "villas",
      transactionType: p.listing_type || "rent",
      priceFormatted: `PKR ${Number(p.price || 0).toLocaleString()}`,
      pricePeriod: p.listing_type === "sale" ? undefined : "/ mo",
      beds: p.bedroom ?? 4,
      baths: p.bathroom ?? 4,
      size: `${p.area_value || 10} ${p.area_unit || "Marla"}`,
      city: (p.location || "Lahore").split(",")[0].trim(),
      verified: true,
      imageUrl: (p.images && p.images[0]) || p.image_url || "",
    }));

    return NextResponse.json(
      {
        success: true,
        count: properties.length,
        data: properties,
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
      { success: false, message: `Failed to fetch properties: ${err.message}` },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      title,
      description,
      property_type,
      category,
      listing_type,
      transactionType,
      price,
      area_value,
      area_unit,
      bedroom,
      bathroom,
      location,
      address,
      status,
      image_url,
      imageUrl,
      images,
      owner_id,
    } = body;

    if (!title || !price || !location) {
      return NextResponse.json(
        { success: false, message: "Title, price, and location are required." },
        { status: 400 }
      );
    }

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    let resolvedOwnerId = isUuid.test(owner_id || "") ? owner_id : null;

    // Enforce admin permission: Normal users cannot add properties
    if (resolvedOwnerId) {
      const { data: callerUser } = await supabaseAdmin
        .from("users")
        .select("id, role, email")
        .eq("id", resolvedOwnerId)
        .maybeSingle();

      if (callerUser && callerUser.role !== "admin" && !callerUser.email?.toLowerCase().includes("admin")) {
        return NextResponse.json(
          { success: false, message: "Unauthorized: Only administrators are permitted to add or publish property listings." },
          { status: 403 }
        );
      }
    }

    if (!resolvedOwnerId) {
      const { data: adminUser } = await supabaseAdmin
        .from("users")
        .select("id")
        .or("role.eq.admin,email.eq.admin@havenkey.pk,email.eq.admin@gmail.com")
        .limit(1)
        .maybeSingle();

      if (adminUser?.id) {
        resolvedOwnerId = adminUser.id;
      }
    }


    const imageList = Array.isArray(images) && images.length > 0 ? images : [image_url || imageUrl || ""].filter(Boolean);

    const newPropPayload = {
      owner_id: resolvedOwnerId,
      title: title.trim(),
      description: (description || "").trim(),
      property_type: property_type || category || "villas",
      listing_type: listing_type || transactionType || "rent",
      price: Number(price),
      area_value: Number(area_value || 10),
      area_unit: area_unit || "Marla",
      bedroom: Number(bedroom || 4),
      bathroom: Number(bathroom || 4),
      location: location.trim(),
      address: (address || location).trim(),
      status: status || "available",
      image_url: imageList[0] || "",
      images: imageList,
    };

    const { data, error } = await supabaseAdmin.from("properties").insert([newPropPayload]).select().single();

    if (error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: "Property created and listed successfully in Supabase",
      data,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: `Failed to create property: ${err.message}` },
      { status: 500 }
    );
  }
}
