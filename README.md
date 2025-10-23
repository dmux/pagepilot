# PagePilot - Multi-Language Development Assistant

[![English](https://img.shields.io/badge/lang-en-red.svg)](#english) [![Português](https://img.shields.io/badge/lang-pt--br-green.svg)](#português-brasil)

PagePilot is a VS Code Chat participant that automatically loads external context (documentation, APIs, README files) to provide enhanced responses. **Language is automatically detected** from your VS Code settings.

## 🚀 PagePilot - Smart Context-Aware Development Assistant

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![VS Code](https://img.shields.io/badge/VS%20Code-1.105+-blue.svg)](https://code.visualstudio.com/)
[![English](https://img.shields.io/badge/lang-en-red.svg)](#english)
[![Português](https://img.shields.io/badge/lang-pt--br-green.svg)](#português-brasil)

## Transform your VS Code Chat experience with intelligent context loading

_Automatically detects your language and provides responses enriched with external documentation_

---

## ✨ Features

PagePilot revolutionizes your development workflow by seamlessly integrating external documentation, APIs, and project files directly into VS Code Chat. No more switching between tabs or searching through documentation - get instant, context-aware answers!

### 🎯 Core Capabilities

- **🌐 Smart Context Loading** - Load documentation, APIs, and README files from any URL
- **🔄 Persistent Storage** - Context persists between VS Code sessions using workspace state
- **🤖 AI Integration** - Enriches Copilot responses with your loaded context
- **🌍 Multi-Language** - Automatic language detection (English & Portuguese Brazil)
- **⚡ Real-time Streaming** - Live response streaming for immediate feedback
- **🛠 Command Management** - Full control with `/load`, `/clear`, and `/status` commands

### 🚀 Quick Start

1. **Install the extension** from the VS Code Marketplace
2. **Open VS Code Chat** (Ctrl+Alt+I / Cmd+Alt+I)
3. **Load context**: `@pagepilot /load https://your-docs-url.com`
4. **Ask questions**: `@pagepilot How do I implement feature X?`

### 💡 Usage Examples

#### Loading Documentation

```
@pagepilot /load https://raw.githubusercontent.com/microsoft/vscode/main/README.md
@pagepilot /load https://docs.github.com/en/rest/api-description
@pagepilot /load https://your-company.com/api-docs.txt
```

#### Asking Contextual Questions

```
@pagepilot How do I create a VS Code extension?
@pagepilot What are the authentication methods for this API?
@pagepilot Show me best practices from the loaded documentation
@pagepilot Implement a function based on this API spec
```

#### Managing Context

```
@pagepilot /status    # Check current loaded context
@pagepilot /clear     # Remove loaded context
@pagepilot           # Show help and current status
```

## 🌍 Multi-Language Support

PagePilot automatically detects your VS Code language setting:

- **🇺🇸 English** - Default interface for international users
- **🇧🇷 Português (Brasil)** - Native interface for Brazilian developers

All messages, commands, and AI responses adapt to your language preference automatically.

## 🔧 Commands Reference

| Command       | English Description              | Descrição em Português               |
| ------------- | -------------------------------- | ------------------------------------ |
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

### 0.0.1 (Current)

**Initial Release Features:**

- ✅ Multi-language support (English/Portuguese)
- ✅ Context loading from URLs
- ✅ Persistent workspace storage
- ✅ Real-time AI integration
- ✅ Command management system
- ✅ Automatic language detection

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/dmux/pagepilot/issues)
- **Documentation**: [Wiki](https://github.com/dmux/pagepilot/wiki)
- **Discussions**: [GitHub Discussions](https://github.com/dmux/pagepilot/discussions)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

