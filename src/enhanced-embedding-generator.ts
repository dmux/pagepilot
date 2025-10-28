/**
 * Enhanced Embedding Generator
 * Integrates text processing pipeline with vectorization for improved semantic retrieval
 */

import {
  TextProcessor,
  ProcessedText,
  Language,
  ProcessingOptions,
} from "./text-processor";
import { VocabularyBuilder, Vocabulary } from "./vocabulary-builder";
import { TFIDFCalculator } from "./tfidf-calculator";
import {
  EmbeddingConfig,
  VocabularyOptions,
  TFIDFOptions,
} from "./types/config";

export interface ChunkMetadata {
  language: Language;
  wordCount: number;
  ngramCount: number;
  processingTime: number;
}

export interface EnhancedEmbedding {
  chunk: string;
  embedding: number[];
  metadata: ChunkMetadata;
}

/**
 * Enhanced Embedding Generator that integrates all text processing components
 */
export class EnhancedEmbeddingGenerator {
  private textProcessor: TextProcessor;
  private vocabularyBuilder: VocabularyBuilder;
  private tfidfCalculator: TFIDFCalculator;

  constructor() {
    this.textProcessor = new TextProcessor();
    this.vocabularyBuilder = new VocabularyBuilder();
    this.tfidfCalculator = new TFIDFCalculator();
  }

  /**
   * Generate enhanced embeddings with metadata tracking
   */
  generateEnhancedEmbeddings(
    content: string,
    config: EmbeddingConfig = this.getDefaultConfig()
  ): EnhancedEmbedding[] {
    const startTime = Date.now();

    // Chunk the content (reuse existing chunking logic)
    const chunks = this.chunkText(content);
    if (chunks.length === 0) {
      return [];
    }

    // Auto-optimize configuration based on content if not explicitly configured
    const optimizedConfig = this.shouldOptimizeConfig(config)
      ? this.optimizeConfigForContent(chunks, config)
      : config;

    // Process all chunks
    const processedTexts: ProcessedText[] = [];
    const processingOptions: ProcessingOptions = {
      enableStemming: optimizedConfig.enableStemming,
      enableStopwordRemoval: optimizedConfig.enableStopwordRemoval,
      language: optimizedConfig.language,
      ngramSize: optimizedConfig.ngramSizes,
    };

    for (const chunk of chunks) {
      const processed = this.textProcessor.processText(
        chunk,
        processingOptions
      );
      processedTexts.push(processed);
    }

    // Build vocabulary from all processed texts
    this.vocabularyBuilder = new VocabularyBuilder(
      optimizedConfig.vocabularyOptions
    );
    const vocabulary = this.vocabularyBuilder.buildVocabulary(processedTexts);

    // Configure TF-IDF calculator
    this.tfidfCalculator = new TFIDFCalculator({
      ...config.tfidfOptions,
      tfidfWeight: config.tfidfWeight,
    });

    // Generate embeddings for each chunk
    const embeddings: EnhancedEmbedding[] = [];

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const processedText = processedTexts[i];
      const chunkStartTime = Date.now();

      let embedding: number[];

      if (config.enableTFIDF && vocabulary.terms.length > 0) {
        // Use TF-IDF weighted embedding
        embedding = this.tfidfCalculator.createWeightedEmbedding(
          processedText,
          vocabulary
        );
      } else {
        // Fallback to simple BoW
        embedding = this.createSimpleBoW(processedText, vocabulary);
      }

      // Skip chunks with empty embeddings
      if (embedding.some((v) => v > 0)) {
        const metadata: ChunkMetadata = {
          language: processedText.language,
          wordCount: processedText.words.length,
          ngramCount: processedText.ngrams.length,
          processingTime: Date.now() - chunkStartTime,
        };

        embeddings.push({
          chunk,
          embedding,
          metadata,
        });
      }
    }

