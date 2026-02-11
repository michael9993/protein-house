"use client";

import React, {
	createContext,
	useContext,
	useState,
	useCallback,
	useEffect,
	useRef,
	Suspense,
	lazy,
} from "react";
import Link from "next/link";
import { Drawer } from "vaul";
import { getProductDetailsForQuickView, addProductToCartAction } from "@/app/[channel]/(main)/products/actions";
import type { ProductDetailPayload } from "@/app/[channel]/(main)/products/actions";
import { useDirection } from "@/providers/DirectionProvider";
import { useContentConfig, useBranding } from "@/providers/StoreConfigProvider";

// Lazy load heavy PDP component so modal opens fast; content loads after
const ProductDetailClient = lazy(() =>
	import("@/app/[channel]/(main)/products/[slug]/ProductDetailClient").then((m) => ({
		default: m.ProductDetailClient,
	}))
);

// Prefetch cache: when user hovers a product card we fetch and store here so open is instant
let prefetchCacheSlug: string | null = null;
let prefetchCacheData: ProductDetailPayload | null = null;

function getCachedProduct(slug: string): ProductDetailPayload | null {
	if (prefetchCacheSlug === slug && prefetchCacheData) return prefetchCacheData;
	return null;
}

function setCachedProduct(slug: string, data: ProductDetailPayload | null) {
	prefetchCacheSlug = data ? slug : null;
	prefetchCacheData = data;
}

// ============================================
// CONTEXT
// ============================================
interface QuickViewContextValue {
	openSlug: string | null;
	openQuickView: (slug: string) => void;
	closeQuickView: () => void;
	/** Call on hover/touch start to prefetch product so open is instant */
	prefetchQuickView: (slug: string) => void;
}

const QuickViewContext = createContext<QuickViewContextValue | null>(null);

export function useQuickView(): QuickViewContextValue {
	const context = useContext(QuickViewContext);
	if (!context) {
		return {
			openSlug: null,
			openQuickView: () => {},
			closeQuickView: () => {},
			prefetchQuickView: () => {},
		};
	}
	return context;
}

// ============================================
// SKELETON
// ============================================
function QuickViewDetailSkeleton() {
	return (
		<div className="animate-pulse px-4 py-6 sm:px-6 sm:py-8" aria-hidden>
			<div className="flex flex-col gap-6 sm:flex-row">
				<div className="aspect-square w-full shrink-0 rounded-lg bg-neutral-200 sm:w-80" />
				<div className="min-w-0 flex-1 space-y-4">
					<div className="h-5 w-3/4 rounded bg-neutral-200" />
					<div className="h-6 w-24 rounded bg-neutral-200" />
					<div className="flex gap-2">
						{[1, 2, 3].map((i) => (
							<div key={i} className="h-10 w-16 rounded bg-neutral-200" />
						))}
					</div>
					<div className="h-12 w-full rounded bg-neutral-200 sm:w-48" />
				</div>
			</div>
		</div>
	);
}

// ============================================
// MODAL CONTENT (shared between mobile drawer and desktop dialog)
// ============================================
interface QuickViewContentProps {
	openSlug: string;
	onClose: () => void;
	channel: string;
	product: ProductDetailPayload | null;
	loading: boolean;
	error: string | null;
	viewFullPageLabel: string;
	loadingProductLabel: string;
	productDetailsTitle: string;
	closeButtonLabel: string;
	productNotFoundText: string;
	errorLoadingProductText: string;
	branding: { colors: { primary: string } };
}

