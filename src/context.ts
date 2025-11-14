import * as vscode from "vscode";
import { ChunkMetadata } from "./enhanced-embedding-generator";
import { EmbeddingConfig } from "./types/config";

const DOC_SOURCES_KEY = "docSources";
const ACTIVE_DOC_KEY = "activeDoc";

export interface Embedding {
  chunk: string;
  embedding: number[];
  metadata?: ChunkMetadata;
}

export interface DocSource {
  name: string;
  url: string;
  content: string;
  embeddings: Embedding[];
  embeddingConfig?: EmbeddingConfig;
}

export function getDocSources(context: vscode.ExtensionContext): DocSource[] {
  return context.workspaceState.get<DocSource[]>(DOC_SOURCES_KEY, []);
}

export async function addDocSource(
  context: vscode.ExtensionContext,
  name: string,
  url: string,
  content: string,
  embeddings: Embedding[],
  embeddingConfig?: EmbeddingConfig
) {
  const sources = getDocSources(context);
  sources.push({ name, url, content, embeddings, embeddingConfig });
  await context.workspaceState.update(DOC_SOURCES_KEY, sources);
}

export async function removeDocSource(
  context: vscode.ExtensionContext,
  name: string
) {
  let sources = getDocSources(context);
  sources = sources.filter((source) => source.name !== name);
  await context.workspaceState.update(DOC_SOURCES_KEY, sources);
}

export function getActiveDoc(
  context: vscode.ExtensionContext
): DocSource | undefined {
  return context.workspaceState.get<DocSource>(ACTIVE_DOC_KEY);
}

export async function setActiveDoc(
  context: vscode.ExtensionContext,
  name: string
) {
  const sources = getDocSources(context);
  const source = sources.find((source) => source.name === name);
  await context.workspaceState.update(ACTIVE_DOC_KEY, source);
}

export async function clearActiveDoc(context: vscode.ExtensionContext) {
  await context.workspaceState.update(ACTIVE_DOC_KEY, undefined);
}

export async function clearAllDocSources(context: vscode.ExtensionContext) {
  await context.workspaceState.update(DOC_SOURCES_KEY, []);
  await context.workspaceState.update(ACTIVE_DOC_KEY, undefined);
}
