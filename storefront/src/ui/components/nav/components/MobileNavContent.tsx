"use client";

/**
 * Mobile menu — multi-level push/pop navigation.
 *
 * Root level: visual category cards, horizontal collection/brand chips,
 * quick-action pills (Account + Cart), and "View All" CTA.
 *
 * Category levels: back button, "View All" link, subcategory rows.
 * Tapping a subcategory with children pushes a new level (slide animation).
 */
import { useState, useEffect, useCallback } from "react";
import { ChevronRightIcon, ChevronLeftIcon, User2, ShoppingBag, Grid3X3 } from "lucide-react";
import { LinkWithChannel } from "@/ui/atoms/LinkWithChannel";
import { useContentConfig, useBranding, useCartDisplayMode } from "@/providers/StoreConfigProvider";
import { buildCategoryUrl, buildCollectionUrl, buildBrandUrl } from "@/lib/urls";
import { useCartDrawerSafe } from "@/providers/CartDrawerProvider";
import type { CategoryWithChildren, MobileNavData } from "./NavLinksClient";

export type { MobileNavData };

/* ─── Types ─── */

type NavLevel = {
	type: "root" | "category";
	category?: CategoryWithChildren;
	title?: string;
};

/* ─── Root Level ─── */

function RootLevel({
	navData,
	channel,
	onClose,
	onPushCategory,
	isLoggedIn,
}: {
	navData: MobileNavData;
	channel: string;
	onClose: () => void;
	onPushCategory: (cat: CategoryWithChildren) => void;
	isLoggedIn: boolean;
}) {
	const content = useContentConfig();
	const branding = useBranding();
	const displayMode = useCartDisplayMode();
	const drawerContext = useCartDrawerSafe();

	const mobileMenuStyle = content.navbar?.mobileMenuStyle ?? "visual";

	const labels = {
		categories: content.navbar?.categoriesLabel ?? "Categories",
		collections: content.navbar?.collectionsLabel ?? "Collections",
		brands: content.navbar?.brandsLabel ?? "Brands",
		viewAll: content.navbar?.viewAllProducts ?? "View Products",
	};

	const accountHref = isLoggedIn ? "/account" : "/login";
	const accountLabel = isLoggedIn
		? (content.navbar?.accountLabel ?? "Account")
		: (content.navbar?.signInText ?? "Sign In");
	const cartLabel = content.navbar?.cartLabel ?? "Cart";

	return (
		<div className="flex flex-col gap-5 pb-6">
			{/* Quick-action pills: Account + Cart */}
			<div className="flex gap-3 mobile-nav-item-in">
				<LinkWithChannel
					href={accountHref}
					onClick={onClose}
					className="flex flex-1 items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition-all active:scale-[0.97]"
					style={{
						color: "var(--store-text)",
						borderColor: "var(--store-neutral-200)",
					}}
				>
					<User2 className="h-[18px] w-[18px]" style={{ color: "var(--store-text-muted)" }} />
					{accountLabel}
				</LinkWithChannel>
				{displayMode === "drawer" ? (
					<button
						type="button"
						onClick={() => {
							drawerContext?.openDrawer();
							onClose();
						}}
						className="flex flex-1 items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition-all active:scale-[0.97]"
						style={{
							color: "var(--store-text)",
							borderColor: "var(--store-neutral-200)",
						}}
					>
						<ShoppingBag className="h-[18px] w-[18px]" style={{ color: "var(--store-text-muted)" }} />
						{cartLabel}
					</button>
				) : (
					<LinkWithChannel
						href="/cart"
						onClick={onClose}
						className="flex flex-1 items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition-all active:scale-[0.97]"
						style={{
							color: "var(--store-text)",
							borderColor: "var(--store-neutral-200)",
						}}
					>
						<ShoppingBag className="h-[18px] w-[18px]" style={{ color: "var(--store-text-muted)" }} />
						{cartLabel}
					</LinkWithChannel>
				)}
			</div>

			{/* Categories — visual cards or compact list based on config */}
			{navData.categories.length > 0 && (
				<section>
					<h3
						className="mb-3 px-1 text-xs font-semibold uppercase tracking-wider mobile-nav-item-in"
						style={{ color: "var(--store-text-muted)", animationDelay: "40ms" }}
					>
						{labels.categories}
					</h3>
					{mobileMenuStyle === "visual" ? (
						<div className="grid grid-cols-2 gap-2.5">
							{navData.categories.map((cat, i) => (
								<button
									key={cat.id}
									type="button"
									onClick={() => onPushCategory(cat)}
									className="group relative aspect-[4/3] overflow-hidden rounded-2xl transition-transform active:scale-[0.97] mobile-nav-item-in"
									style={{ animationDelay: `${(i + 1) * 60}ms` }}
								>
									{/* Background image or fallback */}
									{cat.backgroundImage?.url ? (
										<img
											src={cat.backgroundImage.url}
											alt={cat.backgroundImage.alt || cat.name}
											className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
										/>
									) : (
										<div
											className="absolute inset-0 flex items-center justify-center"
											style={{ backgroundColor: `${branding.colors.primary}15` }}
										>
											<Grid3X3 className="h-8 w-8" style={{ color: `${branding.colors.primary}40` }} />
										</div>
									)}
									{/* Gradient overlay */}
									<div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent" />
									{/* Content */}
									<div className="absolute inset-0 flex flex-col justify-end p-3">
										<span className="text-start text-sm font-semibold text-white leading-tight line-clamp-2">
											{cat.name}
										</span>
										<div className="mt-1 flex items-center justify-between">
											{cat.productCount != null && cat.productCount > 0 && (
												<span className="text-xs text-white/70">
													{cat.productCount}
												</span>
											)}
											<ChevronRightIcon className="h-4 w-4 shrink-0 text-white/70 rtl:rotate-180" />
										</div>
									</div>
								</button>
							))}
						</div>
					) : (
						/* Compact mode — clean text list */
						<div className="flex flex-col">
							{navData.categories.map((cat, i) => (
								<button
									key={cat.id}
									type="button"
									onClick={() => onPushCategory(cat)}
									className="flex w-full items-center gap-3 border-b px-2 py-3.5 text-start transition-all active:scale-[0.97] last:border-b-0 mobile-nav-item-in"
									style={{
										borderColor: "var(--store-neutral-200)",
										animationDelay: `${(i + 1) * 60}ms`,
									}}
								>
									<span
										className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold"
										style={{
											backgroundColor: `${branding.colors.primary}12`,
											color: branding.colors.primary,
										}}
									>
										{cat.name.charAt(0)}
									</span>
									<div className="flex-1 min-w-0">
										<span className="block text-sm font-medium truncate" style={{ color: "var(--store-text)" }}>
											{cat.name}
										</span>
										{cat.productCount != null && cat.productCount > 0 && (
											<span className="text-xs" style={{ color: "var(--store-text-muted)" }}>
												{cat.productCount} {content.navbar?.megaMenuProductsLabel ?? "products"}
											</span>
										)}
									</div>
									<ChevronRightIcon className="h-4 w-4 shrink-0 rtl:rotate-180" style={{ color: "var(--store-neutral-400)" }} />
								</button>
							))}
						</div>
					)}
				</section>
			)}

			{/* Collections — horizontal scrollable chips */}
			{navData.collections.length > 0 && (
				<section
					className="mobile-nav-fade-in"
					style={{ animationDelay: `${(navData.categories.length + 1) * 60 + 60}ms` }}
				>
					<h3
						className="mb-2.5 px-1 text-xs font-semibold uppercase tracking-wider"
						style={{ color: "var(--store-text-muted)" }}
					>
						{labels.collections}
					</h3>
					<div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1">
						{navData.collections.map((c) => (
							<LinkWithChannel
								key={c.id}
								href={buildCollectionUrl(c.slug)}
								onClick={onClose}
								className="shrink-0 rounded-full border px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-all active:scale-[0.96]"
								style={{
									color: "var(--store-text)",
									borderColor: "var(--store-neutral-300)",
								}}
							>
								{c.name}
							</LinkWithChannel>
						))}
					</div>
				</section>
			)}

			{/* Brands — horizontal scrollable chips */}
			{navData.brands.length > 0 && (
				<section
					className="mobile-nav-fade-in"
					style={{ animationDelay: `${(navData.categories.length + 2) * 60 + 60}ms` }}
				>
					<h3
						className="mb-2.5 px-1 text-xs font-semibold uppercase tracking-wider"
						style={{ color: "var(--store-text-muted)" }}
					>
						{labels.brands}
					</h3>
					<div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1">
						{navData.brands.map((b) => (
							<LinkWithChannel
								key={b.id}
								href={buildBrandUrl(b.slug)}
								onClick={onClose}
								className="shrink-0 rounded-full border px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-all active:scale-[0.96]"
								style={{
									color: "var(--store-text)",
									borderColor: "var(--store-neutral-300)",
								}}
							>
								{b.name}
							</LinkWithChannel>
						))}
					</div>
				</section>
			)}

			{/* View All Products CTA */}
			<div
				className="mobile-nav-fade-in"
				style={{ animationDelay: `${(navData.categories.length + 3) * 60 + 60}ms` }}
			>
				<LinkWithChannel
					href="/products"
					onClick={onClose}
					className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-semibold transition-all active:scale-[0.97]"
					style={{
						backgroundColor: branding.colors.primary,
						color: "#fff",
						boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
					}}
				>
					{labels.viewAll}
					<ChevronRightIcon className="h-4 w-4 rtl:rotate-180" />
				</LinkWithChannel>
			</div>
		</div>
	);
}

