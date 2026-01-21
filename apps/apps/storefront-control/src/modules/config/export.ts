import { StorefrontConfig } from "./schema";
import { CURRENT_SCHEMA_VERSION, ImportFile } from "./import-schema";

// Lazy-load Node.js modules only when needed (server-side only)
// This prevents client-side bundling errors
// Using eval to prevent webpack from trying to bundle these modules
function getNodeModules() {
  if (typeof window !== "undefined") {
    // Client-side - return null
    return { fs: null, path: null };
  }
  
  // Server-side - try to load using eval to prevent webpack bundling
  try {
    // @ts-expect-error - Using eval to prevent webpack from bundling fs/path
    const fs = typeof require !== "undefined" ? eval('require("fs")') : null;
    // @ts-expect-error - Using eval to prevent webpack from bundling fs/path
    const path = typeof require !== "undefined" ? eval('require("path")') : null;
    return { fs, path };
  } catch {
    return { fs: null, path: null };
  }
}

/**
 * Create an export file object with metadata
 */
export function createExportFile(config: StorefrontConfig, channelSlug: string): ImportFile {
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    channelSlug,
    config,
  };
}

/**
 * Generate a filename for the exported config
 */
export function generateExportFilename(channelSlug: string): string {
  const date = new Date().toISOString().split("T")[0];
  return `storefront-config-${channelSlug}-${date}.json`;
}

/**
 * Trigger a file download in the browser
 */
export function downloadConfigFile(config: StorefrontConfig, channelSlug: string): void {
  const exportFile = createExportFile(config, channelSlug);
  const json = JSON.stringify(exportFile, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement("a");
  link.href = url;
  link.download = generateExportFilename(channelSlug);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Get the path to the sample config file for a channel
 */
function getSampleConfigFilePath(channelSlug: string): string | null {
  const { fs, path } = getNodeModules();
  if (!fs || !path) {
    console.warn(`[updateSampleConfig] Node.js modules not available (client-side or not available)`);
    return null;
  }

  const isHebrew = channelSlug.toLowerCase() === "ils" || channelSlug.toLowerCase() === "he";
  const fileName = isHebrew ? "sample-config-import.json" : "sample-config-import-en.json";

  // Try multiple possible paths (development vs production)
  const possibleRoots: string[] = [];
  
  // @ts-expect-error - process available at runtime in Node.js
  if (typeof process !== "undefined" && (process as any).cwd) {
    // @ts-expect-error
    possibleRoots.push((process as any).cwd());
  }
  
  try {
    // @ts-expect-error - __dirname might not be available in ESM
    if (typeof __dirname !== "undefined") {
      // @ts-expect-error
      possibleRoots.push(path.resolve(__dirname, "../.."));
      // @ts-expect-error
      possibleRoots.push(path.resolve(__dirname, "../../.."));
    }
  } catch {
    // Ignore if __dirname is not available
  }

  for (const root of possibleRoots) {
    const candidate = path.join(root, fileName);
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return null;
}

/**
 * Update the sample config file for a channel
 * This keeps the sample files in sync with the actual configs
 */
export function updateSampleConfigFile(config: StorefrontConfig, channelSlug: string): { success: boolean; filePath?: string; error?: string } {
  try {
    const { fs, path } = getNodeModules();
    if (!fs || !path) {
      return { success: false, error: "Node.js fs/path modules not available (must be called server-side)" };
    }

    const filePath = getSampleConfigFilePath(channelSlug);
    if (!filePath) {
      return { success: false, error: "Could not determine sample config file path" };
    }

    // Create export file format
    const exportFile = createExportFile(config, channelSlug);
    const json = JSON.stringify(exportFile, null, 2);

    // Write to file
    fs.writeFileSync(filePath, json, "utf-8");
    
    console.log(`[updateSampleConfig] ✅ Successfully updated sample config file: ${filePath}`);
    
    // Clear cache so next load gets fresh data
    try {
      // Import and clear the cache from defaults.ts
      // @ts-expect-error - Dynamic import for cache clearing
      const { clearSampleConfigCache } = require("./defaults");
      if (clearSampleConfigCache) {
        clearSampleConfigCache();
      }
    } catch {
      // Ignore cache clearing errors (module might not be available in all contexts)
    }

    return { success: true, filePath };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[updateSampleConfig] ❌ Error updating sample config file:`, error);
    return { success: false, error: errorMessage };
  }
}
