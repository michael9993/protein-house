"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight, X } from "lucide-react";
import { useBranding, useContentConfig, useCategoriesConfig, useDesignTokens, useComponentStyle, useComponentClasses } from "@/providers/StoreConfigProvider";
import { buildComponentStyle } from "@/config";
import { buildCategoryUrl, buildCategoryUrlFromChildren, buildProductsUrl, withChannel } from "@/lib/urls";
import { type DashboardCategory, type DashboardCategoryChild } from "./utils";
import { SectionViewAllButton } from "./SectionViewAllButton";

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
  return withChannel(channel, buildCategoryUrlFromChildren(category.slug, childSlugs));
}

// ---------------------------------------------------------------------------
// Mosaic Animation Constants & Helpers
// ---------------------------------------------------------------------------

const DEFAULT_CYCLE_MS = 6000;
const TRANSITION_CSS = "all 0.6s cubic-bezier(0.4, 0, 0.2, 1)";
const GAP = 12;

// Desktop: left 44% (2x2 grid) | gap | right 56% (hero)
const DESKTOP_HERO: React.CSSProperties = {
  insetInlineStart: `calc(44% + ${GAP}px)`,
  top: 0,
  width: `calc(56% - ${GAP}px)`,
  height: "100%",
  borderRadius: "1.5rem",
};

const DESKTOP_GRID: React.CSSProperties[] = [
  { insetInlineStart: 0, top: 0, width: `calc(22% - ${GAP / 2}px)`, height: `calc(50% - ${GAP / 2}px)`, borderRadius: "1rem" },
  { insetInlineStart: `calc(22% + ${GAP / 2}px)`, top: 0, width: `calc(22% - ${GAP / 2}px)`, height: `calc(50% - ${GAP / 2}px)`, borderRadius: "1rem" },
  { insetInlineStart: 0, top: `calc(50% + ${GAP / 2}px)`, width: `calc(22% - ${GAP / 2}px)`, height: `calc(50% - ${GAP / 2}px)`, borderRadius: "1rem" },
  { insetInlineStart: `calc(22% + ${GAP / 2}px)`, top: `calc(50% + ${GAP / 2}px)`, width: `calc(22% - ${GAP / 2}px)`, height: `calc(50% - ${GAP / 2}px)`, borderRadius: "1rem" },
];

// Mobile: hero on top (57%) | gap | 2x2 grid below (43%)
const MOBILE_HERO: React.CSSProperties = {
  insetInlineStart: 0,
  top: 0,
  width: "100%",
  height: `calc(57% - ${GAP / 2}px)`,
  borderRadius: "1.5rem",
};

const MOBILE_GRID: React.CSSProperties[] = [
  { insetInlineStart: 0, top: `calc(57% + ${GAP / 2}px)`, width: `calc(50% - ${GAP / 2}px)`, height: `calc(21.5% - ${GAP / 4}px)`, borderRadius: "1rem" },
  { insetInlineStart: `calc(50% + ${GAP / 2}px)`, top: `calc(57% + ${GAP / 2}px)`, width: `calc(50% - ${GAP / 2}px)`, height: `calc(21.5% - ${GAP / 4}px)`, borderRadius: "1rem" },
  { insetInlineStart: 0, top: `calc(78.5% + ${GAP}px)`, width: `calc(50% - ${GAP / 2}px)`, height: `calc(21.5% - ${GAP / 4}px)`, borderRadius: "1rem" },
  { insetInlineStart: `calc(50% + ${GAP / 2}px)`, top: `calc(78.5% + ${GAP}px)`, width: `calc(50% - ${GAP / 2}px)`, height: `calc(21.5% - ${GAP / 4}px)`, borderRadius: "1rem" },
];

function getSlotStyle(
  cardIndex: number,
  activeIndex: number,
  mobile: boolean,
): React.CSSProperties | null {
  const heroSlot = mobile ? MOBILE_HERO : DESKTOP_HERO;
  const gridSlots = mobile ? MOBILE_GRID : DESKTOP_GRID;

  if (cardIndex === activeIndex) return heroSlot;

  let gridPos = 0;
  for (let i = 0; i < cardIndex; i++) {
    if (i !== activeIndex) gridPos++;
  }
  return gridPos < 4 ? gridSlots[gridPos] : null;
}

