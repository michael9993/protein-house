/**
 * PayPal money conversion utilities.
 * PayPal API expects decimal strings like "10.00", not smallest-unit integers like Stripe (1000).
 */

// Currencies with 0 decimal places
const ZERO_DECIMAL_CURRENCIES = new Set([
  "BIF", "CLP", "DJF", "GNF", "JPY", "KMF", "KRW", "MGA",
  "PYG", "RWF", "UGX", "VND", "VUV", "XAF", "XOF", "XPF",
]);

/**
 * Convert a Saleor amount (decimal number like 10.50) to PayPal money format.
 * Saleor already uses decimal amounts, so we just need to format the string correctly.
 */
export function createPayPalMoney(
  amount: number,
  currencyCode: string,
): { value: string; currency_code: string } {
  const upperCurrency = currencyCode.toUpperCase();

  if (ZERO_DECIMAL_CURRENCIES.has(upperCurrency)) {
    return {
      value: Math.round(amount).toString(),
      currency_code: upperCurrency,
    };
  }

  return {
    value: amount.toFixed(2),
    currency_code: upperCurrency,
  };
}

/**
 * Parse a PayPal money value string back to a number.
 */
export function parsePayPalAmount(value: string): number {
  return parseFloat(value);
}
