import type { AIProvider, AICapabilities, GenerateRequest, EditRequest, GenerateResult, ThinkingLevel } from "../types";

const THINKING_BUDGETS: Record<ThinkingLevel, number> = {
  none: 0,
  low: 1024,
  medium: 8192,
  high: 32768,
};

interface GeminiPart {
  text?: string;
  inlineData?: { mimeType: string; data: string };
}

function buildGeminiUrl(model: string, apiKey: string) {
  return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
}

type PromptMode = "generate-bg" | "edit-full";

function buildPrompt(request: GenerateRequest, mode: PromptMode): string {
  let prompt = request.prompt;

  if (mode === "generate-bg") {
    prompt = `Generate a high-quality e-commerce product background image: ${prompt}. The image should be clean, professional, and suitable for product photography.`;
  } else if (mode === "edit-full") {
    prompt = `Completely regenerate this image as described below. Treat the input image ONLY as a layout and composition reference — do NOT preserve its style, rendering, or materials. Replace every surface, texture, color, and element with photorealistic, real-world equivalents. The output must look like a real photograph, not a render or illustration. Apply realistic lighting, shadows, reflections, depth of field, and natural imperfections.\n\nInstruction: ${prompt}`;
  }

  if (request.negativePrompt) {
    prompt += `\n\nAvoid: ${request.negativePrompt}`;
  }
  return prompt;
}

function buildGenerationConfig(request: GenerateRequest) {
  const config: Record<string, unknown> = {
    responseModalities: ["Image"],
  };
  if (request.thinkingLevel && request.thinkingLevel !== "none") {
    config.thinkingConfig = {
      thinkingBudget: THINKING_BUDGETS[request.thinkingLevel],
    };
  }
  return config;
}

async function callGemini(
  model: string,
  parts: GeminiPart[],
  generationConfig: Record<string, unknown>,
  timeoutMs: number,
): Promise<GenerateResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return { success: false, error: "GEMINI_API_KEY not configured. Get one at https://aistudio.google.com/apikey" };
  }

  try {
    const response = await fetch(buildGeminiUrl(model, apiKey), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig,
      }),
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      return { success: false, error: `Gemini API error: HTTP ${response.status} - ${text.substring(0, 200)}` };
    }

    const result = await response.json();
    const responseParts = result.candidates?.[0]?.content?.parts;
    if (!responseParts || !Array.isArray(responseParts)) {
      return { success: false, error: "No content in Gemini response" };
    }

    const imagePart = responseParts.find(
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

function createGeminiProvider(
  id: string,
  name: string,
  model: string,
  capabilities: AICapabilities,
): AIProvider {
  return {
    id,
    name,
    provider: "gemini",
    capabilities,

    async generateImage(request: GenerateRequest): Promise<GenerateResult> {
      const prompt = buildPrompt(request, "generate-bg");
      const parts: GeminiPart[] = [{ text: prompt }];
      const config = buildGenerationConfig(request);
      return callGemini(model, parts, config, 60000);
    },

    async editImage(request: EditRequest): Promise<GenerateResult> {
      const cleanBase64 = request.imageBase64.replace(/^data:image\/\w+;base64,/, "");
      const mimeMatch = request.imageBase64.match(/^data:(image\/\w+);base64,/);
      const inputMimeType = mimeMatch?.[1] || "image/png";

      // For style-transfer mode: put the text instruction FIRST, then the image.
      // This tells Gemini to treat the text as the primary directive and the image
      // as a reference — producing a much more transformative result than image-first
      // ordering which Gemini treats as "make small edits to this image."
      const isTransformative = request.editType === "style-transfer";
      const prompt = buildPrompt(request, "edit-full");

      const parts: GeminiPart[] = isTransformative
        ? [
            { text: prompt },
            { inlineData: { mimeType: inputMimeType, data: cleanBase64 } },
          ]
        : [
            { inlineData: { mimeType: inputMimeType, data: cleanBase64 } },
            { text: prompt },
          ];

      const config = buildGenerationConfig(request);
      return callGemini(model, parts, config, 90000);
    },
  };
}

export const geminiFlashProvider = createGeminiProvider(
  "gemini-flash",
  "Gemini 2.5 Flash Image",
  "gemini-2.5-flash-image",
  {
    supportsThinking: false,
    supportsNegativePrompt: true,
    supportsInpainting: false,
    supportsSeed: false,
    supportsStylePresets: false,
    supportsAspectRatio: false,
    supportsStrength: false,
    maxResolution: { width: 1440, height: 1440 },
  },
);

/**
 * Imagen 3 — Google's dedicated high-quality image generation model.
 * Uses a different API endpoint format than Gemini chat models.
 */
export const imagen3Provider: AIProvider = {
  id: "imagen-3",
  name: "Imagen 3",
  provider: "gemini",
  capabilities: {
    supportsThinking: false,
    supportsNegativePrompt: true,
    supportsInpainting: false,
    supportsSeed: true,
    supportsStylePresets: false,
    supportsAspectRatio: true,
    supportsStrength: false,
    maxResolution: { width: 1536, height: 1536 },
    supportedAspectRatios: ["1:1", "16:9", "9:16", "4:3", "3:4", "3:2", "2:3"],
  },

  async generateImage(request: GenerateRequest): Promise<GenerateResult> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return { success: false, error: "GEMINI_API_KEY not configured" };
    }

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${apiKey}`;
      const params: Record<string, unknown> = {
        sampleCount: 1,
      };
      if (request.aspectRatio) params.aspectRatio = request.aspectRatio;
      if (request.seed !== undefined) params.seed = request.seed;
      if (request.negativePrompt) params.negativePrompt = request.negativePrompt;

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instances: [{ prompt: request.prompt }],
          parameters: params,
        }),
        signal: AbortSignal.timeout(60000),
      });

      if (!response.ok) {
        const text = await response.text().catch(() => "");
        return { success: false, error: `Imagen 3 API error: HTTP ${response.status} - ${text.substring(0, 200)}` };
      }

      const result = await response.json();
      const imageData = result.predictions?.[0]?.bytesBase64Encoded;
      if (!imageData) {
        return { success: false, error: "No image data in Imagen 3 response" };
      }

      return {
        success: true,
        resultBase64: `data:image/png;base64,${imageData}`,
      };
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      return { success: false, error: `Imagen 3 failed: ${msg}` };
    }
  },

  async editImage(request: EditRequest): Promise<GenerateResult> {
    // Imagen 3 editing uses the same generation with reference image
    // Fall back to Gemini Flash for editing since Imagen 3 predict API is generation-only
    return geminiFlashProvider.editImage(request);
  },
};
