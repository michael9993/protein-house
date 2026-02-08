import { useEffect } from "react";
import { Box, Text } from "@saleor/macaw-ui";
import { trpcClient } from "@/modules/trpc/trpc-client";

interface WarehouseSelectProps {
  value: string;
  onChange: (id: string) => void;
  label?: string;
  maxWidth?: string;
}

export function WarehouseSelect({
  value,
  onChange,
  label = "Warehouse",
  maxWidth,
}: WarehouseSelectProps) {
  const { data, isLoading } = trpcClient.lookups.warehouses.useQuery();

  const warehouses = data?.warehouses || [];

  useEffect(() => {
    if (warehouses.length > 0 && !value) {
      onChange(warehouses[0].id);
    }
  }, [warehouses, value, onChange]);

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
        <option value="">-- Select Warehouse --</option>
        {isLoading && <option disabled>Loading warehouses...</option>}
        {warehouses.map((wh) => (
          <option key={wh.id} value={wh.id}>
            {wh.name}
          </option>
        ))}
      </select>
    </Box>
  );
}
