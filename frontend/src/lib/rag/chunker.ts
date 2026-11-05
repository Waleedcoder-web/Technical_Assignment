import { PDFParse } from "pdf-parse";
import EmbeddingService, { MODEL_MAX_SEQ_LENGTH } from "./embedding";

export const DEFAULT_CHUNK_SIZE_TOKENS = 200; // within 180–220 range
export const DEFAULT_CHUNK_OVERLAP_TOKENS = 35; // within 30–40 range
export const SPECIAL_TOKENS_COUNT = 2; // [CLS] and [SEP]

export interface ChunkResult {
  chunkIndex: number;
  content: string;
  tokenCount: number; // raw token count
  tokenCountWithSpecial: number; // including [CLS] + [SEP] <= 256
}

/**
 * Extracts raw textual content from uploaded file buffers (PDF or TXT)
 */
export async function extractTextFromFile(
  buffer: Buffer,
  filename: string,
  mimeType?: string
): Promise<string> {
  const isPdf =
    filename.toLowerCase().endsWith(".pdf") ||
    (mimeType && mimeType.includes("pdf"));

  if (isPdf) {
    try {
      const parser = new PDFParse(new Uint8Array(buffer));
      const parsed = await parser.getText();
      const text = typeof parsed === "string" ? parsed : parsed?.text || "";
      return cleanExtractedText(text);
    } catch (err: any) {
      throw new Error(`Failed to extract text from PDF "${filename}": ${err.message}`);
    }
  }

  // Treat as plain text (.txt, etc.)
  try {
    const text = buffer.toString("utf-8");
    return cleanExtractedText(text);
  } catch (err: any) {
    throw new Error(`Failed to decode text file "${filename}": ${err.message}`);
  }
}

/**
 * Normalizes line endings and redundant whitespace
 */
export function cleanExtractedText(text: string): string {
  if (!text) return "";
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\t/g, " ")
    .replace(/[ \u00A0]+/g, " ")
    .replace(/\n\s+\n/g, "\n\n")
    .trim();
}

/**
 * Splits text into token-accurate chunks of 180–220 tokens with 30–40 token overlap,
 * verifying that the final token count including special tokens stays under the 256 limit.
 */
export async function splitTextIntoTokenChunks(
  text: string,
  chunkSize: number = DEFAULT_CHUNK_SIZE_TOKENS,
  chunkOverlap: number = DEFAULT_CHUNK_OVERLAP_TOKENS
): Promise<ChunkResult[]> {
  const cleaned = cleanExtractedText(text);
  if (!cleaned) {
    return [];
  }

  // Ensure chunkSize stays safely within 180–220 and avoids exceeding 256 with special tokens
  const targetChunkSize = Math.min(Math.max(chunkSize, 180), 220);
  const targetOverlap = Math.min(Math.max(chunkOverlap, 30), 40);

  const tokenizer = await EmbeddingService.getTokenizer();

  // Encode without special tokens to get pure document token IDs
  const encoded = tokenizer(cleaned, { add_special_tokens: false });
  const tokenIds: number[] = Array.from(encoded.input_ids.data).map(Number);

  if (tokenIds.length === 0) {
    return [];
  }

  const results: ChunkResult[] = [];
  let startIndex = 0;

  while (startIndex < tokenIds.length) {
    const endIndex = Math.min(startIndex + targetChunkSize, tokenIds.length);
    const slice = tokenIds.slice(startIndex, endIndex);

    // Decode token slice back to clean text string
    const decodedText = tokenizer.decode(slice, {
      skip_special_tokens: true,
    }).trim();

    if (decodedText.length > 0) {
      // Calculate token count with special tokens [CLS] + [SEP]
      const tokenCountWithSpecial = slice.length + SPECIAL_TOKENS_COUNT;

      if (tokenCountWithSpecial > MODEL_MAX_SEQ_LENGTH) {
        throw new Error(
          `Chunk sequence length (${tokenCountWithSpecial}) exceeds model maximum (${MODEL_MAX_SEQ_LENGTH})`
        );
      }

      results.push({
        chunkIndex: results.length,
        content: decodedText,
        tokenCount: slice.length,
        tokenCountWithSpecial,
      });
    }

    if (endIndex >= tokenIds.length) {
      break;
    }

    // Advance window with overlap
    startIndex += targetChunkSize - targetOverlap;
  }

  return results;
}
