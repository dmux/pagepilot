import * as vscode from "vscode";
import { cosineSimilarity } from "fast-cosine-similarity";
import {
  EnhancedEmbeddingGenerator,
  EnhancedEmbedding,
  ChunkMetadata,
} from "./enhanced-embedding-generator";
import { ConfigManager } from "./config/config-manager";
import { Vocabulary } from "./vocabulary-builder";
import { TextProcessor } from "./text-processor";
import { EmbeddingConfig, ProcessingLimits } from "./types/config";
import {
  logger,
  PerformanceMonitor,
  withPerformanceMonitoring,
} from "./utils/logger";

const MAX_CHUNK_SIZE = 512;

// ============================================================================
// ORIGINAL API - BACKWARD COMPATIBLE
// These functions maintain exact same signature and behavior as before
// ============================================================================

// Enhanced retrieval interfaces
export interface RelevanceResult {
  chunk: string;
  similarity: number;
  metadata?: ChunkMetadata;
}

export interface EnhancedRetrievalOptions {
  topK?: number;
  minSimilarity?: number;
  useMetadataBoost?: boolean;
  languagePreference?: string;
}

// Global instances for enhanced functionality
let enhancedGenerator: EnhancedEmbeddingGenerator | null = null;
let configManager: ConfigManager | null = null;

/**
 * Initialize enhanced components when extension context is available
 * This must be called before using enhanced API functions
 */
export function initializeEnhancedEmbeddings(
  context: vscode.ExtensionContext
): void {
  const monitor = new PerformanceMonitor("initialization");

  try {
    logger.info("EmbeddingSystem", "Initializing enhanced embeddings system");

    enhancedGenerator = new EnhancedEmbeddingGenerator();
    configManager = new ConfigManager(context);

    const perf = monitor.finish();
    logger.performance(
      "EmbeddingSystem",
      "Enhanced embeddings initialized successfully",
      perf
    );

    // Log current configuration
    const config = configManager.getConfig();
    logger.info("EmbeddingSystem", "Configuration loaded", {
      enableTFIDF: config.enableTFIDF,
      enableStemming: config.enableStemming,
      enableStopwordRemoval: config.enableStopwordRemoval,
      ngramSizes: config.ngramSizes,
      tfidfWeight: config.tfidfWeight,
      language: config.language,
    });
  } catch (error) {
    const perf = monitor.finish();
    logger.error(
      "EmbeddingSystem",
      "Failed to initialize enhanced embeddings",
      { perf },
      error as Error
    );
    throw error;
  }
}

/**
 * Original chunking function - maintains exact behavior for backward compatibility
 */
function chunkText(text: string): string[] {
  const sentences = text.split(/[.!?]/);
  const chunks: string[] = [];
  let currentChunk = "";

  for (const sentence of sentences) {
    if (currentChunk.length + sentence.length > MAX_CHUNK_SIZE) {
      chunks.push(currentChunk);
      currentChunk = sentence;
    } else {
      currentChunk += sentence;
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk);
  }

  return chunks;
}

/**
 * Original Bag-of-Words function - maintains exact behavior for backward compatibility
 */
function createBoW(text: string, vocab: string[]): number[] {
  const bow = new Array(vocab.length).fill(0);
  const words = text.toLowerCase().split(/\s+/);
  for (const word of words) {
    const index = vocab.indexOf(word);
    if (index !== -1) {
      bow[index]++;
    }
  }
  return bow;
}

/**
 * Original generateEmbeddings function - EXACT same signature and behavior
 * This function is never modified to ensure backward compatibility
 */
export function generateEmbeddings(
  content: string
): { chunk: string; embedding: number[] }[] {
  const chunks = chunkText(content);
  if (chunks.length === 0) {
    return [];
  }
  const vocab = Array.from(new Set(content.toLowerCase().split(/\s+/)));
  const embeddings = chunks
    .map((chunk) => ({
      chunk,
      embedding: createBoW(chunk, vocab),
    }))
    .filter((e) => e.embedding.some((v) => v > 0));
  return embeddings;
}

/**
 * Original findMostRelevantChunks function - EXACT same signature and behavior
 * This function maintains original logic and only uses enhanced features as internal fallback
 */
export function findMostRelevantChunks(
  question: string,
  embeddings: { chunk: string; embedding: number[] }[],
  topK = 3
): string[] {
  if (embeddings.length === 0) {
    return [];
  }

  // Original implementation - always used for consistency
  const vocab = Array.from(
    new Set(
      embeddings
        .map((e) => e.chunk)
        .join(" ")
        .toLowerCase()
        .split(/\s+/)
    )
  );
  const questionEmbedding = createBoW(question, vocab);

  if (questionEmbedding.every((v) => v === 0)) {
    return [];
  }

  const similarities = embeddings.map((e) => ({
    chunk: e.chunk,
    similarity: cosineSimilarity(questionEmbedding, e.embedding),
  }));

  similarities.sort((a, b) => b.similarity - a.similarity);

  return similarities
    .filter((s) => s.similarity > 0)
    .slice(0, topK)
    .map((s) => s.chunk);
}

// ============================================================================
// ENHANCED API - OPTIONAL EXTENSIONS
// These functions provide enhanced functionality while maintaining compatibility
// ============================================================================

/**
 * Enhanced embedding generation with configuration options
 * Provides TF-IDF, stemming, stopword removal, and n-gram support
 *
 * @param content - Text content to generate embeddings for
 * @param config - Optional configuration for enhanced processing
 * @returns Enhanced embeddings with metadata
 * @throws Error if enhanced embeddings not initialized
 */
