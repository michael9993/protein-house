// @ts-strict-ignore
import { getStatusColor, PillStatusType } from "@dashboard/misc";
import { cn } from "@dashboard/utils/cn";
import { useTheme } from "@saleor/macaw-ui-next";
import { forwardRef } from "react";

export interface CustomPillProps {
  color: PillStatusType;
  label: string;
  className?: string;
  style?: React.CSSProperties;
  outlined?: boolean;
}

export const Pill = forwardRef<HTMLSpanElement, CustomPillProps>(
  ({ color: status, label, className, style, outlined, ...props }, ref) => {
    const { theme: currentTheme } = useTheme();

    const colors = getStatusColor({
      status: status,
      currentTheme,
    });

    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center rounded-[32px] border border-solid font-medium px-2 py-0.5 text-xs leading-normal",
          className,
        )}
        style={{
          backgroundColor: colors.base,
          borderColor: colors.border,
          color: colors.text,
          fontWeight: 500,
          ...style,
        }}
        {...props}
      >
        {label}
      </span>
    );
  },
);

Pill.displayName = "Pill";
