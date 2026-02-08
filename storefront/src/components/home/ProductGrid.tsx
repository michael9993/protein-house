"use client";

import React from "react";
import Image from "next/image";
import { useStoreConfig, useFeature, useUiConfig, useContentConfig } from "@/providers/StoreConfigProvider";
import { LinkWithChannel } from "@/ui/atoms/LinkWithChannel";
import { type ProductListItemFragment } from "@/gql/graphql";
import { formatMoneyRange } from "@/lib/utils";
import { type CardConfig } from "@/config/store.config";

import { SectionHeader } from "./SectionHeader";
import { generateSectionBackground, generatePatternOverlay, type SectionBackgroundConfig } from "@/lib/section-backgrounds";
import { useWishlist } from "@/lib/wishlist";
import { useQuickView } from "@/providers/QuickViewProvider";
import { ShareButton } from "@/ui/components/ProductSharing";

/** Days since creation to show "New" badge. Data-driven instead of position-based. */
const NEW_PRODUCT_DAYS = 30;

function isNewProduct(product: { created?: string | null }): boolean {
	if (!product.created) return false;
	const created = new Date(product.created).getTime();
	const cutoff = Date.now() - NEW_PRODUCT_DAYS * 24 * 60 * 60 * 1000;
	return created >= cutoff;
}

type ProductGridType = "newArrivals" | "bestSellers" | "onSale" | "featured";

interface ProductGridProps {
  products: readonly ProductListItemFragment[];
  type?: ProductGridType;
  title?: string;
  subtitle?: string;
  viewAllLink?: string;
  columns?: 2 | 3 | 4;
}

/**
 * ProductGrid Section
 * 
 * Versatile product grid for homepage sections.
 */
