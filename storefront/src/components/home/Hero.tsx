"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import { type ProductListItemFragment } from "@/gql/graphql";
import { type HeroBannerConfig } from "@/lib/cms";
import { formatMoney } from "@/lib/utils";
import { t } from "@/lib/language";
import { useBranding, useStoreInfo, useHeroConfig, useContentConfig, useBadgeStyle, useComponentStyle, useComponentClasses } from "@/providers/StoreConfigProvider";
import { buildComponentStyle } from "@/config";
import { buildProductUrl, buildProductsUrl, withChannel } from "@/lib/urls";
import {
  getProductImage,
  getProductAlt,
  getProductBrand,
  getDiscountPercent,
  getTotalStock,
  uniqueBy,
  type BadgeLabels,
} from "./utils";

const radiusMap: Record<string, string> = {
  none: "rounded-none",
  sm: "rounded-sm",
  md: "rounded-md",
  lg: "rounded-lg",
  xl: "rounded-xl",
  full: "rounded-full",
};

interface HeroProps {
  channel: string;
  newArrivals: readonly ProductListItemFragment[];
  bestSellers: readonly ProductListItemFragment[];
  heroBanner?: HeroBannerConfig | null;
  brandCount: number;
}

// Hand of cards - 9 cards visible with 4 depth layers, center prominent
// Position 0 = center, 1-2 = first layer, 3-4 = second layer, 5-6 = third layer, 7-8 = fourth layer (deepest)
const HAND_POSITIONS = [
  // Center card - fully visible, front and center
  { x: 0, y: 0, rotate: 0, scale: 1, opacity: 1, z: 90, visible: true },
  // First layer - right side, peeking out
  { x: 90, y: 5, rotate: 7, scale: 0.96, opacity: 0.95, z: 80, visible: true },
  // First layer - left side, peeking out
  { x: -90, y: 5, rotate: -7, scale: 0.96, opacity: 0.95, z: 80, visible: true },
  // Second layer - right side
  { x: 145, y: 10, rotate: 13, scale: 0.92, opacity: 0.85, z: 70, visible: true },
  // Second layer - left side
  { x: -145, y: 10, rotate: -13, scale: 0.92, opacity: 0.85, z: 70, visible: true },
  // Third layer - right side
  { x: 190, y: 15, rotate: 19, scale: 0.88, opacity: 0.7, z: 60, visible: true },
  // Third layer - left side
  { x: -190, y: 15, rotate: -19, scale: 0.88, opacity: 0.7, z: 60, visible: true },
  // Fourth layer (deepest) - right side
  { x: 230, y: 20, rotate: 25, scale: 0.84, opacity: 0.5, z: 50, visible: true },
  // Fourth layer (deepest) - left side
  { x: -230, y: 20, rotate: -25, scale: 0.84, opacity: 0.5, z: 50, visible: true },
  // Hidden cards (waiting in queue)
  { x: 270, y: 25, rotate: 30, scale: 0.80, opacity: 0, z: 40, visible: false },
  { x: -270, y: 25, rotate: -30, scale: 0.80, opacity: 0, z: 40, visible: false },
  { x: 0, y: 60, rotate: 0, scale: 0.75, opacity: 0, z: 30, visible: false },
];

const DEFAULT_AUTO_ROTATE_MS = 4000;

/**
 * Hero - Premium stacked card deck hero section
 * Configurable via Storefront Control.
 */
