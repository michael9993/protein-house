import { NextRequest, NextResponse } from "next/server";
import { fetchStorefrontConfig, refreshConfig } from "@/lib/storefront-control/fetch-config";

/**
 * Client-side API endpoint to fetch fresh config for a channel.
 * 
 * GET /api/config/[channel]?force=true
 * 
 * This allows client components to fetch the latest config without
 * requiring a full page refresh. Used for real-time config updates.
 * 
 * Query params:
 * - force: If true, bypasses cache and fetches fresh config from storefront-control
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ channel: string }> }
) {
  try {
    const { channel } = await params;
    const { searchParams } = new URL(request.url);
    const force = searchParams.get('force') === 'true';
    
    if (!channel) {
      return NextResponse.json(
        { ok: false, error: "Missing channel parameter" },
        { status: 400 }
      );
    }

    let config;
    
    if (force) {
      // Force refresh from storefront-control app
      const refreshed = await refreshConfig(channel);
      if (refreshed) {
        config = refreshed;
      } else {
        // Fallback to cached config if refresh fails
        config = await fetchStorefrontConfig(channel);
      }
    } else {
      // Use cached config (fast)
      config = await fetchStorefrontConfig(channel);
    }

    return NextResponse.json({
      ok: true,
      channel,
      config,
      version: (config as any).version,
      updatedAt: (config as any).updatedAt,
    });
  } catch (error) {
    console.error("[api/config] Error fetching config:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to fetch config" },
      { status: 500 }
    );
  }
}
