import {
  EmbeddingConfig,
  Language,
  ConfigValidationResult,
  ProcessingLimits,
} from "../types/config";
import {
  DEFAULT_EMBEDDING_CONFIG,
  DEFAULT_PROCESSING_LIMITS,
} from "./defaults";

/**
 * Validates and sanitizes embedding configuration
 */
export function validateEmbeddingConfig(
  config: Partial<EmbeddingConfig>
): ConfigValidationResult {
  const errors: string[] = [];
  const sanitizedConfig: EmbeddingConfig = { ...DEFAULT_EMBEDDING_CONFIG };

  // Validate enableTFIDF
  if (config.enableTFIDF !== undefined) {
    if (typeof config.enableTFIDF !== "boolean") {
      errors.push("enableTFIDF must be a boolean");
    } else {
      sanitizedConfig.enableTFIDF = config.enableTFIDF;
    }
  }

  // Validate enableStemming
  if (config.enableStemming !== undefined) {
    if (typeof config.enableStemming !== "boolean") {
      errors.push("enableStemming must be a boolean");
    } else {
      sanitizedConfig.enableStemming = config.enableStemming;
    }
  }

  // Validate enableStopwordRemoval
  if (config.enableStopwordRemoval !== undefined) {
    if (typeof config.enableStopwordRemoval !== "boolean") {
      errors.push("enableStopwordRemoval must be a boolean");
    } else {
      sanitizedConfig.enableStopwordRemoval = config.enableStopwordRemoval;
    }
  }

  // Validate ngramSizes
  if (config.ngramSizes !== undefined) {
    if (!Array.isArray(config.ngramSizes)) {
      errors.push("ngramSizes must be an array");
    } else if (config.ngramSizes.length === 0) {
      errors.push("ngramSizes cannot be empty");
    } else {
      const validNgrams = config.ngramSizes.filter(
        (n) =>
          Number.isInteger(n) &&
          n >= 1 &&
          n <= DEFAULT_PROCESSING_LIMITS.maxNgramSize
      );
      if (validNgrams.length === 0) {
        errors.push(
          `ngramSizes must contain integers between 1 and ${DEFAULT_PROCESSING_LIMITS.maxNgramSize}`
        );
      } else {
        sanitizedConfig.ngramSizes = [...new Set(validNgrams)].sort(); // Remove duplicates and sort
      }
    }
  }

  // Validate tfidfWeight
  if (config.tfidfWeight !== undefined) {
    if (
      typeof config.tfidfWeight !== "number" ||
      config.tfidfWeight < 0 ||
      config.tfidfWeight > 1
    ) {
      errors.push("tfidfWeight must be a number between 0 and 1");
    } else {
      sanitizedConfig.tfidfWeight = config.tfidfWeight;
    }
  }

  // Validate language
  if (config.language !== undefined) {
    if (!Object.values(Language).includes(config.language)) {
      errors.push(
        `language must be one of: ${Object.values(Language).join(", ")}`
      );
    } else {
      sanitizedConfig.language = config.language;
    }
  }

  // Validate customStopwords
  if (config.customStopwords !== undefined) {
    if (!Array.isArray(config.customStopwords)) {
      errors.push("customStopwords must be an array of strings");
    } else if (
      !config.customStopwords.every((word) => typeof word === "string")
    ) {
      errors.push("customStopwords must contain only strings");
    } else {
      sanitizedConfig.customStopwords = config.customStopwords.map((word) =>
        word.toLowerCase().trim()
      );
    }
  }

  // Validate processingLimits
  if (config.processingLimits !== undefined) {
    const limitsValidation = validateProcessingLimits(config.processingLimits);
    if (!limitsValidation.isValid) {
      errors.push(...limitsValidation.errors);
    } else {
      sanitizedConfig.processingLimits = limitsValidation.sanitizedLimits!;
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedConfig: errors.length === 0 ? sanitizedConfig : undefined,
  };
}

/**
 * Validates processing limits configuration
 */
function validateProcessingLimits(limits: Partial<ProcessingLimits>): {
  isValid: boolean;
  errors: string[];
  sanitizedLimits?: ProcessingLimits;
} {
  const errors: string[] = [];
  const sanitizedLimits: ProcessingLimits = { ...DEFAULT_PROCESSING_LIMITS };

  if (limits.maxVocabularySize !== undefined) {
    if (
      !Number.isInteger(limits.maxVocabularySize) ||
      limits.maxVocabularySize <= 0
    ) {
      errors.push("maxVocabularySize must be a positive integer");
    } else {
      sanitizedLimits.maxVocabularySize = Math.min(
        limits.maxVocabularySize,
        50000
      ); // Cap at 50k
    }
  }

  if (limits.maxNgramSize !== undefined) {
    if (
      !Number.isInteger(limits.maxNgramSize) ||
      limits.maxNgramSize < 1 ||
      limits.maxNgramSize > 5
    ) {
      errors.push("maxNgramSize must be an integer between 1 and 5");
    } else {
      sanitizedLimits.maxNgramSize = limits.maxNgramSize;
    }
  }

  if (limits.maxProcessingTimeMs !== undefined) {
    if (
      !Number.isInteger(limits.maxProcessingTimeMs) ||
      limits.maxProcessingTimeMs <= 0
    ) {
      errors.push("maxProcessingTimeMs must be a positive integer");
    } else {
      sanitizedLimits.maxProcessingTimeMs = Math.min(
        limits.maxProcessingTimeMs,
        30000
      ); // Cap at 30s
    }
  }

  if (limits.maxChunkSize !== undefined) {
    if (!Number.isInteger(limits.maxChunkSize) || limits.maxChunkSize <= 0) {
      errors.push("maxChunkSize must be a positive integer");
    } else {
      sanitizedLimits.maxChunkSize = Math.min(limits.maxChunkSize, 8192); // Cap at 8KB
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedLimits: errors.length === 0 ? sanitizedLimits : undefined,
  };
}

/**
 * Merges user configuration with defaults, applying validation
 */
export function mergeWithDefaults(
  userConfig: Partial<EmbeddingConfig>
): EmbeddingConfig {
  const validation = validateEmbeddingConfig(userConfig);

  if (!validation.isValid) {
    console.warn(
      "Invalid configuration provided, using defaults:",
      validation.errors
    );
    return DEFAULT_EMBEDDING_CONFIG;
  }

  return validation.sanitizedConfig!;
}
