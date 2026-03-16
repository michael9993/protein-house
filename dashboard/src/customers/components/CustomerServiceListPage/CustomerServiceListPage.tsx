// @ts-strict-ignore
import { ListFilters } from "@dashboard/components/AppLayout/ListFilters";
import { TopNav } from "@dashboard/components/AppLayout/TopNav";
import { BulkDeleteButton } from "@dashboard/components/BulkDeleteButton";
import { FilterPresetsSelect } from "@dashboard/components/FilterPresetsSelect";
import { ContactSubmissions } from "@dashboard/customers/components/CustomerServiceListDatagrid";
import { createFilterStructure } from "./filters";
import { useUserPermissions } from "@dashboard/auth/hooks/useUserPermissions";
import { customerServiceUrl, CustomerServiceListUrlSortField } from "@dashboard/customers/urls";
import useNavigator from "@dashboard/hooks/useNavigator";
import { sectionNames } from "@dashboard/intl";
import { FilterPagePropsWithPresets, PageListProps, SortPage } from "@dashboard/types";
import { Box } from "@saleor/macaw-ui-next";
import { ChevronRight } from "lucide-react";
import { useState } from "react";
import { useIntl } from "react-intl";

import { CustomerServiceListDatagrid } from "../CustomerServiceListDatagrid/CustomerServiceListDatagrid";
import { CustomerServiceFilterKeys, CustomerServiceListFilterOpts } from "./filters";

interface CustomerServiceListPageProps
  extends PageListProps,
    FilterPagePropsWithPresets<CustomerServiceFilterKeys, CustomerServiceListFilterOpts>,
    SortPage<CustomerServiceListUrlSortField> {
  submissions: ContactSubmissions | undefined;
  selectedSubmissionIds: string[];
  loading: boolean;
  onSelectSubmissionIds: (rows: number[], clearSelection: () => void) => void;
  onSubmissionsDelete: () => void;
}

const CustomerServiceListPage = ({
  selectedFilterPreset,
  initialSearch,
  onFilterPresetsAll,
  onFilterPresetDelete,
  onFilterPresetUpdate,
  onSearchChange,
  onFilterPresetChange,
  onFilterPresetPresetSave,
  filterPresets,
  selectedSubmissionIds,
  hasPresetsChanged,
  onSubmissionsDelete,
  filterOpts,
  onFilterChange,
  ...customerServiceListProps
}: CustomerServiceListPageProps) => {
  const intl = useIntl();
  const navigate = useNavigator();
  const [isFilterPresetOpen, setFilterPresetOpen] = useState(false);
  const userPermissions = useUserPermissions();
  const filterStructure = createFilterStructure(intl, filterOpts, userPermissions ?? []);

  return (
    <>
      <TopNav
        title={intl.formatMessage(sectionNames.contactSubmissions)}
        withoutBorder
        isAlignToRight={false}
      >
        <Box __flex={1} display="flex" justifyContent="space-between" alignItems="center">
          <Box display="flex">
            <Box marginX={5} display="flex" alignItems="center">
              <ChevronRight />
            </Box>
            <FilterPresetsSelect
              presetsChanged={hasPresetsChanged()}
              onSelect={onFilterPresetChange}
              onRemove={onFilterPresetDelete}
              onUpdate={onFilterPresetUpdate}
              savedPresets={filterPresets}
              activePreset={selectedFilterPreset}
              onSelectAll={onFilterPresetsAll}
              onSave={onFilterPresetPresetSave}
              isOpen={isFilterPresetOpen}
              onOpenChange={setFilterPresetOpen}
              selectAllLabel={intl.formatMessage({
                id: "D95l72",
                defaultMessage: "All submissions",
                description: "tab name",
              })}
            />
          </Box>
        </Box>
      </TopNav>
      <Box>
        <ListFilters
          type="old-filter-select"
          initialSearch={initialSearch}
          searchPlaceholder={intl.formatMessage({
            id: "kdRcqV",
            defaultMessage: "Search submissions...",
          })}
          onSearchChange={onSearchChange}
          filterStructure={filterStructure}
          onFilterChange={onFilterChange}
          actions={
            <Box display="flex" gap={4}>
              {selectedSubmissionIds.length > 0 && (
                <BulkDeleteButton onClick={onSubmissionsDelete}>
                  {intl.formatMessage({
                    id: "kFsTMN2",
                    defaultMessage: "Delete submissions",
                  })}
                </BulkDeleteButton>
              )}
            </Box>
          }
        />
        <CustomerServiceListDatagrid
          {...customerServiceListProps}
          hasRowHover={!isFilterPresetOpen}
          rowAnchor={customerServiceUrl}
          onRowClick={id => navigate(customerServiceUrl(id))}
        />
      </Box>
    </>
  );
};

CustomerServiceListPage.displayName = "CustomerServiceListPage";
export default CustomerServiceListPage;
