import { Box, Text } from "@saleor/macaw-ui";
import { useMemo } from "react";
import type { FieldMapping } from "../import/field-mapper";

const DYNAMIC_PREFIXES = ["attr:", "variantAttr:", "stock:"];

interface FieldMappingEditorProps {
  mappings: FieldMapping[];
  targetFields: string[];
  onChange: (mappings: FieldMapping[]) => void;
}

export function FieldMappingEditor({
  mappings,
  targetFields,
  onChange,
}: FieldMappingEditorProps) {
  const handleChange = (index: number, targetField: string) => {
    const updated = [...mappings];
    updated[index] = { ...updated[index], targetField, confidence: targetField ? 1 : 0 };
    onChange(updated);
  };

  // Collect dynamic target fields from current mappings (attr:*, variantAttr:*, stock:*)
  const allTargetFields = useMemo(() => {
    const dynamicFields = new Set<string>();
    for (const m of mappings) {
      if (m.targetField && DYNAMIC_PREFIXES.some((p) => m.targetField.startsWith(p))) {
        dynamicFields.add(m.targetField);
      }
    }
    const combined = [...targetFields];
    for (const df of dynamicFields) {
      if (!combined.includes(df)) combined.push(df);
    }
    return combined;
  }, [mappings, targetFields]);

  return (
    <Box borderRadius={4} __border="1px solid #e2e8f0" __overflow="hidden">
      {/* Header */}
      <Box
        display="flex"
        padding={3}
        __backgroundColor="#f8fafc"
        __borderBottom="2px solid #e2e8f0"
        gap={4}
      >
        <Box __flex="1">
          <Text size={1} __fontWeight="600" __color="#64748b" __textTransform="uppercase">
            Source Column
          </Text>
        </Box>
        <Box __width="40px" __textAlign="center">
          <Text size={1} __fontWeight="600" __color="#64748b">
            -&gt;
          </Text>
        </Box>
        <Box __flex="1">
          <Text size={1} __fontWeight="600" __color="#64748b" __textTransform="uppercase">
            Saleor Field
          </Text>
        </Box>
        <Box __width="60px">
          <Text size={1} __fontWeight="600" __color="#64748b" __textTransform="uppercase">
            Match
          </Text>
        </Box>
      </Box>

      {/* Mapping rows */}
      {mappings.map((mapping, idx) => {
        const isDynamic = DYNAMIC_PREFIXES.some((p) => mapping.sourceField.startsWith(p));
        return (
          <Box
            key={idx}
            display="flex"
            padding={3}
            alignItems="center"
            gap={4}
            __borderBottom="1px solid #f1f5f9"
          >
            <Box __flex="1">
              <Text size={3} __fontWeight="500">
                {mapping.sourceField}
              </Text>
              {isDynamic && (
                <Text size={1} __color="#6366f1" __display="block" __marginTop="2px">
                  dynamic column (passed through)
                </Text>
              )}
            </Box>
            <Box __width="40px" __textAlign="center">
              <Text size={2} __color="#94a3b8">
                -&gt;
              </Text>
            </Box>
            <Box __flex="1">
              <select
                value={mapping.targetField}
                onChange={(e) => handleChange(idx, e.target.value)}
                style={{
                  width: "100%",
                  padding: "6px 8px",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  fontSize: "14px",
                  backgroundColor: mapping.targetField
                    ? isDynamic ? "#eef2ff" : "#f0fdf4"
                    : "#fff",
                }}
              >
                <option value="">-- Skip --</option>
                {allTargetFields.map((field) => (
                  <option key={field} value={field}>
                    {field}
                  </option>
                ))}
              </select>
            </Box>
            <Box __width="60px">
              {mapping.confidence > 0 && (
                <Text
                  size={1}
                  __color={mapping.confidence >= 0.8 ? "#16a34a" : "#f59e0b"}
                  __fontWeight="500"
                >
                  {Math.round(mapping.confidence * 100)}%
                </Text>
              )}
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}
