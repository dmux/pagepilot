import * as vscode from "vscode";
import { getTranslations } from "./util";
import { findMostRelevantChunks } from "./embeddings";
import { DocSource } from "./context";

export async function sendChatRequest(
  request: vscode.ChatRequest,
  token: vscode.CancellationToken,
  activeDoc: DocSource
) {
  const translations = getTranslations();

  const relevantChunks = findMostRelevantChunks(request.prompt, activeDoc.embeddings);
  const context = relevantChunks.join("\n");

  const isPortuguese =
    vscode.env.language.startsWith("pt");
  const systemPrompt = isPortuguese
    ? `Você é um assistente especialista em desenvolvimento de software. Use o contexto fornecido abaixo para enriquecer suas respostas sobre código, APIs, documentação técnica, bibliotecas, frameworks e práticas de desenvolvimento.

CONTEXTO CARREGADO:
\`\`\`
${context}
\`\`\`

INSTRUÇÃO: Responda à pergunta do usuário integrando as informações do contexto quando relevantes. Se o contexto não contiver informações pertinentes à pergunta, responda com base em seu conhecimento, mas mencione que não há informações específicas no contexto carregado.

PERGUNTA: ${request.prompt}

RESPOSTA:`
    : `You are a software development expert assistant. Use the context provided below to enrich your responses about code, APIs, technical documentation, libraries, frameworks, and development practices.

LOADED CONTEXT:
\`\`\`
${context}
\`\`\`

INSTRUCTION: Answer the user's question integrating information from the context when relevant. If the context doesn't contain pertinent information for the question, respond based on your knowledge, but mention that there's no specific information in the loaded context.

QUESTION: ${request.prompt}

ANSWER:`;

  const messages = [vscode.LanguageModelChatMessage.User(systemPrompt)];

  const chatResponse = await request.model.sendRequest(messages, {}, token);

  return chatResponse;
}
