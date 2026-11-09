import path from "path";
import { env, pipeline, AutoTokenizer } from "@huggingface/transformers";
import { MatchedChunk } from "@/lib/rag/vector-store";

// Enforce strict local-only execution: no remote requests, no telemetry, no external APIs
env.allowLocalModels = true;
env.allowRemoteModels = false;

const MODELS_DIR = path.resolve(process.cwd(), "models");
env.localModelPath = MODELS_DIR;

export const LLM_MODEL_NAME = "Qwen2.5-0.5B-Instruct";
export const FALLBACK_MESSAGE =
  "I'm sorry, but I couldn't find this information in HavenKey's available company documents.";

export interface GenerationResult {
  answer: string;
  grounded: boolean;
  sources: { filename: string; similarity: number }[];
  timing: {
    initTimeMs?: number;
    inferenceTimeMs: number;
  };
}

class LocalLLMService {
  private static generatorInstance: any = null;
  private static tokenizerInstance: any = null;
  private static initPromise: Promise<void> | null = null;
  private static isInitialized = false;
  private static coldStartDurationMs = 0;

  /**
   * Thread-safe singleton initialization.
   * Concurrent requests await the single pending initPromise to prevent duplicate loads.
   */
  public static async init(): Promise<void> {
    if (this.isInitialized && this.generatorInstance) {
      return;
    }

    if (!this.initPromise) {
      this.initPromise = (async () => {
        const t0 = Date.now();
        const memBefore = process.memoryUsage().heapUsed / 1024 / 1024;
        console.log(`[LocalLLMService] Initializing ${LLM_MODEL_NAME} locally on CPU...`);
        console.log(`[LocalLLMService] Memory before loading: ${memBefore.toFixed(1)} MB heap`);

        // Load tokenizer from local cache
        this.tokenizerInstance = await AutoTokenizer.from_pretrained(LLM_MODEL_NAME, {
          local_files_only: true,
        });

        // Load text-generation pipeline with Q4 quantization from local cache
        this.generatorInstance = await pipeline("text-generation", LLM_MODEL_NAME, {
          dtype: "q4",
          local_files_only: true,
        });

        const t1 = Date.now();
        this.coldStartDurationMs = t1 - t0;
        this.isInitialized = true;

        const memAfter = process.memoryUsage().heapUsed / 1024 / 1024;
        console.log(
          `[LocalLLMService] Model initialized successfully in ${this.coldStartDurationMs}ms.`
        );
        console.log(`[LocalLLMService] Memory after loading: ${memAfter.toFixed(1)} MB heap (+${(memAfter - memBefore).toFixed(1)} MB)`);
      })();
    }

    await this.initPromise;
  }

  /**
   * Verifies if any meaningful keywords from the user question exist in the retrieved context.
   * If the query terms have zero presence or stem overlap, the retrieved documents do not
   * contain the requested information. This prevents small LLMs from hallucinating answers
   * to missing or unrelated topics (e.g. general knowledge or unlisted company policies).
   */
  private static hasContextRelevance(question: string, contextText: string): boolean {
    const stopWords = new Set([
      "what", "when", "where", "which", "who", "whom", "whose", "why", "how",
      "does", "do", "did", "is", "are", "was", "were", "be", "been", "being",
      "have", "has", "had", "having", "can", "could", "will", "would", "shall", "should",
      "the", "a", "an", "and", "or", "but", "if", "because", "as", "until", "while",
      "of", "at", "by", "for", "with", "about", "against", "between", "into", "through",
      "during", "before", "after", "above", "below", "to", "from", "up", "down", "in",
      "out", "on", "off", "over", "under", "again", "further", "then", "once",
      "havenkey", "havenkeys", "company", "platform", "policy", "rules"
    ]);

    const qTokens = question
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2 && !stopWords.has(w));

    // If query has no specific keywords beyond stop words, allow general context check
    if (qTokens.length === 0) return true;

    const contextLower = contextText.toLowerCase();

