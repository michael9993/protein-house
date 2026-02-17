import { cn } from "@dashboard/utils/cn";
import { Table } from "@mui/material";
import * as React from "react";

interface ResponsiveTableProps {
  children: React.ReactNode | React.ReactNodeArray;
  className?: string;
  onMouseLeave?: () => void;
  key?: string;
}

const ResponsiveTable = (props: ResponsiveTableProps) => {
  const { children, className, onMouseLeave } = props;

  return (
    <div className="w-full overflow-x-auto">
      <Table
        className={cn("table-auto md:table-fixed", className)}
        onMouseLeave={onMouseLeave}
      >
        {children}
      </Table>
    </div>
  );
};

ResponsiveTable.displayName = "ResponsiveTable";
export default ResponsiveTable;
