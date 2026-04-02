import fs from "node:fs";
import path from "node:path";
import type { StoreConfig } from "@/config/store.config";
import type { StorefrontControlConfig } from "./types";

/**
 * Update the fallback config file (storefront-cms-config.json) with new config for a channel.
 * 
 * This is called when config changes via webhook to keep the fallback file in sync.
 * The file is used for cold starts and offline scenarios.
 * 
 * Note: We fetch the config from the control app API instead of converting StoreConfig
 * back to StorefrontControlConfig, as the conversion is complex and error-prone.
 */
export async function updateFallbackConfigFile(
  channelSlug: string,
  config: StoreConfig
): Promise<void> {
  try {
    // Find the fallback config file
    const possiblePaths = [
      path.join(process.cwd(), "storefront-cms-config.json"),
      path.join(process.cwd(), "..", "storefront-cms-config.json"),
      path.join(process.cwd(), "..", "..", "storefront-cms-config.json"),
      "/workspace/storefront-cms-config.json", // Docker dev mode
    ];

    let filePath: string | null = null;
    for (const possiblePath of possiblePaths) {
      if (fs.existsSync(possiblePath)) {
        filePath = possiblePath;
        break;
      }
    }

    if (!filePath) {
      console.warn(`[fallback-updater] ⚠️  Fallback config file not found, skipping update`);
      return;
    }

    // Fetch fresh config from control app API (in StorefrontControlConfig format)
    // This is more reliable than trying to reverse-map StoreConfig
    const isServerSide = typeof window === "undefined";
    const internalUrl = process.env.STOREFRONT_CONTROL_APP_INTERNAL_URL || "http://saleor-storefront-control-app:3000";
    const saleorApiUrl = process.env.NEXT_PUBLIC_SALEOR_API_URL || process.env.SALEOR_API_URL;
    
    if (!isServerSide) {
      // Client-side: skip file update (file system not accessible)
      console.log(`[fallback-updater] ℹ️  Client-side update skipped (file system not accessible)`);
      return;
    }

    const configUrl = `${internalUrl}/api/config/${channelSlug}${saleorApiUrl ? `?saleorApiUrl=${encodeURIComponent(saleorApiUrl)}` : ""}`;
    
    const response = await fetch(configUrl, {
      headers: {
        "Content-Type": "application/json",
        ...(saleorApiUrl && { "x-saleor-api-url": saleorApiUrl }),
      },
      cache: "no-store",
    });

    if (!response.ok) {
      console.error(`[fallback-updater] ❌ Failed to fetch config from control app: HTTP ${response.status}`);
      return;
    }

    const payload = (await response.json()) as {
      config: StorefrontControlConfig;
      version?: number;
      updatedAt?: string;
    };

    if (!payload?.config) {
      console.error(`[fallback-updater] ❌ Invalid response format from control app`);
      return;
    }

    // Read existing file
    const rawContent = fs.readFileSync(filePath, "utf-8");
    const filePayload = JSON.parse(rawContent) as {
      schemaVersion?: number;
      exportedAt?: string;
      channels: Record<string, StorefrontControlConfig>;
    };

    // Update the channel config with the fresh config from control app
    filePayload.channels[channelSlug] = payload.config;
    filePayload.exportedAt = new Date().toISOString();

    // Write back to file
    fs.writeFileSync(filePath, JSON.stringify(filePayload, null, 2));

    console.log(`[fallback-updater] ✅ Updated fallback config file for channel "${channelSlug}"`);
  } catch (error) {
    console.error(`[fallback-updater] ❌ Error updating fallback config file:`, error);
    // Don't throw - this is a background operation and shouldn't break the webhook
  }
}
