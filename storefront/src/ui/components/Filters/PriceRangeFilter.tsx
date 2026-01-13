"use client";

/**
 * PriceRangeFilter Component (Input-based with Quick Filter Values)
 * 
 * Follows the SAME pattern as category/collection/brand filters:
 * - URL is source of truth (no local state syncing)
 * - Immediate updates (no debouncing)
 * - Uses same updateFilters pattern
 * - Clear/remove works like other filters
 */

import { useMemo, useCallback, useState, useEffect } from "react";
import { useProductFilters } from "@/hooks/useProductFilters";
import { storeConfig } from "@/config";

interface PriceRangeFilterProps {
  currencyCode?: string;
  minPrice?: number;
  maxPrice?: number;
}

// Safe default price bounds
const DEFAULT_MIN_PRICE = 0;
const DEFAULT_MAX_PRICE = 1000;

// Quick filter price values (individual values, not ranges)
const QUICK_FILTER_VALUES = [10, 25, 50, 100, 200, 500];

export function PriceRangeFilter({ 
  currencyCode = "USD",
  minPrice: propMinPrice,
  maxPrice: propMaxPrice,
}: PriceRangeFilterProps) {
  const { filters, updateFilters } = useProductFilters();
  const { branding } = storeConfig;

  // Calculate bounds
  const minBound = useMemo(() => {
    const min = propMinPrice ?? DEFAULT_MIN_PRICE;
    return Math.max(0, Math.floor(min));
  }, [propMinPrice]);

  const maxBound = useMemo(() => {
    const max = propMaxPrice ?? DEFAULT_MAX_PRICE;
    return Math.max(minBound + 1, Math.ceil(max));
  }, [propMinPrice, minBound]);

  // Current values from URL (source of truth)
  const currentMin = filters.priceMin ?? undefined;
  const currentMax = filters.priceMax ?? undefined;

  // Local input state (for controlled inputs, but URL is source of truth)
  const [minInput, setMinInput] = useState<string>(currentMin?.toString() || "");
  const [maxInput, setMaxInput] = useState<string>(currentMax?.toString() || "");

  // Sync inputs with URL state
  useEffect(() => {
    setMinInput(currentMin?.toString() || "");
    setMaxInput(currentMax?.toString() || "");
  }, [currentMin, currentMax]);

  // Format currency symbol
  const getCurrencySymbol = (code: string): string => {
    const symbols: Record<string, string> = {
      USD: "$",
      EUR: "€",
      GBP: "£",
      JPY: "¥",
      CAD: "C$",
      AUD: "A$",
      ILS: "₪",
    };
    return symbols[code.toUpperCase()] || code.toUpperCase();
  };

  const currencySymbol = getCurrencySymbol(currencyCode);

  // Handle min input change
  const handleMinChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setMinInput(value);
      
      if (value === "") {
        // Empty = clear min filter
        updateFilters({
          priceMin: undefined,
          priceMax: currentMax,
        });
        return;
      }

      const numValue = parseFloat(value);
      if (!isNaN(numValue) && numValue >= 0) {
        const clampedValue = Math.max(minBound, Math.min(numValue, maxBound));
        updateFilters({
          priceMin: clampedValue,
          priceMax: currentMax,
        });
      }
    },
    [updateFilters, currentMax, minBound, maxBound]
  );

  // Handle max input change
  const handleMaxChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setMaxInput(value);
      
      if (value === "") {
        // Empty = clear max filter
        updateFilters({
          priceMin: currentMin,
          priceMax: undefined,
        });
        return;
      }

      const numValue = parseFloat(value);
      if (!isNaN(numValue) && numValue >= 0) {
        const clampedValue = Math.max(minBound, Math.min(numValue, maxBound));
        updateFilters({
          priceMin: currentMin,
          priceMax: clampedValue,
        });
      }
    },
    [updateFilters, currentMin, minBound, maxBound]
  );

  // Handle quick filter click for min
  const handleQuickFilterMin = useCallback(
    (value: number) => {
      // Toggle: if already set to this value, clear it
      if (currentMin === value) {
        updateFilters({
          priceMin: undefined,
          priceMax: currentMax,
        });
      } else {
        updateFilters({
          priceMin: value,
          priceMax: currentMax,
        });
      }
    },
    [updateFilters, currentMin, currentMax]
  );

  // Handle quick filter click for max
  const handleQuickFilterMax = useCallback(
    (value: number) => {
      // Toggle: if already set to this value, clear it
      if (currentMax === value) {
        updateFilters({
          priceMin: currentMin,
          priceMax: undefined,
        });
      } else {
        updateFilters({
          priceMin: currentMin,
          priceMax: value,
        });
      }
    },
    [updateFilters, currentMin, currentMax]
  );

  // Clear price filter
  const handleClear = useCallback(() => {
    // Clear input fields immediately
    setMinInput("");
    setMaxInput("");
    // Clear URL filters
    updateFilters({
      priceMin: undefined,
      priceMax: undefined,
    });
  }, [updateFilters]);

  // Check if price filter is active
  const hasPriceFilter = (filters.priceMin !== undefined && filters.priceMin !== null) || 
                         (filters.priceMax !== undefined && filters.priceMax !== null);

  return (
    <div className="space-y-4">
      {/* Min/Max Input Fields - Side by Side */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="price-min" className="block text-xs font-medium text-neutral-700 mb-1.5">
            Min Price ({currencySymbol})
          </label>
          <input
            id="price-min"
            type="number"
            min={minBound}
            max={maxBound}
            step="0.01"
            value={minInput}
            onChange={handleMinChange}
            placeholder={`${currencySymbol}${minBound}`}
            className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-offset-1 transition-colors"
            style={{
              "--tw-ring-color": branding.colors.primary,
            } as React.CSSProperties}
            aria-label="Minimum price"
          />
        </div>

        <div>
          <label htmlFor="price-max" className="block text-xs font-medium text-neutral-700 mb-1.5">
            Max Price ({currencySymbol})
          </label>
          <input
            id="price-max"
            type="number"
            min={minBound}
            max={maxBound}
            step="0.01"
            value={maxInput}
            onChange={handleMaxChange}
            placeholder={`${currencySymbol}${maxBound}`}
            className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-offset-1 transition-colors"
            style={{
              "--tw-ring-color": branding.colors.primary,
            } as React.CSSProperties}
            aria-label="Maximum price"
          />
        </div>
      </div>

      {/* Quick Filter Buttons for Min */}
      <div>
        <label className="block text-xs font-medium text-neutral-700 mb-2">
          Quick Min
        </label>
        <div className="flex flex-wrap gap-2">
          {QUICK_FILTER_VALUES.map((value) => {
            const isActive = currentMin === value;
            return (
              <button
                key={`min-${value}`}
                type="button"
                onClick={() => handleQuickFilterMin(value)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                  isActive
                    ? "border-transparent text-white"
                    : "border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50 hover:border-neutral-400"
                }`}
                style={
                  (isActive
                    ? {
                        backgroundColor: branding.colors.primary,
                        "--tw-ring-color": branding.colors.primary,
                      }
                    : {
                        "--tw-ring-color": branding.colors.primary,
                      }) as unknown as React.CSSProperties
                }
                aria-label={`Set minimum price to ${currencySymbol}${value}`}
              >
                {currencySymbol}{value}
              </button>
            );
          })}
        </div>
      </div>

      {/* Quick Filter Buttons for Max */}
      <div>
        <label className="block text-xs font-medium text-neutral-700 mb-2">
          Quick Max
        </label>
        <div className="flex flex-wrap gap-2">
          {QUICK_FILTER_VALUES.map((value) => {
            const isActive = currentMax === value;
            return (
              <button
                key={`max-${value}`}
                type="button"
                onClick={() => handleQuickFilterMax(value)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                  isActive
                    ? "border-transparent text-white"
                    : "border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50 hover:border-neutral-400"
                }`}
                style={
                  (isActive
                    ? {
                        backgroundColor: branding.colors.primary,
                        "--tw-ring-color": branding.colors.primary,
                      }
                    : {
                        "--tw-ring-color": branding.colors.primary,
                      }) as unknown as React.CSSProperties
                }
                aria-label={`Set maximum price to ${currencySymbol}${value}`}
              >
                {currencySymbol}{value}
              </button>
            );
          })}
        </div>
      </div>

      {/* Clear Button */}
      {hasPriceFilter && (
        <button
          type="button"
          onClick={handleClear}
          className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-50 hover:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-offset-1"
          style={{
            "--tw-ring-color": branding.colors.primary,
          } as React.CSSProperties}
          aria-label="Clear price filter"
        >
          Clear Price Filter
        </button>
      )}
    </div>
  );
}
