"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Drawer } from "vaul";
import { Heart, X, Trash2 } from "lucide-react";
import { useWishlist, type WishlistItem } from "@/lib/wishlist";
import { useFeature, useBranding, useContentConfig, useProductCardConfig, useComponentStyle, useComponentClasses, useFloatingButtons } from "@/providers/StoreConfigProvider";
import { computeFloatingButtonPosition } from "@/lib/floating-buttons";
import { buildComponentStyle } from "@/config";
import { useQuickView } from "@/providers/QuickViewProvider";
import { ShareButton } from "@/ui/components/ProductSharing";
import { formatMoney } from "@/lib/utils";
import {
	badgeToneClasses,
	getCardHoverClasses,
	getBadgePositionClasses,
	type ProductCardConfig,
	type BadgeTone,
} from "./home/utils";

// ---------------------------------------------------------------------------
// V6-style mini product card for the wishlist drawer
// ---------------------------------------------------------------------------

function WishlistDrawerCard({
	item,
	channel,
	accent,
	cardConfig,
	viewDetailsText,
	onClose,
	onRemove,
	onQuickView,
	badgeLabels,
}: {
	item: WishlistItem;
	channel: string;
	accent: string;
	cardConfig: ProductCardConfig;
	viewDetailsText: string;
	onClose: () => void;
	onRemove: (id: string) => void;
	onQuickView: (slug: string) => void;
	badgeLabels: { sale: string; soldOut: string };
}) {
	const hasDiscount = item.originalPrice && item.originalPrice > item.price;
	const badge: { label: string; tone: BadgeTone } | null = !item.inStock
		? { label: badgeLabels.soldOut, tone: "dark" }
		: hasDiscount
			? { label: badgeLabels.sale, tone: "accent" }
			: null;

	const itemChannel = item.channel || channel;

	const handleRemoveClick = (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		onRemove(item.id);
	};

	const handleQuickViewClick = (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		onClose();
		setTimeout(() => onQuickView(item.slug), 200);
	};

	return (
		<div className="group relative">
			{/* Remove button */}
			<button
				type="button"
				onClick={handleRemoveClick}
				className="absolute -end-1.5 -top-1.5 z-20 flex h-6 w-6 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-400 shadow-sm transition-all hover:bg-neutral-100 hover:text-neutral-700"
				aria-label="Remove"
			>
				<X className="h-3 w-3" />
			</button>

			<Link
				href={`/${encodeURIComponent(itemChannel)}/products/${item.slug}`}
				onClick={() => {
					window.dispatchEvent(new CustomEvent("force-show-nav"));
					onClose();
				}}
				className={`relative flex h-full flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm transition-all duration-300 ${getCardHoverClasses(cardConfig.hoverEffect)}`}
			>
				{/* Image area */}
				<div className="relative aspect-square bg-gradient-to-br from-neutral-50 via-white to-neutral-100">
					{badge && (
						<span
							className={`absolute ${getBadgePositionClasses(cardConfig.badgePosition)} z-10 rounded-full px-2 py-0.5 text-[8px] font-bold uppercase tracking-[0.2em] ${badgeToneClasses[badge.tone]}`}
						>
							{badge.label}
						</span>
					)}

					{/* Share button */}
					<div className="absolute end-2 top-2 z-10 flex flex-col gap-1.5">
						<ShareButton
							variant="icon"
							productName={item.name}
							productSlug={item.slug}
							productImage={item.image}
							className="flex h-7 w-7 items-center justify-center rounded-full border border-white/60 bg-white/90 shadow-sm text-neutral-500 transition-all duration-200 hover:scale-110 hover:shadow-md hover:text-neutral-700"
							iconClassName="h-3 w-3"
						/>
					</div>

					{/* Product image */}
					{item.image ? (
						<Image
							src={item.image}
							alt={item.imageAlt || item.name}
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
							{formatMoney(item.price, item.currency)}
						</div>
						{hasDiscount && item.originalPrice && (
							<div className="text-[10px] text-neutral-400 line-through">
								{formatMoney(item.originalPrice, item.currency)}
							</div>
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

function WishlistDrawerContent({
	open,
	onOpenChange,
	channel,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	channel: string;
}) {
	const { items, removeItem, clearWishlist } = useWishlist();
	const { colors } = useBranding();
	const contentConfig = useContentConfig();
	const cardConfig = useProductCardConfig("wishlistDrawer");
	const { openQuickView } = useQuickView();
	const isRTL = typeof document !== "undefined" && document.documentElement.dir === "rtl";

	const homepageContent = contentConfig.homepage;
	const viewDetailsText = homepageContent.viewDetailsButton || "Quick view";

	const badgeLabels = {
		sale: homepageContent.saleBadgeLabel || "Sale",
		soldOut: homepageContent.outOfStockBadgeLabel || "Sold out",
	};

	const cdStyle = useComponentStyle("cart.wishlistDrawer");
	const cdClasses = useComponentClasses("cart.wishlistDrawer");

	return (
		<Drawer.Root open={open} onOpenChange={onOpenChange} direction="bottom">
			<Drawer.Portal>
				<Drawer.Overlay className="fixed inset-0 z-[9998] bg-black/50" />
				<Drawer.Content
					data-cd="cart-wishlistDrawer"
					className={`fixed inset-x-0 bottom-0 z-[9999] mx-auto flex max-h-[85dvh] flex-col rounded-t-2xl bg-neutral-50 outline-none sm:inset-x-4 sm:bottom-4 sm:max-h-[75vh] sm:max-w-lg sm:rounded-2xl ${cdClasses}`}
					style={{
						boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
						paddingBottom: "env(safe-area-inset-bottom, 0px)",
						...buildComponentStyle("cart.wishlistDrawer", cdStyle),
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
								<Heart className="h-4 w-4" style={{ color: colors.primary }} />
							</div>
							<Drawer.Title className="text-base font-bold text-neutral-900">
								Wishlist
								<span className="ms-1.5 text-sm font-normal text-neutral-400">({items.length})</span>
							</Drawer.Title>
						</div>
						<div className="flex items-center gap-1">
							{items.length > 0 && (
								<button
									type="button"
									onClick={() => {
										clearWishlist();
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
								<Heart className="mb-3 h-10 w-10 text-neutral-300" />
								<p className="text-sm font-medium text-neutral-500">Your wishlist is empty</p>
								<p className="mt-1 text-xs text-neutral-400">Products you love will appear here</p>
							</div>
						) : (
							<div className="grid grid-cols-2 gap-3">
								{items.map((item) => (
									<WishlistDrawerCard
										key={item.id}
										item={item}
										channel={channel}
										accent={colors.primary}
										cardConfig={cardConfig}
										viewDetailsText={viewDetailsText}
										onClose={() => onOpenChange(false)}
										onRemove={removeItem}
										onQuickView={openQuickView}
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
// Floating button (portal) — positioned above RecentlyViewed button
// ---------------------------------------------------------------------------

export function WishlistFloatingButton({ channel }: { channel: string }) {
	const [mounted, setMounted] = useState(false);
	const [drawerOpen, setDrawerOpen] = useState(false);
	const enabled = useFeature("wishlist");
	const { items } = useWishlist();
	const { colors } = useBranding();
	const pathname = usePathname();
	const fabConfig = useFloatingButtons();

	// Detect PDP — push FABs up to clear the sticky add-to-cart bar
	const pathParts = (pathname ?? "").split("/").filter(Boolean);
	const isPDP = pathParts.length >= 3 && pathParts[1] === "products" && pathParts.length === 3;

	const dir = typeof document !== "undefined"
		? (document.documentElement.getAttribute("dir") as "ltr" | "rtl") || "ltr"
		: "ltr";
	const pos = computeFloatingButtonPosition("wishlist", fabConfig, isPDP, dir);

	useEffect(() => {
		setMounted(true);
	}, []);

	if (!enabled || items.length === 0 || !pos.enabled) return null;

	const button = (
		<>
			<button
				type="button"
				onClick={() => setDrawerOpen(true)}
				aria-label={`Wishlist (${items.length})`}
				className="fixed z-[100] flex h-12 w-12 items-center justify-center rounded-full border border-neutral-200 bg-white shadow-[0_4px_20px_rgba(0,0,0,0.1)] transition-all duration-300 hover:scale-110 hover:shadow-[0_4px_24px_rgba(0,0,0,0.15)] active:scale-95"
				style={{
					bottom: pos.bottom,
					[pos.side]: "1.25rem",
				}}
			>
				<Heart className="h-5 w-5 fill-red-500 text-red-500" />
				{/* Badge */}
				<span
					className="absolute -end-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white"
					style={{ backgroundColor: colors.primary }}
				>
					{items.length > 9 ? "9+" : items.length}
				</span>
			</button>

			<WishlistDrawerContent open={drawerOpen} onOpenChange={setDrawerOpen} channel={channel} />
		</>
	);

	if (!mounted || typeof document === "undefined") return null;
	return createPortal(button, document.body);
}
