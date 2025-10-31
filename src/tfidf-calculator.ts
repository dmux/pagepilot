/**
 * TF-IDF Calculator for enhanced vectorization
 * Computes term frequency and inverse document frequency for weighted embeddings
 */

import { Vocabulary } from "./vocabulary-builder";
import { ProcessedText } from "./text-processor";

export interface TFIDFMatrix {
  matrix: number[][];
  vocabulary: Vocabulary;
}

export interface TFIDFOptions {
  tfidfWeight?: number; // Weight between TF-IDF (1.0) and simple BoW (0.0)
  useLogTF?: boolean; // Use logarithmic term frequency
  useSmoothedIDF?: boolean; // Use smoothed IDF calculation
}

/**
 * TFIDFCalculator class for computing TF-IDF weighted embeddings
 */
export class TFIDFCalculator {
  private readonly tfidfWeight: number;
  private readonly useLogTF: boolean;
  private readonly useSmoothedIDF: boolean;

  constructor(options: TFIDFOptions = {}) {
    this.tfidfWeight = options.tfidfWeight ?? 1.0; // Default to full TF-IDF
    this.useLogTF = options.useLogTF ?? true;
    this.useSmoothedIDF = options.useSmoothedIDF ?? true;
  }

  /**
   * Calculate TF-IDF matrix for a collection of processed texts
   */
  calculateTFIDF(
    processedTexts: ProcessedText[],
    vocabulary: Vocabulary
  ): TFIDFMatrix {
    if (processedTexts.length === 0 || vocabulary.terms.length === 0) {
      return {
        matrix: [],
        vocabulary,
      };
    }

    const matrix: number[][] = [];

    // Calculate TF-IDF for each document
    for (const processedText of processedTexts) {
      const tfidfVector = this.calculateDocumentTFIDF(
        processedText,
        vocabulary
      );
      matrix.push(tfidfVector);
    }

    return {
      matrix,
      vocabulary,
    };
  }

  /**
   * Calculate TF-IDF vector for a single document
   */
  calculateDocumentTFIDF(
    processedText: ProcessedText,
    vocabulary: Vocabulary
  ): number[] {
    const vector = new Array(vocabulary.terms.length).fill(0);

    // Count term frequencies in the document
    const termCounts = this.countTerms(processedText.ngrams);
    const totalTerms = processedText.ngrams.length;

    // Calculate TF-IDF for each term in vocabulary
    for (let i = 0; i < vocabulary.terms.length; i++) {
      const term = vocabulary.terms[i];
      const termCount = termCounts.get(term) || 0;

      if (termCount > 0) {
        const tf = this.calculateTF(termCount, totalTerms);
        const idf = this.calculateIDF(term, vocabulary);
        const tfidf = tf * idf;

        // Combine TF-IDF with simple count based on weight
        const simpleCount = termCount;
        vector[i] =
          this.tfidfWeight * tfidf + (1 - this.tfidfWeight) * simpleCount;
      }
    }

    return vector;
  }

  /**
   * Create weighted embedding combining TF-IDF with simple counts
   */
  createWeightedEmbedding(
    processedText: ProcessedText,
    vocabulary: Vocabulary,
    tfidfWeights?: number[]
  ): number[] {
    const vector = new Array(vocabulary.terms.length).fill(0);
    const termCounts = this.countTerms(processedText.ngrams);
    const totalTerms = processedText.ngrams.length;

    for (let i = 0; i < vocabulary.terms.length; i++) {
      const term = vocabulary.terms[i];
      const termCount = termCounts.get(term) || 0;

      if (termCount > 0) {
        if (tfidfWeights && tfidfWeights[i] !== undefined) {
          // Use provided TF-IDF weights
          vector[i] = tfidfWeights[i] * termCount;
        } else {
          // Calculate TF-IDF on the fly
          const tf = this.calculateTF(termCount, totalTerms);
          const idf = this.calculateIDF(term, vocabulary);
          const tfidf = tf * idf;

          // Combine with simple count
          vector[i] =
            this.tfidfWeight * tfidf + (1 - this.tfidfWeight) * termCount;
        }
      }
    }

    return vector;
  }

  /**
   * Calculate Term Frequency (TF)
   */
  private calculateTF(termCount: number, totalTerms: number): number {
    if (totalTerms === 0) {return 0;}

    const rawTF = termCount / totalTerms;

    if (this.useLogTF) {
      // Logarithmic term frequency: 1 + log(tf)
      return termCount > 0 ? 1 + Math.log(rawTF) : 0;
    } else {
      // Raw term frequency
      return rawTF;
    }
  }

