"use client";

import { useStoreConfig } from "@/providers/StoreConfigProvider";
import { LinkWithChannel } from "@/ui/atoms/LinkWithChannel";

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
  title = "Shop by Brand",
  subtitle = "Trusted by the world's best athletes",
}: FeaturedBrandsProps) {
  const { homepage, branding } = useStoreConfig();

  // Don't render if disabled
  if (!homepage.sections.featuredBrands.enabled) {
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

  return (
    <section 
      className="py-16 sm:py-20"
      style={{ backgroundColor: branding.colors.surface }}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center">
          <h2 
            className="heading text-3xl font-bold tracking-tight sm:text-4xl"
            style={{ color: branding.colors.text }}
          >
            {title}
          </h2>
          <p 
            className="mt-3 text-lg"
            style={{ color: branding.colors.textMuted }}
          >
            {subtitle}
          </p>
        </div>

        {/* Brands Grid */}
        <div className="mt-12 grid grid-cols-2 gap-8 md:grid-cols-3 lg:grid-cols-6">
          {displayBrands.map((brand) => (
            <LinkWithChannel
              key={brand.id}
              href={`/collections/${brand.slug}`}
              className="group flex items-center justify-center p-6 transition-all hover:scale-110"
              style={{ 
                backgroundColor: branding.colors.background,
                borderRadius: `var(--store-radius)`,
                border: `1px solid ${branding.colors.textMuted}20`,
              }}
            >
              <div className="relative h-12 w-24 opacity-60 grayscale transition-all group-hover:opacity-100 group-hover:grayscale-0">
                {/* Placeholder for brand logo */}
                <div 
                  className="flex h-full w-full items-center justify-center text-sm font-bold"
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
            href="/brands"
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