export function generateEnhancedEmbeddings(
  content: string,
  config?: EmbeddingConfig
): EnhancedEmbedding[] {
  const monitor = new PerformanceMonitor("enhanced_embedding_generation");

  try {
    if (!enhancedGenerator) {
      const error = new Error(
        "Enhanced embeddings not initialized. Call initializeEnhancedEmbeddings first."
      );
      logger.error("EmbeddingSystem", "Enhanced generator not initialized", {
        contentLength: content.length,
      });
      throw error;
    }

    logger.debug("EmbeddingSystem", "Starting enhanced embedding generation", {
      contentLength: content.length,
      configProvided: !!config,
    });

    const effectiveConfig =
      config || configManager?.getConfig() || getDefaultEmbeddingConfig();

    // Validate configuration
    if (enhancedGenerator.validateConfig) {
      const configErrors = enhancedGenerator.validateConfig(effectiveConfig);
      if (configErrors.length > 0) {
        logger.warn("EmbeddingSystem", "Configuration validation warnings", {
          errors: configErrors,
        });
      }
    }

    const result = enhancedGenerator.generateEnhancedEmbeddings(
      content,
      effectiveConfig
    );

    const perf = monitor.finish(content.length, result.length);
    logger.performance(
      "EmbeddingSystem",
      "Enhanced embedding generation completed",
      perf,
      {
        chunksGenerated: result.length,
        averageChunkSize:
          result.length > 0 ? content.length / result.length : 0,
      }
    );

    return result;
  } catch (error) {
    const perf = monitor.finish(content.length, 0);
    logger.error(
      "EmbeddingSystem",
      "Enhanced embedding generation failed",
      { perf, contentLength: content.length },
      error as Error
    );
    throw error;
  }
}

/**
 * Enhanced retrieval function with metadata support and advanced options
 * Provides improved relevance scoring and metadata-based boosting
 *
 * @param question - Query text
 * @param embeddings - Array of embeddings with optional metadata
 * @param options - Enhanced retrieval options
 * @returns Relevance results with similarity scores and metadata
 */
export function findMostRelevantChunksEnhanced(
  question: string,
  embeddings: {
    chunk: string;
    embedding: number[];
    metadata?: ChunkMetadata;
  }[],
  options: EnhancedRetrievalOptions = {}
): RelevanceResult[] {
  const {
    topK = 3,
    minSimilarity = 0,
    useMetadataBoost = true,
    languagePreference,
  } = options;

  if (embeddings.length === 0) {
    return [];
  }

  try {
    // Get current configuration
    const config = configManager?.getConfig() || getDefaultEmbeddingConfig();

    // Build vocabulary from existing embeddings
    const vocabulary = buildVocabularyFromEmbeddings(embeddings);

    // Generate question embedding using the same configuration
    let questionEmbedding: number[];
    if (enhancedGenerator && vocabulary.terms.length > 0) {
      questionEmbedding = enhancedGenerator.generateSingleEmbedding(
        question,
        vocabulary,
        config
      );
    } else {
      // Fallback to simple BoW
      const vocab = Array.from(
        new Set(
          embeddings
            .map((e) => e.chunk)
            .join(" ")
            .toLowerCase()
            .split(/\s+/)
        )
      );
      questionEmbedding = createBoW(question, vocab);
    }

    if (questionEmbedding.every((v) => v === 0)) {
      return [];
    }

    // Calculate similarities with optional metadata boosting
    const similarities = embeddings.map((e) => {
      let similarity = cosineSimilarity(questionEmbedding, e.embedding);

      // Apply metadata-based boosting if enabled and metadata is available
      if (useMetadataBoost && e.metadata) {
        similarity = applyMetadataBoost(similarity, e.metadata, {
          languagePreference,
          question,
        });
      }

      return {
        chunk: e.chunk,
        similarity,
        metadata: e.metadata,
      };
    });

    // Sort by similarity and filter
    similarities.sort((a, b) => b.similarity - a.similarity);

    return similarities
      .filter((s) => s.similarity > minSimilarity)
      .slice(0, topK);
  } catch (error) {
    logger.error(
      "RetrievalSystem",
      "Enhanced retrieval failed, falling back to basic similarity",
      {
        questionLength: question.length,
        embeddingsCount: embeddings.length,
        options,
      },
      error as Error
    );

    // Fallback to basic similarity calculation
    const vocab = Array.from(
      new Set(
        embeddings
          .map((e) => e.chunk)
          .join(" ")
          .toLowerCase()
          .split(/\s+/)
      )
    );
    const questionEmbedding = createBoW(question, vocab);

    if (questionEmbedding.every((v) => v === 0)) {
      return [];
    }

    const similarities = embeddings.map((e) => ({
      chunk: e.chunk,
      similarity: cosineSimilarity(questionEmbedding, e.embedding),
      metadata: e.metadata,
    }));

    similarities.sort((a, b) => b.similarity - a.similarity);

    return similarities
      .filter((s) => s.similarity > minSimilarity)
      .slice(0, topK);
  }
}
/**
 * Helper function to build vocabulary from existing embeddings
 */
