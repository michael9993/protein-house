"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { parseDescription } from "./utils";
import { CountdownTimer } from "@/ui/components/CountdownTimer";
import { useBranding, usePromoPopupConfig, usePromotionBannerConfig, useContentConfig } from "@/providers/StoreConfigProvider";

interface PromotionBannerProps {
  channel: string;
  promoData: {
    promotionName: string;
    description: string;
    maxDiscountPercent: number;
    productCount: number;
    saleEndDate?: string | null;
  };
}

/**
 * PromotionBanner - Dynamic promotional banner section
 * Displays sale/promotion information with CTAs.
 * Configurable via Storefront Control.
 */
export function PromotionBanner({ channel, promoData }: PromotionBannerProps) {
  const { colors } = useBranding();
  const config = usePromotionBannerConfig();
  const promoPopupConfig = usePromoPopupConfig();
  const contentConfig = useContentConfig();

  // Get translated content from config
  const homepageContent = contentConfig.homepage;
  const defaultSpecialOffer = homepageContent.specialOfferText || "Special Offer";
  const defaultDontMissOut = homepageContent.dontMissOutTitle || "Don't miss out";
  const defaultPromoDescription = homepageContent.promoDescriptionFallback || "Premium performance gear for run, court, and studio. Limited time collection.";
  const defaultShopSaleItems = homepageContent.shopSaleItemsButton || "Shop Sale Items";
  const defaultAllProducts = homepageContent.allProductsButton || "All Products";
  const upToPercentOffTemplate = homepageContent.upToPercentOffText || "Up to {discount}% Off";
  const itemsOnSaleTemplate = homepageContent.itemsOnSaleText || "{count} items on sale";

  // Default values using translated content
  const DEFAULTS = {
    enabled: true,
    badgeText: defaultSpecialOffer,
    title: defaultDontMissOut,
    highlight: upToPercentOffTemplate.replace("{discount}", "25"),
    description: defaultPromoDescription,
    primaryCta: { text: defaultShopSaleItems, link: "/products?collections=sale" },
    secondaryCta: { text: defaultAllProducts, link: "/products" },
  };

  // Use config enabled flag, default to true
  const enabled = config?.enabled ?? DEFAULTS.enabled;

  // Hide section if explicitly disabled
  if (!enabled) return null;

  // Priority: promoData (from sale collection) > promoPopupConfig > config > defaults
  // Badge: Use promo popup badge or construct from discount
  const badgeText = promoData.maxDiscountPercent > 0
    ? upToPercentOffTemplate.replace("{discount}", String(promoData.maxDiscountPercent))
    : (promoPopupConfig.badge || config?.badgeText || DEFAULTS.badgeText);

  // Title: Use promotion name from sale collection or promo popup title
  const title = promoData.promotionName || promoPopupConfig.title || config?.title || DEFAULTS.title;

  // Highlight: Show discount percentage
  const highlight = promoData.maxDiscountPercent > 0
    ? upToPercentOffTemplate.replace("{discount}", String(promoData.maxDiscountPercent))
    : (config?.highlight || DEFAULTS.highlight);

  // Description: Parse EditorJS from sale collection or use promo popup body
  const rawDescription = promoData.description || "";
  const parsedDescription = parseDescription(rawDescription);
  const description = parsedDescription || promoPopupConfig.body || config?.description || DEFAULTS.description;

  // CTA: Use promo popup CTA settings
  const primaryCtaText = promoPopupConfig.ctaText || config?.primaryCta?.text || DEFAULTS.primaryCta.text;
  const primaryCtaLink = promoPopupConfig.ctaLink || config?.primaryCta?.link || DEFAULTS.primaryCta.link;
  const secondaryCta = config?.secondaryCta || DEFAULTS.secondaryCta;

  return (
    <section
      className="relative overflow-hidden border-y border-neutral-200 bg-gradient-to-br from-white via-neutral-50 to-white transform-gpu will-change-transform"
      aria-label="Promotional sale banner"
    >
      {/* Background glow */}
      <div
        className="absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage: `radial-gradient(circle at 70% 50%, ${colors.primary} 0%, transparent 70%)`,
        }}
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-[var(--design-container-max)] px-6 py-16 lg:px-12 lg:py-20">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          {/* Text Content */}
          <div className="flex-1">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white/80 px-4 py-1.5 backdrop-blur-sm">
              <span
                className="h-2 w-2 animate-pulse rounded-full"
                style={{ backgroundColor: colors.accent }}
                aria-hidden="true"
              />
              <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-neutral-600">
                {badgeText}
              </span>
            </div>

            {/* Title */}
            <h2 className="mt-5 font-heading text-4xl font-black uppercase tracking-tighter text-neutral-900 lg:text-5xl">
              {title}
              <span
                className="mt-1 block bg-clip-text text-transparent"
                style={{
                  backgroundImage: `linear-gradient(135deg, ${colors.primary}, ${colors.accent})`,
                }}
              >
                {highlight}
              </span>
            </h2>

            <p className="mt-4 max-w-lg text-sm font-medium text-neutral-600">
              {description}
            </p>

            {/* Product count badge */}
            {promoData.productCount > 0 && (
              <p className="mt-3 text-xs font-medium text-neutral-500">
                {itemsOnSaleTemplate.replace("{count}", String(promoData.productCount))}
              </p>
            )}

            {/* Countdown timer */}
            {promoData.saleEndDate && (
              <div className="mt-4">
                <CountdownTimer endDate={promoData.saleEndDate} accentColor={colors.primary} />
              </div>
            )}
          </div>

          {/* CTAs */}
          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
            <Link
              href={`/${encodeURIComponent(channel)}${primaryCtaLink.startsWith('/') ? '' : '/'}${primaryCtaLink}`}
              className="group inline-flex items-center justify-center gap-2 rounded-full px-8 py-4 text-xs font-bold uppercase tracking-[0.2em] text-white shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl"
              style={{ backgroundColor: colors.primary }}
            >
              {primaryCtaText}
              <ArrowRight
                size={12}
                className="transition-transform duration-300 group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1"
                aria-hidden="true"
              />
            </Link>
            {secondaryCta && (
              <Link
                href={`/${encodeURIComponent(channel)}${secondaryCta.link.startsWith('/') ? '' : '/'}${secondaryCta.link}`}
                className="inline-flex items-center justify-center rounded-full border-2 border-neutral-900 bg-white px-8 py-4 text-xs font-bold uppercase tracking-[0.2em] text-neutral-900 transition hover:bg-neutral-900 hover:text-white"
              >
                {secondaryCta.text}
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