  /**
   * Calculate Inverse Document Frequency (IDF)
   * Optimized for small document collections
   */
  private calculateIDF(term: string, vocabulary: Vocabulary): number {
    const documentFrequency = vocabulary.documentFrequency.get(term) || 0;
    const totalDocuments = vocabulary.totalDocuments;

    if (documentFrequency === 0 || totalDocuments === 0) {
      return 1; // Return 1 instead of 0 to avoid eliminating terms
    }

    // For small document collections (< 10 documents), use modified IDF
    if (totalDocuments < 10) {
      if (this.useSmoothedIDF) {
        // More conservative IDF for small collections: log((N + 1) / (df + 1)) + 0.5
        return Math.log((totalDocuments + 1) / (documentFrequency + 1)) + 0.5;
      } else {
        // Simple ratio for very small collections
        return Math.max(
          0.1,
          (totalDocuments - documentFrequency + 1) / totalDocuments
        );
      }
    }

    // Standard IDF calculation for larger collections
    if (this.useSmoothedIDF) {
      // Smoothed IDF: log(N / df) + 1
      return Math.log(totalDocuments / documentFrequency) + 1;
    } else {
      // Standard IDF: log(N / df)
      return Math.log(totalDocuments / documentFrequency);
    }
  }

  /**
   * Count occurrences of each term in the n-grams
   */
  private countTerms(ngrams: string[]): Map<string, number> {
    const termCounts = new Map<string, number>();

    for (const ngram of ngrams) {
      if (ngram.trim().length > 0) {
        termCounts.set(ngram, (termCounts.get(ngram) || 0) + 1);
      }
    }

    return termCounts;
  }

  /**
   * Calculate TF-IDF weights for the entire vocabulary
   */
  calculateVocabularyWeights(vocabulary: Vocabulary): number[] {
    const weights = new Array(vocabulary.terms.length);

    for (let i = 0; i < vocabulary.terms.length; i++) {
      const term = vocabulary.terms[i];
      weights[i] = this.calculateIDF(term, vocabulary);
    }

    return weights;
  }

  /**
   * Normalize TF-IDF vector using L2 normalization
   */
  normalizeVector(vector: number[]): number[] {
    const magnitude = Math.sqrt(
      vector.reduce((sum, val) => sum + val * val, 0)
    );

    if (magnitude === 0) {
      return vector;
    }

    return vector.map((val) => val / magnitude);
  }

  /**
   * Calculate cosine similarity between two TF-IDF vectors
   */
  calculateCosineSimilarity(vectorA: number[], vectorB: number[]): number {
    if (vectorA.length !== vectorB.length) {
      throw new Error("Vectors must have the same length");
    }

    let dotProduct = 0;
    let magnitudeA = 0;
    let magnitudeB = 0;

    for (let i = 0; i < vectorA.length; i++) {
      dotProduct += vectorA[i] * vectorB[i];
      magnitudeA += vectorA[i] * vectorA[i];
      magnitudeB += vectorB[i] * vectorB[i];
    }

    magnitudeA = Math.sqrt(magnitudeA);
    magnitudeB = Math.sqrt(magnitudeB);

    if (magnitudeA === 0 || magnitudeB === 0) {
      return 0;
    }

    return dotProduct / (magnitudeA * magnitudeB);
  }

  /**
   * Get TF-IDF statistics for analysis
   */
  getTFIDFStats(matrix: number[][]): {
    averageVectorMagnitude: number;
    maxTFIDFValue: number;
    minTFIDFValue: number;
    sparsity: number; // Percentage of zero values
  } {
    if (matrix.length === 0 || matrix[0].length === 0) {
      return {
        averageVectorMagnitude: 0,
        maxTFIDFValue: 0,
        minTFIDFValue: 0,
        sparsity: 1,
      };
    }

    let totalMagnitude = 0;
    let maxValue = -Infinity;
    let minValue = Infinity;
    let zeroCount = 0;
    let totalElements = 0;

    for (const vector of matrix) {
      const magnitude = Math.sqrt(
        vector.reduce((sum, val) => sum + val * val, 0)
      );
      totalMagnitude += magnitude;

      for (const value of vector) {
        maxValue = Math.max(maxValue, value);
        minValue = Math.min(minValue, value);
        if (value === 0) {zeroCount++;}
        totalElements++;
      }
    }

    return {
      averageVectorMagnitude: totalMagnitude / matrix.length,
      maxTFIDFValue: maxValue === -Infinity ? 0 : maxValue,
      minTFIDFValue: minValue === Infinity ? 0 : minValue,
      sparsity: totalElements > 0 ? zeroCount / totalElements : 1,
    };
  }
}

// Export a default instance for convenience
export const tfidfCalculator = new TFIDFCalculator();
