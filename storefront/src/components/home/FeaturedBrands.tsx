"use client";

import React from "react";
import { useStoreConfig, useContentConfig } from "@/providers/StoreConfigProvider";
import { LinkWithChannel } from "@/ui/atoms/LinkWithChannel";

import { SectionHeader } from "./SectionHeader";
import { generateSectionBackground, generatePatternOverlay, type SectionBackgroundConfig } from "@/lib/section-backgrounds";

interface Brand {
  id: string;
  name: string;
  slug: string;
  logo: string;
}

interface CMSBrand {
  id: string;
  name: string;
  logo: string;
  url?: string;
}

interface FeaturedBrandsProps {
  brands?: Brand[];
  /** Brands from "brands" collection metadata */
  cmsBrands?: CMSBrand[];
  title?: string;
  subtitle?: string;
}

// Default brands for sports store
const defaultBrands: Brand[] = [
  { id: "1", name: "Nike", slug: "nike", logo: "/brands/nike.svg" },
  { id: "2", name: "Adidas", slug: "adidas", logo: "/brands/adidas.svg" },
  { id: "3", name: "Under Armour", slug: "under-armour", logo: "/brands/under-armour.svg" },
  { id: "4", name: "Puma", slug: "puma", logo: "/brands/puma.svg" },
  { id: "5", name: "New Balance", slug: "new-balance", logo: "/brands/new-balance.svg" },
  { id: "6", name: "Reebok", slug: "reebok", logo: "/brands/reebok.svg" },
];

/**
 * Featured Brands Section
 * 
 * Logo carousel of partner brands.
 * Configurable via store config (homepage.sections.featuredBrands)
 * 
 * DASHBOARD SETUP:
 * 1. Create collection with slug "brands" (Dashboard > Catalog > Collections)
 * 2. Add metadata key "brands_json" with JSON array:
 *    [
 *      { "id": "1", "name": "Nike", "logo": "/brands/nike.svg", "url": "/collections/nike" },
 *      ...
 *    ]
 */
export function FeaturedBrands({
  brands = defaultBrands,
  cmsBrands = [],
  title,
  subtitle,
}: FeaturedBrandsProps) {
  const { homepage, branding } = useStoreConfig();
  const content = useContentConfig();
  
  const displayTitle = title || content.homepage.brandsTitle;
  const displaySubtitle = subtitle || content.homepage.brandsSubtitle;

  // Don't render if disabled or section not configured
  if (!homepage.sections.featuredBrands?.enabled) {
    return null;
  }

  // Use CMS brands if available, otherwise use defaults
  const displayBrands: Brand[] = cmsBrands.length > 0
    ? cmsBrands.map(b => ({
        id: b.id,
        name: b.name,
        slug: b.url?.replace(/^\/collections\//, "") || b.name.toLowerCase().replace(/\s+/g, "-"),
        logo: b.logo,
      }))
    : brands;

  // Get background config
  const backgroundConfig = homepage.sections.featuredBrands?.background as SectionBackgroundConfig | undefined;
  const backgroundStyles = generateSectionBackground(backgroundConfig, branding);
  const patternOverlay = generatePatternOverlay(backgroundConfig, branding);

  const sectionStyles: React.CSSProperties = {
    ...backgroundStyles,
  };

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
          type="brands"
          align="center"
        />

        {/* Brands Grid */}
          <div className="mt-12 grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-6">
            {displayBrands.map((brand, index) => (
              <LinkWithChannel
                key={brand.id}
                href={`/products?brands=${encodeURIComponent(brand.slug)}`}
                className="group relative flex items-center justify-center overflow-hidden border border-neutral-200/50 bg-white p-6 transition-shadow duration-200 ease-out"
                style={{ 
                  borderRadius: `var(--store-radius)`,
                  boxShadow: `0 4px 16px -4px ${branding.colors.primary}15`,
                  transform: 'translateY(0)',
                  transition: 'box-shadow 200ms ease-out, transform 200ms ease-out',
                  willChange: 'transform',
                }}
                onMouseEnter={(e: React.MouseEvent<HTMLElement>) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 12px 24px -8px rgba(0,0,0,0.15)';
                }}
                onMouseLeave={(e: React.MouseEvent<HTMLElement>) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = `0 4px 16px -4px ${branding.colors.primary}15`;
                }}
              >
                <div
                  className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  style={{
                    background: `linear-gradient(135deg, ${branding.colors.primary}08, transparent 60%)`,
                  }}
                />
                <div className="relative h-12 w-24 opacity-60 grayscale transition-all duration-300 group-hover:opacity-100 group-hover:grayscale-0">
                  <span
                    className="pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide opacity-0 transition-all duration-300 group-hover:opacity-100"
                    style={{
                      backgroundColor: `${branding.colors.primary}20`,
                      color: branding.colors.primary,
                      border: `1px solid ${branding.colors.primary}40`,
                    }}
                  >
                    Partner
                  </span>
                  {/* Placeholder for brand logo */}
                  <div 
                    className="flex h-full w-full items-center justify-center text-sm font-bold uppercase tracking-wide"
                    style={{ color: branding.colors.textMuted }}
                  >
                    {brand.name}
                  </div>
                </div>
              </LinkWithChannel>
            ))}
          </div>

        {/* View All Brands */}
        <div className="mt-10 text-center">
          <LinkWithChannel
            href="/products"
            className="inline-flex items-center gap-2 font-medium transition-colors"
            style={{ color: branding.colors.primary }}
          >
            View All Brands
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </LinkWithChannel>
        </div>
      </div>
    </section>
  );
}