function buildVocabularyFromEmbeddings(
  embeddings: { chunk: string; embedding: number[]; metadata?: ChunkMetadata }[]
): Vocabulary {
  // Extract all text from chunks
  const allText = embeddings.map((e) => e.chunk).join(" ");

  // Use text processor if available, otherwise simple tokenization
  let words: string[];
  if (enhancedGenerator) {
    const textProcessor = new TextProcessor();
    const processed = textProcessor.processText(allText);
    words = processed.ngrams;
  } else {
    words = allText.toLowerCase().split(/\s+/);
  }

  // Build vocabulary
  const uniqueTerms = Array.from(
    new Set(words.filter((w) => w.trim().length > 0))
  );
  const termToIndex = new Map<string, number>();
  const documentFrequency = new Map<string, number>();

  uniqueTerms.forEach((term, index) => {
    termToIndex.set(term, index);

    // Count document frequency
    let docCount = 0;
    for (const embedding of embeddings) {
      if (embedding.chunk.toLowerCase().includes(term)) {
        docCount++;
      }
    }
    documentFrequency.set(term, docCount);
  });

  return {
    terms: uniqueTerms,
    termToIndex,
    documentFrequency,
    totalDocuments: embeddings.length,
  };
}

/**
 * Apply metadata-based boosting to similarity scores
 */
function applyMetadataBoost(
  similarity: number,
  metadata: ChunkMetadata,
  options: {
    languagePreference?: string;
    question: string;
  }
): number {
  let boostedSimilarity = similarity;

  // Language preference boost
  if (
    options.languagePreference &&
    metadata.language === options.languagePreference
  ) {
    boostedSimilarity *= 1.1; // 10% boost for preferred language
  }

  // Word count boost (prefer chunks with moderate word count)
  const optimalWordCount = 50; // Optimal chunk size
  const wordCountRatio = Math.min(metadata.wordCount / optimalWordCount, 1);
  const wordCountBoost = 0.9 + wordCountRatio * 0.2; // 0.9 to 1.1 multiplier
  boostedSimilarity *= wordCountBoost;

  // N-gram richness boost (prefer chunks with more n-grams)
  if (metadata.ngramCount > metadata.wordCount) {
    const ngramRichness = Math.min(metadata.ngramCount / metadata.wordCount, 2);
    const ngramBoost = 1 + (ngramRichness - 1) * 0.05; // Up to 5% boost
    boostedSimilarity *= ngramBoost;
  }

  // Ensure similarity doesn't exceed 1.0
  return Math.min(boostedSimilarity, 1.0);
}

/**
 * Get default embedding configuration when config manager is not available
 */
function getDefaultEmbeddingConfig(): EmbeddingConfig {
  return {
    enableTFIDF: true,
    enableStemming: true,
    enableStopwordRemoval: true,
    ngramSizes: [1, 2, 3],
    tfidfWeight: 0.7,
    processingLimits: {
      maxVocabularySize: 10000,
      maxNgramSize: 3,
      maxProcessingTimeMs: 5000,
      maxChunkSize: 2048,
    },
  };
}

/**
 * Get current embedding configuration
 * @returns Current configuration or default if not initialized
 */
export function getEmbeddingConfig(): EmbeddingConfig {
  return configManager?.getConfig() || getDefaultEmbeddingConfig();
}

/**
 * Update embedding configuration
 * @param config - Partial configuration to update
 * @throws Error if config manager not initialized
 */
export function updateEmbeddingConfig(config: Partial<EmbeddingConfig>): void {
  if (!configManager) {
    throw new Error(
      "Enhanced embeddings not initialized. Call initializeEnhancedEmbeddings first."
    );
  }
  configManager.updateConfig(config);
}

/**
 * Check if enhanced embeddings are available
 * @returns True if enhanced features are initialized and available
 */
export function isEnhancedEmbeddingsAvailable(): boolean {
  return enhancedGenerator !== null && configManager !== null;
}

/**
 * Generate embeddings with optional enhancement
 * Provides backward-compatible interface with optional enhanced processing
 *
 * @param content - Text content to process
 * @param useEnhanced - Whether to use enhanced processing if available
 * @param config - Optional configuration for enhanced processing
 * @returns Standard embedding format compatible with original API
 */
export function generateEmbeddingsWithEnhancement(
  content: string,
  useEnhanced: boolean = false,
  config?: EmbeddingConfig
): { chunk: string; embedding: number[] }[] {
  if (useEnhanced && isEnhancedEmbeddingsAvailable()) {
    try {
      const effectiveConfig = config || getEmbeddingConfig();
      const enhanced = generateEnhancedEmbeddings(content, effectiveConfig);

      // Convert enhanced embeddings to standard format
      return enhanced.map((e) => ({
        chunk: e.chunk,
        embedding: e.embedding,
      }));
    } catch (error) {
      console.warn(
        "Enhanced embedding generation failed, falling back to original:",
        error
      );
    }
  }

  // Original implementation
  return generateEmbeddings(content);
}

/**
 * Generate embeddings with automatic migration logic
 * Handles mixed embedding types and provides seamless upgrade path
 *
 * @param content - Text content to process
 * @param existingEmbeddings - Optional existing embeddings to check compatibility
 * @returns Embeddings compatible with existing format or enhanced if starting fresh
 */
