import { PropertySearchParams } from "./property-search";

export type AIIntent =
  | "GREETING"
  | "GENERAL_CONVERSATION"
  | "COMPANY_INFO"
  | "PROPERTY_SEARCH"
  | "BOTH"
  | "UNKNOWN";

export interface IntentClassificationResult {
  intent: AIIntent;
  confidence: number;
  conversationalResponse?: string;
  companyQuery?: string;
  propertyQuery?: string;
  propertyParams?: PropertySearchParams;
  requiresClarification?: boolean;
  clarificationMessage?: string;
  isSecurityViolation?: boolean;
  rejectionMessage?: string;
}

/**
 * Generates immediate conversational responses for greetings and polite interactions
 */
export function getConversationalReply(query: string, intent: AIIntent): string {
  const qLower = query.toLowerCase().trim();

  if (intent === "GREETING") {
    if (/\b(?:salam|assalam|aoa)\b/i.test(qLower)) {
      return "Walaikum Assalam! Welcome to HavenKey. How can I help you today? You can ask me about our services or search for properties.";
    }
    return "Hello! Welcome to HavenKey. How can I help you today? You can ask me about our services or search for properties.";
  }

  if (intent === "GENERAL_CONVERSATION") {
    // "how are you" / "hello, how are you?"
    if (
      /\b(?:how\s+(?:are|r)\s+(?:you|u)|how(?:'s|\s+is)\s+it\s+going|how\s+are\s+things|how\s+have\s+you\s+been)\b/i.test(
        qLower
      )
    ) {
      return "I'm doing well, thank you! How can I assist you with HavenKey properties or services today?";
    }

    // "thank you" / "thanks"
    if (/\b(?:thank\s+you|thanks|thankyou|thx|ty|many\s+thanks|thanks\s+a\s+lot|thank\s+you\s+so\s+much)\b/i.test(qLower)) {
      return "You're very welcome! If you have any questions about properties or HavenKey services, feel free to ask.";
    }

    // "what can you do?" / "who are you?" / "help"
    if (
      /\b(?:what\s+can\s+you\s+do|who\s+are\s+you|what\s+are\s+you|how\s+can\s+you\s+help|what\s+do\s+you\s+do|what\s+is\s+your\s+purpose|help\s+me)\b/i.test(
        qLower
      )
    ) {
      return "I can help you search for verified properties (houses, apartments, plots, commercial) across Pakistan, filter by location and budget, and answer questions about HavenKey company policies, tenancy escrow, and agreements.";
    }

    // "goodbye" / "bye"
    if (/\b(?:goodbye|bye\s+bye|bye|see\s+you|take\s+care|have\s+a\s+nice\s+day|have\s+a\s+good\s+day)\b/i.test(qLower)) {
      return "Goodbye! Have a great day, and feel free to return whenever you need assistance with HavenKey.";
    }

    // generic conversational acknowledgement (ok, great, cool)
    if (/^(?:ok|okay|cool|great|awesome|understood|got\s+it|nice|perfect|sure|yes|no)[!.\s]*$/i.test(qLower)) {
      return "Great! Let me know if there's anything else I can help you with regarding HavenKey listings or policies.";
    }

    return "I'm here to help! Feel free to ask about HavenKey's services, rental policies, or search for properties across Pakistan.";
  }

  return "";
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

  // Standalone price or budget: "50 lakh", "50 lac", "1 crore", "budget 50 lakh"
  if (maxPrice === null && minPrice === null) {
    const standaloneMatch = text.match(
      /(?:budget\s*(?:is|of)?\s*)?(?:pkr|rs\.?)?\s*([\d\.]+)\s*(lakh|lac|crore|k|million)\b/i
    );
    if (standaloneMatch) {
      const val = parseFloat(standaloneMatch[1]);
      const unit = (standaloneMatch[2] || "").toLowerCase();
      if (!isNaN(val)) {
        if (unit.startsWith("la")) {
          maxPrice = val * 100000;
        } else if (unit === "crore") {
          maxPrice = val * 10000000;
        } else if (unit === "million") {
          maxPrice = val * 1000000;
        } else if (unit === "k") {
          maxPrice = val * 1000;
        }
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
 * Extracts raw, unvalidated property parameters from any query or follow-up snippet.
 */
export function extractRawParameters(query: string): {
  detectedLocation: string | null;
  detectedPropertyType: string | null;
  detectedListingType: string | null;
  minPrice: number | null;
  maxPrice: number | null;
  areaValue: number | null;
  areaUnit: string | null;
  bedrooms: number | null;
  hasAnyAttribute: boolean;
} {
  const qClean = query.trim();
  const qLower = qClean.toLowerCase();

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
    const prepMatch = qClean.match(/\b(?:in|at|near|around)\s+([A-Za-z]{3,25})\b/i);
    if (prepMatch && !/^(the|a|an|pkr|rs|rent|sale|marla|kanal|bed|budget|price)$/i.test(prepMatch[1])) {
      detectedLocation = prepMatch[1].charAt(0).toUpperCase() + prepMatch[1].slice(1).toLowerCase();
    }
  }

  // Standalone word fallback for location (e.g. user simply replies "Sialkot", "Lahore", "Islamabad")
  if (!detectedLocation && /^[a-zA-Z]{3,20}[.!?]?$/.test(qClean)) {
    const word = qClean.replace(/[.!?]/g, "").trim();
    if (!/^(yes|no|hi|hello|hey|help|bye|thanks|sure|ok|okay|what|when|why|where|how)$/i.test(word)) {
      detectedLocation = word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    }
  }

  // Property Type extraction (preserves distinct categories)
  let detectedPropertyType: string | null = null;
  if (/\b(house|houses|villa|villas)\b/i.test(qLower)) {
    detectedPropertyType = "villas";
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

  // Bedroom extraction
  let bedrooms: number | null = null;
  const bedMatch = qLower.match(/(\d+)\s*(?:bed|bedroom|beds|bhk)/i);
  if (bedMatch) {
    const b = parseInt(bedMatch[1], 10);
    if (!isNaN(b)) bedrooms = b;
  }

  const hasAnyAttribute = Boolean(
    detectedLocation ||
    detectedPropertyType ||
    detectedListingType ||
    minPrice !== null ||
    maxPrice !== null ||
    areaValue !== null ||
    bedrooms !== null
  );

  return {
    detectedLocation,
    detectedPropertyType,
    detectedListingType,
    minPrice,
    maxPrice,
    areaValue,
    areaUnit,
    bedrooms,
    hasAnyAttribute,
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
  const raw = extractRawParameters(query);

  const params: PropertySearchParams = {
    property_type: raw.detectedPropertyType,
    listing_type: raw.detectedListingType,
    location: raw.detectedLocation,
    area_value: raw.areaValue,
    area_unit: raw.areaUnit,
    min_price: raw.minPrice,
    max_price: raw.maxPrice,
    bedrooms: raw.bedrooms,
  };

  if (!raw.detectedLocation) {
    return {
      params,
      requiresClarification: true,
      clarificationMessage: "Which city or location are you looking for?",
    };
  }

  return {
    params,
    requiresClarification: false,
  };
}

/**
 * Classifies user intent and extracts validated property search parameters.
 * Supports multi-turn conversation context by merging pendingSearchParams when present.
 */
export function classifyAndExtract(
  query: string,
  pendingContext?: PropertySearchParams | null
): IntentClassificationResult {
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

  // 2. Cancellation Check: Explicit request to cancel/clear ongoing property search
  if (/^(?:cancel|cancel search|stop|never mind|nevermind|forget it|clear search)[!.\s]*$/i.test(qLower)) {
    return {
      intent: "GENERAL_CONVERSATION",
      confidence: 1.0,
      conversationalResponse:
        "Property search cancelled. How else can I help you today? You can ask about our company policies or start a new search.",
    };
  }

  // 3. Indicators for Company Policies / Procedures (RAG domain)
  const companyIndicators =
    /(?:policy|policies|procedure|procedures|rules?|responsibilit(?:y|ies)|dut(?:y|ies)|terms?|complaints?|escrow|refunds?|disputes?|agreements?|contracts?|regulat(?:ion|ions)|register|registration|conduct|disclaimer|management|tenants?|landlords?|guarantee|deeds?|deposits?|fees?|commissions?|verification|inspection|how (?:does|can|do) havenkey|(?:what|about|your|havenkey's?)\s+services|services (?:does|provide|offered|available)|tell me about (?:havenkey|your services|the company)|\babout havenkey\b|\bhavenkey\b)/i;

  // 4. Indicators for Real Estate Property Search (Supabase DB domain)
  const propertySearchIndicators =
    /\b(?:show|find|search|browse|available|looking\s+for|need|houses?|villas?|apartments?|flats?|plots?|commercial|rentals?|rents?|for\s+rent|sales?|for\s+sale|buys?|purchases?|marla|kanal|beds?|bedrooms?|in\s+sialkot|in\s+lahore|in\s+islamabad|in\s+karachi|under\s+\d+|prices?)\b/i;

  const rawExtracted = extractRawParameters(qClean);
  const hasCompany = companyIndicators.test(qLower);
  const hasPropertyKeywords = propertySearchIndicators.test(qLower);

  // 5. Handle Compound Intent (BOTH: Company Policy + Property Search)
  if (hasCompany && (hasPropertyKeywords || (rawExtracted.hasAnyAttribute && !pendingContext))) {
    const parts = qClean
      .split(/\s*(?:and|as well as|also|\n|;)\s+/i)
      .map((p) => p.trim())
      .filter((p) => p.length > 0);
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

    if (!/\bhavenkey\b/i.test(companyQuery)) {
      companyQuery = companyQuery.replace(/\byour\b/i, "HavenKey's");
      if (!/\bhavenkey\b/i.test(companyQuery)) {
        companyQuery = `${companyQuery} HavenKey`;
      }
    }

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

  // 6. Handle Explicit Single Intent: COMPANY_INFO
  // If the user explicitly asks an unrelated company question (e.g. tenant duties),
  // switch context to COMPANY_INFO instead of forcing previous property search!
  if (hasCompany && !hasPropertyKeywords) {
    let companyQuery = qClean;
    if (!/\bhavenkey\b/i.test(companyQuery)) {
      companyQuery = companyQuery.replace(/\byour\b/i, "HavenKey's");
      if (!/\bhavenkey\b/i.test(companyQuery)) {
        companyQuery = `${companyQuery} HavenKey`;
      }
    }

    return {
      intent: "COMPANY_INFO",
      confidence: 0.95,
      companyQuery,
    };
  }

  // 7. Multi-Turn Context Follow-Up:
  // If pendingContext exists and user supplies follow-up attributes (city, budget, area, etc.)
  if (pendingContext && rawExtracted.hasAnyAttribute) {
    const mergedParams: PropertySearchParams = {
      property_type: rawExtracted.detectedPropertyType ?? pendingContext.property_type ?? null,
      listing_type: rawExtracted.detectedListingType ?? pendingContext.listing_type ?? null,
      location: rawExtracted.detectedLocation ?? pendingContext.location ?? null,
      area_value: rawExtracted.areaValue ?? pendingContext.area_value ?? null,
      area_unit: rawExtracted.areaUnit ?? pendingContext.area_unit ?? null,
      min_price: rawExtracted.minPrice ?? pendingContext.min_price ?? null,
      max_price: rawExtracted.maxPrice ?? pendingContext.max_price ?? null,
      bedrooms: rawExtracted.bedrooms ?? pendingContext.bedrooms ?? null,
    };

    const requiresClarification = !mergedParams.location;
    const clarificationMessage = requiresClarification
      ? "Which city or location are you looking for?"
      : undefined;

    return {
      intent: "PROPERTY_SEARCH",
      confidence: 0.95,
      propertyQuery: qClean,
      propertyParams: mergedParams,
      requiresClarification,
      clarificationMessage,
    };
  }

  // 8. Handle Standalone PROPERTY_SEARCH (New search request)
  if (hasPropertyKeywords || rawExtracted.hasAnyAttribute) {
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

  // 9. Conversational Intent: GENERAL_CONVERSATION
  const howAreYouRegex =
    /\b(?:how\s+(?:are|r)\s+(?:you|u)|how(?:'s|\s+is)\s+it\s+going|how\s+are\s+things|how\s+do\s+you\s+do|how\s+have\s+you\s+been)\b/i;

  const thanksRegex =
    /\b(?:thank\s+you|thanks|thankyou|thx|ty|many\s+thanks|thanks\s+a\s+lot|thank\s+you\s+so\s+much)\b/i;

  const botCapabilityRegex =
    /\b(?:what\s+can\s+you\s+do|who\s+are\s+you|what\s+are\s+you|how\s+can\s+you\s+help|what\s+do\s+you\s+do|what\s+is\s+your\s+purpose|help\s+me)\b/i;

  const farewellRegex =
    /\b(?:goodbye|bye\s+bye|bye|see\s+you|take\s+care|have\s+a\s+nice\s+day|have\s+a\s+good\s+day)\b/i;

  const generalPraiseRegex =
    /^(?:ok|okay|cool|great|awesome|understood|got\s+it|nice|perfect|sure|yes|no)[!.\s]*$/i;

  if (
    howAreYouRegex.test(qLower) ||
    thanksRegex.test(qLower) ||
    botCapabilityRegex.test(qLower) ||
    farewellRegex.test(qLower) ||
    generalPraiseRegex.test(qLower)
  ) {
    return {
      intent: "GENERAL_CONVERSATION",
      confidence: 0.95,
      conversationalResponse: getConversationalReply(qClean, "GENERAL_CONVERSATION"),
    };
  }

  // 10. Conversational Intent: GREETING
  const greetingRegex =
    /^(?:hi|hello|hey|heya|hiya|hi\s+there|hello\s+there|hey\s+there|good\s+(?:morning|afternoon|evening|day)|salam|assalam\s*(?:o|u)?\s*alaikum|asalam\s*o\s*alaikum|aoa)[!.\s]*$/i;

  if (greetingRegex.test(qLower)) {
    return {
      intent: "GREETING",
      confidence: 0.98,
      conversationalResponse: getConversationalReply(qClean, "GREETING"),
    };
  }

  // 11. General / Unrelated Fallback (UNKNOWN)
  return {
    intent: "UNKNOWN",
    confidence: 0.5,
  };
}
