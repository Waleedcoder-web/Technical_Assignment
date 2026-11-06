import { NextResponse } from "next/server";
import EmbeddingService from "@/lib/rag/embedding";
import { searchSimilarChunks, MatchedChunk } from "@/lib/rag/vector-store";

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

  // Structure and format retrieved content into executive-ready sections
  const primaryContent = chunks[0].content.trim();

  // Split into readable sentences/clauses
  const sentences = primaryContent
    .split(/(?<=[.?!])\s+|\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 5);

  const formattedLines: string[] = [];

  formattedLines.push(`### 📄 Verified Company Documentation`);
  formattedLines.push(`Here is the official HavenKey policy regarding **"${question}"**:\n`);

  if (sentences.length <= 2) {
    formattedLines.push(`> ${sentences.join(" ")}\n`);
  } else {
    // 1. Executive Summary
    formattedLines.push(`**Key Overview:**\n${sentences[0]}\n`);

    // 2. Bulleted Provisions
    formattedLines.push(`**Key Provisions & Requirements:**`);
    const provisions = sentences.slice(1, 5);
    for (const item of provisions) {
      formattedLines.push(`• ${item}`);
    }
    formattedLines.push("");
  }

  // 3. Supporting context if multiple chunks retrieved
  if (chunks.length > 1) {
    const secondarySentences = chunks[1].content
      .split(/(?<=[.?!])\s+|\n+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 10);

    if (secondarySentences.length > 0) {
      formattedLines.push(`**Additional Verified Terms:**`);
      formattedLines.push(`• ${secondarySentences[0]}`);
      formattedLines.push("");
    }
  }

  // 4. Citation footer
  const docNames = sources.map((s) => `\`${s.filename}\``).join(", ");
  formattedLines.push(`---`);
  formattedLines.push(`📌 *Verified directly from official company records: ${docNames}*`);

  const answer = formattedLines.join("\n");

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

    // 1. Generate 384-dimensional query embedding locally
    const queryEmbedding = await EmbeddingService.generateEmbedding(question);

    // 2. Call match_rag_chunks RPC in Supabase
    const matchedChunks = await searchSimilarChunks(queryEmbedding, threshold, matchCount);

    // 3. Pass retrieved context to modular answer-generation layer
    const { answer, grounded, sources } = await generateGroundedAnswer(question, matchedChunks);

    return NextResponse.json({
      success: true,
      question,
      grounded,
      answer,
      sources,
      retrievedCount: matchedChunks.length,
      chunks: matchedChunks.map((c) => ({
        id: c.id,
        filename: c.filename,
        docId: c.docId,
        similarity: Number(c.similarity.toFixed(4)),
        content: c.content,
      })),
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: `RAG retrieval error: ${err.message}` },
      { status: 500 }
    );
  }
}
