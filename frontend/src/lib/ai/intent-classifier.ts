import { PropertySearchParams } from "./property-search";

export type AIIntent = "COMPANY_INFO" | "PROPERTY_SEARCH" | "BOTH" | "UNKNOWN";

export interface IntentClassificationResult {
  intent: AIIntent;
  confidence: number;
  companyQuery?: string;
  propertyQuery?: string;
  propertyParams?: PropertySearchParams;
  requiresClarification?: boolean;
  clarificationMessage?: string;
  isSecurityViolation?: boolean;
  rejectionMessage?: string;
}

/**
 * Common Pakistani cities, areas, and major societies for location extraction
 */
const KNOWN_LOCATIONS = [
  "sialkot",
  "lahore",
  "islamabad",
  "karachi",
  "rawalpindi",
  "faisalabad",
  "multan",
  "peshawar",
  "gujranwala",
  "quetta",
  "dha",
  "bahria",
  "cantt",
  "gulberg",
  "johar town",
  "model town",
  "f-6",
  "f-7",
  "f-8",
  "f-10",
  "f-11",
  "g-11",
  "i-8",
  "clifton",
  "defence",
];

/**
 * Extracts Pakistani currency values into numeric numbers (PKR):
 * - "50 lakh" -> 5,000,000
 * - "1.5 crore" -> 15,000,000
 * - "250k" -> 250,000
 */
function parsePrice(text: string): { minPrice: number | null; maxPrice: number | null } {
  let minPrice: number | null = null;
  let maxPrice: number | null = null;

  // Regex for "under 50 lakh", "below 50 lac", "upto 50 lakh", "max 50 lakh", "less than 50 lakh"
  const underMatch = text.match(
    /(?:under|below|upto|up to|max|maximum|less than|within)\s*(?:pkr|rs\.?)?\s*([\d\.]+)\s*(lakh|lac|crore|k|million)?/i
  );
  if (underMatch) {
    const val = parseFloat(underMatch[1]);
    const unit = (underMatch[2] || "").toLowerCase();
    if (!isNaN(val)) {
      if (unit.startsWith("la")) {
        maxPrice = val * 100000;
      } else if (unit === "crore") {
        maxPrice = val * 10000000;
      } else if (unit === "million") {
        maxPrice = val * 1000000;
      } else if (unit === "k") {
        maxPrice = val * 1000;
      } else if (val < 1000) {
        // assume lakh if number is small (e.g. "under 50")
        maxPrice = val * 100000;
      } else {
        maxPrice = val;
      }
    }
  }

  // Regex for "above 20 lakh", "min 20 lakh", "more than 20 lakh"
  const aboveMatch = text.match(
    /(?:above|over|more than|minimum|min|at least)\s*(?:pkr|rs\.?)?\s*([\d\.]+)\s*(lakh|lac|crore|k|million)?/i
  );
  if (aboveMatch) {
    const val = parseFloat(aboveMatch[1]);
    const unit = (aboveMatch[2] || "").toLowerCase();
    if (!isNaN(val)) {
      if (unit.startsWith("la")) {
        minPrice = val * 100000;
      } else if (unit === "crore") {
        minPrice = val * 10000000;
      } else if (unit === "k") {
        minPrice = val * 1000;
      } else {
        minPrice = val;
      }
    }
  }

  return { minPrice, maxPrice };
}

/**
 * Extracts area values and Pakistani units (Marla, Kanal, Sq. Ft.)
 */
function parseArea(text: string): { areaValue: number | null; areaUnit: string | null } {
  const match = text.match(/(\d+(?:\.\d+)?)\s*(marla|kanal|sq\.?\s*ft|square\s*feet|sqft)/i);
  if (match) {
    const val = parseFloat(match[1]);
    const u = match[2].toLowerCase();
    let unit = "Marla";
    if (u.includes("kanal")) unit = "Kanal";
    else if (u.includes("sq")) unit = "Sq Ft";
    return { areaValue: isNaN(val) ? null : val, areaUnit: unit };
  }
  return { areaValue: null, areaUnit: null };
}

/**
 * Classifies user intent and extracts validated property search parameters.
 */
