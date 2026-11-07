import { NextResponse } from "next/server";
import EmbeddingService from "@/lib/rag/embedding";
import { searchSimilarChunks, MatchedChunk } from "@/lib/rag/vector-store";
import LocalLLMService from "@/lib/rag/llm";
import { classifyAndExtract } from "@/lib/ai/intent-classifier";
import { searchProperties, PropertySearchParams } from "@/lib/ai/property-search";
import { getSession, saveSession, clearSession } from "@/lib/ai/session-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const DEFAULT_SIMILARITY_THRESHOLD = 0.35;
export const DEFAULT_MATCH_COUNT = 5;

/**
 * Modular Answer Generation Layer
 * Synthesizes grounded response from retrieved chunks.
 * Designed as a pluggable adapter so an external LLM (e.g. Qwen 2.5, OpenAI, Groq)
 * can be plugged in directly without modifying retrieval.
 */
function cleanAndCapitalize(str: string): string {
  const cleaned = str
    .replace(/^[•\-\*\d\.\s:;]+/, "")
    .replace(/[•\u2022\u25E6\u2023\u25C9]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/[:;]+$/, "")
    .trim();

  if (!cleaned) return "";
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1) + (cleaned.endsWith(".") ? "" : ".");
}

export async function generateGroundedAnswer(
  question: string,
  chunks: MatchedChunk[]
): Promise<{
  answer: string;
  grounded: boolean;
  sources: { filename: string; similarity: number }[];
}> {
  if (!chunks || chunks.length === 0) {
    return {
      answer:
        "This information is not available in HavenKey's company documents. Please contact our support team or explore our verified property listings.",
      grounded: false,
      sources: [],
    };
  }

  // Deduplicate sources and compile references
  const sourceMap = new Map<string, number>();
  for (const c of chunks) {
    const name = c.filename || "company_document.pdf";
    const currentMax = sourceMap.get(name) || 0;
    if (c.similarity > currentMax) {
      sourceMap.set(name, c.similarity);
    }
  }

  const sources = Array.from(sourceMap.entries()).map(([filename, similarity]) => ({
    filename,
    similarity: Number(similarity.toFixed(4)),
  }));

  // Combine top matching chunk context
  const fullContext = chunks.slice(0, 2).map((c) => c.content).join(" ");

  // 1. Extract clean numbered steps if present
  const numberedStepsRegex = /(?:^|\s)(\d+)\.\s+([^0-9\n]+?)(?=(?:\s+\d+\.|$|\n))/g;
  const rawNumberedMatches: string[] = [];
  let numMatch;
  while ((numMatch = numberedStepsRegex.exec(fullContext)) !== null) {
    const raw = numMatch[2]
      .replace(/^[•\-\*\s]+/, "")
      .replace(/[•\-\*\s]+$/, "")
      .trim();

    // Skip section headers or intro clauses ending in colons
    if (
      raw.length > 5 &&
      !raw.endsWith(":") &&
      !/^(about havenkey|our services|user registration|property listing|property buying|property renting|agreement policy|tenant responsibilities|payment policy|complaint and issue|complaint review|admin and management|user conduct|privacy and data|platform disclaimer)/i.test(raw)
    ) {
      // Isolate strictly the first complete sentence
      const firstSentence = raw.split(/(?<=[.?!])\s+/)[0].replace(/[•\-\*\s]+$/, "").trim();
      if (firstSentence.length > 5 && !firstSentence.endsWith(":")) {
        rawNumberedMatches.push(firstSentence);
      }
    }
  }

  // 2. Identify the most accurate introductory lead sentence
  let cleanLead = "";

  // If we have a sequence of numbered steps, check for the specific introductory clause preceding step 1
  if (rawNumberedMatches.length >= 2) {
    const introBeforeListMatch = /(?:[\d]+\.\s+)?([^.\n]+?:\s*)1\./i.exec(fullContext);
    if (introBeforeListMatch) {
      let candidate = introBeforeListMatch[1]
        .replace(/^[a-z\s]+(policy|process|guide|terms)\s+/i, "")
        .replace(/^[•\-\*\s\d\.]+/, "")
        .replace(/:\s*$/, "")
        .trim();
      if (candidate.length > 5) {
        cleanLead = candidate.charAt(0).toUpperCase() + candidate.slice(1) + ":";
      }
    }
  }

  // Fallback to query keyword matching if cleanLead not established
  if (!cleanLead) {
    const stopWords = new Set(["what", "when", "where", "which", "does", "have", "with", "from", "that", "this", "your", "into", "after"]);
    const qTokens = question
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .split(/\s+/)
      .filter((w) => w.length > 2 && !stopWords.has(w));

    const stems = qTokens.map((w) => w.replace(/(ing|ed|es|s)$/, ""));

    const sentences = fullContext
      .replace(/[•\u2022\u25E6\u2023\u25C9]+/g, "\n")
      .split(/(?<=[.?!])\s+|\n+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 15 && !s.startsWith("•"));

    let bestLead = "";
    let highestScore = -1;

    for (const s of sentences) {
      const sLower = s.toLowerCase();
      let score = 0;
      for (const stem of stems) {
        if (sLower.includes(stem)) score += 3;
      }
      if (
        score > highestScore &&
        !sLower.startsWith("incorrect property information") &&
        !sLower.includes("fake or misleading")
      ) {
        highestScore = score;
        bestLead = s;
      }
    }

    if (bestLead) {
      cleanLead = bestLead
        .replace(/^\d+\.\s*/, "")
        .replace(/^[•\-\*\s]+/, "")
        .replace(/:\s*\d+\.?$/, "")
        .replace(/:\s*$/, "")
        .trim();

      if (cleanLead.length > 5) {
        cleanLead = cleanLead.charAt(0).toUpperCase() + cleanLead.slice(1);
        if (!cleanLead.endsWith(".") && !cleanLead.endsWith(":")) {
          cleanLead += ":";
        }
      }
    }
  }

  if (!cleanLead || cleanLead.length <= 5) {
    cleanLead = `According to HavenKey's official documentation:`;
  }

  const lines: string[] = [];
  lines.push(cleanLead);
  lines.push("");

  // 3. Assemble clean numbered items (1, 2, 3...)
  if (rawNumberedMatches.length >= 2) {
    rawNumberedMatches.slice(0, 6).forEach((item, idx) => {
      const formattedItem = item.charAt(0).toUpperCase() + item.slice(1).replace(/\.?$/, ".");
      lines.push(`${idx + 1}. ${formattedItem}`);
    });
  } else {
    // Collect clean distinct provisions
    const bulletItems = fullContext
      .replace(/[•\u2022\u25E6\u2023\u25C9]+/g, "\n")
      .split(/\n+/)
      .map((s) => s.replace(/^[•\-\*\d\.\s]+/, "").trim())
      .filter((s) => s.length > 12 && !s.toLowerCase().startsWith("including"));

    const distinct = Array.from(new Set(bulletItems)).slice(0, 6);
    if (distinct.length > 0) {
      distinct.forEach((item, idx) => {
        const formattedItem = item.charAt(0).toUpperCase() + item.slice(1).replace(/\.?$/, ".");
        lines.push(`${idx + 1}. ${formattedItem}`);
      });
    } else {
      const sentences = fullContext
        .replace(/[•\u2022\u25E6\u2023\u25C9]+/g, "\n")
        .split(/(?<=[.?!])\s+|\n+/)
        .map((s) => s.trim())
        .filter((s) => s.length > 10);
      lines.push(sentences.slice(0, 4).join(" "));
    }
  }

  const answer = lines.join("\n").trim();

  return {
    answer,
    grounded: true,
    sources,
  };
}

