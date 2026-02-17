// @ts-strict-ignore
import { DashboardCard } from "@dashboard/components/Card";
import Checkbox from "@dashboard/components/Checkbox";
import IconButtonTableCell from "@dashboard/components/IconButtonTableCell";
import { iconSize, iconStrokeWidthBySize } from "@dashboard/components/icons";
import ResponsiveTable from "@dashboard/components/ResponsiveTable";
import { TableButtonWrapper } from "@dashboard/components/TableButtonWrapper/TableButtonWrapper";
import TableCellHeader from "@dashboard/components/TableCellHeader";
import TableHead from "@dashboard/components/TableHead";
import { TablePaginationWithContext } from "@dashboard/components/TablePagination";
import TableRowLink from "@dashboard/components/TableRowLink";
import { MenuFragment } from "@dashboard/graphql";
import { maybe, renderCollection } from "@dashboard/misc";
import { MenuListUrlSortField, menuUrl } from "@dashboard/structures/urls";
import { ListActions, ListProps, SortPage } from "@dashboard/types";
import { getArrowDirection } from "@dashboard/utils/sort";
import { TableBody, TableCell, TableFooter } from "@mui/material";
import { Skeleton } from "@saleor/macaw-ui-next";
import { Trash2 } from "lucide-react";
import { FormattedMessage } from "react-intl";

interface MenuListProps extends ListProps, ListActions, SortPage<MenuListUrlSortField> {
  menus: MenuFragment[];
  onDelete: (id: string) => void;
}

const numberOfColumns = 4;
const MenuList = (props: MenuListProps) => {
  const {
    settings,
    disabled,
    isChecked,
    menus,
    onDelete,
    onUpdateListSettings,
    onSort,
    selected,
    sort,
    toggle,
    toggleAll,
    toolbar,
  } = props;

  return (
    <DashboardCard>
      <ResponsiveTable>
        <TableHead
          colSpan={numberOfColumns}
          selected={selected}
          disabled={disabled}
          items={menus}
          toggleAll={toggleAll}
          toolbar={toolbar}
        >
          <TableCellHeader
            direction={
              sort.sort === MenuListUrlSortField.name ? getArrowDirection(sort.asc) : undefined
            }
            arrowPosition="right"
            onClick={() => onSort(MenuListUrlSortField.name)}
            className="pl-0"
          >
            <FormattedMessage id="qL9Oi9" defaultMessage="Structure Title" />
          </TableCellHeader>
          <TableCellHeader
            direction={
              sort.sort === MenuListUrlSortField.items ? getArrowDirection(sort.asc) : undefined
            }
            textAlign="right"
            onClick={() => onSort(MenuListUrlSortField.items)}
            className="text-right lg:w-[200px]"
          >
            <FormattedMessage
              id="U86VKF"
              defaultMessage="Items"
              description="number of structures"
            />
          </TableCellHeader>
          <TableCell className="w-[84px]" />
        </TableHead>
        <TableFooter>
          <TableRowLink>
            <TablePaginationWithContext
              colSpan={numberOfColumns}
              settings={settings}
              onUpdateListSettings={onUpdateListSettings}
            />
          </TableRowLink>
        </TableFooter>
        <TableBody data-test-id="navigation-menu-list">
          {renderCollection(
            menus,
            menu => {
              const isSelected = menu ? isChecked(menu.id) : false;

              return (
                <TableRowLink
                  data-test-id="navigation-menu"
                  hover={!!menu}
                  key={menu ? menu.id : "skeleton"}
                  href={menu && menuUrl(menu.id)}
                  className="cursor-pointer"
                  selected={isSelected}
                >
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={isSelected}
                      disabled={disabled}
                      disableClickPropagation
                      onChange={() => toggle(menu.id)}
                    />
                  </TableCell>
                  <TableCell className="pl-0" data-test-id="menu-name">
                    {maybe<React.ReactNode>(() => menu.name, <Skeleton />)}
                  </TableCell>
                  <TableCell className="text-right lg:w-[200px]">
                    {maybe<React.ReactNode>(() => menu.items.length, <Skeleton />)}
                  </TableCell>
                  <TableButtonWrapper>
                    <IconButtonTableCell
                      className="w-[84px]"
                      disabled={disabled}
                      onClick={() => onDelete(menu.id)}
                    >
                      <Trash2 size={iconSize.small} strokeWidth={iconStrokeWidthBySize.small} />
                    </IconButtonTableCell>
                  </TableButtonWrapper>
                </TableRowLink>
              );
            },
            () => (
              <TableRowLink>
                <TableCell colSpan={numberOfColumns}>
                  <FormattedMessage id="xrF9JK" defaultMessage="No structures found" />
                </TableCell>
              </TableRowLink>
            ),
          )}
        </TableBody>
      </ResponsiveTable>
    </DashboardCard>
  );
};

MenuList.displayName = "MenuList";
export default MenuList;
