"use client";

import type { EnrichedVariant } from "./types";

interface Props {
  variant: EnrichedVariant | null;
  isSelectionComplete: boolean;
  needsSelection: boolean;
  lowStockThreshold?: number;
  text: {
    inStockWithCount: string;
    onlyXLeft: string;
    sellingFast: string;
    outOfStockText: string;
    unlimitedStock?: string;
    selectOptionsForStock?: string;
    maxPerCustomer?: string;
  };
}

export function StockStatus({
  variant,
  isSelectionComplete,
  needsSelection,
  lowStockThreshold = 5,
  text,
}: Props) {
  // Selection incomplete
  if (needsSelection && !isSelectionComplete) {
    const msg = text.selectOptionsForStock || "Select options to see availability";
    return (
      <div className="flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full bg-neutral-300" />
        <span className="text-sm font-medium text-neutral-500">{msg}</span>
      </div>
    );
  }

  if (!variant) return null;

  const qty = variant.quantityAvailable;
  const tracksInventory = variant.trackInventory;
  const limit = variant.quantityLimitPerCustomer;

  // Unlimited stock
  if (!tracksInventory) {
    return (
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-success-500" />
          <span className="text-sm font-medium text-success-600">
            {text.unlimitedStock || "In Stock"}
          </span>
        </div>
        {limit && limit > 0 && (
          <span className="text-xs text-neutral-500">
            {(text.maxPerCustomer || "Limit {count} per customer").replace(
              "{count}",
              limit.toString()
            )}
          </span>
        )}
      </div>
    );
  }

  const isInStock = qty > 0;
  const isLowStock = isInStock && qty <= lowStockThreshold;

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span
            className={`h-2.5 w-2.5 rounded-full ${
              isInStock
                ? isLowStock
                  ? "bg-warning-500"
                  : "bg-success-500"
                : "bg-error-500"
            }`}
          />
          <span
            className={`text-sm font-medium ${
              isInStock
                ? isLowStock
                  ? "text-warning-600"
                  : "text-success-600"
                : "text-error-600"
            }`}
          >
            {isInStock
              ? isLowStock
                ? text.onlyXLeft.replace("{count}", qty.toString())
                : text.inStockWithCount.replace("{count}", qty.toString())
              : text.outOfStockText}
          </span>
        </div>
        {isLowStock && (
          <span className="flex items-center gap-1 text-xs text-warning-600">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            {text.sellingFast}
          </span>
        )}
      </div>
      {limit && limit > 0 && isInStock && (
        <span className="text-xs text-neutral-500">
          {(text.maxPerCustomer || "Limit {count} per customer").replace(
            "{count}",
            limit.toString()
          )}
        </span>
      )}
    </div>
  );
}