/**
 * POST /api/ai/company-rag
 * RAG retrieval endpoint for company policies, terms, and agreement queries
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const question: string = (body.question || body.query || "").trim();
    const threshold: number =
      typeof body.threshold === "number" ? body.threshold : DEFAULT_SIMILARITY_THRESHOLD;
    const matchCount: number =
      typeof body.matchCount === "number" ? body.matchCount : DEFAULT_MATCH_COUNT;

    if (!question) {
      return NextResponse.json(
        { success: false, message: "Please provide a valid question in the request body." },
        { status: 400 }
      );
    }

    const sessionId: string = (body.sessionId || "default-session").trim();

    // Determine pending search parameters from explicit body or session store
    const session = getSession(sessionId);
    const incomingPending: PropertySearchParams | null =
      body.pendingSearchParams !== undefined
        ? body.pendingSearchParams
        : session?.pendingSearchParams || null;

    // 1. Classify Intent & Extract Structured Parameters (with context merging)
    const classification = classifyAndExtract(question, incomingPending);

    // 2. Security Rejection Guardrail: Disallow unauthorized credentials/database dumps
    if (classification.isSecurityViolation) {
      clearSession(sessionId);
      return NextResponse.json({
        success: true,
        intent: "UNKNOWN",
        question,
        grounded: false,
        answer: classification.rejectionMessage,
        properties: [],
        sources: [],
        pendingSearchParams: null,
      });
    }

    // 3. GREETING Intent: Immediate friendly greeting response without RAG or DB calls
    if (classification.intent === "GREETING") {
      return NextResponse.json({
        success: true,
        intent: "GREETING",
        question,
        grounded: true,
        answer:
          classification.conversationalResponse ||
          "Hello! Welcome to HavenKey. How can I help you today? You can ask me about our services or search for properties.",
        properties: [],
        sources: [],
        retrievedCount: 0,
        pendingSearchParams: incomingPending,
      });
    }

    // 4. GENERAL_CONVERSATION Intent: Polite responses to conversational queries
    if (classification.intent === "GENERAL_CONVERSATION") {
      const isCancellation = /^(?:cancel|cancel search|stop|never mind|nevermind|clear search)/i.test(question);
      if (isCancellation) {
        clearSession(sessionId);
      }
      return NextResponse.json({
        success: true,
        intent: "GENERAL_CONVERSATION",
        question,
        grounded: true,
        answer:
          classification.conversationalResponse ||
          "I'm here to help! Feel free to ask about HavenKey's services, rental policies, or search for properties across Pakistan.",
        properties: [],
        sources: [],
        retrievedCount: 0,
        pendingSearchParams: isCancellation ? null : incomingPending,
      });
    }

    // 5. UNKNOWN Intent: Clarification request without RAG or hallucination
    if (classification.intent === "UNKNOWN") {
      return NextResponse.json({
        success: true,
        intent: "UNKNOWN",
        question,
        grounded: false,
        answer:
          "I'm not sure I understand your request. Could you please clarify? You can ask me about HavenKey's company policies, tenant/landlord procedures, or search for properties by location, type, and budget.",
        properties: [],
        sources: [],
        retrievedCount: 0,
        pendingSearchParams: incomingPending,
      });
    }

    // 6. PROPERTY_SEARCH Intent
    if (classification.intent === "PROPERTY_SEARCH") {
      // Rule 1: If location is missing, ask clarification question and preserve parameters
      if (classification.requiresClarification) {
        saveSession(sessionId, classification.propertyParams || null, true);
        return NextResponse.json({
          success: true,
          intent: "PROPERTY_SEARCH",
          question,
          grounded: true,
          answer: classification.clarificationMessage,
          properties: [],
          sources: [],
          pendingSearchParams: classification.propertyParams || null,
          requiresClarification: true,
        });
      }

      // Query Supabase properties table
      const searchResult = await searchProperties(classification.propertyParams || {});
      const hasProps = searchResult.properties && searchResult.properties.length > 0;

      const answer = hasProps
        ? `Here are the matching verified properties in ${classification.propertyParams?.location || "our catalog"}:`
        : "I couldn't find any properties matching your search criteria. You can try changing your location, budget, or property requirements.";

      // Retain the current search parameters in session to allow refinements (e.g. "Under 50 lakh")
      saveSession(sessionId, classification.propertyParams || null, false);

      return NextResponse.json({
        success: true,
        intent: "PROPERTY_SEARCH",
        question,
        grounded: true,
        answer,
        properties: searchResult.properties || [],
        sources: [],
        retrievedCount: searchResult.count,
        pendingSearchParams: classification.propertyParams || null,
        requiresClarification: false,
      });
    }

    // 7. BOTH Intent (Company Policy + Property Search)
    if (classification.intent === "BOTH") {
      // Execute RAG and Property Search independently (Rule 5)
      const companyPart = classification.companyQuery || question;
      const queryEmbedding = await EmbeddingService.generateEmbedding(companyPart);
      const matchedChunks = await searchSimilarChunks(queryEmbedding, threshold, matchCount);

      let ragResult;
      try {
        ragResult = await LocalLLMService.generateAnswer(companyPart, matchedChunks);
      } catch (llmErr: any) {
        console.warn("[company-rag] Local LLM fallback triggered:", llmErr.message);
        ragResult = await generateGroundedAnswer(companyPart, matchedChunks);
      }

      let properties: any[] = [];
      let propertyLead = "";

      if (classification.requiresClarification) {
        saveSession(sessionId, classification.propertyParams || null, true);
        propertyLead = `\n\nFor property search: ${classification.clarificationMessage}`;
      } else {
        const searchResult = await searchProperties(classification.propertyParams || {});
        properties = searchResult.properties || [];
        saveSession(sessionId, classification.propertyParams || null, false);
        if (properties.length > 0) {
          propertyLead = `\n\nHere are the available properties in ${classification.propertyParams?.location || "our catalog"}:`;
        } else {
          propertyLead = `\n\nI couldn't find any properties matching your search criteria. You can try changing your location, budget, or property requirements.`;
        }
      }

      const combinedAnswer = (ragResult.answer + propertyLead).trim();

      return NextResponse.json({
        success: true,
        intent: "BOTH",
        question,
        grounded: ragResult.grounded,
        answer: combinedAnswer,
        sources: ragResult.sources,
        properties,
        retrievedCount: matchedChunks.length,
        pendingSearchParams: classification.propertyParams || null,
        requiresClarification: classification.requiresClarification || false,
      });
    }

    // 8. COMPANY_INFO Intent (Existing RAG Pipeline)
    // When the user explicitly asks an unrelated company question, clear pending property search state
    clearSession(sessionId);

    const companyQuery = classification.companyQuery || question;
    const queryEmbedding = await EmbeddingService.generateEmbedding(companyQuery);
    const matchedChunks = await searchSimilarChunks(queryEmbedding, threshold, matchCount);

    let llmResult;
    try {
      llmResult = await LocalLLMService.generateAnswer(companyQuery, matchedChunks);
    } catch (llmErr: any) {
      console.warn("[company-rag] Local LLM fallback triggered:", llmErr.message);
      llmResult = await generateGroundedAnswer(companyQuery, matchedChunks);
    }

    const { answer, grounded, sources } = llmResult;

    return NextResponse.json({
      success: true,
      intent: classification.intent,
      question,
      grounded,
      answer,
      sources,
      properties: [],
      retrievedCount: matchedChunks.length,
      pendingSearchParams: null,
      chunks: matchedChunks.map((c) => ({
        id: c.id,
        filename: c.filename,
        docId: c.docId,
        similarity: Number(c.similarity.toFixed(4)),
        content: c.content,
      })),
      timing: (llmResult as any).timing,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: `RAG retrieval error: ${err.message}` },
      { status: 500 }
    );
  }
}
