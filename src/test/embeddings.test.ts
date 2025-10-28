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
    assert.ok(embeddings[0].embedding.some((v) => v > 0));
  });

  test("should return empty array for empty embeddings", () => {
    const chunks = findMostRelevantChunks("test", []);
    assert.deepStrictEqual(chunks, []);
  });

  test("should handle question with no matching words", () => {
    const content = "The cat sat on the mat.";
    const embeddings = generateEmbeddings(content);
    const chunks = findMostRelevantChunks("dog", embeddings);
    assert.deepStrictEqual(chunks, []);
  });

  test("should return top chunks with TF-IDF", () => {
    const content =
      "The cat sat on the mat. The dog ate the food. The bird flew away.";
    const embeddings = generateEmbeddings(content);
    const chunks = findMostRelevantChunks("dog", embeddings, 1);
    assert.strictEqual(chunks.length, 1);
    assert.strictEqual(chunks[0], "The dog ate the food");
  });

  test("should not throw ZeroVectorError for question", () => {
    const embeddings = [{ chunk: "a b c", embedding: [1, 1, 1] }];
    const chunks = findMostRelevantChunks("d e f", embeddings);
    assert.deepStrictEqual(chunks, []);
  });

  test("should handle stemming", () => {
    const content = "Eu estou correndo no parque. Ele corre todos os dias.";
    const embeddings = generateEmbeddings(content);
    const chunks = findMostRelevantChunks("correr", embeddings, 1);
    assert.strictEqual(chunks.length, 1);
    assert.strictEqual(
      chunks[0],
      "Eu estou correndo no parque"
    );
  });

  test("should handle stopwords", () => {
    const content = "o gato sentou no tapete";
    const embeddings = generateEmbeddings(content);
    const chunks = findMostRelevantChunks("gato", embeddings, 1);
    assert.strictEqual(chunks.length, 1);
    assert.strictEqual(chunks[0], "o gato sentou no tapete");
  });

  test("should handle n-grams", () => {
    const content = "the quick brown fox jumps over the lazy dog";
    const embeddings = generateEmbeddings(content);
    const chunks = findMostRelevantChunks("lazy dog", embeddings, 1);
    assert.strictEqual(chunks.length, 1);
    assert.strictEqual(
      chunks[0],
      "the quick brown fox jumps over the lazy dog"
    );
  });
});
