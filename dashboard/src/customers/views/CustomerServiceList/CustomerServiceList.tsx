import ActionDialog from "@dashboard/components/ActionDialog";
import useAppChannel from "@dashboard/components/AppLayout/AppChannelContext";
import DeleteFilterTabDialog from "@dashboard/components/DeleteFilterTabDialog";
import SaveFilterTabDialog from "@dashboard/components/SaveFilterTabDialog";
import { WindowTitle } from "@dashboard/components/WindowTitle";
import { useContactSubmissionBulkDeleteMutation, useContactSubmissionListQuery } from "@dashboard/graphql";
import { useFilterPresets } from "@dashboard/hooks/useFilterPresets";
import useListSettings from "@dashboard/hooks/useListSettings";
import useNavigator from "@dashboard/hooks/useNavigator";
import useNotifier from "@dashboard/hooks/useNotifier";
import { usePaginationReset } from "@dashboard/hooks/usePaginationReset";
import usePaginator, {
  createPaginationState,
  PaginatorContext,
} from "@dashboard/hooks/usePaginator";
import { useRowSelection } from "@dashboard/hooks/useRowSelection";
import { commonMessages, sectionNames } from "@dashboard/intl";
import { ListViews } from "@dashboard/types";
import createDialogActionHandlers from "@dashboard/utils/handlers/dialogActionHandlers";
import createFilterHandlers from "@dashboard/utils/handlers/filterHandlers";
import createSortHandler from "@dashboard/utils/handlers/sortHandler";
import { mapEdgesToItems } from "@dashboard/utils/maps";
import { getSortParams } from "@dashboard/utils/sort";
import isEqual from "lodash/isEqual";
import { useCallback, useMemo } from "react";
import { FormattedMessage, useIntl } from "react-intl";

import CustomerServiceListPage from "../../components/CustomerServiceListPage";
import { customerServiceListUrl, CustomerServiceListUrlDialog, CustomerServiceListUrlQueryParams } from "../../urls";
import { getFilterOpts, getFilterQueryParam, getFilterVariables, storageUtils } from "./filters";
import { getSortQueryVariables } from "./sort";

interface CustomerServiceListProps {
  params: CustomerServiceListUrlQueryParams;
}

