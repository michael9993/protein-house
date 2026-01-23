import { Box, Button, Text } from "@saleor/macaw-ui";
import { useCallback, useState } from "react";

interface ImageUploadProps {
  onUpload: (file: File) => Promise<void>;
  maxSize?: number; // in bytes
  allowedTypes?: string[];
  multiple?: boolean;
}

export const ImageUpload = ({
  onUpload,
  maxSize = 5 * 1024 * 1024, // 5MB default
  allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"],
  multiple = false,
}: ImageUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateFile = (file: File): string | null => {
    // Check file type
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      return `Invalid file type: ${file.type}. Allowed types: ${allowedTypes.join(", ")}`;
    }

    // Check file size
    if (file.size > maxSize) {
      const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(0);
      return `File size exceeds limit: ${(file.size / (1024 * 1024)).toFixed(2)}MB. Maximum: ${maxSizeMB}MB`;
    }

    return null;
  };

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }

      setIsUploading(true);
      try {
        await onUpload(file);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to upload image");
      } finally {
        setIsUploading(false);
      }
    },
    [onUpload, maxSize, allowedTypes]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        handleFile(files[0]); // Handle first file only for now
      }
    },
    [handleFile]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        handleFile(files[0]);
      }
      // Reset input
      e.target.value = "";
    },
    [handleFile]
  );

  return (
    <Box>
      <Box
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        padding={6}
        borderRadius={2}
        backgroundColor={isDragging ? "default1" : "transparent"}
        textAlign="center"
        style={{
          cursor: "pointer",
          border: "2px dashed",
          borderColor: isDragging ? "var(--color-accent-1)" : "var(--color-default-1)",
        }}
      >
        <input
          type="file"
          accept={allowedTypes.join(",")}
          multiple={multiple}
          onChange={handleFileInput}
          disabled={isUploading}
          style={{ display: "none" }}
          id="image-upload-input"
        />
        <label htmlFor="image-upload-input" style={{ cursor: "pointer", display: "block" }}>
          {isUploading ? (
            <Text>Uploading...</Text>
          ) : (
            <>
              <Text size={5} marginBottom={2} display="block">
                {isDragging ? "Drop image here" : "Drag & drop image here or click to select"}
              </Text>
              <Text size={2} color="default2">
                Supported: JPG, PNG, GIF, WebP (max {maxSize / (1024 * 1024)}MB)
              </Text>
            </>
          )}
        </label>
      </Box>

      {error && (
        <Box marginTop={2} padding={2} backgroundColor="critical1" borderRadius={2}>
          <Text color="critical2">{error}</Text>
        </Box>
      )}
    </Box>
  );
};
