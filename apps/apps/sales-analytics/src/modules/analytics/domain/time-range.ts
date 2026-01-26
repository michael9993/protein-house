import { z } from "zod";
import {
  startOfDay,
  endOfDay,
  subDays,
  subWeeks,
  subMonths,
  format,
  parseISO,
  differenceInDays,
} from "date-fns";

/**
 * Predefined time range options
 */
export const TimeRangePresetSchema = z.enum([
  "today",
  "yesterday",
  "last7days",
  "last30days",
  "last90days",
  "last6months",
  "lastYear",
  "thisMonth",
  "lastMonth",
  "custom",
]);
export type TimeRangePreset = z.infer<typeof TimeRangePresetSchema>;

/**
 * Time range with start and end dates
 */
export const TimeRangeSchema = z.object({
  from: z.string().datetime(),
  to: z.string().datetime(),
  preset: TimeRangePresetSchema.optional(),
});
export type TimeRange = z.infer<typeof TimeRangeSchema>;

/**
 * Granularity for time series data
 */
export const GranularitySchema = z.enum(["day", "week", "month"]);
export type Granularity = z.infer<typeof GranularitySchema>;

/**
 * Get the start and end dates for a preset time range
 */
export function getTimeRangeFromPreset(preset: TimeRangePreset): TimeRange {
  const now = new Date();

  switch (preset) {
    case "today":
      return {
        from: startOfDay(now).toISOString(),
        to: endOfDay(now).toISOString(),
        preset,
      };

    case "yesterday":
      const yesterday = subDays(now, 1);
      return {
        from: startOfDay(yesterday).toISOString(),
        to: endOfDay(yesterday).toISOString(),
        preset,
      };

    case "last7days":
      return {
        from: startOfDay(subDays(now, 6)).toISOString(),
        to: endOfDay(now).toISOString(),
        preset,
      };

    case "last30days":
      return {
        from: startOfDay(subDays(now, 29)).toISOString(),
        to: endOfDay(now).toISOString(),
        preset,
      };

    case "last90days":
      return {
        from: startOfDay(subDays(now, 89)).toISOString(),
        to: endOfDay(now).toISOString(),
        preset,
      };

    case "last6months":
      return {
        from: startOfDay(subMonths(now, 6)).toISOString(),
        to: endOfDay(now).toISOString(),
        preset,
      };

    case "lastYear":
      return {
        from: startOfDay(subMonths(now, 12)).toISOString(),
        to: endOfDay(now).toISOString(),
        preset,
      };

    case "thisMonth":
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      return {
        from: startOfDay(startOfMonth).toISOString(),
        to: endOfDay(now).toISOString(),
        preset,
      };

    case "lastMonth":
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
      return {
        from: startOfDay(lastMonthStart).toISOString(),
        to: endOfDay(lastMonthEnd).toISOString(),
        preset,
      };

    case "custom":
    default:
      // Default to last 30 days for custom
      return {
        from: startOfDay(subDays(now, 29)).toISOString(),
        to: endOfDay(now).toISOString(),
        preset: "custom",
      };
  }
}

/**
 * Get the previous period for comparison
 * E.g., if current range is last 7 days, previous period is 7 days before that
 */
export function getPreviousPeriod(range: TimeRange): TimeRange {
  const from = parseISO(range.from);
  const to = parseISO(range.to);
  const days = differenceInDays(to, from);

  return {
    from: subDays(from, days + 1).toISOString(),
    to: subDays(from, 1).toISOString(),
  };
}

/**
 * Determine the best granularity based on the time range
 */
export function getOptimalGranularity(range: TimeRange): Granularity {
  const from = parseISO(range.from);
  const to = parseISO(range.to);
  const days = differenceInDays(to, from);

  if (days <= 14) {
    return "day";
  } else if (days <= 90) {
    return "week";
  } else {
    return "month";
  }
}

/**
 * Format a date for display
 */
export function formatDateForDisplay(date: string, granularity: Granularity): string {
  const parsed = parseISO(date);

  switch (granularity) {
    case "day":
      return format(parsed, "MMM d");
    case "week":
      return format(parsed, "MMM d");
    case "month":
      return format(parsed, "MMM yyyy");
  }
}

/**
 * Format date range for display
 */
export function formatDateRangeForDisplay(range: TimeRange): string {
  const from = parseISO(range.from);
  const to = parseISO(range.to);

  if (format(from, "yyyy-MM-dd") === format(to, "yyyy-MM-dd")) {
    return format(from, "MMMM d, yyyy");
  }

  if (from.getFullYear() === to.getFullYear()) {
    return `${format(from, "MMM d")} - ${format(to, "MMM d, yyyy")}`;
  }

  return `${format(from, "MMM d, yyyy")} - ${format(to, "MMM d, yyyy")}`;
}
