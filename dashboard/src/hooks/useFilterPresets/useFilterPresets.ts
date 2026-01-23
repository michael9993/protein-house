import { SaveFilterTabDialogFormData } from "@dashboard/components/SaveFilterTabDialog";
import useNavigator from "@dashboard/hooks/useNavigator";
import {
  getActiveTabIndexAfterTabDelete,
  getNextUniqueTabName,
} from "@dashboard/products/views/ProductList/utils";
import { GetFilterTabsOutput, StorageUtils } from "@dashboard/utils/filters";
import { prepareQs } from "@dashboard/utils/filters/qs";
import { stringify } from "qs";
import { useState } from "react";

export interface UseFilterPresets {
  presetIdToDelete: number | null;
  setPresetIdToDelete: React.Dispatch<React.SetStateAction<number | null>>;
  presets: GetFilterTabsOutput<string>;
  selectedPreset: number | undefined;
  onPresetChange: (index: number) => void;
  onPresetDelete: () => void;
  onPresetSave: (data: SaveFilterTabDialogFormData) => void;
  onPresetUpdate: (tabName: string) => void;
  getPresetNameToDelete: () => string;
  hasPresetsChanged: () => boolean;
}

export const useFilterPresets = <T extends { activeTab?: string; action?: string }>({
  params,
  reset,
  storageUtils,
  getUrl,
}: {
  params: T;
  reset?: () => void;
  getUrl: () => string;
  storageUtils: StorageUtils<string>;
}): UseFilterPresets => {
  const navigate = useNavigator();
  const baseUrl = getUrl();
  const [presetIdToDelete, setPresetIdToDelete] = useState<number | null>(null);
  const presets = storageUtils.getFilterTabs();
  const selectedPreset =
    params.activeTab !== undefined && typeof params.activeTab === "string"
      ? (() => {
          const parsed = parseInt(params.activeTab, 10);
          // Return undefined if parsing failed (NaN) or if value is 0 or negative
          return isNaN(parsed) || parsed <= 0 ? undefined : parsed;
        })()
      : undefined;
  const onPresetChange = (index: number) => {
    reset?.();

    const currentPresets = storageUtils.getFilterTabs();
    const presetData = currentPresets[index - 1]?.data ?? "";
    
    // Parse the preset's query string and add activeTab
    const { parsedQs } = prepareQs(presetData ? `?${presetData}` : "");
    const updatedParams = {
      ...parsedQs,
      activeTab: index.toString(),
    };
    
    // Remove action param when switching presets
    delete updatedParams.action;
    
    const queryString = stringify(updatedParams);
    navigate(queryString ? `${baseUrl}?${queryString}` : baseUrl);
  };
  const onPresetDelete = () => {
    if (!presetIdToDelete) {
      return;
    }

    storageUtils.deleteFilterTab(presetIdToDelete);
    reset?.();

    // When deleting the current tab, navigate to the All products
    if (presetIdToDelete === selectedPreset || !selectedPreset) {
      navigate(baseUrl);
    } else {
      const currentParams = { ...params };

      // When deleting a tab that is not the current one, only remove the action param from the query
      delete currentParams.action;
      // When deleting a tab that is before the current one, decrease the activeTab param by 1
      currentParams.activeTab = getActiveTabIndexAfterTabDelete(selectedPreset, presetIdToDelete);
      navigate(
        baseUrl.endsWith("?")
          ? baseUrl + stringify(currentParams)
          : baseUrl + "?" + stringify(currentParams),
      );
    }
  };
  const onPresetSave = (data: SaveFilterTabDialogFormData) => {
    const { parsedQs } = prepareQs(location.search);

    storageUtils.saveFilterTab(
      getNextUniqueTabName(
        data.name,
        presets.map(tab => tab.name),
      ),
      stringify(parsedQs),
    );
    onPresetChange(presets.length + 1);
  };
  const onPresetUpdate = (tabName: string) => {
    const { parsedQs } = prepareQs(location.search);

    storageUtils.updateFilterTab(tabName, stringify(parsedQs));
    onPresetChange(presets.findIndex(tab => tab.name === tabName) + 1);
  };
  const hasPresetsChanged = () => {
    const { parsedQs } = prepareQs(location.search);

    if (!selectedPreset) {
      return location.search !== "" && stringify(parsedQs) !== "";
    }

    const activeTab = presets[selectedPreset - 1];

    return (
      activeTab?.data !== stringify(parsedQs) &&
      location.search !== "" &&
      stringify(parsedQs) !== ""
    );
  };
  const getPresetNameToDelete = (): string => {
    const presetIndex = presetIdToDelete ? presetIdToDelete - 1 : 0;
    const preset = presets?.[presetIndex];

    return preset?.name ?? "...";
  };

  return {
    presetIdToDelete,
    setPresetIdToDelete,
    getPresetNameToDelete,
    presets,
    selectedPreset,
    onPresetChange,
    onPresetDelete,
    onPresetSave,
    onPresetUpdate,
    hasPresetsChanged,
  };
};
