/**
 * Multi-provider AI system types.
 * Abstracts image generation/editing across Gemini, OpenAI, and Stability AI.
 */

export interface AICapabilities {
  supportsThinking: boolean;
  supportsNegativePrompt: boolean;
  supportsInpainting: boolean;
  supportsSeed: boolean;
  supportsStylePresets: boolean;
  supportsAspectRatio: boolean;
  supportsStrength: boolean;
  maxResolution: { width: number; height: number };
  supportedAspectRatios?: string[];
  supportedStylePresets?: string[];
}

export interface GenerateRequest {
  prompt: string;
  negativePrompt?: string;
  width?: number;
  height?: number;
  aspectRatio?: string;
  seed?: number;
  stylePreset?: string;
  thinkingLevel?: ThinkingLevel;
}

export interface EditRequest extends GenerateRequest {
  imageBase64: string;
  mask?: string;
  editType?: "general" | "inpaint" | "style-transfer";
  /** 0.0 = faithful to input, 1.0 = fully reimagined. Used for sketch-to-realistic. */
  strength?: number;
}

export interface GenerateResult {
  success: boolean;
  resultBase64?: string;
  error?: string;
}

export type ThinkingLevel = "none" | "low" | "medium" | "high";

export type ProviderType = "gemini" | "openai" | "stability";

export interface AIProvider {
  id: string;
  name: string;
  provider: ProviderType;
  capabilities: AICapabilities;
  generateImage(request: GenerateRequest): Promise<GenerateResult>;
  editImage(request: EditRequest): Promise<GenerateResult>;
}

/** Serializable model info returned to the client (no methods, no API keys). */
export interface AIModelInfo {
  id: string;
  name: string;
  provider: ProviderType;
  capabilities: AICapabilities;
}
