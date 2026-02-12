"use client";

/**
 * Mobile menu content: Categories, Collections, Brands as dropdown/accordion sections.
 * Tap a section header to expand/collapse its list. Nested category items expand on tap.
 */
import { useState, useEffect } from "react";
import { ChevronRightIcon } from "lucide-react";
import { LinkWithChannel } from "@/ui/atoms/LinkWithChannel";
import { useContentConfig, useBranding, useCartDisplayMode } from "@/providers/StoreConfigProvider";
import { buildCategoryUrl, buildCollectionUrl, buildBrandUrl } from "@/lib/urls";
import { useCartDrawerSafe } from "@/providers/CartDrawerProvider";
import type { CategoryWithChildren, MobileNavData } from "./NavLinksClient";

export type { MobileNavData };

/** Shared menu item row – tap target, hover + active, RTL-safe. */
const menuItemClass =
	"flex min-h-[2.75rem] w-full items-center justify-between gap-2 rounded-lg px-4 py-3 text-left text-sm font-medium transition-colors active:scale-[0.98] " +
	"hover:bg-[var(--store-neutral-100)] active:bg-[var(--store-neutral-200)]";

/** Dropdown/accordion header row – tap to expand/collapse. */
const dropdownHeaderClass =
	"flex min-h-[2.75rem] w-full cursor-pointer items-center justify-between gap-2 rounded-lg px-4 py-3 text-left text-sm font-medium transition-colors active:scale-[0.98] " +
	"hover:bg-[var(--store-neutral-100)] active:bg-[var(--store-neutral-200)]";

function getArrowBaseClass(dir: "up" | "down" | "left" | "right" | "auto"): string {
	if (dir === "left") return "rotate-180";
	if (dir === "up") return "-rotate-90";
	if (dir === "down") return "rotate-90";
	if (dir === "auto") return "ltr:rotate-180";
	return ""; // right (ChevronRightIcon default)
}

function getArrowExpandedTransform(dir: "up" | "down" | "left" | "right" | "auto"): string {
	if (dir === "right") return "rotate(0deg)";
	if (dir === "left") return "rotate(180deg)";
	if (dir === "up") return "rotate(-90deg)";
	if (dir === "down") return "rotate(90deg)";
	return "rotate(90deg)"; // auto = down
}

/** Collapsed arrow transform; inline style overrides classes so we need this. Auto uses RTL. */
function getArrowCollapsedTransform(
	dir: "up" | "down" | "left" | "right" | "auto",
	isRtl?: boolean,
): string {
	if (dir === "right") return "rotate(0deg)";
	if (dir === "left") return "rotate(180deg)";
	if (dir === "up") return "rotate(-90deg)";
	if (dir === "down") return "rotate(90deg)";
	return isRtl ? "rotate(0deg)" : "rotate(180deg)"; // auto: LTR→left, RTL→right
}

