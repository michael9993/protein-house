import { TableCell, type TableCellProps } from "@dashboard/components/Table";
import { cn } from "@dashboard/utils/cn";
import { forwardRef } from "react";

import ArrowSort from "../../icons/ArrowSort";

export type TableCellHeaderArrowDirection = "asc" | "desc";
type TableCellHeaderArrowPosition = "left" | "right";
interface TableCellHeaderProps extends TableCellProps {
  arrowPosition?: TableCellHeaderArrowPosition;
  direction?: TableCellHeaderArrowDirection;
  textAlign?: "left" | "center" | "right";
  disabled?: boolean;
}

const TableCellHeader = forwardRef<unknown, TableCellHeaderProps>((props, ref) => {
  const {
    arrowPosition,
    children,
    className,
    direction,
    textAlign,
    disabled = false,
    onClick,
    ...rest
  } = props;

  return (
    <TableCell
      {...rest}
      innerRef={ref}
      onClick={e => {
        if (disabled || !onClick) {
          e.preventDefault();
        } else {
          onClick(e);
        }
      }}
      className={cn(
        "cursor-pointer",
        disabled && "opacity-70 [&&]:cursor-[unset]",
        !onClick && "cursor-[unset]",
        className,
      )}
    >
      <div
        className={cn(
          "flex hover:text-text-primary",
          !!direction && !!arrowPosition && "text-text-primary",
          textAlign === "center" && "justify-center",
          textAlign === "right" && "justify-end",
        )}
      >
        {!!direction && arrowPosition === "left" && (
          <ArrowSort
            className={cn(
              "transition-transform duration-200 mb-1 -ml-6",
              direction === "asc" && "rotate-180",
            )}
          />
        )}
        <div className="inline-block self-center select-none">{children}</div>
        {!!direction && arrowPosition === "right" && (
          <ArrowSort
            className={cn(
              "transition-transform duration-200 mb-1",
              direction === "asc" && "rotate-180",
            )}
          />
        )}
      </div>
    </TableCell>
  );
});

TableCellHeader.displayName = "TableCellHeader";
TableCellHeader.defaultProps = {
  arrowPosition: "left",
  textAlign: "left",
};
export default TableCellHeader;
