/**
 * Shared image download + multipart GraphQL upload utility.
 * Used by products (media), categories (background), and collections (background).
 */

export interface ImageUploadResult {
  success: boolean;
  error?: string;
  id?: string;
}

/**
 * Detect image MIME type from file magic bytes.
 * Returns null if the content doesn't match any known image signature.
 */
function detectImageMimeType(buffer: ArrayBuffer): string | null {
  const bytes = new Uint8Array(buffer.slice(0, 16));
  // PNG: 89 50 4E 47
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) return "image/png";
  // JPEG: FF D8 FF
  if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) return "image/jpeg";
  // GIF: 47 49 46 38
  if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38) return "image/gif";
  // WebP: 52 49 46 46 ... 57 45 42 50
  if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
      bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) return "image/webp";
  // BMP: 42 4D
  if (bytes[0] === 0x42 && bytes[1] === 0x4D) return "image/bmp";
  // TIFF: 49 49 2A 00 or 4D 4D 00 2A
  if ((bytes[0] === 0x49 && bytes[1] === 0x49 && bytes[2] === 0x2A && bytes[3] === 0x00) ||
      (bytes[0] === 0x4D && bytes[1] === 0x4D && bytes[2] === 0x00 && bytes[3] === 0x2A)) return "image/tiff";
  // AVIF: starts with ftyp box containing "avif"
  if (bytes[4] === 0x66 && bytes[5] === 0x74 && bytes[6] === 0x79 && bytes[7] === 0x70) return "image/avif";
  return null;
}

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": ".jpg", "image/png": ".png", "image/gif": ".gif",
  "image/webp": ".webp", "image/svg+xml": ".svg", "image/bmp": ".bmp",
  "image/tiff": ".tiff", "image/avif": ".avif",
};

/**
 * Download an image from a URL and upload it to Saleor via multipart file upload.
 * Uses the GraphQL multipart request spec since `mediaUrl` only supports oEmbed providers.
 *
 * Handles CDN URLs (e.g. CJ Dropshipping) that return non-image content-types
 * like `application/octet-stream` by detecting the actual image type from magic bytes.
 *
 * @param imageUrl - Public URL to download the image from
 * @param saleorApiUrl - Saleor GraphQL API endpoint
 * @param authToken - App auth token
 * @param mutation - Full GraphQL mutation string (must have a file variable set to null)
 * @param variables - Mutation variables (with file placeholder set to null)
 * @param fileMapPath - JSON path to the file variable, e.g. "variables.input.image"
 * @param resultPath - Dot-separated path to the mutation result, e.g. "productMediaCreate"
 */
export async function downloadAndUploadImage(
  imageUrl: string,
  saleorApiUrl: string,
  authToken: string,
  mutation: string,
  variables: Record<string, any>,
  fileMapPath: string,
  resultPath: string,
): Promise<ImageUploadResult> {
  try {
    const response = await fetch(imageUrl, {
      headers: { "User-Agent": "SaleorBulkManager/1.0" },
      redirect: "follow",
      signal: AbortSignal.timeout(30000),
    });
    if (!response.ok) {
      return { success: false, error: `Download failed: HTTP ${response.status}` };
    }

    const rawContentType = (response.headers.get("content-type") || "").split(";")[0].trim();
    const arrayBuffer = await response.arrayBuffer();
    if (arrayBuffer.byteLength === 0) {
      return { success: false, error: "Downloaded file is empty" };
    }

    // Determine the actual image MIME type:
    // 1. Trust the server content-type if it's a known image type
    // 2. Otherwise detect from magic bytes (handles CDNs returning application/octet-stream)
    // 3. Fall back to image/jpeg as last resort
    let mimeType = MIME_TO_EXT[rawContentType] ? rawContentType : null;
    if (!mimeType) {
      mimeType = detectImageMimeType(arrayBuffer) || "image/jpeg";
    }
    const ext = MIME_TO_EXT[mimeType] || ".jpg";
    const fileName = `import-${Date.now()}-${Math.random().toString(36).slice(2, 6)}${ext}`;

    const operations = JSON.stringify({ query: mutation, variables });
    const formData = new FormData();
    formData.append("operations", operations);
    formData.append("map", JSON.stringify({ "0": [fileMapPath] }));
    formData.append("0", new Blob([arrayBuffer], { type: mimeType }), fileName);

    const uploadResponse = await fetch(saleorApiUrl, {
      method: "POST",
      headers: { "Authorization-Bearer": authToken },
      body: formData,
      signal: AbortSignal.timeout(60000),
    });

    if (!uploadResponse.ok) {
      const body = await uploadResponse.text().catch(() => "");
      return { success: false, error: `Upload HTTP ${uploadResponse.status}: ${body.substring(0, 200)}` };
    }

    const result = await uploadResponse.json();
    if (result.errors?.length > 0) {
      return { success: false, error: result.errors.map((e: any) => e.message).join("; ") };
    }

    // Navigate to the mutation result via resultPath
    const mutationData = resultPath.split(".").reduce((obj: any, key) => obj?.[key], result.data);
    if (mutationData?.errors?.length > 0) {
      return { success: false, error: mutationData.errors.map((e: any) => `${e.field}: ${e.message}`).join("; ") };
    }

    const id = mutationData?.media?.id || mutationData?.category?.id || mutationData?.collection?.id;
    return { success: true, id };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: msg };
  }
}

/**
 * Upload a product media image (convenience wrapper).
 */
export function uploadProductImage(
  imageUrl: string,
  productId: string,
  alt: string,
  saleorApiUrl: string,
  authToken: string,
): Promise<ImageUploadResult> {
  return downloadAndUploadImage(
    imageUrl, saleorApiUrl, authToken,
    `mutation ProductMediaCreate($input: ProductMediaCreateInput!) {
      productMediaCreate(input: $input) {
        product { id }
        media { id url }
        errors { field code message }
      }
    }`,
    { input: { product: productId, image: null, alt } },
    "variables.input.image",
    "productMediaCreate",
  );
}

/**
 * Upload a category background image (convenience wrapper).
 */
export function uploadCategoryBackgroundImage(
  imageUrl: string,
  categoryId: string,
  alt: string,
  saleorApiUrl: string,
  authToken: string,
): Promise<ImageUploadResult> {
  return downloadAndUploadImage(
    imageUrl, saleorApiUrl, authToken,
    `mutation CategoryUpdate($id: ID!, $input: CategoryInput!) {
      categoryUpdate(id: $id, input: $input) {
        category { id backgroundImage { url } }
        errors { field code message }
      }
    }`,
    { id: categoryId, input: { backgroundImage: null, backgroundImageAlt: alt } },
    "variables.input.backgroundImage",
    "categoryUpdate",
  );
}

/**
 * Upload a collection background image (convenience wrapper).
 */
export function uploadCollectionBackgroundImage(
  imageUrl: string,
  collectionId: string,
  alt: string,
  saleorApiUrl: string,
  authToken: string,
): Promise<ImageUploadResult> {
  return downloadAndUploadImage(
    imageUrl, saleorApiUrl, authToken,
    `mutation CollectionUpdate($id: ID!, $input: CollectionInput!) {
      collectionUpdate(id: $id, input: $input) {
        collection { id backgroundImage { url } }
        errors { field code message }
      }
    }`,
    { id: collectionId, input: { backgroundImage: null, backgroundImageAlt: alt } },
    "variables.input.backgroundImage",
    "collectionUpdate",
  );
}
