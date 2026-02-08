/**
 * ACTIVE STORE CONFIGURATION
 * ==========================
 * This file exports the active store configuration.
 * 
 * To switch stores, change the import below to your client's config.
 * 
 * Example:
 *   import { sportsStoreConfig as activeConfig } from './examples/sports-store.config';
 */

import { sportsStoreConfig } from './examples/sports-store.config';

// ============================================
// ACTIVE CONFIGURATION
// ============================================
// Change this import to switch between store configurations
// Currently using: SportZone (Sports Store)
export const storeConfig = sportsStoreConfig;

// ============================================
// RE-EXPORTS
// ============================================
export {
  type StoreConfig,
  type StoreType,
  type HomepageSectionId,
  createStoreConfig,
  defaultStoreConfig,
  storeTypePresets,
  getThemeCSSVariables,
  DEFAULT_RTL_LOCALES,
  DEFAULT_SECTION_ORDER,
  DEFAULT_FILTERS_TEXT,
  DEFAULT_NOT_FOUND_TEXT,
  ANIMATION_PRESETS,
} from './store.config';

// Export examples for reference
export * from './examples';

