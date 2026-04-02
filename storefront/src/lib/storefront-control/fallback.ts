import type { StorefrontControlConfig } from "./types";
import fs from "node:fs";
import path from "node:path";

type FallbackPayload = {
  schemaVersion: number;
  exportedAt: string;
  channels: Record<string, StorefrontControlConfig>;
};

/**
 * Try to load fallback config from bundled JSON file.
 * Falls back to null if file doesn't exist or is invalid (will use defaults).
 *
 * To use Storefront Control sample-import values as the fallback (channel/brand-appropriate):
 * Run from repo root: node storefront/scripts/build-fallback-from-samples.cjs
 * This writes storefront-cms-config.json from sample-config-import.json (ILS) and
 * sample-config-import-en.json (EN), so when there is no API the storefront still
 * gets the right defaults per channel.
 */
let fallbackPayload: FallbackPayload | null = null;
let fallbackLoadAttempted = false;

/**
 * Initialize fallback config (called once, lazy-loaded)
 * Server-side only - uses fs.readFileSync for reliability
 */
function loadFallbackConfig(): FallbackPayload | null {
  // Return cached result if already attempted
  if (fallbackLoadAttempted) {
    return fallbackPayload;
  }

  fallbackLoadAttempted = true;

  // Only load on server-side (Node.js environment)
  if (typeof window !== "undefined") {
    return null;
  }

  try {
    // Try to read the fallback file from project root
    // The file is at storefront-cms-config.json in project root
    const cwd = process.cwd();
    const possiblePaths = [
      // Current directory (storefront directory in dev mode)
      path.join(cwd, "storefront-cms-config.json"),
      // Project root (one level up from storefront)
      path.join(cwd, "..", "storefront-cms-config.json"),
      // Two levels up (if running from a subdirectory)
      path.join(cwd, "..", "..", "storefront-cms-config.json"),
      // Docker dev mode: project root is mounted at /workspace
      "/workspace/storefront-cms-config.json",
      // Relative to this file's location (for built files)
      path.join(__dirname, "..", "..", "..", "..", "storefront-cms-config.json"),
      path.join(__dirname, "..", "..", "..", "..", "..", "storefront-cms-config.json"),
      // Also check in storefront directory explicitly (for cases where file is copied there)
      path.join(cwd, "storefront", "storefront-cms-config.json"),
      path.join(cwd, "..", "storefront", "storefront-cms-config.json"),
    ];

    // Always log paths we're trying (important for debugging)
    console.log(`[fallback] 🔍 Looking for fallback config file...`);
    console.log(`[fallback]    Current working directory: ${cwd}`);
    console.log(`[fallback]    Trying ${possiblePaths.length} possible paths:`);
    possiblePaths.forEach((p, i) => {
      const exists = fs.existsSync(p);
      console.log(`[fallback]    ${i + 1}. ${p} ${exists ? "✅ EXISTS" : "❌ NOT FOUND"}`);
    });

    for (const filePath of possiblePaths) {
      try {
        if (fs.existsSync(filePath)) {
          const fileContent = fs.readFileSync(filePath, "utf-8");
          const parsed = JSON.parse(fileContent) as FallbackPayload;
          
          // Validate structure
          if (parsed && parsed.channels && typeof parsed.channels === "object" && parsed.schemaVersion) {
            fallbackPayload = parsed;
            const channelCount = Object.keys(parsed.channels).length;
            const channelNames = Object.keys(parsed.channels).join(", ");
            console.log(`[fallback] ✅ Loaded fallback config from ${filePath}`);
            console.log(`[fallback]    Channels: ${channelNames} (${channelCount} total)`);
            return fallbackPayload;
          } else {
            console.warn(`[fallback] ⚠️  Invalid config structure in ${filePath}`);
            console.warn(`[fallback]    Has channels: ${!!parsed?.channels}`);
            console.warn(`[fallback]    Has schemaVersion: ${!!parsed?.schemaVersion}`);
          }
        }
      } catch (error) {
        // Try next path
        console.error(`[fallback] ❌ Failed to load ${filePath}:`, error instanceof Error ? error.message : String(error));
        if (error instanceof Error && error.stack) {
          console.error(`[fallback]    Stack: ${error.stack}`);
        }
        continue;
      }
    }

    // If we get here, no file was found
    console.warn(`[fallback] ⚠️  Fallback config file not found in any of the ${possiblePaths.length} paths`);
  } catch (error) {
    // File doesn't exist or is invalid - that's okay, we'll use defaults
    console.error(`[fallback] ❌ Error loading fallback config:`, error instanceof Error ? error.message : String(error));
    if (error instanceof Error && error.stack) {
      console.error(`[fallback]    Stack: ${error.stack}`);
    }
  }

  return null;
}

/**
 * Read fallback config for a specific channel.
 * Returns the raw StorefrontControlConfig (needs to be mapped to StoreConfig).
 * Returns null if no fallback exists for that channel.
 */
export function readFallbackConfig(channel: string): StorefrontControlConfig | null {
  const fallback = loadFallbackConfig();
  
  if (!fallback) {
    return null;
  }

  // Try channel-specific config first
  if (fallback.channels[channel]) {
    const channelConfig = fallback.channels[channel];
    // Skip placeholder entries
    if (channelConfig && typeof channelConfig === "object" && !("note" in channelConfig)) {
      return channelConfig as StorefrontControlConfig;
    }
  }

  // Fall back to "default" channel if available
  if (fallback.channels.default) {
    const defaultConfig = fallback.channels.default;
    // Skip placeholder entries
    if (defaultConfig && typeof defaultConfig === "object" && !("note" in defaultConfig)) {
      return defaultConfig as StorefrontControlConfig;
    }
  }

  return null;
}

/**
 * Get all available channels from fallback config
 */
export function getFallbackChannels(): string[] {
  const fallback = loadFallbackConfig();
  
  if (!fallback || !fallback.channels) {
    return [];
  }

  return Object.keys(fallback.channels).filter(
    (key) => {
      const config = fallback.channels[key];
      return config && typeof config === "object" && !("note" in config);
    }
  );
}