export function ProductGrid({
  products,
  type = "featured",
  title,
  subtitle,
  viewAllLink,
  columns = 4,
}: ProductGridProps) {
  const { homepage, branding, ecommerce } = useStoreConfig();
  const hasWishlist = useFeature("wishlist");
  const content = useContentConfig();
  
  // Get config for this section type
  // Force cast/access card config safely
  const sectionConfig = type === "featured" 
    ? { enabled: true, limit: 8, background: undefined, card: undefined } 
    : (homepage.sections[type] as any);

  const cardConfig = sectionConfig?.card as CardConfig | undefined;

  // Don't render if disabled
  if (sectionConfig.enabled === false) {
    return null;
  }

  // Limit products to config limit
  const limit = sectionConfig.limit || 8;
  const displayProducts = products.slice(0, limit);
  
  // Get titles from content config
  const getTitleFromContent = () => {
    switch (type) {
      case "newArrivals":
        return { title: content.homepage.newArrivalsTitle, subtitle: content.homepage.newArrivalsSubtitle, link: "/products?collections=new-arrivals" };
      case "bestSellers":
        return { title: content.homepage.bestSellersTitle, subtitle: content.homepage.bestSellersSubtitle, link: "/products?collections=best-sellers" };
      case "onSale":
        return { title: content.homepage.onSaleTitle, subtitle: content.homepage.onSaleSubtitle, link: "/products?collections=sale" };
      case "featured":
      default:
        return { title: content.homepage.featuredTitle, subtitle: content.homepage.featuredSubtitle, link: "/products" };
    }
  };
  
  const defaults = getTitleFromContent();
  const displayTitle = title || defaults.title;
  const displaySubtitle = subtitle || defaults.subtitle;
  const displayLink = viewAllLink || defaults.link;

  // Grid columns class
  const gridColsClass = {
    2: "sm:grid-cols-2",
    3: "sm:grid-cols-2 lg:grid-cols-3",
    4: "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
  }[columns];

  // Get background config for this section
  const backgroundConfig = sectionConfig.background as SectionBackgroundConfig | undefined;
  
  // Generate background styles
  const backgroundStyles = generateSectionBackground(backgroundConfig, branding);
  const patternOverlay = generatePatternOverlay(backgroundConfig, branding);

  const sectionStyles: React.CSSProperties = {
    ...backgroundStyles,
  };

  return (
    <section 
      className="premium-band py-16 sm:py-20"
      style={sectionStyles}
    >
      {/* Pattern overlay for pattern backgrounds */}
      {patternOverlay && (
        <div className="absolute inset-0 pointer-events-none" style={{ opacity: (backgroundConfig?.patternOpacity ?? 10) / 100 }}>
          <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id={patternOverlay.patternId} width="40" height="40" patternUnits="userSpaceOnUse">
                {backgroundConfig?.patternType === "grid" && <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1"/>}
                {backgroundConfig?.patternType === "dots" && <circle cx="10" cy="10" r="1.5" fill="currentColor"/>}
                {backgroundConfig?.patternType === "lines" && <path d="M 0 20 L 40 20" fill="none" stroke="currentColor" strokeWidth="1"/>}
                {backgroundConfig?.patternType === "waves" && (
                  <>
                    <path d="M 0 30 Q 15 20, 30 30 T 60 30" fill="none" stroke="currentColor" strokeWidth="1"/>
                    <path d="M 0 40 Q 15 50, 30 40 T 60 40" fill="none" stroke="currentColor" strokeWidth="1"/>
                  </>
                )}
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill={`url(#${patternOverlay.patternId})`} />
          </svg>
        </div>
      )}
      <div className="premium-band-content relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <SectionHeader
          title={displayTitle}
          subtitle={displaySubtitle}
          type={type === "onSale" ? "sale" : "products"}
          viewAllLink={displayLink}
          viewAllText={content.general.viewAllButton}
          align="left"
          showBadge={type === "onSale"}
          badgeText={content.product.saleBadgeText}
        />

        {/* Products Grid */}
        <div className={`mt-10 grid gap-6 ${gridColsClass}`}>
          {displayProducts.map((product, index) => (
            <ProductCard 
              key={product.id} 
              product={product} 
              index={index}
              showWishlist={hasWishlist}
              showSaleBadge={type === "onSale"}
              branding={branding}
              ecommerce={ecommerce}
              content={content}
              cardConfig={cardConfig}
            />
          ))}
        </div>

        {/* Mobile View All */}
        <div className="mt-8 text-center sm:hidden">
          <LinkWithChannel
            href={displayLink}
            className="inline-flex items-center gap-2 font-medium"
            style={{ color: branding.colors.primary }}
          >
            {content.general.viewAllButton}
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
 * Individual Product Card
 */
interface ProductCardProps {
  product: ProductListItemFragment;
  index: number;
  showWishlist: boolean;
  showSaleBadge: boolean;
  branding: any;
  ecommerce: any;
  content: any;
  cardConfig?: CardConfig;
}

function ProductCard({ 
  product, 
  index, 
  showWishlist, 
  showSaleBadge,
  branding,
  ecommerce: _ecommerce,
  content,
  cardConfig = {},
}: ProductCardProps) {
  const ui = useUiConfig();
  const showQuickView = ui.productCard?.showQuickView ?? false;
  const quickAddLabel = (content.product as { quickAddButton?: string })?.quickAddButton ?? "Quick add";
  const { openQuickView, prefetchQuickView } = useQuickView();
  const { addItem, removeItem, isInWishlist } = useWishlist();
  const isWishlisted = isInWishlist(product.id);
  
  const priceRange = formatMoneyRange({
    start: product.pricing?.priceRange?.start?.gross,
    stop: product.pricing?.priceRange?.stop?.gross,
  });

  const priceStart = product.pricing?.priceRange?.start?.gross?.amount;
  const priceStop = product.pricing?.priceRange?.stop?.gross?.amount;
  const isOnSale = priceStart && priceStop && priceStart < priceStop;
  
  const totalStock = product.variants?.reduce((sum, v) => sum + (v.quantityAvailable || 0), 0) ?? 0;
  const isInStock = totalStock > 0;
  
  const handleWishlistClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isWishlisted) {
      await removeItem(product.id);
    } else {
      await addItem({
        id: product.id,
        name: product.name,
        slug: product.slug,
        price: product.pricing?.priceRange?.start?.gross?.amount || 0,
        originalPrice: product.pricing?.priceRangeUndiscounted?.start?.gross?.amount,
        currency: product.pricing?.priceRange?.start?.gross?.currency || "USD",
        image: product.thumbnail?.url || "",
        imageAlt: product.thumbnail?.alt || product.name,
        category: product.category?.name || undefined,
        inStock: isInStock,
      });
    }
  };

  // Card Config Styles
  const getAspectRatioClass = () => {
    switch (cardConfig.aspectRatio) {
      case 'square': return 'aspect-square';
      case 'landscape': return 'aspect-[4/3]';
      case 'wide': return 'aspect-video';
      case 'portrait': 
      default: return 'aspect-square'; // Product cards default to square often, or portrait
    }
  };

  const getRadiusStyle = () => {
    if (cardConfig.borderRadius === 'none') return '0px';
    if (cardConfig.borderRadius === 'sm') return '4px';
    if (cardConfig.borderRadius === 'md') return '8px';
    if (cardConfig.borderRadius === 'lg') return '16px';
    if (cardConfig.borderRadius === 'full') return '24px';
    return `var(--store-radius)`;
  };

  const getShadowStyle = (isHovered: boolean) => {
    if (cardConfig.shadow === 'none') return 'none';
    const baseColor = branding.colors.primary;
    
    if (cardConfig.shadow === 'sm') return isHovered ? `0 4px 12px ${baseColor}20` : `0 1px 3px ${baseColor}10`;
    if (cardConfig.shadow === 'md') return isHovered ? `0 12px 24px -4px ${baseColor}25` : `0 4px 6px -1px ${baseColor}10`;
    if (cardConfig.shadow === 'lg') return isHovered ? `0 20px 40px -8px ${baseColor}30` : `0 10px 15px -3px ${baseColor}15`;

    // Default
    return isHovered 
      ? `0 12px 24px -8px ${baseColor}15`
      : `0 4px 16px -4px ${baseColor}10`;
  };

  const getTextSizeClass = () => {
    switch(cardConfig.textSize) {
      case 'sm': return 'text-sm';
      case 'base': return 'text-base';
      case 'lg': return 'text-lg';
      case 'xl': return 'text-xl';
      default: return 'text-base';
    }
  };

  const isTextCentered = cardConfig.textPosition === 'center' || cardConfig.textPosition === 'bottom-center';

  // Apply visual overrides
  const cardStyle = { 
    borderRadius: getRadiusStyle(),
    backgroundColor: cardConfig.backgroundColor || '#ffffff',
    borderColor: cardConfig.backgroundColor ? 'transparent' : undefined, // Remove border if custom bg
    opacity: (cardConfig.opacity ?? 100) / 100,
  };
  
  return (
    <div 
      className="group h-full animate-fade-in-up"
      style={{ 
        animationDelay: `${index * 40}ms`,
      }}
    >
      <LinkWithChannel href={`/products/${product.slug}`} className="flex h-full flex-col">
        <div
          className="relative overflow-hidden border border-neutral-200/50 transition-all duration-300 group-hover:-translate-y-1"
          style={{
            ...cardStyle,
            boxShadow: getShadowStyle(false),
          }}
          onMouseEnter={(e) => {
             e.currentTarget.style.boxShadow = getShadowStyle(true);
          }}
          onMouseLeave={(e) => {
             e.currentTarget.style.boxShadow = getShadowStyle(false);
          }}
        >
          {/* Product Image */}
          <div className={`${getAspectRatioClass()} relative overflow-hidden bg-neutral-100`}>
             <Image
                src={product.thumbnail?.url || ""}
                alt={product.thumbnail?.alt || product.name}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className={`object-${cardConfig.imageFit || 'cover'} transition-transform duration-700 group-hover:scale-105`}
             />
             
             {/* Gradient overlay for contrast if text is over image (only if specific config) */}
             {cardConfig.textPosition === 'center' && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center p-4 text-center">
                   <h3 className={`${getTextSizeClass()} font-bold text-white`}>{product.name}</h3>
                </div>
             )}
          </div>

          {/* Quick View & Badges (Overlay on image) */}
          <div className="absolute inset-0 pointer-events-none">
             <div className="absolute left-3 top-3 flex flex-col gap-2 pointer-events-auto">
               {(showSaleBadge || isOnSale) && (
                  <span className="rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide text-white"
                        style={{ backgroundColor: branding.colors.error, boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
                    {content.product.saleBadgeText}
                  </span>
               )}
               {isNewProduct(product) && (
                  <span className="rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide text-white"
                        style={{ backgroundColor: branding.colors.primary, boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
                    {content.product.newBadgeText}
                  </span>
               )}
             </div>

             {showQuickView && (
               <button
                 type="button"
                 onTouchStart={() => prefetchQuickView(product.slug)}
                 onClick={(e) => { e.preventDefault(); e.stopPropagation(); openQuickView(product.slug); }}
                 className="absolute bottom-3 right-3 pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-lg text-neutral-900 transition-all duration-200 hover:scale-110 active:scale-95 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0"
                 aria-label={quickAddLabel}
               >
                 <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
               </button>
             )}
             
             <div className="absolute right-3 top-3 pointer-events-auto flex flex-col gap-2">
               {showWishlist && (
                  <button
                    className="rounded-full bg-white/90 p-2 shadow-sm transition-all hover:bg-white hover:scale-105"
                    onClick={handleWishlistClick}
                    style={{ color: isWishlisted ? branding.colors.error : '#666' }}
                  >
                     <svg className="h-5 w-5" fill={isWishlisted ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={isWishlisted ? 0 : 2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                  </button>
               )}
               <ShareButton
                 variant="icon"
                 productName={product.name}
                 productSlug={product.slug}
                 productImage={product.thumbnail?.url || null}
                 className="rounded-full bg-white/90 p-2 shadow-sm text-neutral-500 transition-all hover:bg-white hover:scale-105 hover:text-neutral-700"
                 iconClassName="h-5 w-5"
               />
             </div>
          </div>
        </div>

        {/* Product Info (Below image) - Hide if textPosition is center (handled above) */}
        {cardConfig.textPosition !== 'center' && (
          <div className={`mt-4 ${isTextCentered ? 'text-center' : 'text-left'}`}>
            <h3 
               className={`${getTextSizeClass()} font-semibold transition-colors group-hover:text-primary`}
               style={{ 
                 color: cardConfig.textColor || branding.colors.text,
                 '--tw-text-opacity': 1,
               } as React.CSSProperties}
            >
              {product.name}
            </h3>
            <p className="mt-1 text-sm text-neutral-500">
              {product.category?.name}
            </p>
            <p className="mt-2 font-semibold" style={{ color: cardConfig.textColor || branding.colors.text }}>
              {priceRange}
            </p>
          </div>
        )}
      </LinkWithChannel>
    </div>
  );
}

export async function ProductGridServer({
  type,
  collectionSlug,
  channel,
  ...props
}: ProductGridProps & { collectionSlug?: string; channel: string }) {
  return <ProductGrid type={type} {...props} products={[]} />;
}
