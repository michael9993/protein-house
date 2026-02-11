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
    backgroundImage?: string | null;
  };
}

/**
 * PromotionBanner - Data-driven promotional banner section.
 * Shows real discount data from ALL products with active promotions
 * (not just the "sale" collection). Falls back to Storefront Control
 * config for CTAs and overrides. Hidden when no discounted products exist.
 */
export function PromotionBanner({ channel, promoData }: PromotionBannerProps) {
  const { colors } = useBranding();
  const config = usePromotionBannerConfig();
  const promoPopupConfig = usePromoPopupConfig();
  const contentConfig = useContentConfig();

  // Get translated content templates from config
  const homepageContent = contentConfig.homepage;
  const upToPercentOffTemplate = homepageContent.upToPercentOffText || "Up to {discount}% Off";
  const itemsOnSaleTemplate = homepageContent.itemsOnSaleText || "{count} items on sale";
  const specialOfferText = homepageContent.specialOfferText || "Special Offer";
  const shopSaleItemsText = homepageContent.shopSaleItemsButton || "Shop Sale Items";
  const allProductsText = homepageContent.allProductsButton || "All Products";

  // Hide if explicitly disabled via config
  const enabled = config?.enabled ?? true;
  if (!enabled) return null;

  // Badge: discount-based > config > translated fallback
  const badgeText = promoData.maxDiscountPercent > 0
    ? upToPercentOffTemplate.replace("{discount}", String(promoData.maxDiscountPercent))
    : (config?.badgeText || specialOfferText);

  // Title: real promotion name > promo popup > config > empty
  const title = promoData.promotionName || promoPopupConfig.title || config?.title || "";

  // Highlight: discount % > config > empty
  const highlight = promoData.maxDiscountPercent > 0
    ? upToPercentOffTemplate.replace("{discount}", String(promoData.maxDiscountPercent))
    : (config?.highlight || "");

  // Description: parsed EditorJS from collection > promo popup > config > empty
  const rawDescription = promoData.description || "";
  const parsedDescription = parseDescription(rawDescription);
  const description = parsedDescription || promoPopupConfig.body || config?.description || "";

  // CTAs: promo popup > config > translated defaults
  const primaryCtaText = promoPopupConfig.ctaText || config?.primaryCta?.text || shopSaleItemsText;
  const primaryCtaLink = promoPopupConfig.ctaLink || config?.primaryCta?.link || "/products?onSale=true";
  const secondaryCtaText = config?.secondaryCta?.text || allProductsText;
  const secondaryCtaLink = config?.secondaryCta?.link || "/products";

  return (
    <section
      className="relative overflow-hidden border-y border-neutral-200 transform-gpu will-change-transform"
      aria-label="Promotional sale banner"
    >
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

            {/* Title + Highlight */}
            <h2 className="mt-5 font-heading text-4xl font-black uppercase tracking-tighter text-neutral-900 lg:text-5xl">
              {title}
              {highlight && (
                <span
                  className="mt-1 block bg-clip-text text-transparent"
                  style={{
                    backgroundImage: `linear-gradient(135deg, ${colors.primary}, ${colors.accent})`,
                  }}
                >
                  {highlight}
                </span>
              )}
            </h2>

            {description && (
              <p className="mt-4 max-w-lg text-sm font-medium text-neutral-600">
                {description}
              </p>
            )}

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
            <Link
              href={`/${encodeURIComponent(channel)}${secondaryCtaLink.startsWith('/') ? '' : '/'}${secondaryCtaLink}`}
              className="inline-flex items-center justify-center rounded-full border-2 border-neutral-900 bg-white px-8 py-4 text-xs font-bold uppercase tracking-[0.2em] text-neutral-900 transition hover:bg-neutral-900 hover:text-white"
            >
              {secondaryCtaText}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