function QuickViewContent({
	openSlug,
	onClose,
	channel,
	product,
	loading,
	error,
	viewFullPageLabel,
	loadingProductLabel,
	productDetailsTitle,
	closeButtonLabel,
	productNotFoundText,
	errorLoadingProductText,
	branding,
}: QuickViewContentProps) {
	const scrollRef = useRef<HTMLDivElement>(null);

	// Reset scroll position when product changes
	useEffect(() => {
		if (product && scrollRef.current) {
			scrollRef.current.scrollTop = 0;
		}
	}, [product?.id]);

	return (
		<div className="flex h-full min-h-0 flex-col">
			{/* Header */}
			<div className="flex shrink-0 items-center justify-between gap-3 border-b border-neutral-100 px-4 py-3 sm:px-6 sm:py-4">
				<div className="min-w-0 flex-1">
					{product && (
						<Drawer.Title className="truncate text-base font-semibold text-neutral-900 sm:text-lg">
							{product.name}
						</Drawer.Title>
					)}
					{!product && !loading && (
						<Drawer.Title className="text-base font-semibold text-neutral-900 sm:text-lg">
							{productDetailsTitle}
						</Drawer.Title>
					)}
					{loading && (
						<Drawer.Title className="text-base font-semibold text-neutral-400 sm:text-lg">
							{loadingProductLabel}
						</Drawer.Title>
					)}
				</div>

				{/* View full page link - desktop */}
				<Link
					href={`/${channel}/products/${openSlug}`}
					className="hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900 sm:flex"
					onClick={onClose}
				>
					<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={1.5}
							d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
						/>
					</svg>
					{viewFullPageLabel}
				</Link>

				{/* Close button */}
				<Drawer.Close asChild>
					<button
						type="button"
						className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-neutral-400 outline-none transition-all hover:bg-neutral-100 hover:text-neutral-600 focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2 sm:h-10 sm:w-10"
						aria-label={closeButtonLabel}
					>
						<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</Drawer.Close>
			</div>

			{/* Body: scrollable — transform forces GPU compositing to prevent white-flash on scroll */}
			<div
				ref={scrollRef}
				className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
				style={{ transform: "translateZ(0)", WebkitOverflowScrolling: "touch" } as React.CSSProperties}
			>
				{loading && (
					<div className="flex flex-col items-center justify-center py-20 sm:py-28">
						<div
							className="h-10 w-10 animate-spin rounded-full border-2 border-neutral-200"
							style={{ borderTopColor: branding.colors.primary }}
						/>
						<p className="mt-4 text-sm text-neutral-500">{loadingProductLabel}</p>
					</div>
				)}
				{error && !loading && (
					<div className="flex flex-col items-center justify-center px-4 py-20 sm:py-28">
						<div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100">
							<svg className="h-8 w-8 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={1.5}
									d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
								/>
							</svg>
						</div>
						<p className="text-center text-neutral-600">{error}</p>
						<button
							type="button"
							onClick={onClose}
							className="mt-4 rounded-full px-5 py-2.5 text-sm font-medium text-white transition-colors hover:opacity-90"
							style={{ backgroundColor: branding.colors.primary }}
						>
							{closeButtonLabel}
						</button>
					</div>
				)}
				{product && !loading && (
					<Suspense fallback={<QuickViewDetailSkeleton />}>
						<ProductDetailClient
							product={product}
							selectedVariantId={product.variants?.[0]?.id}
							channel={channel}
							addItemAction={addProductToCartAction}
							productSlug={openSlug}
							mode="modal"
						/>
					</Suspense>
				)}
			</div>

			{/* Mobile footer with view full page */}
			{product && !loading && (
				<div className="shrink-0 border-t border-neutral-100 px-4 py-3 sm:hidden">
					<Link
						href={`/${channel}/products/${openSlug}`}
						className="flex w-full items-center justify-center gap-2 rounded-full border border-neutral-200 py-2.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
						onClick={onClose}
					>
						<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={1.5}
								d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
							/>
						</svg>
						{viewFullPageLabel}
					</Link>
				</div>
			)}
		</div>
	);
}

// ============================================
// MODAL (using Vaul)
// ============================================
interface QuickViewModalProps {
	openSlug: string | null;
	onClose: () => void;
	channel: string;
}

