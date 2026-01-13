"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useWishlist } from "@/lib/wishlist";
import { storeConfig } from "@/config";
import { formatMoney } from "@/lib/utils";
import imageLoader from "@/lib/imageLoader";

interface WishlistClientProps {
	channel: string;
}

export function WishlistClient({ channel }: WishlistClientProps) {
	const { items, removeItem, clearWishlist, isLoading } = useWishlist();
	const { branding } = storeConfig;
	const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-12">
				<div className="text-center">
					<div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
					<p className="mt-4 text-sm text-neutral-500">Loading wishlist...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-6 animate-fade-in">
			{/* Header */}
			<div className="flex items-center justify-between animate-fade-in-up" style={{ animationDelay: "50ms", animationFillMode: "both" }}>
				<div>
					<h1 className="text-2xl font-bold text-neutral-900">My Wishlist</h1>
					<p className="mt-1 text-neutral-500">
						{items.length} item{items.length !== 1 ? "s" : ""} saved
					</p>
				</div>
				{items.length > 0 && (
					<button
						onClick={() => clearWishlist()}
						className="text-sm font-medium text-neutral-600 hover:text-neutral-900"
					>
						Clear All
					</button>
				)}
			</div>

			{/* Wishlist Grid */}
			{items.length === 0 ? (
				<div className="flex flex-col items-center justify-center rounded-xl bg-white px-6 py-16 text-center shadow-sm ring-1 ring-neutral-100 animate-fade-in-up" style={{ animationDelay: "100ms", animationFillMode: "both" }}>
					<div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-50">
						<svg className="h-10 w-10 text-red-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={1.5}
								d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
							/>
						</svg>
					</div>
					<h2 className="mt-6 text-xl font-semibold text-neutral-900">Your wishlist is empty</h2>
					<p className="mt-2 max-w-sm text-neutral-500">
						Save items you love by clicking the heart icon on any product.
					</p>
					<Link
						href={`/${channel}/products`}
						className="mt-6 inline-flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
						style={{ backgroundColor: branding.colors.primary }}
					>
						Discover Products
						<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
						</svg>
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
								className="group overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-neutral-100 animate-fade-in-up"
								style={{ animationDelay: `${100 + index * 50}ms`, animationFillMode: "both" }}
							>
								<Link href={`/${channel}/products/${item.slug}`} className="block">
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
													Out of Stock
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
											title="Remove from wishlist"
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
									<Link href={`/${channel}/products/${item.slug}`}>
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
									<div className="mt-4 flex gap-2">
										<Link
											href={`/${channel}/products/${item.slug}`}
											className="flex-1 rounded-lg py-2.5 text-center text-sm font-semibold text-white transition-opacity hover:opacity-90"
											style={{ backgroundColor: item.inStock ? branding.colors.primary : "#9ca3af" }}
										>
											{item.inStock ? "View Product" : "View Details"}
										</Link>
										<button
											onClick={() => removeItem(item.id)}
											className="flex items-center justify-center rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-neutral-600 transition-colors hover:bg-neutral-50 hover:text-red-600"
											title="Remove"
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
										Added {new Date(item.addedAt).toLocaleDateString()}
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

