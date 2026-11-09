import { NextResponse } from "next/server";
import {
  buildSourceKey,
  insertDocumentChunks,
  rollbackDocumentChunks,
  listIndexedDocuments,
  deleteDocumentBySource,
  parseSourceKey,
} from "@/lib/rag/vector-store";
import { extractTextFromFile, splitTextIntoTokenChunks } from "@/lib/rag/chunker";
import EmbeddingService from "@/lib/rag/embedding";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15MB

function checkAdminAuth(req: Request): boolean {
  const roleHeader = req.headers.get("x-admin-role");
  const authHeader = req.headers.get("authorization");
  if (roleHeader === "admin") return true;
  if (authHeader && (authHeader.includes("admin") || authHeader.startsWith("Bearer hk_jwt_"))) {
    return true;
  }
  return false;
}

/**
 * GET /api/admin/documents
 * List all indexed documents with accurate chunk counts and pagination
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
    const pageSize = Math.max(1, Math.min(100, parseInt(url.searchParams.get("pageSize") || "20", 10)));

    const result = await listIndexedDocuments(page, pageSize);
    return NextResponse.json({
      success: true,
      data: result.documents,
      pagination: {
        total: result.total,
        page: result.page,
        pageSize: result.pageSize,
        totalPages: Math.ceil(result.total / result.pageSize),
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: `Failed to list documents: ${err.message}` },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/documents
 * Uploads, extracts, token-chunks, generates embeddings, and persists document chunks in Supabase
 */
export async function POST(req: Request) {
  if (!checkAdminAuth(req)) {
    return NextResponse.json(
      { success: false, message: "Unauthorized. Administrator session required." },
      { status: 403 }
    );
  }

  let sourceKey = "";

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, message: "No file provided. Please upload a PDF or TXT file." },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { success: false, message: "File exceeds 15MB limit. Please upload a smaller document." },
        { status: 400 }
      );
    }

    const filename = file.name.trim();
    const lowerName = filename.toLowerCase();
    if (!lowerName.endsWith(".pdf") && !lowerName.endsWith(".txt")) {
      return NextResponse.json(
        { success: false, message: "Unsupported file type. Only PDF and TXT files are accepted." },
        { status: 400 }
      );
    }

    // Convert file to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Extract readable text
    const extractedText = await extractTextFromFile(buffer, filename, file.type);
    if (!extractedText || extractedText.length < 10) {
      return NextResponse.json(
        {
          success: false,
          message: "Could not extract readable text from this document. Please ensure the file is not empty or scanned without OCR.",
        },
        { status: 400 }
      );
    }

    // Token-accurate chunking (180–220 tokens with 30–40 token overlap, checking 256 special token limit)
    const chunks = await splitTextIntoTokenChunks(extractedText);
    if (chunks.length === 0) {
      return NextResponse.json(
        { success: false, message: "No valid textual chunks could be extracted from this document." },
        { status: 400 }
      );
    }

    // Generate unique source key: <doc_uuid>::<original_filename>
    sourceKey = buildSourceKey(filename);
    const { docId } = parseSourceKey(sourceKey);

    // Generate 384-dimensional embeddings for each chunk
    const chunkRows: { content: string; embedding: number[] }[] = [];
    for (const chunk of chunks) {
      const embedding = await EmbeddingService.generateEmbedding(chunk.content);
      chunkRows.push({
        content: chunk.content,
        embedding,
      });
    }

    // Persist to Supabase rag_chunks table
    const { insertedCount } = await insertDocumentChunks(sourceKey, chunkRows);

    return NextResponse.json(
      {
        success: true,
        message: `Successfully indexed "${filename}" into ${insertedCount} chunks.`,
        data: {
          docId,
          filename,
          sourceKey,
          chunkCount: insertedCount,
        },
      },
      { status: 201 }
    );
  } catch (err: any) {
    // If sourceKey was generated and insertion failed, perform atomic rollback safeguard
    if (sourceKey) {
      await rollbackDocumentChunks(sourceKey);
    }

    return NextResponse.json(
      {
        success: false,
        message: `Document ingestion failed: ${err.message}`,
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/documents
 * Deletes all chunks associated with a specific document sourceKey
 */
export async function DELETE(req: Request) {
  if (!checkAdminAuth(req)) {
    return NextResponse.json(
      { success: false, message: "Unauthorized. Administrator session required." },
      { status: 403 }
    );
  }

  try {
    let sourceKey = "";

    const url = new URL(req.url);
    const querySource = url.searchParams.get("sourceKey");
    if (querySource) {
      sourceKey = querySource;
    } else {
      const body = await req.json().catch(() => ({}));
      sourceKey = body.sourceKey || "";
    }

    if (!sourceKey) {
      return NextResponse.json(
        { success: false, message: "sourceKey is required to delete document chunks." },
        { status: 400 }
      );
    }

    await deleteDocumentBySource(sourceKey);
    const { filename } = parseSourceKey(sourceKey);

    return NextResponse.json({
      success: true,
      message: `Document "${filename}" and all its vector chunks have been removed.`,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: `Failed to delete document: ${err.message}` },
      { status: 500 }
    );
  }
}
