// @ts-strict-ignore
import TableCellAvatar from "@dashboard/components/TableCellAvatar";
import TableRowLink from "@dashboard/components/TableRowLink";
import { OrderFulfillLineFragment } from "@dashboard/graphql";
import { FormsetChange, FormsetData } from "@dashboard/hooks/useFormset";
import {
  getAttributesCaption,
  getOrderLineAvailableQuantity,
  getWarehouseStock,
  OrderFulfillLineFormData,
} from "@dashboard/orders/utils/data";
import { TableCell } from "@dashboard/components/Table";
import { IconButton } from "@dashboard/components/IconButton/IconButton";
import { AlertTriangle, ChevronDown } from "lucide-react";
import { Box, Input, Skeleton, Text, Tooltip } from "@saleor/macaw-ui-next";
import { useIntl } from "react-intl";

import { cn } from "@dashboard/utils/cn";

import { messages } from "./messages";

interface OrderFulfillLineProps {
  line: OrderFulfillLineFragment;
  lineIndex: number;
  formsetData: FormsetData<null, OrderFulfillLineFormData[]>;
  formsetChange: FormsetChange<OrderFulfillLineFormData[]>;
  onWarehouseChange: () => void;
}

const OrderFulfillLine = (props: OrderFulfillLineProps) => {
  const { line, lineIndex, formsetData, formsetChange, onWarehouseChange } = props;
  const intl = useIntl();
  const isDeletedVariant = !line?.variant;
  const isPreorder = !!line.variant?.preorder;
  const lineFormQuantity = isPreorder ? 0 : formsetData[lineIndex]?.value?.[0]?.quantity;
  const lineFormWarehouse = formsetData[lineIndex]?.value?.[0]?.warehouse;
  const overfulfill = lineFormQuantity > line.quantityToFulfill;
  const warehouseStock = getWarehouseStock(line?.variant?.stocks, lineFormWarehouse?.id);
  const availableQuantity = getOrderLineAvailableQuantity(line, warehouseStock);
  const isStockExceeded = lineFormQuantity > availableQuantity;

  if (!line) {
    return (
      <TableRowLink key={lineIndex}>
        <TableCellAvatar className="w-[220px]">
          <Skeleton />
        </TableCellAvatar>
        <TableCell className="text-right text-ellipsis w-[100px]">
          <Skeleton />
        </TableCell>
        <TableCell className="text-right w-[210px]">
          <Skeleton />
        </TableCell>
        <TableCell className="text-right w-[180px]">
          <Skeleton />
        </TableCell>
        <TableCell className="w-[200px] text-right">
          <Skeleton />
        </TableCell>
      </TableRowLink>
    );
  }

  return (
    <TableRowLink key={line.id}>
      <TableCellAvatar
        className="w-[220px]"
        thumbnail={line?.thumbnail?.url}
        badge={
          isPreorder || !line?.variant ? (
            <Tooltip>
              <Tooltip.Trigger>
                <div className="text-saleor-warning mr-4">
                  <AlertTriangle size={20} />
                </div>
              </Tooltip.Trigger>
              <Tooltip.Content side="bottom">
                <Tooltip.Arrow />
                <Box __maxWidth={350}>
                  {intl.formatMessage(
                    isPreorder ? messages.preorderWarning : messages.deletedVariantWarning,
                  )}
                </Box>
              </Tooltip.Content>
            </Tooltip>
          ) : undefined
        }
      >
        {line.productName}
        <Text color="default2" size={2} fontWeight="light">
          {getAttributesCaption(line.variant?.attributes)}
        </Text>
      </TableCellAvatar>
      <TableCell className="text-right text-ellipsis w-[100px]">{line.variant?.sku}</TableCell>
      {isPreorder ? (
        <TableCell className="text-right w-[210px]" />
      ) : (
        <TableCell
          className="text-right w-[210px]"
          key={warehouseStock?.id ?? "deletedVariant" + lineIndex}
        >
          <Input
            size="small"
            type="number"
            className={cn({
              "!border-status-warning-dark shadow-[0_0_0_3px_var(--color-status-warning-light)]": isStockExceeded && !overfulfill,
            })}
            min={0}
            style={{ textAlign: "right" }}
            value={lineFormQuantity}
            onChange={event =>
              formsetChange(line.id, [
                {
                  quantity: parseInt(event.target.value, 10),
                  warehouse: lineFormWarehouse,
                },
              ])
            }
            error={overfulfill}
            endAdornment={
              <div className="py-4 text-text-secondary whitespace-nowrap">/ {line.quantityToFulfill}</div>
            }
          />
        </TableCell>
      )}
      <TableCell className="text-right w-[180px]" key="total">
        {lineFormWarehouse ? (isPreorder || isDeletedVariant ? undefined : availableQuantity) : "-"}
      </TableCell>
      <TableCell className="w-[200px] text-right">
        {isPreorder ? (
          "-"
        ) : (
          <IconButton
            onClick={onWarehouseChange}
            className={cn(
              "p-3 w-full justify-end cursor-pointer border border-primary-dark hover:border-transparent",
              "MuiInputBase-root MuiOutlinedInput-root MuiInputBase-fullWidth MuiInputBase-formControl MuiInputBase-adornedEnd MuiOutlinedInput-adornedEnd",
            )}
            data-test-id="select-warehouse-button"
            size="medium">
            <div className="flex justify-between items-center w-full cursor-pointer">
              <Text className="overflow-hidden text-ellipsis whitespace-nowrap">
                {lineFormWarehouse?.name ?? intl.formatMessage(messages.selectWarehouse)}
              </Text>
              <ChevronDown size={20} />
            </div>
          </IconButton>
        )}
      </TableCell>
    </TableRowLink>
  );
};

OrderFulfillLine.displayName = "OrderFulfillLine";
export default OrderFulfillLine;
