"use server";

import edjsHTML from "editorjs-html";
import { revalidatePath } from "next/cache";
import xss from "xss";
import {
	ProductDetailsDocument,
	CheckoutAddLinesDocument,
	StockAlertSubscribeDocument,
	StockAlertUnsubscribeDocument,
} from "@/gql/graphql";
import { executeGraphQL } from "@/lib/graphql";
import { getLanguageCodeForChannel } from "@/lib/language";
import { formatMoney, formatMoneyRange } from "@/lib/utils";
import * as Checkout from "@/lib/checkout";

const parser = edjsHTML();

/**
 * Product payload shape for ProductDetailClient (same as built in products/[slug]/page.tsx).
 */
export interface ProductDetailPayload {
	id: string;
	name: string;
	slug: string;
	description: string | null;
	category: string | null;
	categorySlug: string | null;
	price: string;
	originalPrice: string | null;
	isAvailable: boolean;
	images: Array<{ url: string; alt: string | null }>;
	variants: Array<{
		id: string;
		name: string;
		quantityAvailable: number;
		trackInventory: boolean;
		quantityLimitPerCustomer: number | null;
		attributes?: Array<{
			attribute: { id: string; name: string; slug: string; inputType: string | null };
			values: Array<{ id: string; name: string; slug: string; value: string | null }>;
		}> | null;
		pricing?: {
			price?: { gross: { amount: number; currency: string } } | null;
			priceUndiscounted?: { gross: { amount: number; currency: string } } | null;
		} | null;
	}>;
	productAttributes?: Array<{
		attribute: { id: string; name: string; slug: string; inputType: string | null; visibleInStorefront?: boolean };
		values: Array<{
			id: string; name: string; slug: string; value: string | null;
			richText: string | null; plainText: string | null; boolean: boolean | null;
			date: string | null; dateTime: string | null;
			file: { url: string; contentType: string | null } | null;
		}>;
	}>;
	rating?: number | null;
	reviewCount?: number | null;
}

/**
 * Fetches full product details for Quick View modal.
 * Builds the same payload as the PDP so ProductDetailClient can render identically.
 */
