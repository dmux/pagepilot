import * as assert from "assert";
import * as vscode from "vscode";
import { sendChatRequest } from "../llm";
import { DocSource } from "../context";
import { SinonSandbox, createSandbox } from "sinon";

suite("LLM Tests", () => {
  let sandbox: SinonSandbox;

  setup(() => {
    sandbox = createSandbox();
  });

  teardown(() => {
    sandbox.restore();
  });

  test("should count tokens correctly", async () => {
    const request = {
      prompt: "test prompt",
      model: {
        sendRequest: sandbox.stub().resolves({ text: "test response" }),
      },
    } as unknown as vscode.ChatRequest;

    const activeDoc = {
      embeddings: [],
    } as unknown as DocSource;

    const { tokenCount } = await sendChatRequest(
      request,
      new vscode.CancellationTokenSource().token,
      activeDoc
    );

    assert.ok(tokenCount > 0);
  });
});
