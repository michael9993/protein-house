"use client";

import { useCallback } from "react";
import { type ProductListItemFragment } from "@/gql/graphql";
import { t } from "@/lib/language";
import { useWishlist } from "@/lib/wishlist";
import { useBranding, useStoreInfo, useFlashDealsConfig, useContentConfig, useProductCardConfig, useFeature, useBadgeStyle, useComponentStyle, useComponentClasses } from "@/providers/StoreConfigProvider";
import { useQuickView } from "@/providers/QuickViewProvider";
import { CountdownTimer } from "@/ui/components/CountdownTimer";
import { HomepageProductCard } from "./HomepageProductCard";
import { type BadgeLabels, type ProductCardConfig } from "./utils";
import { buildProductsUrl, withChannel } from "@/lib/urls";
import { SectionViewAllButton } from "./SectionViewAllButton";

interface FlashDealsProps {
  products: readonly ProductListItemFragment[];
  channel: string;
  maxDiscount: number;
  /** Optional ISO end date for a countdown timer */
  saleEndDate?: string | null;
}

/**
 * FlashDeals - Sale products showcase with discount badges
 * Now uses the unified HomepageProductCard with standard badge system.
 * Configurable via Storefront Control.
 */
export function FlashDeals({ products, channel, maxDiscount, saleEndDate }: FlashDealsProps) {
  const { colors } = useBranding();
  const storeInfo = useStoreInfo();
  const config = useFlashDealsConfig();
  const contentConfig = useContentConfig();
  const cardConfig = useProductCardConfig("homepage");
  const discountBadge = useBadgeStyle("discount");
  const cdStyle = useComponentStyle("homepage.flashDeals");
  const cdClasses = useComponentClasses("homepage.flashDeals");
  const { openQuickView, prefetchQuickView } = useQuickView();
  const wishlistEnabled = useFeature("wishlist");
  const { addItem, removeItem, isInWishlist } = useWishlist();

  // Wishlist toggle handler
  const handleWishlistToggle = useCallback((product: ProductListItemFragment) => {
    const productId = product.id;
    if (isInWishlist(productId)) {
      removeItem(productId);
    } else {
      const price = product.pricing?.priceRange?.start?.gross;
      const originalPrice = product.pricing?.priceRangeUndiscounted?.start?.gross;
      const image = product.thumbnail?.url || product.media?.[0]?.url;
      addItem({
        id: productId,
        name: t(product),
        slug: product.slug,
        price: price?.amount || 0,
        originalPrice: originalPrice?.amount,
        currency: price?.currency || "USD",
        image: image || "",
        imageAlt: product.thumbnail?.alt || t(product),
        category: product.category ? t(product.category) : undefined,
        inStock: (product.variants?.some(v => (v.quantityAvailable ?? 0) > 0)) ?? true,
        channel,
      });
    }
  }, [addItem, removeItem, isInWishlist, channel]);

  // Use config values with fallback chain
  const enabled = config?.enabled ?? true;
  const title = config?.title ?? contentConfig.homepage.onSaleTitle ?? "";
  const subtitle = config?.subtitle ?? contentConfig.homepage.onSaleSubtitle ?? "";
  const badgeTemplate = config?.badgeTemplate ?? contentConfig.homepage.upToPercentOffText ?? "Up to {discount}% OFF";
  const maxProducts = config?.maxProducts ?? 8;

  // Get translated content from config
  const homepageContent = contentConfig.homepage;
  const viewAllOffersText = homepageContent.viewAllOffersButton || "View all offers";
  const viewDetailsText = homepageContent.viewDetailsButton || "View details";
  const itemsText = homepageContent.itemsText || "items";
  const performanceFallback = homepageContent.performanceFallback || "Performance";

  // Badge labels for translation — standard badge system
  const badgeLabels: BadgeLabels = {
    outOfStock: homepageContent.outOfStockBadgeLabel || "Out of stock",
    sale: homepageContent.saleBadgeLabel || "Sale",
    off: homepageContent.saleBadgeOffText || "OFF",
    lowStock: homepageContent.lowStockBadgeLabel || "Low stock",
    new: homepageContent.newBadgeLabel || "New",
    featured: homepageContent.featuredBadgeLabel || "Featured",
  };

  // Hide if explicitly disabled or no products
  if (!enabled || products.length === 0) return null;

  const storeName = storeInfo.name || "";
  const saleItems = products.slice(0, maxProducts);

  // Format badge with actual discount
  const badgeText = badgeTemplate.replace("{discount}", String(maxDiscount));

  return (
    <section
      data-cd="homepage-flashDeals"
      className={`border-b border-neutral-100 py-20 ${cdClasses}`}
      aria-label="Flash deals section"
      style={{
        ...(cdStyle?.backgroundColor && { background: `var(--cd-homepage-flashDeals-bg)` }),
        ...(cdStyle?.textColor && { color: `var(--cd-homepage-flashDeals-text)` }),
      }}
    >
      <div className="mx-auto max-w-[var(--design-container-max)] px-6 lg:px-12">
        {/* Header */}
        <div className="mb-12 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div className="flex flex-col gap-2">
            {/* Discount badge */}
            {maxDiscount > 0 && (
              <span
                className="inline-flex w-fit items-center gap-2 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider"
                style={{
                  backgroundColor: discountBadge.backgroundColor ?? "var(--store-error, #dc2626)",
                  color: discountBadge.color ?? "#ffffff",
                }}
              >
                {badgeText} &bull; {products.length} {itemsText}
              </span>
            )}
            <h2 className="mt-2 text-4xl font-black uppercase italic tracking-tighter text-neutral-900">
              {title}
            </h2>
            {subtitle && (
              <p className="text-sm font-medium text-neutral-500">{subtitle}</p>
            )}
            {saleEndDate && (
              <div className="mt-3">
                <CountdownTimer endDate={saleEndDate} accentColor={colors.primary} />
              </div>
            )}
          </div>
          <SectionViewAllButton
            href={withChannel(channel, buildProductsUrl({ onSale: true }))}
            text={viewAllOffersText}
          />
        </div>

        {/* Product Grid */}
        <div className="grid gap-6 product-grid-config">
          {saleItems.map((product) => (
            <div key={product.id}>
              <HomepageProductCard
                product={product}
                channel={channel}
                storeName={storeName}
                accent={colors.primary}
                badgeLabels={badgeLabels}
                viewDetailsText={viewDetailsText}
                performanceFallback={performanceFallback}
                onQuickView={openQuickView}
                onPrefetch={prefetchQuickView}
                wishlistEnabled={wishlistEnabled}
                isWishlisted={isInWishlist(product.id)}
                onWishlistToggle={handleWishlistToggle}
                cardConfig={cardConfig}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
