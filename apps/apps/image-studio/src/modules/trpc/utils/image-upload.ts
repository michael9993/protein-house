/**
 * Multipart GraphQL file upload utility for product media.
 * Adapted from bulk-manager for Image Studio.
 */

export interface ImageUploadResult {
  success: boolean;
  error?: string;
  mediaId?: string;
  mediaUrl?: string;
}

/**
 * Upload a base64-encoded image to a Saleor product via multipart file upload.
 * Uses the GraphQL multipart request spec.
 */
export async function uploadBase64ToProduct(
  base64Data: string,
  productId: string,
  alt: string,
  format: "png" | "jpeg",
  saleorApiUrl: string,
  authToken: string,
): Promise<ImageUploadResult> {
  try {
    // Strip data URL prefix if present
    const base64Clean = base64Data.replace(/^data:image\/\w+;base64,/, "");
    const binaryStr = atob(base64Clean);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }

    if (bytes.length === 0) {
      return { success: false, error: "Image data is empty" };
    }

    const mimeType = format === "png" ? "image/png" : "image/jpeg";
    const ext = format === "png" ? ".png" : ".jpg";
    const fileName = `image-studio-${Date.now()}${ext}`;

    const mutation = `mutation ProductMediaCreate($input: ProductMediaCreateInput!) {
      productMediaCreate(input: $input) {
        product { id }
        media { id url }
        errors { field code message }
      }
    }`;

    const variables = { input: { product: productId, image: null, alt } };
    const operations = JSON.stringify({ query: mutation, variables });

    const formData = new FormData();
    formData.append("operations", operations);
    formData.append("map", JSON.stringify({ "0": ["variables.input.image"] }));
    formData.append("0", new Blob([bytes], { type: mimeType }), fileName);

    const uploadResponse = await fetch(saleorApiUrl, {
      method: "POST",
      headers: { "Authorization-Bearer": authToken },
      body: formData,
      signal: AbortSignal.timeout(60000),
    });

    if (!uploadResponse.ok) {
      const body = await uploadResponse.text().catch(() => "");
      return { success: false, error: `Upload failed: HTTP ${uploadResponse.status}: ${body.substring(0, 200)}` };
    }

    const result = await uploadResponse.json();
    if (result.errors?.length > 0) {
      return { success: false, error: result.errors.map((e: any) => e.message).join("; ") };
    }

    const mutationData = result.data?.productMediaCreate;
    if (mutationData?.errors?.length > 0) {
      return {
        success: false,
        error: mutationData.errors.map((e: any) => `${e.field}: ${e.message}`).join("; "),
      };
    }

    return {
      success: true,
      mediaId: mutationData?.media?.id,
      mediaUrl: mutationData?.media?.url,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: msg };
  }
}

/**
 * Download an image from a URL and return it as base64.
 */
export async function downloadImageAsBase64(imageUrl: string): Promise<{
  success: boolean;
  base64?: string;
  mimeType?: string;
  error?: string;
}> {
  try {
    const response = await fetch(imageUrl, {
      headers: { "User-Agent": "SaleorImageStudio/1.0" },
      redirect: "follow",
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      return { success: false, error: `Download failed: HTTP ${response.status}` };
    }

    const contentType = response.headers.get("content-type") || "image/jpeg";
    const arrayBuffer = await response.arrayBuffer();
    if (arrayBuffer.byteLength === 0) {
      return { success: false, error: "Downloaded file is empty" };
    }

    const bytes = new Uint8Array(arrayBuffer);
    let binary = "";
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64 = btoa(binary);

    return {
      success: true,
      base64: `data:${contentType};base64,${base64}`,
      mimeType: contentType,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: msg };
  }
}
