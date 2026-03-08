/**
 * HTTP client for Nano Banana (Google Gemini) — AI background generation.
 * Uses GEMINI_API_KEY environment variable.
 *
 * Free tier: 50 requests/day via Google AI Studio (no credit card).
 * Paid: ~$0.02/image (Nano Banana) or ~$0.134/image (Nano Banana Pro / 1K-2K).
 * Get API key at https://aistudio.google.com/apikey
 */

const GEMINI_MODEL = "gemini-2.5-flash-image";

function getGeminiUrl(apiKey: string) {
  return `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;
}

interface GeminiPart {
  text?: string;
  inlineData?: {
    mimeType: string;
    data: string;
  };
}

export interface GenerateResult {
  success: boolean;
  resultBase64?: string;
  error?: string;
}

/**
 * Generate an image from a text prompt using Nano Banana (Gemini 2.5 Flash Image).
 */
export async function generateImage(
  prompt: string,
  _width: number = 1024,
  _height: number = 1024,
): Promise<GenerateResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return { success: false, error: "GEMINI_API_KEY not configured. Get one at https://aistudio.google.com/apikey" };
  }

  try {
    const response = await fetch(getGeminiUrl(apiKey), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `Generate a high-quality e-commerce product background image: ${prompt}. The image should be clean, professional, and suitable for product photography.`,
              },
            ],
          },
        ],
        generationConfig: {
          responseModalities: ["Image"],
        },
      }),
      signal: AbortSignal.timeout(60000),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      return { success: false, error: `Gemini API error: HTTP ${response.status} - ${text.substring(0, 200)}` };
    }

    const result = await response.json();

    // Find the image part in the response
    const parts = result.candidates?.[0]?.content?.parts;
    if (!parts || !Array.isArray(parts)) {
      return { success: false, error: "No content in Gemini response" };
    }

    const imagePart = parts.find(
      (p: GeminiPart) => p.inlineData?.mimeType?.startsWith("image/")
    );

    if (!imagePart?.inlineData?.data) {
      return { success: false, error: "No image data in Gemini response" };
    }

    const mimeType = imagePart.inlineData.mimeType || "image/png";
    return {
      success: true,
      resultBase64: `data:${mimeType};base64,${imagePart.inlineData.data}`,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: `Gemini failed: ${msg}` };
  }
}

/**
 * Edit an existing image using a text instruction via Gemini (image-to-image).
 * Sends both the image and the prompt, returns the edited image.
 */
export async function editImage(
  imageBase64: string,
  prompt: string,
): Promise<GenerateResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return { success: false, error: "GEMINI_API_KEY not configured. Get one at https://aistudio.google.com/apikey" };
  }

  try {
    // Strip data URL prefix if present
    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    const mimeMatch = imageBase64.match(/^data:(image\/\w+);base64,/);
    const inputMimeType = mimeMatch?.[1] || "image/png";

    const response = await fetch(getGeminiUrl(apiKey), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                inlineData: {
                  mimeType: inputMimeType,
                  data: cleanBase64,
                },
              },
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          responseModalities: ["Image"],
        },
      }),
      signal: AbortSignal.timeout(90000), // 90s for image editing
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      return { success: false, error: `Gemini API error: HTTP ${response.status} - ${text.substring(0, 200)}` };
    }

    const result = await response.json();

    const parts = result.candidates?.[0]?.content?.parts;
    if (!parts || !Array.isArray(parts)) {
      return { success: false, error: "No content in Gemini response" };
    }

    const imagePart = parts.find(
      (p: GeminiPart) => p.inlineData?.mimeType?.startsWith("image/")
    );

    if (!imagePart?.inlineData?.data) {
      return { success: false, error: "No image data in Gemini response" };
    }

    const outMimeType = imagePart.inlineData.mimeType || "image/png";
    return {
      success: true,
      resultBase64: `data:${outMimeType};base64,${imagePart.inlineData.data}`,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: `Gemini edit failed: ${msg}` };
  }
}

/**
 * Check if Gemini API key is configured.
 */
export function isGenerationConfigured(): boolean {
  return !!process.env.GEMINI_API_KEY;
}