export function generateEmbeddingsWithMigration(
  content: string,
  existingEmbeddings?: { chunk: string; embedding: number[] }[]
): {
  embeddings: { chunk: string; embedding: number[] }[];
  migrated: boolean;
  warnings: string[];
} {
  const warnings: string[] = [];
  let migrated = false;

  // If no existing embeddings, use enhanced if available
  if (!existingEmbeddings || existingEmbeddings.length === 0) {
    if (isEnhancedEmbeddingsAvailable()) {
      try {
        const enhanced = generateEnhancedEmbeddings(content);
        migrated = true;
        return {
          embeddings: enhanced.map((e) => ({
            chunk: e.chunk,
            embedding: e.embedding,
          })),
          migrated,
          warnings,
        };
      } catch (error) {
        warnings.push(
          `Enhanced generation failed: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }
    }

    // Fallback to original
    return {
      embeddings: generateEmbeddings(content),
      migrated: false,
      warnings,
    };
  }

  // Check if existing embeddings are compatible with enhanced format
  const hasConsistentDimensions = existingEmbeddings.every(
    (e) => e.embedding.length === existingEmbeddings[0].embedding.length
  );

  if (!hasConsistentDimensions) {
    warnings.push(
      "Existing embeddings have inconsistent dimensions, regenerating all"
    );
    migrated = true;

    if (isEnhancedEmbeddingsAvailable()) {
      try {
        const enhanced = generateEnhancedEmbeddings(content);
        return {
          embeddings: enhanced.map((e) => ({
            chunk: e.chunk,
            embedding: e.embedding,
          })),
          migrated,
          warnings,
        };
      } catch (error) {
        warnings.push(
          `Enhanced generation failed: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }
    }
  }

  // Use same format as existing embeddings
  return {
    embeddings: generateEmbeddings(content),
    migrated: false,
    warnings,
  };
}
/**
 * Performance optimization and error handling utilities
 */

// Processing timeout and limits
const DEFAULT_PROCESSING_LIMITS: ProcessingLimits = {
  maxVocabularySize: 10000,
  maxNgramSize: 3,
  maxProcessingTimeMs: 5000,
  maxChunkSize: 2048,
};

/**
 * Generate embeddings with processing limits and error handling
 * Provides safety mechanisms for large content processing
 *
 * @param content - Text content to process
 * @param config - Optional configuration
 * @param limits - Optional processing limits
 * @returns Embeddings with performance safeguards applied
 */
export function generateEmbeddingsWithLimits(
  content: string,
  config?: EmbeddingConfig,
  limits?: ProcessingLimits
): {
  embeddings: { chunk: string; embedding: number[] }[];
  warnings: string[];
  processingTime: number;
} {
  const monitor = new PerformanceMonitor("embedding_generation_with_limits");
  const effectiveLimits = { ...DEFAULT_PROCESSING_LIMITS, ...limits };
  const startTime = Date.now();
  const warnings: string[] = [];

  logger.debug("EmbeddingSystem", "Starting embedding generation with limits", {
    contentLength: content.length,
    limits: effectiveLimits,
  });

  try {
    // Check content size limits
    if (content.length > effectiveLimits.maxChunkSize * 10) {
      const warning = `Content size (${content.length}) exceeds recommended limit. Processing may be slow.`;
      warnings.push(warning);
      logger.warn("EmbeddingSystem", warning, {
        contentLength: content.length,
        limit: effectiveLimits.maxChunkSize * 10,
      });
    }

    let embeddings: { chunk: string; embedding: number[] }[];

    // Use enhanced generation if available
    if (isEnhancedEmbeddingsAvailable()) {
      try {
        const effectiveConfig = {
          ...getDefaultEmbeddingConfig(),
          ...config,
          processingLimits: effectiveLimits,
        };

        // Apply performance optimizations for large content
        if (content.length > effectiveLimits.maxChunkSize * 5) {
          effectiveConfig.ngramSizes = [1]; // Only 1-grams for large content
          effectiveConfig.tfidfWeight = 0.5; // Reduce TF-IDF weight for performance
          const optimizationWarning =
            "Applied performance optimizations for large content";
          warnings.push(optimizationWarning);
          logger.info("EmbeddingSystem", optimizationWarning, {
            originalNgramSizes: config?.ngramSizes,
            originalTfidfWeight: config?.tfidfWeight,
            newNgramSizes: effectiveConfig.ngramSizes,
            newTfidfWeight: effectiveConfig.tfidfWeight,
          });
        }

        const enhanced = generateEnhancedEmbeddings(content, effectiveConfig);
        embeddings = enhanced.map((e) => ({
          chunk: e.chunk,
          embedding: e.embedding,
        }));
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        const warning = `Enhanced generation failed: ${errorMessage}`;
        warnings.push(warning);
        logger.warn(
          "EmbeddingSystem",
          warning,
          { contentLength: content.length },
          error as Error
        );
        embeddings = generateEmbeddings(content);
      }
    } else {
      logger.debug(
        "EmbeddingSystem",
        "Using basic embedding generation (enhanced not available)"
      );
      embeddings = generateEmbeddings(content);
    }

    // Check processing time
    const processingTime = Date.now() - startTime;
    if (processingTime > effectiveLimits.maxProcessingTimeMs) {
      const timeoutWarning = `Processing time (${processingTime}ms) exceeded limit (${effectiveLimits.maxProcessingTimeMs}ms)`;
      warnings.push(timeoutWarning);
      logger.warn("EmbeddingSystem", timeoutWarning, {
        processingTime,
        limit: effectiveLimits.maxProcessingTimeMs,
        embeddingsGenerated: embeddings.length,
      });
    }

    const perf = monitor.finish(content.length, embeddings.length);
    logger.performance(
      "EmbeddingSystem",
      "Embedding generation with limits completed",
      perf,
      {
        warningsCount: warnings.length,
        embeddingsGenerated: embeddings.length,
      }
    );

    return { embeddings, warnings, processingTime };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const criticalError = `All embedding generation methods failed: ${errorMessage}`;
    warnings.push(criticalError);

    const perf = monitor.finish(content.length, 0);
    logger.error(
      "EmbeddingSystem",
      criticalError,
      { perf, contentLength: content.length },
      error as Error
    );

    return {
      embeddings: [],
      warnings,
      processingTime: Date.now() - startTime,
    };
  }
}

/**
 * Enhanced retrieval with timeout and error handling
 */
export function findMostRelevantChunksWithTimeout(
  question: string,
  embeddings: {
    chunk: string;
    embedding: number[];
    metadata?: ChunkMetadata;
  }[],
  options: EnhancedRetrievalOptions & { timeoutMs?: number } = {}
): Promise<RelevanceResult[]> {
  const { timeoutMs = 3000, ...retrievalOptions } = options;

  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(`Retrieval timeout after ${timeoutMs}ms`));
    }, timeoutMs);

    try {
      const result = findMostRelevantChunksEnhanced(
        question,
        embeddings,
        retrievalOptions
      );
      clearTimeout(timeoutId);
      resolve(result);
    } catch (error) {
      clearTimeout(timeoutId);

      // Fallback to basic retrieval
      try {
        const basicEmbeddings = embeddings.map((e) => ({
          chunk: e.chunk,
          embedding: e.embedding,
        }));
        const basicResults = findMostRelevantChunks(
          question,
          basicEmbeddings,
          retrievalOptions.topK
        );
        const fallbackResults: RelevanceResult[] = basicResults.map(
          (chunk) => ({
            chunk,
            similarity: 0.5, // Default similarity for fallback
            metadata: embeddings.find((e) => e.chunk === chunk)?.metadata,
          })
        );
        resolve(fallbackResults);
      } catch (fallbackError) {
        reject(fallbackError);
      }
    }
  });
}

