import * as vscode from "vscode";
import { cosineSimilarity } from "fast-cosine-similarity";

const MAX_CHUNK_SIZE = 512;

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

export function generateEmbeddings(content: string): { chunk: string; embedding: number[] }[] {
  const chunks = chunkText(content);
  const vocab = Array.from(new Set(content.toLowerCase().split(/\s+/)));
  const embeddings = chunks.map((chunk) => ({
    chunk,
    embedding: createBoW(chunk, vocab),
  }));
  return embeddings;
}

export function findMostRelevantChunks(
  question: string,
  embeddings: { chunk: string; embedding: number[] }[],
  topK = 3
): string[] {
  if (embeddings.length === 0) {
    return [];
  }

  const vocab = Array.from(new Set(embeddings.flatMap(e => e.chunk).join(" ").toLowerCase().split(/\s+/)));
  const questionEmbedding = createBoW(question, vocab);

  const similarities = embeddings.map((e) => ({
    chunk: e.chunk,
    similarity: cosineSimilarity(questionEmbedding, e.embedding),
  }));

  similarities.sort((a, b) => b.similarity - a.similarity);

  return similarities.slice(0, topK).map((s) => s.chunk);
}
