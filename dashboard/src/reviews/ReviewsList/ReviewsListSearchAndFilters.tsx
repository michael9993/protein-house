// @ts-strict-ignore
import { ListFilters } from "@dashboard/components/AppLayout/ListFilters";
import { BulkDeleteButton } from "@dashboard/components/BulkDeleteButton";
import DeleteFilterTabDialog from "@dashboard/components/DeleteFilterTabDialog";
import SaveFilterTabDialog from "@dashboard/components/SaveFilterTabDialog";
import { Box } from "@saleor/macaw-ui-next";
import { FormattedMessage, useIntl } from "react-intl";

import { ReviewListActionParamsEnum } from "./types";
import { useReviewListDialogs } from "../providers/ReviewListDialogsProvider";
import { useReviewList } from "../providers/ReviewListProvider";
import { messages as searchMessages } from "./messages";

const ReviewsListSearchAndFilters = () => {
  const intl = useIntl();

  const {
    params,
    handleSearchChange,
    onPresetSave,
    onPresetDelete,
    getPresetNameToDelete,
    selectedRowIds,
  } = useReviewList();
  const { onClose, openDeleteDialog } = useReviewListDialogs();

  return (
    <>
      <ListFilters
        type="expression-filter"
        initialSearch={params?.query || ""}
        onSearchChange={handleSearchChange}
        searchPlaceholder={intl.formatMessage(searchMessages.searchPlaceholder)}
        actions={
          <Box display="flex" gap={4}>
            {selectedRowIds.length > 0 && (
              <BulkDeleteButton onClick={openDeleteDialog}>
                <FormattedMessage
                  defaultMessage="Delete reviews"
                  id="reviews.bulkDelete"
                />
              </BulkDeleteButton>
            )}
          </Box>
        }
      />

      <SaveFilterTabDialog
        open={params.action === ReviewListActionParamsEnum.SAVE_SEARCH}
        confirmButtonState="default"
        onClose={onClose}
        onSubmit={onPresetSave}
      />

      <DeleteFilterTabDialog
        open={params.action === ReviewListActionParamsEnum.DELETE_SEARCH}
        confirmButtonState="default"
        onClose={onClose}
        onSubmit={onPresetDelete}
        tabName={getPresetNameToDelete()}
      />
    </>
  );
};

export default ReviewsListSearchAndFilters;

