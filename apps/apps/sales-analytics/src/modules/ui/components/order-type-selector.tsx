import { ChevronDown } from "lucide-react";
import type { OrderTypeFilter } from "../../analytics/domain/kpi-types";

const ORDER_TYPE_OPTIONS: { value: OrderTypeFilter; label: string }[] = [
  { value: "all", label: "All Orders" },
  { value: "dropship", label: "Dropship Only" },
  { value: "non-dropship", label: "Non-Dropship Only" },
];

interface OrderTypeSelectorProps {
  value: OrderTypeFilter;
  onChange: (value: OrderTypeFilter) => void;
}

export function OrderTypeSelector({ value, onChange }: OrderTypeSelectorProps) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as OrderTypeFilter)}
        className="appearance-none w-44 px-3 py-2 pr-8 text-sm border border-border rounded-lg bg-white text-text-primary hover:bg-surface focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-colors cursor-pointer"
      >
        {ORDER_TYPE_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      <ChevronDown
        size={16}
        className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
      />
    </div>
  );
}
