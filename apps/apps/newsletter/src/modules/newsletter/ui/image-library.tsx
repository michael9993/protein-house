import { Box, Button, Text } from "@saleor/macaw-ui";
import { useState } from "react";

import type { ImageUploadResult } from "../images/image.service";

interface ImageLibraryProps {
  images: ImageUploadResult[];
  isLoading: boolean;
  onUpload: (file: File) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onSelect: (image: ImageUploadResult) => void;
  selectedImageId?: string;
}

export const ImageLibrary = ({
  images,
  isLoading,
  onUpload,
  onDelete,
  onSelect,
  selectedImageId,
}: ImageLibraryProps) => {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this image?")) {
      return;
    }

    setDeletingId(id);
    try {
      await onDelete(id);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to delete image");
    } finally {
      setDeletingId(null);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Box>
      <Box
        display="grid"
        gap={3}
        style={{
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
        }}
      >
        {images.map((image) => (
          <Box
            key={image.id}
            padding={3}
            borderWidth={1}
            borderStyle="solid"
            borderColor={selectedImageId === image.id ? "accent1" : "default1"}
            borderRadius={2}
            position="relative"
            style={{ cursor: "pointer" }}
            onClick={() => onSelect(image)}
          >
            <Box
              backgroundColor="default1"
              borderRadius={2}
              marginBottom={2}
              display="flex"
              alignItems="center"
              justifyContent="center"
              overflow="hidden"
              style={{ width: "100%", height: "150px" }}
            >
              {image.thumbnailUrl ? (
                <img
                  src={image.thumbnailUrl}
                  alt={image.originalName}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <img
                  src={image.url}
                  alt={image.originalName}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              )}
            </Box>
            <Text size={2} fontWeight="bold" marginBottom={1} title={image.originalName}>
              {image.originalName.length > 20
                ? `${image.originalName.substring(0, 20)}...`
                : image.originalName}
            </Text>
            <Text size={1} color="default2" marginBottom={2}>
              {formatFileSize(image.size)}
            </Text>
            {image.width && image.height && (
              <Text size={1} color="default2" marginBottom={2}>
                {image.width} × {image.height}
              </Text>
            )}
            <Box display="flex" gap={2} marginTop={2}>
              <Button
                variant="tertiary"
                size="small"
                onClick={async (e) => {
                  e.stopPropagation();
                  try {
                    await navigator.clipboard.writeText(image.url);
                  } catch (error) {
                    // Fallback for browsers that block clipboard API
                    const textArea = document.createElement("textarea");
                    textArea.value = image.url;
                    textArea.style.position = "fixed";
                    textArea.style.left = "-999999px";
                    document.body.appendChild(textArea);
                    textArea.select();
                    try {
                      document.execCommand("copy");
                    } catch (err) {
                      console.error("Failed to copy URL:", err);
                    }
                    document.body.removeChild(textArea);
                  }
                }}
              >
                Copy URL
              </Button>
              <Button
                variant="tertiary"
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(image.id);
                }}
                disabled={deletingId === image.id}
              >
                {deletingId === image.id ? "Deleting..." : "Delete"}
              </Button>
            </Box>
            {image.usedInTemplates && image.usedInTemplates.length > 0 && (
              <Box marginTop={2} padding={1} backgroundColor="warning1" borderRadius={1}>
                <Text size={1} color="warningText1">
                  Used in {image.usedInTemplates.length} template(s)
                </Text>
              </Box>
            )}
          </Box>
        ))}
      </Box>

      {images.length === 0 && !isLoading && (
        <Box padding={6} textAlign="center">
          <Text color="default2">No images uploaded yet. Upload your first image to get started.</Text>
        </Box>
      )}

      {isLoading && images.length === 0 && (
        <Box padding={6} textAlign="center">
          <Text>Loading images...</Text>
        </Box>
      )}
    </Box>
  );
};
