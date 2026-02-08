import { Box, Text } from "@saleor/macaw-ui";
import type { RowValidationResult } from "../import/validator";

interface DataPreviewProps {
  rows: Record<string, string>[];
  headers: string[];
  validationResults?: RowValidationResult[];
  maxRows?: number;
}

export function DataPreview({
  rows,
  headers,
  validationResults,
  maxRows = 20,
}: DataPreviewProps) {
  const displayRows = rows.slice(0, maxRows);

  return (
    <Box __overflowX="auto" borderRadius={4} __border="1px solid #e2e8f0">
      <Box __minWidth="100%" __display="table" __borderCollapse="collapse">
        {/* Header row */}
        <Box __display="table-header-group" __backgroundColor="#f8fafc">
          <Box __display="table-row">
            {validationResults && (
              <Box
                __display="table-cell"
                padding={3}
                __borderBottom="2px solid #e2e8f0"
                __fontWeight="600"
                __fontSize="12px"
                __color="#64748b"
                __textTransform="uppercase"
                __width="40px"
              >
                <Text size={1}>Status</Text>
              </Box>
            )}
            <Box
              __display="table-cell"
              padding={3}
              __borderBottom="2px solid #e2e8f0"
              __fontWeight="600"
              __fontSize="12px"
              __color="#64748b"
              __width="40px"
            >
              <Text size={1}>#</Text>
            </Box>
            {headers.map((header) => (
              <Box
                key={header}
                __display="table-cell"
                padding={3}
                __borderBottom="2px solid #e2e8f0"
                __fontWeight="600"
                __fontSize="12px"
                __color="#64748b"
                __textTransform="uppercase"
                __whiteSpace="nowrap"
              >
                <Text size={1}>{header}</Text>
              </Box>
            ))}
          </Box>
        </Box>

        {/* Data rows */}
        <Box __display="table-row-group">
          {displayRows.map((row, idx) => {
            const validation = validationResults?.[idx];
            const isValid = validation ? validation.valid : undefined;

            return (
              <Box
                key={idx}
                __display="table-row"
                __backgroundColor={
                  isValid === false
                    ? "rgba(239, 68, 68, 0.05)"
                    : isValid === true
                      ? "rgba(34, 197, 94, 0.03)"
                      : undefined
                }
              >
                {validationResults && (
                  <Box
                    __display="table-cell"
                    padding={2}
                    __borderBottom="1px solid #f1f5f9"
                    __textAlign="center"
                  >
                    <Text size={2}>
                      {isValid === true ? "OK" : isValid === false ? "ERR" : "-"}
                    </Text>
                  </Box>
                )}
                <Box
                  __display="table-cell"
                  padding={2}
                  __borderBottom="1px solid #f1f5f9"
                  __color="#94a3b8"
                >
                  <Text size={2}>{idx + 1}</Text>
                </Box>
                {headers.map((header) => (
                  <Box
                    key={header}
                    __display="table-cell"
                    padding={2}
                    __borderBottom="1px solid #f1f5f9"
                    __maxWidth="200px"
                    __overflow="hidden"
                    __textOverflow="ellipsis"
                    __whiteSpace="nowrap"
                  >
                    <Text size={2}>{row[header] || ""}</Text>
                  </Box>
                ))}
              </Box>
            );
          })}
        </Box>
      </Box>

      {rows.length > maxRows && (
        <Box padding={3} __backgroundColor="#f8fafc" __textAlign="center">
          <Text size={2} __color="#94a3b8">
            Showing {maxRows} of {rows.length} rows
          </Text>
        </Box>
      )}
    </Box>
  );
}
