/**
 * Backward-compatible wrapper around the multi-provider AI system.
 * Delegates to gemini-provider.ts. Kept for existing imports.
 *
 * @deprecated Use provider-registry.ts and the AIProvider interface instead.
 */

import { geminiFlashProvider } from "./providers/gemini-provider";
import type { GenerateResult } from "./types";

export type { GenerateResult };

export async function generateImage(
  prompt: string,
  width: number = 1024,
  height: number = 1024,
): Promise<GenerateResult> {
  return geminiFlashProvider.generateImage({ prompt, width, height });
}

export async function editImage(
  imageBase64: string,
  prompt: string,
): Promise<GenerateResult> {
  return geminiFlashProvider.editImage({ imageBase64, prompt });
}

export function isGenerationConfigured(): boolean {
  return !!process.env.GEMINI_API_KEY;
}
