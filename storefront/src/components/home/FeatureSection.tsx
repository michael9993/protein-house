"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useHomepageConfig, useButtonStyle, useStoreConfig } from "@/providers/StoreConfigProvider";
import { RevealOnScroll } from "@/components/ui/RevealOnScroll";
import { generateSectionBackground, generatePatternOverlay, type SectionBackgroundConfig } from "@/lib/section-backgrounds";
import type { CardConfig } from "@/config/store.config";

export const FeatureSection = () => {
  const { sections } = useHomepageConfig();
  const { branding } = useStoreConfig();
  const config = sections.feature;
  const buttonStyle = useButtonStyle("primary");

  if (!config?.enabled) return null;

  const {
    title,
    description,
    imageUrl,
    imagePosition = "left",
    ctaText,
    ctaLink,
    background,
  } = config;
  
  const cardConfig = (config as any).card as CardConfig | undefined;

  const isImageRight = imagePosition === "right";
  
  // Generate background styles
  const backgroundConfig = background as SectionBackgroundConfig;
  const backgroundStyles = generateSectionBackground(backgroundConfig, branding);
  const patternOverlay = generatePatternOverlay(backgroundConfig, branding);

  // Card Config Styles (applied to Image container)
  const getAspectRatioClass = () => {
    switch (cardConfig?.aspectRatio) {
      case 'square': return 'aspect-square';
      case 'portrait': return 'aspect-[3/4]';
      case 'landscape': return 'aspect-[4/3]';
      case 'wide': return 'aspect-video';
      default: return 'aspect-[4/3] md:aspect-square';
    }
  };

  const getRadiusStyle = () => {
    if (cardConfig?.borderRadius === 'none') return '0px';
    if (cardConfig?.borderRadius === 'sm') return '4px';
    if (cardConfig?.borderRadius === 'md') return '8px';
    if (cardConfig?.borderRadius === 'lg') return '16px';
    if (cardConfig?.borderRadius === 'full') return '24px';
    return "1rem"; // Default rounded-2xl
  };

  const getShadowStyle = () => {
    if (cardConfig?.shadow === 'none') return 'none';
    const baseColor = branding.colors.primary;
    if (cardConfig?.shadow === 'sm') return `0 4px 6px -1px ${baseColor}15`;
    if (cardConfig?.shadow === 'md') return `0 10px 15px -3px ${baseColor}20`;
    if (cardConfig?.shadow === 'lg') return `0 20px 25px -5px ${baseColor}25`;
    return "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)"; // Default shadow-xl
  };

  return (
    <div 
      className="relative py-16 md:py-24 overflow-hidden" 
      style={backgroundStyles}
    >
      {/* Pattern overlay for pattern backgrounds */}
      {patternOverlay && (
        <div className="absolute inset-0 pointer-events-none" style={{ opacity: (backgroundConfig?.patternOpacity ?? 10) / 100 }}>
          <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id={patternOverlay.patternId} width="40" height="40" patternUnits="userSpaceOnUse">
                {backgroundConfig?.patternType === "grid" && <path d="M 40 0 L 0 0 0 40" fill="none" stroke={branding.colors.text} strokeWidth="1"/>}
                {backgroundConfig?.patternType === "dots" && <circle cx="10" cy="10" r="1.5" fill={branding.colors.text}/>}
                {backgroundConfig?.patternType === "lines" && <path d="M 0 20 L 40 20" fill="none" stroke={branding.colors.text} strokeWidth="1"/>}
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

      <div className="container mx-auto px-4 md:px-8 relative z-10">
        <div className={`flex flex-col md:flex-row items-center gap-12 md:gap-16 ${isImageRight ? "md:flex-row-reverse" : ""}`}>
          
          {/* Image Side */}
          <div className="w-full md:w-1/2">
            <RevealOnScroll 
               className={`relative ${getAspectRatioClass()} w-full overflow-hidden bg-white/50 dark:bg-black/50 backdrop-blur-sm`}
               style={{
                 borderRadius: getRadiusStyle(),
                 boxShadow: getShadowStyle(),
               }}
            >
              {imageUrl ? (
                <Image
                  src={imageUrl}
                  alt={title}
                  fill
                  className={`object-${cardConfig?.imageFit || 'cover'} transition-transform duration-700 hover:scale-105`}
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-neutral-400">
                  <span className="text-lg">No Image Configured</span>
                </div>
              )}
            </RevealOnScroll>
          </div>

          {/* Content Side */}
          <div className="w-full md:w-1/2 text-center md:text-left">
            <RevealOnScroll delay={200}>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-6">
                {title}
              </h2>
              <p className="text-lg text-neutral-600 dark:text-neutral-300 mb-8 leading-relaxed max-w-xl mx-auto md:mx-0">
                {description}
              </p>
              
              {ctaText && ctaLink && (
                <Link
                  href={ctaLink}
                  className="inline-flex items-center justify-center px-8 py-3 text-base font-medium transition-colors duration-200"
                  style={{
                    backgroundColor: buttonStyle.backgroundColor || "black",
                    color: buttonStyle.color || "white",
                    borderRadius: buttonStyle.borderRadius || "0.5rem",
                  }}
                >
                  {ctaText}
                </Link>
              )}
            </RevealOnScroll>
          </div>
          
        </div>
      </div>
    </div>
  );
};
