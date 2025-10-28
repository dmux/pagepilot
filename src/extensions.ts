import * as vscode from "vscode";
import {
  handleLoadCommand,
  handleClearCommand,
  handleStatusCommand,
  handleDocsCommand,
} from "./commands";
import { getActiveDoc } from "./context";
import { sendChatRequest } from "./llm";
import { getTranslations } from "./util";
import { initializeEnhancedEmbeddings } from "./embeddings";

export function activate(context: vscode.ExtensionContext) {
  // Initialize enhanced embeddings with extension context
  try {
    initializeEnhancedEmbeddings(context);
  } catch (error) {
    console.warn("Failed to initialize enhanced embeddings:", error);
    // Continue with basic functionality
  }

  const handler: vscode.ChatRequestHandler = async (
    request: vscode.ChatRequest,
    chatContext: vscode.ChatContext,
    stream: vscode.ChatResponseStream,
    token: vscode.CancellationToken
  ): Promise<void> => {
    if (request.command === "docs") {
      await handleDocsCommand(context, stream, request.prompt.split(" "));
      return;
    }

    if (request.command === "load") {
      await handleLoadCommand(context, stream, request.prompt);
      return;
    }

    if (request.command === "clear") {
      await handleClearCommand(context, stream);
      return;
    }

    if (request.command === "status") {
      handleStatusCommand(context, stream);
      return;
    }

    const activeDoc = getActiveDoc(context);
    if (!activeDoc) {
      const translations = getTranslations();
      stream.markdown(
        `${translations.help.noContextTitle}\n\n` +
          `${translations.help.noContextDescription}\n\n` +
          `${translations.help.apiDocs} - \`/load https://api.exemplo.com/docs\`\n` +
          `${translations.help.projectReadme} - \`/load https://raw.githubusercontent.com/user/repo/main/README.md\`\n` +
          `${translations.help.techSpecs} - \`/load https://specs.exemplo.com/llms.txt\`\n\n` +
          `${translations.help.formatExpected}\n\n` +
          translations.help.aiTip
      );
      return;
    }

    if (!request.prompt.trim()) {
      const translations = getTranslations();
      const activeDoc = getActiveDoc(context);
      const contextInfo = activeDoc
        ? `\n${translations.help.currentContext} ${activeDoc.url}`
        : "";
      stream.markdown(
        `${translations.help.welcomeTitle}\n\n` +
          `${translations.help.activeContext}\n` +
          `${translations.help.capabilities.codeAnalysis}\n` +
          `${translations.help.capabilities.techDocs}\n` +
          `${translations.help.capabilities.contextImplementation}\n` +
          `${translations.help.capabilities.debugOptimization}` +
          contextInfo +
          `\n\n${translations.help.usageExamples}\n` +
          `- 
${translations.examples.useApi}
` +
          `- 
${translations.examples.implementFunction}
` +
          `- 
${translations.examples.explainPattern}
` +
          `- 
${translations.examples.bestPractices}`
      );
      return;
    }

    const translations = getTranslations();
    stream.markdown(translations.loading.analyzing);

    try {
      const chatResponse = await sendChatRequest(request, token, activeDoc);
      for await (const fragment of chatResponse.text) {
        stream.markdown(fragment);
      }
    } catch (error) {
      const err = error as Error;
      const isPortuguese = vscode.env.language.startsWith("pt");
      const tryAgainLabel = isPortuguese
        ? "Tente novamente."
        : "Please try again.";

      stream.markdown(
        `${translations.errors.llmError} ${err.message}. ${tryAgainLabel}`
      );
      console.error(err);
    }
  };

  const participant = vscode.chat.createChatParticipant("pagepilot", handler);
  participant.iconPath = new vscode.ThemeIcon("book");

  context.subscriptions.push(participant);
}

export function deactivate() {}