/** Dot indicators with CSS-animated progress bar */
function DotIndicators({
  count,
  activeIndex,
  cycleDuration,
  isPaused,
  accentColor,
  onDotClick,
}: {
  count: number;
  activeIndex: number;
  cycleDuration: number;
  isPaused: boolean;
  accentColor: string;
  onDotClick: (index: number) => void;
}) {
  if (count <= 1) return null;

  return (
    <div
      className="mt-6 flex items-center justify-center gap-2"
      role="tablist"
      aria-label="Category navigation"
    >
      {Array.from({ length: count }, (_, i) => {
        const isActive = i === activeIndex;
        return (
          <button
            key={i}
            onClick={() => onDotClick(i)}
            role="tab"
            aria-selected={isActive}
            aria-label={`Category ${i + 1}`}
            className={`relative overflow-hidden rounded-full transition-all duration-300 ${
              isActive
                ? "h-2 w-8"
                : "h-2 w-2 bg-neutral-300 hover:bg-neutral-400"
            }`}
            style={
              isActive ? { backgroundColor: `${accentColor}33` } : undefined
            }
          >
            {isActive && (
              <div
                key={`progress-${activeIndex}`}
                className="absolute inset-y-0 start-0 rounded-full"
                style={{
                  backgroundColor: accentColor,
                  animation: `mosaicProgressFill ${cycleDuration}ms linear forwards`,
                  animationPlayState: isPaused ? "paused" : "running",
                }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
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
      {/* Background — accent gradient when no image */}
      <div
        className="absolute inset-0"
        style={
          image
            ? undefined
            : { background: `linear-gradient(135deg, ${accent}20 0%, ${accent}60 60%, ${accent} 100%)` }
        }
        aria-hidden="true"
      >
        {!image && (
          <div className="absolute inset-0 bg-gradient-to-br from-neutral-900/30 to-neutral-900/70" />
        )}
      </div>

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
      {image && (
        <div
          className="absolute inset-0 opacity-30"
          style={{ background: `linear-gradient(160deg, ${accent}40 0%, transparent 50%)` }}
          aria-hidden="true"
        />
      )}

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
/*  SubcategoryBottomSheet — mobile-only modal for subcategory pills  */
/* ------------------------------------------------------------------ */
function SubcategoryBottomSheet({
  category,
  subcategories,
  channel,
  accent,
  viewCategoryText,
  onClose,
}: {
  category: DashboardCategory;
  subcategories: DashboardCategoryChild[];
  channel: string;
  accent: string;
  viewCategoryText: string;
  onClose: () => void;
}) {
  const [visible, setVisible] = useState(false);
  const image = category.image || category.featuredImage;

  const handleClose = useCallback(() => {
    setVisible(false);
    setTimeout(onClose, 300);
  }, [onClose]);

  // Animate in on mount + escape key
  useEffect(() => {
    document.body.style.overflow = "hidden";
    requestAnimationFrame(() => setVisible(true));
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") handleClose(); };
    document.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = ""; document.removeEventListener("keydown", onKey); };
  }, [handleClose]);

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-end justify-center lg:items-center lg:p-6"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-label={`${category.name} subcategories`}
    >
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* Sheet — bottom on mobile, centered on desktop */}
      <div
        className={`relative w-full max-w-lg transform transition-all duration-300 ease-out lg:rounded-2xl lg:shadow-2xl ${
          visible
            ? "translate-y-0 scale-100 opacity-100"
            : "translate-y-full scale-95 opacity-0 lg:translate-y-8"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Category image header */}
        <div className="relative h-40 w-full overflow-hidden rounded-t-2xl lg:h-48">
          {image ? (
            <Image
              src={image}
              alt={category.imageAlt || category.name}
              fill
              className="object-cover"
              sizes="100vw"
            />
          ) : (
            <div
              className="absolute inset-0"
              style={{ background: `linear-gradient(135deg, ${accent}40 0%, ${accent} 100%)` }}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute end-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition-colors hover:bg-black/60"
            aria-label="Close"
          >
            <X size={16} />
          </button>

          {/* Category name */}
          <div className="absolute inset-x-0 bottom-0 p-5">
            <h3 className="text-xl font-black uppercase tracking-tight text-white">
              {category.name}
            </h3>
            <p className="mt-0.5 text-xs font-medium text-white/60">
              {subcategories.length} {viewCategoryText.toLowerCase() === "view all" ? "subcategories" : viewCategoryText}
            </p>
          </div>
        </div>

        {/* Subcategory list */}
        <div className="max-h-[50vh] overflow-y-auto bg-white px-5 py-5">
          <div className="flex flex-wrap gap-2.5">
            {subcategories.map((child) => (
              <Link
                key={child.id}
                href={withChannel(channel, buildCategoryUrl(child.slug))}
                className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-sm font-semibold text-neutral-800 transition-all duration-200 active:scale-95"
                style={{
                  borderColor: `${accent}30`,
                }}
                onClick={handleClose}
              >
                {child.name}
                <span
                  className="rounded-full px-1.5 py-0.5 text-[10px] font-bold text-white"
                  style={{ backgroundColor: accent }}
                >
                  {child.productCount}
                </span>
              </Link>
            ))}
          </div>

          {/* View All button */}
          <Link
            href={getCategoryHref(channel, category)}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold uppercase tracking-wider text-white transition-all duration-200 active:scale-[0.98]"
            style={{ backgroundColor: accent }}
            onClick={handleClose}
          >
            {viewCategoryText}
            <ChevronRight size={14} className="rtl:rotate-180" aria-hidden="true" />
          </Link>
        </div>

        {/* Safe area for notch devices */}
        <div className="bg-white pb-[env(safe-area-inset-bottom)] lg:rounded-b-2xl" />
      </div>
    </div>,
    document.body,
  );
}

/* ------------------------------------------------------------------ */
/*  SplitCard — image splits apart to reveal subcategories            */
/* ------------------------------------------------------------------ */
function SplitCard({
  category,
  channel,
  accent,
  stylesText,
  showSubcategories,
  showProductCount,
  subcategoriesLabel,
  viewCategoryText,
}: {
  category: DashboardCategory;
  channel: string;
  accent: string;
  stylesText: string;
  showSubcategories: boolean;
  showProductCount: boolean;
  subcategoriesLabel: string;
  viewCategoryText: string;
}) {
  const [showMobileSheet, setShowMobileSheet] = useState(false);
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
        className="group relative block h-full w-full overflow-hidden rounded-3xl border border-neutral-200 bg-neutral-800 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
      >
        <ImageLayer {...imageLayerProps} />
      </Link>
    );
  }

  // Has children → tap opens subcategory modal
  return (
    <>
      <div
        className="relative h-full w-full cursor-pointer overflow-hidden rounded-3xl border border-neutral-200 bg-neutral-800 shadow-sm transition-shadow duration-300 hover:shadow-2xl"
        onClick={() => setShowMobileSheet(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setShowMobileSheet(true);
          }
        }}
        role="button"
        tabIndex={0}
        aria-label={`${category.name} — explore subcategories`}
      >
        <ImageLayer {...imageLayerProps} />
      </div>

      {showMobileSheet && (
        <SubcategoryBottomSheet
          category={category}
          subcategories={filteredChildren}
          channel={channel}
          accent={accent}
          viewCategoryText={viewCategoryText}
          onClose={() => setShowMobileSheet(false)}
        />
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Categories — section wrapper with mosaic grid                     */
/* ------------------------------------------------------------------ */
export function Categories({ categories, channel, title, subtitle }: CategoriesProps) {
  const { colors } = useBranding();
  const contentConfig = useContentConfig();
  const config = useCategoriesConfig();
  const designTokens = useDesignTokens();
  const cdStyle = useComponentStyle("homepage.categories");
  const cdClasses = useComponentClasses("homepage.categories");
  const CYCLE_MS = (designTokens.animations as { carouselCycleSeconds?: number }).carouselCycleSeconds
    ? (designTokens.animations as { carouselCycleSeconds?: number }).carouselCycleSeconds! * 1000
    : DEFAULT_CYCLE_MS;

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

  const nonEmptyCategories = useMemo(
    () => categories.filter((cat) => cat.productCount > 0),
    [categories],
  );
  const displayCategories = useMemo(
    () => nonEmptyCategories.slice(0, maxCategories),
    [nonEmptyCategories, maxCategories],
  );
  const accent = colors.secondary || colors.primary;

  // ---------------------------------------------------------------------------
  // Cycling state (mirrors CollectionMosaic)
  // ---------------------------------------------------------------------------

  const [isDesktop, setIsDesktop] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const isPausedRef = useRef(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    setIsDesktop(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = () => setReducedMotion(mq.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Auto-rotate (interval-based, progress bar handled by CSS)
  useEffect(() => {
    if (reducedMotion || displayCategories.length < 2) return;

    let elapsed = 0;
    const TICK = 100;
    const timer = setInterval(() => {
      if (!isPausedRef.current) {
        elapsed += TICK;
        if (elapsed >= CYCLE_MS) {
          setActiveIndex((prev) => (prev + 1) % displayCategories.length);
          elapsed = 0;
        }
      }
    }, TICK);

    return () => clearInterval(timer);
  }, [reducedMotion, displayCategories.length, activeIndex]);

  useEffect(() => {
    setActiveIndex(0);
  }, [displayCategories.length]);

  const pause = useCallback(() => {
    isPausedRef.current = true;
    setIsPaused(true);
  }, []);

  const resume = useCallback(() => {
    isPausedRef.current = false;
    setIsPaused(false);
  }, []);

  const goTo = useCallback((index: number) => {
    setActiveIndex(index);
  }, []);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  if (!enabled || displayCategories.length === 0) return null;

  return (
    <section
      data-cd="homepage-categories"
      className={`relative border-t border-neutral-100 ${cdClasses}`}
      aria-label={displayTitle}
      style={{
        ...buildComponentStyle("homepage.categories", cdStyle),
      }}
    >
      {/* CSS keyframes for progress bar */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes mosaicProgressFill {
          from { width: 0%; }
          to   { width: 100%; }
        }
      ` }} />

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
          <SectionViewAllButton
            href={withChannel(channel, buildProductsUrl())}
            text={viewAllText}
          />
        </div>

        {/* Mosaic — cards animate between hero & grid slots */}
        <div
          className="relative mt-10"
          style={{ minHeight: isDesktop ? "540px" : "680px" }}
          onMouseEnter={isDesktop ? pause : undefined}
          onMouseLeave={isDesktop ? resume : undefined}
          onTouchStart={!isDesktop ? pause : undefined}
          onTouchEnd={!isDesktop ? () => setTimeout(resume, 2000) : undefined}
        >
          {displayCategories.map((category, i) => {
            const isHero = i === activeIndex;
            const slot = getSlotStyle(i, activeIndex, !isDesktop);
            if (!slot) return null;

            return (
              <div
                key={category.id}
                className="absolute overflow-hidden shadow-md"
                style={{
                  ...slot,
                  transition: TRANSITION_CSS,
                  zIndex: isHero ? 2 : 1,
                }}
              >
                <SplitCard
                  category={category}
                  channel={channel}
                  accent={accent}
                  stylesText={stylesText}
                  showSubcategories={showSubcategories}
                  showProductCount={showProductCount}
                  subcategoriesLabel={subcategoriesLabel}
                  viewCategoryText={viewCategoryText}
                />
              </div>
            );
          })}
        </div>

        {/* Dot Indicators */}
        <DotIndicators
          count={displayCategories.length}
          activeIndex={activeIndex}
          cycleDuration={CYCLE_MS}
          isPaused={isPaused}
          accentColor={accent}
          onDotClick={goTo}
        />
      </div>
    </section>
  );
}
