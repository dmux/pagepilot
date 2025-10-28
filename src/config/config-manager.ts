import * as vscode from "vscode";
import { EmbeddingConfig, Language } from "../types/config";
import { DEFAULT_EMBEDDING_CONFIG, MINIMAL_EMBEDDING_CONFIG } from "./defaults";
import { validateEmbeddingConfig, mergeWithDefaults } from "./validation";

/**
 * Configuration manager for embedding settings
 * Handles loading, updating, and persisting configurations using VS Code workspace state
 */
export class ConfigManager {
  private static readonly CONFIG_KEY = "pagepilot.embeddingConfig";
  private static readonly CONFIG_VERSION_KEY =
    "pagepilot.embeddingConfigVersion";
  private static readonly CURRENT_VERSION = 1;

  private context: vscode.ExtensionContext;
  private currentConfig: EmbeddingConfig;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    this.currentConfig = this.loadConfig();
  }

  /**
   * Gets the current configuration
   */
  getConfig(): EmbeddingConfig {
    return { ...this.currentConfig };
  }

  /**
   * Updates the configuration with new values
   */
  async updateConfig(
    partialConfig: Partial<EmbeddingConfig>
  ): Promise<boolean> {
    try {
      const mergedConfig = { ...this.currentConfig, ...partialConfig };
      const validation = validateEmbeddingConfig(mergedConfig);

      if (!validation.isValid) {
        console.error("Configuration validation failed:", validation.errors);
        return false;
      }

      this.currentConfig = validation.sanitizedConfig!;
      await this.saveConfig();
      return true;
    } catch (error) {
      console.error("Failed to update configuration:", error);
      return false;
    }
  }

  /**
   * Resets configuration to defaults
   */
  async resetToDefaults(): Promise<void> {
    this.currentConfig = { ...DEFAULT_EMBEDDING_CONFIG };
    await this.saveConfig();
  }

  /**
   * Gets the default configuration (optimized for better context retrieval)
   */
  getDefaultConfig(): EmbeddingConfig {
    return { ...DEFAULT_EMBEDDING_CONFIG };
  }

  /**
   * Gets the minimal configuration (backward compatible)
   */
  getMinimalConfig(): EmbeddingConfig {
    return { ...MINIMAL_EMBEDDING_CONFIG };
  }

  /**
   * Loads configuration from workspace state with migration support
   */
  private loadConfig(): EmbeddingConfig {
    try {
      const storedVersion = this.context.workspaceState.get<number>(
        ConfigManager.CONFIG_VERSION_KEY,
        0
      );
      const storedConfig = this.context.workspaceState.get<
        Partial<EmbeddingConfig>
      >(ConfigManager.CONFIG_KEY);

      if (!storedConfig) {
        // No stored config, use defaults
        return { ...DEFAULT_EMBEDDING_CONFIG };
      }

      // Handle configuration migration if needed
      const migratedConfig = this.migrateConfig(storedConfig, storedVersion);

      // Validate and merge with defaults
      return mergeWithDefaults(migratedConfig);
    } catch (error) {
      console.error("Failed to load configuration, using defaults:", error);
      return { ...DEFAULT_EMBEDDING_CONFIG };
    }
  }

  /**
   * Saves current configuration to workspace state
   */
  private async saveConfig(): Promise<void> {
    try {
      await this.context.workspaceState.update(
        ConfigManager.CONFIG_KEY,
        this.currentConfig
      );
      await this.context.workspaceState.update(
        ConfigManager.CONFIG_VERSION_KEY,
        ConfigManager.CURRENT_VERSION
      );
    } catch (error) {
      console.error("Failed to save configuration:", error);
      throw error;
    }
  }

  /**
   * Migrates configuration from older versions
   */
  private migrateConfig(
    config: Partial<EmbeddingConfig>,
    version: number
  ): Partial<EmbeddingConfig> {
    let migratedConfig = { ...config };

    // Migration from version 0 to 1
    if (version < 1) {
      // Add any migration logic here for future versions
      // For now, just ensure all required fields have defaults
      if (migratedConfig.ngramSizes === undefined) {
        migratedConfig.ngramSizes = [1, 2];
      }
      if (migratedConfig.tfidfWeight === undefined) {
        migratedConfig.tfidfWeight = 0.7;
      }
      if (migratedConfig.language === undefined) {
        migratedConfig.language = Language.ENGLISH;
      }
    }

    return migratedConfig;
  }

  /**
   * Exports current configuration as JSON string
   */
  exportConfig(): string {
    return JSON.stringify(this.currentConfig, null, 2);
  }

  /**
   * Imports configuration from JSON string
   */
  async importConfig(configJson: string): Promise<boolean> {
    try {
      const parsedConfig = JSON.parse(configJson) as Partial<EmbeddingConfig>;
      return await this.updateConfig(parsedConfig);
    } catch (error) {
      console.error("Failed to import configuration:", error);
      return false;
    }
  }

  /**
   * Gets configuration for a specific language
   */
  getConfigForLanguage(language: Language): EmbeddingConfig {
    return {
      ...this.currentConfig,
      language,
    };
  }

  /**
   * Checks if the current configuration is using enhanced features
   */
  isEnhancedMode(): boolean {
    return (
      this.currentConfig.enableTFIDF ||
      this.currentConfig.enableStemming ||
      this.currentConfig.enableStopwordRemoval ||
      this.currentConfig.ngramSizes.some((n) => n > 1)
    );
  }

  /**
   * Gets a performance-optimized configuration for large documents
   */
  getPerformanceConfig(): EmbeddingConfig {
    return {
      ...this.currentConfig,
      ngramSizes: [1], // Only 1-grams for performance
      processingLimits: {
        ...this.currentConfig.processingLimits,
        maxVocabularySize: Math.min(
          this.currentConfig.processingLimits.maxVocabularySize,
          5000
        ),
        maxProcessingTimeMs: Math.min(
          this.currentConfig.processingLimits.maxProcessingTimeMs,
          2000
        ),
      },
    };
  }
}
