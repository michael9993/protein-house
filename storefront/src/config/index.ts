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

import { createStoreConfig, defaultStoreConfig } from './store.config';

// ============================================
// ACTIVE CONFIGURATION
// ============================================
// Pawzen pet accessories store. Runtime config from Storefront Control API overrides these values.
export const storeConfig = createStoreConfig('physical', defaultStoreConfig as any);

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
  buildComponentStyle,
} from './store.config';

// Export examples for reference
export * from './examples';

