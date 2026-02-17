import * as React from "react";

import { TableSectionContext } from "./context";

export interface TableFooterProps extends React.HTMLAttributes<HTMLTableSectionElement> {
  children?: React.ReactNode;
  className?: string;
}

export const TableFooter = React.forwardRef<HTMLTableSectionElement, TableFooterProps>(
  ({ children, ...rest }, ref) => (
    <TableSectionContext.Provider value="footer">
      <tfoot ref={ref} {...rest}>
        {children}
      </tfoot>
    </TableSectionContext.Provider>
  ),
);

TableFooter.displayName = "TableFooter";