const CustomerServiceList = ({ params }: CustomerServiceListProps) => {
  const navigate = useNavigator();
  const notify = useNotifier();
  const intl = useIntl();
  const { updateListSettings, settings } = useListSettings(ListViews.CUSTOMER_LIST);
  const { channel } = useAppChannel();
  
  usePaginationReset(customerServiceListUrl, params, settings.rowNumber);

  const {
    clearRowSelection,
    selectedRowIds,
    setClearDatagridRowSelectionCallback,
    setSelectedRowIds,
  } = useRowSelection(params);
  const {
    selectedPreset,
    presets,
    hasPresetsChanged,
    onPresetChange,
    onPresetDelete,
    onPresetSave,
    onPresetUpdate,
    setPresetIdToDelete,
    getPresetNameToDelete,
  } = useFilterPresets({
    params,
    reset: clearRowSelection,
    getUrl: customerServiceListUrl,
    storageUtils,
  });
  const paginationState = createPaginationState(settings.rowNumber, params);
  const newQueryVariables = useMemo(
    () => ({
      ...paginationState,
      filter: getFilterVariables(params, channel?.slug),
      sort: getSortQueryVariables(params),
      search: params.query,
    }),
    [params, settings.rowNumber, channel?.slug],
  );

  const { data, refetch } = useContactSubmissionListQuery({
    displayLoader: true,
    variables: newQueryVariables,
  });
  const submissions = mapEdgesToItems(data?.contactSubmissions);
  const [changeFilters, resetFilters, handleSearchChange] = createFilterHandlers({
    cleanupFn: clearRowSelection,
    createUrl: customerServiceListUrl,
    getFilterQueryParam,
    navigate,
    params,
    keepActiveTab: true,
  });
  const [openModal, closeModal] = createDialogActionHandlers<
    CustomerServiceListUrlDialog,
    CustomerServiceListUrlQueryParams
  >(navigate, customerServiceListUrl, params);
  const paginationValues = usePaginator({
    pageInfo: data?.contactSubmissions?.pageInfo,
    paginationState,
    queryString: params,
  });
  const [bulkDeleteSubmissions, bulkDeleteSubmissionsOpts] = useContactSubmissionBulkDeleteMutation({
    onCompleted: data => {
      if (data.contactSubmissionBulkDelete?.errors.length === 0) {
        notify({
          status: "success",
          text: intl.formatMessage(commonMessages.savedChanges),
        });
        refetch();
        clearRowSelection();
        closeModal();
      }
    },
  });
  const handleSort = createSortHandler(navigate, customerServiceListUrl, params);
  const handleSetSelectedSubmissionIds = useCallback(
    (rows: number[], clearSelection: () => void) => {
      if (!submissions) {
        return;
      }

      const rowsIds = rows.map(row => submissions[row]?.id).filter(id => id !== undefined);
      const haveSaveValues = isEqual(rowsIds, selectedRowIds);

      if (!haveSaveValues) {
        setSelectedRowIds(rowsIds);
      }

      setClearDatagridRowSelectionCallback(clearSelection);
    },
    [submissions, selectedRowIds, setClearDatagridRowSelectionCallback, setSelectedRowIds],
  );

  return (
    <PaginatorContext.Provider value={paginationValues}>
      <WindowTitle title={intl.formatMessage(sectionNames.contactSubmissions)} />
      <CustomerServiceListPage
        selectedFilterPreset={selectedPreset}
        filterOpts={getFilterOpts(params)}
        initialSearch={params.query || ""}
        onSearchChange={handleSearchChange}
        onFilterChange={changeFilters}
        onFilterPresetsAll={resetFilters}
        onFilterPresetChange={onPresetChange}
        onFilterPresetDelete={(id: number) => {
          setPresetIdToDelete(id);
          openModal("delete-search");
        }}
        onFilterPresetPresetSave={() => openModal("save-search")}
        onFilterPresetUpdate={onPresetUpdate}
        filterPresets={presets.map(preset => preset.name)}
        submissions={submissions}
        settings={settings}
        disabled={!data}
        loading={!data}
        onUpdateListSettings={updateListSettings}
        onSort={handleSort}
        selectedSubmissionIds={selectedRowIds}
        onSelectSubmissionIds={handleSetSelectedSubmissionIds}
        sort={getSortParams(params)}
        hasPresetsChanged={hasPresetsChanged}
        onSubmissionsDelete={() => openModal("remove", { ids: selectedRowIds })}
      />
      <ActionDialog
        open={params.action === "remove" && selectedRowIds?.length > 0}
        onClose={closeModal}
        confirmButtonState={bulkDeleteSubmissionsOpts.status}
        onConfirm={() =>
          bulkDeleteSubmissions({
            variables: {
              ids: selectedRowIds,
            },
          })
        }
        variant="delete"
        title={intl.formatMessage({
          id: "xY8pL2",
          defaultMessage: "Delete Contact Submissions",
          description: "dialog header",
        })}
      >
        <FormattedMessage
          id="mN9qK3"
          defaultMessage="{counter,plural,one{Are you sure you want to delete this submission?} other{Are you sure you want to delete {displayQuantity} submissions?}}"
          values={{
            counter: selectedRowIds?.length,
            displayQuantity: <strong>{selectedRowIds?.length}</strong>,
          }}
        />
      </ActionDialog>
      <SaveFilterTabDialog
        open={params.action === "save-search"}
        confirmButtonState="default"
        onClose={closeModal}
        onSubmit={onPresetSave}
      />
      <DeleteFilterTabDialog
        open={params.action === "delete-search"}
        confirmButtonState="default"
        onClose={closeModal}
        onSubmit={onPresetDelete}
        tabName={getPresetNameToDelete()}
      />
    </PaginatorContext.Provider>
  );
};

export default CustomerServiceList;
