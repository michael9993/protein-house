import { useEffect } from "react";
import { Box, Text } from "@saleor/macaw-ui";
import { trpcClient } from "@/modules/trpc/trpc-client";
import { colors } from "@/modules/ui/app-layout";

interface ProductTypeSelectProps {
  value: string;
  onChange: (id: string) => void;
  label?: string;
  maxWidth?: string;
}

export function ProductTypeSelect({
  value,
  onChange,
  label = "Product Type",
  maxWidth,
}: ProductTypeSelectProps) {
  const { data, isLoading } = trpcClient.lookups.productTypes.useQuery();

  const productTypes = data?.productTypes || [];

  useEffect(() => {
    if (productTypes.length > 0 && value && !productTypes.some((pt) => pt.id === value)) {
      onChange(productTypes[0].id);
    }
  }, [productTypes, value, onChange]);

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
          border: `1px solid ${colors.inputBorder}`,
          borderRadius: "6px",
          fontSize: "14px",
          backgroundColor: "#fff",
          cursor: isLoading ? "wait" : "pointer",
          appearance: "auto",
        }}
      >
        <option value="">-- Select Product Type --</option>
        {isLoading && <option disabled>Loading product types...</option>}
        {productTypes.map((pt) => (
          <option key={pt.id} value={pt.id}>
            {pt.name}
            {pt.hasVariants ? "" : " (simple)"}
            {pt.isDigital ? " [digital]" : ""}
          </option>
        ))}
      </select>
    </Box>
  );
}
