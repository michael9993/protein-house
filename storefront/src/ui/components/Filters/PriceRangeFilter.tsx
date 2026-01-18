"use client";

/**
 * PriceRangeFilter Component (Input-based with Quick Filter Values)
 * 
 * Follows the SAME pattern as category/collection/brand filters:
 * - URL is source of truth (no local state syncing)
 * - Immediate updates (no debouncing)
 * - Uses same updateFilters pattern
 * - Clear/remove works like other filters
 * 
 * Config-driven: Uses StoreConfig from context for branding/settings.
 */

import { useMemo, useCallback, useState, useEffect } from "react";
import { useProductFilters } from "@/hooks/useProductFilters";
import { useStoreConfig, useFiltersText } from "@/providers/StoreConfigProvider";
import { getChannelCurrencyClient } from "@/lib/channel-utils";
import { getCurrencySymbol } from "@/lib/currency";

interface PriceRangeFilterProps {
  channel?: string;
  currencyCode?: string; // Deprecated: use channel instead
  minPrice?: number;
  maxPrice?: number;
  showQuickButtons?: boolean; // From config
}

// Safe default price bounds
const DEFAULT_MIN_PRICE = 0;
const DEFAULT_MAX_PRICE = 1000;

/**
 * Generate static quick filter values for Min price
 * Completely static values that don't change based on product prices
 */
function generateQuickMinValues(): number[] {
  // Static logical increments for minimum price
  return [0, 10, 25, 50, 100, 200, 300];
}

/**
 * Generate static quick filter values for Max price
 * Completely static values that don't change based on product prices
 */
function generateQuickMaxValues(): number[] {
  // Static logical increments for maximum price
  return [100, 200, 300, 500, 750, 1000, 1500];
}

export function PriceRangeFilter({ 
  channel,
  currencyCode: propCurrencyCode,
  minPrice: propMinPrice,
  maxPrice: propMaxPrice,
  showQuickButtons = true,
}: PriceRangeFilterProps) {
  const { filters, updateFilters } = useProductFilters();
  // Use config from context (per-channel)
  const config = useStoreConfig();
  const { branding } = config;
  const filtersText = useFiltersText();
  
  // Use provided currency code (from product data) as primary source
  // Normalize currency code: trim and handle empty/null values
  const normalizedPropCurrency = propCurrencyCode?.trim() || null;
  
  // Initialize currency code from props (server-rendered value)
  // This ensures server and client initial render match
  const [currencyCode, setCurrencyCode] = useState<string>(() => {
    // Use prop currency if available, otherwise empty string
    // This matches what server renders
    return normalizedPropCurrency || "";
  });

  // Fetch channel currency only if not provided from props (client-side fallback)
  // This runs after hydration, so it won't cause hydration mismatches
  useEffect(() => {
    // Only fetch if we don't have currency from props
    if (!normalizedPropCurrency && channel) {
      getChannelCurrencyClient(channel).then((code) => {
        const normalized = code?.trim() || "";
        if (normalized) {
          // Update after hydration is complete
          setCurrencyCode(normalized);
        }
      }).catch((error) => {
        console.error("[PriceRangeFilter] Failed to fetch currency:", error);
      });
    }
  }, [channel, normalizedPropCurrency]);

  // Calculate bounds from product data or defaults
  // Use provided min/max from products (already rounded), fallback to defaults
  const minBound = useMemo(() => {
    const min = propMinPrice ?? DEFAULT_MIN_PRICE;
    return Math.max(0, Math.floor(min));
  }, [propMinPrice]);

  const maxBound = useMemo(() => {
    const max = propMaxPrice ?? DEFAULT_MAX_PRICE;
    return Math.max(minBound + 1, Math.ceil(max));
  }, [propMaxPrice, minBound]);

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

  // Get currency symbol using the utility
  // Handles ILS, NIS, name variants, and all case variations
  const currencySymbol = useMemo(() => {
    const symbol = getCurrencySymbol(currencyCode);
    // If no symbol returned (empty currency), use empty string (UI will handle gracefully)
    return symbol || "";
  }, [currencyCode]);

  // Generate static quick filter values (never change, independent of product prices)
  const quickMinValues = useMemo(() => {
    return generateQuickMinValues();
  }, []);

  const quickMaxValues = useMemo(() => {
    return generateQuickMaxValues();
  }, []);

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
            {filtersText.minPriceLabel || "Min Price"}{currencySymbol ? ` (${currencySymbol})` : ""}
          </label>
          <input
            id="price-min"
            type="number"
            min={minBound}
            max={maxBound}
            step="0.01"
            value={minInput}
            onChange={handleMinChange}
            placeholder={currencySymbol ? `${currencySymbol}${minBound}` : `${minBound}`}
            className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-offset-1 transition-colors"
            style={{
              "--tw-ring-color": branding.colors.primary,
            } as React.CSSProperties}
            aria-label="Minimum price"
          />
        </div>

        <div>
          <label htmlFor="price-max" className="block text-xs font-medium text-neutral-700 mb-1.5">
            {filtersText.maxPriceLabel || "Max Price"}{currencySymbol ? ` (${currencySymbol})` : ""}
          </label>
          <input
            id="price-max"
            type="number"
            min={minBound}
            max={maxBound}
            step="0.01"
            value={maxInput}
            onChange={handleMaxChange}
            placeholder={currencySymbol ? `${currencySymbol}${maxBound}` : `${maxBound}`}
            className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-offset-1 transition-colors"
            style={{
              "--tw-ring-color": branding.colors.primary,
            } as React.CSSProperties}
            aria-label="Maximum price"
          />
        </div>
      </div>

      {/* Quick Filter Buttons - config-driven visibility */}
      {showQuickButtons && (
        <>
          {/* Quick Filter Buttons for Min */}
          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-2">
              {filtersText.quickMinLabel || "Quick Min"}
            </label>
            <div className="flex flex-wrap gap-2">
              {quickMinValues.map((value) => {
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
                    aria-label={`Set minimum price to ${currencySymbol || ""}${value}`}
                  >
                    {currencySymbol ? `${currencySymbol}${value}` : `${value}`}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Filter Buttons for Max */}
          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-2">
              {filtersText.quickMaxLabel || "Quick Max"}
            </label>
            <div className="flex flex-wrap gap-2">
              {quickMaxValues.map((value) => {
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
                    aria-label={`Set maximum price to ${currencySymbol || ""}${value}`}
                  >
                    {currencySymbol ? `${currencySymbol}${value}` : `${value}`}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}

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
          {filtersText.clearPriceFilter || "Clear"}
        </button>
      )}
    </div>
  );
}