export function Hero({ channel, newArrivals, bestSellers, heroBanner, brandCount }: HeroProps) {
  const { colors } = useBranding();
  const storeInfo = useStoreInfo();
  const config = useHeroConfig();
  const contentConfig = useContentConfig();
  const saleBadgeStyle = useBadgeStyle("sale");
  const outOfStockBadgeStyle = useBadgeStyle("outOfStock");
  const lowStockBadgeStyle = useBadgeStyle("lowStock");
  const cdStyle = useComponentStyle("homepage.hero");
  const cdClasses = useComponentClasses("homepage.hero");

  // Config values with fallbacks
  // Note: Current config only has enabled and type. Extended properties use defaults.
  const enabled = config?.enabled ?? true;
  const autoRotateSeconds = config?.autoRotateSeconds ?? 4;
  const showProgressBar = config?.showProgressBar ?? true;
  const showNavDots = config?.showNavDots ?? true;

  // Hide if disabled
  if (!enabled) return null;

  const storeName = storeInfo.name || "";

  // Get translated content from config
  const homepageContent = contentConfig.homepage;
  const exploreBrandsText = homepageContent.exploreBrandsButton || "Explore brands";
  const brandsLabel = homepageContent.brandsStatLabel || "Brands";
  const stylesLabel = homepageContent.stylesStatLabel || "Styles";
  const ratingLabel = homepageContent.ratingStatLabel || "Rating";
  const defaultTitle = homepageContent.heroDefaultTitle || "Multi-brand performance";
  const defaultSubtitle = homepageContent.heroDefaultSubtitle || "Performance footwear and sportswear curated from the world's most trusted labels.";

  // Priority: heroBanner > content config > store name fallback
  const title = heroBanner?.title || `${storeName} ${defaultTitle}`;
  const subtitle = heroBanner?.subtitle || defaultSubtitle;
  const ctaText = heroBanner?.ctaText || homepageContent.heroCtaText || "Shop new arrivals";
  const ctaLink = heroBanner?.ctaLink || "/products";

  const deckCards = useMemo(() => {
    const candidates = uniqueBy(
      [...newArrivals, ...bestSellers].filter(Boolean),
      (p) => p.id,
    );
    // Fisher-Yates shuffle for variety on each page load
    const shuffled = [...candidates];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled.slice(0, 24);
  }, [newArrivals, bestSellers]);

  const [activeIndex, setActiveIndex] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [progress, setProgress] = useState(0);
  const progressRef = useRef<number | null>(null);
  const lastTickRef = useRef(0);

  // Touch swipe state
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

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

  // Auto-rotate with progress bar
  const autoRotateMs = autoRotateSeconds * 1000;
  useEffect(() => {
    if (reducedMotion || deckCards.length < 2) return;
    lastTickRef.current = performance.now();
    setProgress(0);

    const animate = (now: number) => {
      const elapsed = now - lastTickRef.current;
      const pct = Math.min(elapsed / autoRotateMs, 1);
      setProgress(pct);
      if (pct >= 1) {
        setActiveIndex((prev) => (prev + 1) % deckCards.length);
        lastTickRef.current = now;
        setProgress(0);
      }
      progressRef.current = requestAnimationFrame(animate);
    };
    progressRef.current = requestAnimationFrame(animate);
    return () => {
      if (progressRef.current) cancelAnimationFrame(progressRef.current);
    };
  }, [reducedMotion, deckCards.length, activeIndex, autoRotateMs]);

  useEffect(() => {
    setActiveIndex(0);
  }, [deckCards.length]);

  const goTo = useCallback((index: number) => {
    setActiveIndex(index);
    setProgress(0);
    lastTickRef.current = performance.now();
  }, []);

  const goPrev = useCallback(() => {
    goTo((activeIndex - 1 + deckCards.length) % deckCards.length);
  }, [activeIndex, deckCards.length, goTo]);

  const goNext = useCallback(() => {
    goTo((activeIndex + 1) % deckCards.length);
  }, [activeIndex, deckCards.length, goTo]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 50) {
      if (diff > 0) goNext();
      else goPrev();
    }
  };

  // Badge labels for translation
  const badgeLabels: BadgeLabels = {
    outOfStock: homepageContent.outOfStockBadgeLabel || "Out of stock",
    sale: homepageContent.saleBadgeLabel || "Sale",
    off: homepageContent.saleBadgeOffText || "OFF",
    lowStock: homepageContent.lowStockBadgeLabel || "Low stock",
    new: homepageContent.newBadgeLabel || "New",
    featured: homepageContent.featuredBadgeLabel || "Featured",
  };

  const activeProduct = deckCards[activeIndex];
  const activePrice = activeProduct?.pricing?.priceRange?.start?.gross;
  const activeImage = activeProduct ? getProductImage(activeProduct) : null;
  const activeBrand = activeProduct ? getProductBrand(activeProduct, storeName) : "Multi-brand";
  // Split title for gradient accent on last word
  const titleWords = title.split(" ");
  const lastWord = titleWords.pop() || "";
  const titleRest = titleWords.join(" ");

  return (
    <section
      data-cd="homepage-hero"
      className={`relative overflow-hidden ${cdClasses}`}
      style={{
        ...buildComponentStyle("homepage.hero", cdStyle),
      }}
    >
      {/* Background layers */}
      <div className="absolute inset-0 hero-aurora opacity-20" aria-hidden="true" />
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{ backgroundImage: `radial-gradient(circle at 30% 50%, ${colors.primary} 0%, transparent 60%)` }}
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-[var(--design-container-max)] px-5 pb-12 pt-10 sm:px-6 lg:px-12 lg:pb-20 lg:pt-16">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-16">

          {/* Text Column */}
          <div className="order-1 lg:order-1">
            {/* Tagline chip */}
            <div className="inline-flex items-center gap-2.5 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 backdrop-blur-sm">
              <span
                className="h-2 w-2 animate-pulse rounded-full"
                style={{ backgroundColor: colors.accent }}
                aria-hidden="true"
              />
              <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-white/80">
                {storeInfo.tagline || "New season"}
              </span>
            </div>

            {/* Title with gradient accent */}
            <h1 className="mt-6 text-[2.5rem] font-black uppercase leading-[0.92] tracking-tighter text-white sm:text-5xl md:text-6xl lg:text-7xl">
              {titleRest}{" "}
              <span
                className="bg-clip-text text-transparent"
                style={{ backgroundImage: `linear-gradient(135deg, ${colors.primary}, ${colors.accent})` }}
              >
                {lastWord}
              </span>
            </h1>

            <p className="mt-5 max-w-lg text-sm font-medium leading-relaxed text-white/60 sm:text-base md:text-lg">
              {subtitle}
            </p>

            {/* CTAs */}
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href={withChannel(channel, ctaLink)}
                className="group inline-flex items-center gap-2.5 rounded-full px-7 py-3.5 text-xs font-bold uppercase tracking-[0.2em] text-white shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl"
                style={{ backgroundColor: colors.primary }}
              >
                {ctaText}
                <ArrowRight
                  size={14}
                  className="transition-transform duration-300 group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1"
                  aria-hidden="true"
                />
              </Link>
              <Link
                href={withChannel(channel, buildProductsUrl())}
                className="rounded-full border border-white/20 bg-white/5 px-6 py-3.5 text-xs font-bold uppercase tracking-[0.2em] text-white/90 backdrop-blur-sm transition hover:border-white/40 hover:bg-white/10"
              >
                {exploreBrandsText}
              </Link>
            </div>

            {/* Stats row - desktop only (API-derived data) */}
            <div className="mt-10 hidden items-center gap-8 lg:flex">
              {[
                { value: `${brandCount}+`, label: brandsLabel },
                { value: `${deckCards.length * 50}+`, label: stylesLabel },
              ].map((stat) => (
                <div key={stat.label}>
                  <div className="text-2xl font-black text-white">{stat.value}</div>
                  <div className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.25em] text-white/40">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Card Column */}
          <div className="order-2 lg:order-2">

            {/* Mobile: Hand of cards - 5 cards fanned out with 2 layers */}
            <div
              className="lg:hidden"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <div className="relative mx-auto h-[380px] w-full max-w-[320px]">
                {deckCards.map((product, index) => {
                  // Mobile hand positions: 5 visible cards (center + 2 layers)
                  const MOBILE_POSITIONS = [
                    { x: 0, y: 0, rotate: 0, scale: 1, opacity: 1, z: 50 },
                    { x: 55, y: 4, rotate: 8, scale: 0.94, opacity: 0.9, z: 40 },
                    { x: -55, y: 4, rotate: -8, scale: 0.94, opacity: 0.9, z: 40 },
                    { x: 95, y: 8, rotate: 15, scale: 0.88, opacity: 0.7, z: 30 },
                    { x: -95, y: 8, rotate: -15, scale: 0.88, opacity: 0.7, z: 30 },
                    { x: 0, y: 40, rotate: 0, scale: 0.8, opacity: 0, z: 20 },
                  ];
                  const pos = (index - activeIndex + deckCards.length) % deckCards.length;
                  const s = MOBILE_POSITIONS[pos] ?? MOBILE_POSITIONS[MOBILE_POSITIONS.length - 1];
                  const isCenter = pos === 0;
                  const isFirstLayer = pos === 1 || pos === 2;
                  const isVisible = pos < 5;
                  const price = product.pricing?.priceRange?.start?.gross;
                  const image = getProductImage(product);
                  const discountPct = getDiscountPercent(product);
                  const hasDiscountBadge = discountPct > 0;
                  const prodStock = getTotalStock(product);
                  const prodInStock = prodStock > 0;
                  const prodLowStock = prodStock > 0 && prodStock <= 5;

                  // Card dimensions for mobile
                  const cardWidth = isCenter ? 220 : isFirstLayer ? 200 : 180;
                  const cardHeight = isCenter ? 320 : isFirstLayer ? 290 : 260;

                  return (
                    <Link
                      key={product.id}
                      href={withChannel(channel, buildProductUrl(product.slug))}
                      aria-hidden={!isCenter}
                      tabIndex={isCenter ? 0 : -1}
                      onClick={(e) => {
                        if (!isCenter && isVisible) {
                          e.preventDefault();
                          goTo(index);
                        }
                      }}
                      className={`absolute rounded-[20px] border transition-all duration-500 ease-out ${
                        isCenter
                          ? "border-white/80 cursor-pointer"
                          : isFirstLayer
                          ? "border-white/60 cursor-pointer"
                          : "border-white/40 cursor-pointer"
                      }`}
                      style={{
                        width: cardWidth,
                        height: cardHeight,
                        left: "50%",
                        top: "50%",
                        marginLeft: -cardWidth / 2,
                        marginTop: -cardHeight / 2,
                        transform: `translate3d(${s.x}px, ${s.y}px, 0) rotate(${s.rotate}deg) scale(${s.scale})`,
                        opacity: s.opacity,
                        zIndex: s.z,
                        pointerEvents: isVisible ? "auto" : "none",
                        background: isCenter
                          ? "linear-gradient(145deg, #ffffff 0%, #fafafa 50%, #f5f5f5 100%)"
                          : isFirstLayer
                          ? "linear-gradient(145deg, #fefefe 0%, #f8f8f8 50%, #f3f3f3 100%)"
                          : "linear-gradient(145deg, #fcfcfc 0%, #f5f5f5 50%, #f0f0f0 100%)",
                        boxShadow: isCenter
                          ? `0 20px 40px -10px ${colors.primary}25, 0 10px 20px -5px ${colors.primary}15, 0 4px 8px rgba(0,0,0,0.08)`
                          : isFirstLayer
                          ? `0 15px 30px -8px ${colors.primary}15, 0 6px 12px rgba(0,0,0,0.05)`
                          : `0 10px 20px -6px ${colors.primary}10, 0 4px 8px rgba(0,0,0,0.03)`,
                      }}
                    >
                      {isCenter && (
                        <div
                          className="absolute -inset-[1px] rounded-[21px] opacity-40"
                          style={{
                            background: `linear-gradient(135deg, ${colors.primary}40 0%, ${colors.accent}30 50%, ${colors.primary}40 100%)`,
                          }}
                          aria-hidden="true"
                        />
                      )}
                      <div className={`relative flex h-full flex-col overflow-hidden rounded-[20px] ${
                        isCenter ? "bg-white" : isFirstLayer ? "bg-white/95" : "bg-white/90"
                      }`}>
                        <div className={`relative flex-1 ${
                          isCenter
                            ? "bg-gradient-to-br from-neutral-50 to-white"
                            : "bg-gradient-to-br from-neutral-100/50 to-white"
                        }`}>
                          {image && (
                            <Image
                              src={image}
                              alt={getProductAlt(product)}
                              fill
                              className="object-cover transition-transform duration-500 group-hover/card:scale-105"
                              sizes="220px"
                              priority={index === 0}
                            />
                          )}
                          <div className={`absolute ${isCenter ? "start-3 top-3" : "start-2 top-2"} z-10 flex flex-col gap-1`}>
                            {hasDiscountBadge && (
                              <span
                                className={`${radiusMap[saleBadgeStyle.borderRadius] || "rounded"} px-2 py-1 text-[8px] font-bold shadow-sm`}
                                style={{ backgroundColor: saleBadgeStyle.backgroundColor, color: saleBadgeStyle.color }}
                              >
                                -{discountPct}%
                              </span>
                            )}
                            {!prodInStock && (
                              <span
                                className={`${radiusMap[outOfStockBadgeStyle.borderRadius] || "rounded-full"} px-1.5 py-0.5 text-[7px] font-medium shadow-sm`}
                                style={{ backgroundColor: outOfStockBadgeStyle.backgroundColor, color: outOfStockBadgeStyle.color }}
                              >
                                {contentConfig.product.outOfStockText || badgeLabels.outOfStock}
                              </span>
                            )}
                            {prodLowStock && (
                              <span
                                className={`${radiusMap[lowStockBadgeStyle.borderRadius] || "rounded-full"} px-1.5 py-0.5 text-[7px] font-medium shadow-sm`}
                                style={{ backgroundColor: lowStockBadgeStyle.backgroundColor, color: lowStockBadgeStyle.color }}
                              >
                                {(contentConfig.product.lowStockText || badgeLabels.lowStock).replace("{count}", String(prodStock))}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className={`border-t ${isCenter ? "border-neutral-100 bg-white px-4 py-3" : isFirstLayer ? "border-neutral-100/80 bg-white/90 px-3 py-2" : "border-neutral-100/60 bg-white/80 px-2 py-1.5"}`}>
                          <div className={`font-bold uppercase tracking-[0.15em] text-neutral-500 ${isCenter ? "text-[8px]" : "text-[7px]"}`}>
                            {getProductBrand(product, storeName)}
                          </div>
                          <div className={`font-bold text-neutral-900 line-clamp-1 ${isCenter ? "mt-1 text-sm" : "mt-0.5 text-xs"}`}>
                            {t(product)}
                          </div>
                          <div className={`font-black ${isCenter ? "mt-1 text-base" : "mt-0.5 text-sm"}`} style={{ color: colors.primary }}>
                            {price ? formatMoney(price.amount, price.currency) : "N/A"}
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>

              {/* Mobile nav: 3 pill indicators (prev · progress · next) */}
              {showNavDots && (
                <div className="mt-4 flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={goPrev}
                    className="h-1 w-3 rounded-sm bg-white/30 transition hover:bg-white/50"
                    aria-label="Previous product"
                  />
                  <div
                    className="h-1 w-8 overflow-hidden rounded-sm bg-white/15"
                    role="progressbar"
                    aria-valuenow={Math.round(progress * 100)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label="Auto-rotate progress"
                  >
                    <div
                      className="h-full rounded-sm"
                      style={{
                        width: `${progress * 100}%`,
                        backgroundColor: colors.accent,
                      }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={goNext}
                    className="h-1 w-3 rounded-sm bg-white/30 transition hover:bg-white/50"
                    aria-label="Next product"
                  />
                </div>
              )}
            </div>

            {/* Desktop: Hand of cards - 9 cards fanned out with 4 depth layers */}
            <div className="hidden lg:block">
              <div className="relative mx-auto h-[580px] w-full max-w-[820px]">
                {deckCards.map((product, index) => {
                  // Calculate position in hand: 0 = center, 1-2 = first layer, 3-4 = second, 5-6 = third, 7-8 = fourth
                  const pos = (index - activeIndex + deckCards.length) % deckCards.length;
                  const s = HAND_POSITIONS[pos] ?? HAND_POSITIONS[HAND_POSITIONS.length - 1];
                  const isCenter = pos === 0;
                  const isFirstLayer = pos === 1 || pos === 2;
                  const isSecondLayer = pos === 3 || pos === 4;
                  const isThirdLayer = pos === 5 || pos === 6;
                  const isFourthLayer = pos === 7 || pos === 8;
                  const isVisible = pos < 9;
                  const price = product.pricing?.priceRange?.start?.gross;
                  const image = getProductImage(product);
                  const discountPct = getDiscountPercent(product);
                  const hasDiscountBadge = discountPct > 0;
                  const prodStock = getTotalStock(product);
                  const prodInStock = prodStock > 0;
                  const prodLowStock = prodStock > 0 && prodStock <= 5;

                  // Card dimensions - larger cards, center is biggest
                  const cardWidth = isCenter ? 340 : isFirstLayer ? 310 : isSecondLayer ? 280 : isThirdLayer ? 255 : 230;
                  const cardHeight = isCenter ? 480 : isFirstLayer ? 440 : isSecondLayer ? 400 : isThirdLayer ? 360 : 320;

                  return (
                    <Link
                      key={product.id}
                      href={withChannel(channel, buildProductUrl(product.slug))}
                      aria-hidden={!isCenter}
                      tabIndex={isCenter ? 0 : -1}
                      onClick={(e) => {
                        // Clicking side cards shuffles to that card
                        if (!isCenter && isVisible) {
                          e.preventDefault();
                          goTo(index);
                        }
                      }}
                      className={`group/card absolute rounded-[28px] border transition-all duration-500 ease-out motion-reduce:transition-none ${
                        isCenter
                          ? "border-white/80 cursor-pointer"
                          : isFirstLayer
                          ? "border-white/60 cursor-pointer hover:scale-[1.02]"
                          : isSecondLayer
                          ? "border-white/50 cursor-pointer"
                          : isThirdLayer
                          ? "border-white/40 cursor-pointer"
                          : "border-white/30 cursor-pointer"
                      }`}
                      style={{
                        width: cardWidth,
                        height: cardHeight,
                        left: "50%",
                        top: "50%",
                        marginLeft: -cardWidth / 2,
                        marginTop: -cardHeight / 2,
                        transform: `translate3d(${s.x}px, ${s.y}px, 0) rotate(${s.rotate}deg) scale(${s.scale})`,
                        opacity: s.opacity,
                        zIndex: s.z,
                        pointerEvents: isVisible ? "auto" : "none",
                        // Light background with primary-tinted shadow
                        background: isCenter
                          ? "linear-gradient(145deg, #ffffff 0%, #fafafa 50%, #f5f5f5 100%)"
                          : isFirstLayer
                          ? "linear-gradient(145deg, #fefefe 0%, #f8f8f8 50%, #f3f3f3 100%)"
                          : isSecondLayer
                          ? "linear-gradient(145deg, #fcfcfc 0%, #f5f5f5 50%, #f0f0f0 100%)"
                          : isThirdLayer
                          ? "linear-gradient(145deg, #fafafa 0%, #f3f3f3 50%, #ededed 100%)"
                          : "linear-gradient(145deg, #f8f8f8 0%, #f0f0f0 50%, #e8e8e8 100%)",
                        boxShadow: isCenter
                          ? `0 25px 50px -12px ${colors.primary}25, 0 12px 24px -8px ${colors.primary}15, 0 4px 8px rgba(0,0,0,0.08)`
                          : isFirstLayer
                          ? `0 20px 40px -10px ${colors.primary}18, 0 8px 16px rgba(0,0,0,0.06)`
                          : isSecondLayer
                          ? `0 15px 30px -8px ${colors.primary}12, 0 6px 12px rgba(0,0,0,0.04)`
                          : isThirdLayer
                          ? `0 10px 20px -6px ${colors.primary}08, 0 4px 8px rgba(0,0,0,0.03)`
                          : `0 8px 16px -4px ${colors.primary}05, 0 3px 6px rgba(0,0,0,0.02)`,
                      }}
                    >
                      {/* Subtle border glow on center card */}
                      {isCenter && (
                        <div
                          className="absolute -inset-[1px] rounded-[29px] opacity-40"
                          style={{
                            background: `linear-gradient(135deg, ${colors.primary}40 0%, ${colors.accent}30 50%, ${colors.primary}40 100%)`,
                          }}
                          aria-hidden="true"
                        />
                      )}
                      <div className={`relative flex h-full flex-col overflow-hidden rounded-[28px] ${
                        isCenter
                          ? "bg-white"
                          : isFirstLayer
                          ? "bg-white/95"
                          : isSecondLayer
                          ? "bg-white/90"
                          : isThirdLayer
                          ? "bg-white/85"
                          : "bg-white/80"
                      }`}>
                        {/* Product image area - clean white background */}
                        <div className={`relative flex-1 ${
                          isCenter
                            ? "bg-gradient-to-br from-neutral-50 to-white"
                            : isFirstLayer
                            ? "bg-gradient-to-br from-neutral-100/50 to-white"
                            : isSecondLayer
                            ? "bg-gradient-to-br from-neutral-100/30 to-white/90"
                            : "bg-gradient-to-br from-neutral-100/20 to-white/80"
                        }`}>
                          {image && (
                            <Image
                              src={image}
                              alt={getProductAlt(product)}
                              fill
                              className="object-cover transition-transform duration-500 group-hover/card:scale-105"
                              sizes="340px"
                              priority={index === 0}
                            />
                          )}
                          {/* Badges - inline styled */}
                          <div className={`absolute ${isCenter ? "start-5 top-5" : isFirstLayer ? "start-4 top-4" : isSecondLayer ? "start-3 top-3" : "start-2 top-2"} z-10 flex flex-col gap-1`}>
                            {hasDiscountBadge && (
                              <span
                                className={`${radiusMap[saleBadgeStyle.borderRadius] || "rounded"} ${isCenter ? "px-3 py-1.5 text-[9px]" : isFirstLayer ? "px-2.5 py-1 text-[8px]" : "px-2 py-1 text-[7px]"} font-bold shadow-sm`}
                                style={{ backgroundColor: saleBadgeStyle.backgroundColor, color: saleBadgeStyle.color }}
                              >
                                -{discountPct}%
                              </span>
                            )}
                            {!prodInStock && (
                              <span
                                className={`${radiusMap[outOfStockBadgeStyle.borderRadius] || "rounded-full"} ${isCenter ? "px-2.5 py-1 text-[8px]" : "px-2 py-0.5 text-[7px]"} font-medium shadow-sm`}
                                style={{ backgroundColor: outOfStockBadgeStyle.backgroundColor, color: outOfStockBadgeStyle.color }}
                              >
                                {contentConfig.product.outOfStockText || badgeLabels.outOfStock}
                              </span>
                            )}
                            {prodLowStock && (
                              <span
                                className={`${radiusMap[lowStockBadgeStyle.borderRadius] || "rounded-full"} ${isCenter ? "px-2.5 py-1 text-[8px]" : "px-2 py-0.5 text-[7px]"} font-medium shadow-sm`}
                                style={{ backgroundColor: lowStockBadgeStyle.backgroundColor, color: lowStockBadgeStyle.color }}
                              >
                                {(contentConfig.product.lowStockText || badgeLabels.lowStock).replace("{count}", String(prodStock))}
                              </span>
                            )}
                          </div>
                        </div>
                        {/* Product info */}
                        <div className={`border-t ${isCenter ? "border-neutral-100 bg-white px-6 py-5" : isFirstLayer ? "border-neutral-100/80 bg-white/90 px-5 py-4" : isSecondLayer ? "border-neutral-100/60 bg-white/80 px-4 py-3" : isThirdLayer ? "border-neutral-100/40 bg-white/70 px-3 py-2" : "border-neutral-100/30 bg-white/60 px-2 py-1.5"}`}>
                          <div className={`font-bold uppercase tracking-[0.2em] text-neutral-500 ${isCenter ? "text-[10px]" : isFirstLayer ? "text-[9px]" : isSecondLayer ? "text-[8px]" : "text-[7px]"}`}>
                            {getProductBrand(product, storeName)}
                          </div>
                          <div className={`font-bold text-neutral-900 line-clamp-1 ${isCenter ? "mt-2 text-base" : isFirstLayer ? "mt-1 text-sm" : isSecondLayer ? "mt-0.5 text-xs" : "mt-0.5 text-[11px]"}`}>
                            {t(product)}
                          </div>
                          <div className={`font-black ${isCenter ? "mt-2 text-xl" : isFirstLayer ? "mt-1 text-base" : isSecondLayer ? "mt-0.5 text-sm" : "mt-0.5 text-xs"}`} style={{ color: colors.primary }}>
                            {price ? formatMoney(price.amount, price.currency) : "N/A"}
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>

              {/* Desktop: 3-dot navigation (prev · progress · next) */}
              {showNavDots && (
                <div className="mt-6 flex items-center justify-center gap-4">
                  <button
                    type="button"
                    onClick={goPrev}
                    className="h-1.5 w-4 rounded-sm bg-white/25 transition hover:bg-white/45"
                    aria-label="Previous"
                  />
                  <div
                    className="h-1.5 w-10 overflow-hidden rounded-sm bg-white/15"
                    role="progressbar"
                    aria-valuenow={Math.round(progress * 100)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label="Auto-rotate progress"
                  >
                    <div
                      className="h-full rounded-sm"
                      style={{
                        width: `${progress * 100}%`,
                        backgroundColor: colors.accent,
                      }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={goNext}
                    className="h-1.5 w-4 rounded-sm bg-white/25 transition hover:bg-white/45"
                    aria-label="Next"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
