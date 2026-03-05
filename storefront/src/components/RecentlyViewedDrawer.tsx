"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { Drawer } from "vaul";
import { Clock, X, Trash2, Heart } from "lucide-react";
import { useRecentlyViewed, type RecentlyViewedItem } from "@/lib/recently-viewed";
import { useFeature, useBranding, useContentConfig, useProductCardConfig, useBadgeStyle } from "@/providers/StoreConfigProvider";
import { useWishlist } from "@/lib/wishlist";
import { useQuickView } from "@/providers/QuickViewProvider";
import { buildProductUrl, withChannel } from "@/lib/urls";
import { ShareButton } from "@/ui/components/ProductSharing";
import {
	getCardHoverClasses,
	getBadgePositionClasses,
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

// ---------------------------------------------------------------------------
// V6-style mini product card for the drawer (same design as "You May Also Like")
// ---------------------------------------------------------------------------

function DrawerProductCard({
	item,
	channel,
	accent,
	cardConfig,
	viewDetailsText,
	onClose,
	onRemove,
	onQuickView,
	wishlistEnabled,
	isWishlisted,
	onWishlistToggle,
	badgeLabels,
}: {
	item: RecentlyViewedItem;
	channel: string;
	accent: string;
	cardConfig: ProductCardConfig;
	viewDetailsText: string;
	onClose: () => void;
	onRemove: (id: string) => void;
	onQuickView: (slug: string) => void;
	wishlistEnabled: boolean;
	isWishlisted: boolean;
	onWishlistToggle: (item: RecentlyViewedItem) => void;
	badgeLabels: BadgeLabels;
}) {
	const content = useContentConfig();
	const saleBadgeStyle = useBadgeStyle("sale");
	const outOfStockBadgeStyle = useBadgeStyle("outOfStock");
	const lowStockBadgeStyle = useBadgeStyle("lowStock");

	const stock = item.totalStock ?? (item.isAvailable ? 10 : 0);
	const isInStock = stock > 0;
	const isLowStock = stock > 0 && stock <= 5;
	const price = item.priceAmount ?? 0;
	const orig = item.originalPriceAmount ?? 0;
	const discountPercent = orig > price && price > 0 ? Math.round(((orig - price) / orig) * 100) : 0;
	const hasDiscountBadge = discountPercent > 0;

	const handleWishlistClick = (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		onWishlistToggle(item);
	};

	const handleRemoveClick = (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		onRemove(item.id);
	};

	const handleQuickViewClick = (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		onClose();
		// Small delay so drawer closes before quick view modal opens
		setTimeout(() => onQuickView(item.slug), 200);
	};

	return (
		<div className="group relative">
			{/* Remove button — always accessible */}
			<button
				type="button"
				onClick={handleRemoveClick}
				className="absolute -end-1.5 -top-1.5 z-20 flex h-6 w-6 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-400 shadow-sm transition-all hover:bg-neutral-100 hover:text-neutral-700"
				aria-label="Remove"
			>
				<X className="h-3 w-3" />
			</button>

			<Link
				href={withChannel(channel, buildProductUrl(item.slug))}
				onClick={onClose}
				className={`relative flex h-full flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm transition-all duration-300 ${getCardHoverClasses(cardConfig.hoverEffect)}`}
			>
				{/* Image area */}
				<div className="relative aspect-square bg-gradient-to-br from-neutral-50 via-white to-neutral-100">
					{/* Badges — same style as PLP ProductCard */}
					<div className={`absolute ${getBadgePositionClasses(cardConfig.badgePosition)} z-10 flex flex-col gap-1`}>
						{hasDiscountBadge && (
							<span
								className={`${radiusMap[saleBadgeStyle.borderRadius] || "rounded"} px-1.5 py-0.5 text-[8px] font-bold shadow-sm`}
								style={{ backgroundColor: saleBadgeStyle.backgroundColor, color: saleBadgeStyle.color }}
							>
								-{discountPercent}%
							</span>
						)}
						{!isInStock && (
							<span
								className={`${radiusMap[outOfStockBadgeStyle.borderRadius] || "rounded-full"} px-1.5 py-0.5 text-[8px] font-medium shadow-sm`}
								style={{ backgroundColor: outOfStockBadgeStyle.backgroundColor, color: outOfStockBadgeStyle.color }}
							>
								{content.product.outOfStockText || badgeLabels.outOfStock}
							</span>
						)}
						{isLowStock && (
							<span
								className={`${radiusMap[lowStockBadgeStyle.borderRadius] || "rounded-full"} px-1.5 py-0.5 text-[8px] font-medium shadow-sm`}
								style={{ backgroundColor: lowStockBadgeStyle.backgroundColor, color: lowStockBadgeStyle.color }}
							>
								{(content.product.lowStockText || badgeLabels.lowStock).replace("{count}", String(stock))}
							</span>
						)}
					</div>

					{/* Wishlist + Share buttons */}
					<div className="absolute end-2 top-2 z-10 flex flex-col gap-1.5">
						{wishlistEnabled && (
							<button
								type="button"
								onClick={handleWishlistClick}
								className="flex h-7 w-7 items-center justify-center rounded-full border border-white/60 bg-white/90 shadow-sm transition-all duration-200 hover:scale-110 hover:shadow-md"
								aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
							>
								<Heart
									size={12}
									className={isWishlisted ? "fill-red-500 text-red-500" : "text-neutral-500"}
								/>
							</button>
						)}
						<ShareButton
							variant="icon"
							productName={item.name}
							productSlug={item.slug}
							productImage={item.thumbnail}
							className="flex h-7 w-7 items-center justify-center rounded-full border border-white/60 bg-white/90 shadow-sm text-neutral-500 transition-all duration-200 hover:scale-110 hover:shadow-md hover:text-neutral-700"
							iconClassName="h-3 w-3"
						/>
					</div>

					{/* Product image */}
					{item.thumbnail ? (
						<Image
							src={item.thumbnail}
							alt={item.thumbnailAlt || item.name}
							fill
							sizes="180px"
							className={`${cardConfig.imageFit === "contain" ? "object-contain" : "object-cover"} transition duration-500 group-hover:scale-105`}
							loading="lazy"
						/>
					) : (
						<div className="absolute inset-4 rounded-xl border border-dashed border-neutral-200" />
					)}

					{/* Hover gradient overlay */}
					<div
						className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 transition duration-300 group-hover:opacity-100"
						aria-hidden="true"
					/>

					{/* Quick View button */}
					<button
						type="button"
						onClick={handleQuickViewClick}
						className="absolute bottom-3 start-0 end-0 flex translate-y-2 justify-center opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100"
					>
						<span
							className="rounded-full px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.2em] text-white shadow-lg transition-transform hover:scale-105"
							style={{ backgroundColor: accent }}
						>
							{viewDetailsText}
						</span>
					</button>
				</div>

				{/* Info section */}
				<div className="border-t border-neutral-100 px-3 pb-3 pt-2.5">
					<h4 className="line-clamp-2 text-xs font-black uppercase tracking-tight text-neutral-900">
						{item.name}
					</h4>
					<div className="mt-1.5">
						{item.category && (
							<div className="text-[8px] font-bold uppercase tracking-[0.2em] text-neutral-500">
								{item.category}
							</div>
						)}
						<div className="mt-1 text-sm font-black" style={{ color: accent }}>
							{item.price}
						</div>
						{item.originalPrice && (
							<div className="text-[10px] text-neutral-400 line-through">{item.originalPrice}</div>
						)}
					</div>
				</div>
			</Link>
		</div>
	);
}

// ---------------------------------------------------------------------------
// Drawer content
// ---------------------------------------------------------------------------

function RecentlyViewedDrawerContent({
	open,
	onOpenChange,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}) {
	const { items, removeItem: removeRecentItem, clearAll, channel } = useRecentlyViewed();
	const { colors } = useBranding();
	const contentConfig = useContentConfig();
	const cardConfig = useProductCardConfig("recentlyViewed");
	const wishlistEnabled = useFeature("wishlist");
	const { addItem, removeItem, isInWishlist } = useWishlist();
	const { openQuickView } = useQuickView();
	const isRTL = typeof document !== "undefined" && document.documentElement.dir === "rtl";

	const homepageContent = contentConfig.homepage;
	const title = homepageContent.recentlyViewedTitle || "Recently Viewed";
	const viewDetailsText = homepageContent.viewDetailsButton || "Quick view";

	const badgeLabels: BadgeLabels = {
		outOfStock: homepageContent.outOfStockBadgeLabel || "Out of stock",
		sale: homepageContent.saleBadgeLabel || "Sale",
		off: homepageContent.saleBadgeOffText || "OFF",
		lowStock: homepageContent.lowStockBadgeLabel || "Low stock",
		new: homepageContent.newBadgeLabel || "New",
		featured: homepageContent.featuredBadgeLabel || "Featured",
	};

	const handleWishlistToggle = (item: RecentlyViewedItem) => {
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
	};

	return (
		<Drawer.Root open={open} onOpenChange={onOpenChange} direction="bottom">
			<Drawer.Portal>
				<Drawer.Overlay className="fixed inset-0 z-[9998] bg-black/50" />
				<Drawer.Content
					className="fixed inset-x-0 bottom-0 z-[9999] mx-auto flex max-h-[85dvh] flex-col rounded-t-2xl bg-neutral-50 outline-none sm:inset-x-4 sm:bottom-4 sm:max-h-[75vh] sm:max-w-lg sm:rounded-2xl"
					style={{
						boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
						paddingBottom: "env(safe-area-inset-bottom, 0px)",
					}}
					dir={isRTL ? "rtl" : "ltr"}
					aria-describedby={undefined}
				>
					<Drawer.Handle className="mx-auto mt-3 mb-1 h-1.5 w-12 shrink-0 rounded-full bg-neutral-300" />

					{/* Header */}
					<div className="flex items-center justify-between border-b border-neutral-200 px-5 py-3">
						<div className="flex items-center gap-2.5">
							<div
								className="flex h-8 w-8 items-center justify-center rounded-full"
								style={{ backgroundColor: `${colors.primary}15` }}
							>
								<Clock className="h-4 w-4" style={{ color: colors.primary }} />
							</div>
							<Drawer.Title className="text-base font-bold text-neutral-900">
								{title}
								<span className="ms-1.5 text-sm font-normal text-neutral-400">({items.length})</span>
							</Drawer.Title>
						</div>
						<div className="flex items-center gap-1">
							{items.length > 0 && (
								<button
									type="button"
									onClick={() => {
										clearAll();
										onOpenChange(false);
									}}
									className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-red-500"
									aria-label="Clear all"
								>
									<Trash2 className="h-4 w-4" />
								</button>
							)}
							<button
								type="button"
								onClick={() => onOpenChange(false)}
								className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600"
								aria-label="Close"
							>
								<X className="h-4 w-4" />
							</button>
						</div>
					</div>

					{/* Items grid */}
					<div
						className="flex-1 overflow-y-auto px-4 py-4"
						style={{ WebkitOverflowScrolling: "touch" } as React.CSSProperties}
					>
						{items.length === 0 ? (
							<div className="flex flex-col items-center justify-center py-12 text-center">
								<Clock className="mb-3 h-10 w-10 text-neutral-300" />
								<p className="text-sm font-medium text-neutral-500">No recently viewed products</p>
								<p className="mt-1 text-xs text-neutral-400">Products you view will appear here</p>
							</div>
						) : (
							<div className="grid grid-cols-2 gap-3">
								{items.map((item) => (
									<DrawerProductCard
										key={item.id}
										item={item}
										channel={channel}
										accent={colors.primary}
										cardConfig={cardConfig}
										viewDetailsText={viewDetailsText}
										onClose={() => onOpenChange(false)}
										onRemove={removeRecentItem}
										onQuickView={openQuickView}
										wishlistEnabled={wishlistEnabled}
										isWishlisted={isInWishlist(item.id)}
										onWishlistToggle={handleWishlistToggle}
										badgeLabels={badgeLabels}
									/>
								))}
							</div>
						)}
					</div>
				</Drawer.Content>
			</Drawer.Portal>
		</Drawer.Root>
	);
}

// ---------------------------------------------------------------------------
// Floating button (portal)
// ---------------------------------------------------------------------------

export function RecentlyViewedFloatingButton() {
	const [mounted, setMounted] = useState(false);
	const [drawerOpen, setDrawerOpen] = useState(false);
	const enabled = useFeature("recentlyViewed");
	const { items } = useRecentlyViewed();
	const { colors } = useBranding();

	useEffect(() => {
		setMounted(true);
	}, []);

	if (!enabled || items.length === 0) return null;

	const button = (
		<>
			<button
				type="button"
				onClick={() => setDrawerOpen(true)}
				aria-label={`Recently viewed (${items.length})`}
				className="fixed left-5 z-[100] flex h-12 w-12 items-center justify-center rounded-full border border-neutral-200 bg-white shadow-[0_4px_20px_rgba(0,0,0,0.1)] transition-all duration-300 hover:scale-110 hover:shadow-[0_4px_24px_rgba(0,0,0,0.15)] active:scale-95"
				style={{
					bottom: "11rem",
				}}
			>
				<Clock className="h-5 w-5" style={{ color: colors.primary }} />
				{/* Badge */}
				<span
					className="absolute -end-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white"
					style={{ backgroundColor: colors.primary }}
				>
					{items.length > 9 ? "9+" : items.length}
				</span>
			</button>

			<RecentlyViewedDrawerContent open={drawerOpen} onOpenChange={setDrawerOpen} />
		</>
	);

	if (!mounted || typeof document === "undefined") return null;
	return createPortal(button, document.body);
}