function QuickViewModal({ openSlug, onClose, channel }: QuickViewModalProps) {
	const { isRTL } = useDirection();
	const content = useContentConfig();
	const branding = useBranding();
	const [product, setProduct] = useState<ProductDetailPayload | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const previousSlugRef = useRef<string | null>(null);

	const productContent = content.product as {
		viewFullPageLink?: string;
		loadingProductText?: string;
		productDetailsTitle?: string;
		closeButton?: string;
		productNotFoundText?: string;
		errorLoadingProductText?: string;
	};
	const viewFullPageLabel = productContent?.viewFullPageLink ?? "View full page";
	const loadingProductLabel = productContent?.loadingProductText ?? "Loading product...";
	const productDetailsTitle = productContent?.productDetailsTitle ?? "Product Details";
	const closeButtonLabel = productContent?.closeButton ?? "Close";
	const productNotFoundText = productContent?.productNotFoundText ?? "Product not found";
	const errorLoadingProductText = productContent?.errorLoadingProductText ?? "Failed to load product";

	// Fetch product when openSlug changes (use cache if prefetched)
	useEffect(() => {
		if (!openSlug || openSlug === previousSlugRef.current) return;
		previousSlugRef.current = openSlug;
		const cached = getCachedProduct(openSlug);
		if (cached) {
			setProduct(cached);
			setError(null);
			setLoading(false);
			setCachedProduct(openSlug, null);
			return;
		}
		setProduct(null);
		setError(null);
		setLoading(true);

		const slugForRequest = openSlug;
		getProductDetailsForQuickView(openSlug, channel)
			.then((data) => {
				// Avoid race: if user opened another product before this resolved, ignore
				if (previousSlugRef.current !== slugForRequest) return;
				setProduct(data ?? null);
				setError(data ? null : productNotFoundText);
			})
			.catch((err) => {
				if (previousSlugRef.current !== slugForRequest) return;
				setError(err instanceof Error ? err.message : errorLoadingProductText);
				setProduct(null);
			})
			.finally(() => {
				if (previousSlugRef.current === slugForRequest) setLoading(false);
			});
	}, [openSlug, channel, productNotFoundText, errorLoadingProductText]);

	// Reset when modal closes
	useEffect(() => {
		if (!openSlug) {
			previousSlugRef.current = null;
			setProduct(null);
			setError(null);
		}
	}, [openSlug]);

	const isOpen = openSlug !== null;
	const dir = isRTL ? "rtl" : "ltr";

	return (
		<Drawer.Root
			open={isOpen}
			onOpenChange={(open) => {
				if (!open) onClose();
			}}
			direction="bottom"
			handleOnly
		>
			<Drawer.Portal>
				<Drawer.Overlay className="fixed inset-0 z-[9998] bg-black/50" />

				<Drawer.Content
					className="fixed inset-x-0 bottom-0 z-[9999] mx-auto flex max-h-[96dvh] flex-col rounded-t-2xl bg-white outline-none sm:inset-x-4 sm:bottom-4 sm:max-h-[90vh] sm:max-w-5xl sm:rounded-2xl lg:max-w-6xl"
					style={{
						boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.06)",
						paddingBottom: "env(safe-area-inset-bottom, 0px)",
					}}
					dir={dir}
					aria-describedby={undefined}
				>
					<Drawer.Handle className="mx-auto mt-3 mb-1 h-1.5 w-12 shrink-0 rounded-full bg-neutral-300" />

					{openSlug && (
						<QuickViewContent
							openSlug={openSlug}
							onClose={onClose}
							channel={channel}
							product={product}
							loading={loading}
							error={error}
							viewFullPageLabel={viewFullPageLabel}
							loadingProductLabel={loadingProductLabel}
							productDetailsTitle={productDetailsTitle}
							closeButtonLabel={closeButtonLabel}
							productNotFoundText={productNotFoundText}
							errorLoadingProductText={errorLoadingProductText}
							branding={branding}
						/>
					)}
				</Drawer.Content>
			</Drawer.Portal>
		</Drawer.Root>
	);
}

// ============================================
// PROVIDER
// ============================================
interface QuickViewProviderProps {
	children: React.ReactNode;
	channel: string;
}

export function QuickViewProvider({ children, channel }: QuickViewProviderProps) {
	const [openSlug, setOpenSlug] = useState<string | null>(null);
	const openQuickView = useCallback((slug: string) => setOpenSlug(slug), []);
	const closeQuickView = useCallback(() => setOpenSlug(null), []);
	const prefetchQuickView = useCallback(
		(slug: string) => {
			if (getCachedProduct(slug)) return;
			// Preload the JS chunk in parallel with the data fetch
			import("@/app/[channel]/(main)/products/[slug]/ProductDetailClient").catch(() => {});
			getProductDetailsForQuickView(slug, channel).then((data) => {
				if (data) setCachedProduct(slug, data);
			});
		},
		[channel]
	);

	const value = React.useMemo(
		() => ({ openSlug, openQuickView, closeQuickView, prefetchQuickView }),
		[openSlug, openQuickView, closeQuickView, prefetchQuickView]
	);

	return (
		<QuickViewContext.Provider value={value}>
			{children}
			<QuickViewModal openSlug={openSlug} onClose={closeQuickView} channel={channel} />
		</QuickViewContext.Provider>
	);
}