/* ─── Category Level ─── */

function CategoryLevel({
	category,
	channel,
	onClose,
	onPush,
	onPop,
	parentTitle,
}: {
	category: CategoryWithChildren;
	channel: string;
	onClose: () => void;
	onPush: (cat: CategoryWithChildren) => void;
	onPop: () => void;
	parentTitle?: string;
}) {
	const branding = useBranding();
	const content = useContentConfig();
	const children = category.children ?? [];

	// When parentTitle is undefined (going back to root), use menu label from config
	const backLabel = parentTitle ?? content.navbar?.menuLabel ?? content.navbar?.categoriesLabel ?? "Menu";

	return (
		<div className="flex flex-col gap-1">
				{/* Back button + level title */}
				<button
					type="button"
					onClick={onPop}
					className="flex items-center gap-2 rounded-lg px-1 py-3 text-sm font-medium transition-colors active:scale-[0.97] mobile-nav-item-in"
					style={{ color: "var(--store-text-muted)" }}
				>
					<ChevronLeftIcon className="h-4 w-4 shrink-0 rtl:rotate-180" />
					<span className="truncate">{backLabel}</span>
				</button>

				{/* Current category title */}
				<h3
					className="px-1 text-lg font-semibold mobile-nav-item-in"
					style={{ color: "var(--store-text)", animationDelay: "40ms" }}
				>
					{category.name}
				</h3>

				{/* View All link for this category */}
				<LinkWithChannel
					href={buildCategoryUrl(category.slug)}
					onClick={onClose}
					className="flex items-center gap-2 rounded-lg px-1 py-2.5 text-sm font-medium transition-colors active:scale-[0.97] mobile-nav-item-in"
					style={{ color: branding.colors.primary, animationDelay: "80ms" }}
				>
					<span>{category.name}</span>
					<ChevronRightIcon className="h-3.5 w-3.5 rtl:rotate-180" />
				</LinkWithChannel>

				{/* Subcategory items */}
				{children.length > 0 && (
					<ul className="mt-1 flex flex-col gap-0.5">
						{children.map((child, i) => {
							const hasGrandchildren = (child.children?.length ?? 0) > 0;

							if (hasGrandchildren) {
								return (
									<li key={child.id}>
										<button
											type="button"
											onClick={() => onPush(child)}
											className="flex w-full items-center justify-between gap-2 rounded-xl px-3 py-3 text-start text-sm font-medium transition-all active:scale-[0.97] mobile-nav-item-in"
											style={{
												color: "var(--store-text)",
												animationDelay: `${(i + 2) * 60}ms`,
											}}
										>
											<span className="flex-1 truncate">{child.name}</span>
											{child.productCount != null && child.productCount > 0 && (
												<span className="text-xs shrink-0" style={{ color: "var(--store-text-muted)" }}>
													{child.productCount}
												</span>
											)}
											<ChevronRightIcon className="h-4 w-4 shrink-0 rtl:rotate-180" style={{ color: "var(--store-neutral-400)" }} />
										</button>
									</li>
								);
							}

							return (
								<li key={child.id}>
									<LinkWithChannel
										href={buildCategoryUrl(child.slug)}
										onClick={onClose}
										className="flex w-full items-center gap-2 rounded-xl px-3 py-3 text-start text-sm font-medium transition-all active:scale-[0.97] mobile-nav-item-in"
										style={{
											color: "var(--store-text)",
											animationDelay: `${(i + 2) * 60}ms`,
										}}
									>
										<span className="flex-1 truncate">{child.name}</span>
										{child.productCount != null && child.productCount > 0 && (
											<span className="text-xs shrink-0" style={{ color: "var(--store-text-muted)" }}>
												{child.productCount}
											</span>
										)}
									</LinkWithChannel>
								</li>
							);
						})}
					</ul>
				)}
		</div>
	);
}