/**
 * Validate embeddings before processing
 */
export function validateEmbeddings(
  embeddings: { chunk: string; embedding: number[] }[]
): {
  isValid: boolean;
  errors: string[];
  validEmbeddings: { chunk: string; embedding: number[] }[];
} {
  const errors: string[] = [];
  const validEmbeddings: { chunk: string; embedding: number[] }[] = [];

  if (!Array.isArray(embeddings)) {
    errors.push("Embeddings must be an array");
    return { isValid: false, errors, validEmbeddings: [] };
  }

  if (embeddings.length === 0) {
    errors.push("Embeddings array is empty");
    return { isValid: false, errors, validEmbeddings: [] };
  }

  let expectedDimension: number | null = null;

  for (let i = 0; i < embeddings.length; i++) {
    const embedding = embeddings[i];

    // Check structure
    if (!embedding || typeof embedding !== "object") {
      errors.push(`Embedding at index ${i} is not an object`);
      continue;
    }

    if (typeof embedding.chunk !== "string") {
      errors.push(`Embedding at index ${i} has invalid chunk (must be string)`);
      continue;
    }

    if (!Array.isArray(embedding.embedding)) {
      errors.push(
        `Embedding at index ${i} has invalid embedding (must be array)`
      );
      continue;
    }

    // Check embedding vector
    if (embedding.embedding.length === 0) {
      errors.push(`Embedding at index ${i} has empty embedding vector`);
      continue;
    }

    // Check dimension consistency
    if (expectedDimension === null) {
      expectedDimension = embedding.embedding.length;
    } else if (embedding.embedding.length !== expectedDimension) {
      errors.push(
        `Embedding at index ${i} has inconsistent dimension (expected ${expectedDimension}, got ${embedding.embedding.length})`
      );
      continue;
    }

    // Check for valid numbers
    const hasInvalidNumbers = embedding.embedding.some(
      (val) => typeof val !== "number" || !isFinite(val)
    );
    if (hasInvalidNumbers) {
      errors.push(`Embedding at index ${i} contains invalid numbers`);
      continue;
    }

    // Check for non-zero embedding
    const isAllZeros = embedding.embedding.every((val) => val === 0);
    if (isAllZeros) {
      errors.push(`Embedding at index ${i} is all zeros`);
      continue;
    }

    // If we get here, the embedding is valid
    validEmbeddings.push(embedding);
  }

  return {
    isValid: errors.length === 0,
    errors,
    validEmbeddings,
  };
}

/**
 * Handle edge cases in text processing
 */
export function preprocessTextForEmbedding(text: string): {
  processedText: string;
  warnings: string[];
} {
  const warnings: string[] = [];
  let processedText = text;

  // Handle empty or whitespace-only text
  if (!text || text.trim().length === 0) {
    warnings.push("Input text is empty or contains only whitespace");
    return { processedText: "", warnings };
  }

  // Handle very short text
  if (text.trim().length < 3) {
    warnings.push("Input text is very short (less than 3 characters)");
  }

  // Handle very long text
  if (text.length > DEFAULT_PROCESSING_LIMITS.maxChunkSize * 20) {
    warnings.push(
      `Input text is very long (${text.length} characters). Consider chunking for better performance.`
    );
    // Truncate if extremely long
    processedText = text.substring(
      0,
      DEFAULT_PROCESSING_LIMITS.maxChunkSize * 20
    );
  }

  // Handle special characters and encoding issues
  try {
    // Remove null bytes and other problematic characters
    processedText = processedText.replace(/\0/g, "").replace(/\uFFFD/g, "");

    // Normalize unicode
    processedText = processedText.normalize("NFC");
  } catch (error) {
    warnings.push("Text normalization failed, using original text");
    processedText = text;
  }

  // Handle excessive whitespace
  const originalLength = processedText.length;
  processedText = processedText.replace(/\s+/g, " ").trim();
  if (processedText.length < originalLength * 0.5) {
    warnings.push("Text contained excessive whitespace that was normalized");
  }

  return { processedText, warnings };
}

