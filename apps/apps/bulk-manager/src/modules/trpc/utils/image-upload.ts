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
 * Download an image from a URL and upload it to Saleor via multipart file upload.
 * Uses the GraphQL multipart request spec since `mediaUrl` only supports oEmbed providers.
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

    const contentType = response.headers.get("content-type") || "image/jpeg";
    const arrayBuffer = await response.arrayBuffer();
    if (arrayBuffer.byteLength === 0) {
      return { success: false, error: "Downloaded file is empty" };
    }

    const extMap: Record<string, string> = {
      "image/jpeg": ".jpg", "image/png": ".png", "image/gif": ".gif",
      "image/webp": ".webp", "image/svg+xml": ".svg",
    };
    const ext = extMap[contentType.split(";")[0]] || ".jpg";
    const fileName = `import-${Date.now()}-${Math.random().toString(36).slice(2, 6)}${ext}`;

    const operations = JSON.stringify({ query: mutation, variables });
    const formData = new FormData();
    formData.append("operations", operations);
    formData.append("map", JSON.stringify({ "0": [fileMapPath] }));
    formData.append("0", new Blob([arrayBuffer], { type: contentType }), fileName);

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
