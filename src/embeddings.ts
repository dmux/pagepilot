import { PorterStemmerPt, TfIdf, WordTokenizer, NGrams } from "natural";
import { stopwords as stopwords_pt } from "natural/lib/natural/util/stopwords_pt";
import { cosineSimilarity } from "fast-cosine-similarity";

const MAX_CHUNK_SIZE = 512;
const tokenizer = new WordTokenizer();
const stemmer = PorterStemmerPt;

function chunkText(text: string): string[] {
  const sentences = text
    .split(/[.!?]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  const chunks: string[] = [];
  let currentChunk = "";

  for (const sentence of sentences) {
    const separator = currentChunk.length > 0 ? " " : "";
    if (
      currentChunk.length + separator.length + sentence.length >
      MAX_CHUNK_SIZE
    ) {
      chunks.push(currentChunk);
      currentChunk = sentence;
    } else {
      currentChunk += separator + sentence;
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk);
  }

  return chunks;
}

function preprocessText(text: string): string[] {
  const tokens = tokenizer.tokenize(text.toLowerCase());
  if (!tokens) {
    return [];
  }

  const filteredTokens = tokens.filter(
    (token) => !stopwords_pt.includes(token)
  );
  const stemmedTokens = filteredTokens.map((token) => stemmer.stem(token));
  const bigrams = NGrams.bigrams(stemmedTokens)
    .filter((bigram) => bigram.length === 2)
    .map((bigram) => bigram.join("_"));

  return [...stemmedTokens, ...bigrams];
}

function createTfIdf(
  chunks: string[],
  question?: string
): { tfidf: TfIdf; vocab: string[] } {
  const tfidf = new TfIdf();
  chunks.forEach((chunk) => {
    tfidf.addDocument(preprocessText(chunk));
  });

  if (question) {
    tfidf.addDocument(preprocessText(question));
  }

  let allTokens = chunks.reduce((acc: string[], chunk) => {
    const tokens = preprocessText(chunk);
    return [...acc, ...tokens];
  }, []);

  if (question) {
    const questionTokens = preprocessText(question);
    allTokens = [...allTokens, ...questionTokens];
  }

  return { tfidf, vocab: Array.from(new Set(allTokens)) };
}

export function generateEmbeddings(
  content: string
): { chunk: string; embedding: number[] }[] {
  const chunks = chunkText(content);
  if (chunks.length === 0) {
    return [];
  }
  const { tfidf, vocab } = createTfIdf(chunks);

  const embeddings = chunks.map((chunk, i) => {
    const embedding = new Array(vocab.length).fill(0);
    const terms = preprocessText(chunk);
    for (const term of terms) {
      const index = vocab.indexOf(term);
      if (index !== -1) {
        embedding[index] = tfidf.tfidf(term, i);
      }
    }
    return {
      chunk,
      embedding,
    };
  });

  return embeddings.filter((e) => e.embedding.some((v) => v > 0));
}

export function findMostRelevantChunks(
  question: string,
  embeddings: { chunk: string; embedding: number[] }[],
  topK = 3
): string[] {
  if (embeddings.length === 0) {
    return [];
  }

  const chunks = embeddings.map((e) => e.chunk);
  const { tfidf, vocab } = createTfIdf(chunks, question);
  const questionEmbedding = new Array(vocab.length).fill(0);
  const terms = preprocessText(question);
  for (const term of terms) {
    const index = vocab.indexOf(term);
    if (index !== -1) {
      questionEmbedding[index] = tfidf.tfidf(term, chunks.length);
    }
  }

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