/**
 * Memory-efficient batch processing for large document collections
 */
export function generateEmbeddingsBatch(
  contents: string[],
  batchSize: number = 10,
  config?: EmbeddingConfig
): { chunk: string; embedding: number[]; sourceIndex: number }[] {
  const results: { chunk: string; embedding: number[]; sourceIndex: number }[] =
    [];

  for (let i = 0; i < contents.length; i += batchSize) {
    const batch = contents.slice(i, i + batchSize);

    for (let j = 0; j < batch.length; j++) {
      const content = batch[j];
      const sourceIndex = i + j;

      try {
        const result = generateEmbeddingsWithLimits(content, config);

        for (const embedding of result.embeddings) {
          results.push({
            ...embedding,
            sourceIndex,
          });
        }
      } catch (error) {
        console.error(
          `Failed to process document at index ${sourceIndex}:`,
          error
        );
        // Continue with next document
      }
    }

    // Allow garbage collection between batches
    if (i + batchSize < contents.length) {
      // Small delay to allow GC
      setTimeout(() => {}, 0);
    }
  }

  return results;
}

/**
 * Performance monitoring utilities
 */
export interface PerformanceMetrics {
  processingTime: number;
  memoryUsage: number;
  chunkCount: number;
  vocabularySize: number;
  averageEmbeddingDimension: number;
  usedEnhanced: boolean;
}

/**
 * Measure performance of embedding generation
 * @param content - Text content to process
 * @param config - Optional configuration
 * @returns Embeddings and performance metrics
 */
export function measureEmbeddingPerformance(
  content: string,
  config?: EmbeddingConfig
): {
  embeddings: { chunk: string; embedding: number[] }[];
  metrics: PerformanceMetrics;
} {
  const startTime = Date.now();
  const startMemory = process.memoryUsage().heapUsed;

  let embeddings: { chunk: string; embedding: number[] }[];
  let usedEnhanced = false;

  // Try enhanced generation if available
  if (isEnhancedEmbeddingsAvailable() && config) {
    try {
      const enhanced = generateEnhancedEmbeddings(content, config);
      embeddings = enhanced.map((e) => ({
        chunk: e.chunk,
        embedding: e.embedding,
      }));
      usedEnhanced = true;
    } catch (error) {
      console.warn("Enhanced generation failed, using original:", error);
      embeddings = generateEmbeddings(content);
    }
  } else {
    embeddings = generateEmbeddings(content);
  }

  const endTime = Date.now();
  const endMemory = process.memoryUsage().heapUsed;

  const metrics: PerformanceMetrics = {
    processingTime: endTime - startTime,
    memoryUsage: endMemory - startMemory,
    chunkCount: embeddings.length,
    vocabularySize: embeddings.length > 0 ? embeddings[0].embedding.length : 0,
    averageEmbeddingDimension:
      embeddings.length > 0
        ? embeddings.reduce((sum, e) => sum + e.embedding.length, 0) /
          embeddings.length
        : 0,
    usedEnhanced,
  };

  return { embeddings, metrics };
}

/**
 * Compare performance between original and enhanced embedding generation
 * @param content - Text content to process
 * @param config - Configuration for enhanced generation
 * @returns Comparison results
 */
export function compareEmbeddingPerformance(
  content: string,
  config?: EmbeddingConfig
): {
  original: {
    embeddings: { chunk: string; embedding: number[] }[];
    metrics: PerformanceMetrics;
  };
  enhanced: {
    embeddings: { chunk: string; embedding: number[] }[];
    metrics: PerformanceMetrics;
  } | null;
  comparison: {
    speedImprovement: number;
    memoryImprovement: number;
    dimensionChange: number;
  } | null;
} {
  // Measure original performance
  const originalResult = {
    embeddings: generateEmbeddings(content),
    metrics: {
      processingTime: 0,
      memoryUsage: 0,
      chunkCount: 0,
      vocabularySize: 0,
      averageEmbeddingDimension: 0,
      usedEnhanced: false,
    } as PerformanceMetrics,
  };

  const startTime = Date.now();
  const startMemory = process.memoryUsage().heapUsed;

  originalResult.embeddings = generateEmbeddings(content);

  const endTime = Date.now();
  const endMemory = process.memoryUsage().heapUsed;

  originalResult.metrics = {
    processingTime: endTime - startTime,
    memoryUsage: endMemory - startMemory,
    chunkCount: originalResult.embeddings.length,
    vocabularySize:
      originalResult.embeddings.length > 0
        ? originalResult.embeddings[0].embedding.length
        : 0,
    averageEmbeddingDimension:
      originalResult.embeddings.length > 0
        ? originalResult.embeddings.reduce(
            (sum, e) => sum + e.embedding.length,
            0
          ) / originalResult.embeddings.length
        : 0,
    usedEnhanced: false,
  };

  // Measure enhanced performance if available
  let enhancedResult: {
    embeddings: { chunk: string; embedding: number[] }[];
    metrics: PerformanceMetrics;
  } | null = null;
  let comparison: {
    speedImprovement: number;
    memoryImprovement: number;
    dimensionChange: number;
  } | null = null;

  if (isEnhancedEmbeddingsAvailable()) {
    try {
      enhancedResult = measureEmbeddingPerformance(content, config);

      // Calculate comparison metrics
      comparison = {
        speedImprovement:
          originalResult.metrics.processingTime /
          enhancedResult.metrics.processingTime,
        memoryImprovement:
          originalResult.metrics.memoryUsage /
          enhancedResult.metrics.memoryUsage,
        dimensionChange:
          enhancedResult.metrics.averageEmbeddingDimension /
          originalResult.metrics.averageEmbeddingDimension,
      };
    } catch (error) {
      console.warn("Enhanced performance measurement failed:", error);
    }
  }

  return {
    original: originalResult,
    enhanced: enhancedResult,
    comparison,
  };
}

