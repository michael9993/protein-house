import { Box, Button, Combobox, Text } from "@saleor/macaw-ui";
import { useMemo, useState } from "react";

interface SubscriberFiltersProps {
  filters: {
    isActive?: boolean;
    source?: string;
    search?: string;
  };
  onFiltersChange: (filters: {
    isActive?: boolean;
    source?: string;
    search?: string;
  }) => void;
  availableSources: string[];
}

export const SubscriberFilters = ({
  filters,
  onFiltersChange,
  availableSources,
}: SubscriberFiltersProps) => {
  const [searchValue, setSearchValue] = useState(filters.search || "");

  const statusOptions = [
    { value: "all", label: "All" },
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
  ];

  const sourceOptions = [
    { value: "all", label: "All Sources" },
    ...availableSources.map((source) => ({
      value: source,
      label: source || "Unknown",
    })),
  ];

  const handleStatusChange = (value: string | null) => {
    const isActive =
      value === "all" ? undefined : value === "active" ? true : value === "inactive" ? false : undefined;
    onFiltersChange({ ...filters, isActive });
  };

  const handleSourceChange = (value: string | null) => {
    const source = value === "all" || !value ? undefined : value;
    onFiltersChange({ ...filters, source });
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
  };

  const handleSearchSubmit = () => {
    onFiltersChange({ ...filters, search: searchValue || undefined });
  };

  const clearFilters = () => {
    setSearchValue("");
    onFiltersChange({});
  };

  const hasActiveFilters = filters.isActive !== undefined || filters.source || filters.search;

  return (
    <Box display="flex" flexDirection={{ desktop: "row", mobile: "column" }} gap={3} flexWrap="wrap">
      <Box style={{ minWidth: "200px" }}>
        <Combobox
          label="Status"
          options={statusOptions}
          value={useMemo(() => {
            return statusOptions.find(
              (o) =>
                (filters.isActive === true && o.value === "active") ||
                (filters.isActive === false && o.value === "inactive") ||
                (filters.isActive === undefined && o.value === "all")
            ) || null;
          }, [filters.isActive])}
          onChange={(e) => handleStatusChange(e?.target?.value ?? null)}
          name="status"
        />
      </Box>

      <Box style={{ minWidth: "200px" }}>
        <Combobox
          label="Source"
          options={sourceOptions}
          value={useMemo(() => {
            return sourceOptions.find((o) => o.value === (filters.source || "all")) || null;
          }, [filters.source, availableSources])}
          onChange={(e) => handleSourceChange(e?.target?.value ?? null)}
          name="source"
        />
      </Box>

      <Box display="flex" gap={2} alignItems="flex-end" style={{ flex: 1 }}>
        <Box style={{ flex: 1 }}>
          <Text as="label" size={2} color="default2" display="block" marginBottom={1}>
            Search by email
          </Text>
          <input
            type="text"
            value={searchValue}
            onChange={handleSearchChange}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSearchSubmit();
              }
            }}
            placeholder="Enter email address..."
            style={{
              width: "100%",
              padding: "8px 12px",
              border: "1px solid #E5E7EB",
              borderRadius: "4px",
              fontSize: "14px",
            }}
          />
        </Box>
        <Button variant="secondary" onClick={handleSearchSubmit}>
          Search
        </Button>
        {hasActiveFilters && (
          <Button variant="tertiary" onClick={clearFilters}>
            Clear
          </Button>
        )}
      </Box>
    </Box>
  );
};
