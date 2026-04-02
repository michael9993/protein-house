import type { StoreConfig } from "@/config/store.config";
import { DEFAULT_RTL_LOCALES } from "@/config";

/**
 * Server-side helper to resolve direction from config.
 * Can be used in layouts and server components.
 */
export function resolveDirection(config: StoreConfig): 'ltr' | 'rtl' {
  const localization = config.localization;
  const direction = localization?.direction || 'auto';
  const defaultLocale = localization?.defaultLocale || 'en-US';
  
  if (direction === 'auto') {
    // Auto-detect from locale
    const rtlLocales = localization?.rtlLocales || DEFAULT_RTL_LOCALES;
    const langCode = defaultLocale.split('-')[0].toLowerCase();
    return rtlLocales.some(rtl => 
      rtl.toLowerCase() === langCode || 
      defaultLocale.toLowerCase().startsWith(rtl.toLowerCase())
    ) ? 'rtl' : 'ltr';
  }
  
  return direction;
}

/**
 * Generate a blocking script that sets direction immediately.
 * This prevents FOUC (Flash of Unstyled Content) for RTL/LTR.
 */
export function generateDirectionScript(config: StoreConfig): string {
  const direction = resolveDirection(config);
  const locale = config.localization?.defaultLocale || 'en-US';
  
  return `
    (function() {
      var html = document.documentElement;
      html.setAttribute('dir', '${direction}');
      html.setAttribute('lang', '${locale}');
    })();
  `.trim();
}
