/**
 * Core text processing infrastructure for semantic retrieval enhancement
 * Provides language detection, stopword removal, stemming, and text normalization
 */

export enum Language {
  ENGLISH = "en",
  PORTUGUESE = "pt",
}

export interface ProcessingOptions {
  enableStemming?: boolean;
  enableStopwordRemoval?: boolean;
  language?: Language;
  ngramSize?: number[];
}

export interface ProcessedText {
  words: string[];
  ngrams: string[];
  language: Language;
}

// Reduced stopwords lists optimized for technical content
// Removed many words that could be important in technical contexts
const STOPWORDS = {
  [Language.ENGLISH]: [
    // Only the most common and truly non-informative words
    "a",
    "an",
    "and",
    "are",
    "as",
    "at",
    "be",
    "by",
    "for",
    "from",
    "has",
    "he",
    "in",
    "is",
    "it",
    "of",
    "on",
    "that",
    "the",
    "to",
    "was",
    "with",
    "they",
    "have",
    "had",
    "she",
    "we",
    "you",
    "been",
    "were",
    // Removed: its, this, but, what, said, each, which, do, how, their, your
    // Removed: would, could, should, can, may, might, must, shall, will
    // These can be important in technical contexts
  ],
  [Language.PORTUGUESE]: [
    // Only the most common and truly non-informative words
    "a",
    "ao",
    "aos",
    "as",
    "da",
    "das",
    "de",
    "do",
    "dos",
    "e",
    "em",
    "o",
    "os",
    "para",
    "por",
    "que",
    "se",
    "um",
    "uma",
    // Removed many words that could be contextually important:
    // aquela, aquelas, aquele, aqueles, aquilo, até, com, como
    // dela, delas, dele, deles, depois, ela, elas, ele, eles
    // entre, essa, essas, esse, esses, esta, estas, este, estes
    // eu, isso, isto, já, mais, mas, me, mesmo, meu, meus
    // minha, minhas, muito, na, nas, não, no, nos, nós
    // nossa, nossas, nosso, nossos, num, numa, ou, pela, pelas
    // pelo, pelos, qual, quando, quem, sem, ser, seu, seus
    // só, sua, suas, também, te, tem, tu, tua, tuas, tudo
    // você, vocês, vos
  ],
};

// Language detection based on common words frequency
const LANGUAGE_INDICATORS = {
  [Language.ENGLISH]: [
    "the",
    "and",
    "is",
    "in",
    "to",
    "of",
    "a",
    "that",
    "it",
    "with",
  ],
  [Language.PORTUGUESE]: [
    "de",
    "a",
    "o",
    "que",
    "e",
    "do",
    "da",
    "em",
    "um",
    "para",
  ],
};

interface StemmingRule {
  suffix: string;
  replacement: string;
  minLength: number;
}

// Conservative rule-based stemming rules - optimized for technical content
const STEMMING_RULES = {
  [Language.ENGLISH]: [
    // More conservative rules with higher minimum lengths
    { suffix: "ing", replacement: "", minLength: 6 }, // testing -> test, but not ring -> r
    { suffix: "ed", replacement: "", minLength: 5 }, // tested -> test, but not red -> r
    { suffix: "er", replacement: "", minLength: 6 }, // developer -> develop, but not her -> h
    { suffix: "est", replacement: "", minLength: 6 }, // fastest -> fast, but not test -> t
    { suffix: "ly", replacement: "", minLength: 6 }, // quickly -> quick, but not fly -> f
    { suffix: "tion", replacement: "te", minLength: 7 }, // authentication -> authenticate
    { suffix: "sion", replacement: "", minLength: 7 }, // extension -> extend
    { suffix: "ness", replacement: "", minLength: 7 }, // darkness -> dark
    { suffix: "ment", replacement: "", minLength: 7 }, // development -> develop
    { suffix: "able", replacement: "", minLength: 7 }, // readable -> read
    { suffix: "ible", replacement: "", minLength: 7 }, // accessible -> access
    { suffix: "ive", replacement: "", minLength: 6 }, // active -> act
    { suffix: "ous", replacement: "", minLength: 6 }, // famous -> fam
    { suffix: "ful", replacement: "", minLength: 6 }, // useful -> use
  ],
  [Language.PORTUGUESE]: [
    // More conservative rules for Portuguese
    { suffix: "ando", replacement: "ar", minLength: 7 }, // implementando -> implementar
    { suffix: "endo", replacement: "er", minLength: 7 }, // fazendo -> fazer
    { suffix: "indo", replacement: "ir", minLength: 7 }, // construindo -> construir
    { suffix: "ado", replacement: "ar", minLength: 6 }, // implementado -> implementar
    { suffix: "ido", replacement: "er", minLength: 6 }, // construído -> construir
    { suffix: "ção", replacement: "r", minLength: 7 }, // autenticação -> autenticar
    { suffix: "mente", replacement: "", minLength: 8 }, // rapidamente -> rápida
    { suffix: "dade", replacement: "", minLength: 7 }, // segurança -> segur
    { suffix: "agem", replacement: "", minLength: 7 }, // linguagem -> lingu
    { suffix: "ável", replacement: "", minLength: 7 }, // configurável -> configur
    { suffix: "ível", replacement: "", minLength: 7 }, // acessível -> acess
  ],
};

