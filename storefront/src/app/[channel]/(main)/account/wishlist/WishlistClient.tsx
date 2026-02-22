"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useWishlist } from "@/lib/wishlist";
import { formatMoney } from "@/lib/utils";
import imageLoader from "@/lib/imageLoader";
import { useBranding, useWishlistText, useEcommerceSettings, useProductDetailText } from "@/providers/StoreConfigProvider";
import { getProductShippingEstimate, formatEstimate } from "@/lib/shipping";

interface WishlistClientProps {
	channel: string;
}

export function WishlistClient({ channel }: WishlistClientProps) {
	const { items, removeItem, clearWishlist, isLoading } = useWishlist();
	const brandingConfig = useBranding();
	const wishlistText = useWishlistText();
	const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-12">
				<div className="text-center">
					<div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
					<p className="mt-4 text-sm text-neutral-500">{wishlistText.loadingWishlist}</p>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold text-neutral-900">{wishlistText.myWishlistTitle}</h1>
					<p className="mt-1 text-neutral-500">
						{wishlistText.itemsCount.replace("{count}", items.length.toString())}
					</p>
				</div>
				{items.length > 0 && (
					<button
						onClick={() => clearWishlist()}
						className="text-sm font-medium text-neutral-600 hover:text-neutral-900"
					>
						{wishlistText.clearAllButton}
					</button>
				)}
			</div>

			{/* Wishlist Grid */}
			{items.length === 0 ? (
				<div className="rounded-lg border border-dashed border-neutral-300 bg-neutral-50/50 px-6 py-16 text-center">
					<p className="text-lg font-semibold text-neutral-900">{wishlistText.emptyWishlistTitle}</p>
					<p className="mt-2 mx-auto max-w-sm text-sm text-neutral-500">
						{wishlistText.emptyWishlistMessage}
					</p>
					<Link
						href={`/${channel}/products`}
						className="mt-6 inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
						style={{ backgroundColor: brandingConfig.colors.primary }}
					>
						{wishlistText.discoverProductsButton}
					</Link>
				</div>
			) : (
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{items.map((item, index) => {
						const hasDiscount = item.originalPrice && item.originalPrice > item.price;
						const discountPercent = hasDiscount
							? Math.round((1 - item.price / item.originalPrice!) * 100)
							: 0;

						return (
							<div
								key={item.id}
								className="group overflow-hidden rounded-lg border border-neutral-200 bg-white transition-shadow hover:shadow-sm"
							>
								<Link href={`/${item.channel || channel}/products/${item.slug}`} className="block">
									<div className="relative aspect-square overflow-hidden bg-neutral-100">
										{item.image && !imageErrors.has(item.id) ? (
											<Image
												src={item.image}
												alt={item.imageAlt || item.name}
												fill
												loader={imageLoader}
												className="object-cover transition-transform group-hover:scale-105"
												sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
												unoptimized={item.image.startsWith("data:") || item.image.startsWith("blob:")}
												onError={() => {
													setImageErrors(prev => new Set(prev).add(item.id));
												}}
											/>
										) : (
											<div className="flex h-full w-full items-center justify-center text-neutral-400">
												<svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
													<path
														strokeLinecap="round"
														strokeLinejoin="round"
														strokeWidth={1.5}
														d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
													/>
												</svg>
											</div>
										)}
										{!item.inStock && (
											<div className="absolute inset-0 flex items-center justify-center bg-black/50">
												<span className="rounded-full bg-white px-4 py-2 text-sm font-medium text-neutral-900">
													{wishlistText.outOfStock}
												</span>
											</div>
										)}
										{hasDiscount && (
											<span className="absolute left-3 top-3 rounded-full bg-red-500 px-2 py-1 text-xs font-bold text-white">
												-{discountPercent}%
											</span>
										)}
										<button
											onClick={(e) => {
												e.preventDefault();
												removeItem(item.id);
											}}
											className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-md transition-colors hover:bg-red-50"
											title={wishlistText.removeFromWishlistTooltip}
											type="button"
										>
											<svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 24 24">
												<path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
											</svg>
										</button>
									</div>
								</Link>
								<div className="p-4">
									{item.category && (
										<p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
											{item.category}
										</p>
									)}
									<Link href={`/${item.channel || channel}/products/${item.slug}`}>
										<h3 className="mt-1 font-medium text-neutral-900 transition-colors hover:text-neutral-600">
											{item.name}
										</h3>
									</Link>
									<div className="mt-2 flex items-center gap-2">
										<span className="text-lg font-bold text-neutral-900">
											{formatMoney(item.price, item.currency)}
										</span>
										{hasDiscount && (
											<span className="text-sm text-neutral-500 line-through">
												{formatMoney(item.originalPrice!, item.currency)}
											</span>
										)}
									</div>
									<WishlistDeliveryBadge metadata={item.metadata} inStock={item.inStock} />
									<div className="mt-4 flex gap-2">
										<Link
											href={`/${item.channel || channel}/products/${item.slug}`}
											className="flex-1 rounded-lg py-2.5 text-center text-sm font-semibold text-white transition-opacity hover:opacity-90"
											style={{ backgroundColor: item.inStock ? brandingConfig.colors.primary : "#9ca3af" }}
										>
											{item.inStock ? wishlistText.viewProduct : wishlistText.viewDetails}
										</Link>
										<button
											onClick={() => removeItem(item.id)}
											className="flex items-center justify-center rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-neutral-600 transition-colors hover:bg-neutral-50 hover:text-red-600"
											title={wishlistText.removeFromWishlistTooltip}
											type="button"
										>
											<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													strokeWidth={1.5}
													d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
												/>
											</svg>
										</button>
									</div>
									<p className="mt-3 text-center text-xs text-neutral-400">
										{wishlistText.addedOn.replace("{date}", new Date(item.addedAt).toLocaleDateString())}
									</p>
								</div>
							</div>
						);
					})}
				</div>
			)}
		</div>
	);
}

function WishlistDeliveryBadge({ metadata, inStock }: { metadata?: Array<{ key: string; value: string }> | null; inStock: boolean }) {
	const ecommerce = useEcommerceSettings();
	const pdText = useProductDetailText();
	if (!inStock || !ecommerce.shipping?.showEstimatedDelivery) return null;
	const est = getProductShippingEstimate(metadata);
	if (!est) return null;
	const days = formatEstimate(est, ecommerce.shipping.estimatedDeliveryFormat ?? "range");
	const label = pdText.deliveryEstimateLabel?.replace("{days}", days) ?? `Ships in ${days} days`;
	return <p className="mt-1 text-xs text-neutral-500">{label}</p>;
}

