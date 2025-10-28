/**
 * Vocabulary Builder for enhanced vectorization
 * Extracts unique terms, tracks document frequencies, and generates n-grams
 */

import { ProcessedText, textProcessor } from "./text-processor";

export interface Vocabulary {
  terms: string[];
  termToIndex: Map<string, number>;
  documentFrequency: Map<string, number>;
  totalDocuments: number;
}

export interface VocabularyOptions {
  maxVocabularySize?: number;
  minDocumentFrequency?: number;
  ngramSizes?: number[];
}

/**
 * VocabularyBuilder class for extracting unique terms and tracking document frequencies
 */
export class VocabularyBuilder {
  private readonly maxVocabularySize: number;
  private readonly minDocumentFrequency: number;
  private readonly ngramSizes: number[];

  constructor(options: VocabularyOptions = {}) {
    this.maxVocabularySize = options.maxVocabularySize || 10000;
    this.minDocumentFrequency = options.minDocumentFrequency || 1;
    this.ngramSizes = options.ngramSizes || [1, 2, 3];
  }

  /**
   * Build vocabulary from processed text chunks
   */
  buildVocabulary(processedTexts: ProcessedText[]): Vocabulary {
    if (processedTexts.length === 0) {
      return this.createEmptyVocabulary();
    }

    // Track document frequency for each term
    const documentFrequency = new Map<string, number>();
    const termSet = new Set<string>();

    // Process each document
    for (const processedText of processedTexts) {
      const documentTerms = new Set<string>();

      // Add all n-grams from the processed text
      for (const ngram of processedText.ngrams) {
        if (ngram.trim().length > 0) {
          termSet.add(ngram);
          documentTerms.add(ngram);
        }
      }

      // Update document frequency for unique terms in this document
      for (const term of documentTerms) {
        documentFrequency.set(term, (documentFrequency.get(term) || 0) + 1);
      }
    }

    // Filter terms by minimum document frequency
    const filteredTerms = Array.from(termSet).filter(
      (term) => (documentFrequency.get(term) || 0) >= this.minDocumentFrequency
    );

    // Sort terms by document frequency (descending) for better vocabulary selection
    filteredTerms.sort((a, b) => {
      const freqA = documentFrequency.get(a) || 0;
      const freqB = documentFrequency.get(b) || 0;
      return freqB - freqA;
    });

    // Limit vocabulary size for memory optimization
    const finalTerms = filteredTerms.slice(0, this.maxVocabularySize);

    // Create term to index mapping
    const termToIndex = new Map<string, number>();
    finalTerms.forEach((term, index) => {
      termToIndex.set(term, index);
    });

    // Filter document frequency map to only include final terms
    const finalDocumentFrequency = new Map<string, number>();
    for (const term of finalTerms) {
      finalDocumentFrequency.set(term, documentFrequency.get(term) || 0);
    }

    return {
      terms: finalTerms,
      termToIndex,
      documentFrequency: finalDocumentFrequency,
      totalDocuments: processedTexts.length,
    };
  }

  /**
   * Build vocabulary from raw text chunks (convenience method)
   */
  buildVocabularyFromTexts(texts: string[]): Vocabulary {
    const processedTexts = texts.map((text) =>
      textProcessor.processText(text, { ngramSize: this.ngramSizes })
    );
    return this.buildVocabulary(processedTexts);
  }

  /**
   * Generate n-grams from a list of words
   */
  generateNgrams(
    words: string[],
    ngramSizes: number[] = this.ngramSizes
  ): string[] {
    const ngrams: string[] = [];

    for (const n of ngramSizes) {
      if (n === 1) {
        // 1-grams are just the words themselves
        ngrams.push(...words);
      } else if (n <= words.length) {
        // Generate n-grams for n > 1
        for (let i = 0; i <= words.length - n; i++) {
          const ngram = words.slice(i, i + n).join(" ");
          ngrams.push(ngram);
        }
      }
    }

    return ngrams;
  }

  /**
   * Extract unique terms from a single processed text
   */
  extractTerms(processedText: ProcessedText): string[] {
    return Array.from(new Set(processedText.ngrams)).filter(
      (term) => term.trim().length > 0
    );
  }

  /**
   * Update vocabulary with new documents (incremental building)
   */
  updateVocabulary(
    existingVocabulary: Vocabulary,
    newProcessedTexts: ProcessedText[]
  ): Vocabulary {
    // Combine existing and new processed texts
    const allProcessedTexts: ProcessedText[] = [];

    // Reconstruct processed texts from existing vocabulary (approximation)
    // This is a simplified approach - in practice, you'd want to store original processed texts
    for (let i = 0; i < existingVocabulary.totalDocuments; i++) {
      allProcessedTexts.push({
        words: [],
        ngrams: existingVocabulary.terms,
        language: "en" as any, // Default language
      });
    }

    // Add new processed texts
    allProcessedTexts.push(...newProcessedTexts);

    return this.buildVocabulary(allProcessedTexts);
  }

  /**
   * Get vocabulary statistics
   */
  getVocabularyStats(vocabulary: Vocabulary): {
    totalTerms: number;
    averageDocumentFrequency: number;
    maxDocumentFrequency: number;
    minDocumentFrequency: number;
  } {
    if (vocabulary.terms.length === 0) {
      return {
        totalTerms: 0,
        averageDocumentFrequency: 0,
        maxDocumentFrequency: 0,
        minDocumentFrequency: 0,
      };
    }

    const frequencies = Array.from(vocabulary.documentFrequency.values());
    const sum = frequencies.reduce((acc, freq) => acc + freq, 0);

    return {
      totalTerms: vocabulary.terms.length,
      averageDocumentFrequency: sum / frequencies.length,
      maxDocumentFrequency: Math.max(...frequencies),
      minDocumentFrequency: Math.min(...frequencies),
    };
  }

  /**
   * Create an empty vocabulary
   */
  private createEmptyVocabulary(): Vocabulary {
    return {
      terms: [],
      termToIndex: new Map(),
      documentFrequency: new Map(),
      totalDocuments: 0,
    };
  }
}

// Export a default instance for convenience
export const vocabularyBuilder = new VocabularyBuilder();
