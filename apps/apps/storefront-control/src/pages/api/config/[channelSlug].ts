import { NextApiRequest, NextApiResponse } from "next";

import { saleorApp } from "../../../saleor-app";
import { StorefrontConfigManager, createSettingsManager } from "../../../modules/config/config-manager";
import { getDefaultConfig } from "../../../modules/config/defaults";
import { createGraphQLClient } from "@saleor/apps-shared/create-graphql-client";

/**
 * Public API endpoint for storefront to fetch configuration.
 * No authentication required - returns config for the specified channel.
 * 
 * GET /api/config/[channelSlug]
 * 
 * Caching: 60 seconds with stale-while-revalidate
 * ETag: Supports If-None-Match for 304 Not Modified responses
 * CORS: Allows all origins (storefront may be on different domain)
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Handle OPTIONS for CORS preflight
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-saleor-api-url, If-None-Match");
    return res.status(200).end();
  }

  // Only allow GET requests
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { channelSlug } = req.query;

  if (!channelSlug || typeof channelSlug !== "string") {
    return res.status(400).json({ error: "channelSlug is required" });
  }

  // Get Saleor API URL from query param or header
  const saleorApiUrl = (req.query.saleorApiUrl as string) || (req.headers["x-saleor-api-url"] as string);

  // Helper function to create response with wrapped config
  const createResponse = (config: ReturnType<typeof getDefaultConfig>) => {
    const etag = `"${config.version}-${config.updatedAt || '0'}"`;
    res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
    res.setHeader("ETag", etag);
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-saleor-api-url, If-None-Match");

    // Check If-None-Match header for ETag validation (304 Not Modified)
    const ifNoneMatch = req.headers["if-none-match"];
    if (ifNoneMatch === etag) {
      return res.status(304).end();
    }

    return res.status(200).json({
      config,
      version: config.version,
      updatedAt: config.updatedAt || new Date().toISOString(),
    });
  };

  if (!saleorApiUrl) {
    // Return defaults if no Saleor URL provided
    const defaultConfig = getDefaultConfig(channelSlug);
    return createResponse(defaultConfig);
  }

  try {
    // Get app auth data for this Saleor instance
    const authData = await saleorApp.apl.get(saleorApiUrl);

    if (!authData) {
      // App not installed - return defaults
      const defaultConfig = getDefaultConfig(channelSlug);
      return createResponse(defaultConfig);
    }

    // Create GraphQL client with app token
    const client = createGraphQLClient({
      saleorApiUrl: authData.saleorApiUrl,
      token: authData.token,
    });

    // Create settings manager and config manager
    const settingsManager = createSettingsManager(client, authData.appId);
    const configManager = new StorefrontConfigManager(settingsManager);

    // Get config for channel (with defaults merged in)
    const config = await configManager.getForChannelWithDefaults(channelSlug);

    return createResponse(config);
  } catch (error) {
    console.error("[config API] Error fetching config:", error);
    
    // Return defaults on error
    const defaultConfig = getDefaultConfig(channelSlug);
    return createResponse(defaultConfig);
  }
}
