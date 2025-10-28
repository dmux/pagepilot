import * as vscode from "vscode";

// Supported languages
export type SupportedLanguage = "en" | "pt-BR";

// Translation interface
interface Translations {
  // Docs command
  docs: {
    add: {
      usage: string;
      success: string;
    };
    remove: {
      usage: string;
      success: string;
    };
    switch: {
      usage: string;
      success: string;
    };
    list: {
      noDocs: string;
      availableDocs: string;
    };
    clear: {
      success: string;
      confirmation: string;
    };
    select: {
      placeholder: string;
    };
    usage: string;
  };

  // Commands help
  loadCommandHelp: {
    title: string;
    usage: string;
    examples: string;
    tip: string;
  };

  // Loading messages
  loading: {
    context: string;
    analyzing: string;
  };

  // Success messages
  success: {
    loaded: string;
    cleared: string;
    source: string;
    statistics: string;
    ready: string;
  };

  // Error messages
  errors: {
    loadFailed: string;
    url: string;
    error: string;
    tips: string;
    urlAccessible: string;
    plainText: string;
    testBrowser: string;
    llmError: string;
  };

  // Status messages
  status: {
    noContext: string;
    contextStatus: string;
    persistence: string;
    readyToAnswer: string;
  };

  // Help messages
  help: {
    noContextTitle: string;
    noContextDescription: string;
    apiDocs: string;
    projectReadme: string;
    techSpecs: string;
    formatExpected: string;
    aiTip: string;

    welcomeTitle: string;
    activeContext: string;
    capabilities: {
      codeAnalysis: string;
      techDocs: string;
      contextImplementation: string;
      debugOptimization: string;
    };
    usageExamples: string;
    currentContext: string;
  };

  // Usage examples
  examples: {
    useApi: string;
    implementFunction: string;
    explainPattern: string;
    bestPractices: string;
  };
}

// English translations
const enTranslations: Translations = {
  docs: {
    add: {
      usage: "**Usage:** `/docs add <name> <url>`",
      success: '✅ **Documentation source "{name}" added and set as active!**',
    },
    remove: {
      usage: "**Usage:** `/docs remove <name>`",
      success: '🗑️ **Documentation source "{name}" removed!**',
    },
    switch: {
      usage: "**Usage:** `/docs switch <name>`",
      success: '🔄 **Switched to documentation source "{name}"!**',
    },
    list: {
      noDocs: "🔍 **No documentation sources found.**",
      availableDocs: "📚 **Available documentation sources:**",
    },
    clear: {
      success: "🧹 **All documentation sources cleared!**",
      confirmation:
        "⚠️ **This will remove all loaded documentation sources. Are you sure?**",
    },
    select: {
      placeholder: "Select a documentation file to load",
    },
    usage: "**Usage:** `/docs <add|remove|switch|list|clear>`",
  },

  loadCommandHelp: {
    title: "📋 **Development Context Loader**",
    usage: "**Usage:** `/load <URL>`",
    examples: "**Examples:**",
    tip: "💡 Load API documentation, READMEs, specifications or any technical text!",
  },

  loading: {
    context: "🔍 Loading development context from:",
    analyzing: "🤖 Analyzing your question with the loaded context...",
  },

  success: {
    loaded: "✅ **Context loaded successfully!**",
    cleared:
      "🗑️ **Context cleared successfully!**\n\nUse `/load <URL>` to load new context.",
    source: "📄 **Source:**",
    statistics: "📊 **Statistics:**",
    ready:
      "🚀 **Ready!** Now I can help with specific questions about this context.",
  },

  errors: {
    loadFailed: "❌ **Error loading context**",
    url: "**URL:**",
    error: "**Error:**",
    tips: "💡 **Tips:**",
    urlAccessible: "• Check if the URL is accessible",
    plainText: "• Confirm it returns plain text",
    testBrowser: "• Test the URL in browser first",
    llmError: "LLM contact error:",
  },

  status: {
    noContext: "🔍 **No context loaded**\n\nUse `/load <URL>` to load context.",
    contextStatus: "📊 **Context Status**",
    persistence:
      "💾 **Persistence:** Saved in workspace (maintained between sessions)",
    readyToAnswer: "✅ Ready to answer questions about this context!",
  },

  help: {
    noContextTitle: "🔍 **No context loaded**",
    noContextDescription:
      "To get enriched responses with specific context, load first:",
    apiDocs: "• **API Documentation**",
    projectReadme: "• **Project README**",
    techSpecs: "• **Technical Specifications**",
    formatExpected:
      "📋 Expected format: Plain text, Markdown, or any technical documentation.",
    aiTip:
      "⚡ **Tip:** Many projects have `llms.txt` or `ai.md` files in the root for AI context!",

    welcomeTitle:
      "👋 **PagePilot** - Development assistant with loaded context!",
    activeContext: "✅ Active context - Now I can help with:",
    capabilities: {
      codeAnalysis: "• Code and API analysis",
      techDocs: "• Technical documentation explanation",
      contextImplementation: "• Context-based implementation",
      debugOptimization: "• Debug and optimization",
    },
    usageExamples: "💡 **Usage examples:**",
    currentContext: "📍 **Current context:**",
  },

  examples: {
    useApi: "How to use the XYZ API?",
    implementFunction: "Implement the ABC function",
    explainPattern: "Explain this code pattern",
    bestPractices: "What are the best practices for...?",
  },
};