export async function getProductDetailsForQuickView(
	slug: string,
	channel: string
): Promise<ProductDetailPayload | null> {
	const decodedSlug = decodeURIComponent(slug);
	const languageCode = getLanguageCodeForChannel(channel);
	const { product } = await executeGraphQL(ProductDetailsDocument, {
		variables: { slug: decodedSlug, channel, languageCode },
		revalidate: 30,
	});

	if (!product) {
		return null;
	}

	const rawDescription = product.translation?.description || product.description;
	const description = rawDescription
		? parser.parse(JSON.parse(rawDescription))
		: null;
	const descriptionHtml = description
		? description.map((content: string) => xss(content)).join("")
		: null;

	const images = [
		product.thumbnail && { url: product.thumbnail.url, alt: product.thumbnail.alt },
		...(product.media?.map((m) => ({ url: m.url, alt: m.alt })) || []),
	].filter(Boolean) as Array<{ url: string; alt: string | null }>;

	const variants = product.variants || [];
	const isAvailable = variants.some((v) => v.quantityAvailable) ?? false;

	const priceRaw = isAvailable
		? formatMoneyRange({
				start: product.pricing?.priceRange?.start?.gross,
				stop: product.pricing?.priceRange?.stop?.gross,
			})
		: "";
	const price = priceRaw || "";

	const productUndiscounted = product.pricing?.priceRangeUndiscounted?.start?.gross;
	const currentPrice = product.pricing?.priceRange?.start?.gross;
	const hasDiscount =
		productUndiscounted &&
		currentPrice &&
		productUndiscounted.amount > currentPrice.amount;
	const originalPrice = hasDiscount
		? formatMoney(
				productUndiscounted.amount,
				productUndiscounted.currency || "USD"
			)
		: null;

	// Extract product-level attributes
	const productAttributes = (product as any).attributes?.map((a: any) => ({
		attribute: {
			id: a.attribute.id,
			name: a.attribute.translation?.name || a.attribute.name || "",
			slug: a.attribute.slug || "",
			inputType: a.attribute.inputType || null,
			visibleInStorefront: true, // Saleor filters to visible-only for anonymous users
		},
		values: a.values.map((v: any) => ({
			id: v.id,
			name: v.translation?.name || v.name || "",
			slug: v.slug || "",
			value: v.value || null,
			richText: v.richText || null,
			plainText: v.plainText || null,
			boolean: v.boolean ?? null,
			date: v.date || null,
			dateTime: v.dateTime || null,
			file: v.file ? { url: v.file.url, contentType: v.file.contentType || null } : null,
		})),
	})) || [];

	return {
		id: product.id,
		name: product.translation?.name || product.name,
		slug: product.slug,
		description: descriptionHtml,
		category: product.category ? (product.category.translation?.name || product.category.name) : null,
		categorySlug: product.category?.slug || null,
		price,
		originalPrice,
		isAvailable,
		images,
		variants: variants.map((v) => ({
			id: v.id,
			name: v.translation?.name || v.name,
			quantityAvailable: v.quantityAvailable || 0,
			trackInventory: (v as any).trackInventory ?? true,
			quantityLimitPerCustomer: (v as any).quantityLimitPerCustomer ?? null,
			attributes: v.attributes
				? v.attributes.map((attr) => ({
						attribute: {
							id: attr.attribute.id,
							name: attr.attribute.translation?.name || attr.attribute.name || "",
							slug: attr.attribute.slug || "",
							inputType: (attr.attribute as any).inputType || null,
						},
						values: attr.values.map((val) => ({
							id: val.id,
							name: val.translation?.name || val.name || "",
							slug: val.slug || "",
							value: (val as any).value || null,
						})),
					}))
				: (null as unknown as ProductDetailPayload["variants"][0]["attributes"]),
			pricing: v.pricing,
		})),
		productAttributes,
		rating: (product as { rating?: number }).rating ?? null,
		reviewCount: (product as { reviews?: { totalCount?: number } }).reviews?.totalCount ?? null,
	};
}

/**
 * Shared add-to-cart server action for PDP and Quick View.
 * FormData must include: variantId, quantity, channel.
 * Optional: productSlug (for revalidating product page).
 */
