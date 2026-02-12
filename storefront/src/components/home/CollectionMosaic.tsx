"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { parseDescription } from "./utils";
import { useBranding, useCollectionMosaicConfig, useContentConfig } from "@/providers/StoreConfigProvider";
import { buildCollectionUrl, buildProductsUrl, withChannel } from "@/lib/urls";
import { SectionViewAllButton } from "./SectionViewAllButton";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CollectionItem {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  backgroundImage?: {
    url: string;
    alt?: string | null;
  } | null;
  products?: {
    totalCount?: number | null;
    edges: Array<{
      node: {
        id: string;
        name: string;
        slug: string;
        thumbnail?: { url: string; alt?: string | null } | null;
        media?: Array<{ url: string; alt?: string | null }> | null;
      };
    }>;
  } | null;
}

interface CollectionMosaicProps {
  collections: CollectionItem[];
  channel: string;
}

// ---------------------------------------------------------------------------
// Constants & Desktop Slot Positions
// ---------------------------------------------------------------------------

const CYCLE_MS = 6000;
const TRANSITION_CSS = "all 0.6s cubic-bezier(0.4, 0, 0.2, 1)";
const GAP = 12; // px gap between cards

// Desktop layout: left 44% (2x2 grid) | gap | right 56% (hero)
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

