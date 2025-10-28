/**
 * Configuration optimizer for different corpus sizes and types
 */

import { EmbeddingConfig } from "../types/config";
import {
  DEFAULT_EMBEDDING_CONFIG,
  MINIMAL_EMBEDDING_CONFIG,
  TECHNICAL_EMBEDDING_CONFIG,
  BALANCED_EMBEDDING_CONFIG,
} from "./defaults";

export interface CorpusAnalysis {
  documentCount: number;
  averageDocumentLength: number;
  totalWords: number;
  uniqueWords: number;
  technicalTermsRatio: number; // Ratio of technical terms (camelCase, snake_case, etc.)
  codeBlocksRatio: number; // Ratio of code blocks
}

/**
 * Analyze corpus characteristics to determine optimal configuration
 */
export function analyzeCorpus(documents: string[]): CorpusAnalysis {
  const documentCount = documents.length;
  let totalWords = 0;
  let uniqueWordsSet = new Set<string>();
  let technicalTerms = 0;
  let codeBlocks = 0;
  let totalCharacters = 0;

  for (const doc of documents) {
    totalCharacters += doc.length;

    // Count code blocks
    const codeBlockMatches = doc.match(/```[\s\S]*?```|`[^`]+`/g);
    if (codeBlockMatches) {
      codeBlocks += codeBlockMatches.length;
    }

    // Tokenize and analyze words
    const words = doc
      .toLowerCase()
      .replace(/[^\w\s]/g, " ")
      .split(/\s+/)
      .filter((word) => word.length > 0);

    totalWords += words.length;

    for (const word of words) {
      uniqueWordsSet.add(word);

      // Detect technical terms
      if (
        word.includes("_") || // snake_case
        /[a-z][A-Z]/.test(word) || // camelCase
        word.includes(".") || // method calls, file extensions
        word.match(/^[a-z]+[A-Z][a-z]*/) || // camelCase
        word.match(/^[A-Z_]+$/) || // CONSTANTS
        word.match(/^\d+$/) || // numbers
        word.length > 15 // very long words (often technical)
      ) {
        technicalTerms++;
      }
    }
  }

  const averageDocumentLength =
    documentCount > 0 ? totalCharacters / documentCount : 0;
  const uniqueWords = uniqueWordsSet.size;
  const technicalTermsRatio = totalWords > 0 ? technicalTerms / totalWords : 0;
  const codeBlocksRatio = documentCount > 0 ? codeBlocks / documentCount : 0;

  return {
    documentCount,
    averageDocumentLength,
    totalWords,
    uniqueWords,
    technicalTermsRatio,
    codeBlocksRatio,
  };
}

/**
 * Get optimal configuration based on corpus analysis
 */
export function getOptimalConfigForCorpus(
  documents: string[],
  userPreferences?: Partial<EmbeddingConfig>
): EmbeddingConfig {
  const analysis = analyzeCorpus(documents);

  let baseConfig: EmbeddingConfig;

  // Choose base configuration based on corpus characteristics
  if (analysis.documentCount <= 1) {
    // Single document - use minimal processing to avoid over-filtering
    baseConfig = { ...MINIMAL_EMBEDDING_CONFIG };
  } else if (analysis.documentCount <= 5) {
    // Small corpus - use balanced approach with low TF-IDF weight
    baseConfig = { ...BALANCED_EMBEDDING_CONFIG };
  } else if (
    analysis.technicalTermsRatio > 0.3 ||
    analysis.codeBlocksRatio > 0.2
  ) {
    // Technical content - use technical configuration
    baseConfig = { ...TECHNICAL_EMBEDDING_CONFIG };
  } else if (analysis.documentCount <= 20) {
    // Medium corpus - use default configuration with adjustments
    baseConfig = { ...DEFAULT_EMBEDDING_CONFIG };
  } else {
    // Large corpus - can use more aggressive filtering
    baseConfig = { ...DEFAULT_EMBEDDING_CONFIG };
    baseConfig.tfidfWeight = 0.5; // Higher TF-IDF weight for large corpus
    baseConfig.enableStopwordRemoval = true;
  }

  // Adjust configuration based on specific characteristics
  const optimizedConfig = { ...baseConfig };

  // Adjust TF-IDF weight based on corpus size
  if (analysis.documentCount <= 3) {
    optimizedConfig.tfidfWeight = Math.min(optimizedConfig.tfidfWeight, 0.1);
  } else if (analysis.documentCount <= 10) {
    optimizedConfig.tfidfWeight = Math.min(optimizedConfig.tfidfWeight, 0.3);
  }

  // Adjust stemming based on technical content
  if (analysis.technicalTermsRatio > 0.4) {
    // High technical content - disable stemming to preserve exact terms
    optimizedConfig.enableStemming = false;
  }

  // Adjust vocabulary size based on corpus diversity
  const vocabularyRatio =
    analysis.uniqueWords / Math.max(analysis.totalWords, 1);
  if (vocabularyRatio > 0.7 && optimizedConfig.vocabularyOptions) {
    // High vocabulary diversity - increase vocabulary size
    optimizedConfig.vocabularyOptions.maxVocabularySize = Math.min(
      optimizedConfig.vocabularyOptions.maxVocabularySize * 1.5,
      25000
    );
  }

  // Adjust n-grams based on document length
  if (analysis.averageDocumentLength > 2000) {
    // Long documents - include 3-grams for better context
    if (!optimizedConfig.ngramSizes.includes(3)) {
      optimizedConfig.ngramSizes = [...optimizedConfig.ngramSizes, 3];
      if (optimizedConfig.vocabularyOptions) {
        optimizedConfig.vocabularyOptions.ngramSizes = [
          ...optimizedConfig.ngramSizes,
        ];
      }
    }
  } else if (analysis.averageDocumentLength < 500) {
    // Short documents - stick to 1-grams and 2-grams
    optimizedConfig.ngramSizes = optimizedConfig.ngramSizes.filter(
      (n) => n <= 2
    );
    if (optimizedConfig.vocabularyOptions) {
      optimizedConfig.vocabularyOptions.ngramSizes = optimizedConfig.ngramSizes;
    }
  }

  // Apply user preferences
  if (userPreferences) {
    Object.assign(optimizedConfig, userPreferences);
  }

  return optimizedConfig;
}

/**
 * Get configuration recommendations based on corpus analysis
 */
export function getConfigurationRecommendations(documents: string[]): {
  analysis: CorpusAnalysis;
  recommendations: string[];
  suggestedConfig: EmbeddingConfig;
} {
  const analysis = analyzeCorpus(documents);
  const recommendations: string[] = [];
  const suggestedConfig = getOptimalConfigForCorpus(documents);

  // Generate recommendations
  if (analysis.documentCount <= 1) {
    recommendations.push(
      "Single document detected - using minimal processing to preserve all content"
    );
  } else if (analysis.documentCount <= 5) {
    recommendations.push(
      "Small corpus detected - using low TF-IDF weight to avoid over-filtering"
    );
  }

  if (analysis.technicalTermsRatio > 0.3) {
    recommendations.push(
      "High technical content detected - consider disabling stemming to preserve exact terms"
    );
  }

  if (analysis.codeBlocksRatio > 0.2) {
    recommendations.push(
      "Code blocks detected - using technical configuration optimized for code"
    );
  }

  if (analysis.averageDocumentLength > 2000) {
    recommendations.push(
      "Long documents detected - including 3-grams for better context capture"
    );
  }

  if (analysis.uniqueWords / Math.max(analysis.totalWords, 1) > 0.7) {
    recommendations.push(
      "High vocabulary diversity - increasing vocabulary size limit"
    );
  }

  return {
    analysis,
    recommendations,
    suggestedConfig,
  };
}

/**
 * Compare two configurations and explain the differences
 */
export function compareConfigurations(
  config1: EmbeddingConfig,
  config2: EmbeddingConfig,
  labels: [string, string] = ["Configuration 1", "Configuration 2"]
): string[] {
  const differences: string[] = [];

  if (config1.enableTFIDF !== config2.enableTFIDF) {
    differences.push(
      `TF-IDF: ${labels[0]} ${config1.enableTFIDF ? "enabled" : "disabled"}, ${
        labels[1]
      } ${config2.enableTFIDF ? "enabled" : "disabled"}`
    );
  }

  if (config1.enableStemming !== config2.enableStemming) {
    differences.push(
      `Stemming: ${labels[0]} ${
        config1.enableStemming ? "enabled" : "disabled"
      }, ${labels[1]} ${config2.enableStemming ? "enabled" : "disabled"}`
    );
  }

  if (config1.enableStopwordRemoval !== config2.enableStopwordRemoval) {
    differences.push(
      `Stopword removal: ${labels[0]} ${
        config1.enableStopwordRemoval ? "enabled" : "disabled"
      }, ${labels[1]} ${config2.enableStopwordRemoval ? "enabled" : "disabled"}`
    );
  }

  if (config1.tfidfWeight !== config2.tfidfWeight) {
    differences.push(
      `TF-IDF weight: ${labels[0]} ${config1.tfidfWeight}, ${labels[1]} ${config2.tfidfWeight}`
    );
  }

  if (
    JSON.stringify(config1.ngramSizes) !== JSON.stringify(config2.ngramSizes)
  ) {
    differences.push(
      `N-grams: ${labels[0]} [${config1.ngramSizes.join(", ")}], ${
        labels[1]
      } [${config2.ngramSizes.join(", ")}]`
    );
  }

  return differences;
}
