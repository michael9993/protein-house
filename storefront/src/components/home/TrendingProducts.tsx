"use client";

import { useCallback } from "react";
import { type ProductListItemFragment } from "@/gql/graphql";
import { t } from "@/lib/language";
import { useWishlist } from "@/lib/wishlist";
import { useBranding, useStoreInfo, useContentConfig, useTrendingConfig, useFeature, useProductCardConfig, useComponentStyle, useComponentClasses } from "@/providers/StoreConfigProvider";
import { buildProductsUrl, withChannel } from "@/lib/urls";
import { SectionViewAllButton } from "./SectionViewAllButton";
import { useQuickView } from "@/providers/QuickViewProvider";
import { HomepageProductCard } from "./HomepageProductCard";
import { type BadgeLabels, type ProductCardConfig } from "./utils";

interface TrendingProductsProps {
  products: readonly ProductListItemFragment[];
  channel: string;
  title?: string;
  subtitle?: string;
}

/**
 * TrendingProducts - V6-style trending/new arrivals section
 * Left-aligned header matching BestSellers / FlashDeals pattern.
 * Configurable via Storefront Control.
 */
export function TrendingProducts({ products, channel, title, subtitle }: TrendingProductsProps) {
  const { colors } = useBranding();
  const storeInfo = useStoreInfo();
  const contentConfig = useContentConfig();
  const config = useTrendingConfig();
  const { openQuickView, prefetchQuickView } = useQuickView();
  const wishlistEnabled = useFeature("wishlist");
  const { addItem, removeItem, isInWishlist } = useWishlist();
  const cardConfig = useProductCardConfig("homepage");
  const cdStyle = useComponentStyle("homepage.trending");
  const cdClasses = useComponentClasses("homepage.trending");

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
  const maxProducts = config?.maxProducts ?? 4;

  // Priority: props > config > content config
  const displayTitle = title || config?.title || contentConfig.homepage.newArrivalsTitle || "";
  const displaySubtitle = subtitle || config?.subtitle || contentConfig.homepage.newArrivalsSubtitle || "";

  const storeName = storeInfo.name || "";

  // Get translated content from config
  const homepageContent = contentConfig.homepage;
  const curatedLabel = homepageContent.curatedLabel || "New Arrivals";
  const viewAllText = homepageContent.viewAllButton || "View All";
  const viewDetailsText = homepageContent.viewDetailsButton || "View details";
  const performanceFallback = homepageContent.performanceFallback || "Performance";

  // Badge labels for translation
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

  const displayProducts = products.slice(0, maxProducts);

  return (
    <section
      data-cd="homepage-trending"
      className={`py-20 ${cdClasses}`}
      aria-label="Trending products"
      style={{
        ...(cdStyle?.backgroundColor && { background: `var(--cd-homepage-trending-bg)` }),
        ...(cdStyle?.textColor && { color: `var(--cd-homepage-trending-text)` }),
      }}
    >
      <div className="mx-auto max-w-[var(--design-container-max)] px-6 lg:px-12">
        {/* V6-style section header — matching BestSellers / FlashDeals */}
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
          <SectionViewAllButton
            href={withChannel(channel, buildProductsUrl({ sort: "newest" }))}
            text={viewAllText}
          />
        </div>

        {/* Product Grid */}
        <div className="mt-8 grid gap-6 product-grid-config">
          {displayProducts.map((product) => (
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
