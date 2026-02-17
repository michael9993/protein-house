import { cn } from "@dashboard/utils/cn";
import * as React from "react";

import { useTableSection } from "./context";

export type TableCellPadding = "checkbox" | "none" | "normal";
export type TableCellAlign = "center" | "inherit" | "justify" | "left" | "right";

export interface TableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
  children?: React.ReactNode;
  className?: string;
  padding?: TableCellPadding;
  align?: TableCellAlign;
  colSpan?: number;
  /** @deprecated MUI compat — use ref instead */
  innerRef?: React.Ref<unknown>;
  /** @deprecated MUI compat — ignored */
  variant?: "head" | "body" | "footer";
}

const alignClasses: Record<TableCellAlign, string> = {
  left: "text-left",
  right: "text-right",
  center: "text-center",
  justify: "text-justify",
  inherit: "text-inherit",
};

export const TableCell = React.forwardRef<HTMLTableCellElement, TableCellProps>(
  (
    {
      children,
      className,
      padding = "normal",
      align = "left",
      innerRef,
      variant: _variant,
      ...rest
    },
    ref,
  ) => {
    const section = useTableSection();
    const Tag = section === "head" ? "th" : "td";

    return (
      <Tag
        ref={(innerRef as React.Ref<HTMLTableCellElement>) ?? ref}
        className={cn(
          "border-b border-[var(--mu-colors-border-default1)] align-middle text-sm leading-[1.43]",
          padding === "normal" && "py-4 px-4",
          padding === "checkbox" && "w-12 p-0 pl-1",
          padding === "none" && "p-0",
          section === "head" && "font-medium leading-6",
          alignClasses[align],
          className,
        )}
        {...rest}
      >
        {children}
      </Tag>
    );
  },
);

TableCell.displayName = "TableCell";
