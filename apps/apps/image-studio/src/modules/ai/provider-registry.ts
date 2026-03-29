import type { AIProvider, AIModelInfo } from "./types";
import { geminiFlashProvider, imagen3Provider } from "./providers/gemini-provider";

/**
 * Discovers available AI providers based on configured environment variables.
 * Returns only providers whose API keys are set.
 *
 * Currently Google AI models only (GEMINI_API_KEY).
 * OpenAI and Stability providers exist in ./providers/ but are not registered yet.
 */
export function getAvailableProviders(): AIProvider[] {
  const providers: AIProvider[] = [];

  if (process.env.GEMINI_API_KEY) {
    providers.push(geminiFlashProvider);
    providers.push(imagen3Provider);
  }

  return providers;
}

/**
 * Get a specific provider by ID. Returns null if not available.
 */
export function getProvider(id: string): AIProvider | null {
  return getAvailableProviders().find((p) => p.id === id) ?? null;
}

/**
 * Get the default provider (first available, Gemini Flash preferred).
 */
export function getDefaultProvider(): AIProvider | null {
  const providers = getAvailableProviders();
  return providers[0] ?? null;
}

/**
 * Get serializable model info for all available providers (sent to client).
 * Strips methods and API keys — only IDs, names, and capabilities.
 */
export function getAvailableModelInfos(): AIModelInfo[] {
  return getAvailableProviders().map((p) => ({
    id: p.id,
    name: p.name,
    provider: p.provider,
    capabilities: p.capabilities,
  }));
}
