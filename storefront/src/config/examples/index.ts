/**
 * STORE CONFIGURATION EXAMPLES
 * ============================
 * Pre-built configurations for different store types.
 * Use these as starting points for new client stores.
 * 
 * Usage:
 * 1. Copy the example closest to your client's business
 * 2. Rename to `active-store.config.ts`
 * 3. Customize the values for the client
 */

export { sportsStoreConfig } from './sports-store.config';
export { digitalStoreConfig } from './digital-store.config';
export { foodStoreConfig } from './food-store.config';
export { electronicsStoreConfig } from './electronics-store.config';

// Re-export types and helpers
export {
  type StoreConfig,
  type StoreType,
  createStoreConfig,
  defaultStoreConfig,
  storeTypePresets,
  getThemeCSSVariables,
} from '../store.config';

