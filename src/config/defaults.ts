import { EmbeddingConfig, Language, ProcessingLimits } from "../types/config";

/**
 * Default processing limits to prevent performance issues
 */
export const DEFAULT_PROCESSING_LIMITS: ProcessingLimits = {
  maxVocabularySize: 10000,
  maxNgramSize: 3,
  maxProcessingTimeMs: 5000,
  maxChunkSize: 2048,
};

/**
 * Default configuration optimized for better context retrieval
 * Balanced approach that provides more context while maintaining quality
 */
export const DEFAULT_EMBEDDING_CONFIG: EmbeddingConfig = {
  enableTFIDF: true,
  enableStemming: false, // Disable stemming by default to preserve exact terms
  enableStopwordRemoval: true, // Using reduced stopwords list
  ngramSizes: [1, 2], // 1-grams and 2-grams by default
  tfidfWeight: 0.1, // Very low TF-IDF weight: 10% TF-IDF, 90% simple count
  language: Language.ENGLISH, // Default fallback language
  customStopwords: undefined,
  processingLimits: DEFAULT_PROCESSING_LIMITS,
  vocabularyOptions: {
    maxVocabularySize: 15000, // Increased vocabulary size
    minDocumentFrequency: 1, // Keep all terms that appear at least once
    ngramSizes: [1, 2],
  },
  tfidfOptions: {
    useLogTF: false, // Disable log TF for simpler calculation
    useSmoothedIDF: true, // Keep smoothed IDF to avoid division by zero
  },
};

/**
 * Minimal configuration for backward compatibility
 */
export const MINIMAL_EMBEDDING_CONFIG: EmbeddingConfig = {
  enableTFIDF: false,
  enableStemming: false,
  enableStopwordRemoval: false,
  ngramSizes: [1], // Only 1-grams (equivalent to current BoW)
  tfidfWeight: 0.0, // Pure simple count
  language: Language.ENGLISH,
  customStopwords: undefined,
  processingLimits: DEFAULT_PROCESSING_LIMITS,
  vocabularyOptions: {
    maxVocabularySize: 5000,
    minDocumentFrequency: 1,
    ngramSizes: [1],
  },
  tfidfOptions: {
    useLogTF: false,
    useSmoothedIDF: false,
  },
};

/**
 * Optimized configuration for technical documentation
 * Provides maximum context while maintaining relevance
 */
export const TECHNICAL_EMBEDDING_CONFIG: EmbeddingConfig = {
  enableTFIDF: true,
  enableStemming: true, // Conservative stemming for technical terms
  enableStopwordRemoval: true, // Minimal stopwords removal
  ngramSizes: [1, 2, 3], // Include 3-grams for technical phrases
  tfidfWeight: 0.2, // Low TF-IDF weight: 20% TF-IDF, 80% simple count
  language: Language.ENGLISH,
  customStopwords: undefined,
  processingLimits: {
    ...DEFAULT_PROCESSING_LIMITS,
    maxVocabularySize: 20000, // Larger vocabulary for technical terms
  },
  vocabularyOptions: {
    maxVocabularySize: 20000,
    minDocumentFrequency: 1,
    ngramSizes: [1, 2, 3],
  },
  tfidfOptions: {
    useLogTF: false, // Simple TF calculation
    useSmoothedIDF: true, // Smoothed IDF to handle small corpora
  },
};

/**
 * Balanced configuration for general use
 * Good compromise between context quantity and quality
 */
export const BALANCED_EMBEDDING_CONFIG: EmbeddingConfig = {
  enableTFIDF: true,
  enableStemming: false, // Disable stemming to preserve exact terms
  enableStopwordRemoval: true, // Minimal stopwords
  ngramSizes: [1, 2], // 1-grams and 2-grams
  tfidfWeight: 0.1, // Very low TF-IDF weight: 10% TF-IDF, 90% simple count
  language: Language.ENGLISH,
  customStopwords: undefined,
  processingLimits: DEFAULT_PROCESSING_LIMITS,
  vocabularyOptions: {
    maxVocabularySize: 12000,
    minDocumentFrequency: 1,
    ngramSizes: [1, 2],
  },
  tfidfOptions: {
    useLogTF: false,
    useSmoothedIDF: true,
  },
};
