#!/usr/bin/env node

/**
 * Build-time script to fetch storefront configuration from Storefront Control app
 * and generate a fallback JSON file for cold starts/offline scenarios.
 * 
 * URL Priority (for tunneling support):
 *   1. STOREFRONT_CONTROL_APP_TUNNEL_URL (tunnel URL - prioritized for CI/CD and external builds)
 *   2. STOREFRONT_CONTROL_APP_URL (public URL)
 *   3. STOREFRONT_CONTROL_URL (generic URL)
 *   4. STOREFRONT_CONTROL_APP_INTERNAL_URL (internal Docker network URL)
 *   5. Default: http://aura-storefront-control-app:3000
 * 
 * Usage:
 *   STOREFRONT_CONTROL_APP_TUNNEL_URL=https://your-tunnel-url.com \
 *   SALEOR_API_URL=https://your-saleor.example.com/graphql/ \
 *   STOREFRONT_CHANNELS=default,ils,usd \
 *   node scripts/fetch-storefront-config.ts
 * 
 * Output: storefront/storefront-cms-config.json
 */

import fs from "node:fs";
import path from "node:path";

// Prioritize tunnel URL (public) over internal URL for build-time fetching
// Tunnel URL is needed when building from outside Docker network (CI/CD, local builds)
const CONTROL_URL = 
  process.env.STOREFRONT_CONTROL_APP_TUNNEL_URL || 
  process.env.STOREFRONT_CONTROL_APP_URL || 
  process.env.STOREFRONT_CONTROL_URL || 
  process.env.STOREFRONT_CONTROL_APP_INTERNAL_URL || 
  "http://aura-storefront-control-app:3000";
const SALEOR_API_URL = process.env.SALEOR_API_URL || process.env.NEXT_PUBLIC_SALEOR_API_URL;
const CHANNELS = (process.env.STOREFRONT_CHANNELS || "default").split(",").map((s) => s.trim());

if (!SALEOR_API_URL) {
  console.error("Error: SALEOR_API_URL environment variable is required");
  console.error("Set it to your Saleor GraphQL API URL (e.g., https://your-saleor.example.com/graphql/)");
  process.exit(1);
}

interface StorefrontControlResponse {
  config: unknown;
  version?: number;
  updatedAt?: string;
}

async function fetchChannel(channel: string): Promise<unknown> {
  const url = `${CONTROL_URL}/api/config/${channel}${SALEOR_API_URL ? `?saleorApiUrl=${encodeURIComponent(SALEOR_API_URL)}` : ""}`;
  
  console.log(`[fetch-storefront-config] Fetching config for channel: ${channel}`);
  console.log(`[fetch-storefront-config] URL: ${url.replace(SALEOR_API_URL || "", "[REDACTED]")}`);
  
  try {
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...(SALEOR_API_URL && { "x-saleor-api-url": SALEOR_API_URL }),
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = (await response.json()) as StorefrontControlResponse;
    
    if (!data?.config) {
      throw new Error("Invalid response: missing config");
    }

    console.log(`[fetch-storefront-config] ✅ Successfully fetched config for ${channel}`);
    return data.config;
  } catch (error) {
    console.error(`[fetch-storefront-config] ❌ Failed to fetch config for ${channel}:`, error);
    throw error;
  }
}

async function run() {
  console.log("[fetch-storefront-config] Starting build-time config fetch...");
  console.log(`[fetch-storefront-config] Channels: ${CHANNELS.join(", ")}`);
  console.log(`[fetch-storefront-config] Control URL: ${CONTROL_URL}`);
  if (CONTROL_URL.includes("tunnel") || CONTROL_URL.startsWith("https://")) {
    console.log("[fetch-storefront-config] ℹ️  Using tunnel/public URL for config fetch");
  } else {
    console.log("[fetch-storefront-config] ℹ️  Using internal Docker network URL");
  }
  
  const channels: Record<string, unknown> = {};
  const errors: string[] = [];

  for (const channel of CHANNELS) {
    try {
      channels[channel] = await fetchChannel(channel);
    } catch (error) {
      errors.push(`${channel}: ${error instanceof Error ? error.message : String(error)}`);
      // Continue with other channels even if one fails
    }
  }

  if (Object.keys(channels).length === 0) {
    console.error("[fetch-storefront-config] ❌ Failed to fetch config for any channel");
    if (errors.length > 0) {
      console.error("[fetch-storefront-config] Errors:", errors);
    }
    process.exit(1);
  }

  const payload = {
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    channels,
  };

  const filePath = path.join(process.cwd(), "storefront", "storefront-cms-config.json");
  fs.writeFileSync(filePath, JSON.stringify(payload, null, 2));

  console.log(`[fetch-storefront-config] ✅ Successfully generated ${filePath}`);
  console.log(`[fetch-storefront-config] Channels exported: ${Object.keys(channels).join(", ")}`);
  
  if (errors.length > 0) {
    console.warn(`[fetch-storefront-config] ⚠️  Some channels failed: ${errors.join("; ")}`);
    console.warn(`[fetch-storefront-config] Continuing with successfully fetched channels...`);
  }
}

run().catch((error) => {
  console.error("[fetch-storefront-config] Fatal error:", error);
  process.exit(1);
});