/**
 * Graceful degradation when enhanced features fail
 */
export function generateEmbeddingsWithFallback(
  content: string,
  preferEnhanced: boolean = true
): {
  embeddings: { chunk: string; embedding: number[] }[];
  usedEnhanced: boolean;
  warnings: string[];
} {
  const monitor = new PerformanceMonitor("embedding_generation_with_fallback");
  const warnings: string[] = [];

  logger.debug(
    "EmbeddingSystem",
    "Starting embedding generation with fallback",
    {
      contentLength: content.length,
      preferEnhanced,
      enhancedAvailable: !!(enhancedGenerator && configManager),
    }
  );

  // Preprocess text
  const { processedText, warnings: preprocessWarnings } =
    preprocessTextForEmbedding(content);
  warnings.push(...preprocessWarnings);

  if (processedText.length === 0) {
    logger.warn(
      "EmbeddingSystem",
      "Processed text is empty after preprocessing",
      {
        originalLength: content.length,
        preprocessWarnings,
      }
    );
    const perf = monitor.finish(content.length, 0);
    logger.performance(
      "EmbeddingSystem",
      "Embedding generation with fallback completed (empty result)",
      perf
    );
    return { embeddings: [], usedEnhanced: false, warnings };
  }

  // Try enhanced generation first if preferred and available
  if (preferEnhanced && enhancedGenerator && configManager) {
    try {
      logger.debug(
        "EmbeddingSystem",
        "Attempting enhanced embedding generation"
      );
      const embeddings =
        enhancedGenerator.generateCompatibleEmbeddings(processedText);

      const perf = monitor.finish(content.length, embeddings.length);
      logger.performance(
        "EmbeddingSystem",
        "Enhanced embedding generation with fallback completed",
        perf,
        {
          embeddingsGenerated: embeddings.length,
          usedEnhanced: true,
        }
      );

      return { embeddings, usedEnhanced: true, warnings };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const warning = `Enhanced generation failed: ${errorMessage}`;
      warnings.push(warning);
      logger.warn(
        "EmbeddingSystem",
        warning,
        {
          processedTextLength: processedText.length,
        },
        error as Error
      );
    }
  }

  // Fallback to basic generation
  try {
    logger.debug(
      "EmbeddingSystem",
      "Falling back to basic embedding generation"
    );
    const embeddings = generateEmbeddings(processedText);

    const perf = monitor.finish(content.length, embeddings.length);
    logger.performance(
      "EmbeddingSystem",
      "Basic embedding generation with fallback completed",
      perf,
      {
        embeddingsGenerated: embeddings.length,
        usedEnhanced: false,
      }
    );

    return { embeddings, usedEnhanced: false, warnings };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const criticalError = `Basic generation failed: ${errorMessage}`;
    warnings.push(criticalError);

    const perf = monitor.finish(content.length, 0);
    logger.error(
      "EmbeddingSystem",
      "All embedding generation methods failed",
      {
        perf,
        processedTextLength: processedText.length,
        originalContentLength: content.length,
      },
      error as Error
    );

    return { embeddings: [], usedEnhanced: false, warnings };
  }
}
/**
 * Get system health and diagnostics for the embedding system
 */
export function getEmbeddingSystemHealth(): {
  status: "healthy" | "degraded" | "critical";
  components: {
    enhancedGenerator: boolean;
    configManager: boolean;
    textProcessor: boolean;
  };
  configuration: EmbeddingConfig | null;
  recentPerformance: {
    averageProcessingTime: number;
    totalOperations: number;
    errorRate: number;
  };
  recommendations: string[];
} {
  const recommendations: string[] = [];

  // Check component availability
  const components = {
    enhancedGenerator: !!enhancedGenerator,
    configManager: !!configManager,
    textProcessor: true, // TextProcessor is always available
  };

  // Get current configuration
  const configuration = configManager?.getConfig() || null;

  // Get performance metrics from logger
  const performanceMetrics = logger.getPerformanceMetrics();
  const errorLogs = logger.getErrorLogs();
  const recentLogs = logger.getRecentLogs(50);
  const errorRate =
    recentLogs.length > 0 ? errorLogs.length / recentLogs.length : 0;

  // Determine system status
  let status: "healthy" | "degraded" | "critical" = "healthy";

  if (!components.enhancedGenerator || !components.configManager) {
    status = "degraded";
    recommendations.push(
      "Enhanced embeddings not initialized. Call initializeEnhancedEmbeddings()."
    );
  }

  if (errorRate > 0.1) {
    status = "critical";
    recommendations.push("High error rate detected. Check recent error logs.");
  } else if (errorRate > 0.05) {
    status = "degraded";
    recommendations.push("Elevated error rate. Monitor system performance.");
  }

  if (performanceMetrics.averageDuration > 5000) {
    status = status === "healthy" ? "degraded" : status;
    recommendations.push(
      "Slow processing detected. Consider reducing vocabulary size or n-gram complexity."
    );
  }

  // Configuration-based recommendations
  if (configuration) {
    if (
      configuration.ngramSizes.includes(3) &&
      configuration.processingLimits.maxVocabularySize > 5000
    ) {
      recommendations.push(
        "Large vocabulary with 3-grams may impact performance. Consider reducing vocabulary size."
      );
    }

    if (
      !configuration.enableTFIDF &&
      !configuration.enableStemming &&
      !configuration.enableStopwordRemoval
    ) {
      recommendations.push(
        "All enhanced features disabled. Consider enabling TF-IDF for better relevance."
      );
    }
  }

  return {
    status,
    components,
    configuration,
    recentPerformance: {
      averageProcessingTime: performanceMetrics.averageDuration,
      totalOperations: performanceMetrics.totalOperations,
      errorRate,
    },
    recommendations,
  };
}

