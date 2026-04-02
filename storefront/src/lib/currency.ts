/**
 * Currency Utilities
 * 
 * Provides currency symbol resolution for display purposes.
 * Uses Intl.NumberFormat for standard currency symbols with fallback map.
 */

/**
 * Get currency symbol for a given currency code or name
 * 
 * Uses a comprehensive symbol map for reliable symbol resolution.
 * Falls back to currency code if unknown (e.g., "ILS 100" instead of wrong symbol).
 * 
 * Handles currency codes from Saleor channels which are ISO 4217 codes (uppercase):
 * - "ILS" or "NIS" or "Israeli New Shekel" -> "₪"
 * - "USD" -> "$"
 * - "EUR" -> "€"
 * - Unknown codes fall back to displaying the code itself (NOT USD)
 * 
 * @param currencyCode - ISO 4217 currency code or name (e.g., "USD", "ILS", "NIS", "EUR", "Israeli New Shekel") - case insensitive
 * @returns Currency symbol (e.g., "$", "₪", "€") or currency code if symbol unavailable
 */
export function getCurrencySymbol(currencyCode: string | null | undefined): string {
  if (!currencyCode) {
    // Return empty string instead of USD fallback - let caller handle empty case
    return "";
  }

  // Normalize: trim whitespace, convert to uppercase for code matching
  // Handle both currency codes (ILS, USD) and names (Israeli New Shekel)
  const normalized = currencyCode.trim();
  const upperCode = normalized.toUpperCase();
  
  // First, check if it's already a symbol (e.g., "₪")
  if (normalized === "₪") {
    return "₪";
  }

  // Map currency names to codes (for handling full names like "Israeli New Shekel")
  const nameToCodeMap: Record<string, string> = {
    "ISRAELI NEW SHEKEL": "ILS",
    "NEW ISRAELI SHEKEL": "ILS",
    "ISRAELI SHEKEL": "ILS",
    "SHEKEL": "ILS",
    "NIS": "ILS", // Common alias for ILS
    "US DOLLAR": "USD",
    "DOLLAR": "USD",
    "EURO": "EUR",
    "BRITISH POUND": "GBP",
    "POUND": "GBP",
    "STERLING": "GBP",
    "JAPANESE YEN": "JPY",
    "YEN": "JPY",
  };

  // Resolve name to code if it's a currency name
  let code = upperCode;
  if (nameToCodeMap[upperCode]) {
    code = nameToCodeMap[upperCode];
  } else {
    // Check if it contains currency name keywords (for partial matches)
    const upperNormalized = normalized.toUpperCase();
    if (upperNormalized.includes("ISRAELI") && (upperNormalized.includes("SHEKEL") || upperNormalized.includes("NIS"))) {
      code = "ILS";
    } else if (upperNormalized.includes("NIS") && !upperNormalized.includes("DENIS")) {
      // NIS = New Israeli Shekel (avoid false matches like "DENIS")
      code = "ILS";
    }
  }

  // Comprehensive symbol map for common Saleor currencies
  // This ensures reliable symbol resolution across all supported currencies
  const symbolMap: Record<string, string> = {
    // Major currencies
    USD: "$",
    EUR: "€",
    GBP: "£",
    JPY: "¥",
    
    // Middle East - Israeli currency (ILS/NIS)
    ILS: "₪",
    NIS: "₪", // Explicit alias mapping
    AED: "د.إ",
    SAR: "ر.س",
    
    // Asia
    INR: "₹",
    CNY: "¥",
    KRW: "₩",
    THB: "฿",
    SGD: "S$",
    HKD: "HK$",
    TWD: "NT$",
    MYR: "RM",
    IDR: "Rp",
    PHP: "₱",
    VND: "₫",
    
    // Americas
    CAD: "C$",
    AUD: "A$",
    NZD: "NZ$",
    BRL: "R$",
    MXN: "$",
    ARS: "$",
    CLP: "$",
    COP: "$",
    PEN: "S/",
    
    // Europe
    CHF: "CHF",
    SEK: "kr",
    NOK: "kr",
    DKK: "kr",
    PLN: "zł",
    CZK: "Kč",
    HUF: "Ft",
    RON: "lei",
    BGN: "лв",
    TRY: "₺",
    RUB: "₽",
    
    // Africa
    ZAR: "R",
    EGP: "E£",
    NGN: "₦",
    
    // Other
    PKR: "₨",
    BDT: "৳",
  };

  // Return mapped symbol or original normalized input as fallback
  // If currency code is returned, it will display as "ILS 100" which is clear
  // Never fall back to USD - always show the actual currency code/name
  const symbol = symbolMap[code];
  if (symbol) {
    return symbol;
  }
  
  // Fallback: return the normalized input (code or name) instead of USD
  // This ensures ILS/NIS never shows as USD
  return normalized;
}



