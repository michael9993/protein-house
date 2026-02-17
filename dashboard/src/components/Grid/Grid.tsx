import { cn } from "@dashboard/utils/cn";
import * as React from "react";

type GridVariant = "default" | "inverted" | "uniform";
interface GridProps {
  children: React.ReactNodeArray | React.ReactNode;
  className?: string;
  variant?: GridVariant;
  richText?: boolean;
}

export const Grid = ({
  className,
  children,
  variant = "default",
}: GridProps) => {
  return (
    <div
      className={cn(
        "grid gap-6 [&>div]:min-w-0 max-md:grid-rows-1 max-md:grid-cols-1 max-md:gap-2",
        variant === "default" && "grid-cols-[9fr_4fr]",
        variant === "inverted" && "grid-cols-[4fr_9fr]",
        variant === "uniform" && "grid-cols-[1fr_1fr]",
        className,
      )}
    >
      {children}
    </div>
  );
};
Grid.displayName = "Grid";
export default Grid;
