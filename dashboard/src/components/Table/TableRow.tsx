import { cn } from "@dashboard/utils/cn";
import * as React from "react";

export interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  children?: React.ReactNode;
  className?: string;
  hover?: boolean;
  selected?: boolean;
}

export const TableRow = React.forwardRef<HTMLTableRowElement, TableRowProps>(
  ({ children, className, hover, selected, ...rest }, ref) => (
    <tr
      ref={ref}
      className={cn(
        hover && "hover:bg-[rgba(0,0,0,0.04)]",
        selected && "bg-[rgba(0,0,0,0.08)]",
        className,
      )}
      {...rest}
    >
      {children}
    </tr>
  ),
);

TableRow.displayName = "TableRow";
