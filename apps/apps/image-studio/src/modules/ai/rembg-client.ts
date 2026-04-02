/**
 * HTTP client for the rembg Docker container (background removal).
 * Expects the container at REMBG_URL (default: http://aura-rembg:7000).
 */

const REMBG_URL = process.env.REMBG_URL || "http://aura-rembg:7000";

export interface RembgResult {
  success: boolean;
  resultBase64?: string;
  error?: string;
}

/**
 * Remove background from a base64-encoded image.
 * Sends the image to rembg server and returns a transparent PNG.
 */
export async function removeBackground(imageBase64: string): Promise<RembgResult> {
  try {
    // Strip data URL prefix if present
    const base64Clean = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Clean, "base64");

    // rembg expects multipart form with a "file" field
    const formData = new FormData();
    formData.append("file", new Blob([buffer], { type: "image/png" }), "image.png");

    const response = await fetch(`${REMBG_URL}/api/remove`, {
      method: "POST",
      body: formData,
      signal: AbortSignal.timeout(60000), // 60s timeout for CPU processing
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      return { success: false, error: `rembg error: HTTP ${response.status} - ${text.substring(0, 200)}` };
    }

    const resultBuffer = await response.arrayBuffer();
    const resultBase64 = `data:image/png;base64,${Buffer.from(resultBuffer).toString("base64")}`;

    return { success: true, resultBase64 };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: `rembg failed: ${msg}` };
  }
}

/**
 * Check if the rembg service is healthy.
 */
export async function checkRembgHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${REMBG_URL}/api/remove`, {
      method: "GET",
      signal: AbortSignal.timeout(5000),
    });
    // rembg returns 405 or 422 for GET (it expects POST with file), but that means it's running
    return response.status === 405 || response.status === 422 || response.ok;
  } catch {
    return false;
  }
}