// Mobile layout: hero on top (57%) | gap | 2x2 grid below (43%)
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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Get the slot style for a card given the current activeIndex and viewport */
function getSlotStyle(
  cardIndex: number,
  activeIndex: number,
  mobile: boolean,
): React.CSSProperties | null {
  const heroSlot = mobile ? MOBILE_HERO : DESKTOP_HERO;
  const gridSlots = mobile ? MOBILE_GRID : DESKTOP_GRID;

  if (cardIndex === activeIndex) return heroSlot;

  // Count how many non-hero cards are before this one
  let gridPos = 0;
  for (let i = 0; i < cardIndex; i++) {
    if (i !== activeIndex) gridPos++;
  }
  return gridPos < 4 ? gridSlots[gridPos] : null;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Unified card content — adapts its rendering based on isHero */
function CardContent({
  collection,
  channel,
  isHero,
  accentColor,
  itemsText,
  shopText,
  featuredLabel,
}: {
  collection: CollectionItem;
  channel: string;
  isHero: boolean;
  accentColor: string;
  itemsText: string;
  shopText: string;
  featuredLabel: string;
}) {
  const image =
    collection.backgroundImage?.url ||
    collection.products?.edges?.[0]?.node?.thumbnail?.url;
  const productCount = collection.products?.totalCount ?? 0;

  return (
    <Link
      href={withChannel(channel, buildCollectionUrl(collection.slug))}
      className="group relative block h-full w-full overflow-hidden"
      aria-label={isHero ? `Featured: ${collection.name}` : collection.name}
    >
      {/* Background */}
      {image ? (
        <Image
          src={image}
          alt={collection.backgroundImage?.alt || collection.name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes={
            isHero
              ? "(max-width: 1024px) 100vw, 56vw"
              : "(max-width: 640px) 50vw, 22vw"
          }
        />
      ) : (
        <div className="grid h-full grid-cols-2 gap-1 bg-neutral-100 p-2">
          {collection.products?.edges?.slice(0, 4).map((edge) => (
            <div
              key={edge.node.id}
              className="relative overflow-hidden rounded bg-neutral-200"
            >
              {edge.node.thumbnail?.url && (
                <Image
                  src={edge.node.thumbnail.url}
                  alt={edge.node.thumbnail.alt || edge.node.name}
                  fill
                  className="object-contain p-2"
                  sizes="100px"
                />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Gradient overlay */}
      <div
        className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent"
        aria-hidden="true"
      />

      {/* Product count badge */}
      <div className="absolute start-3 top-3 rounded-full bg-white/90 px-2.5 py-1 backdrop-blur-sm">
        <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-700">
          {productCount} {itemsText}
        </span>
      </div>

      {/* Content overlay */}
      <div
        className={`absolute bottom-0 start-0 end-0 ${isHero ? "p-6" : "p-3"}`}
      >
        {isHero && (
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/70">
            {featuredLabel}
          </span>
        )}
        <h3
          className={`font-bold text-white ${isHero ? "mt-1 text-xl lg:text-2xl" : "text-sm"}`}
        >
          {collection.name}
        </h3>
        {isHero &&
          collection.description &&
          parseDescription(collection.description) && (
            <p className="mt-1.5 line-clamp-2 text-sm text-white/80">
              {parseDescription(collection.description)}
            </p>
          )}
        <div className="mt-2 flex items-center gap-2">
          {isHero ? (
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold text-white"
              style={{ backgroundColor: accentColor }}
            >
              {shopText}
              <ArrowRight
                size={14}
                className="rtl:rotate-180"
                aria-hidden="true"
              />
            </span>
          ) : (
            <span className="flex items-center gap-1 text-xs text-white/80">
              {shopText}
              <ArrowRight
                size={12}
                className="transition-transform duration-300 group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5"
                aria-hidden="true"
              />
            </span>
          )}
        </div>
      </div>
    </Link>
  );
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
      aria-label="Collection navigation"
    >
      {Array.from({ length: count }, (_, i) => {
        const isActive = i === activeIndex;
        return (
          <button
            key={i}
            onClick={() => onDotClick(i)}
            role="tab"
            aria-selected={isActive}
            aria-label={`Collection ${i + 1}`}
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

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

/**
 * CollectionMosaic — Featured collections showcase with animated card swapping
 *
 * Desktop: Cards physically animate between hero and grid positions.
 * Mobile: Hero crossfades, grid cards update below.
 *
 * Config-driven via Storefront Control:
 * - enabled, title, subtitle
 * - maxCollections (3-8)
 * - excludeSlugs (filter out CMS system collections)
 */
export function CollectionMosaic({
  collections,
  channel,
}: CollectionMosaicProps) {
  const { colors } = useBranding();
  const config = useCollectionMosaicConfig();
  const contentConfig = useContentConfig();

  // Config values
  const enabled = config?.enabled ?? true;
  const title = config?.title ?? "";
  const subtitle = config?.subtitle ?? "";
  const maxCollections = config?.maxCollections ?? 5;
  const configExcludeSlugs = config?.excludeSlugs ?? [
    "hero-banner",
    "testimonials",
    "brands",
    "new-arrivals",
    "best-sellers",
    "sale",
  ];

  // Translated content
  const homepageContent = contentConfig.homepage;
  const allCollectionsText =
    homepageContent.allCollectionsButton || "All Collections";
  const itemsText = homepageContent.itemsText || "items";
  const shopCollectionText =
    homepageContent.shopCollectionButton || "Shop collection";
  const featuredCollectionLabel =
    homepageContent.featuredCollectionLabel || "Featured Collection";
  const shopNowText = homepageContent.shopNowButton || "Shop Now";

  // Filter and limit using config
  const displayCollections = useMemo(() => {
    return collections
      .filter((c) => !configExcludeSlugs.includes(c.slug))
      .slice(0, maxCollections);
  }, [collections, configExcludeSlugs, maxCollections]);

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------

  const [isDesktop, setIsDesktop] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const isPausedRef = useRef(false);

  // ---------------------------------------------------------------------------
  // Media query detection
  // ---------------------------------------------------------------------------

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
    if (mq.addEventListener) {
      mq.addEventListener("change", handler);
    } else {
      mq.addListener?.(handler);
    }
    return () => {
      if (mq.removeEventListener) {
        mq.removeEventListener("change", handler);
      } else {
        mq.removeListener?.(handler);
      }
    };
  }, []);

  // ---------------------------------------------------------------------------
  // Auto-rotate (simple interval, progress handled by CSS animation)
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (reducedMotion || displayCollections.length < 2) return;

    // Use a tick-based approach: check every 100ms if we should advance
    // The CSS animation runs independently for the visual progress bar
    let elapsed = 0;
    const TICK = 100;
    const timer = setInterval(() => {
      if (!isPausedRef.current) {
        elapsed += TICK;
        if (elapsed >= CYCLE_MS) {
          setActiveIndex((prev) => (prev + 1) % displayCollections.length);
          elapsed = 0;
        }
      }
    }, TICK);

    return () => clearInterval(timer);
  }, [reducedMotion, displayCollections.length, activeIndex]);

  // Reset on collection count change
  useEffect(() => {
    setActiveIndex(0);
  }, [displayCollections.length]);

  // Sync isPaused state ↔ ref (state for CSS reactivity, ref for interval callback)
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

  if (!enabled || displayCollections.length === 0) return null;

  return (
    <section
      className="relative overflow-hidden border-t border-neutral-100"
      aria-label="Collection showcase"
    >
      {/* CSS keyframes for progress bar — injected once, avoids 60fps re-renders */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes mosaicProgressFill {
          from { width: 0%; }
          to   { width: 100%; }
        }
      ` }} />
      <div className="relative mx-auto max-w-[var(--design-container-max)] px-6 py-20 lg:px-12 lg:py-24">
        {/* Header */}
        <div className="mb-12 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h2 className="font-heading text-3xl font-black uppercase tracking-tighter text-neutral-900 lg:text-4xl">
              {title}
            </h2>
            {subtitle && (
              <p className="mt-2 max-w-lg text-sm font-medium text-neutral-600">
                {subtitle}
              </p>
            )}
          </div>
          <SectionViewAllButton
            href={withChannel(channel, buildProductsUrl())}
            text={allCollectionsText}
          />
        </div>

        {/* Absolutely positioned cards that animate between slots */}
        <div
          className="relative"
          style={{ minHeight: isDesktop ? "540px" : "680px" }}
          onMouseEnter={isDesktop ? pause : undefined}
          onMouseLeave={isDesktop ? resume : undefined}
          onTouchStart={!isDesktop ? pause : undefined}
          onTouchEnd={!isDesktop ? () => setTimeout(resume, 2000) : undefined}
        >
          {displayCollections.map((collection, i) => {
            const isHero = i === activeIndex;
            const slot = getSlotStyle(i, activeIndex, !isDesktop);
            if (!slot) return null;

            return (
              <div
                key={collection.id}
                className="absolute overflow-hidden shadow-md"
                style={{
                  ...slot,
                  transition: TRANSITION_CSS,
                  zIndex: isHero ? 2 : 1,
                }}
              >
                <CardContent
                  collection={collection}
                  channel={channel}
                  isHero={isHero}
                  accentColor={colors.primary}
                  itemsText={itemsText}
                  shopText={isHero ? shopNowText : shopCollectionText}
                  featuredLabel={featuredCollectionLabel}
                />
              </div>
            );
          })}
        </div>

        {/* Dot Indicators */}
        <DotIndicators
          count={displayCollections.length}
          activeIndex={activeIndex}
          cycleDuration={CYCLE_MS}
          isPaused={isPaused}
          accentColor={colors.primary}
          onDotClick={goTo}
        />
      </div>
    </section>
  );
}
