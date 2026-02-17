import * as React from "react";

import { TableSectionContext } from "./context";

export interface TableHeadProps extends React.HTMLAttributes<HTMLTableSectionElement> {
  children?: React.ReactNode;
  className?: string;
}

export const TableHead = React.forwardRef<HTMLTableSectionElement, TableHeadProps>(
  ({ children, ...rest }, ref) => (
    <TableSectionContext.Provider value="head">
      <thead ref={ref} {...rest}>
        {children}
      </thead>
    </TableSectionContext.Provider>
  ),
);

TableHead.displayName = "TableHead";
