import { Box } from "@saleor/macaw-ui";
import { useState } from "react";

interface ExcludeFieldsDropdownProps {
  fields: string[];
  excludedFields: Set<string>;
  onToggle: (field: string) => void;
}

export function ExcludeFieldsDropdown({ fields, excludedFields, onToggle }: ExcludeFieldsDropdownProps) {
  const [open, setOpen] = useState(false);

  return (
    <Box __position="relative" __minWidth="220px">
      <label style={{ display: "block", fontSize: "12px", fontWeight: 500, marginBottom: "4px", color: "#475569" }}>
        Exclude fields from import
      </label>
      <Box
        cursor="pointer"
        onClick={() => setOpen(!open)}
        __border="1px solid #e2e8f0"
        __borderRadius="6px"
        __padding="6px 10px"
        __fontSize="13px"
        __backgroundColor="white"
        __minHeight="32px"
        display="flex"
        alignItems="center"
        __justifyContent="space-between"
      >
        <span style={{ color: excludedFields.size > 0 ? "#1e293b" : "#94a3b8" }}>
          {excludedFields.size > 0
            ? `${excludedFields.size} field${excludedFields.size > 1 ? "s" : ""} excluded`
            : "Select fields to skip..."}
        </span>
        <span style={{ fontSize: "10px", color: "#94a3b8" }}>&#9660;</span>
      </Box>

      {excludedFields.size > 0 && (
        <Box display="flex" __flexWrap="wrap" gap={1} marginTop={1}>
          {Array.from(excludedFields).map((field) => (
            <Box
              key={field}
              __padding="1px 8px"
              __borderRadius="4px"
              __backgroundColor="#fee2e2"
              __color="#991b1b"
              __fontSize="11px"
              cursor="pointer"
              onClick={() => onToggle(field)}
              __display="inline-flex"
              __alignItems="center"
              __gap="4px"
            >
              {field} <span style={{ fontWeight: 700 }}>&times;</span>
            </Box>
          ))}
        </Box>
      )}

      {open && (
        <Box
          __position="absolute"
          __top="100%"
          __left="0"
          __right="0"
          __zIndex="50"
          __backgroundColor="white"
          __border="1px solid #e2e8f0"
          __borderRadius="6px"
          __boxShadow="0 4px 12px rgba(0,0,0,0.1)"
          __maxHeight="240px"
          __overflowY="auto"
          marginTop={1}
        >
          {fields.map((field) => (
            <Box
              key={field}
              __padding="6px 10px"
              cursor="pointer"
              onClick={() => onToggle(field)}
              __backgroundColor={excludedFields.has(field) ? "#fef2f2" : "transparent"}
              display="flex"
              alignItems="center"
              gap={2}
            >
              <input
                type="checkbox"
                checked={excludedFields.has(field)}
                readOnly
                style={{ width: "14px", height: "14px", accentColor: "#ef4444" }}
              />
              <span style={{ fontSize: "13px", color: excludedFields.has(field) ? "#991b1b" : "#374151" }}>
                {field}
              </span>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}
