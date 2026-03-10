import { Box, Text } from "@saleor/macaw-ui";
import { trpcClient } from "@/modules/trpc/trpc-client";
import { colors } from "@/modules/ui/app-layout";

interface TaxClassSelectProps {
  value: string;
  onChange: (id: string) => void;
  label?: string;
  maxWidth?: string;
}

export function TaxClassSelect({
  value,
  onChange,
  label = "Tax Class",
  maxWidth,
}: TaxClassSelectProps) {
  const { data, isLoading } = trpcClient.lookups.taxClasses.useQuery();

  const taxClasses = data?.taxClasses || [];

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
        <option value="">-- None (default) --</option>
        {isLoading && <option disabled>Loading tax classes...</option>}
        {taxClasses.map((tc) => (
          <option key={tc.id} value={tc.id}>
            {tc.name}
          </option>
        ))}
      </select>
    </Box>
  );
}
