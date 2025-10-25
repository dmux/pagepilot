import * as vscode from "vscode";
import axios from "axios";
import { getTranslations } from "./util";
import {
  addDocSource,
  removeDocSource,
  getDocSources,
  setActiveDoc,
  getActiveDoc,
  clearActiveDoc,
} from "./context";
import { generateEmbeddings } from "./embeddings";

export async function handleDocsCommand(
  context: vscode.ExtensionContext,
  stream: vscode.ChatResponseStream,
  args: string[]
) {
  const [subcommand, ...rest] = args;
  const translations = getTranslations();

  switch (subcommand) {
    case "add":
      const [name, url] = rest;
      if (!name || !url) {
        stream.markdown(translations.docs.add.usage);
        return;
      }
      stream.markdown(`${translations.loading.context} 
${url}
...`);
      try {
        const response = await axios.get(url, { timeout: 10000 });
        const content = response.data as string;
        const embeddings = generateEmbeddings(content);
        await addDocSource(context, name, url, content, embeddings);
        await setActiveDoc(context, name);
        stream.markdown(translations.docs.add.success.replace("{name}", name));
      } catch (error) {
        const err = error as Error;
        stream.markdown(
          `${translations.errors.loadFailed}

` +
            `${translations.errors.url} ${url}
` +
            `${translations.errors.error} ${err.message}`
        );
      }
      break;
    case "remove":
      const [nameToRemove] = rest;
      if (!nameToRemove) {
        stream.markdown(translations.docs.remove.usage);
        return;
      }
      await removeDocSource(context, nameToRemove);
      stream.markdown(translations.docs.remove.success.replace("{name}", nameToRemove));
      break;
    case "switch":
      const [nameToSwitch] = rest;
      if (!nameToSwitch) {
        stream.markdown(translations.docs.switch.usage);
        return;
      }
      await setActiveDoc(context, nameToSwitch);
      stream.markdown(translations.docs.switch.success.replace("{name}", nameToSwitch));
      break;
    case "list":
      const sources = getDocSources(context);
      if (sources.length === 0) {
        stream.markdown(translations.docs.list.noDocs);
        return;
      }
      const activeDoc = getActiveDoc(context);
      const sourceList = sources
        .map(
          (source) =>
            `  • ${source.name} ${source.name === activeDoc?.name ? "(active)" : ""}`
        )
        .join("\n");
      stream.markdown(`${translations.docs.list.availableDocs}\n${sourceList}`);
      break;
    default:
      stream.markdown(translations.docs.usage);
      break;
  }
}

export async function findRelatedDocs(url: string): Promise<string[]> {
  const relatedDocs: string[] = [];
  const patterns = ["llms.txt", "llms-full.txt", "ai.md", "README.md"];
  const baseUrl = url.substring(0, url.lastIndexOf("/"));

  for (const pattern of patterns) {
    const docUrl = `${baseUrl}/${pattern}`;
    try {
      await axios.head(docUrl, { timeout: 2000 });
      relatedDocs.push(docUrl);
    } catch (error) {
      // Ignore errors
    }
  }

  return relatedDocs;
}

export async function handleLoadCommand(
  context: vscode.ExtensionContext,
  stream: vscode.ChatResponseStream,
  url: string
) {
  const translations = getTranslations();
  if (!url) {
    stream.markdown(
      `${translations.loadCommandHelp.title}\n\n` +
        `${translations.loadCommandHelp.usage}\n\n` +
        `${translations.loadCommandHelp.examples}\n` +
        `• /load https://raw.githubusercontent.com/user/repo/main/README.md
` +
        `• /load https://docs.api.com/reference.txt
` +
        `• /load https://projeto.com/llms.txt

` +
        translations.loadCommandHelp.tip
    );
    return;
  }

  stream.markdown(`${translations.loading.context} 
${url}
...`);
  try {
    const relatedDocs = await findRelatedDocs(url);
    if (relatedDocs.length > 0) {
      const quickPicks = relatedDocs.map((doc) => ({ label: doc }));
      const selectedDoc = await vscode.window.showQuickPick(quickPicks, {
        placeHolder: "Select a documentation file to load",
      });

      if (selectedDoc) {
        url = selectedDoc.label;
      }
    }

    const response = await axios.get(url, { timeout: 10000 });
    const content = response.data as string;
    const name = url.split("/").pop() || url;
    const embeddings = generateEmbeddings(content);

    await addDocSource(context, name, url, content, embeddings);
    await setActiveDoc(context, name);

    const wordCount = content.split(/\s+/).length;
    const charCount = content.length;

    const isPortuguese = vscode.env.language.startsWith("pt");
    const wordLabel = isPortuguese ? "palavras" : "words";
    const charLabel = isPortuguese ? "caracteres" : "characters";

    stream.markdown(
      `${translations.success.loaded}\n\n` +
        `${translations.success.source} ${url}\n` +
        `${translations.success.statistics} ${wordCount.toLocaleString()} ${wordLabel}, ${charCount.toLocaleString()} ${charLabel}\n\n` +
        translations.success.ready
    );
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
  }
}

export async function handleClearCommand(
  context: vscode.ExtensionContext,
  stream: vscode.ChatResponseStream
) {
  const translations = getTranslations();
  await clearActiveDoc(context);
  stream.markdown(translations.success.cleared);
}

export function handleStatusCommand(
  context: vscode.ExtensionContext,
  stream: vscode.ChatResponseStream
) {
  const translations = getTranslations();
  const activeDoc = getActiveDoc(context);

  if (!activeDoc) {
    stream.markdown(translations.status.noContext);
  } else {
    const wordCount = activeDoc.content.split(/\s+/).length;
    const charCount = activeDoc.content.length;
    const isPortuguese = vscode.env.language.startsWith("pt");
    const wordLabel = isPortuguese ? "palavras" : "words";
    const charLabel = isPortuguese ? "caracteres" : "characters";

    stream.markdown(
      `${translations.status.contextStatus}\n\n` +
        `${translations.success.source} ${activeDoc.url}\n` +
        `${translations.success.statistics} ${wordCount.toLocaleString()} ${wordLabel}, ${charCount.toLocaleString()} ${charLabel}\n` +
        `${translations.status.persistence}\n\n` +
        translations.status.readyToAnswer
    );
  }
}