/* ─── Main Component ─── */

export function MobileNavContent({
	navData,
	channel,
	onClose,
	isLoggedIn = false,
}: {
	navData: MobileNavData;
	channel: string;
	onClose: () => void;
	isLoggedIn?: boolean;
}) {
	const [navStack, setNavStack] = useState<NavLevel[]>([{ type: "root" }]);
	const [slideDirection, setSlideDirection] = useState<"forward" | "back">("forward");
	const [animKey, setAnimKey] = useState(0);
	const [isRtl, setIsRtl] = useState(false);

	useEffect(() => {
		const check = () => setIsRtl(document.documentElement.dir === "rtl");
		check();
		const observer = new MutationObserver(check);
		observer.observe(document.documentElement, { attributes: true, attributeFilter: ["dir"] });
		return () => observer.disconnect();
	}, []);

	const currentLevel = navStack[navStack.length - 1];

	const push = useCallback((cat: CategoryWithChildren) => {
		setNavStack((prev) => [...prev, { type: "category", category: cat, title: cat.name }]);
		setSlideDirection("forward");
		setAnimKey((k) => k + 1);
	}, []);

	const pop = useCallback(() => {
		if (navStack.length <= 1) return;
		setNavStack((prev) => prev.slice(0, -1));
		setSlideDirection("back");
		setAnimKey((k) => k + 1);
	}, [navStack.length]);

	// Determine animation class based on direction + RTL
	const animClass =
		slideDirection === "forward"
			? isRtl
				? "mobile-nav-push-in-rtl"
				: "mobile-nav-push-in"
			: isRtl
				? "mobile-nav-pop-in-rtl"
				: "mobile-nav-pop-in";

	// Parent title for the back button
	const parentTitle =
		navStack.length >= 2 ? navStack[navStack.length - 2].title : undefined;

	return (
		<div key={animKey} className={animKey > 0 ? animClass : ""}>
			{currentLevel.type === "root" ? (
				<RootLevel
					navData={navData}
					channel={channel}
					onClose={onClose}
					onPushCategory={push}
					isLoggedIn={isLoggedIn}
				/>
			) : currentLevel.category ? (
				<CategoryLevel
					category={currentLevel.category}
					channel={channel}
					onClose={onClose}
					onPush={push}
					onPop={pop}
					parentTitle={parentTitle}
				/>
			) : null}
		</div>
	);
}
