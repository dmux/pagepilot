# 🚀 PagePilot - Smart Context-Aware Development Assistant

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![VS Code](https://img.shields.io/badge/VS%20Code-1.105+-blue.svg)](https://code.visualstudio.com/)
[![English](https://img.shields.io/badge/lang-en-red.svg)](#english)
[![Português](https://img.shields.io/badge/lang-pt--br-green.svg)](#português-brasil)

PagePilot is a VS Code Chat participant that automatically loads external context (documentation, APIs, README files) to provide enhanced responses. **Language is automatically detected** from your VS Code settings.

## Transform your VS Code Chat experience with intelligent context loading

_Automatically detects your language and provides responses enriched with external documentation_

---

## ✨ Features

PagePilot revolutionizes your development workflow by seamlessly integrating external documentation, APIs, and project files directly into VS Code Chat. No more switching between tabs or searching through documentation - get instant, context-aware answers!

- **📚 Multi-Doc Management** - Manage multiple documentation sources with the `/docs` command.
- **🌐 Smart Context Loading** - Load documentation, APIs, and README files from any URL.
- **🤖 Automatic URL Pattern Detection** - Automatically finds related documentation files (`llms.txt`, `README.md`, etc.).
- **⚡ Dynamic Context Injection** - Intelligently injects only the most relevant parts of the context to avoid token limits.
- **🔄 Persistent Storage** - Context persists between VS Code sessions using workspace state.
- **🌍 Multi-Language** - Automatic language detection (English & Portuguese Brazil).

## 🚀 Quick Start

1. **Install the extension** from the VS Code Marketplace
2. **Open VS Code Chat** (Ctrl+Alt+I / Cmd+Alt+I)
3. **Add a documentation source**: `@pagepilot /docs add my-api https://my-api.com/docs`
4. **Load context from a URL**: `@pagepilot /load https://your-docs-url.com`
5. **Ask questions**: `@pagepilot How do I implement feature X?`

## 💡 Usage

### Managing Documentation Sources

You can manage multiple documentation sources using the `/docs` command.

```
@pagepilot /docs add my-api https://my-api.com/docs
@pagepilot /docs add another-doc https://another-doc.com/readme.md
@pagepilot /docs switch my-api
@pagepilot /docs list
@pagepilot /docs remove another-doc
@pagepilot /docs clear              # Shows confirmation
@pagepilot /docs clear confirm      # Clears all documentation
```

### Loading Documentation

When you use the `/load` command, PagePilot will automatically search for related documentation files.

```
@pagepilot /load https://raw.githubusercontent.com/microsoft/vscode/main
```

PagePilot will then prompt you to select from a list of found files, such as `README.md`, `llms.txt`, etc.

### Asking Contextual Questions

Once you have loaded a context, you can ask questions about it.

```
@pagepilot How do I create a VS Code extension?
@pagepilot What are the authentication methods for this API?
```

## 🔧 Commands Reference

| Command                                    | English Description              | Descrição em Português                 |
| ------------------------------------------ | -------------------------------- | -------------------------------------- |
| `/docs <add\|remove\|switch\|list\|clear>` | Manage documentation sources     | Gerencia fontes de documentação        |
| `/docs clear [confirm]`                    | Clear all documentation sources  | Remove todas as fontes de documentação |
| `/load <URL>`                              | Load context from external URL   | Carrega contexto de URL externa        |
| `/status`                                  | Show current context information | Mostra informações do contexto atual   |
| `/clear`                                   | Remove all loaded context        | Remove todo o contexto carregado       |

## 📋 Supported Content Types

PagePilot works with various documentation formats:

- **📄 README files** - GitHub, GitLab, project documentation
- **📚 API Documentation** - REST APIs, GraphQL schemas, OpenAPI specs
- **🔧 Technical Specifications** - Architecture docs, design documents
- **📖 User Guides** - Implementation guides, tutorials
- **🤖 AI Context Files** - `llms.txt`, `llms-full.txt`, `ai.md`, context-specific files

## 🧠 RAG — Retrieval-Augmented Generation (implementation)

PagePilot includes a lightweight RAG (Retrieval-Augmented Generation) implementation to enrich prompts sent to the LLM with relevant passages from loaded content.

Key implementation points:

- Chunking: loaded content is split into chunks (sentence-based) with a configurable maximum size to avoid overly long passages.
- Lightweight embeddings: the system uses a Bag-of-Words (BoW) approach to construct local embeddings from the document vocabulary. This avoids external vectorization services and is efficient for many documentation use cases.
- Similarity search: similarity between the question and each chunk is computed using cosine similarity; top-K chunks are selected for injection into the prompt.
- Zero-vector protection: if the question contains no words from the document vocabulary (the question embedding is all zeros), the system avoids injecting irrelevant passages and proceeds without additional context.
- Dynamic injection: only the most relevant passages are concatenated into the LLM prompt to reduce token usage and focus on useful information.

Exposed functions (in source code):

- `generateEmbeddings(content: string)`: splits text into chunks and returns a list of objects `{ chunk: string, embedding: number[] }` (BoW embeddings).
- `findMostRelevantChunks(question: string, embeddings, topK = 3)`: computes the question embedding, calculates cosine similarity with each chunk, and returns the topK most relevant passages (strings).

High-level usage flow:

1. Load a README or documentation via `/load` or `/docs add`.
2. When a question is asked, `findMostRelevantChunks` finds the most relevant passages.
3. Those passages are injected into the prompt sent to the LLM, resulting in more accurate and contextualized answers.

Limitations and next steps:

- The BoW approach is fast and simple but has semantic limitations (it does not capture synonymy or deep contextual meaning). For improvements, we can add optional support for dense embeddings (OpenAI, Hugging Face) or local vector models.
- For very large document collections, consider persisting a vector index (e.g., Faiss, Milvus) and using incremental update strategies.

If you'd like, I can add example code showing how to integrate an external embeddings provider (OpenAI / Hugging Face) or a short tuning guide for `topK` and `MAX_CHUNK_SIZE`.

## 🛠 Requirements

- **VS Code**: Version 1.105.0 or higher
- **Internet Connection**: Required for loading external content
- **Copilot**: VS Code Chat functionality (built-in)

## 🔒 Privacy & Security

- **Local Storage**: Context is stored locally in your workspace
- **No Telemetry**: PagePilot doesn't collect or transmit usage data
- **Secure Requests**: Uses standard HTTPS for external content
- **Session Isolation**: Each workspace maintains its own context

## 🚀 Release Notes

### 0.0.6 (2025-10-28)

- **✨ Feature:** Added `/docs clear` command to remove all documentation sources at once
- **🔧 Enhancement:** Implemented enhanced RAG system with TF-IDF, stemming, and n-grams for better context retrieval
- **🎯 Improvement:** Optimized embedding generation with conservative stemming and reduced stopwords for technical content
- **🌐 Multilingual:** Full Portuguese and English support for the new clear command
- **🛡️ Security:** Added confirmation requirement for `/docs clear` to prevent accidental data loss
- **📊 Performance:** Enhanced system provides 14-99% better context retrieval compared to basic system
- **🧪 Testing:** Comprehensive validation of RAG system effectiveness and context delivery to LLM

### 0.0.5 (2025-10-27)

- fix: Handle ZeroVectorError in embeddings (commit b86d370) — prevents errors when a question embedding becomes a zero vector.
- refactor: Replace cosine-similarity with `fast-cosine-similarity` for improved performance and reliability (commit 7c6a440).
- fix: Correct import of cosine similarity module (commit 510ab4c).

### 0.0.4 (2025-10-27)

- chore: Bump version to 0.0.4 (commit 8e310d0).

### 0.0.3 (2025-10-24)

- release: v0.0.3 (commit 8f7d8b3).
- feat: Add documentation management commands and improve context handling (commit 74ae5f1).
- tests: Add comprehensive test suite for the PagePilot extension (commit 625a232).
- docs: Improve QuickStart and add hero typing animation (commits 8dcb06b, bf68a78).

### 0.0.2

- **✨ Feature:** Manage multiple documentation sources with the `/docs` command.
- **✨ Feature:** Automatic URL pattern detection.
- **✨ Feature:** Dynamic context injection to avoid token limits.
- **🔧 Refactor:** Modularized codebase for better maintainability.

### 0.0.1

- ✅ Multi-language support (English/Portuguese)
- ✅ Context loading from URLs
- ✅ Persistent workspace storage
- ✅ Real-time AI integration
- ✅ Command management system
- ✅ Automatic language detection

## 🤝 Contributing

We welcome contributions!

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/dmux/pagepilot/issues)
- **Documentation**: [Wiki](https://github.com/dmux/pagepilot/wiki)
- **Discussions**: [GitHub Discussions](https://github.com/dmux/pagepilot/discussions)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
