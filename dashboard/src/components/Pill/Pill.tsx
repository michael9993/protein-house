// @ts-strict-ignore
import { getStatusColor, PillStatusType } from "@dashboard/misc";
import { cn } from "@dashboard/utils/cn";
import { Pill as MacawuiPill, PillProps } from "@saleor/macaw-ui";
import { useTheme } from "@saleor/macaw-ui-next";
import { forwardRef } from "react";

export interface CustomPillProps extends Omit<PillProps, "color"> {
  color: PillStatusType;
}

// Main purpose of this component is to override default Pill component
// from macaw-ui to add custom styles
// TODO: migrate to Pill component from new macaw-ui when it will be ready
export const Pill = forwardRef<HTMLDivElement, CustomPillProps>(
  ({ color: status, ...props }, ref) => {
    const { theme: currentTheme } = useTheme();

    const colors = getStatusColor({
      status: status,
      currentTheme,
    });

    return (
      <MacawuiPill
        placeholder={undefined}
        onPointerEnterCapture={undefined}
        onPointerLeaveCapture={undefined}
        {...(props as any)}
        ref={ref}
        className={cn(
          "rounded-[32px] border border-solid font-medium px-[2px] py-0 [&>span]:font-medium [&>div]:ml-2 [&>svg]:ml-2",
          props.className,
        )}
        style={{
          backgroundColor: colors.base,
          borderColor: colors.border,
          color: colors.text,
          fontWeight: 500,
          ...props.style,
        }}
      />
    );
  },
);

Pill.displayName = "Pill";
