"use client";

import React from "react";
import { useStoreConfig, useFeature, useContentConfig } from "@/providers/StoreConfigProvider";

import { SectionHeader } from "./SectionHeader";
import { generateSectionBackground, generatePatternOverlay, type SectionBackgroundConfig } from "@/lib/section-backgrounds";
import Image from "next/image";

interface InstagramPost {
  id: string;
  imageUrl: string;
  caption?: string;
  permalink: string;
  timestamp?: string;
}

interface InstagramFeedProps {
  posts?: InstagramPost[];
  username?: string;
  title?: string;
  subtitle?: string;
}

/**
 * Instagram Feed Section
 * 
 * Displays Instagram posts in a grid layout.
 * Configurable via store config (homepage.sections.instagramFeed)
 * 
 * Note: This is a placeholder implementation. In production, you would:
 * 1. Use Instagram Basic Display API or Instagram Graph API
 * 2. Fetch posts server-side or via API route
 * 3. Handle authentication and token refresh
 * 
 * For now, it shows placeholder posts if username is provided.
 */
export function InstagramFeed({
  posts,
  username,
  title,
  subtitle,
}: InstagramFeedProps) {
  const { homepage, branding } = useStoreConfig();
  const content = useContentConfig();
  const isEnabled = useFeature("instagramFeed");
  const config = homepage.sections.instagramFeed;

  // Don't render if disabled
  if (!isEnabled || !config.enabled) {
    return null;
  }

  const displayUsername = username || config.username || "";
  const displayTitle = title || `Follow us @${displayUsername}`;
  const displaySubtitle = subtitle || "See what we're up to on Instagram";

  // Placeholder posts if no real posts provided
  const displayPosts: InstagramPost[] = posts || (displayUsername ? generatePlaceholderPosts(displayUsername, 8) : []);

  // Get background config
  const backgroundConfig = (config.background || { style: 'none' }) as SectionBackgroundConfig | undefined;
  const backgroundStyles = generateSectionBackground(backgroundConfig, branding);
  const patternOverlay = generatePatternOverlay(backgroundConfig, branding);

  const sectionStyles: React.CSSProperties = {
    ...backgroundStyles,
  };

  if (displayPosts.length === 0) {
    return null;
  }

  return (
    <section 
      className="premium-band py-16 sm:py-20"
      style={sectionStyles}
    >
      {/* Pattern overlay for pattern backgrounds */}
      {patternOverlay && (
        <div className="absolute inset-0" style={{ opacity: (backgroundConfig?.patternOpacity ?? 10) / 100 }}>
          <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id={patternOverlay.patternId} width="40" height="40" patternUnits="userSpaceOnUse">
                {backgroundConfig?.patternType === "grid" && (
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke={branding.colors.text} strokeWidth="1"/>
                )}
                {backgroundConfig?.patternType === "dots" && (
                  <circle cx="10" cy="10" r="1.5" fill={branding.colors.text}/>
                )}
                {backgroundConfig?.patternType === "lines" && (
                  <path d="M 0 20 L 40 20" fill="none" stroke={branding.colors.text} strokeWidth="1"/>
                )}
                {backgroundConfig?.patternType === "waves" && (
                  <>
                    <path d="M 0 30 Q 15 20, 30 30 T 60 30" fill="none" stroke={branding.colors.text} strokeWidth="1"/>
                    <path d="M 0 40 Q 15 50, 30 40 T 60 40" fill="none" stroke={branding.colors.text} strokeWidth="1"/>
                  </>
                )}
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill={`url(#${patternOverlay.patternId})`} />
          </svg>
        </div>
      )}
      <div className="premium-band-content relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <SectionHeader
          title={displayTitle}
          subtitle={displaySubtitle}
          type="instagram"
          align="center"
        />

        {/* Instagram Grid */}
        <div className="mt-12 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {displayPosts.map((post, index) => (
            <a
              key={post.id}
              href={post.permalink}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative aspect-square overflow-hidden bg-neutral-100 transition-all duration-300 hover:scale-[1.02]"
              style={{ 
                borderRadius: `var(--store-radius-sm)`,
                willChange: 'transform',
              }}
            >
              <Image
                src={post.imageUrl}
                alt={post.caption || `Instagram post ${index + 1}`}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-110"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                loading={index < 4 ? "eager" : "lazy"}
              />
              {/* Hover overlay */}
              <div 
                className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              >
                <svg 
                  className="h-8 w-8 text-white"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2.163c3.204 0 3.584 0.012 4.85 0.07 3.252 0.148 4.771 1.691 4.919 4.919 0.058 1.265 0.069 1.645 0.069 4.849 0 3.205 -0.012 3.584 -0.069 4.849 -0.149 3.225 -1.664 4.771 -4.919 4.919 -1.266 0.058 -1.644 0.07 -4.85 0.07 -3.204 0 -3.584 -0.012 -4.849 -0.07 -3.274 -0.148 -4.771 -1.699 -4.919 -4.92 -0.058 -1.265 -0.07 -1.644 -0.07 -4.849 0 -3.204 0.013 -3.583 0.07 -4.849 0.148 -3.227 1.664 -4.771 4.919 -4.919 1.266 -0.057 1.645 -0.069 4.849 -0.069zm0 -2.163c-3.259 0 -3.667 0.014 -4.947 0.072 -4.358 0.198 -6.78 2.618 -6.98 6.98 -0.059 1.281 -0.073 1.689 -0.073 4.948 0 3.259 0.014 3.668 0.072 4.948 0.196 4.358 2.618 6.78 6.98 6.98 1.281 0.058 1.689 0.072 4.948 0.072 3.259 0 3.668 -0.014 4.948 -0.072 4.354 -0.19 6.782 -2.618 6.979 -6.98 0.059 -1.28 0.073 -1.689 0.073 -4.948 0 -3.259 -0.014 -3.667 -0.072 -4.947 -0.196 -4.354 -2.617 -6.78 -6.979 -6.98 -1.281 -0.059 -1.69 -0.073 -4.949 -0.073zm0 5.838c-3.403 0 -6.162 2.759 -6.162 6.162s2.759 6.163 6.162 6.163 6.162 -2.759 6.162 -6.163c0 -3.403 -2.759 -6.162 -6.162 -6.162zm0 10.162c-2.209 0 -4 -1.79 -4 -4 0 -2.209 1.791 -4 4 -4s4 1.791 4 4c0 2.21 -1.791 4 -4 4zm6.406 -11.845c-0.796 0 -1.441 -0.645 -1.441 -1.44s0.645 -1.44 1.441 -1.44c0.795 0 1.439 0.645 1.439 1.44s-0.644 1.44 -1.439 1.44z"/>
                </svg>
              </div>
            </a>
          ))}
        </div>

        {/* Follow Button */}
        {displayUsername && (
          <div className="mt-10 text-center">
            <a
              href={`https://instagram.com/${displayUsername}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full px-6 py-3 font-semibold text-white transition-all hover:scale-105"
              style={{ 
                backgroundColor: branding.colors.primary,
                boxShadow: `0 4px 20px ${branding.colors.primary}60`,
              }}
            >
              <svg 
                className="h-5 w-5"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 2.163c3.204 0 3.584 0.012 4.85 0.07 3.252 0.148 4.771 1.691 4.919 4.919 0.058 1.265 0.069 1.645 0.069 4.849 0 3.205 -0.012 3.584 -0.069 4.849 -0.149 3.225 -1.664 4.771 -4.919 4.919 -1.266 0.058 -1.644 0.07 -4.85 0.07 -3.204 0 -3.584 -0.012 -4.849 -0.07 -3.274 -0.148 -4.771 -1.699 -4.919 -4.92 -0.058 -1.265 -0.07 -1.644 -0.07 -4.849 0 -3.204 0.013 -3.583 0.07 -4.849 0.148 -3.227 1.664 -4.771 4.919 -4.919 1.266 -0.057 1.645 -0.069 4.849 -0.069zm0 -2.163c-3.259 0 -3.667 0.014 -4.947 0.072 -4.358 0.198 -6.78 2.618 -6.98 6.98 -0.059 1.281 -0.073 1.689 -0.073 4.948 0 3.259 0.014 3.668 0.072 4.948 0.196 4.358 2.618 6.78 6.98 6.98 1.281 0.058 1.689 0.072 4.948 0.072 3.259 0 3.668 -0.014 4.948 -0.072 4.354 -0.19 6.782 -2.618 6.979 -6.98 0.059 -1.28 0.073 -1.689 0.073 -4.948 0 -3.259 -0.014 -3.667 -0.072 -4.947 -0.196 -4.354 -2.617 -6.78 -6.979 -6.98 -1.281 -0.059 -1.69 -0.073 -4.949 -0.073zm0 5.838c-3.403 0 -6.162 2.759 -6.162 6.162s2.759 6.163 6.162 6.163 6.162 -2.759 6.162 -6.163c0 -3.403 -2.759 -6.162 -6.162 -6.162zm0 10.162c-2.209 0 -4 -1.79 -4 -4 0 -2.209 1.791 -4 4 -4s4 1.791 4 4c0 2.21 -1.791 4 -4 4zm6.406 -11.845c-0.796 0 -1.441 -0.645 -1.441 -1.44s0.645 -1.44 1.441 -1.44c0.795 0 1.439 0.645 1.439 1.44s-0.644 1.44 -1.439 1.44z"/>
              </svg>
              Follow @{displayUsername}
            </a>
          </div>
        )}
      </div>
    </section>
  );
}

/**
 * Generate placeholder Instagram posts for demo
 */
function generatePlaceholderPosts(username: string, count: number): InstagramPost[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `post-${i + 1}`,
    imageUrl: `https://picsum.photos/seed/instagram-${username}-${i}/400/400`,
    caption: `Instagram post ${i + 1}`,
    permalink: `https://instagram.com/p/placeholder-${i + 1}`,
    timestamp: new Date(Date.now() - i * 86400000).toISOString(),
  }));
}
