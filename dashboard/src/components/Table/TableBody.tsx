import * as React from "react";

import { TableSectionContext } from "./context";

export interface TableBodyProps extends React.HTMLAttributes<HTMLTableSectionElement> {
  children?: React.ReactNode;
  className?: string;
}

export const TableBody = React.forwardRef<HTMLTableSectionElement, TableBodyProps>(
  ({ children, ...rest }, ref) => (
    <TableSectionContext.Provider value="body">
      <tbody ref={ref} {...rest}>
        {children}
      </tbody>
    </TableSectionContext.Provider>
  ),
);

TableBody.displayName = "TableBody";