// Portuguese (Brazil) translations
const ptBRTranslations: Translations = {
  docs: {
    add: {
      usage: "**Uso:** `/docs add <nome> <url>`",
      success:
        '✅ **Fonte de documentação "{name}" adicionada e definida como ativa!**',
    },
    remove: {
      usage: "**Uso:** `/docs remove <nome>`",
      success: '🗑️ **Fonte de documentação "{name}" removida!**',
    },
    switch: {
      usage: "**Uso:** `/docs switch <nome>`",
      success: '🔄 **Alternado para a fonte de documentação "{name}"!**',
    },
    list: {
      noDocs: "🔍 **Nenhuma fonte de documentação encontrada.**",
      availableDocs: "📚 **Fontes de documentação disponíveis:**",
    },
    clear: {
      success: "🧹 **Todas as fontes de documentação foram removidas!**",
      confirmation:
        "⚠️ **Isso removerá todas as fontes de documentação carregadas. Tem certeza?**",
    },
    select: {
      placeholder: "Selecione um arquivo de documentação para carregar",
    },
    usage: "**Uso:** `/docs <add|remove|switch|list|clear>`",
  },

  loadCommandHelp: {
    title: "📋 **Carregador de Contexto para Desenvolvimento**",
    usage: "**Uso:** `/load <URL>`",
    examples: "**Exemplos:**",
    tip: "💡 Carregue documentação de APIs, READMEs, especificações ou qualquer texto técnico!",
  },

  loading: {
    context: "🔍 Carregando contexto de desenvolvimento de:",
    analyzing: "🤖 Analisando sua pergunta com o contexto carregado...",
  },

  success: {
    loaded: "✅ **Contexto carregado com sucesso!**",
    cleared:
      "🗑️ **Contexto limpo com sucesso!**\n\nUse `/load <URL>` para carregar um novo contexto.",
    source: "📄 **Fonte:**",
    statistics: "📊 **Estatísticas:**",
    ready:
      "🚀 **Pronto!** Agora posso ajudar com questões específicas sobre este contexto.",
  },

  errors: {
    loadFailed: "❌ **Erro ao carregar contexto**",
    url: "**URL:**",
    error: "**Erro:**",
    tips: "💡 **Dicas:**",
    urlAccessible: "• Verifique se a URL está acessível",
    plainText: "• Confirme se retorna texto plano",
    testBrowser: "• Teste a URL no navegador primeiro",
    llmError: "Erro ao contatar o LLM:",
  },

  status: {
    noContext:
      "🔍 **Nenhum contexto carregado**\n\nUse `/load <URL>` para carregar contexto.",
    contextStatus: "📊 **Status do Contexto**",
    persistence:
      "💾 **Persistência:** Salvo no workspace (mantido entre sessões)",
    readyToAnswer: "✅ Pronto para responder perguntas sobre este contexto!",
  },

  help: {
    noContextTitle: "🔍 **Nenhum contexto carregado**",
    noContextDescription:
      "Para ter respostas enriquecidas com contexto específico, carregue primeiro:",
    apiDocs: "• **Documentação de API**",
    projectReadme: "• **README de projeto**",
    techSpecs: "• **Especificações técnicas**",
    formatExpected:
      "📋 Formato esperado: Texto plano, Markdown, ou qualquer documentação técnica.",
    aiTip:
      "⚡ **Dica:** Muitos projetos têm arquivos `llms.txt` ou `ai.md` na raiz para contexto de IA!",

    welcomeTitle:
      "👋 **PagePilot** - Assistente de desenvolvimento com contexto carregado!",
    activeContext: "✅ Contexto ativo - Agora posso ajudar com:",
    capabilities: {
      codeAnalysis: "• Análise de código e APIs",
      techDocs: "• Explicação de documentação técnica",
      contextImplementation: "• Implementação baseada no contexto",
      debugOptimization: "• Debug e otimização",
    },
    usageExamples: "💡 **Exemplos de uso:**",
    currentContext: "📍 **Contexto atual:**",
  },

  examples: {
    useApi: "Como usar a API XYZ?",
    implementFunction: "Implemente a função ABC",
    explainPattern: "Explique este padrão de código",
    bestPractices: "Quais são as melhores práticas para...?",
  },
};

// Translation map
const translations: Record<SupportedLanguage, Translations> = {
  en: enTranslations,
  "pt-BR": ptBRTranslations,
};

// Get current language from VS Code
export function getCurrentLanguage(): SupportedLanguage {
  const vscodeLanguage = vscode.env.language;

  // Check for Portuguese variants
  if (vscodeLanguage.startsWith("pt")) {
    return "pt-BR";
  }

  // Default to English for all other languages
  return "en";
}

// Get translations for current language
export function getTranslations(): Translations {
  const currentLanguage = getCurrentLanguage();
  return translations[currentLanguage];
}

// Convenience function to get a specific translation
export function t(): Translations {
  return getTranslations();
}
