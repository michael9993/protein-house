"use client";

import { forwardRef } from "react";
import { useUiConfig } from "@/providers/StoreConfigProvider";

const BORDER_RADIUS_MAP: Record<string, string> = {
  none: "0px",
  sm: "2px",
  md: "4px",
  full: "9999px",
};

interface StyledCheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  /** Override the checked background color (falls back to global ui.checkbox config) */
  checkedColor?: string | null;
}

/**
 * A fully styled checkbox that respects global ui.checkbox config
 * (checkedBackgroundColor, borderRadius) and filter-sidebar overrides.
 *
 * Uses `appearance: none` for full CSS control over all states.
 */
export const StyledCheckbox = forwardRef<HTMLInputElement, StyledCheckboxProps>(
  function StyledCheckbox({ checkedColor, className = "", style, ...props }, ref) {
    const ui = useUiConfig();
    const cbConfig = ui.checkbox ?? {};

    const bgColor = checkedColor ?? cbConfig.checkedBackgroundColor ?? "#171717";
    const radius = BORDER_RADIUS_MAP[cbConfig.borderRadius ?? "sm"] ?? "2px";

    return (
      <input
        ref={ref}
        type="checkbox"
        className={`styled-checkbox h-4 w-4 flex-shrink-0 cursor-pointer transition-all duration-150 focus:outline-none ${className}`}
        style={
          {
            "--cb-checked-bg": bgColor,
            "--cb-radius": radius,
            ...style,
          } as React.CSSProperties
        }
        {...props}
      />
    );
  },
);