/** Nested category list – accordion expand/collapse at every level; shows all items (leaf = link, parent = expandable). */
function MobileCategoryTree({
	items,
	channel,
	onClose,
	expandedIds,
	onToggleExpanded,
	branding,
	depth = 0,
	arrowBaseClass = "ltr:rotate-180",
	arrowExpandedTransform = "rotate(90deg)",
	arrowCollapsedTransform = "rotate(0deg)",
}: {
	items: CategoryWithChildren[];
	channel: string;
	onClose: () => void;
	expandedIds: Set<string>;
	onToggleExpanded: (id: string) => void;
	branding: { colors: { primary: string } };
	depth?: number;
	arrowBaseClass?: string;
	arrowExpandedTransform?: string;
	arrowCollapsedTransform?: string;
}) {
	if (items.length === 0) return null;

	const nestedClass =
		depth > 0 ? "ms-4 mt-1 space-y-0.5 border-s ps-3" : "space-y-0.5";
	const borderStyle = depth > 0 ? { borderColor: "var(--store-neutral-200)" } : undefined;
	return (
		<ul className={nestedClass} style={borderStyle}>
			{items.map((item) => {
				const hasChildren = (item.children?.length ?? 0) > 0;
				const isExpanded = expandedIds.has(item.id);

				if (!hasChildren) {
					return (
						<li key={item.id}>
							<LinkWithChannel
								href={buildCategoryUrl(item.slug)}
								onClick={onClose}
								className="flex min-h-[2.75rem] w-full items-center rounded-lg px-4 py-3 text-left text-sm font-medium transition-colors active:scale-[0.98] hover:bg-[var(--store-neutral-100)] active:bg-[var(--store-neutral-200)]"
								style={{ color: "var(--store-text)" }}
							>
								<span className="truncate">{item.name}</span>
							</LinkWithChannel>
						</li>
					);
				}

				return (
					<li key={item.id}>
						<button
							type="button"
							onClick={() => onToggleExpanded(item.id)}
							className={`${dropdownHeaderClass} rounded-e-none rounded-s-lg transition-all duration-200 hover:bg-[var(--store-neutral-100)] active:bg-[var(--store-neutral-200)]`}
							style={{
								color: isExpanded ? branding.colors.primary : "var(--store-text)",
								backgroundColor: isExpanded ? `${branding.colors.primary}15` : undefined,
							}}
							aria-expanded={isExpanded}
							aria-controls={`mobile-nav-cat-${item.id}`}
						>
							<span className="truncate">{item.name}</span>
							<ChevronRightIcon
								className={`h-4 w-4 shrink-0 transition-transform duration-200 ${arrowBaseClass}`}
								style={{
									color: branding.colors.primary,
									transform: isExpanded ? arrowExpandedTransform : arrowCollapsedTransform,
								}}
								aria-hidden
							/>
						</button>
						<div
							id={`mobile-nav-cat-${item.id}`}
							role="region"
							aria-hidden={!isExpanded}
							className="grid transition-[grid-template-rows] duration-300 ease-out"
							style={{ gridTemplateRows: isExpanded ? "1fr" : "0fr" }}
						>
							<div className="min-h-0 overflow-hidden">
								<MobileCategoryTree
									items={item.children!}
									channel={channel}
									onClose={onClose}
									expandedIds={expandedIds}
									onToggleExpanded={onToggleExpanded}
									branding={branding}
									depth={depth + 1}
									arrowBaseClass={arrowBaseClass}
									arrowExpandedTransform={arrowExpandedTransform}
									arrowCollapsedTransform={arrowCollapsedTransform}
								/>
							</div>
						</div>
					</li>
				);
			})}
		</ul>
	);
}

