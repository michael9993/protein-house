"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useCallback, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Heart } from "lucide-react";
import { useRecentlyViewed, type RecentlyViewedItem } from "@/lib/recently-viewed";
import {
	useFeature,
	useBranding,
	useStoreInfo,
	useContentConfig,
	useUiConfig,
	useBadgeStyle,
} from "@/providers/StoreConfigProvider";
import { useQuickView } from "@/providers/QuickViewProvider";
import { useWishlist } from "@/lib/wishlist";
import { ShareButton } from "@/ui/components/ProductSharing";
import {
	getCardHoverClasses,
	getBadgePositionClasses,
	isNewProduct,
	type ProductCardConfig,
	type BadgeLabels,
} from "./home/utils";

const radiusMap: Record<string, string> = {
	none: "rounded-none",
	sm: "rounded-sm",
	md: "rounded-md",
	lg: "rounded-lg",
	xl: "rounded-xl",
	full: "rounded-full",
};

interface RecentlyViewedProductsProps {
	channel: string;
	/** Current product ID to exclude (on PDP) */
	excludeProductId?: string;
	/** Max products to show */
	maxItems?: number;
}

// ---------------------------------------------------------------------------
// Badge helpers for RecentlyViewedItem
// ---------------------------------------------------------------------------

function getItemDiscountPercent(item: RecentlyViewedItem): number {
	const price = item.priceAmount ?? 0;
	const orig = item.originalPriceAmount ?? 0;
	if (!orig || orig <= price || price <= 0) return 0;
	return Math.round(((orig - price) / orig) * 100);
}

// ---------------------------------------------------------------------------
// V6-style ProductCard — matches BestSellers / TrendingProducts
// ---------------------------------------------------------------------------