export async function addProductToCartAction(
	formData: FormData
): Promise<{ success: boolean; error?: string }> {
	const variantId = formData.get("variantId") as string;
	const quantity = parseInt((formData.get("quantity") as string) || "1", 10);
	const channel = (formData.get("channel") as string) || "";
	const productSlug = (formData.get("productSlug") as string) || undefined;

	if (!variantId) {
		return { success: false, error: "Variant ID is required" };
	}
	if (!channel) {
		return { success: false, error: "Channel is required" };
	}

	try {
		let checkoutId = await Checkout.getIdFromCookies(channel);
		const decodedVariantId = decodeURIComponent(variantId);

		// If no checkout exists, create one first
		if (!checkoutId) {
			const result = await Checkout.create({ channel });
			const newCheckout = result.checkoutCreate?.checkout;
			if (!newCheckout) {
				return { success: false, error: "Could not create cart" };
			}
			checkoutId = newCheckout.id;
			await Checkout.saveIdToCookie(channel, checkoutId);
		}

		// Single mutation — checkoutLinesAdd merges quantities for existing variants
		const languageCode = getLanguageCodeForChannel(channel);

		const result = await executeGraphQL(CheckoutAddLinesDocument, {
			variables: {
				id: checkoutId,
				lines: [{ variantId: decodedVariantId, quantity }],
				languageCode,
			},
			cache: "no-cache",
		});

		const addResult = result.checkoutLinesAdd;

		// If checkout was expired/invalid, create a new one and retry once
		if (addResult?.errors?.some((e) => e.code === "NOT_FOUND" || e.field === "id")) {
			const retryResult = await Checkout.create({ channel });
			const newCheckout = retryResult.checkoutCreate?.checkout;
			if (!newCheckout) {
				return { success: false, error: "Could not create cart" };
			}
			checkoutId = newCheckout.id;
			await Checkout.saveIdToCookie(channel, checkoutId);

			const retry = await executeGraphQL(CheckoutAddLinesDocument, {
				variables: {
					id: checkoutId,
					lines: [{ variantId: decodedVariantId, quantity }],
					languageCode,
				},
				cache: "no-cache",
			});
			const retryAdd = retry.checkoutLinesAdd;
			if (retryAdd?.errors?.length) {
				return { success: false, error: retryAdd.errors[0].message ?? "Failed to add item to cart" };
			}
			if (!retryAdd?.checkout) {
				return { success: false, error: "Could not add item to cart." };
			}
		} else if (addResult?.errors?.length) {
			const msg =
				addResult.errors[0].message ??
				addResult.errors[0].code ??
				"Failed to add item to cart";
			return { success: false, error: msg };
		} else if (!addResult?.checkout) {
			return { success: false, error: "Could not add item to cart. Please try again." };
		}

		revalidatePath(`/${channel}/cart`);

		// Fire-and-forget: attach user to checkout if logged in
		void import("@/lib/checkout").then(({ getCurrentUser, saveUserCheckoutId }) =>
			getCurrentUser()
				.then((currentUser) => {
					if (!currentUser?.id) return;
					return import("@/gql/graphql").then(({ CheckoutCustomerAttachDocument }) =>
						executeGraphQL(CheckoutCustomerAttachDocument, {
							variables: { checkoutId },
							cache: "no-cache",
						}).then(() =>
							saveUserCheckoutId(currentUser.id, channel, checkoutId!)
						)
					);
				})
				.catch(() => {})
		);

		return { success: true };
	} catch (error: unknown) {
		const errorMessage =
			error instanceof Error ? error.message : "Failed to add item to cart";
		return { success: false, error: errorMessage };
	}
}

/**
 * Subscribe to stock alert notifications for a variant.
 */
export async function subscribeToStockAlert(
	variantId: string,
	email: string
): Promise<{ success: boolean; alreadySubscribed?: boolean; error?: string }> {
	try {
		const result = await executeGraphQL(StockAlertSubscribeDocument, {
			variables: {
				input: {
					variantId,
					email: email.trim().toLowerCase(),
				},
			},
			cache: "no-store",
		});

		const data = result.stockAlertSubscribe;
		if (data?.errors && data.errors.length > 0) {
			return { success: false, error: data.errors[0].message ?? "Failed to subscribe" };
		}
		if (data?.alreadySubscribed) {
			return { success: true, alreadySubscribed: true };
		}
		if (data?.subscribed) {
			return { success: true };
		}
		return { success: false, error: "Something went wrong. Please try again." };
	} catch (err) {
		const msg = err instanceof Error ? err.message : "Failed to subscribe. Please try again.";
		return { success: false, error: msg };
	}
}

/**
 * Unsubscribe from stock alert notifications for a variant.
 */
export async function unsubscribeFromStockAlert(
	variantId: string,
	email: string
): Promise<{ success: boolean; error?: string }> {
	try {
		const result = await executeGraphQL(StockAlertUnsubscribeDocument, {
			variables: {
				input: {
					variantId,
					email: email.trim().toLowerCase(),
				},
			},
			cache: "no-store",
		});

		const data = result.stockAlertUnsubscribe;
		if (data?.errors && data.errors.length > 0) {
			return { success: false, error: data.errors[0].message ?? "Failed to unsubscribe" };
		}
		if (data?.unsubscribed) {
			return { success: true };
		}
		return { success: false, error: "Something went wrong. Please try again." };
	} catch (err) {
		const msg = err instanceof Error ? err.message : "Failed to unsubscribe. Please try again.";
		return { success: false, error: msg };
	}
}
