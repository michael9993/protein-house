import { useContextualLink } from "@dashboard/components/AppLayout/ContextualLinks/useContextualLink";
import { TopNav } from "@dashboard/components/AppLayout/TopNav";
import { FilterPresetsSelect } from "@dashboard/components/FilterPresetsSelect";
import useNavigator from "@dashboard/hooks/useNavigator";
import { sectionNames } from "@dashboard/intl";
import { Box } from "@saleor/macaw-ui-next";
import { ChevronRight } from "lucide-react";
import { useIntl } from "react-intl";

import { useReviewList } from "../providers/ReviewListProvider";
import { useReviewListDialogs } from "../providers/ReviewListDialogsProvider";

const ReviewsListHeader = () => {
  const intl = useIntl();
  const subtitle = useContextualLink("reviews");

  const {
    hasPresetsChanged,
    selectedPreset,
    presets,
    onPresetUpdate,
    setPresetIdToDelete,
    onPresetChange,
    resetFilters,
    isFilterPresetOpen,
    setFilterPresetOpen,
  } = useReviewList();
  const { openSearchDeleteDialog, openSearchSaveDialog } = useReviewListDialogs();

  return (
    <TopNav
      withoutBorder
      isAlignToRight={false}
      title={intl.formatMessage(sectionNames.reviews)}
      subtitle={subtitle}
    >
      <Box __flex={1} display="flex" justifyContent="space-between" alignItems="center">
        <Box display="flex">
          <Box marginX={3} display="flex" alignItems="center">
            <ChevronRight />
          </Box>

          <FilterPresetsSelect
            presetsChanged={hasPresetsChanged()}
            onSelect={onPresetChange}
            onRemove={(id: number) => {
              setPresetIdToDelete(id);
              openSearchDeleteDialog();
            }}
            onUpdate={onPresetUpdate}
            savedPresets={presets.map(preset => preset.name)}
            activePreset={selectedPreset}
            onSelectAll={resetFilters}
            onSave={openSearchSaveDialog}
            isOpen={isFilterPresetOpen}
            onOpenChange={setFilterPresetOpen}
            selectAllLabel={intl.formatMessage({
              id: "reviews.selectAll",
              defaultMessage: "All reviews",
              description: "tab name",
            })}
          />
        </Box>
      </Box>
    </TopNav>
  );
};

export default ReviewsListHeader;

