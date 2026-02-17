import { cn } from "@dashboard/utils/cn";
import * as React from "react";

export interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  children?: React.ReactNode;
  className?: string;
  /** @deprecated MUI compat — ignored */
  stickyHeader?: boolean;
  /** @deprecated MUI compat — ignored */
  size?: "small" | "medium";
}

export const Table = React.forwardRef<HTMLTableElement, TableProps>(
  ({ children, className, stickyHeader: _, size: _s, ...rest }, ref) => (
    <table
      ref={ref}
      className={cn("w-full border-collapse [border-spacing:0]", className)}
      {...rest}
    >
      {children}
    </table>
  ),
);

Table.displayName = "Table";
