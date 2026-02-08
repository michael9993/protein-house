import { Box, Text } from "@saleor/macaw-ui";
import { useState } from "react";

interface ErrorRow {
  row: number;
  valid: boolean;
  errors: { field: string; message: string }[];
  data: Record<string, string>;
}

interface ErrorReportProps {
  errors: ErrorRow[];
  maxVisible?: number;
}

export function ErrorReport({ errors, maxVisible = 10 }: ErrorReportProps) {
  const [expanded, setExpanded] = useState(false);

  const displayErrors = expanded ? errors : errors.slice(0, maxVisible);

  if (errors.length === 0) return null;

  return (
    <Box borderRadius={4} __border="1px solid #fecaca" __overflow="hidden">
      <Box
        padding={3}
        __backgroundColor="rgba(239, 68, 68, 0.1)"
        __borderBottom="1px solid #fecaca"
      >
        <Text size={3} __fontWeight="600" __color="#dc2626">
          {errors.length} Error{errors.length !== 1 ? "s" : ""} Found
        </Text>
      </Box>

      {displayErrors.map((err, idx) => (
        <Box
          key={idx}
          padding={3}
          __borderBottom="1px solid #fef2f2"
          display="flex"
          gap={3}
          alignItems="flex-start"
        >
          <Box
            __minWidth="50px"
            __padding="2px 8px"
            borderRadius={4}
            __backgroundColor="#fef2f2"
            __textAlign="center"
          >
            <Text size={1} __fontWeight="600" __color="#dc2626">
              Row {err.row}
            </Text>
          </Box>
          <Box __flex="1">
            {err.errors.map((e, eIdx) => (
              <Box key={eIdx}>
                <Text size={2} __color="#991b1b">
                  {e.field ? `${e.field}: ` : ""}
                  {e.message}
                </Text>
              </Box>
            ))}
          </Box>
        </Box>
      ))}

      {errors.length > maxVisible && (
        <Box
          padding={3}
          __textAlign="center"
          cursor="pointer"
          onClick={() => setExpanded(!expanded)}
          __backgroundColor="#fefce8"
        >
          <Text size={2} __color="#b45309" __fontWeight="500">
            {expanded
              ? "Show less"
              : `Show ${errors.length - maxVisible} more errors`}
          </Text>
        </Box>
      )}
    </Box>
  );
}
