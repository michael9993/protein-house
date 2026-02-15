/**
 * HTTP client for Real-ESRGAN Docker container (image upscaling).
 * Expects the container at ESRGAN_URL (default: http://saleor-esrgan:7001).
 */

const ESRGAN_URL = process.env.ESRGAN_URL || "http://saleor-esrgan:7001";

export interface EsrganResult {
  success: boolean;
  resultBase64?: string;
  error?: string;
}

/**
 * Upscale an image using Real-ESRGAN.
 */
export async function upscaleImage(
  imageBase64: string,
  scale: 2 | 3 | 4 = 2,
): Promise<EsrganResult> {
  try {
    const base64Clean = imageBase64.replace(/^data:image\/\w+;base64,/, "");

    const response = await fetch(`${ESRGAN_URL}/api/upscale`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: base64Clean, scale }),
      signal: AbortSignal.timeout(180000), // 3 minute timeout for CPU processing
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      return { success: false, error: `ESRGAN error: HTTP ${response.status} - ${text.substring(0, 200)}` };
    }

    const result = await response.json();
    if (!result.image) {
      return { success: false, error: "No image data in ESRGAN response" };
    }

    return { success: true, resultBase64: `data:image/png;base64,${result.image}` };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: `ESRGAN failed: ${msg}` };
  }
}

/**
 * Check if the ESRGAN service is healthy.
 */
export async function checkEsrganHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${ESRGAN_URL}/health`, {
      method: "GET",
      signal: AbortSignal.timeout(5000),
    });
    return response.ok;
  } catch {
    return false;
  }
}
