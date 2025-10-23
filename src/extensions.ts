import * as vscode from "vscode";
import axios from "axios";
import { t } from "./i18n";

// Persistent cache using VS Code workspace state to store the last loaded context.
// This persists between VS Code sessions
const CACHE_KEY = "lastLoadedContext";
const URL_KEY = "lastLoadedUrl";

export function activate(context: vscode.ExtensionContext) {
  // The handler that responds when @pagepilot is called
  const handler: vscode.ChatRequestHandler = async (
    request: vscode.ChatRequest,
    chatContext: vscode.ChatContext,
    stream: vscode.ChatResponseStream,
    token: vscode.CancellationToken
  ): Promise<void> => {
    // --- Command Handling: /load <url> ---
    if (request.command === "load") {
      const url = request.prompt;
      if (!url) {
        const translations = t();
        stream.markdown(
          `${translations.loadCommandHelp.title}\n\n` +
            `${translations.loadCommandHelp.usage}\n\n` +
            `${translations.loadCommandHelp.examples}\n` +
            `• \`/load https://raw.githubusercontent.com/user/repo/main/README.md\`\n` +
            `• \`/load https://docs.api.com/reference.txt\`\n` +
            `• \`/load https://projeto.com/llms.txt\`\n\n` +
            translations.loadCommandHelp.tip
        );
        return;
      }

      const translations = t();
      stream.markdown(`${translations.loading.context} \`${url}\`...`);
      try {
        const response = await axios.get(url, { timeout: 10000 });
        const content = response.data as string;

        // Save the content and URL in workspace state (persists between sessions)
        await context.workspaceState.update(CACHE_KEY, content);
        await context.workspaceState.update(URL_KEY, url);

        const wordCount = content.split(/\s+/).length;
        const charCount = content.length;

        const isPortuguese = vscode.env.language.startsWith("pt");
        const wordLabel = isPortuguese ? "palavras" : "words";
        const charLabel = isPortuguese ? "caracteres" : "characters";

        stream.markdown(
          `${translations.success.loaded}\n\n` +
            `${translations.success.source} ${url}\n` +
            `${
              translations.success.statistics
            } ${wordCount.toLocaleString()} ${wordLabel}, ${charCount.toLocaleString()} ${charLabel}\n\n` +
            translations.success.ready
        );
        return; // End command execution
      } catch (error) {
        const err = error as Error;
        stream.markdown(
          `${translations.errors.loadFailed}\n\n` +
            `${translations.errors.url} ${url}\n` +
            `${translations.errors.error} ${err.message}\n\n` +
            `${translations.errors.tips}\n` +
            `${translations.errors.urlAccessible}\n` +
            `${translations.errors.plainText}\n` +
            `${translations.errors.testBrowser}`
        );
        return;
      }
    }

    // --- Command Handling: /clear ---
    if (request.command === "clear") {
      const translations = t();
      await context.workspaceState.update(CACHE_KEY, undefined);
      await context.workspaceState.update(URL_KEY, undefined);
      stream.markdown(translations.success.cleared);
      return;
    }

    // --- Command Handling: /status ---
    if (request.command === "status") {
      const translations = t();
      const cachedContext = context.workspaceState.get<string>(CACHE_KEY);
      const cachedUrl = context.workspaceState.get<string>(URL_KEY);

      if (!cachedContext) {
        stream.markdown(translations.status.noContext);
      } else {
        const wordCount = cachedContext.split(/\s+/).length;
        const charCount = cachedContext.length;
        const isPortuguese = vscode.env.language.startsWith("pt");
        const wordLabel = isPortuguese ? "palavras" : "words";
        const charLabel = isPortuguese ? "caracteres" : "characters";
        const unavailableLabel = isPortuguese
          ? "URL não disponível"
          : "URL not available";

        stream.markdown(
          `${translations.status.contextStatus}\n\n` +
            `${translations.success.source} ${
              cachedUrl || unavailableLabel
            }\n` +
            `${
              translations.success.statistics
            } ${wordCount.toLocaleString()} ${wordLabel}, ${charCount.toLocaleString()} ${charLabel}\n` +
            `${translations.status.persistence}\n\n` +
            translations.status.readyToAnswer
        );
      }
      return;
    }

    // --- Question Handling (no command) ---

    // 1. Check if we have context in workspace state
    const cachedContext = context.workspaceState.get<string>(CACHE_KEY);
    const cachedUrl = context.workspaceState.get<string>(URL_KEY);
    if (!cachedContext) {
      const translations = t();
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

    // 2. If user just typed @pagepilot without question, show help
    if (!request.prompt.trim()) {
      const translations = t();
      const contextInfo = cachedUrl
        ? `\n${translations.help.currentContext} ${cachedUrl}`
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
          `- \`${translations.examples.useApi}\`\n` +
          `- \`${translations.examples.implementFunction}\`\n` +
          `- \`${translations.examples.explainPattern}\`\n` +
          `- \`${translations.examples.bestPractices}\``
      );
      return;
    }

    // 3. Build the LLM request (Copilot)
    const translations = t();
    stream.markdown(translations.loading.analyzing);

    // Create the prompt that will be sent to the LLM, injecting the context
    const isPortuguese =
      translations === t() && vscode.env.language.startsWith("pt");
    const systemPrompt = isPortuguese
      ? `Você é um assistente especialista em desenvolvimento de software. Use o contexto fornecido abaixo para enriquecer suas respostas sobre código, APIs, documentação técnica, bibliotecas, frameworks e práticas de desenvolvimento.

CONTEXTO CARREGADO:
\`\`\`
${cachedContext}
\`\`\`

INSTRUÇÃO: Responda à pergunta do usuário integrando as informações do contexto quando relevantes. Se o contexto não contiver informações pertinentes à pergunta, responda com base em seu conhecimento, mas mencione que não há informações específicas no contexto carregado.

PERGUNTA: ${request.prompt}

RESPOSTA:`
      : `You are a software development expert assistant. Use the context provided below to enrich your responses about code, APIs, technical documentation, libraries, frameworks, and development practices.

LOADED CONTEXT:
\`\`\`
${cachedContext}
\`\`\`

INSTRUCTION: Answer the user's question integrating information from the context when relevant. If the context doesn't contain pertinent information for the question, respond based on your knowledge, but mention that there's no specific information in the loaded context.

QUESTION: ${request.prompt}

ANSWER:`;

    const messages = [vscode.LanguageModelChatMessage.User(systemPrompt)];

    try {
      // Ask VS Code to use the default LLM (request.model contains the available model)
      const chatResponse = await request.model.sendRequest(messages, {}, token);

      // Send the LLM response back to chat in STREAMING mode
      for await (const fragment of chatResponse.text) {
        stream.markdown(fragment);
      }

      return;
    } catch (error) {
      // Handle LLM API errors (e.g. model not available, rate limit)
      const err = error as Error;
      const isPortuguese = vscode.env.language.startsWith("pt");
      const tryAgainLabel = isPortuguese
        ? "Tente novamente."
        : "Please try again.";

      stream.markdown(
        `${translations.errors.llmError} ${err.message}. ${tryAgainLabel}`
      );
      console.error(err);
      return;
    }
  };

  // --- Participant Registration ---
  const participant = vscode.chat.createChatParticipant("pagepilot", handler);
  participant.iconPath = new vscode.ThemeIcon("book"); // Book icon

  context.subscriptions.push(participant);
}

// This function is called when your extension is deactivated
export function deactivate() {}
