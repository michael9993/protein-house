"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useBranding, useContentConfig, useCategoriesConfig } from "@/providers/StoreConfigProvider";
import { getCategoryLayoutClass, type DashboardCategory, type DashboardCategoryChild } from "./utils";

interface CategoriesProps {
  categories: DashboardCategory[];
  channel: string;
  title?: string;
  subtitle?: string;
}

/** Collect all child slugs (not the parent) — mirrors QuickFilters pattern */
function collectChildSlugs(category: DashboardCategory): string[] {
  if (!category.children || category.children.length === 0) return [];
  return category.children.map((c) => c.slug);
}

/** Build URL: child slugs comma-separated if available, else parent slug */
function getCategoryHref(channel: string, category: DashboardCategory): string {
  const childSlugs = collectChildSlugs(category);
  const slugParam = childSlugs.length > 0 ? childSlugs.join(",") : category.slug;
  return `/${encodeURIComponent(channel)}/products?categories=${slugParam}`;
}

/* ------------------------------------------------------------------ */
/*  ImageLayer — renders the category image with overlays             */
/*  Used by both split halves (clipped via parent CSS)                */
/* ------------------------------------------------------------------ */
function ImageLayer({
  category,
  accent,
  showProductCount,
  stylesText,
  hasChildren,
  subcategoriesLabel,
  childCount,
}: {
  category: DashboardCategory;
  accent: string;
  showProductCount: boolean;
  stylesText: string;
  hasChildren: boolean;
  subcategoriesLabel: string;
  childCount: number;
}) {
  const image = category.image || category.featuredImage;

  return (
    <>
      {/* Background fallback */}
      <div
        className="absolute inset-0 bg-gradient-to-br from-neutral-50 via-white to-neutral-100"
        aria-hidden="true"
      />

      {/* Category image */}
      {image && (
        <Image
          src={image}
          alt={category.imageAlt || category.name}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px"
        />
      )}

      {/* Gradient overlays */}
      <div
        className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/5"
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 opacity-30"
        style={{ background: `linear-gradient(160deg, ${accent}40 0%, transparent 50%)` }}
        aria-hidden="true"
      />

      {/* Category info — pinned to bottom */}
      <div className="absolute inset-x-0 bottom-0 z-10 p-5 text-white sm:p-6">
        {showProductCount && category.productCount > 0 && (
          <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/70">
            {category.productCount} {stylesText}
          </span>
        )}
        <h3 className="mt-1.5 text-xl font-black uppercase tracking-tight sm:text-2xl">
          {category.name}
        </h3>
        {hasChildren && (
          <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold text-white/90 backdrop-blur-sm">
            <span>
              {childCount} {subcategoriesLabel.toLowerCase()}
            </span>
            <ChevronRight size={11} className="rtl:rotate-180" aria-hidden="true" />
          </div>
        )}
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  RevealContent — subcategory pills shown between the split halves  */
/* ------------------------------------------------------------------ */
function RevealContent({
  category,
  subcategories,
  channel,
  accent,
  viewCategoryText,
}: {
  category: DashboardCategory;
  subcategories: DashboardCategoryChild[];
  channel: string;
  accent: string;
  viewCategoryText: string;
}) {
  return (
    <div className="split-content">
      {/* Dark grey base */}
      <div className="absolute inset-0 bg-neutral-800" aria-hidden="true" />

      {/* Subtle accent pattern */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          background: `radial-gradient(ellipse at 30% 50%, ${accent}25 0%, transparent 70%)`,
        }}
        aria-hidden="true"
      />

      <div className="relative flex h-full flex-col items-center justify-center px-5 py-4 sm:px-6">
        {/* Category name */}
        <div className="split-content-header text-center">
          <h3 className="text-sm font-black uppercase tracking-widest text-white/50">
            {category.name}
          </h3>
          <div
            className="mx-auto mt-1.5 h-[2px] w-8 rounded-full"
            style={{ backgroundColor: accent }}
          />
        </div>

        {/* Subcategory pills — centered */}
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {subcategories.slice(0, 8).map((child, i) => (
            <Link
              key={child.id}
              data-pill={i}
              href={`/${encodeURIComponent(channel)}/products?categories=${child.slug}`}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-white/90 backdrop-blur-sm transition-all duration-200 hover:border-white/40 hover:bg-white/20"
              onClick={(e) => e.stopPropagation()}
              style={{ opacity: 0 }}
            >
              {child.name}
              <span className="text-[10px] font-normal text-white/40">
                {child.productCount}
              </span>
            </Link>
          ))}
        </div>

        {/* View All button */}
        <div className="split-content-cta mt-4">
          <Link
            href={getCategoryHref(channel, category)}
            className="inline-flex items-center gap-2 rounded-full px-5 py-2 text-[11px] font-bold uppercase tracking-[0.15em] text-white transition-all duration-200 hover:brightness-110"
            style={{ backgroundColor: accent }}
            onClick={(e) => e.stopPropagation()}
          >
            {viewCategoryText}
            <ChevronRight size={12} className="rtl:rotate-180" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  SplitCard — image splits apart to reveal subcategories            */
/* ------------------------------------------------------------------ */
function SplitCard({
  category,
  channel,
  accent,
  layoutClass,
  stylesText,
  showSubcategories,
  showProductCount,
  subcategoriesLabel,
  viewCategoryText,
}: {
  category: DashboardCategory;
  channel: string;
  accent: string;
  layoutClass: string;
  stylesText: string;
  showSubcategories: boolean;
  showProductCount: boolean;
  subcategoriesLabel: string;
  viewCategoryText: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const filteredChildren = category.children?.filter((c) => c.productCount > 0) ?? [];
  const hasChildren = showSubcategories && filteredChildren.length > 0;

  const imageLayerProps = {
    category,
    accent,
    showProductCount,
    stylesText,
    hasChildren,
    subcategoriesLabel,
    childCount: filteredChildren.length,
  };

  // No children → simple link card
  if (!hasChildren) {
    return (
      <Link
        href={getCategoryHref(channel, category)}
        className={`group relative overflow-hidden rounded-3xl border border-neutral-200 bg-neutral-800 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl ${layoutClass}`}
      >
        <ImageLayer {...imageLayerProps} />
      </Link>
    );
  }

  // Has children → split-reveal card
  return (
    <div
      className={`relative cursor-pointer overflow-hidden rounded-3xl border border-neutral-200 bg-neutral-800 shadow-sm transition-shadow duration-300 hover:shadow-2xl ${isOpen ? "split-card-open" : ""} ${layoutClass}`}
      onClick={() => setIsOpen((prev) => !prev)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setIsOpen((prev) => !prev);
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`${category.name} — ${isOpen ? "close" : "explore subcategories"}`}
    >
      {/* Content revealed between the split (z-2, behind image halves) */}
      <RevealContent
        category={category}
        subcategories={filteredChildren}
        channel={channel}
        accent={accent}
        viewCategoryText={viewCategoryText}
      />

      {/* Left half of image — slides left when open */}
      <div className="split-left">
        <ImageLayer {...imageLayerProps} />
      </div>

      {/* Right half of image — slides right when open */}
      <div className="split-right">
        <ImageLayer {...imageLayerProps} />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Categories — section wrapper with mosaic grid                     */
/* ------------------------------------------------------------------ */
export function Categories({ categories, channel, title, subtitle }: CategoriesProps) {
  const { colors } = useBranding();
  const contentConfig = useContentConfig();
  const config = useCategoriesConfig();

  const enabled = config?.enabled ?? true;
  const maxCategories = config?.maxCategories ?? 6;
  const showProductCount = config?.showProductCount ?? true;
  const showSubcategories = config
    ? ("showSubcategories" in config
        ? (config as { showSubcategories?: boolean }).showSubcategories !== false
        : true)
    : true;

  const displayTitle =
    title || config?.title || contentConfig.homepage.categoriesTitle || "";
  const displaySubtitle =
    subtitle || config?.subtitle || contentConfig.homepage.categoriesSubtitle || "";

  const homepageContent = contentConfig.homepage;
  const curatedLabel = homepageContent.curatedLabel || "Curated";
  const stylesText = homepageContent.stylesText || "styles";
  const viewAllText = homepageContent.viewAllCategoriesButton || "View All Categories";

  const hp = homepageContent as Record<string, string>;
  const subcategoriesLabel = hp.subcategoriesLabel || "Subcategories";
  const viewCategoryText = hp.viewCategoryButton || "View All";

  if (!enabled || categories.length === 0) return null;

  const nonEmptyCategories = categories.filter((cat) => cat.productCount > 0);
  const displayCategories = nonEmptyCategories.slice(0, maxCategories);
  const accent = colors.secondary || colors.primary;

  if (displayCategories.length === 0) return null;

  return (
    <section
      className="relative border-t border-neutral-100"
      aria-label={displayTitle}
    >
      <div className="relative mx-auto max-w-[var(--design-container-max)] px-6 py-16 lg:px-12 lg:py-24">
        {/* Section Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-400">
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
          <Link
            href={`/${encodeURIComponent(channel)}/products`}
            className="group/link inline-flex items-center gap-2 rounded-full border border-neutral-200 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-neutral-900 transition-all duration-300 hover:border-neutral-900 hover:bg-neutral-900 hover:text-white"
          >
            {viewAllText}
            <ChevronRight
              size={14}
              className="transition-transform duration-300 group-hover/link:translate-x-0.5 rtl:rotate-180 rtl:group-hover/link:-translate-x-0.5"
              aria-hidden="true"
            />
          </Link>
        </div>

        {/* Category Grid — Mosaic Layout */}
        <div className="mt-10 grid auto-rows-[220px] grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-flow-dense lg:grid-cols-12 lg:gap-6">
          {displayCategories.map((category, index) => (
            <SplitCard
              key={category.id}
              category={category}
              channel={channel}
              accent={accent}
              layoutClass={getCategoryLayoutClass(index, displayCategories.length)}
              stylesText={stylesText}
              showSubcategories={showSubcategories}
              showProductCount={showProductCount}
              subcategoriesLabel={subcategoriesLabel}
              viewCategoryText={viewCategoryText}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
