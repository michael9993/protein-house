import { parseISO, format } from "date-fns";
import { Calendar } from "lucide-react";
import { useState } from "react";

import type { TimeRange, TimeRangePreset } from "../../analytics/domain/time-range";
import { getTimeRangeFromPreset } from "../../analytics/domain/time-range";

interface DateRangePickerProps {
  value: TimeRange;
  onChange: (range: TimeRange) => void;
}

export function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const fromDate = parseISO(value.from);
  const toDate = parseISO(value.to);

  const fromDateStr = format(fromDate, "yyyy-MM-dd");
  const toDateStr = format(toDate, "yyyy-MM-dd");

  const handleFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      const newFrom = new Date(e.target.value);
      newFrom.setHours(0, 0, 0, 0);
      onChange({ from: newFrom.toISOString(), to: value.to, preset: "custom" });
    }
  };

  const handleToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      const newTo = new Date(e.target.value);
      newTo.setHours(23, 59, 59, 999);
      onChange({ from: value.from, to: newTo.toISOString(), preset: "custom" });
    }
  };

  const displayText = `${format(fromDate, "MMM d")} - ${format(toDate, "MMM d, yyyy")}`;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm border border-border rounded-lg bg-white hover:bg-surface focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand min-w-[200px] transition-colors"
      >
        <Calendar size={16} className="text-text-muted" />
        <span className="flex-1 text-left text-text-primary">{displayText}</span>
        <svg
          className={`w-4 h-4 text-text-muted transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 z-20 mt-2 bg-white border border-border rounded-xl shadow-lg p-4 min-w-[320px]">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">From Date</label>
                <input
                  type="date"
                  value={fromDateStr}
                  onChange={handleFromChange}
                  max={toDateStr}
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">To Date</label>
                <input
                  type="date"
                  value={toDateStr}
                  onChange={handleToChange}
                  min={fromDateStr}
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
                />
              </div>
              <div className="flex justify-end pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-3 py-1.5 text-sm text-text-muted bg-surface rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

interface QuickDateSelectProps {
  currentPreset?: TimeRangePreset;
  onChange: (range: TimeRange) => void;
}

export function QuickDateSelect({ currentPreset, onChange }: QuickDateSelectProps) {
  const presets: { label: string; value: TimeRangePreset }[] = [
    { label: "Today", value: "today" },
    { label: "Yesterday", value: "yesterday" },
    { label: "Last 7 days", value: "last7days" },
    { label: "Last 30 days", value: "last30days" },
    { label: "3 months", value: "last90days" },
    { label: "6 months", value: "last6months" },
    { label: "Year", value: "lastYear" },
    { label: "This month", value: "thisMonth" },
    { label: "Last month", value: "lastMonth" },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {presets.map((preset) => (
        <button
          key={preset.value}
          onClick={() => onChange(getTimeRangeFromPreset(preset.value))}
          className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
            currentPreset === preset.value
              ? "bg-brand text-white font-medium"
              : "bg-surface text-text-muted hover:bg-gray-200"
          }`}
        >
          {preset.label}
        </button>
      ))}
    </div>
  );
}
