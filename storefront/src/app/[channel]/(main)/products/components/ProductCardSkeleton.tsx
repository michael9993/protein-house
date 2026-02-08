"use client";

import { ShoppingBag } from "lucide-react";
import type { DisplayMode } from "./DisplayModeToggle";

/**
 * ProductCardSkeleton - Premium Loading Skeleton
 *
 * Matches the bold ProductCard design with shimmer effects
 * Adapts to display mode for consistent loading states
 */
interface ProductCardSkeletonProps {
  displayMode?: DisplayMode;
}

export function ProductCardSkeleton({ displayMode = 4 }: ProductCardSkeletonProps) {
  const isCompactMode = displayMode === 4;
  const isSingleColumn = displayMode === 1;

  return (
    <article
      className={`flex h-full overflow-hidden bg-white ${
        isSingleColumn ? "flex-row rounded-2xl" : "flex-col rounded-2xl sm:rounded-3xl"
      }`}
      style={{
        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -2px rgba(0, 0, 0, 0.06)",
      }}
    >
      {/* Image Container Skeleton */}
      <div
        className={`relative overflow-hidden ${
          isSingleColumn
            ? "aspect-square w-36 shrink-0 sm:w-48"
            : "aspect-square"
        }`}
        style={{
          background: "linear-gradient(145deg, #f8f8f8 0%, #ffffff 50%, #f5f5f5 100%)",
        }}
      >
        {/* Shimmer effect */}
        <div className="v7-shimmer absolute inset-0" />

        {/* Center icon placeholder */}
        <div className="absolute inset-0 flex items-center justify-center">
          <ShoppingBag className={`text-neutral-100 ${isCompactMode ? "h-10 w-10" : "h-16 w-16"}`} strokeWidth={1} />
        </div>

        {/* Badge placeholder - top left */}
        <div className={`absolute z-10 ${
          isCompactMode ? "start-2 top-2" : "start-3 top-3 sm:start-4 sm:top-4"
        }`}>
          <div className={`rounded-full bg-neutral-200/60 ${
            isCompactMode ? "h-5 w-14" : "h-6 w-16 sm:h-7 sm:w-20"
          }`} />
        </div>

        {/* Wishlist button placeholder - top right */}
        <div className={`absolute z-10 ${
          isCompactMode ? "end-2 top-2" : "end-3 top-3 sm:end-4 sm:top-4"
        }`}>
          <div className={`rounded-full bg-neutral-200/60 ${
            isCompactMode ? "h-9 w-9" : "h-10 w-10 sm:h-11 sm:w-11"
          }`} />
        </div>

        {/* Brand pill placeholder - bottom left */}
        <div className={`absolute z-10 ${
          isCompactMode ? "bottom-2 start-2" : "bottom-3 start-3 sm:bottom-4 sm:start-4"
        }`}>
          <div className={`rounded-full bg-neutral-200/60 ${
            isCompactMode ? "h-4 w-14" : "h-6 w-20 sm:h-7 sm:w-24"
          }`} />
        </div>
      </div>

      {/* Content Area Skeleton */}
      <div className={`flex flex-1 flex-col ${
        isCompactMode
          ? "p-3 sm:p-4"
          : isSingleColumn
            ? "justify-center p-4 sm:p-5"
            : "p-3 sm:p-5"
      }`}>
        {/* Category placeholder */}
        <div className={`rounded bg-neutral-200 ${
          isCompactMode ? "mb-0.5 h-2.5 w-12" : "mb-1 h-3 w-16 sm:mb-2"
        }`} />

        {/* Product name placeholder - 2 lines */}
        <div className={`space-y-1.5 sm:space-y-2 ${
          isCompactMode
            ? "min-h-[2.25rem] sm:min-h-[2.5rem]"
            : "min-h-[2.5rem] sm:min-h-[2.75rem]"
        }`}>
          <div className={`rounded bg-neutral-200 ${
            isCompactMode ? "h-3.5 sm:h-4" : "h-4"
          } w-full`} />
          <div className={`rounded bg-neutral-200 ${
            isCompactMode ? "h-3.5 sm:h-4" : "h-4"
          } w-4/5`} />
        </div>

        {/* Rating placeholder */}
        <div className={`flex items-center ${
          isCompactMode ? "mt-1 gap-1" : "mt-1.5 gap-1.5 sm:mt-2"
        }`}>
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className={`rounded-full bg-neutral-200 ${
                isCompactMode ? "h-2.5 w-2.5" : "h-3 w-3 sm:h-3.5 sm:w-3.5"
              }`} />
            ))}
          </div>
          <div className={`rounded bg-neutral-200 ${
            isCompactMode ? "h-2.5 w-5" : "h-3 w-6"
          }`} />
        </div>

        {/* Price row placeholder */}
        <div className={`mt-auto flex items-end justify-between ${
          isCompactMode ? "pt-2" : "pt-3 sm:pt-4"
        }`}>
          <div className="flex flex-col gap-1">
            <div className={`rounded bg-neutral-200 ${
              isCompactMode ? "h-2.5 w-12 sm:h-3 sm:w-14" : "h-3 w-14"
            }`} />
            <div className={`rounded bg-neutral-200 ${
              isCompactMode ? "h-5 w-20 sm:h-6 sm:w-24" : "h-6 w-24"
            }`} />
          </div>
          <div className={`rounded-full bg-neutral-200 sm:hidden ${
            isCompactMode ? "h-9 w-9" : "h-10 w-10"
          }`} />
        </div>
      </div>
    </article>
  );
}