    return embeddings;
  }

  /**
   * Generate backward-compatible embeddings (maintains existing API)
   */
  generateCompatibleEmbeddings(
    content: string
  ): { chunk: string; embedding: number[] }[] {
    const enhancedEmbeddings = this.generateEnhancedEmbeddings(content);

    // Convert to backward-compatible format
    return enhancedEmbeddings.map((e) => ({
      chunk: e.chunk,
      embedding: e.embedding,
    }));
  }

  /**
   * Generate embedding for a single text using existing vocabulary
   */
  generateSingleEmbedding(
    text: string,
    vocabulary: Vocabulary,
    config: EmbeddingConfig = this.getDefaultConfig()
  ): number[] {
    const processingOptions: ProcessingOptions = {
      enableStemming: config.enableStemming,
      enableStopwordRemoval: config.enableStopwordRemoval,
      language: config.language,
      ngramSize: config.ngramSizes,
    };

    const processedText = this.textProcessor.processText(
      text,
      processingOptions
    );

    if (config.enableTFIDF && vocabulary.terms.length > 0) {
      // Configure TF-IDF calculator with current config
      const calculator = new TFIDFCalculator({
        ...config.tfidfOptions,
        tfidfWeight: config.tfidfWeight,
      });
      return calculator.createWeightedEmbedding(processedText, vocabulary);
    } else {
      return this.createSimpleBoW(processedText, vocabulary);
    }
  }

  /**
   * Create simple Bag-of-Words embedding
   */
  private createSimpleBoW(
    processedText: ProcessedText,
    vocabulary: Vocabulary
  ): number[] {
    const bow = new Array(vocabulary.terms.length).fill(0);

    // Count occurrences of each term
    const termCounts = new Map<string, number>();
    for (const ngram of processedText.ngrams) {
      if (ngram.trim().length > 0) {
        termCounts.set(ngram, (termCounts.get(ngram) || 0) + 1);
      }
    }

    // Fill the BoW vector
    for (let i = 0; i < vocabulary.terms.length; i++) {
      const term = vocabulary.terms[i];
      bow[i] = termCounts.get(term) || 0;
    }

    return bow;
  }

  /**
   * Chunk text into smaller pieces (reuse existing logic)
   */
  private chunkText(text: string): string[] {
    const MAX_CHUNK_SIZE = 512;
    const sentences = text.split(/[.!?]/);
    const chunks: string[] = [];
    let currentChunk = "";

    for (const sentence of sentences) {
      if (currentChunk.length + sentence.length > MAX_CHUNK_SIZE) {
        if (currentChunk.trim()) {
          chunks.push(currentChunk.trim());
        }
        currentChunk = sentence;
      } else {
        currentChunk += sentence;
      }
    }

    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }

    return chunks.filter((chunk) => chunk.length > 0);
  }

  /**
   * Get default configuration (now optimized for better context retrieval)
   */
  getDefaultConfig(): EmbeddingConfig {
    return {
      enableTFIDF: true,
      enableStemming: false, // Disable stemming by default to preserve exact terms
      enableStopwordRemoval: true, // Using reduced stopwords list
      ngramSizes: [1, 2], // Start with 1-grams and 2-grams
      tfidfWeight: 0.1, // Very low TF-IDF weight: 10% TF-IDF, 90% simple count
      processingLimits: {
        maxVocabularySize: 15000, // Increased vocabulary size
        maxNgramSize: 3,
        maxProcessingTimeMs: 5000,
        maxChunkSize: 2048,
      },
      vocabularyOptions: {
        maxVocabularySize: 15000, // Increased vocabulary size
        minDocumentFrequency: 1,
        ngramSizes: [1, 2],
      },
      tfidfOptions: {
        useLogTF: false, // Disable log TF for simpler calculation
        useSmoothedIDF: true, // Keep smoothed IDF for small corpora
      },
    };
  }

  /**
   * Update configuration for existing instance
   */
  updateConfig(config: Partial<EmbeddingConfig>): void {
    const fullConfig = { ...this.getDefaultConfig(), ...config };

    // Update component configurations
    if (config.vocabularyOptions) {
      this.vocabularyBuilder = new VocabularyBuilder(config.vocabularyOptions);
    }

    if (config.tfidfOptions || config.tfidfWeight !== undefined) {
      this.tfidfCalculator = new TFIDFCalculator({
        ...fullConfig.tfidfOptions,
        tfidfWeight: fullConfig.tfidfWeight,
      });
    }
  }

  /**
   * Get processing statistics
   */
  getProcessingStats(embeddings: EnhancedEmbedding[]): {
    totalChunks: number;
    averageWordCount: number;
    averageNgramCount: number;
    averageProcessingTime: number;
    languageDistribution: Record<string, number>;
  } {
    if (embeddings.length === 0) {
      return {
        totalChunks: 0,
        averageWordCount: 0,
        averageNgramCount: 0,
        averageProcessingTime: 0,
        languageDistribution: {},
      };
    }

    const totalWordCount = embeddings.reduce(
      (sum, e) => sum + e.metadata.wordCount,
      0
    );
    const totalNgramCount = embeddings.reduce(
      (sum, e) => sum + e.metadata.ngramCount,
      0
    );
    const totalProcessingTime = embeddings.reduce(
      (sum, e) => sum + e.metadata.processingTime,
      0
    );

    const languageDistribution: Record<string, number> = {};
    for (const embedding of embeddings) {
      const lang = embedding.metadata.language;
      languageDistribution[lang] = (languageDistribution[lang] || 0) + 1;
    }

    return {
      totalChunks: embeddings.length,
      averageWordCount: totalWordCount / embeddings.length,
      averageNgramCount: totalNgramCount / embeddings.length,
      averageProcessingTime: totalProcessingTime / embeddings.length,
      languageDistribution,
    };
  }

  /**
   * Validate embedding configuration
   */
  validateConfig(config: EmbeddingConfig): string[] {
    const errors: string[] = [];

    if (config.tfidfWeight < 0 || config.tfidfWeight > 1) {
      errors.push("tfidfWeight must be between 0 and 1");
    }

    if (config.ngramSizes.some((n) => n < 1 || n > 5)) {
      errors.push("ngramSizes must contain values between 1 and 5");
    }

    if (
      config.vocabularyOptions?.maxVocabularySize &&
      config.vocabularyOptions.maxVocabularySize < 1
    ) {
      errors.push("maxVocabularySize must be greater than 0");
    }

    return errors;
  }

  /**
   * Check if configuration should be auto-optimized
   */
  private shouldOptimizeConfig(config: EmbeddingConfig): boolean {
    // Auto-optimize if using default configuration or if explicitly requested
    const defaultConfig = this.getDefaultConfig();
    return (
      config.tfidfWeight === defaultConfig.tfidfWeight &&
      JSON.stringify(config.ngramSizes) ===
        JSON.stringify(defaultConfig.ngramSizes)
    );
  }

  /**
   * Optimize configuration based on content characteristics
   */
  private optimizeConfigForContent(
    chunks: string[],
    baseConfig: EmbeddingConfig
  ): EmbeddingConfig {
    const optimizedConfig = { ...baseConfig };

    // Analyze content characteristics
    const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const averageChunkLength = totalLength / chunks.length;
    const hasCodeBlocks = chunks.some(
      (chunk) =>
        chunk.includes("```") ||
        chunk.includes("function") ||
        chunk.includes("const ") ||
        chunk.includes("import ")
    );
    const hasTechnicalTerms = chunks.some(
      (chunk) =>
        /[a-z][A-Z]/.test(chunk) || chunk.includes("_") || chunk.includes(".")
    );

    // Adjust configuration based on analysis
    if (chunks.length <= 3) {
      // Small number of chunks - reduce TF-IDF weight to avoid over-filtering
      optimizedConfig.tfidfWeight = Math.min(optimizedConfig.tfidfWeight, 0.2);
    }

    if (hasCodeBlocks || hasTechnicalTerms) {
      // Technical content - disable stemming to preserve exact terms
      optimizedConfig.enableStemming = false;
      // Increase vocabulary size for technical terms
      if (optimizedConfig.vocabularyOptions) {
        optimizedConfig.vocabularyOptions.maxVocabularySize = Math.max(
          optimizedConfig.vocabularyOptions.maxVocabularySize,
          15000
        );
      }
    }

    if (averageChunkLength > 1000) {
      // Long chunks - include 3-grams for better context
      if (!optimizedConfig.ngramSizes.includes(3)) {
        optimizedConfig.ngramSizes = [...optimizedConfig.ngramSizes, 3];
        if (optimizedConfig.vocabularyOptions) {
          optimizedConfig.vocabularyOptions.ngramSizes =
            optimizedConfig.ngramSizes;
        }
      }
    } else if (averageChunkLength < 200) {
      // Short chunks - stick to 1-grams and 2-grams
      optimizedConfig.ngramSizes = optimizedConfig.ngramSizes.filter(
        (n) => n <= 2
      );
      if (optimizedConfig.vocabularyOptions) {
        optimizedConfig.vocabularyOptions.ngramSizes =
          optimizedConfig.ngramSizes;
      }
    }

    return optimizedConfig;
  }
}

// Export a default instance for convenience
export const enhancedEmbeddingGenerator = new EnhancedEmbeddingGenerator();
