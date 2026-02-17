import Money from "@dashboard/components/Money";
import TableCellAvatar from "@dashboard/components/TableCellAvatar";
import TableRowLink from "@dashboard/components/TableRowLink";
import { OrderLineGrantRefundFragment } from "@dashboard/graphql";
import { renderCollection } from "@dashboard/misc";
import { Table, TableBody, TableCell, TableHead } from "@dashboard/components/Table";
import { Box, Button, Input, Text } from "@saleor/macaw-ui-next";
import * as React from "react";
import { FormattedMessage } from "react-intl";

import { useGrantRefundContext } from "../context";
import { grantRefundPageMessages, productCardMessages } from "../messages";

interface ProductsCardProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  lines: OrderLineGrantRefundFragment[];
}

export const ProductsCard = ({ title, subtitle, lines }: ProductsCardProps) => {
  const { dispatch, state } = useGrantRefundContext();

  if (lines.length === 0) {
    return null;
  }

  const getHandleAmountChange =
    (line: OrderLineGrantRefundFragment) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const parsedValue = parseInt(e.target.value, 10);
      const value = Number.isNaN(parsedValue) ? 0 : parsedValue;

      dispatch({
        type: "setQuantity",
        lineId: line.id,
        amount: value,
        unitPrice: line.unitPrice.gross.amount,
      });
    };
  const handleSetMaxQuanity = () => {
    dispatch({
      type: "setMaxQuantity",
      lines: lines.map(line => ({
        id: line.id,
        quantity: state.lines.get(line.id)?.availableQuantity ?? 0,
        unitPrice: line.unitPrice.gross.amount,
      })),
    });
  };

  return (
    <>
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Text size={5} fontWeight="bold">
          {title}
          {subtitle}
        </Text>
        <Button
          variant="secondary"
          onClick={handleSetMaxQuanity}
          data-test-id="setMaxQuantityButton"
        >
          <FormattedMessage {...grantRefundPageMessages.setMaxQuantity} />
        </Button>
      </Box>
      <Table>
        <TableHead>
          <TableCell className="w-auto">
            <FormattedMessage {...productCardMessages.product} />
          </TableCell>
          <TableCell className="text-right w-[164px]">
            <FormattedMessage {...productCardMessages.unitPrice} />
          </TableCell>
          <TableCell className="text-right w-[139px]">
            <FormattedMessage {...productCardMessages.quantity} />
          </TableCell>
          <TableCell className="text-right w-[164px]">
            <FormattedMessage {...productCardMessages.qtyToRefund} />
          </TableCell>
        </TableHead>
        <TableBody>
          {renderCollection(
            lines,
            line => {
              if (!line) {
                return null;
              }

              const stateLine = state.lines.get(line.id);

              return (
                <TableRowLink key={line.id}>
                  <TableCellAvatar thumbnail={line.thumbnail?.url} className="w-auto">
                    <div className="flex flex-col [&_span:last-child]:text-saleor-main-3 [&_span:last-child]:text-xl">
                      <span>{line.productName}</span>
                      <span>{line.variantName}</span>
                    </div>
                  </TableCellAvatar>
                  <TableCell className="text-right w-[164px]">
                    <Money money={line.unitPrice.gross} />
                  </TableCell>
                  <TableCell className="text-right w-[139px]">{line.quantity}</TableCell>
                  <TableCell className="text-right w-[164px]">
                    <Input
                      size="small"
                      textAlign="right"
                      type="number"
                      max={stateLine?.availableQuantity}
                      min={0}
                      data-test-id={"quantityInput" + line.id}
                      value={stateLine?.selectedQuantity ?? 0}
                      onChange={getHandleAmountChange(line)}
                      endAdornment={
                        line.quantity && (
                          <Box size={3} whiteSpace="nowrap" color="default2">
                            / {stateLine?.availableQuantity}
                          </Box>
                        )
                      }
                    />
                  </TableCell>
                </TableRowLink>
              );
            },
            () => (
              <TableRowLink>
                <TableCell colSpan={3}>
                  <FormattedMessage id="Q1Uzbb" defaultMessage="No products found" />
                </TableCell>
              </TableRowLink>
            ),
          )}
        </TableBody>
      </Table>
    </>
  );
};
