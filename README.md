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

| Command       | English Description              | Descrição em Português               |
| ------------- | -------------------------------- | ------------------------------------ |
| `/docs <add\|remove\|switch\|list>` | Manage documentation sources | Gerencia fontes de documentação |
| `/load <URL>` | Load context from external URL   | Carrega contexto de URL externa      |
| `/status`     | Show current context information | Mostra informações do contexto atual |
| `/clear`      | Remove all loaded context        | Remove todo o contexto carregado     |

## 📋 Supported Content Types

PagePilot works with various documentation formats:

- **📄 README files** - GitHub, GitLab, project documentation
- **📚 API Documentation** - REST APIs, GraphQL schemas, OpenAPI specs
- **🔧 Technical Specifications** - Architecture docs, design documents
- **📖 User Guides** - Implementation guides, tutorials
- **🤖 AI Context Files** - `llms.txt`, `llms-full.txt`, `ai.md`, context-specific files

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
