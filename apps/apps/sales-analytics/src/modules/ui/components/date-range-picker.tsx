import { parseISO, format } from "date-fns";
import { useState } from "react";

import type { TimeRange, TimeRangePreset } from "../../analytics/domain/time-range";
import { getTimeRangeFromPreset } from "../../analytics/domain/time-range";

interface DateRangePickerProps {
  value: TimeRange;
  onChange: (range: TimeRange) => void;
}

/**
 * Custom date range picker using native HTML5 date inputs
 * Replaces Tremor's DateRangePicker to avoid ESM compatibility issues
 */
export function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const fromDate = parseISO(value.from);
  const toDate = parseISO(value.to);

  // Format dates for input (YYYY-MM-DD)
  const fromDateStr = format(fromDate, "yyyy-MM-dd");
  const toDateStr = format(toDate, "yyyy-MM-dd");

  const handleFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      const newFrom = new Date(e.target.value);
      newFrom.setHours(0, 0, 0, 0);
      onChange({
        from: newFrom.toISOString(),
        to: value.to,
        preset: "custom",
      });
    }
  };

  const handleToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      const newTo = new Date(e.target.value);
      newTo.setHours(23, 59, 59, 999);
      onChange({
        from: value.from,
        to: newTo.toISOString(),
        preset: "custom",
      });
    }
  };

  const displayText = `${format(fromDate, "MMM d")} - ${format(toDate, "MMM d, yyyy")}`;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-md bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[200px]"
      >
        <svg
          className="w-4 h-4 text-gray-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <span className="flex-1 text-left">{displayText}</span>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute right-0 z-20 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-4 min-w-[320px]">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  From Date
                </label>
                <input
                  type="date"
                  value={fromDateStr}
                  onChange={handleFromChange}
                  max={toDateStr}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  To Date
                </label>
                <input
                  type="date"
                  value={toDateStr}
                  onChange={handleToChange}
                  min={fromDateStr}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-3 py-1.5 text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
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
          className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
            currentPreset === preset.value
              ? "bg-blue-100 text-blue-700 font-medium"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          {preset.label}
        </button>
      ))}
    </div>
  );
}
