"use client";

import React from "react";
import Image from "next/image";
import { useStoreConfig, useContentConfig } from "@/providers/StoreConfigProvider";
import { LinkWithChannel } from "@/ui/atoms/LinkWithChannel";

import { SectionHeader } from "./SectionHeader";
import { generateSectionBackground, generatePatternOverlay, type SectionBackgroundConfig } from "@/lib/section-backgrounds";

interface Category {
  id: string;
  name: string;
  slug: string;
  image?: string;
  productCount?: number;
}

interface FeaturedCategoriesProps {
  categories: Category[];
  title?: string;
  subtitle?: string;
}

/**
 * Featured Categories Section
 * 
 * Displays a grid of category cards with configurable styling.
 */
export function FeaturedCategories({
  categories,
  title,
  subtitle,
}: FeaturedCategoriesProps) {
  const { homepage, branding } = useStoreConfig();
  const content = useContentConfig();
  const config = homepage.sections.featuredCategories;
  const cardConfig = config.card || {};
  
  const displayTitle = title || content.homepage.categoriesTitle;
  const displaySubtitle = subtitle || content.homepage.categoriesSubtitle;
  const shopCollectionText = content.homepage.shopNowButton || "Shop Collection";
  const viewAllCategoriesText =
    content.homepage.viewAllCategoriesButton ||
    content.general.viewAllButton ||
    "View All Categories";

  // Don't render if disabled
  if (!config.enabled) {
    return null;
  }

  // Limit categories to config limit
  const displayCategories = categories.slice(0, config.limit);
  
  // Background setup
  const backgroundConfig = config.background as SectionBackgroundConfig | undefined;
  const backgroundStyles = generateSectionBackground(backgroundConfig, branding);
  const patternOverlay = generatePatternOverlay(backgroundConfig, branding);

  // Card Aspect Ratio
  const getAspectRatioClass = () => {
    switch (cardConfig.aspectRatio) {
      case 'square': return 'aspect-square';
      case 'landscape': return 'aspect-[4/3]';
      case 'wide': return 'aspect-video';
      case 'portrait': 
      default: return 'aspect-[3/4]';
    }
  };

  // Border Radius
  const getRadiusStyle = () => {
    if (cardConfig.borderRadius === 'none') return '0px';
    if (cardConfig.borderRadius === 'sm') return '4px';
    if (cardConfig.borderRadius === 'md') return '8px';
    if (cardConfig.borderRadius === 'lg') return '16px';
    if (cardConfig.borderRadius === 'full') return '9999px';
    return `var(--store-radius)`;
  };

  // Shadow
  const getShadowStyle = (isHovered: boolean) => {
    if (cardConfig.shadow === 'none') return 'none';
    const baseColor = branding.colors.primary;
    
    // Custom shadows based on config
    const shadowMap = {
      sm: isHovered ? `0 4px 12px ${baseColor}20` : `0 1px 3px ${baseColor}10`,
      md: isHovered ? `0 12px 24px -4px ${baseColor}25` : `0 4px 6px -1px ${baseColor}10`,
      lg: isHovered ? `0 20px 40px -8px ${baseColor}30` : `0 10px 15px -3px ${baseColor}15`,
    };

    if (cardConfig.shadow && shadowMap[cardConfig.shadow]) {
        return shadowMap[cardConfig.shadow];
    }
    
    // Default
    return isHovered 
      ? `0 12px 24px -8px ${baseColor}15`
      : `0 4px 16px -4px ${baseColor}10`;
  };

  // Text Alignment/Position
  const isTextCentered = cardConfig.textPosition === 'center';
  
  // Text Size
  const getTextSizeClass = () => {
    switch(cardConfig.textSize) {
      case 'sm': return 'text-lg';
      case 'lg': return 'text-2xl';
      case 'xl': return 'text-3xl';
      default: return 'text-xl';
    }
  };

  return (
    <section 
      className="premium-band py-16 sm:py-20"
      style={{
        ...backgroundStyles,
        color: branding.colors.text, 
      }}
    >
      {/* Pattern overlay */}
      {patternOverlay && (
        <div className="absolute inset-0 pointer-events-none" style={{ opacity: (backgroundConfig?.patternOpacity ?? 10) / 100 }}>
          <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id={patternOverlay.patternId} width="40" height="40" patternUnits="userSpaceOnUse">
                {backgroundConfig?.patternType === "grid" && <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1"/>}
                {backgroundConfig?.patternType === "dots" && <circle cx="10" cy="10" r="1.5" fill="currentColor"/>}
                {backgroundConfig?.patternType === "lines" && <path d="M 0 20 L 40 20" fill="none" stroke="currentColor" strokeWidth="1"/>}
                {backgroundConfig?.patternType === "waves" && (
                  <>
                    <path d="M 0 30 Q 15 20, 30 30 T 60 30" fill="none" stroke="currentColor" strokeWidth="1"/>
                    <path d="M 0 40 Q 15 50, 30 40 T 60 40" fill="none" stroke="currentColor" strokeWidth="1"/>
                  </>
                )}
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill={`url(#${patternOverlay.patternId})`} />
          </svg>
        </div>
      )}

      <div className="premium-band-content relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          title={displayTitle}
          subtitle={displaySubtitle}
          type="categories"
          align="center"
        />

        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4">
          {displayCategories.map((category, index) => (
            <LinkWithChannel
              key={category.id}
              href={`/products?category=${category.slug}`}
              className="group relative block overflow-hidden bg-white transition-all duration-300 transform hover:-translate-y-1"
              style={{ 
                borderRadius: getRadiusStyle(),
                boxShadow: getShadowStyle(false),
                backgroundColor: cardConfig.backgroundColor || branding.colors.surface,
                opacity: (cardConfig.opacity ?? 100) / 100,
              }}
              onMouseEnter={(e) => {
                 e.currentTarget.style.boxShadow = getShadowStyle(true);
              }}
              onMouseLeave={(e) => {
                 e.currentTarget.style.boxShadow = getShadowStyle(false);
              }}
            >
              <div className={`relative ${getAspectRatioClass()} overflow-hidden`}>
                <Image
                  src={category.image || `/categories/${category.slug}.jpg`}
                  alt={category.name}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className={`object-${cardConfig.imageFit || 'cover'} transition-transform duration-700 ease-out group-hover:scale-110`}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80" />
              </div>

              {/* Text Layout */}
              <div 
                className={`absolute inset-0 p-6 flex flex-col ${isTextCentered ? 'justify-center items-center text-center' : 'justify-end items-start'}`}
              >
                  {/* Glass Card content wrapper if NOT centered */}
                  <div 
                    className={`
                      relative overflow-hidden w-full backdrop-blur-md transition-all duration-300
                      ${isTextCentered ? 'bg-transparent p-0' : 'bg-white/80 p-5 rounded-xl border border-white/20'}
                    `}
                    style={{
                      // Only apply custom borders/bg if NOT centered
                      backgroundColor: isTextCentered ? 'transparent' : (cardConfig.backgroundColor || 'rgba(255,255,255,0.85)'),
                      color: cardConfig.textColor || branding.colors.text,
                    }}
                  >
                     <h3 className={`${getTextSizeClass()} font-bold tracking-tight`}>
                       {category.name}
                     </h3>
                     
                     {category.productCount !== undefined && (
                        <p className="mt-1 text-sm opacity-80 font-medium">
                           {category.productCount} {content.homepage.productCountText}
                        </p>
                     )}
                     
                     {!isTextCentered && (
                       <div className="mt-3 flex items-center text-xs font-bold uppercase tracking-wider text-primary opacity-0 transform translate-y-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0"
                            style={{ color: branding.colors.primary }}
                       >
                          {shopCollectionText}
                          <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                       </div>
                     )}
                  </div>
              </div>
            </LinkWithChannel>
          ))}
        </div>

        <div className="mt-12 text-center">
          <LinkWithChannel
            href="/products"
            className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-full text-white bg-neutral-900 hover:bg-neutral-800 transition-colors shadow-lg hover:shadow-xl"
            style={{ backgroundColor: branding.colors.primary }}
          >
            {viewAllCategoriesText}
          </LinkWithChannel>
        </div>
      </div>
    </section>
  );
}

/**
 * Placeholder Categories for Demo
 */
export const placeholderCategories: Category[] = [
  { id: "1", name: "Running Shoes", slug: "running-shoes", productCount: 45 },
  { id: "2", name: "Training Gear", slug: "training-gear", productCount: 38 },
  { id: "3", name: "Sportswear", slug: "sportswear", productCount: 62 },
  { id: "4", name: "Accessories", slug: "accessories", productCount: 54 },
  { id: "5", name: "Basketball", slug: "basketball", productCount: 29 },
  { id: "6", name: "Soccer", slug: "soccer", productCount: 41 },
  { id: "7", name: "Tennis", slug: "tennis", productCount: 23 },
  { id: "8", name: "Swimming", slug: "swimming", productCount: 18 },
];
