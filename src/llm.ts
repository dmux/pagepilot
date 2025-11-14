import * as vscode from "vscode";
import { getTranslations } from "./util";
import { findMostRelevantChunksEnhanced } from "./embeddings";
import { DocSource } from "./context";

export async function sendChatRequest(
  request: vscode.ChatRequest,
  token: vscode.CancellationToken,
  activeDoc: DocSource
) {
  const translations = getTranslations();
  const isPortuguese = vscode.env.language.startsWith("pt");

  const languagePreference = isPortuguese ? "pt" : "en";

  const relevantResults = findMostRelevantChunksEnhanced(
    request.prompt,
    activeDoc.embeddings,
    {
      topK: 8,
      minSimilarity: 0,
      languagePreference,
    }
  );

  const context =
    relevantResults.length > 0
      ? relevantResults
          .map(
            (result, index) => `Context #${index + 1}:
${result.chunk}`
          )
          .join("\n\n---\n\n")
      : "(no relevant context retrieved)";

  const systemPrompt = isPortuguese
    ? `Você é um assistente especialista em desenvolvimento de software. Sua tarefa é ajudar o usuário a escrever e entender código usando o CONTEXTO CARREGADO abaixo.

CONTEXTO CARREGADO:
\`\`\`
${context}
\`\`\`

INSTRUÇÃO: Responda à pergunta do usuário.
1. Integre as informações do contexto para fornecer respostas precisas.
2. Se o usuário pedir para "implementar", "criar" ou "mostrar" código, gere o código diretamente, baseando-se nos exemplos e padrões do contexto.
3. Se o contexto não contiver informações pertinentes, responda com base em seu conhecimento geral, mas mencione que o contexto não foi usado.

PERGUNTA: ${request.prompt}

RESPOSTA:`
    : `You are a software development expert assistant. Your task is to help the user write and understand code using the LOADED CONTEXT below.

LOADED CONTEXT:
\`\`\`
${context}
\`\`\`

INSTRUCTION: Answer the user's question.
1. Integrate information from the context to provide accurate answers.
2. If the user asks to "implement", "create", or "show" code, generate the code directly, basing it on examples and patterns from the context.
3. If the context doesn't contain pertinent information, respond based on your knowledge, but mention that there's no specific information in the loaded context.

QUESTION: ${request.prompt}

ANSWER:`;

  const messages = [vscode.LanguageModelChatMessage.User(systemPrompt)];

  const chatResponse = await request.model.sendRequest(messages, {}, token);

  return chatResponse;
}
