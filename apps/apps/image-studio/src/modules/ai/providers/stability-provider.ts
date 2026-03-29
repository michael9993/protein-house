import type { AIProvider, GenerateRequest, EditRequest, GenerateResult } from "../types";

const STABILITY_BASE = "https://api.stability.ai/v2beta";

const STYLE_PRESETS = [
  "3d-model", "analog-film", "anime", "cinematic", "comic-book",
  "digital-art", "enhance", "fantasy-art", "isometric", "line-art",
  "low-poly", "neon-punk", "origami", "photographic", "pixel-art",
  "tile-texture",
];

async function callStability(
  endpoint: string,
  form: FormData,
  timeoutMs: number,
): Promise<GenerateResult> {
  const apiKey = process.env.STABILITY_API_KEY;
  if (!apiKey) {
    return { success: false, error: "STABILITY_API_KEY not configured" };
  }

  try {
    const response = await fetch(`${STABILITY_BASE}/${endpoint}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/json",
      },
      body: form,
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      return { success: false, error: `Stability API error: HTTP ${response.status} - ${text.substring(0, 200)}` };
    }

    const result = await response.json();
    const imageData = result.image || result.artifacts?.[0]?.base64;
    if (!imageData) {
      return { success: false, error: "No image data in Stability response" };
    }

    return {
      success: true,
      resultBase64: `data:image/png;base64,${imageData}`,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: `Stability AI failed: ${msg}` };
  }
}

export const stabilityProvider: AIProvider = {
  id: "stability-sd3",
  name: "Stable Diffusion 3",
  provider: "stability",
  capabilities: {
    supportsThinking: false,
    supportsNegativePrompt: true,
    supportsInpainting: false,
    supportsSeed: true,
    supportsStylePresets: true,
    supportsAspectRatio: true,
    supportsStrength: true,
    maxResolution: { width: 1536, height: 1536 },
    supportedAspectRatios: ["1:1", "16:9", "9:16", "4:3", "3:4", "3:2", "2:3", "21:9", "9:21"],
    supportedStylePresets: STYLE_PRESETS,
  },

  async generateImage(request: GenerateRequest): Promise<GenerateResult> {
    const form = new FormData();
    form.append("prompt", request.prompt);
    form.append("output_format", "png");

    if (request.negativePrompt) {
      form.append("negative_prompt", request.negativePrompt);
    }
    if (request.aspectRatio) {
      form.append("aspect_ratio", request.aspectRatio);
    }
    if (request.seed !== undefined) {
      form.append("seed", String(request.seed));
    }
    if (request.stylePreset) {
      form.append("style_preset", request.stylePreset);
    }

    return callStability("stable-image/generate/sd3", form, 60000);
  },

  async editImage(request: EditRequest): Promise<GenerateResult> {
    // Stability uses search-and-replace or similar edit endpoints
    // For now, use the same generation with image-to-image via control endpoint
    const cleanBase64 = request.imageBase64.replace(/^data:image\/\w+;base64,/, "");
    const imageBuffer = Buffer.from(cleanBase64, "base64");

    const form = new FormData();
    form.append("image", new Blob([imageBuffer], { type: "image/png" }), "image.png");
    form.append("prompt", request.prompt);
    form.append("output_format", "png");
    form.append("mode", "image-to-image");
    form.append("strength", String(request.strength ?? 0.65));

    if (request.negativePrompt) {
      form.append("negative_prompt", request.negativePrompt);
    }
    if (request.seed !== undefined) {
      form.append("seed", String(request.seed));
    }

    return callStability("stable-image/generate/sd3", form, 90000);
  },
};

/**
 * Stability Ultra — highest quality, slower generation.
 * Uses the stable-image/generate/ultra endpoint.
 */
export const stabilityUltraProvider: AIProvider = {
  id: "stability-ultra",
  name: "Stable Image Ultra",
  provider: "stability",
  capabilities: {
    supportsThinking: false,
    supportsNegativePrompt: true,
    supportsInpainting: false,
    supportsSeed: true,
    supportsStylePresets: false,
    supportsAspectRatio: true,
    supportsStrength: true,
    maxResolution: { width: 1536, height: 1536 },
    supportedAspectRatios: ["1:1", "16:9", "9:16", "4:3", "3:4", "3:2", "2:3", "21:9", "9:21"],
  },

  async generateImage(request: GenerateRequest): Promise<GenerateResult> {
    const form = new FormData();
    form.append("prompt", request.prompt);
    form.append("output_format", "png");

    if (request.negativePrompt) {
      form.append("negative_prompt", request.negativePrompt);
    }
    if (request.aspectRatio) {
      form.append("aspect_ratio", request.aspectRatio);
    }
    if (request.seed !== undefined) {
      form.append("seed", String(request.seed));
    }

    return callStability("stable-image/generate/ultra", form, 90000);
  },

  async editImage(request: EditRequest): Promise<GenerateResult> {
    const cleanBase64 = request.imageBase64.replace(/^data:image\/\w+;base64,/, "");
    const imageBuffer = Buffer.from(cleanBase64, "base64");

    const form = new FormData();
    form.append("image", new Blob([imageBuffer], { type: "image/png" }), "image.png");
    form.append("prompt", request.prompt);
    form.append("output_format", "png");
    form.append("strength", String(request.strength ?? 0.65));

    if (request.negativePrompt) {
      form.append("negative_prompt", request.negativePrompt);
    }
    if (request.seed !== undefined) {
      form.append("seed", String(request.seed));
    }

    return callStability("stable-image/generate/ultra", form, 120000);
  },
};
