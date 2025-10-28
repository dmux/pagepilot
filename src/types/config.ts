/**
 * Configuration types for the enhanced embedding system
 */

export enum Language {
  ENGLISH = "en",
  PORTUGUESE = "pt",
}

export interface ProcessingLimits {
  maxVocabularySize: number;
  maxNgramSize: number;
  maxProcessingTimeMs: number;
  maxChunkSize: number;
}

export interface EmbeddingConfig {
  enableTFIDF: boolean;
  enableStemming: boolean;
  enableStopwordRemoval: boolean;
  ngramSizes: number[];
  tfidfWeight: number; // 0-1, weight between TF-IDF and simple count
  language?: Language;
  customStopwords?: string[];
  processingLimits: ProcessingLimits;
  vocabularyOptions?: VocabularyOptions;
  tfidfOptions?: TFIDFOptions;
}

export interface VocabularyOptions {
  maxVocabularySize: number;
  minDocumentFrequency: number;
  ngramSizes: number[];
}

export interface TFIDFOptions {
  useLogTF?: boolean;
  useSmoothedIDF?: boolean;
  tfidfWeight?: number;
}

export interface ConfigValidationResult {
  isValid: boolean;
  errors: string[];
  sanitizedConfig?: EmbeddingConfig;
}