/** One dropdown section: header toggles list visibility (Allin-style: bold header, border separator). */
function MobileNavDropdown({
	id,
	label,
	expanded,
	onToggle,
	children,
	arrowBaseClass = "ltr:rotate-180",
	arrowExpandedTransform = "rotate(90deg)",
	arrowCollapsedTransform = "rotate(0deg)",
}: {
	id: string;
	label: string;
	expanded: boolean;
	onToggle: () => void;
	children: React.ReactNode;
	arrowBaseClass?: string;
	arrowExpandedTransform?: string;
	arrowCollapsedTransform?: string;
}) {
	const style = { color: "var(--store-text-muted)" } as const;
	return (
		<section
			className="px-2 border-b"
			style={{ borderColor: "var(--store-neutral-200)" }}
			aria-labelledby={id}
		>
			<button
				type="button"
				id={id}
				onClick={onToggle}
				className={`${dropdownHeaderClass} font-semibold`}
				style={{ color: "var(--store-text)" }}
				aria-expanded={expanded}
				aria-controls={`${id}-content`}
			>
				<span className="truncate">{label}</span>
				<ChevronRightIcon
					className={`h-4 w-4 shrink-0 transition-transform duration-200 ${arrowBaseClass}`}
					style={{ ...style, transform: expanded ? arrowExpandedTransform : arrowCollapsedTransform }}
					aria-hidden
				/>
			</button>
			<div
				id={`${id}-content`}
				role="region"
				aria-labelledby={id}
				aria-hidden={!expanded}
				className="grid transition-[grid-template-rows] duration-300 ease-out"
				style={{ gridTemplateRows: expanded ? "1fr" : "0fr" }}
			>
				<div className="min-h-0 overflow-hidden">
					{children}
				</div>
			</div>
		</section>
	);
}

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
	const content = useContentConfig();
	const branding = useBranding();
	const displayMode = useCartDisplayMode();
	const drawerContext = useCartDrawerSafe();
	const [openSection, setOpenSection] = useState<"categories" | "collections" | "brands" | null>(null);
	const [expandedCategoryIds, setExpandedCategoryIds] = useState<Set<string>>(new Set());
	const [isRtl, setIsRtl] = useState(false);
	useEffect(() => {
		const check = () => setIsRtl(document.documentElement.dir === "rtl");
		check();
		const observer = new MutationObserver(check);
		observer.observe(document.documentElement, { attributes: true, attributeFilter: ["dir"] });
		return () => observer.disconnect();
	}, []);

	const dropdownArrowDir = content.navbar?.dropdownArrowDirection ?? "auto";
	const arrowBaseClass = getArrowBaseClass(dropdownArrowDir);
	const arrowExpandedTransform = getArrowExpandedTransform(
		content.navbar?.dropdownArrowDirectionExpanded ?? "down",
	);
	const arrowCollapsedTransform = getArrowCollapsedTransform(
		dropdownArrowDir as "up" | "down" | "left" | "right" | "auto",
		isRtl,
	);

	const labels = {
		categories: content.navbar?.categoriesLabel ?? "Categories",
		collections: content.navbar?.collectionsLabel ?? "Collections",
		brands: content.navbar?.brandsLabel ?? "Brands",
		viewAll: content.navbar?.viewAllProducts ?? "View All Products",
	};

	const toggle = (key: "categories" | "collections" | "brands") => {
		setOpenSection((s) => (s === key ? null : key));
	};

	const toggleCategoryExpanded = (id: string) => {
		setExpandedCategoryIds((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
	};

	const accountHref = isLoggedIn ? "/account" : "/login";
	const accountLabel = isLoggedIn
		? (content.navbar?.accountLabel ?? "Account")
		: (content.navbar?.signInText ?? "Sign In");
	const cartLabel = content.navbar?.cartLabel ?? "Cart";

	return (
		<div className="flex flex-col gap-0 pb-4">
			{/* Allin-style quick links: Account/Login + Cart */}
			<div
				className="flex border-b py-2 gap-2"
				style={{ borderColor: "var(--store-neutral-200)" }}
			>
				<LinkWithChannel
					href={accountHref}
					onClick={onClose}
					className="flex-1 min-h-[2.75rem] flex items-center justify-center rounded-lg px-4 text-sm font-medium transition-colors hover:bg-[var(--store-neutral-100)] active:bg-[var(--store-neutral-200)]"
					style={{ color: "var(--store-text)" }}
				>
					{accountLabel}
				</LinkWithChannel>
				{displayMode === "drawer" ? (
					<button
						type="button"
						onClick={() => {
							drawerContext?.openDrawer();
							onClose();
						}}
						className="flex-1 min-h-[2.75rem] flex items-center justify-center rounded-lg px-4 text-sm font-medium transition-colors hover:bg-[var(--store-neutral-100)] active:bg-[var(--store-neutral-200)]"
						style={{ color: "var(--store-text)" }}
					>
						{cartLabel}
					</button>
				) : (
					<LinkWithChannel
						href="/cart"
						onClick={onClose}
						className="flex-1 min-h-[2.75rem] flex items-center justify-center rounded-lg px-4 text-sm font-medium transition-colors hover:bg-[var(--store-neutral-100)] active:bg-[var(--store-neutral-200)]"
						style={{ color: "var(--store-text)" }}
					>
						{cartLabel}
					</LinkWithChannel>
				)}
			</div>

			{/* Categories – dropdown (Allin-style section divider) */}
			{navData.categories.length > 0 && (
				<MobileNavDropdown
					id="mobile-nav-categories"
					label={labels.categories}
					expanded={openSection === "categories"}
					onToggle={() => toggle("categories")}
					arrowBaseClass={arrowBaseClass}
					arrowExpandedTransform={arrowExpandedTransform}
					arrowCollapsedTransform={arrowCollapsedTransform}
				>
					<nav aria-label={labels.categories} className="pt-1">
						<MobileCategoryTree
							items={navData.categories}
							channel={channel}
							onClose={onClose}
							expandedIds={expandedCategoryIds}
							onToggleExpanded={toggleCategoryExpanded}
							branding={branding}
							arrowBaseClass={arrowBaseClass}
							arrowExpandedTransform={arrowExpandedTransform}
							arrowCollapsedTransform={arrowCollapsedTransform}
						/>
					</nav>
				</MobileNavDropdown>
			)}

			{/* Collections – dropdown */}
			{navData.collections.length > 0 && (
				<MobileNavDropdown
					id="mobile-nav-collections"
					label={labels.collections}
					expanded={openSection === "collections"}
					onToggle={() => toggle("collections")}
					arrowBaseClass={arrowBaseClass}
					arrowExpandedTransform={arrowExpandedTransform}
					arrowCollapsedTransform={arrowCollapsedTransform}
				>
					<nav aria-label={labels.collections} className="pt-1">
						<ul className="space-y-0.5">
							{navData.collections.map((c) => (
								<li key={c.id}>
									<LinkWithChannel
										href={buildCollectionUrl(c.slug)}
										onClick={onClose}
										className="flex min-h-[2.75rem] w-full items-center rounded-lg px-4 py-3 text-left text-sm font-medium transition-colors active:scale-[0.98] hover:bg-[var(--store-neutral-100)] active:bg-[var(--store-neutral-200)]"
										style={{ color: "var(--store-text)" }}
									>
										<span className="truncate">{c.name}</span>
									</LinkWithChannel>
								</li>
							))}
						</ul>
					</nav>
				</MobileNavDropdown>
			)}

			{/* Brands – dropdown */}
			{navData.brands.length > 0 && (
				<MobileNavDropdown
					id="mobile-nav-brands"
					label={labels.brands}
					expanded={openSection === "brands"}
					onToggle={() => toggle("brands")}
					arrowBaseClass={arrowBaseClass}
					arrowExpandedTransform={arrowExpandedTransform}
					arrowCollapsedTransform={arrowCollapsedTransform}
				>
					<nav aria-label={labels.brands} className="pt-1">
						<ul className="space-y-0.5">
							{navData.brands.map((b) => (
								<li key={b.id}>
									<LinkWithChannel
										href={buildBrandUrl(b.slug)}
										onClick={onClose}
										className="flex min-h-[2.75rem] w-full items-center rounded-lg px-4 py-3 text-left text-sm font-medium transition-colors active:scale-[0.98] hover:bg-[var(--store-neutral-100)] active:bg-[var(--store-neutral-200)]"
										style={{ color: "var(--store-text)" }}
									>
										<span className="truncate">{b.name}</span>
									</LinkWithChannel>
								</li>
							))}
						</ul>
					</nav>
				</MobileNavDropdown>
			)}

			{/* View All Products – primary CTA, no arrow, clean design */}
			<div className="mt-4 border-t pt-4" style={{ borderColor: "var(--store-neutral-200)" }}>
				<LinkWithChannel
					href="/products"
					onClick={onClose}
					className="block w-full min-h-[3rem] flex items-center justify-center rounded-xl px-4 py-3 text-center text-sm font-semibold transition-all duration-200 hover:opacity-90 active:scale-[0.98]"
					style={{
						backgroundColor: branding.colors.primary,
						color: "#fff",
						boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
					}}
				>
					{labels.viewAll}
				</LinkWithChannel>
			</div>
		</div>
	);
}
