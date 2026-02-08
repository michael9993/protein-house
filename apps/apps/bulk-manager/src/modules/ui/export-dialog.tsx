import { Box, Text, Button } from "@saleor/macaw-ui";
import { useState } from "react";

interface ExportDialogProps {
  entityLabel: string;
  onExport: (format: "csv" | "xlsx") => void;
  isLoading?: boolean;
  totalCount?: number;
}

export function ExportDialog({
  entityLabel,
  onExport,
  isLoading = false,
  totalCount,
}: ExportDialogProps) {
  const [format, setFormat] = useState<"csv" | "xlsx">("xlsx");

  return (
    <Box
      borderRadius={4}
      __border="1px solid #e2e8f0"
      padding={6}
    >
      <Text variant="heading" size={4} __display="block" marginBottom={4}>
        Export {entityLabel}
      </Text>

      {totalCount !== undefined && (
        <Text size={2} __color="#64748b" __display="block" marginBottom={4}>
          {totalCount} {entityLabel.toLowerCase()} available for export
        </Text>
      )}

      <Box marginBottom={4}>
        <Text size={2} __fontWeight="500" __display="block" marginBottom={2}>
          Format
        </Text>
        <Box display="flex" gap={3}>
          <Box
            padding={3}
            borderRadius={4}
            cursor="pointer"
            onClick={() => setFormat("xlsx")}
            __border={format === "xlsx" ? "2px solid #3b82f6" : "2px solid #e5e7eb"}
            __backgroundColor={format === "xlsx" ? "rgba(59, 130, 246, 0.05)" : undefined}
            __flex="1"
            __textAlign="center"
          >
            <Text size={3} __fontWeight={format === "xlsx" ? "600" : "400"}>
              Excel (.xlsx)
            </Text>
            <Text size={1} __color="#94a3b8" __display="block">
              Formatted, multi-sheet support
            </Text>
          </Box>
          <Box
            padding={3}
            borderRadius={4}
            cursor="pointer"
            onClick={() => setFormat("csv")}
            __border={format === "csv" ? "2px solid #3b82f6" : "2px solid #e5e7eb"}
            __backgroundColor={format === "csv" ? "rgba(59, 130, 246, 0.05)" : undefined}
            __flex="1"
            __textAlign="center"
          >
            <Text size={3} __fontWeight={format === "csv" ? "600" : "400"}>
              CSV (.csv)
            </Text>
            <Text size={1} __color="#94a3b8" __display="block">
              Universal compatibility
            </Text>
          </Box>
        </Box>
      </Box>

      <Button
        onClick={() => onExport(format)}
        disabled={isLoading}
        __width="100%"
      >
        {isLoading ? "Exporting..." : `Export as ${format.toUpperCase()}`}
      </Button>
    </Box>
  );
}
