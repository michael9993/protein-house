import { useAppBridge } from "@saleor/app-sdk/app-bridge";
import { SALEOR_API_URL_HEADER, SALEOR_AUTHORIZATION_BEARER_HEADER } from "@saleor/app-sdk/headers";
import { Box, Text } from "@saleor/macaw-ui";
import { NextPage } from "next";
import { useCallback, useState } from "react";

import { BasicLayout } from "../components/basic-layout";
import { SectionWithDescription } from "../components/section-with-description";
import { ImageLibrary } from "../modules/newsletter/ui/image-library";
import { ImageUpload } from "../modules/newsletter/ui/image-upload";
import { trpcClient } from "../modules/trpc/trpc-client";

const ImagesPage: NextPage = () => {
  const { appBridgeState } = useAppBridge();
  const [selectedImageId, setSelectedImageId] = useState<string | undefined>();

  const { data: imagesData, isLoading: isLoadingImages, refetch } = trpcClient.image.list.useQuery(undefined, {
    enabled: !!appBridgeState?.ready,
  });

  const utils = trpcClient.useUtils();

  const handleUpload = useCallback(
    async (file: File) => {
      if (!appBridgeState?.token || !appBridgeState?.saleorApiUrl) {
        throw new Error("App Bridge not ready. Please wait for the app to initialize.");
      }

      const formData = new FormData();
      formData.append("file", file);

      try {
        const response = await fetch("/api/newsletter/images/upload", {
          method: "POST",
          body: formData,
          headers: {
            [SALEOR_AUTHORIZATION_BEARER_HEADER]: appBridgeState.token,
            [SALEOR_API_URL_HEADER]: appBridgeState.saleorApiUrl,
          },
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || error.message || "Failed to upload image");
        }

        const result = await response.json();
        
        // Refetch images list
        await utils.image.list.invalidate();
        
        return result;
      } catch (error) {
        throw error;
      }
    },
    [appBridgeState, utils]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      await trpcClient.image.delete.mutate({ id });
      await utils.image.list.invalidate();
    },
    [utils]
  );

  const handleSelect = useCallback(async (image: { id: string; url?: string }) => {
    setSelectedImageId(image.id);
    // Copy URL to clipboard
    if (image.url) {
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
    }
  }, []);

  // Wait for App Bridge to initialize
  if (!appBridgeState) {
    return null;
  }

  if (appBridgeState.user?.permissions.includes("MANAGE_APPS") === false) {
    return (
      <BasicLayout breadcrumbs={[{ name: "Images" }]}>
        <Text>You do not have permission to access this page.</Text>
      </BasicLayout>
    );
  }

  return (
    <BasicLayout breadcrumbs={[{ name: "Images" }]}>
      <Box display="grid" gridTemplateColumns={{ desktop: 3, mobile: 1 }}>
        <Box>
          <Text>Upload and manage images for use in email templates. Images are optimized and stored securely.</Text>
        </Box>
      </Box>

      <SectionWithDescription
        title="Upload Image"
        description={<Text>Upload images for use in email templates. Supported formats: JPG, PNG, GIF, WebP (max 5MB).</Text>}
      >
        <ImageUpload onUpload={handleUpload} />
      </SectionWithDescription>

      <SectionWithDescription
        title="Image Library"
        description={<Text>Manage your uploaded images. Click an image to copy its URL.</Text>}
      >
        <ImageLibrary
          images={imagesData?.images || []}
          isLoading={isLoadingImages}
          onUpload={handleUpload}
          onDelete={handleDelete}
          onSelect={handleSelect}
          selectedImageId={selectedImageId}
        />
      </SectionWithDescription>
    </BasicLayout>
  );
};

export default ImagesPage;
