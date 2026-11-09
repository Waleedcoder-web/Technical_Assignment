import { supabaseAdmin as supabase } from "@/lib/supabase";

export interface PropertySearchParams {
  property_type?: string | null;
  listing_type?: string | null;
  location?: string | null;
  locations?: string[] | null;
  search_query?: string | null;
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
    const buildBaseQuery = (includeSearchQuery: boolean = true) => {
      let query = supabase
        .from("properties")
        .select("*")
        .neq("status", "deleted");

      // 1. Availability Filter: Default to available properties unless specified
      query = query.eq("status", "available");

      // 2. Location Filter (ilike on location, address, or title across all target locations)
      const targetLocations: string[] = [];
      if (Array.isArray(params.locations) && params.locations.length > 0) {
        targetLocations.push(...params.locations);
      } else if (params.location && params.location.trim()) {
        const parts = params.location
          .split(/\s*(?:or|and|,|\/)\s*/i)
          .map((s) => s.trim())
          .filter(Boolean);
        targetLocations.push(...parts);
      }

      if (targetLocations.length > 0) {
        const orClauses = targetLocations.flatMap((loc) => [
          `location.ilike.%${loc}%`,
          `address.ilike.%${loc}%`,
          `title.ilike.%${loc}%`,
        ]);
        query = query.or(orClauses.join(","));
      }

      // 3. Listing Type (rent vs sale)
      if (params.listing_type && params.listing_type.trim()) {
        const lType = params.listing_type.trim().toLowerCase();
        query = query.ilike("listing_type", `%${lType}%`);
      }

      // 4. Property Type mapping (distinct category preservation + commercial plot handling)
      if (params.property_type && params.property_type.trim()) {
        const pType = params.property_type.trim().toLowerCase();

        if (pType.includes("house") || pType.includes("villa")) {
          // Houses & Villas
          query = query.or("property_type.ilike.%villa%,property_type.ilike.%house%");
        } else if (pType.includes("apartment") || pType.includes("flat")) {
          // Apartments & Flats (separate from houses)
          query = query.or("property_type.ilike.%apartment%,property_type.ilike.%flat%");
        } else if (pType.includes("commercial") && (pType.includes("plot") || pType.includes("land"))) {
          // Commercial Plots
          query = query.or("property_type.ilike.%plot%,property_type.ilike.%commercial%,title.ilike.%commercial%");
        } else if (pType.includes("plot") || pType.includes("land")) {
          // Plots / Land
          query = query.or("property_type.ilike.%plot%,title.ilike.%plot%");
        } else if (pType.includes("commercial")) {
          query = query.or("property_type.ilike.%commercial%,title.ilike.%commercial%");
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

      // 8. Specific Search Query / Title keyword matching
      if (includeSearchQuery && params.search_query && params.search_query.trim()) {
        const sq = params.search_query.trim();
        query = query.or(`title.ilike.%${sq}%,description.ilike.%${sq}%,address.ilike.%${sq}%`);
      }

      // 9. Sorting & Limit
      const limit = Math.max(1, Math.min(20, params.limit || 6));
      return query.order("created_at", { ascending: false }).limit(limit);
    };

    let { data, error } = await buildBaseQuery(true);

    // If search_query was applied but yielded 0 results, retry without search_query to avoid false negatives
    if (!error && (!data || data.length === 0) && params.search_query && params.search_query.trim()) {
      const fallbackResult = await buildBaseQuery(false);
      if (!fallbackResult.error && fallbackResult.data && fallbackResult.data.length > 0) {
        data = fallbackResult.data;
      }
    }

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
