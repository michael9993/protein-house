"use client";

import { useState, useEffect } from "react";
import { LayoutGrid, List } from "lucide-react";
import { useBranding } from "@/providers/StoreConfigProvider";

/**
 * DisplayModeToggle - Standard E-commerce View Selector
 *
 * Display Modes (Industry Standard):
 * - List View (1): Horizontal cards with full details - great for comparison
 * - Grid View (4): Standard responsive grid - 2 col mobile, 3 col tablet, 4 col desktop
 *
 * Industry Best Practices:
 * - 44px touch targets for mobile accessibility
 * - Persists preference in localStorage
 * - Grid is default (most common user preference)
 */

export type DisplayMode = 1 | 2 | 3 | 4;

interface DisplayModeToggleProps {
  value: DisplayMode;
  onChange: (mode: DisplayMode) => void;
  className?: string;
}

const STORAGE_KEY = "v7-products-display-mode";

export function useDisplayMode(defaultMode: DisplayMode = 4): [DisplayMode, (mode: DisplayMode) => void] {
  const [mode, setMode] = useState<DisplayMode>(defaultMode);
  const [isHydrated, setIsHydrated] = useState(false);

  // Load saved preference on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = parseInt(saved, 10) as DisplayMode;
      // Only accept list (1) or grid (4) modes now
      if (parsed === 1 || parsed === 4) {
        setMode(parsed);
      }
    }
    setIsHydrated(true);
  }, []);

  // Save preference
  const updateMode = (newMode: DisplayMode) => {
    setMode(newMode);
    localStorage.setItem(STORAGE_KEY, String(newMode));
  };

  return [isHydrated ? mode : defaultMode, updateMode];
}

export function DisplayModeToggle({ value, onChange, className = "" }: DisplayModeToggleProps) {
  const branding = useBranding();

  // Standard e-commerce: List view and Grid view only
  const modes: { mode: DisplayMode; icon: typeof LayoutGrid; label: string }[] = [
    { mode: 1, icon: List, label: "List view" },
    { mode: 4, icon: LayoutGrid, label: "Grid view" },
  ];

  return (
    <div
      className={`inline-flex items-center gap-0.5 rounded-lg border border-neutral-200 bg-white p-0.5 shadow-sm ${className}`}
      role="radiogroup"
      aria-label="View mode"
    >
      {modes.map(({ mode, icon: Icon, label }) => {
        const isActive = value === mode;
        return (
          <button
            key={mode}
            type="button"
            role="radio"
            aria-checked={isActive}
            aria-label={label}
            onClick={() => onChange(mode)}
            className={`
              flex h-9 w-9 items-center justify-center rounded-md
              transition-all duration-150
              focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1
              ${isActive
                ? "shadow-sm"
                : "text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
              }
            `}
            style={{
              backgroundColor: isActive ? branding.colors.primary : undefined,
              color: isActive ? "#ffffff" : undefined,
              "--tw-ring-color": branding.colors.primary,
            } as React.CSSProperties}
          >
            <Icon className="h-4 w-4" strokeWidth={isActive ? 2.5 : 2} />
          </button>
        );
      })}
    </div>
  );
}

/**
 * Get grid column classes based on display mode
 */
export function getGridClasses(mode: DisplayMode): string {
  switch (mode) {
    case 1:
      // List view: Single column on all screens (horizontal cards)
      return "grid-cols-1";
    case 4:
    default:
      // Grid view: 2 on mobile, 3 on tablet, 4 on desktop
      return "grid-cols-2 md:grid-cols-3 lg:grid-cols-4";
  }
}

/**
 * Get gap classes based on display mode
 */
export function getGapClasses(mode: DisplayMode): string {
  switch (mode) {
    case 1:
      // List view: Larger gaps for better separation
      return "gap-4 sm:gap-5";
    case 4:
    default:
      // Grid view: Standard gaps
      return "gap-3 sm:gap-4 md:gap-5 lg:gap-6";
  }
}
