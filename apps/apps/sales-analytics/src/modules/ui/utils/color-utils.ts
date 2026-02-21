/**
 * Aura brand-harmonized chart color palette
 * 8 colors optimized for visual distinction in charts
 */
export const CHART_COLORS = [
  "#18181B", // Brand primary (rich black)
  "#3B82F6", // Blue
  "#059669", // Success (green)
  "#8B5CF6", // Violet
  "#F59E0B", // Amber
  "#EC4899", // Pink
  "#14B8A6", // Teal
  "#EF4444", // Red
] as const;

/**
 * Get a chart color by index, cycling through the palette
 */
export function getChartColor(index: number): string {
  return CHART_COLORS[index % CHART_COLORS.length];
}

/**
 * Status color mapping for order/payment status badges
 */
export const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  FULFILLED: { bg: "bg-emerald-100", text: "text-emerald-800" },
  UNFULFILLED: { bg: "bg-amber-100", text: "text-amber-800" },
  PARTIALLY_FULFILLED: { bg: "bg-orange-100", text: "text-orange-800" },
  CANCELED: { bg: "bg-red-100", text: "text-red-800" },
  RETURNED: { bg: "bg-blue-100", text: "text-blue-800" },
  UNCONFIRMED: { bg: "bg-gray-100", text: "text-gray-800" },
};

/**
 * Get status badge color classes
 */
export function getStatusColors(status: string): { bg: string; text: string } {
  return STATUS_COLORS[status] ?? { bg: "bg-gray-100", text: "text-gray-800" };
}
