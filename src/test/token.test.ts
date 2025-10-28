import * as assert from "assert";
import * as vscode from "vscode";
import { activate } from "../extensions";
import { SinonSandbox, createSandbox } from "sinon";

suite("Token Counter Tests", () => {
  let sandbox: SinonSandbox;

  setup(() => {
    sandbox = createSandbox();
  });

  teardown(() => {
    sandbox.restore();
  });

  test("should display token count in status bar", async () => {
    const mockContext: vscode.ExtensionContext = {
      subscriptions: [],
      workspaceState: {
        get: () => ({
          url: "test url",
          embeddings: [],
        }),
        update: () => Promise.resolve(),
      },
    } as any;

    const createStatusBarItem = sandbox.stub(
      vscode.window,
      "createStatusBarItem"
    );
    const mockStatusBarItem = {
      show: sandbox.stub(),
      text: "",
    };
    createStatusBarItem.returns(mockStatusBarItem as any);

    activate(mockContext);

    const handler = (
      vscode.chat.createChatParticipant as any
    ).getCall(0).args[1];

    const request = {
      prompt: "test prompt",
      model: {
        sendRequest: sandbox.stub().resolves({ text: "test response" }),
      },
    } as unknown as vscode.ChatRequest;

    const stream = {
      markdown: sandbox.stub(),
    } as unknown as vscode.ChatResponseStream;

    await handler(
      request,
      {},
      stream,
      new vscode.CancellationTokenSource().token
    );

    assert.ok(mockStatusBarItem.show.calledOnce);
    assert.ok(mockStatusBarItem.text.includes("tokens"));
  });
});
