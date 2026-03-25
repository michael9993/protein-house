import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";
import { OrderStatus } from "../../../../generated/graphql";
import { DEFAULT_INCLUDED_STATUSES } from "../../analytics/domain/kpi-types";

const STATUS_CONFIG: { value: OrderStatus; label: string; color: string }[] = [
  { value: OrderStatus.Unconfirmed, label: "Unconfirmed", color: "bg-yellow-100 text-yellow-800" },
  { value: OrderStatus.Unfulfilled, label: "Unfulfilled", color: "bg-blue-100 text-blue-800" },
  { value: OrderStatus.PartiallyFulfilled, label: "Partially Fulfilled", color: "bg-indigo-100 text-indigo-800" },
  { value: OrderStatus.Fulfilled, label: "Fulfilled", color: "bg-emerald-100 text-emerald-800" },
  { value: OrderStatus.PartiallyReturned, label: "Partially Returned", color: "bg-orange-100 text-orange-800" },
  { value: OrderStatus.Returned, label: "Returned", color: "bg-red-100 text-red-800" },
  { value: OrderStatus.Canceled, label: "Canceled", color: "bg-gray-100 text-gray-800" },
  { value: OrderStatus.Draft, label: "Draft", color: "bg-gray-50 text-gray-500" },
  { value: OrderStatus.Expired, label: "Expired", color: "bg-gray-50 text-gray-500" },
];

interface StatusFilterProps {
  value: OrderStatus[];
  onChange: (value: OrderStatus[]) => void;
}

export function StatusFilter({ value, onChange }: StatusFilterProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggle = (status: OrderStatus) => {
    if (value.includes(status)) {
      onChange(value.filter((s) => s !== status));
    } else {
      onChange([...value, status]);
    }
  };

  const selectAll = () => onChange(STATUS_CONFIG.map((s) => s.value));
  const selectDefaults = () => onChange([...DEFAULT_INCLUDED_STATUSES]);
  const clearAll = () => onChange([]);

  const selectedCount = value.length;
  const totalCount = STATUS_CONFIG.length;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 text-sm border border-border rounded-lg bg-white text-text-primary hover:bg-surface focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-colors cursor-pointer"
      >
        <span>
          Status{" "}
          <span className="text-text-muted">
            ({selectedCount}/{totalCount})
          </span>
        </span>
        <ChevronDown size={16} className={`text-text-muted transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-64 rounded-lg border border-border bg-white shadow-lg">
          <div className="flex items-center gap-2 border-b border-border px-3 py-2">
            <button
              type="button"
              onClick={selectAll}
              className="text-xs text-brand hover:underline"
            >
              All
            </button>
            <span className="text-xs text-text-muted">·</span>
            <button
              type="button"
              onClick={selectDefaults}
              className="text-xs text-brand hover:underline"
            >
              Defaults
            </button>
            <span className="text-xs text-text-muted">·</span>
            <button
              type="button"
              onClick={clearAll}
              className="text-xs text-red-600 hover:underline"
            >
              Clear
            </button>
          </div>
          <div className="max-h-64 overflow-y-auto py-1">
            {STATUS_CONFIG.map((status) => {
              const checked = value.includes(status.value);
              return (
                <button
                  key={status.value}
                  type="button"
                  onClick={() => toggle(status.value)}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-sm hover:bg-surface transition-colors"
                >
                  <div
                    className={`flex h-4 w-4 items-center justify-center rounded border ${
                      checked
                        ? "border-brand bg-brand text-white"
                        : "border-gray-300 bg-white"
                    }`}
                  >
                    {checked && <Check size={12} />}
                  </div>
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${status.color}`}>
                    {status.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
