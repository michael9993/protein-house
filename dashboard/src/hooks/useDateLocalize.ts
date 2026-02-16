import { LocaleContext } from "@dashboard/components/Locale";
import { useContext } from "react";

export type LocalizeDate = (date: string, format?: string) => string;

const FORMAT_OPTIONS: Record<string, Intl.DateTimeFormatOptions> = {
  ll: { dateStyle: "medium" },
  lll: { dateStyle: "medium", timeStyle: "short" },
  L: { dateStyle: "short" },
  LLL: { dateStyle: "long", timeStyle: "short" },
};

function useDateLocalize(): LocalizeDate {
  const { locale } = useContext(LocaleContext);

  return (date: string, format?: string) => {
    const d = new Date(date);

    if (isNaN(d.getTime())) {
      return date;
    }

    const options = FORMAT_OPTIONS[format ?? "ll"] ?? FORMAT_OPTIONS.ll;

    return new Intl.DateTimeFormat(locale, options).format(d);
  };
}

export default useDateLocalize;

/**
 * Format a date as relative time (e.g. "2 hours ago", "in 3 days").
 * Uses Intl.RelativeTimeFormat for locale-aware output.
 */
export function formatRelativeTime(
  date: string | number,
  now: number,
  locale: string,
): string {
  const diffMs = new Date(date).getTime() - now;
  const absDiff = Math.abs(diffMs);
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });

  if (absDiff < 60_000) {
    return rtf.format(Math.round(diffMs / 1_000), "second");
  }

  if (absDiff < 3_600_000) {
    return rtf.format(Math.round(diffMs / 60_000), "minute");
  }

  if (absDiff < 86_400_000) {
    return rtf.format(Math.round(diffMs / 3_600_000), "hour");
  }

  if (absDiff < 2_592_000_000) {
    return rtf.format(Math.round(diffMs / 86_400_000), "day");
  }

  if (absDiff < 31_536_000_000) {
    return rtf.format(Math.round(diffMs / 2_592_000_000), "month");
  }

  return rtf.format(Math.round(diffMs / 31_536_000_000), "year");
}
