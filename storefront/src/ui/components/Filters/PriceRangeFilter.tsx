"use client";

/**
 * PriceRangeFilter Component (Dual-Handle Range Slider + Preset Ranges)
 *
 * E-commerce best practice design (like Amazon, Zara, Nike):
 * - Dual-handle range slider for visual price selection
 * - Preset price range buttons for quick filtering
 * - Min/Max input fields for precise values
 * - Explicit "Apply" button — user sets range then confirms
 * - Max bound is locked on first render (most expensive item in store)
 * - RTL-native: slider uses insetInlineStart so handles & fill work in both directions
 * - Config-driven: Uses filterSidebar config + filtersText from Storefront Control
 */

import { useMemo, useCallback, useState, useEffect, useRef } from "react";
import { useProductFilters } from "@/hooks/useProductFilters";
import { useFiltersText, useFilterSidebarConfig } from "@/providers/StoreConfigProvider";
import { getChannelCurrencyClient } from "@/lib/channel-utils";
import { getCurrencySymbol } from "@/lib/currency";

interface PriceRangeFilterProps {
  channel?: string;
  currencyCode?: string;
  minPrice?: number;
  maxPrice?: number;
  showQuickButtons?: boolean;
}

const DEFAULT_MIN_PRICE = 0;
const DEFAULT_MAX_PRICE = 1000;

/** Preset price ranges (e-commerce standard pattern) — labels use configurable text */
function generatePresetRanges(
  maxBound: number,
  underLabel: string,
  aboveLabel: string,
): Array<{ label: string; min?: number; max?: number }> {
  if (maxBound <= 100) {
    return [
      { label: `${underLabel} 25`, max: 25 },
      { label: "25 – 50", min: 25, max: 50 },
      { label: "50 – 75", min: 50, max: 75 },
      { label: `75${aboveLabel}`, min: 75 },
    ];
  }
  if (maxBound <= 500) {
    return [
      { label: `${underLabel} 50`, max: 50 },
      { label: "50 – 100", min: 50, max: 100 },
      { label: "100 – 200", min: 100, max: 200 },
      { label: "200 – 500", min: 200, max: 500 },
      { label: `500${aboveLabel}`, min: 500 },
    ];
  }
  return [
    { label: `${underLabel} 100`, max: 100 },
    { label: "100 – 250", min: 100, max: 250 },
    { label: "250 – 500", min: 250, max: 500 },
    { label: "500 – 1000", min: 500, max: 1000 },
    { label: `1000${aboveLabel}`, min: 1000 },
  ];
}

