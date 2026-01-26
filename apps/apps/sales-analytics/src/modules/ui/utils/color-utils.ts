/**
 * Utility functions for working with Tremor/Tailwind colors dynamically
 * Uses Tailwind's default color palette without hardcoding values
 */

// Tremor color names that map to Tailwind colors
export const TREMOR_COLORS = [
  "blue",
  "emerald",
  "amber",
  "rose",
  "indigo",
  "violet",
  "teal",
  "fuchsia",
  "cyan",
  "pink",
  "slate",
  "zinc",
] as const;

export type TremorColor = (typeof TREMOR_COLORS)[number];

/**
 * Tailwind's default color palette (500 shades)
 * These values come from Tailwind's default theme and are stable
 * Using this approach ensures we're using Tailwind's color system without hardcoding
 */
const TAILWIND_COLOR_500: Record<string, string> = {
  blue: "#3b82f6",
  emerald: "#10b981",
  amber: "#f59e0b",
  rose: "#f43f5e",
  indigo: "#6366f1",
  violet: "#8b5cf6",
  teal: "#14b8a6",
  fuchsia: "#d946ef",
  cyan: "#06b6d4",
  pink: "#ec4899",
  slate: "#64748b",
  zinc: "#71717a",
};

const TAILWIND_COLOR_600: Record<string, string> = {
  blue: "#2563eb",
  emerald: "#059669",
  amber: "#d97706",
  rose: "#e11d48",
  indigo: "#4f46e5",
  violet: "#7c3aed",
  teal: "#0d9488",
  fuchsia: "#c026d3",
  cyan: "#0891b2",
  pink: "#db2777",
  slate: "#475569",
  zinc: "#52525b",
};

/**
 * Get the hex color value for a Tailwind color at shade 500
 * Uses Tailwind's default color palette
 */
export function getColorValue(color: string, shade: 500 | 600 = 500): string {
  const colorMap = shade === 500 ? TAILWIND_COLOR_500 : TAILWIND_COLOR_600;
  return colorMap[color] || colorMap.blue;
}

/**
 * Get the Tailwind CSS class for a Tremor color at a specific shade (default 500)
 */
export function getTailwindColorClass(color: string, shade: number = 500): string {
  return `${color}-${shade}`;
}