    return qTokens.some((token) => {
      if (contextLower.includes(token)) return true;
      const stem = token.replace(/(ing|ed|es|s)$/, "");
      return stem.length > 3 && contextLower.includes(stem);
    });
  }

  /**
   * Generates a grounded answer based strictly on retrieved chunks.
   */
  public static async generateAnswer(
    question: string,
    chunks: MatchedChunk[]
  ): Promise<GenerationResult> {
    const startInference = Date.now();

    // 1. Compile source references
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

    // 2. Immediate guardrail: if no relevant chunks are found
    if (!chunks || chunks.length === 0) {
      return {
        answer: FALLBACK_MESSAGE,
        grounded: false,
        sources: [],
        timing: {
          inferenceTimeMs: Date.now() - startInference,
        },
      };
    }

    // Ensure model is loaded (reuses singleton instance)
    const wasAlreadyLoaded = this.isInitialized;
    await this.init();

    // 3. Assemble bounded retrieved context (limit to top 3 chunks to prevent context overflow)
    const contextText = chunks
      .slice(0, 3)
      .map((c, idx) => `[Document Excerpt ${idx + 1}]:\n${c.content.trim()}`)
      .join("\n\n");

    // Guardrail against missing information or unrelated topics:
    // If the question topics have zero presence in the retrieved context, return fallback
    if (!this.hasContextRelevance(question, contextText)) {
      return {
        answer: FALLBACK_MESSAGE,
        grounded: false,
        sources: [],
        timing: {
          initTimeMs: wasAlreadyLoaded ? undefined : this.coldStartDurationMs,
          inferenceTimeMs: Date.now() - startInference,
        },
      };
    }

    // 4. Construct prompt in Qwen ChatML standard format
    const messages = [
      {
        role: "system",
        content:
          "You are HavenKey's official AI Real Estate Advisor. Answer the user's question using ONLY the provided company document context.\n\n" +
          "Rules:\n" +
          "- Answer using only the retrieved document context.\n" +
          "- Do not invent company policies, fees, procedures, or information.\n" +
          `- If the retrieved context does not contain the answer, respond exactly: "${FALLBACK_MESSAGE}"\n` +
          "- Provide short, clear, user-friendly answers.\n" +
          "- Avoid repeating the same information.\n" +
          "- If multiple retrieved chunks contain relevant information, combine them into one coherent answer.\n" +
          "- Do not mention excerpts, chunk IDs, or internal database mechanisms.",
      },
      {
        role: "user",
        content: `Context:\n${contextText}\n\nQuestion:\n${question}`,
      },
    ];

    try {
      // 5. Generate completion using local Qwen pipeline
      const output = await this.generatorInstance(messages, {
        max_new_tokens: 220,
        temperature: 0.1,
        repetition_penalty: 1.15,
        do_sample: false,
        return_full_text: false,
      });

      const inferenceTimeMs = Date.now() - startInference;
      console.log(`[LocalLLMService] Inference completed in ${inferenceTimeMs}ms.`);

      // 6. Extract generated message content
      let rawText = "";
      if (Array.isArray(output) && output.length > 0) {
        const generated = output[0]?.generated_text;
        if (Array.isArray(generated)) {
          const assistantMsg = generated[generated.length - 1];
          rawText = assistantMsg?.content || "";
        } else if (typeof generated === "string") {
          rawText = generated;
        } else if (output[0]?.text) {
          rawText = output[0].text;
        }
      }

      let answer = (rawText || "").trim();

      // Clean any accidental ChatML / instruction tag leakage
      answer = answer
        .replace(/<\|im_start\|>[\s\S]*?<\|im_end\|>/g, "")
        .replace(/<\|im_end\|>/g, "")
        .replace(/^assistant\s*:\s*/i, "")
        .trim();

      // 7. Verify groundedness & fallback detection
      const notFoundSignals = [
        "couldn't find this information",
        "could not find this information",
        "not available in havenkey",
        "not mentioned in the provided context",
        "not found in the document",
      ];

      const isNotFound =
        !answer ||
        notFoundSignals.some((signal) => answer.toLowerCase().includes(signal));

      if (isNotFound) {
        return {
          answer: FALLBACK_MESSAGE,
          grounded: false,
          sources: [],
          timing: {
            initTimeMs: wasAlreadyLoaded ? undefined : this.coldStartDurationMs,
            inferenceTimeMs,
          },
        };
      }

      return {
        answer,
        grounded: true,
        sources,
        timing: {
          initTimeMs: wasAlreadyLoaded ? undefined : this.coldStartDurationMs,
          inferenceTimeMs,
        },
      };
    } catch (err: any) {
      console.error("[LocalLLMService] Inference generation error:", err);
      return {
        answer: FALLBACK_MESSAGE,
        grounded: false,
        sources,
        timing: {
          inferenceTimeMs: Date.now() - startInference,
        },
      };
    }
  }

  /**
   * Health & diagnostics helper
   */
  public static getStatus() {
    return {
      initialized: this.isInitialized,
      modelName: LLM_MODEL_NAME,
      coldStartDurationMs: this.coldStartDurationMs,
      memoryHeapMB: Number((process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)),
    };
  }
}

export default LocalLLMService;
export { LocalLLMService };
