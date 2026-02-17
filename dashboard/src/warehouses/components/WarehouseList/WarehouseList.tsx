import { iconSize, iconStrokeWidthBySize } from "@dashboard/components/icons";
import ResponsiveTable from "@dashboard/components/ResponsiveTable";
import { TableButtonWrapper } from "@dashboard/components/TableButtonWrapper/TableButtonWrapper";
import TableCellHeader from "@dashboard/components/TableCellHeader";
import { TablePaginationWithContext } from "@dashboard/components/TablePagination";
import TableRowLink from "@dashboard/components/TableRowLink";
import { WarehouseWithShippingFragment } from "@dashboard/graphql";
import { getPrevLocationState } from "@dashboard/hooks/useBackLinkWithState";
import { renderCollection } from "@dashboard/misc";
import { ListProps, SortPage } from "@dashboard/types";
import { mapEdgesToItems } from "@dashboard/utils/maps";
import { getArrowDirection } from "@dashboard/utils/sort";
import { WarehouseListUrlSortField, warehouseUrl } from "@dashboard/warehouses/urls";
import { TableBody, TableCell, TableFooter, TableHead } from "@mui/material";
import { Button, Skeleton } from "@saleor/macaw-ui-next";
import { Trash2 } from "lucide-react";
import { FormattedMessage } from "react-intl";
import { useLocation } from "react-router";

interface WarehouseListProps extends ListProps, SortPage<WarehouseListUrlSortField> {
  warehouses: WarehouseWithShippingFragment[] | undefined;
  onRemove: (id: string | undefined) => void;
}

const numberOfColumns = 3;
const WarehouseList = (props: WarehouseListProps) => {
  const { warehouses, disabled, settings, sort, onUpdateListSettings, onRemove, onSort } = props;
  const location = useLocation();

  return (
    <ResponsiveTable data-test-id="warehouse-list">
      <TableHead>
        <TableRowLink>
          <TableCellHeader
            direction={
              sort.sort === WarehouseListUrlSortField.name
                ? getArrowDirection(!!sort.asc)
                : undefined
            }
            arrowPosition="right"
            className="pl-0 lg:w-[400px]"
            onClick={() => onSort(WarehouseListUrlSortField.name)}
          >
            <FormattedMessage id="aCJwVq" defaultMessage="Name" description="warehouse" />
          </TableCellHeader>
          <TableCell className="pl-0 lg:w-auto">
            <FormattedMessage id="PFXGaR" defaultMessage="Shipping Zones" />
          </TableCell>
          <TableCell className="lg:w-[160px]">
            <FormattedMessage id="wL7VAE" defaultMessage="Actions" />
          </TableCell>
        </TableRowLink>
      </TableHead>
      <TableFooter>
        <TableRowLink>
          <TablePaginationWithContext
            colSpan={numberOfColumns}
            settings={settings}
            disabled={disabled}
            onUpdateListSettings={onUpdateListSettings}
          />
        </TableRowLink>
      </TableFooter>
      <TableBody data-test-id="warehouses-list">
        {renderCollection(
          warehouses,
          warehouse => (
            <TableRowLink
              href={
                warehouse
                  ? {
                      pathname: warehouseUrl(warehouse.id),
                      state: getPrevLocationState(location),
                    }
                  : undefined
              }
              className="cursor-pointer"
              hover={!!warehouse}
              key={warehouse ? warehouse.id : "skeleton"}
              data-test-id={"warehouse-entry-" + warehouse?.name.toLowerCase().replace(" ", "")}
            >
              <TableCell className="pl-0 lg:w-[400px]" data-test-id="name">
                {warehouse?.name ?? <Skeleton />}
              </TableCell>
              <TableCell className="pl-0 lg:w-auto" data-test-id="zones">
                {warehouse?.shippingZones === undefined ? (
                  <Skeleton />
                ) : (
                  mapEdgesToItems(warehouse?.shippingZones)
                    ?.map(({ name }) => name)
                    .join(", ") || "-"
                )}
              </TableCell>
              <TableCell>
                <TableButtonWrapper>
                  <Button
                    icon={
                      <Trash2 size={iconSize.small} strokeWidth={iconStrokeWidthBySize.small} />
                    }
                    variant="secondary"
                    data-test-id="delete-button"
                    onClick={() => onRemove(warehouse?.id)}
                    marginLeft="auto"
                  />
                </TableButtonWrapper>
              </TableCell>
            </TableRowLink>
          ),
          () => (
            <TableRowLink data-test-id="empty-list-message">
              <TableCell colSpan={numberOfColumns}>
                <FormattedMessage id="2gsiR1" defaultMessage="No warehouses found" />
              </TableCell>
            </TableRowLink>
          ),
        )}
      </TableBody>
    </ResponsiveTable>
  );
};

WarehouseList.displayName = "WarehouseList";
export default WarehouseList;
