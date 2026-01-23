import { ColumnPicker } from "@dashboard/components/Datagrid/ColumnPicker/ColumnPicker";
import { useColumns } from "@dashboard/components/Datagrid/ColumnPicker/useColumns";
import Datagrid from "@dashboard/components/Datagrid/Datagrid";
import {
  DatagridChangeStateContext,
  useDatagridChangeState,
} from "@dashboard/components/Datagrid/hooks/useDatagridChange";
import { TablePaginationWithContext } from "@dashboard/components/TablePagination";
import { getPrevLocationState } from "@dashboard/hooks/useBackLinkWithState";
import { CustomerServiceListUrlSortField } from "@dashboard/customers/urls";
import { ListProps, SortPage } from "@dashboard/types";
import { Item } from "@glideapps/glide-data-grid";
import { Box } from "@saleor/macaw-ui-next";
import { useCallback, useMemo } from "react";
import { useIntl } from "react-intl";
import { useLocation } from "react-router";

import { createGetCellContent, customerServiceListStaticColumnsAdapter, ContactSubmissions } from "./datagrid";

interface CustomerServiceListDatagridProps extends ListProps, SortPage<CustomerServiceListUrlSortField> {
  submissions: ContactSubmissions | undefined;
  loading: boolean;
  hasRowHover?: boolean;
  onSelectSubmissionIds: (rowsIndex: number[], clearSelection: () => void) => void;
  onRowClick: (id: string) => void;
  rowAnchor?: (id: string) => string;
}

export const CustomerServiceListDatagrid = ({
  submissions,
  sort,
  loading,
  settings,
  onUpdateListSettings,
  hasRowHover,
  onRowClick,
  rowAnchor,
  disabled,
  onSelectSubmissionIds,
  onSort,
}: CustomerServiceListDatagridProps) => {
  const intl = useIntl();
  const location = useLocation();
  const datagrid = useDatagridChangeState();
  const customerServiceListStaticColumns = useMemo(
    () => customerServiceListStaticColumnsAdapter(intl, sort),
    [intl, sort],
  );
  const onColumnChange = useCallback(
    (picked: string[]) => {
      if (onUpdateListSettings) {
        onUpdateListSettings("columns", picked.filter(Boolean));
      }
    },
    [onUpdateListSettings],
  );
  const { handlers, visibleColumns, staticColumns, selectedColumns, recentlyAddedColumn } =
    useColumns({
      gridName: "customer_service_list",
      staticColumns: customerServiceListStaticColumns,
      selectedColumns: settings?.columns ?? [],
      onSave: onColumnChange,
    });
  const getCellContent = useCallback(
    createGetCellContent({
      submissions,
      columns: visibleColumns,
      intl,
    }),
    [submissions, visibleColumns, intl],
  );
  const handleRowClick = useCallback(
    ([_, row]: Item) => {
      if (!onRowClick || !submissions) {
        return;
      }

      const rowData = submissions[row];

      onRowClick(rowData.id);
    },
    [onRowClick, submissions],
  );
  const handleRowAnchor = useCallback(
    ([, row]: Item) => {
      if (!rowAnchor || !submissions) {
        return "";
      }

      const rowData = submissions[row];

      return rowAnchor(rowData.id);
    },
    [rowAnchor, submissions],
  );
  const handleHeaderClick = useCallback(
    (col: number) => {
      const columnName = visibleColumns[col]?.id as CustomerServiceListUrlSortField;

      if (columnName && onSort) {
        onSort(columnName);
      }
    },
    [visibleColumns, onSort],
  );

  return (
    <DatagridChangeStateContext.Provider value={datagrid}>
      <Datagrid
        readonly
        loading={loading}
        rowMarkers="checkbox-visible"
        columnSelect="single"
        availableColumns={visibleColumns}
        onColumnMoved={handlers.onMove}
        onColumnResize={handlers.onResize}
        verticalBorder={false}
        recentlyAddedColumn={recentlyAddedColumn}
        emptyText={intl.formatMessage({
          id: "xY9pM3",
          defaultMessage: "No contact submissions found",
        })}
        getCellContent={getCellContent}
        getCellError={() => false}
        selectionActions={() => null}
        menuItems={() => []}
        rows={submissions?.length ?? 0}
        onRowSelectionChange={onSelectSubmissionIds}
        rowAnchor={handleRowAnchor}
        onRowClick={handleRowClick}
        hasRowHover={hasRowHover}
        onHeaderClicked={handleHeaderClick}
        renderColumnPicker={() => (
          <ColumnPicker
            staticColumns={staticColumns}
            selectedColumns={selectedColumns}
            onToggle={handlers.onToggle}
          />
        )}
        navigatorOpts={{ state: getPrevLocationState(location) }}
      />
      <Box paddingX={6}>
        <TablePaginationWithContext
          component="div"
          settings={settings}
          disabled={disabled}
          onUpdateListSettings={onUpdateListSettings}
        />
      </Box>
    </DatagridChangeStateContext.Provider>
  );
};
