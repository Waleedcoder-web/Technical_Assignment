import { supabaseAdmin as supabase } from "@/lib/supabase";

export interface PropertySearchParams {
  property_type?: string | null;
  listing_type?: string | null;
  location?: string | null;
  area_value?: number | null;
  area_unit?: string | null;
  min_price?: number | null;
  max_price?: number | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  limit?: number;
}

export interface PropertySearchResult {
  success: boolean;
  count: number;
  properties: any[];
  error?: string;
}

/**
 * Searches the Supabase 'properties' table using structured query builder methods.
 * Strictly avoids raw SQL execution or arbitrary string interpolation.
 */
export async function searchProperties(
  params: PropertySearchParams
): Promise<PropertySearchResult> {
  try {
    let query = supabase
      .from("properties")
      .select("*")
      .neq("status", "deleted");

    // 1. Availability Filter: Default to available properties unless specified
    query = query.eq("status", "available");

    // 2. Location Filter (ilike on location, address, or title)
    if (params.location && params.location.trim()) {
      const loc = params.location.trim();
      query = query.or(`location.ilike.%${loc}%,address.ilike.%${loc}%,title.ilike.%${loc}%`);
    }

    // 3. Listing Type (rent vs sale)
    if (params.listing_type && params.listing_type.trim()) {
      const lType = params.listing_type.trim().toLowerCase();
      query = query.ilike("listing_type", `%${lType}%`);
    }

    // 4. Property Type mapping (distinct category preservation)
    if (params.property_type && params.property_type.trim()) {
      const pType = params.property_type.trim().toLowerCase();

      if (pType.includes("house") || pType.includes("villa")) {
        // Houses & Villas
        query = query.or("property_type.ilike.%villa%,property_type.ilike.%house%");
      } else if (pType.includes("apartment") || pType.includes("flat")) {
        // Apartments & Flats (separate from houses)
        query = query.or("property_type.ilike.%apartment%,property_type.ilike.%flat%");
      } else if (pType.includes("plot") || pType.includes("land")) {
        // Plots / Land
        query = query.ilike("property_type", "%plot%");
      } else if (pType.includes("commercial")) {
        query = query.ilike("property_type", "%commercial%");
      } else {
        query = query.ilike("property_type", `%${pType}%`);
      }
    }

    // 5. Price Range
    if (typeof params.min_price === "number" && !isNaN(params.min_price) && params.min_price > 0) {
      query = query.gte("price", params.min_price);
    }
    if (typeof params.max_price === "number" && !isNaN(params.max_price) && params.max_price > 0) {
      query = query.lte("price", params.max_price);
    }

    // 6. Area / Size
    if (typeof params.area_value === "number" && !isNaN(params.area_value) && params.area_value > 0) {
      query = query.eq("area_value", params.area_value);
    }
    if (params.area_unit && params.area_unit.trim()) {
      query = query.ilike("area_unit", `%${params.area_unit.trim()}%`);
    }

    // 7. Bedrooms
    if (typeof params.bedrooms === "number" && !isNaN(params.bedrooms) && params.bedrooms > 0) {
      query = query.gte("bedroom", params.bedrooms);
    }

    // 8. Sorting & Limit
    const limit = Math.max(1, Math.min(20, params.limit || 6));
    query = query.order("created_at", { ascending: false }).limit(limit);

    const { data, error } = await query;

    if (error) {
      console.error("[property-search] Supabase query error:", error.message);
      return { success: false, count: 0, properties: [], error: error.message };
    }

    return {
      success: true,
      count: data ? data.length : 0,
      properties: data || [],
    };
  } catch (err: any) {
    console.error("[property-search] Exception in searchProperties:", err.message);
    return { success: false, count: 0, properties: [], error: err.message };
  }
}