export function classifyAndExtract(query: string): IntentClassificationResult {
  const qClean = query.trim();
  const qLower = qClean.toLowerCase();

  // 1. Security Guardrail: Reject password dumping, auth token probes, database dumping
  const securityRegex =
    /(?:password|passwords|credential|credentials|secret|secret key|service role|users table|drop table|select \* from|dump database|database records|admin password)/i;
  if (securityRegex.test(qLower)) {
    return {
      intent: "UNKNOWN",
      confidence: 1.0,
      isSecurityViolation: true,
      rejectionMessage:
        "This request is unauthorized. HavenKey strictly protects internal system records, confidential user data, and credentials.",
    };
  }

  // 2. Indicators for Company Policies / Procedures (RAG domain)
  const companyIndicators =
    /(?:policy|procedure|rules|responsibilities|duty|duties|terms|complaint|escrow|refund|dispute|agreement|contract|register|registration|how (?:does|can|do) havenkey|services (?:does|provide)|about havenkey)/i;

  // 3. Indicators for Real Estate Property Search (Supabase DB domain)
  const propertySearchIndicators =
    /(?:show|find|search|browse|available|looking for|need|house|houses|villa|villas|apartment|apartments|flat|flats|plot|plots|commercial|rent|rental|for rent|sale|for sale|buy|purchase|marla|kanal|bed|bedroom|in sialkot|in lahore|in islamabad|in karachi|under \d+|price)/i;

  const hasCompany = companyIndicators.test(qLower);
  const hasProperty = propertySearchIndicators.test(qLower);

  // 4. Handle Compound Intent (BOTH)
  if (hasCompany && hasProperty) {
    // Split into company query and property query using coordinating conjunctions
    const parts = qClean.split(/\s+(?:and|as well as|also)\s+/i);
    let companyQuery = qClean;
    let propertyQuery = qClean;

    if (parts.length >= 2) {
      if (companyIndicators.test(parts[0].toLowerCase())) {
        companyQuery = parts[0];
        propertyQuery = parts.slice(1).join(" and ");
      } else {
        propertyQuery = parts[0];
        companyQuery = parts.slice(1).join(" and ");
      }
    }

    const { params, requiresClarification, clarificationMessage } = extractPropertyParameters(propertyQuery);

    return {
      intent: "BOTH",
      confidence: 0.95,
      companyQuery,
      propertyQuery,
      propertyParams: params,
      requiresClarification,
      clarificationMessage,
    };
  }

  // 5. Handle Single Intent: PROPERTY_SEARCH
  if (hasProperty && !hasCompany) {
    const { params, requiresClarification, clarificationMessage } = extractPropertyParameters(qClean);

    return {
      intent: "PROPERTY_SEARCH",
      confidence: 0.95,
      propertyQuery: qClean,
      propertyParams: params,
      requiresClarification,
      clarificationMessage,
    };
  }

  // 6. Handle Single Intent: COMPANY_INFO
  if (hasCompany && !hasProperty) {
    return {
      intent: "COMPANY_INFO",
      confidence: 0.95,
      companyQuery: qClean,
    };
  }

  // 7. General / Unrelated Fallback (UNKNOWN)
  return {
    intent: "UNKNOWN",
    confidence: 0.5,
  };
}

/**
 * Extracts validated parameters from a property search query string.
 * Strictly adheres to rule 1: Never assumes Sialkot or any default location when unspecified.
 */
export function extractPropertyParameters(query: string): {
  params: PropertySearchParams;
  requiresClarification: boolean;
  clarificationMessage?: string;
} {
  const qLower = query.toLowerCase();

  // Location extraction
  let detectedLocation: string | null = null;
  for (const loc of KNOWN_LOCATIONS) {
    const regex = new RegExp(`\\b${loc}\\b`, "i");
    if (regex.test(qLower)) {
      detectedLocation = loc.charAt(0).toUpperCase() + loc.slice(1);
      break;
    }
  }

  // Prepositional location pattern: "in <City>", "near <City>", "at <City>"
  if (!detectedLocation) {
    const prepMatch = query.match(/\b(?:in|at|near|around)\s+([A-Za-z]{3,25})\b/i);
    if (prepMatch && !/^(the|a|an|pkr|rs|rent|sale|marla|kanal|bed|budget|price)$/i.test(prepMatch[1])) {
      detectedLocation = prepMatch[1].charAt(0).toUpperCase() + prepMatch[1].slice(1).toLowerCase();
    }
  }

  // Property Type extraction (preserves distinct categories)
  let detectedPropertyType: string | null = null;
  if (/\b(house|houses|villa|villas)\b/i.test(qLower)) {
    detectedPropertyType = "villas"; // maps to houses & villas category
  } else if (/\b(apartment|apartments|flat|flats)\b/i.test(qLower)) {
    detectedPropertyType = "apartments";
  } else if (/\b(plot|plots|land)\b/i.test(qLower)) {
    detectedPropertyType = "plots";
  } else if (/\b(commercial|office|shop)\b/i.test(qLower)) {
    detectedPropertyType = "commercial";
  }

  // Listing Type extraction (rent vs sale)
  let detectedListingType: string | null = null;
  if (/\b(rent|rental|for rent|to rent)\b/i.test(qLower)) {
    detectedListingType = "rent";
  } else if (/\b(sale|for sale|buy|purchase)\b/i.test(qLower)) {
    detectedListingType = "sale";
  }

  // Price extraction
  const { minPrice, maxPrice } = parsePrice(qLower);

  // Area extraction
  const { areaValue, areaUnit } = parseArea(qLower);

  // Bedroom extraction (e.g. "3 bed", "3 bedroom", "4 beds")
  let bedrooms: number | null = null;
  const bedMatch = qLower.match(/(\d+)\s*(?:bed|bedroom|beds|bhk)/i);
  if (bedMatch) {
    const b = parseInt(bedMatch[1], 10);
    if (!isNaN(b)) bedrooms = b;
  }

  // Rule 1 Enforcement: If location is missing from search query, ask clarification question
  if (!detectedLocation) {
    return {
      params: {
        property_type: detectedPropertyType,
        listing_type: detectedListingType,
        location: null,
        area_value: areaValue,
        area_unit: areaUnit,
        min_price: minPrice,
        max_price: maxPrice,
        bedrooms,
      },
      requiresClarification: true,
      clarificationMessage: "Which city or location are you looking for?",
    };
  }

  return {
    params: {
      property_type: detectedPropertyType,
      listing_type: detectedListingType,
      location: detectedLocation,
      area_value: areaValue,
      area_unit: areaUnit,
      min_price: minPrice,
      max_price: maxPrice,
      bedrooms,
    },
    requiresClarification: false,
  };
}
