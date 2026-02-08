"use client";

import Image from "next/image";
import Link from "next/link";
import { useBranding, useContentConfig, useCategoriesConfig } from "@/providers/StoreConfigProvider";
import { getCategoryLayoutClass, type DashboardCategory } from "./utils";

interface CategoriesProps {
  categories: DashboardCategory[];
  channel: string;
  title?: string;
  subtitle?: string;
}

// Default values when config is not available
const DEFAULTS = {
  enabled: true,
  title: "Shop by Category",
  subtitle: "Designed for the cadence, control, and recovery each discipline demands.",
  maxCategories: 6,
};

/**
 * CategoryCard - Individual category card with hover effects
 */
function CategoryCard({
  category,
  channel,
  accent,
  layoutClass,
  stylesText,
}: {
  category: DashboardCategory;
  channel: string;
  accent: string;
  layoutClass: string;
  stylesText: string;
}) {
  const image = category.image || category.featuredImage;

  return (
    <Link
      href={`/${encodeURIComponent(channel)}/products?categories=${category.slug}`}
      className={`group relative overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl ${layoutClass}`}
    >
      <div
        className="absolute inset-0 bg-gradient-to-br from-neutral-100 via-white to-neutral-50"
        aria-hidden="true"
      />
      {image && (
        <Image
          src={image}
          alt={category.imageAlt || category.name}
          fill
          className="object-cover transition duration-700 group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px"
        />
      )}
      <div
        className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 opacity-0 transition duration-500 group-hover:opacity-100"
        style={{ background: `linear-gradient(135deg, ${accent}35 0%, transparent 60%)` }}
        aria-hidden="true"
      />
      <div className="relative z-10 flex h-full flex-col justify-end p-6 text-white">
        {category.productCount > 0 && (
          <div className="text-xs font-bold uppercase tracking-[0.3em] text-white/80">
            {category.productCount} {stylesText}
          </div>
        )}
        <div className="mt-2 text-2xl font-black uppercase italic tracking-tight">
          {category.name}
        </div>
      </div>
    </Link>
  );
}

/**
 * Categories - V6-style category mosaic section
 * Configurable via Storefront Control.
 */
export function Categories({ categories, channel, title, subtitle }: CategoriesProps) {
  const { colors } = useBranding();
  const contentConfig = useContentConfig();
  const config = useCategoriesConfig();

  // Use config values with defaults fallback
  const enabled = config?.enabled ?? DEFAULTS.enabled;
  const maxCategories = config?.maxCategories ?? DEFAULTS.maxCategories;

  // Priority: props > config > content config > defaults
  const displayTitle = title || config?.title || contentConfig.homepage.categoriesTitle || DEFAULTS.title;
  const displaySubtitle = subtitle || config?.subtitle || contentConfig.homepage.categoriesSubtitle || DEFAULTS.subtitle;

  // Get translated content from config
  const homepageContent = contentConfig.homepage;
  const curatedLabel = homepageContent.curatedLabel || "Curated";
  const stylesText = homepageContent.stylesText || "styles";

  // Hide if explicitly disabled or no categories
  if (!enabled || categories.length === 0) return null;

  const displayCategories = categories.slice(0, maxCategories);
  const accent = colors.secondary || colors.primary;

  return (
    <section
      className="relative overflow-hidden border-t border-neutral-100"
      style={{
        background: `linear-gradient(90deg, ${colors.primary}0D 0%, ${colors.secondary || colors.background}0D 100%)`,
      }}
      aria-label="Shop by category"
    >
      <div className="relative mx-auto max-w-[var(--design-container-max)] px-6 py-16 lg:px-12">
        {/* Section Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-neutral-500">
              {curatedLabel}
            </p>
            <h2 className="mt-3 text-4xl font-black uppercase italic tracking-tighter text-neutral-900 md:text-5xl">
              {displayTitle}
            </h2>
            {displaySubtitle && (
              <p className="mt-3 max-w-2xl text-sm font-medium text-neutral-500 md:text-base">
                {displaySubtitle}
              </p>
            )}
          </div>
        </div>

        {/* Category Grid - Mosaic Layout */}
        <div className="mt-10 grid auto-rows-[220px] grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-flow-dense lg:grid-cols-12 lg:gap-6">
          {displayCategories.map((category, index) => (
            <CategoryCard
              key={category.id}
              category={category}
              channel={channel}
              accent={accent}
              layoutClass={getCategoryLayoutClass(index, displayCategories.length)}
              stylesText={stylesText}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
