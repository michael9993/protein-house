import type { Money } from "./kpi-types";

/**
 * Format a money value for display
 */
export function formatMoney(money: Money): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: money.currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(money.amount);
}

/**
 * Format a number as currency with a specific currency code
 */
export function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format a large number with abbreviations (K, M, B)
 */
export function formatCompactNumber(value: number): string {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

/**
 * Format a currency with compact notation
 */
export function formatCompactCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(amount);
}

/**
 * Format a percentage
 */
export function formatPercentage(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "percent",
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value / 100);
}

/**
 * Sum multiple money values (assuming same currency)
 */
export function sumMoney(values: Money[]): Money {
  if (values.length === 0) {
    return { amount: 0, currency: "USD" };
  }

  const currency = values[0].currency;
  const total = values.reduce((sum, m) => sum + m.amount, 0);

  return { amount: total, currency };
}

/**
 * Calculate average of money values
 */
export function averageMoney(values: Money[]): Money {
  if (values.length === 0) {
    return { amount: 0, currency: "USD" };
  }

  const sum = sumMoney(values);
  return {
    amount: sum.amount / values.length,
    currency: sum.currency,
  };
}
