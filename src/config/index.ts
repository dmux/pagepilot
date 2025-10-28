/**
 * Configuration management exports
 */

export { ConfigManager } from "./config-manager";
export {
  DEFAULT_EMBEDDING_CONFIG,
  MINIMAL_EMBEDDING_CONFIG,
  TECHNICAL_EMBEDDING_CONFIG,
  BALANCED_EMBEDDING_CONFIG,
  DEFAULT_PROCESSING_LIMITS,
} from "./defaults";
export { validateEmbeddingConfig, mergeWithDefaults } from "./validation";
export { getOptimalConfigForCorpus } from "./optimizer";
export * from "../types/config";
