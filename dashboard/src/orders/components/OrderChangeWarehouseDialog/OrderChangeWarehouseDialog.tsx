// @ts-strict-ignore
import Debounce from "@dashboard/components/Debounce";
import { DashboardModal } from "@dashboard/components/Modal";
import { Table, TableCell } from "@dashboard/components/Table";
import TableRowLink from "@dashboard/components/TableRowLink";
import { OrderFulfillLineFragment, WarehouseFragment } from "@dashboard/graphql";
import { buttonMessages } from "@dashboard/intl";
import { getById } from "@dashboard/misc";
import { getLineAvailableQuantityInWarehouse } from "@dashboard/orders/utils/data";
import useWarehouseSearch from "@dashboard/searches/useWarehouseSearch";
import { mapEdgesToItems } from "@dashboard/utils/maps";
import { Button, isScrolledToBottom, SearchIcon, useElementScroll } from "@saleor/macaw-ui";
import { Box, Input, RadioGroup, Skeleton, Text } from "@saleor/macaw-ui-next";
import * as React from "react";
import { FormattedMessage, useIntl } from "react-intl";

import { changeWarehouseDialogMessages as messages } from "./messages";

interface OrderChangeWarehouseDialogProps {
  open: boolean;
  line: OrderFulfillLineFragment;
  currentWarehouseId: string;
  onConfirm: (warehouse: WarehouseFragment) => void;
  onClose: () => any;
}

const OrderChangeWarehouseDialog = ({
  open,
  line,
  currentWarehouseId,
  onConfirm,
  onClose,
}: OrderChangeWarehouseDialogProps) => {
  const intl = useIntl();
  const { anchor, position, setAnchor } = useElementScroll();
  const bottomShadow = !isScrolledToBottom(anchor, position, 20);
  const [query, setQuery] = React.useState<string>("");
  const [selectedWarehouseId, setSelectedWarehouseId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (currentWarehouseId) {
      setSelectedWarehouseId(currentWarehouseId);
    }
  }, [currentWarehouseId, open]);

  const {
    result: warehousesOpts,
    loadMore,
    search,
  } = useWarehouseSearch({
    variables: {
      after: null,
      channnelsId: null,
      first: 20,
      query: "",
    },
  });
  const filteredWarehouses = mapEdgesToItems(warehousesOpts?.data?.search);
  const selectedWarehouse = filteredWarehouses?.find(getById(selectedWarehouseId ?? ""));
  const handleSubmit = () => {
    onConfirm(selectedWarehouse);
    onClose();
  };

  React.useEffect(() => {
    if (!bottomShadow) {
      loadMore();
    }
  }, [bottomShadow]);

  return (
    <DashboardModal open={open} onChange={onClose}>
      <DashboardModal.Content size="sm" __gridTemplateRows="auto auto auto auto 1fr">
        <DashboardModal.Header>
          <FormattedMessage {...messages.dialogTitle} />
          <Text size={3} display="block">
            <FormattedMessage
              {...messages.dialogDescription}
              values={{
                productName: line?.productName,
              }}
            />
          </Text>
        </DashboardModal.Header>

        <Debounce debounceFn={search}>
          {debounceSearchChange => {
            const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
              const value = event.target.value;

              setQuery(value);
              debounceSearchChange(value);
            };

            return (
              <Input
                size="small"
                value={query}
                onChange={handleSearchChange}
                placeholder={intl.formatMessage(messages.searchFieldPlaceholder)}
                startAdornment={
                  <SearchIcon
                    onPointerEnterCapture={undefined}
                    onPointerLeaveCapture={undefined}
                  />
                }
              />
            );
          }}
        </Debounce>

        <Text textTransform="uppercase" fontWeight="medium" lineHeight={2}>
          <FormattedMessage {...messages.warehouseListLabel} />
        </Text>

        <Box ref={setAnchor} overflowY="auto">
          <Table>
            {filteredWarehouses ? (
              <RadioGroup
                value={selectedWarehouseId}
                name="warehouse"
                onValueChange={value => setSelectedWarehouseId(value)}
                className="table w-full"
              >
                {filteredWarehouses.map(warehouse => {
                  const lineQuantityInWarehouse = getLineAvailableQuantityInWarehouse(
                    line,
                    warehouse,
                  );

                  return (
                    <TableRowLink key={warehouse.id}>
                      <TableCell className="flex justify-between items-center">
                        <RadioGroup.Item value={warehouse.id} id={warehouse.id}>
                          <Text>
                            <div className="flex flex-col">
                              <span className="max-w-[350px] overflow-hidden text-ellipsis">
                                {warehouse.name}
                              </span>
                              <Text>
                                <FormattedMessage
                                  {...messages.productAvailability}
                                  values={{
                                    productCount: lineQuantityInWarehouse,
                                  }}
                                />
                              </Text>
                            </div>
                          </Text>
                        </RadioGroup.Item>
                        {currentWarehouseId === warehouse?.id && (
                          <Text display="inline-block" fontSize={3}>
                            <FormattedMessage {...messages.currentSelection} />
                          </Text>
                        )}
                      </TableCell>
                    </TableRowLink>
                  );
                })}
              </RadioGroup>
            ) : (
              <Skeleton />
            )}
          </Table>
        </Box>

        <DashboardModal.Actions>
          <Button
            onClick={handleSubmit}
            color="primary"
            variant="primary"
            disabled={!selectedWarehouse}
          >
            {intl.formatMessage(buttonMessages.select)}
          </Button>
        </DashboardModal.Actions>
      </DashboardModal.Content>
    </DashboardModal>
  );
};

OrderChangeWarehouseDialog.displayName = "OrderChangeWarehouseDialog";
export default OrderChangeWarehouseDialog;
