// Main store exports
export { createStore, makeMySQLStore } from "./store/index.js";
export { OptimizedMySQLStore } from "./store/mysql-store.js";

// Utility exports
export { BatchProcessor, DbHelpers } from "./store/utils/batch-processor.js";
export { CacheWarmer } from "./store/utils/cache-warmer.js";
export { isJidUser } from "./store/utils/jid.js";

// Type exports
export type {
  GroupMetadataRow,
  GroupMetadataEntry,
  GroupMetadataResult
} from "./store/types.js";
export { messageTypeMap } from "./store/types.js";

// Auth exports
export { createAuth, useMySQLAuthState } from "./auth/index.js";
export type {
  AuthenticationState,
  AuthenticationCreds,
  SignalDataTypeMap,
  KeyPair
} from "./auth/types.js";
