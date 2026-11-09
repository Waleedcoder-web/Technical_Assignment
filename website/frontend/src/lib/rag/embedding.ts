import path from "path";
import { env, pipeline, AutoTokenizer } from "@huggingface/transformers";

// Configure local-only model execution
env.allowLocalModels = true;
env.allowRemoteModels = false;

// Determine models directory relative to process root
const MODELS_DIR = path.resolve(process.cwd(), "models");
env.localModelPath = MODELS_DIR;

export const EMBEDDING_MODEL_NAME = "all-MiniLM-L6-v2";
export const EXPECTED_EMBEDDING_DIM = 384;
export const MODEL_MAX_SEQ_LENGTH = 256;

class EmbeddingService {
  private static extractorInstance: any = null;
  private static tokenizerInstance: any = null;
  private static initPromise: Promise<void> | null = null;

  /**
   * Initializes or returns the cached local feature-extraction pipeline and tokenizer
   */
  private static async init(): Promise<void> {
    if (this.extractorInstance && this.tokenizerInstance) return;

    if (!this.initPromise) {
      this.initPromise = (async () => {
        // Load tokenizer locally
        this.tokenizerInstance = await AutoTokenizer.from_pretrained(EMBEDDING_MODEL_NAME, {
          local_files_only: true,
        });

        // Load feature-extraction pipeline locally
        this.extractorInstance = await pipeline("feature-extraction", EMBEDDING_MODEL_NAME, {
          local_files_only: true,
        });
      })();
    }

    await this.initPromise;
  }

  /**
   * Returns the shared AutoTokenizer instance
   */
  public static async getTokenizer(): Promise<any> {
    await this.init();
    return this.tokenizerInstance;
  }

  /**
   * Generates a 384-dimensional normalized embedding using mean pooling
   */
  public static async generateEmbedding(text: string): Promise<number[]> {
    if (!text || !text.trim()) {
      throw new Error("Cannot generate embedding for empty text content");
    }

    await this.init();

    // Feature extraction with mean pooling and L2 normalization
    const output = await this.extractorInstance(text, {
      pooling: "mean",
      normalize: true,
    });

    const vector = Array.from(output.data as Float32Array).map(Number);

    if (vector.length !== EXPECTED_EMBEDDING_DIM) {
      throw new Error(
        `Invalid embedding dimension: expected ${EXPECTED_EMBEDDING_DIM}, got ${vector.length}`
      );
    }

    return vector;
  }

  /**
   * Computes exact token count including special tokens ([CLS] + [SEP])
   */
  public static async countTokens(text: string): Promise<number> {
    await this.init();
    const encoded = this.tokenizerInstance(text);
    return Number(encoded.input_ids.dims[1]);
  }
}

export default EmbeddingService;
export { EmbeddingService };
