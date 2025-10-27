import * as assert from "assert";
import { generateEmbeddings, findMostRelevantChunks } from "../embeddings";

suite("Embeddings Tests", () => {
  test("should handle empty content", () => {
    const embeddings = generateEmbeddings("");
    assert.deepStrictEqual(embeddings, []);
  });

  test("should generate embeddings for simple text", () => {
    const content = "Hello world. This is a test.";
    const embeddings = generateEmbeddings(content);
    assert.strictEqual(embeddings.length, 1);
    assert.strictEqual(embeddings[0].chunk, "Hello world This is a test");
    assert.ok(embeddings[0].embedding.some(v => v > 0));
  });

  test("findMostRelevantChunks should return empty array for empty embeddings", () => {
    const chunks = findMostRelevantChunks("test", []);
    assert.deepStrictEqual(chunks, []);
  });

  test("findMostRelevantChunks should handle question with no matching words", () => {
    const content = "The cat sat on the mat.";
    const embeddings = generateEmbeddings(content);
    const chunks = findMostRelevantChunks("dog", embeddings);
    assert.deepStrictEqual(chunks, []);
  });

  test("findMostRelevantChunks should return top chunks", () => {
    const embeddings = [
      { chunk: "cat", embedding: [1, 0, 0] },
      { chunk: "dog", embedding: [0, 1, 0] },
      { chunk: "bird", embedding: [0, 0, 1] },
    ];
    const chunks = findMostRelevantChunks("dog", embeddings, 1);
    assert.strictEqual(chunks.length, 1);
    assert.strictEqual(chunks[0], "dog");
  });

  test("findMostRelevantChunks should not throw ZeroVectorError for question", () => {
    const embeddings = [{ chunk: "a b c", embedding: [1, 1, 1] }];
    const chunks = findMostRelevantChunks("d e f", embeddings);
    assert.deepStrictEqual(chunks, []);
  });
});