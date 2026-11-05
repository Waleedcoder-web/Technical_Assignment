import { supabaseAdmin as supabase } from "@/lib/supabase";
import { v4 as uuidv4 } from "uuid";

export const SOURCE_DELIMITER = "::";

export interface ParsedDocumentMeta {
  docId: string;
  sourceKey: string;
  filename: string;
  chunkCount: number;
  createdAt: string;
}

export interface MatchedChunk {
  id: number;
  content: string;
  source: string;
  similarity: number;
  docId?: string;
  filename?: string;
}

/**
 * Builds a unique source identifier: "<doc_uuid>::<original_filename>"
 */
export function buildSourceKey(filename: string, docId?: string): string {
  const id = docId || uuidv4();
  const sanitizedName = filename.replace(/[\r\n\t]/g, "").trim();
  return `${id}${SOURCE_DELIMITER}${sanitizedName}`;
}

/**
 * Parses a source identifier into document UUID and original filename
 */
export function parseSourceKey(source: string): { docId: string; filename: string } {
  if (!source) {
    return { docId: "unknown", filename: "unnamed_document" };
  }

  const delimiterIndex = source.indexOf(SOURCE_DELIMITER);
  if (delimiterIndex === -1) {
    return { docId: "legacy", filename: source };
  }

  const docId = source.substring(0, delimiterIndex);
  const filename = source.substring(delimiterIndex + SOURCE_DELIMITER.length);
  return { docId, filename };
}

/**
 * Inserts a batch of chunks into the existing rag_chunks table.
 * If any error occurs, all chunks for this source are immediately rolled back.
 */
export async function insertDocumentChunks(
  sourceKey: string,
  chunks: { content: string; embedding: number[] }[]
): Promise<{ insertedCount: number }> {
  if (!chunks || chunks.length === 0) {
    throw new Error("No chunks provided for insertion");
  }

  const rows = chunks.map((chunk) => ({
    source: sourceKey,
    content: chunk.content,
    embedding: chunk.embedding,
  }));

  // Batch insert into rag_chunks
  const { data, error } = await supabase.from("rag_chunks").insert(rows).select("id");

  if (error) {
    // Immediate rollback safeguard
    await rollbackDocumentChunks(sourceKey);
    throw new Error(`Database insert failed: ${error.message}`);
  }

  return { insertedCount: data ? data.length : rows.length };
}

/**
 * Rollback safeguard: removes any chunks with the given sourceKey
 */
export async function rollbackDocumentChunks(sourceKey: string): Promise<void> {
  try {
    await supabase.from("rag_chunks").delete().eq("source", sourceKey);
  } catch (err: any) {
    console.error(`Rollback warning for source "${sourceKey}":`, err.message);
  }
}

/**
 * Deletes all chunks associated with a specific document source key
 */
export async function deleteDocumentBySource(sourceKey: string): Promise<{ deleted: boolean }> {
  const { error } = await supabase.from("rag_chunks").delete().eq("source", sourceKey);
  if (error) {
    throw new Error(`Failed to delete document chunks: ${error.message}`);
  }
  return { deleted: true };
}

/**
 * Lists unique indexed documents with accurate chunk counts, pagination, and metadata
 */
export async function listIndexedDocuments(
  page: number = 1,
  pageSize: number = 20
): Promise<{
  documents: ParsedDocumentMeta[];
  total: number;
  page: number;
  pageSize: number;
}> {
  // Query all sources with chunk IDs and creation timestamps
  const { data, error } = await supabase
    .from("rag_chunks")
    .select("id, source, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to list document chunks: ${error.message}`);
  }

  // Aggregate by unique sourceKey
  const docMap = new Map<
    string,
    { chunkCount: number; firstCreatedAt: string }
  >();

  for (const row of data || []) {
    const key = row.source || "unknown";
    const existing = docMap.get(key);
    if (!existing) {
      docMap.set(key, {
        chunkCount: 1,
        firstCreatedAt: row.created_at,
      });
    } else {
      existing.chunkCount += 1;
    }
  }

  const allDocs: ParsedDocumentMeta[] = [];
  for (const [sourceKey, meta] of docMap.entries()) {
    const { docId, filename } = parseSourceKey(sourceKey);
    allDocs.push({
      docId,
      sourceKey,
      filename,
      chunkCount: meta.chunkCount,
      createdAt: meta.firstCreatedAt,
    });
  }

  const total = allDocs.length;
  const start = (page - 1) * pageSize;
  const paginated = allDocs.slice(start, start + pageSize);

  return {
    documents: paginated,
    total,
    page,
    pageSize,
  };
}

/**
 * Performs vector similarity search using the existing match_rag_chunks RPC function
 */
export async function searchSimilarChunks(
  queryEmbedding: number[],
  matchThreshold: number = 0.35,
  matchCount: number = 5
): Promise<MatchedChunk[]> {
  if (!queryEmbedding || queryEmbedding.length !== 384) {
    throw new Error("Query embedding must have exactly 384 dimensions");
  }

  const { data, error } = await supabase.rpc("match_rag_chunks", {
    query_embedding: queryEmbedding,
    match_threshold: matchThreshold,
    match_count: matchCount,
  });

  if (error) {
    throw new Error(`Vector similarity RPC call failed: ${error.message}`);
  }

  const results: MatchedChunk[] = (data || []).map((row: any) => {
    const { docId, filename } = parseSourceKey(row.source);
    return {
      id: Number(row.id),
      content: row.content,
      source: row.source,
      similarity: Number(row.similarity),
      docId,
      filename,
    };
  });

  return results;
}
