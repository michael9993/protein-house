// @ts-strict-ignore
import TableRowLink from "@dashboard/components/TableRowLink";
import { cn } from "@dashboard/utils/cn";
import { TableCell, TableHead as MuiTableHead } from "@mui/material";
import { TableHeadProps as MuiTableHeadProps } from "@mui/material/TableHead";
import { Text } from "@saleor/macaw-ui-next";
import * as React from "react";
import { FormattedMessage } from "react-intl";

import { Node } from "../../types";
import Checkbox from "../Checkbox";

interface TableHeadProps extends MuiTableHeadProps {
  colSpan: number;
  disabled: boolean;
  dragRows?: boolean;
  selected?: number;
  items: Node[];
  toolbar?: React.ReactNode | React.ReactNodeArray;
  toggleAll?: (items: Node[], selected: number) => void;
}

function getColSpan(colSpan: number, dragRows: boolean): number {
  if (dragRows) {
    return colSpan - 2;
  }

  return colSpan - 1;
}

const TableHead = (props: TableHeadProps) => {
  const {
    children,
    colSpan,
    disabled,
    dragRows,
    items,
    selected,
    toggleAll,
    toolbar,
    ...muiTableHeadProps
  } = props;

  return (
    <MuiTableHead {...muiTableHeadProps}>
      <TableRowLink>
        {dragRows && (items === undefined || items.length > 0) && <TableCell />}
        {(items === undefined || items.length > 0) && (
          <TableCell
            padding="checkbox"
            className={cn(
              "h-[56px]",
              dragRows && "w-[52px] p-0",
            )}
          >
            <Checkbox
              data-test-id="select-all-checkbox"
              indeterminate={items && items.length > selected && selected > 0}
              checked={selected !== 0}
              disabled={disabled}
              onChange={() => toggleAll(items, selected)}
            />
          </TableCell>
        )}
        {selected ? (
          <>
            <TableCell
              className="h-[56px] pl-0 pr-8"
              colSpan={getColSpan(colSpan, dragRows)}
            >
              <div className="flex items-center h-[47px] -mr-4">
                {selected && (
                  <Text data-test-id="SelectedText">
                    <FormattedMessage
                      id="qu/hXD"
                      defaultMessage="Selected {number} items"
                      values={{
                        number: selected,
                      }}
                    />
                  </Text>
                )}
                <div className="flex-1" />
                {toolbar && (
                  <div
                    data-test-id="bulk-delete-button"
                    className="mr-3 [&>*]:ml-2"
                  >
                    {toolbar}
                  </div>
                )}
              </div>
            </TableCell>
          </>
        ) : (
          children
        )}
      </TableRowLink>
    </MuiTableHead>
  );
};

TableHead.displayName = "TableHead";
export default TableHead;
