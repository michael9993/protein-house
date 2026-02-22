"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useCallback } from "react";
import { Heart } from "lucide-react";
import { type ProductListItemFragment } from "@/gql/graphql";
import { formatMoneyRange } from "@/lib/utils";
import { t } from "@/lib/language";
import { ShareButton } from "@/ui/components/ProductSharing";
import { useBadgeStyle, useContentConfig, useEcommerceSettings, useProductDetailText } from "@/providers/StoreConfigProvider";
import { getProductShippingEstimate, formatEstimate } from "@/lib/shipping";
import { buildProductUrl, withChannel } from "@/lib/urls";
import {
	getProductImage,
	getProductAlt,
	getProductBrand,
	getDiscountPercent,
	getTotalStock,
	isNewProduct,
	getBadgePositionClasses,
	getCardHoverClasses,
	type BadgeLabels,
	type ProductCardConfig,
} from "./utils";

const radiusMap: Record<string, string> = {
	none: "rounded-none",
	sm: "rounded-sm",
	md: "rounded-md",
	lg: "rounded-lg",
	xl: "rounded-xl",
	full: "rounded-full",
};

export interface HomepageProductCardProps {
	product: ProductListItemFragment;
	channel: string;
	storeName: string;
	accent: string;
	badgeLabels: BadgeLabels;
	viewDetailsText: string;
	performanceFallback: string;
	onQuickView: (slug: string) => void;
	onPrefetch: (slug: string) => void;
	wishlistEnabled: boolean;
	isWishlisted: boolean;
	onWishlistToggle: (product: ProductListItemFragment) => void;
	cardConfig: ProductCardConfig;
	/** Image loading strategy — defaults to lazy */
	loading?: "eager" | "lazy";
	/** Image priority hint for Next.js */
	priority?: boolean;
}

/**
 * Unified product card used across all homepage sections,
 * related products, and any other product grid/carousel.
 *
 * Badge styling matches the PLP ProductCard (useBadgeStyle inline colors).
 */
