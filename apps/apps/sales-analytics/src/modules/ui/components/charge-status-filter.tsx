import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";
import { OrderChargeStatusEnum } from "../../../../generated/graphql";

const CHARGE_STATUS_CONFIG: { value: OrderChargeStatusEnum; label: string; color: string }[] = [
  { value: OrderChargeStatusEnum.Full, label: "Fully Charged", color: "bg-emerald-100 text-emerald-800" },
  { value: OrderChargeStatusEnum.Partial, label: "Partially Charged", color: "bg-blue-100 text-blue-800" },
  { value: OrderChargeStatusEnum.None, label: "Not Charged", color: "bg-gray-100 text-gray-600" },
  { value: OrderChargeStatusEnum.Refunded, label: "Refunded", color: "bg-red-100 text-red-800" },
  { value: OrderChargeStatusEnum.PartiallyRefunded, label: "Partially Refunded", color: "bg-orange-100 text-orange-800" },
  { value: OrderChargeStatusEnum.Overcharged, label: "Overcharged", color: "bg-yellow-100 text-yellow-800" },
];

interface ChargeStatusFilterProps {
  value: OrderChargeStatusEnum[];
  onChange: (value: OrderChargeStatusEnum[]) => void;
}

export function ChargeStatusFilter({ value, onChange }: ChargeStatusFilterProps) {
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

  const toggle = (status: OrderChargeStatusEnum) => {
    if (value.includes(status)) {
      onChange(value.filter((s) => s !== status));
    } else {
      onChange([...value, status]);
    }
  };

  const selectAll = () => onChange(CHARGE_STATUS_CONFIG.map((s) => s.value));
  const clearAll = () => onChange([]);

  const selectedCount = value.length === 0 ? CHARGE_STATUS_CONFIG.length : value.length;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 text-sm border border-border rounded-lg bg-white text-text-primary hover:bg-surface focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-colors cursor-pointer"
      >
        <span>
          Payment{" "}
          <span className="text-text-muted">
            ({selectedCount}/{CHARGE_STATUS_CONFIG.length})
          </span>
        </span>
        <ChevronDown size={16} className={`text-text-muted transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-56 rounded-lg border border-border bg-white shadow-lg">
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
              onClick={clearAll}
              className="text-xs text-red-600 hover:underline"
            >
              Clear
            </button>
          </div>
          <div className="max-h-64 overflow-y-auto py-1">
            {CHARGE_STATUS_CONFIG.map((status) => {
              const checked = value.length === 0 || value.includes(status.value);
              return (
                <button
                  key={status.value}
                  type="button"
                  onClick={() => {
                    if (value.length === 0) {
                      onChange(CHARGE_STATUS_CONFIG.filter((s) => s.value !== status.value).map((s) => s.value));
                    } else {
                      toggle(status.value);
                    }
                  }}
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
