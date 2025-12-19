"use client";

import { useHomepageConfig, useStoreConfig } from "@/providers/StoreConfigProvider";
import { HeroImage } from "./HeroImage";
import { HeroVideo } from "./HeroVideo";
import { HeroSlider } from "./HeroSlider";
import { type HeroBannerConfig } from "@/lib/cms";

interface HeroSectionProps {
  /** CMS config from "hero-banner" collection metadata */
  cmsConfig?: HeroBannerConfig | null;
}

/**
 * HeroSection
 * 
 * Renders the appropriate hero type based on store configuration.
 * Content can be controlled from Dashboard via "hero-banner" collection metadata.
 * 
 * DASHBOARD SETUP:
 * 1. Create collection with slug "hero-banner" (Dashboard > Catalog > Collections)
 * 2. Add metadata keys:
 *    - hero_title: Main heading
 *    - hero_subtitle: Subheading  
 *    - hero_cta_text: Button text
 *    - hero_cta_link: Button URL
 *    - hero_video_url: Video URL (for video hero)
 * 3. Set background image for the collection (used as hero background)
 * 
 * Supports: image, video, slider
 */
export function HeroSection({ cmsConfig }: HeroSectionProps) {
  const { homepage } = useStoreConfig();
  const heroConfig = homepage.sections.hero;

  // Don't render if hero is disabled
  if (!heroConfig.enabled) {
    return null;
  }

  // Build props from CMS config (overrides defaults)
  const heroProps = {
    title: cmsConfig?.title,
    subtitle: cmsConfig?.subtitle,
    ctaText: cmsConfig?.ctaText,
    ctaLink: cmsConfig?.ctaLink,
    image: cmsConfig?.backgroundImage,
    videoUrl: cmsConfig?.videoUrl,
  };

  // Render appropriate hero type
  // If CMS provides a video URL, use video hero regardless of config
  if (cmsConfig?.videoUrl || heroConfig.type === "video") {
    return <HeroVideo {...heroProps} />;
  }

  switch (heroConfig.type) {
    case "slider":
      return <HeroSlider />;
    case "image":
    default:
      return <HeroImage {...heroProps} />;
  }
}

// Export individual components for direct use
export { HeroImage } from "./HeroImage";
export { HeroVideo } from "./HeroVideo";
export { HeroSlider } from "./HeroSlider";