/**
 * Log system diagnostics for debugging
 */
export function logSystemDiagnostics(): void {
  const health = getEmbeddingSystemHealth();

  logger.info("EmbeddingSystem", "System diagnostics", {
    status: health.status,
    components: health.components,
    performance: health.recentPerformance,
    recommendationsCount: health.recommendations.length,
  });

  if (health.recommendations.length > 0) {
    logger.info("EmbeddingSystem", "System recommendations", {
      recommendations: health.recommendations,
    });
  }
}

/**
 * Validate embeddings with comprehensive error reporting
 */
export function validateEmbeddingsEnhanced(
  embeddings: { chunk: string; embedding: number[] }[]
): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  validEmbeddings: { chunk: string; embedding: number[] }[];
  statistics: {
    totalEmbeddings: number;
    validEmbeddings: number;
    averageDimension: number;
    dimensionConsistency: boolean;
  };
} {
  const monitor = new PerformanceMonitor("embedding_validation");

  logger.debug("EmbeddingSystem", "Starting embedding validation", {
    embeddingsCount: embeddings.length,
  });

  const errors: string[] = [];
  const warnings: string[] = [];
  const validEmbeddings: { chunk: string; embedding: number[] }[] = [];

  if (!Array.isArray(embeddings)) {
    const error = "Embeddings must be an array";
    errors.push(error);
    logger.error("EmbeddingSystem", error);
    return {
      isValid: false,
      errors,
      warnings,
      validEmbeddings: [],
      statistics: {
        totalEmbeddings: 0,
        validEmbeddings: 0,
        averageDimension: 0,
        dimensionConsistency: false,
      },
    };
  }

  if (embeddings.length === 0) {
    const warning = "Embeddings array is empty";
    warnings.push(warning);
    logger.warn("EmbeddingSystem", warning);
  }

  let expectedDimension: number | null = null;
  let totalDimension = 0;
  let dimensionConsistency = true;

  for (let i = 0; i < embeddings.length; i++) {
    const embedding = embeddings[i];

    // Check structure
    if (!embedding || typeof embedding !== "object") {
      errors.push(`Embedding at index ${i} is not an object`);
      continue;
    }

    if (typeof embedding.chunk !== "string") {
      errors.push(`Embedding at index ${i} has invalid chunk (must be string)`);
      continue;
    }

    if (!Array.isArray(embedding.embedding)) {
      errors.push(
        `Embedding at index ${i} has invalid embedding (must be array)`
      );
      continue;
    }

    // Check embedding vector
    if (embedding.embedding.length === 0) {
      errors.push(`Embedding at index ${i} has empty embedding vector`);
      continue;
    }

    // Check dimension consistency
    if (expectedDimension === null) {
      expectedDimension = embedding.embedding.length;
    } else if (embedding.embedding.length !== expectedDimension) {
      dimensionConsistency = false;
      errors.push(
        `Embedding at index ${i} has inconsistent dimension (expected ${expectedDimension}, got ${embedding.embedding.length})`
      );
      continue;
    }

    // Check for valid numbers
    const hasInvalidNumbers = embedding.embedding.some(
      (val) => typeof val !== "number" || !isFinite(val)
    );
    if (hasInvalidNumbers) {
      errors.push(`Embedding at index ${i} contains invalid numbers`);
      continue;
    }

    // Check for non-zero embedding
    const isAllZeros = embedding.embedding.every((val) => val === 0);
    if (isAllZeros) {
      warnings.push(`Embedding at index ${i} is all zeros`);
    }

    // If we get here, the embedding is valid
    validEmbeddings.push(embedding);
    totalDimension += embedding.embedding.length;
  }

  const statistics = {
    totalEmbeddings: embeddings.length,
    validEmbeddings: validEmbeddings.length,
    averageDimension:
      validEmbeddings.length > 0 ? totalDimension / validEmbeddings.length : 0,
    dimensionConsistency,
  };

  const perf = monitor.finish(embeddings.length, validEmbeddings.length);
  logger.performance(
    "EmbeddingSystem",
    "Embedding validation completed",
    perf,
    {
      statistics,
      errorsCount: errors.length,
      warningsCount: warnings.length,
    }
  );

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    validEmbeddings,
    statistics,
  };
}