function ProductCard({
	item,
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
}: {
	item: RecentlyViewedItem;
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
	onWishlistToggle: (item: RecentlyViewedItem) => void;
	cardConfig: ProductCardConfig;
}) {
	const prefetchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const content = useContentConfig();
	const saleBadgeStyle = useBadgeStyle("sale");
	const outOfStockBadgeStyle = useBadgeStyle("outOfStock");
	const lowStockBadgeStyle = useBadgeStyle("lowStock");

	const brand = item.brand || item.category || storeName;
	const stock = item.totalStock ?? (item.isAvailable ? 10 : 0);
	const isInStock = stock > 0;
	const isLowStock = stock > 0 && stock <= 5;
	const discountPercent = getItemDiscountPercent(item);
	const hasDiscountBadge = discountPercent > 0;

	const handleMouseEnter = useCallback(() => {
		prefetchTimeoutRef.current = setTimeout(() => onPrefetch(item.slug), 120);
	}, [item.slug, onPrefetch]);

	const handleMouseLeave = useCallback(() => {
		if (prefetchTimeoutRef.current) {
			clearTimeout(prefetchTimeoutRef.current);
			prefetchTimeoutRef.current = null;
		}
	}, []);

	const handleQuickViewClick = (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		onQuickView(item.slug);
	};

	const handleWishlistClick = (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		onWishlistToggle(item);
	};

	return (
		<Link
			href={`/${encodeURIComponent(channel)}/products/${item.slug}`}
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
							className={`${radiusMap[lowStockBadgeStyle.borderRadius] || "rounded-full"} px-2 py-0.5 text-[10px] font-medium shadow-sm`}
							style={{ backgroundColor: lowStockBadgeStyle.backgroundColor, color: lowStockBadgeStyle.color }}
						>
							{(content.product.lowStockText || badgeLabels.lowStock).replace("{count}", String(stock))}
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
						productName={item.name}
						productSlug={item.slug}
						productImage={item.thumbnail}
						className="flex h-9 w-9 items-center justify-center rounded-full border border-white/60 bg-white/90 shadow-sm text-neutral-500 transition-all duration-200 hover:scale-110 hover:shadow-md hover:text-neutral-700"
						iconClassName="h-4 w-4"
					/>
				</div>
				{item.thumbnail ? (
					<Image
						src={item.thumbnail}
						alt={item.thumbnailAlt || item.name}
						fill
						className={`${cardConfig.imageFit === "contain" ? "object-contain" : "object-cover"} transition duration-700 group-hover:scale-105`}
						sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
						loading="lazy"
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
					onTouchStart={() => onPrefetch(item.slug)}
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
			{/* Product info — matching homepage card layout */}
			<div className="border-t border-neutral-100 px-5 pb-5 pt-4">
				<h3 className="line-clamp-2 text-sm font-black uppercase tracking-tight text-neutral-900">
					{item.name}
				</h3>
				<div className="mt-2 flex items-center justify-between">
					<div>
						<div className="text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-500">
							{item.category ?? performanceFallback}
						</div>
						<div className="mt-2 text-lg font-black" style={{ color: accent }}>
							{item.price || "N/A"}
						</div>
						{item.originalPrice && (
							<div className="text-xs text-neutral-400 line-through">{item.originalPrice}</div>
						)}
					</div>
					{cardConfig.showRating !== false && item.rating != null && item.rating > 0 && (
						<div className="text-end text-xs font-semibold text-neutral-500">
							{item.rating.toFixed(1)} / 5
						</div>
					)}
				</div>
			</div>
		</Link>
	);
}

// ---------------------------------------------------------------------------
// Main section with horizontal carousel
// ---------------------------------------------------------------------------

export function RecentlyViewedProducts({
	channel,
	excludeProductId,
	maxItems = 10,
}: RecentlyViewedProductsProps) {
	const enabled = useFeature("recentlyViewed");
	const { items } = useRecentlyViewed();
	const { colors } = useBranding();
	const storeInfo = useStoreInfo();
	const contentConfig = useContentConfig();
	const ui = useUiConfig();
	const cardConfig: ProductCardConfig = ui.productCard;
	const { openQuickView, prefetchQuickView } = useQuickView();
	const wishlistEnabled = useFeature("wishlist");
	const { addItem, removeItem, isInWishlist } = useWishlist();
	const scrollContainerRef = useRef<HTMLDivElement>(null);
	const [showLeftArrow, setShowLeftArrow] = useState(false);
	const [showRightArrow, setShowRightArrow] = useState(false);

	const homepageContent = contentConfig.homepage;
	const subLabel = homepageContent.recentlyViewedSubLabel || "Your History";
	const title = homepageContent.recentlyViewedTitle || "Recently Viewed";
	const subtitle = homepageContent.recentlyViewedSubtitle || "Products you've looked at recently";
	const viewDetailsText = homepageContent.viewDetailsButton || "View details";
	const performanceFallback = homepageContent.performanceFallback || "Performance";
	const storeName = storeInfo.name || "Mansour Shoes";
	const accent = colors.primary;

	// Badge labels — full set matching homepage cards
	const badgeLabels: BadgeLabels = {
		outOfStock: homepageContent.outOfStockBadgeLabel || "Out of stock",
		sale: homepageContent.saleBadgeLabel || "Sale",
		off: homepageContent.saleBadgeOffText || "OFF",
		lowStock: homepageContent.lowStockBadgeLabel || "Low stock",
		new: homepageContent.newBadgeLabel || "New",
		featured: homepageContent.featuredBadgeLabel || "Featured",
	};

	// Wishlist toggle handler
	const handleWishlistToggle = useCallback(
		(item: RecentlyViewedItem) => {
			if (isInWishlist(item.id)) {
				removeItem(item.id);
			} else {
				const amount = item.priceAmount ?? (parseFloat(item.price.replace(/[^0-9.]/g, "")) || 0);
				const currency = item.priceCurrency ?? "USD";
				addItem({
					id: item.id,
					name: item.name,
					slug: item.slug,
					price: amount,
					originalPrice: item.originalPriceAmount,
					currency,
					image: item.thumbnail || "",
					imageAlt: item.thumbnailAlt || item.name,
					category: item.category || undefined,
					inStock: item.isAvailable,
					channel,
				});
			}
		},
		[addItem, removeItem, isInWishlist],
	);

	// Filter out excluded product and limit
	const displayItems = items
		.filter((item) => item.id !== excludeProductId)
		.slice(0, maxItems);

	// Detect RTL
	const isRTL = typeof document !== "undefined" && document.documentElement.dir === "rtl";

	// Scroll position check for arrows
	const checkScrollPosition = useCallback(() => {
		if (!scrollContainerRef.current) return;
		const el = scrollContainerRef.current;
		const { scrollLeft, scrollWidth, clientWidth } = el;
		const maxScroll = scrollWidth - clientWidth;
		if (maxScroll <= 0) {
			setShowLeftArrow(false);
			setShowRightArrow(false);
			return;
		}
		if (isRTL) {
			const rtlMin = -maxScroll;
			setShowLeftArrow(scrollLeft < -20);
			setShowRightArrow(scrollLeft > rtlMin + 20);
		} else {
			setShowLeftArrow(scrollLeft > 20);
			setShowRightArrow(scrollLeft < maxScroll - 20);
		}
	}, [isRTL]);

	useEffect(() => {
		const container = scrollContainerRef.current;
		if (!container) return;
		checkScrollPosition();
		container.addEventListener("scroll", checkScrollPosition);
		window.addEventListener("resize", checkScrollPosition);
		return () => {
			container.removeEventListener("scroll", checkScrollPosition);
			window.removeEventListener("resize", checkScrollPosition);
		};
	}, [displayItems.length, isRTL, checkScrollPosition]);

	const scroll = useCallback(
		(direction: "prev" | "next") => {
			if (!scrollContainerRef.current) return;
			const container = scrollContainerRef.current;
			const scrollAmount = 300;
			const actualDirection = isRTL
				? direction === "next"
					? -1
					: 1
				: direction === "next"
					? 1
					: -1;
			container.scrollTo({
				left: container.scrollLeft + scrollAmount * actualDirection,
				behavior: "smooth",
			});
		},
		[isRTL],
	);

	if (!enabled || displayItems.length === 0) return null;

	return (
		<section className="bg-white py-20" aria-label={title}>
			<div className="mx-auto max-w-[var(--design-container-max)] px-6 lg:px-12">
				{/* V6-style section header — matching Best Sellers */}
				<div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
					<div>
						<p className="text-xs font-bold uppercase tracking-[0.3em] text-neutral-500">
							{subLabel}
						</p>
						<h2 className="mt-3 text-4xl font-black uppercase italic tracking-tighter text-neutral-900 md:text-5xl">
							{title}
						</h2>
						{subtitle && (
							<p className="mt-3 max-w-2xl text-sm font-medium text-neutral-500 md:text-base">
								{subtitle}
							</p>
						)}
					</div>
				</div>

				{/* Carousel */}
				<div className="relative mt-8">
					{showLeftArrow && (
						<button
							type="button"
							onClick={() => scroll("prev")}
							className="absolute start-0 top-1/2 z-50 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 bg-white/90 shadow-sm backdrop-blur-sm transition-all duration-200 hover:scale-105 hover:bg-white"
							aria-label="Previous"
						>
							<ChevronLeft className="h-5 w-5 text-neutral-600 rtl:rotate-180" strokeWidth={1.5} />
						</button>
					)}
					{showRightArrow && (
						<button
							type="button"
							onClick={() => scroll("next")}
							className="absolute end-0 top-1/2 z-50 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 bg-white/90 shadow-sm backdrop-blur-sm transition-all duration-200 hover:scale-105 hover:bg-white"
							aria-label="Next"
						>
							<ChevronRight className="h-5 w-5 text-neutral-600 rtl:rotate-180" strokeWidth={1.5} />
						</button>
					)}
					<div ref={scrollContainerRef} className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide">
						{displayItems.map((item) => (
							<div key={item.id} className="w-[260px] flex-none sm:w-[280px]">
								<ProductCard
									item={item}
									channel={channel}
									storeName={storeName}
									accent={accent}
									badgeLabels={badgeLabels}
									viewDetailsText={viewDetailsText}
									performanceFallback={performanceFallback}
									onQuickView={openQuickView}
									onPrefetch={prefetchQuickView}
									wishlistEnabled={wishlistEnabled}
									isWishlisted={isInWishlist(item.id)}
									onWishlistToggle={handleWishlistToggle}
									cardConfig={cardConfig}
								/>
							</div>
						))}
					</div>
				</div>
			</div>
		</section>
	);
}
