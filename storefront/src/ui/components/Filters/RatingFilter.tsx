"use client";

/**
 * RatingFilter Component
 * 
 * Allows users to filter products by minimum rating (1-5 stars).
 * Uses URL as source of truth, same pattern as other filters.
 * Config-driven: Uses StoreConfig from context for branding.
 */

import { useCallback } from "react";
import { useProductFilters } from "@/hooks/useProductFilters";
import { useStoreConfig, useFiltersText } from "@/providers/StoreConfigProvider";

export function RatingFilter() {
  const { filters, updateFilters } = useProductFilters();
  // Use config from context (per-channel)
  const config = useStoreConfig();
  const { branding } = config;
  const filtersText = useFiltersText();

  const currentRating = filters.rating;

  const handleRatingClick = useCallback(
    (rating: number) => {
      // Toggle: if already set to this rating, clear it
      if (currentRating === rating) {
        updateFilters({
          rating: undefined,
        });
      } else {
        updateFilters({
          rating,
        });
      }
    },
    [updateFilters, currentRating]
  );

  const handleClear = useCallback(() => {
    updateFilters({
      rating: undefined,
    });
  }, [updateFilters]);

  const hasRatingFilter = currentRating !== undefined && currentRating !== null;

  // Helper to format rating text
  const formatRatingText = (rating: number) => {
    if (rating === 1) {
      return filtersText.starAndUp || "1 star & up";
    }
    return (filtersText.starsAndUp || "{count} stars & up").replace("{count}", rating.toString());
  };

  return (
    <div className="space-y-4">
      {/* Rating Stars */}
      <div>
        <label className="block text-xs font-medium text-neutral-700 mb-2">
          {filtersText.minimumRating || "Minimum Rating"}
        </label>
        <div className="flex flex-col gap-2">
          {[5, 4, 3, 2, 1].map((rating) => {
            const isActive = currentRating === rating;
            return (
              <button
                key={rating}
                type="button"
                onClick={() => handleRatingClick(rating)}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
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
                aria-label={`Filter by ${rating} star${rating > 1 ? "s" : ""} and up`}
              >
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg
                      key={star}
                      className={`h-4 w-4 ${
                        star <= rating
                          ? isActive
                            ? "text-white"
                            : "text-warning-400"
                          : "text-neutral-300"
                      }`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span className="text-xs">
                  {formatRatingText(rating)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Clear Button */}
      {hasRatingFilter && (
        <button
          type="button"
          onClick={handleClear}
          className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-50 hover:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-offset-1"
          style={{
            "--tw-ring-color": branding.colors.primary,
          } as React.CSSProperties}
          aria-label="Clear rating filter"
        >
          {filtersText.clearRatingFilter || "Clear"}
        </button>
      )}
    </div>
  );
}


