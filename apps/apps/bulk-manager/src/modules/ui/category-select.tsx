import { useEffect } from "react";
import { Box, Text } from "@saleor/macaw-ui";
import { trpcClient } from "@/modules/trpc/trpc-client";

interface CategorySelectProps {
  value: string;
  onChange: (id: string) => void;
  label?: string;
  maxWidth?: string;
}

export function CategorySelect({
  value,
  onChange,
  label = "Category",
  maxWidth,
}: CategorySelectProps) {
  const { data, isLoading } = trpcClient.lookups.categories.useQuery();

  const categories = data?.categories || [];

  useEffect(() => {
    if (categories.length > 0 && value && !categories.some((c) => c.id === value)) {
      onChange(categories[0].id);
    }
  }, [categories, value, onChange]);

  return (
    <Box __flex="1" __minWidth="200px" __maxWidth={maxWidth}>
      <Text size={2} __fontWeight="500" __display="block" marginBottom={1}>
        {label}
      </Text>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={isLoading}
        style={{
          width: "100%",
          padding: "8px 12px",
          border: "1px solid #d1d5db",
          borderRadius: "6px",
          fontSize: "14px",
          backgroundColor: "#fff",
          cursor: isLoading ? "wait" : "pointer",
          appearance: "auto",
        }}
      >
        <option value="">-- Select Category --</option>
        {isLoading && <option disabled>Loading categories...</option>}
        {categories.map((cat) => (
          <option key={cat.id} value={cat.id}>
            {cat.level > 0 ? "\u00A0\u00A0".repeat(cat.level) + "└ " : ""}
            {cat.name}
            {cat.parentName ? ` (in ${cat.parentName})` : ""}
          </option>
        ))}
      </select>
    </Box>
  );
}
