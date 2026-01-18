import { StorefrontConfig } from "./schema";
import { CURRENT_SCHEMA_VERSION, ImportFile } from "./import-schema";

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