export function PriceRangeFilter({
  channel,
  currencyCode: propCurrencyCode,
  minPrice: propMinPrice,
  maxPrice: propMaxPrice,
  showQuickButtons = true,
}: PriceRangeFilterProps) {
  const { filters, updateFilters } = useProductFilters();
  const filtersText = useFiltersText();
  const fsConfig = useFilterSidebarConfig();

  // Currency handling
  const normalizedPropCurrency = propCurrencyCode?.trim() || null;
  const [currencyCode, setCurrencyCode] = useState<string>(() => normalizedPropCurrency || "");

  useEffect(() => {
    if (!normalizedPropCurrency && channel) {
      getChannelCurrencyClient(channel)
        .then((code) => {
          const normalized = code?.trim() || "";
          if (normalized) setCurrencyCode(normalized);
        })
        .catch((error) => {
          console.error("[PriceRangeFilter] Failed to fetch currency:", error);
        });
    }
  }, [channel, normalizedPropCurrency]);

  // Price bounds — these come from the server (computed from unfiltered products)
  // so they're always stable regardless of active filters.
  const minBound = Math.max(0, Math.floor(propMinPrice ?? DEFAULT_MIN_PRICE));
  const maxBound = Math.max(minBound + 1, Math.ceil(propMaxPrice ?? DEFAULT_MAX_PRICE));

  // Current URL values
  const currentMin = filters.priceMin ?? undefined;
  const currentMax = filters.priceMax ?? undefined;

  // Local state for slider + inputs (purely local until user clicks Apply)
  // Always show actual values (use bounds as fallback, never empty)
  const [sliderMin, setSliderMin] = useState(currentMin ?? minBound);
  const [sliderMax, setSliderMax] = useState(currentMax ?? maxBound);
  const [minInput, setMinInput] = useState<string>((currentMin ?? minBound).toString());
  const [maxInput, setMaxInput] = useState<string>((currentMax ?? maxBound).toString());

  // Track whether local state differs from URL (show Apply button)
  const localMin = sliderMin > minBound ? sliderMin : undefined;
  const localMax = sliderMax < maxBound ? sliderMax : undefined;
  const hasLocalChanges = localMin !== currentMin || localMax !== currentMax;

  // Sync slider from URL changes (clear all, preset click, active tag removal)
  // AND from bounds changes (if server-provided bounds update)
  const prevUrlMin = useRef(currentMin);
  const prevUrlMax = useRef(currentMax);
  const prevMinBound = useRef(minBound);
  const prevMaxBound = useRef(maxBound);
  useEffect(() => {
    const urlChanged = prevUrlMin.current !== currentMin || prevUrlMax.current !== currentMax;
    const boundsChanged = prevMinBound.current !== minBound || prevMaxBound.current !== maxBound;

    if (urlChanged || boundsChanged) {
      const rawMin = currentMin ?? minBound;
      const rawMax = currentMax ?? maxBound;
      // Clamp to current bounds so thumbs never exceed the track
      const clampedMin = Math.max(minBound, Math.min(rawMin, maxBound - 1));
      const clampedMax = Math.min(maxBound, Math.max(rawMax, minBound + 1));
      setSliderMin(clampedMin);
      setSliderMax(clampedMax);
      setMinInput(clampedMin.toString());
      setMaxInput(clampedMax.toString());
      prevUrlMin.current = currentMin;
      prevUrlMax.current = currentMax;
      prevMinBound.current = minBound;
      prevMaxBound.current = maxBound;
    }
  }, [currentMin, currentMax, minBound, maxBound]);

  const currencySymbol = useMemo(() => getCurrencySymbol(currencyCode) || "", [currencyCode]);
  const underLabel = filtersText.priceUnderLabel || "Under";
  const aboveLabel = filtersText.priceAboveLabel || "+";
  const presetRanges = useMemo(
    () => generatePresetRanges(maxBound, underLabel, aboveLabel),
    [maxBound, underLabel, aboveLabel],
  );

  // Apply: commit local slider/input values to URL
  const handleApply = useCallback(() => {
    const newMin = sliderMin > minBound ? sliderMin : undefined;
    const newMax = sliderMax < maxBound ? sliderMax : undefined;
    updateFilters({ priceMin: newMin, priceMax: newMax });
  }, [sliderMin, sliderMax, updateFilters, minBound, maxBound]);

  // Slider change: only update local state, always show value in input
  const handleSliderMinChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = Math.min(Number(e.target.value), sliderMax - 1);
      setSliderMin(val);
      setMinInput(val.toString());
    },
    [sliderMax],
  );

  const handleSliderMaxChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = Math.max(Number(e.target.value), sliderMin + 1);
      setSliderMax(val);
      setMaxInput(val.toString());
    },
    [sliderMin],
  );

  // Input change: only update local state
  const handleMinInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      setMinInput(raw);
      const num = parseFloat(raw);
      if (!isNaN(num) && num >= minBound && num <= maxBound) {
        setSliderMin(Math.min(num, sliderMax - 1));
      } else if (raw === "") {
        setSliderMin(minBound);
        setMinInput(minBound.toString());
      }
    },
    [minBound, maxBound, sliderMax],
  );

  const handleMaxInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      setMaxInput(raw);
      const num = parseFloat(raw);
      if (!isNaN(num) && num >= minBound && num <= maxBound) {
        setSliderMax(Math.max(num, sliderMin + 1));
      } else if (raw === "") {
        setSliderMax(maxBound);
        setMaxInput(maxBound.toString());
      }
    },
    [minBound, maxBound, sliderMin],
  );

  // Enter key in inputs triggers Apply
  const handleInputKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") handleApply();
    },
    [handleApply],
  );

  // Preset range click — these are explicit user choices, apply immediately
  const handlePresetClick = useCallback(
    (range: { min?: number; max?: number }) => {
      const isActive = currentMin === range.min && currentMax === range.max;
      if (isActive) {
        updateFilters({ priceMin: undefined, priceMax: undefined });
      } else {
        updateFilters({ priceMin: range.min, priceMax: range.max });
      }
    },
    [updateFilters, currentMin, currentMax],
  );

  // Clear — reset to bounds
  const handleClear = useCallback(() => {
    setMinInput(minBound.toString());
    setMaxInput(maxBound.toString());
    setSliderMin(minBound);
    setSliderMax(maxBound);
    updateFilters({ priceMin: undefined, priceMax: undefined });
  }, [updateFilters, minBound, maxBound]);

  const hasPriceFilter =
    (filters.priceMin !== undefined && filters.priceMin !== null) ||
    (filters.priceMax !== undefined && filters.priceMax !== null);

  // Slider fill percentage — calculated from minBound (start) to handle position
  const range = maxBound - minBound;
  const startPct = range > 0 ? ((sliderMin - minBound) / range) * 100 : 0;
  const endPct = range > 0 ? ((sliderMax - minBound) / range) * 100 : 100;

  return (
    <div className="space-y-4">
      {/* Dual-Handle Range Slider */}
      <div className="px-1">
        {/* Current range display */}
        <div className="mb-3 flex items-center justify-between text-[13px] font-medium text-neutral-700">
          <span>{currencySymbol}{sliderMin}</span>
          <span className="text-[11px] text-neutral-400">—</span>
          <span>{currencySymbol}{sliderMax}</span>
        </div>

        {/* Slider track — uses insetInlineStart for RTL-native positioning */}
        <div className="relative h-1.5 w-full rounded-full bg-neutral-200">
          {/* Active fill — insetInlineStart works in both LTR and RTL */}
          <div
            className="absolute h-full rounded-full"
            style={{
              insetInlineStart: `${startPct}%`,
              width: `${endPct - startPct}%`,
              backgroundColor: fsConfig.priceInputFocusRingColor,
            }}
          />
        </div>

        {/* Range inputs (overlaid) — no dir override, inherits page direction */}
        <div className="relative -mt-[7px]">
          <input
            type="range"
            min={minBound}
            max={maxBound}
            value={sliderMin}
            onChange={handleSliderMinChange}
            className="price-range-thumb pointer-events-none absolute w-full appearance-none bg-transparent"
            style={{ zIndex: sliderMin > maxBound - 10 ? 5 : 3, "--thumb-color": fsConfig.priceInputFocusRingColor } as React.CSSProperties}
            aria-label="Minimum price"
          />
          <input
            type="range"
            min={minBound}
            max={maxBound}
            value={sliderMax}
            onChange={handleSliderMaxChange}
            className="price-range-thumb pointer-events-none absolute w-full appearance-none bg-transparent"
            style={{ zIndex: 4, "--thumb-color": fsConfig.priceInputFocusRingColor } as React.CSSProperties}
            aria-label="Maximum price"
          />
        </div>

        {/* Min/Max bound labels */}
        <div className="mt-2 flex items-center justify-between text-[10px] text-neutral-400">
          <span>{currencySymbol}{minBound}</span>
          <span>{currencySymbol}{maxBound}</span>
        </div>
      </div>

      {/* Min/Max Input Fields */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label htmlFor="price-min" className="block text-[11px] font-medium text-neutral-500 mb-1">
            {filtersText.minPriceLabel || "Min"}
          </label>
          <div className="relative">
            {currencySymbol && (
              <span className="absolute inset-y-0 start-0 flex items-center ps-2.5 text-[11px] text-neutral-400 pointer-events-none">
                {currencySymbol}
              </span>
            )}
            <input
              id="price-min"
              type="number"
              min={minBound}
              max={maxBound}
              step="1"
              value={minInput}
              onChange={handleMinInputChange}
              onKeyDown={handleInputKeyDown}
              placeholder={`${minBound}`}
              className="w-full rounded-md border border-neutral-200 bg-neutral-50 py-1.5 text-[13px] text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:border-transparent transition-colors"
              style={{
                paddingInlineStart: currencySymbol ? "1.75rem" : "0.625rem",
                paddingInlineEnd: "0.625rem",
                "--tw-ring-color": fsConfig.priceInputFocusRingColor,
              } as React.CSSProperties}
              aria-label="Minimum price"
            />
          </div>
        </div>

        <div>
          <label htmlFor="price-max" className="block text-[11px] font-medium text-neutral-500 mb-1">
            {filtersText.maxPriceLabel || "Max"}
          </label>
          <div className="relative">
            {currencySymbol && (
              <span className="absolute inset-y-0 start-0 flex items-center ps-2.5 text-[11px] text-neutral-400 pointer-events-none">
                {currencySymbol}
              </span>
            )}
            <input
              id="price-max"
              type="number"
              min={minBound}
              max={maxBound}
              step="1"
              value={maxInput}
              onChange={handleMaxInputChange}
              onKeyDown={handleInputKeyDown}
              placeholder={`${maxBound}`}
              className="w-full rounded-md border border-neutral-200 bg-neutral-50 py-1.5 text-[13px] text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:border-transparent transition-colors"
              style={{
                paddingInlineStart: currencySymbol ? "1.75rem" : "0.625rem",
                paddingInlineEnd: "0.625rem",
                "--tw-ring-color": fsConfig.priceInputFocusRingColor,
              } as React.CSSProperties}
              aria-label="Maximum price"
            />
          </div>
        </div>
      </div>

      {/* Apply Button — shown when local state differs from URL */}
      {hasLocalChanges && (
        <button
          type="button"
          onClick={handleApply}
          className="w-full rounded-md py-2 text-[13px] font-semibold transition-colors"
          style={{
            backgroundColor: fsConfig.priceInputFocusRingColor,
            color: "#fff",
          }}
          aria-label={filtersText.applyPriceFilter || "Apply"}
        >
          {filtersText.applyPriceFilter || "Apply"}
        </button>
      )}

      {/* Preset Price Ranges (e-commerce best practice) */}
      {showQuickButtons && (
        <div className="space-y-1">
          {presetRanges.map((range) => {
            const isActive = currentMin === range.min && currentMax === range.max;
            return (
              <button
                key={range.label}
                type="button"
                onClick={() => handlePresetClick(range)}
                className={`flex w-full items-center justify-between rounded-md border px-3 py-2 text-[13px] transition-colors ${
                  isActive ? "border-transparent" : "border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 hover:border-neutral-300"
                }`}
                style={
                  isActive
                    ? {
                        backgroundColor: fsConfig.priceQuickButtonActiveBg,
                        color: fsConfig.priceQuickButtonActiveText,
                      }
                    : undefined
                }
              >
                <span>{currencySymbol ? range.label.replace(/(\d+)/g, (m) => `${currencySymbol}${m}`) : range.label}</span>
                {isActive && (
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Clear Button */}
      {hasPriceFilter && (
        <button
          type="button"
          onClick={handleClear}
          className="w-full rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-600 transition-colors hover:bg-neutral-50 hover:border-neutral-300"
          aria-label={filtersText.clearPriceFilter || "Clear"}
        >
          {filtersText.clearPriceFilter || "Clear"}
        </button>
      )}
    </div>
  );
}
