// @ts-strict-ignore
import { DashboardCard } from "@dashboard/components/Card";
import Checkbox from "@dashboard/components/Checkbox";
import { iconSize, iconStrokeWidthBySize } from "@dashboard/components/icons";
import ResponsiveTable from "@dashboard/components/ResponsiveTable";
import { TableButtonWrapper } from "@dashboard/components/TableButtonWrapper/TableButtonWrapper";
import TableCellAvatar from "@dashboard/components/TableCellAvatar";
import TableHead from "@dashboard/components/TableHead";
import { TablePaginationWithContext } from "@dashboard/components/TablePagination";
import TableRowLink from "@dashboard/components/TableRowLink";
import { SaleDetailsFragment, VoucherDetailsFragment } from "@dashboard/graphql";
import { productVariantEditPath } from "@dashboard/products/urls";
import { getLoadableList, mapEdgesToItems } from "@dashboard/utils/maps";
import { TableBody, TableCell, TableFooter } from "@dashboard/components/Table";
import { IconButton } from "@dashboard/components/IconButton/IconButton";
import { Button, Skeleton } from "@saleor/macaw-ui-next";
import { Trash2 } from "lucide-react";
import { FormattedMessage, useIntl } from "react-intl";

import { maybe, renderCollection } from "../../../misc";
import { ListActions, ListProps } from "../../../types";
import { messages } from "./messages";

interface SaleVariantsProps extends ListProps, ListActions {
  variants: SaleDetailsFragment["variants"] | VoucherDetailsFragment["variants"];
  onVariantAssign: () => void;
  onVariantUnassign: (id: string) => void;
}

const numberOfColumns = 5;
const DiscountVariants = (props: SaleVariantsProps) => {
  const {
    variants: discountVariants,
    disabled,
    onVariantAssign,
    onVariantUnassign,
    isChecked,
    selected,
    toggle,
    toggleAll,
    toolbar,
  } = props;
  const intl = useIntl();

  const variants = mapEdgesToItems(discountVariants);

  return (
    <DashboardCard>
      <DashboardCard.Header>
        <DashboardCard.Title>
          {intl.formatMessage(messages.discountVariantsHeader)}
        </DashboardCard.Title>
        <DashboardCard.Toolbar>
          <Button onClick={onVariantAssign} data-test-id="assign-variant" variant="secondary">
            <FormattedMessage {...messages.discountVariantsButton} />
          </Button>
        </DashboardCard.Toolbar>
      </DashboardCard.Header>
      <ResponsiveTable>
        <colgroup>
          <col />
          <col className="pl-0 w-auto min-w-[200px]" />
          <col className="w-auto min-w-[150px]" />
          <col className="w-auto min-w-[150px]" />
          <col className="w-20 last:pr-0" />
        </colgroup>
        <TableHead
          colSpan={numberOfColumns}
          selected={selected}
          disabled={disabled}
          items={variants}
          toggleAll={toggleAll}
          toolbar={toolbar}
        >
          <TableCell className="pl-0 w-auto min-w-[200px]">
            <span className={variants?.length > 0 ? "ml-16" : undefined}>
              <FormattedMessage {...messages.discountVariantsTableProductHeader} />
            </span>
          </TableCell>
          <TableCell className="w-auto min-w-[150px]">
            <FormattedMessage {...messages.discountVariantsTableVariantHeader} />
          </TableCell>
          <TableCell className="w-auto min-w-[150px]">
            <FormattedMessage {...messages.discountVariantsTableProductHeader} />
          </TableCell>
          <TableCell className="w-20 last:pr-0" />
        </TableHead>
        <TableFooter>
          <TableRowLink>
            <TablePaginationWithContext colSpan={numberOfColumns} />
          </TableRowLink>
        </TableFooter>
        <TableBody>
          {renderCollection(
            getLoadableList(discountVariants),
            variant => {
              const isSelected = variant ? isChecked(variant.id) : false;

              return (
                <TableRowLink
                  hover={!!variant}
                  key={variant ? variant.id : "skeleton"}
                  href={variant && productVariantEditPath(variant.id)}
                  className="cursor-pointer"
                  selected={isSelected}
                >
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={isSelected}
                      disabled={disabled}
                      disableClickPropagation
                      onChange={() => toggle(variant.id)}
                    />
                  </TableCell>
                  <TableCellAvatar
                    className="pl-0 w-auto min-w-[200px]"
                    thumbnail={maybe(() => variant.product.thumbnail.url)}
                  >
                    {maybe<React.ReactNode>(() => variant.product.name, <Skeleton />)}
                  </TableCellAvatar>
                  <TableCell className="w-auto min-w-[150px]">
                    {maybe<React.ReactNode>(() => variant.name, <Skeleton />)}
                  </TableCell>
                  <TableCell className="w-auto min-w-[150px]">
                    {maybe<React.ReactNode>(() => variant.product.productType.name, <Skeleton />)}
                  </TableCell>
                  <TableCell className="w-20 last:pr-0">
                    <TableButtonWrapper>
                      <IconButton
                        variant="secondary"
                        disabled={!variant || disabled}
                        onClick={event => {
                          event.stopPropagation();
                          onVariantUnassign(variant.id);
                        }}
                        size="medium">
                        <Trash2 size={iconSize.small} strokeWidth={iconStrokeWidthBySize.small} />
                      </IconButton>
                    </TableButtonWrapper>
                  </TableCell>
                </TableRowLink>
              );
            },
            () => (
              <TableRowLink>
                <TableCell colSpan={numberOfColumns}>
                  <FormattedMessage {...messages.discountVariantsNotFound} />
                </TableCell>
              </TableRowLink>
            ),
          )}
        </TableBody>
      </ResponsiveTable>
    </DashboardCard>
  );
};

DiscountVariants.displayName = "DiscountVariants";
export default DiscountVariants;
