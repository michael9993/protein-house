"use client";

import { useState } from "react";
import { storeConfig } from "@/config";

interface CategoryFiltersButtonProps {
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  onSale?: boolean;
  priceRanges?: string[];
}

// Price range definitions for display
const PRICE_RANGE_LABELS: Record<string, string> = {
  "0-25": "Under $25",
  "25-50": "$25 - $50",
  "50-100": "$50 - $100",
  "100-200": "$100 - $200",
  "200+": "Over $200",
};

export function CategoryFiltersButton({
  minPrice,
  maxPrice,
  inStock,
  onSale,
  priceRanges = [],
}: CategoryFiltersButtonProps) {
  const [showFilters, setShowFilters] = useState(false);
  const { branding } = storeConfig;
  
  const hasFilters = minPrice !== undefined || maxPrice !== undefined || inStock || onSale || priceRanges.length > 0;
  const filterCount = [
    minPrice !== undefined, 
    maxPrice !== undefined, 
    inStock, 
    onSale,
    priceRanges.length > 0
  ].filter(Boolean).length;

  return (
    <div className="lg:hidden">
      <button
        type="button"
        className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
        onClick={() => setShowFilters(!showFilters)}
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
        </svg>
        Filters
        {hasFilters && (
          <span 
            className="flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold text-white"
            style={{ backgroundColor: branding.colors.primary }}
          >
            {filterCount}
          </span>
        )}
      </button>

      {/* Simple dropdown filter info */}
      {showFilters && (
        <div className="absolute z-10 mt-2 w-64 rounded-lg bg-white p-4 shadow-lg">
          <p className="text-sm text-neutral-600">
            Active filters:
          </p>
          <ul className="mt-2 space-y-1 text-sm">
            {priceRanges.map(range => (
              <li key={range} className="text-neutral-700">• {PRICE_RANGE_LABELS[range] || range}</li>
            ))}
            {minPrice !== undefined && <li className="text-neutral-700">• Min: ${minPrice}</li>}
            {maxPrice !== undefined && <li className="text-neutral-700">• Max: ${maxPrice}</li>}
            {inStock && <li className="text-neutral-700">• In Stock Only</li>}
            {onSale && <li className="text-neutral-700">• On Sale</li>}
            {!hasFilters && <li className="text-neutral-500">No filters active</li>}
          </ul>
          <button
            onClick={() => setShowFilters(false)}
            className="mt-3 w-full rounded-lg bg-neutral-100 px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-200"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
}

