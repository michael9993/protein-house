import type { AIProvider, GenerateRequest, EditRequest, GenerateResult } from "../types";

async function callOpenAI(
  endpoint: string,
  body: Record<string, unknown> | FormData,
  isFormData: boolean,
  timeoutMs: number,
): Promise<GenerateResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return { success: false, error: "OPENAI_API_KEY not configured" };
  }

  try {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${apiKey}`,
    };
    if (!isFormData) {
      headers["Content-Type"] = "application/json";
    }

    const response = await fetch(`https://api.openai.com/v1/${endpoint}`, {
      method: "POST",
      headers,
      body: isFormData ? (body as FormData) : JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      return { success: false, error: `OpenAI API error: HTTP ${response.status} - ${text.substring(0, 200)}` };
    }

    const result = await response.json();
    const imageData = result.data?.[0]?.b64_json;
    if (!imageData) {
      return { success: false, error: "No image data in OpenAI response" };
    }

    return {
      success: true,
      resultBase64: `data:image/png;base64,${imageData}`,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: `OpenAI failed: ${msg}` };
  }
}

export const openaiProvider: AIProvider = {
  id: "openai-gpt-image-1",
  name: "GPT Image 1",
  provider: "openai",
  capabilities: {
    supportsThinking: false,
    supportsNegativePrompt: false,
    supportsInpainting: true,
    supportsSeed: false,
    supportsStylePresets: false,
    supportsAspectRatio: true,
    supportsStrength: false,
    maxResolution: { width: 1536, height: 1536 },
    supportedAspectRatios: ["1:1", "16:9", "9:16", "4:3", "3:4"],
  },

  async generateImage(request: GenerateRequest): Promise<GenerateResult> {
    const body: Record<string, unknown> = {
      model: "gpt-image-1",
      prompt: request.prompt,
      n: 1,
      response_format: "b64_json",
      size: "1024x1024",
    };

    // Map aspect ratio to OpenAI's supported sizes
    if (request.aspectRatio) {
      const sizeMap: Record<string, string> = {
        "1:1": "1024x1024",
        "16:9": "1536x1024",
        "9:16": "1024x1536",
        "4:3": "1024x768",
        "3:4": "768x1024",
      };
      body.size = sizeMap[request.aspectRatio] || "1024x1024";
    }

    return callOpenAI("images/generations", body, false, 60000);
  },

  async editImage(request: EditRequest): Promise<GenerateResult> {
    // OpenAI image edits use multipart form data
    const cleanBase64 = request.imageBase64.replace(/^data:image\/\w+;base64,/, "");
    const imageBuffer = Buffer.from(cleanBase64, "base64");

    const form = new FormData();
    form.append("model", "gpt-image-1");
    form.append("image", new Blob([imageBuffer], { type: "image/png" }), "image.png");
    form.append("prompt", request.prompt);
    form.append("response_format", "b64_json");

    // Add mask for inpainting
    if (request.mask && request.editType === "inpaint") {
      const cleanMask = request.mask.replace(/^data:image\/\w+;base64,/, "");
      const maskBuffer = Buffer.from(cleanMask, "base64");
      form.append("mask", new Blob([maskBuffer], { type: "image/png" }), "mask.png");
    }

    return callOpenAI("images/edits", form, true, 90000);
  },
};

/**
 * DALL-E 3 — OpenAI's dedicated image generation model.
 * Generation only (no editing/inpainting).
 */
export const dalle3Provider: AIProvider = {
  id: "openai-dall-e-3",
  name: "DALL-E 3",
  provider: "openai",
  capabilities: {
    supportsThinking: false,
    supportsNegativePrompt: false,
    supportsInpainting: false,
    supportsSeed: false,
    supportsStylePresets: true,
    supportsAspectRatio: true,
    supportsStrength: false,
    maxResolution: { width: 1792, height: 1024 },
    supportedAspectRatios: ["1:1", "16:9", "9:16"],
    supportedStylePresets: ["vivid", "natural"],
  },

  async generateImage(request: GenerateRequest): Promise<GenerateResult> {
    const body: Record<string, unknown> = {
      model: "dall-e-3",
      prompt: request.prompt,
      n: 1,
      response_format: "b64_json",
      size: "1024x1024",
    };

    if (request.aspectRatio) {
      const sizeMap: Record<string, string> = {
        "1:1": "1024x1024",
        "16:9": "1792x1024",
        "9:16": "1024x1792",
      };
      body.size = sizeMap[request.aspectRatio] || "1024x1024";
    }

    if (request.stylePreset) {
      body.style = request.stylePreset; // "vivid" or "natural"
    }

    return callOpenAI("images/generations", body, false, 60000);
  },

  async editImage(request: EditRequest): Promise<GenerateResult> {
    // DALL-E 3 doesn't support editing — fall back to GPT-Image-1
    return openaiProvider.editImage(request);
  },
};
