"use client";

import Image from "next/image";
import { useStoreConfig } from "@/providers/StoreConfigProvider";
import { LinkWithChannel } from "@/ui/atoms/LinkWithChannel";

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
  title = "Shop by Category",
  subtitle = "Browse our collections",
}: FeaturedCategoriesProps) {
  const { homepage, branding } = useStoreConfig();
  const config = homepage.sections.featuredCategories;

  // Don't render if disabled
  if (!config.enabled) {
    return null;
  }

  // Limit categories to config limit
  const displayCategories = categories.slice(0, config.limit);

  return (
    <section className="py-16 sm:py-20">
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

        {/* Categories Grid */}
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {displayCategories.map((category, index) => (
            <LinkWithChannel
              key={category.id}
              href={`/categories/${category.slug}`}
              className="group relative overflow-hidden"
              style={{ 
                borderRadius: `var(--store-radius)`,
                animationDelay: `${index * 100}ms`,
              }}
            >
              {/* Category Image */}
              <div className="aspect-[4/3] overflow-hidden">
                <Image
                  src={category.image || `/categories/${category.slug}.jpg`}
                  alt={category.name}
                  width={400}
                  height={300}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                {/* Gradient Overlay */}
                <div 
                  className="absolute inset-0 transition-opacity duration-300 group-hover:opacity-80"
                  style={{
                    background: `linear-gradient(to top, ${branding.colors.secondary}ee 0%, ${branding.colors.secondary}40 50%, transparent 100%)`,
                  }}
                />
              </div>

              {/* Category Info */}
              <div className="absolute inset-x-0 bottom-0 p-6">
                <h3 className="text-xl font-bold text-white">
                  {category.name}
                </h3>
                {category.productCount !== undefined && (
                  <p className="mt-1 text-sm text-white/70">
                    {category.productCount} Products
                  </p>
                )}
                
                {/* Arrow indicator */}
                <div 
                  className="mt-3 inline-flex items-center gap-2 text-sm font-medium transition-all group-hover:gap-3"
                  style={{ color: branding.colors.primary }}
                >
                  Shop Now
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
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