/**
 * TextProcessor class for handling text normalization, language detection,
 * stopword removal, and stemming
 */
export class TextProcessor {
  /**
   * Detect language based on word frequency analysis
   */
  detectLanguage(text: string): Language {
    const words = this.tokenize(text.toLowerCase());
    const wordSet = new Set(words);

    let englishScore = 0;
    let portugueseScore = 0;

    // Count matches with language indicators
    for (const word of LANGUAGE_INDICATORS[Language.ENGLISH]) {
      if (wordSet.has(word)) {
        englishScore++;
      }
    }

    for (const word of LANGUAGE_INDICATORS[Language.PORTUGUESE]) {
      if (wordSet.has(word)) {
        portugueseScore++;
      }
    }

    // Default to English if no clear indicators
    return portugueseScore > englishScore
      ? Language.PORTUGUESE
      : Language.ENGLISH;
  }

  /**
   * Normalize and tokenize text into words
   */
  tokenize(text: string): string[] {
    // Normalize text: lowercase, remove special characters, split on whitespace
    return text
      .toLowerCase()
      .replace(/[^\w\sáàâãéêíóôõúç]/g, " ") // Keep accented characters for Portuguese
      .split(/\s+/)
      .filter((word) => word.length > 0);
  }

  /**
   * Remove stopwords from word array
   */
  removeStopwords(words: string[], language: Language): string[] {
    const stopwordSet = new Set(STOPWORDS[language]);
    return words.filter((word) => !stopwordSet.has(word));
  }

  /**
   * Apply rule-based stemming to words
   */
  applyStemming(words: string[], language: Language): string[] {
    const rules = STEMMING_RULES[language];

    return words.map((word) => {
      for (const rule of rules) {
        if (word.length >= rule.minLength && word.endsWith(rule.suffix)) {
          return word.slice(0, -rule.suffix.length) + rule.replacement;
        }
      }
      return word;
    });
  }

  /**
   * Generate n-grams from word array
   */
  generateNgrams(words: string[], ngramSizes: number[] = [1, 2, 3]): string[] {
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
   * Process text with all available options
   */
  processText(text: string, options: ProcessingOptions = {}): ProcessedText {
    // Set default options
    const {
      enableStemming = true,
      enableStopwordRemoval = true,
      language,
      ngramSize = [1, 2, 3],
    } = options;

    // Detect language if not provided
    const detectedLanguage = language || this.detectLanguage(text);

    // Tokenize text
    let words = this.tokenize(text);

    // Remove stopwords if enabled
    if (enableStopwordRemoval) {
      words = this.removeStopwords(words, detectedLanguage);
    }

    // Apply stemming if enabled
    if (enableStemming) {
      words = this.applyStemming(words, detectedLanguage);
    }

    // Generate n-grams
    const ngrams = this.generateNgrams(words, ngramSize);

    return {
      words,
      ngrams,
      language: detectedLanguage,
    };
  }
}

// Export a default instance for convenience
export const textProcessor = new TextProcessor();
