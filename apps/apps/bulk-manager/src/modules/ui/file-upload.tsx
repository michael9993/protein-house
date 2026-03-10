import { Box, Text, Button } from "@saleor/macaw-ui";
import { useCallback, useRef, useState, DragEvent } from "react";
import { colors } from "@/modules/ui/app-layout";

interface FileUploadProps {
  onFileSelected: (file: File) => void;
  accept?: string;
  maxSizeMB?: number;
}

export function FileUpload({
  onFileSelected,
  accept = ".csv,.xlsx,.xls",
  maxSizeMB = 10,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateAndSelect = useCallback(
    (file: File) => {
      setError(null);

      const maxBytes = maxSizeMB * 1024 * 1024;
      if (file.size > maxBytes) {
        setError(`File too large. Maximum size is ${maxSizeMB}MB.`);
        return;
      }

      const ext = file.name.split(".").pop()?.toLowerCase();
      if (!ext || !["csv", "xlsx", "xls"].includes(ext)) {
        setError("Invalid file type. Please upload a CSV or Excel file.");
        return;
      }

      onFileSelected(file);
    },
    [onFileSelected, maxSizeMB]
  );

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file) validateAndSelect(file);
    },
    [validateAndSelect]
  );

  const handleClick = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) validateAndSelect(file);
      // Reset input so re-selecting same file works
      if (inputRef.current) inputRef.current.value = "";
    },
    [validateAndSelect]
  );

  return (
    <Box>
      <Box
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        borderRadius={4}
        padding={10}
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        cursor="pointer"
        __border={isDragging ? `2px dashed ${colors.brand}` : `2px dashed ${colors.inputBorder}`}
        __backgroundColor={isDragging ? colors.accentSubtle : colors.surfaceAlt}
        __transition="all 0.15s ease"
        __minHeight="200px"
      >
        <Box __fontSize="48px" __color={colors.textLight} marginBottom={4}>
          +
        </Box>
        <Text size={4} __fontWeight="500" __color={colors.badgeText}>
          Drop your file here or click to browse
        </Text>
        <Text size={2} __color={colors.textLight} __marginTop="8px">
          Supports CSV and Excel (.xlsx) files up to {maxSizeMB}MB
        </Text>
      </Box>

      {error && (
        <Box
          marginTop={2}
          padding={3}
          borderRadius={4}
          __backgroundColor="rgba(239, 68, 68, 0.1)"
        >
          <Text size={2} __color="#dc2626">
            {error}
          </Text>
        </Box>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        style={{ display: "none" }}
      />
    </Box>
  );
}