export function HomepageProductCard({
	product,
	channel,
	storeName,
	accent,
	badgeLabels,
	viewDetailsText,
	performanceFallback,
	onQuickView,
	onPrefetch,
	wishlistEnabled,
	isWishlisted,
	onWishlistToggle,
	cardConfig,
	loading,
	priority,
}: HomepageProductCardProps) {
	const image = getProductImage(product);
	const brand = getProductBrand(product, storeName);
	const content = useContentConfig();
	const ecommerce = useEcommerceSettings();
	const saleBadgeStyle = useBadgeStyle("sale");
	const outOfStockBadgeStyle = useBadgeStyle("outOfStock");
	const lowStockBadgeStyle = useBadgeStyle("lowStock");

	// Compute badge data matching PLP ProductCard
	const lowStockThreshold = ecommerce.inventory?.lowStockThreshold ?? 5;
	const totalStock = getTotalStock(product);
	const isInStock = totalStock > 0;
	const isLowStock = totalStock > 0 && totalStock <= lowStockThreshold;
	const discountPercent = getDiscountPercent(product);
	const hasDiscountBadge = discountPercent > 0;
	const priceRange = formatMoneyRange({
		start: product.pricing?.priceRange?.start?.gross,
		stop: product.pricing?.priceRange?.stop?.gross,
	});
	const originalRange = formatMoneyRange({
		start: product.pricing?.priceRangeUndiscounted?.start?.gross,
		stop: product.pricing?.priceRangeUndiscounted?.stop?.gross,
	});
	const hasDiscount = priceRange && originalRange && priceRange !== originalRange;
	const prefetchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const handleMouseEnter = useCallback(() => {
		prefetchTimeoutRef.current = setTimeout(() => onPrefetch(product.slug), 120);
	}, [product.slug, onPrefetch]);

	const handleMouseLeave = useCallback(() => {
		if (prefetchTimeoutRef.current) {
			clearTimeout(prefetchTimeoutRef.current);
			prefetchTimeoutRef.current = null;
		}
	}, []);

	const handleQuickViewClick = (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		onQuickView(product.slug);
	};

	const handleWishlistClick = (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		onWishlistToggle(product);
	};

	return (
		<Link
			href={withChannel(channel, buildProductUrl(product.slug))}
			className={`group relative flex h-full flex-col overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm transition-all duration-300 ${getCardHoverClasses(cardConfig.hoverEffect)}`}
			onMouseEnter={handleMouseEnter}
			onMouseLeave={handleMouseLeave}
		>
			{/* Product image area */}
			<div className="relative aspect-square bg-gradient-to-br from-neutral-50 via-white to-neutral-100">
				{/* Badges — same style as PLP ProductCard */}
				<div className={`absolute ${getBadgePositionClasses(cardConfig.badgePosition)} z-10 flex flex-col gap-1.5`}>
					{hasDiscountBadge && (
						<span
							className={`${radiusMap[saleBadgeStyle.borderRadius] || "rounded"} px-2 py-1 text-xs font-bold shadow-sm`}
							style={{ backgroundColor: saleBadgeStyle.backgroundColor, color: saleBadgeStyle.color }}
						>
							-{discountPercent}%
						</span>
					)}
					{!isInStock && (
						<span
							className={`${radiusMap[outOfStockBadgeStyle.borderRadius] || "rounded-full"} px-2 py-0.5 text-[10px] font-medium shadow-sm`}
							style={{ backgroundColor: outOfStockBadgeStyle.backgroundColor, color: outOfStockBadgeStyle.color }}
						>
							{content.product.outOfStockText || badgeLabels.outOfStock}
						</span>
					)}
					{isLowStock && (
						<span
							className={`${radiusMap[lowStockBadgeStyle.borderRadius] || "rounded"} inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-semibold leading-none`}
							style={{ backgroundColor: lowStockBadgeStyle.backgroundColor, color: lowStockBadgeStyle.color }}
						>
							<svg className="h-2.5 w-2.5 shrink-0" viewBox="0 0 16 16" fill="currentColor"><path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/></svg>
							{(content.product.lowStockText || badgeLabels.lowStock).replace("{count}", String(totalStock))}
						</span>
					)}
				</div>
				{/* Brand */}
				{cardConfig.showBrandLabel !== false && (
					<span className="absolute end-4 top-4 z-10 rounded-full border border-white/60 bg-white/80 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-600">
						{brand}
					</span>
				)}
				{/* Wishlist + Share buttons */}
				<div className="absolute end-4 top-14 z-10 flex flex-col gap-2">
					{wishlistEnabled && (
						<button
							type="button"
							onClick={handleWishlistClick}
							className="flex h-9 w-9 items-center justify-center rounded-full border border-white/60 bg-white/90 shadow-sm transition-all duration-200 hover:scale-110 hover:shadow-md"
							aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
						>
							<Heart
								size={16}
								className={isWishlisted ? "fill-red-500 text-red-500" : "text-neutral-500"}
							/>
						</button>
					)}
					<ShareButton
						variant="icon"
						productName={t(product)}
						productSlug={product.slug}
						productImage={getProductImage(product) || null}
						className="flex h-9 w-9 items-center justify-center rounded-full border border-white/60 bg-white/90 shadow-sm text-neutral-500 transition-all duration-200 hover:scale-110 hover:shadow-md hover:text-neutral-700"
						iconClassName="h-4 w-4"
					/>
				</div>
				{image ? (
					<Image
						src={image}
						alt={getProductAlt(product)}
						fill
						loading={loading}
						priority={priority}
						className={`${cardConfig.imageFit === "contain" ? "object-contain" : "object-cover"} transition duration-700 group-hover:scale-105`}
						sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
					/>
				) : (
					<div className="absolute inset-6 rounded-2xl border border-dashed border-neutral-200" />
				)}
				{/* Hover overlay */}
				<div
					className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 transition duration-300 group-hover:opacity-100 max-sm:opacity-100"
					aria-hidden="true"
				/>
				{/* Quick View button */}
				<button
					type="button"
					onClick={handleQuickViewClick}
					onTouchStart={() => onPrefetch(product.slug)}
					className="absolute bottom-6 start-0 end-0 flex translate-y-3 justify-center opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100 max-sm:translate-y-0 max-sm:opacity-100"
				>
					<span
						className="rounded-full px-6 py-2 text-[11px] font-bold uppercase tracking-[0.3em] text-white shadow-lg transition-transform hover:scale-105"
						style={{ backgroundColor: accent }}
					>
						{viewDetailsText}
					</span>
				</button>
			</div>
			{/* Product info */}
			<div className="border-t border-neutral-100 px-5 pb-5 pt-4">
				<h3 className="line-clamp-2 text-sm font-black uppercase tracking-tight text-neutral-900">
					{t(product)}
				</h3>
				<div className="mt-2 flex items-center justify-between">
					<div>
						<div className="text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-500">
							{(product.category ? t(product.category) : null) ?? performanceFallback}
						</div>
						<div className="mt-2 text-lg font-black" style={{ color: accent }}>
							{priceRange || "N/A"}
						</div>
						{hasDiscount && (
							<div className="text-xs text-neutral-400 line-through">{originalRange}</div>
						)}
					</div>
					{cardConfig.showRating !== false && product.rating != null && product.rating > 0 && (
						<div className="text-end text-xs font-semibold text-neutral-500">
							{product.rating.toFixed(1)} / 5
						</div>
					)}
				</div>
			</div>
			<HomepageDeliveryBadge metadata={product.metadata} />
		</Link>
	);
}

function HomepageDeliveryBadge({ metadata }: { metadata?: Array<{ key: string; value: string }> | null }) {
	const ecommerce = useEcommerceSettings();
	const pdText = useProductDetailText();
	if (!ecommerce.shipping?.showEstimatedDelivery) return null;
	const est = getProductShippingEstimate(metadata);
	if (!est) return null;
	const days = formatEstimate(est, ecommerce.shipping.estimatedDeliveryFormat ?? "range");
	const label = pdText.deliveryEstimateLabel?.replace("{days}", days) ?? `Ships in ${days} days`;
	return <p className="mt-1 truncate px-4 pb-2 text-[10px] text-neutral-500">{label}</p>;
}
