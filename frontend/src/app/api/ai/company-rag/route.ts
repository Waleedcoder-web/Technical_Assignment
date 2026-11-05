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

  // Compiles grounded synthesis of retrieved clauses
  const synthesizedClauses = chunks
    .map((c, i) => `[Source ${i + 1} (${c.filename || "Doc"}, Match: ${(c.similarity * 100).toFixed(0)}%)]: ${c.content}`)
    .join("\n\n");

  const answer = `Based on HavenKey's official company documentation:\n\n${chunks[0].content}\n\n*Reference: ${sources.map((s) => s.filename).join(", ")}*`;

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
