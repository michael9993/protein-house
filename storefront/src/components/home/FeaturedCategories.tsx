"use client";

import React from "react";
import Image from "next/image";
import { useStoreConfig, useContentConfig } from "@/providers/StoreConfigProvider";
import { LinkWithChannel } from "@/ui/atoms/LinkWithChannel";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
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
 * Displays a grid of category cards with images.
 * Configurable via store config (homepage.sections.featuredCategories)
 */
export function FeaturedCategories({
  categories,
  title,
  subtitle,
}: FeaturedCategoriesProps) {
  const { homepage, branding } = useStoreConfig();
  const content = useContentConfig();
  const config = homepage.sections.featuredCategories;
  
  const displayTitle = title || content.homepage.categoriesTitle;
  const displaySubtitle = subtitle || content.homepage.categoriesSubtitle;

  // Don't render if disabled
  if (!config.enabled) {
    return null;
  }

  // Limit categories to config limit
  const displayCategories = categories.slice(0, config.limit);
  const { elementRef, isVisible } = useScrollAnimation({ threshold: 0.1, rootMargin: "0px 0px -80px 0px" });

  // Get background config
  const backgroundConfig = config.background as SectionBackgroundConfig | undefined;
  const backgroundStyles = generateSectionBackground(backgroundConfig, branding);
  const patternOverlay = generatePatternOverlay(backgroundConfig, branding);

  const sectionStyles: React.CSSProperties = {
    ...backgroundStyles,
    transform: isVisible ? 'translateY(0)' : 'translateY(16px)',
    transition: 'opacity 300ms ease-out, transform 300ms ease-out',
    willChange: isVisible ? 'auto' : 'transform, opacity',
  };

  return (
    <section 
      ref={elementRef}
      className={`premium-band py-16 sm:py-20 transition-opacity duration-300 ease-out ${isVisible ? 'opacity-100' : 'opacity-0'}`}
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
          type="categories"
          align="center"
        />

        {/* Categories Grid */}
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4">
          {displayCategories.map((category, index) => (
            <LinkWithChannel
              key={category.id}
              href={`/categories/${category.slug}`}
              className="group relative overflow-hidden border border-neutral-200/50 bg-white transition-shadow duration-200 ease-out"
              style={{ 
                borderRadius: `var(--store-radius)`,
                boxShadow: `0 4px 16px -4px ${branding.colors.primary}15`,
                transform: 'translateY(0)',
                transition: 'box-shadow 200ms ease-out, transform 200ms ease-out',
                willChange: 'transform',
                animation: `fadeInUp 400ms ease-out ${index * 40}ms both`,
              }}
              onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 12px 24px -8px rgba(0,0,0,0.15)';
              }}
              onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = `0 4px 16px -4px ${branding.colors.primary}15`;
              }}
            >
              {/* Category Image */}
              <div className="aspect-[5/4] overflow-hidden bg-neutral-100">
                <Image
                  src={category.image || `/categories/${category.slug}.jpg`}
                  alt={category.name}
                  width={520}
                  height={420}
                  className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03]"
                  style={{ willChange: 'transform' }}
                />
                {/* Gradient Overlay - More relaxed */}
                <div 
                  className="absolute inset-0 transition-opacity duration-300"
                  style={{
                    background: `linear-gradient(150deg, ${branding.colors.secondary}40 0%, ${branding.colors.secondary}20 40%, transparent 100%)`,
                  }}
                />
                <div
                  className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  style={{
                    background: `radial-gradient(60% 60% at 20% 20%, ${branding.colors.primary}20, transparent 70%)`,
                  }}
                />
              </div>

              {/* Category Info */}
              <div className="absolute inset-x-0 bottom-0 p-6">
                <div
                  className="inline-flex flex-col gap-2 rounded-lg px-4 py-3 bg-white/95 backdrop-blur-sm"
                  style={{
                    border: `1px solid ${branding.colors.primary}20`,
                    boxShadow: `0 4px 12px -2px ${branding.colors.primary}20`,
                  }}
                >
                  <span
                    className="text-[10px] font-semibold uppercase tracking-[0.2em]"
                    style={{ color: branding.colors.textMuted }}
                  >
                    Explore
                  </span>
                  <h3 className="text-xl font-semibold" style={{ color: branding.colors.text }}>
                    {category.name}
                  </h3>
                  {category.productCount !== undefined && (
                    <p className="text-sm" style={{ color: branding.colors.textMuted }}>
                      {category.productCount} {content.homepage.productCountText}
                    </p>
                  )}
                  
                  {/* Arrow indicator */}
                  <div 
                    className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide transition-all group-hover:gap-3"
                    style={{ color: branding.colors.primary }}
                  >
                    {content.homepage.shopNowButton}
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </div>
                </div>
              </div>
            </LinkWithChannel>

          ))}
        </div>

        {/* View All Link */}
        <div className="mt-10 text-center">
          <LinkWithChannel
            href="/categories"
            className="inline-flex items-center gap-2 font-medium transition-colors"
            style={{ color: branding.colors.primary }}
          >
            View All Categories
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </LinkWithChannel>
        </div>
      </div>
    </section>
  );
}

/**
 * Placeholder Categories for Demo
 * Use these when actual data isn't available
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

