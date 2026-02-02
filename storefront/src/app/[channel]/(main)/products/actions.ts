"use server";

import edjsHTML from "editorjs-html";
import { revalidatePath } from "next/cache";
import xss from "xss";
import {
	ProductDetailsDocument,
	CheckoutFindDocument,
	CheckoutAddLinesDocument,
} from "@/gql/graphql";
import { executeGraphQL } from "@/lib/graphql";
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
		attributes?: Array<{
			attribute: { id: string; name: string; slug: string };
			values: Array<{ id: string; name: string; slug: string }>;
		}> | null;
		pricing?: unknown;
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
	const { product } = await executeGraphQL(ProductDetailsDocument, {
		variables: { slug: decodedSlug, channel },
		cache: "no-cache",
	});

	if (!product) {
		return null;
	}

	const description = product.description
		? parser.parse(JSON.parse(product.description))
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

	return {
		id: product.id,
		name: product.name,
		slug: product.slug,
		description: descriptionHtml,
		category: product.category?.name || null,
		categorySlug: product.category?.slug || null,
		price,
		originalPrice,
		isAvailable,
		images,
		variants: variants.map((v) => ({
			id: v.id,
			name: v.name,
			quantityAvailable: v.quantityAvailable || 0,
			attributes: v.attributes
				? v.attributes.map((attr) => ({
						attribute: {
							id: attr.attribute.id,
							name: attr.attribute.name || "",
							slug: attr.attribute.slug || "",
						},
						values: attr.values.map((val) => ({
							id: val.id,
							name: val.name || "",
							slug: val.slug || "",
						})),
					}))
				: (null as unknown as ProductDetailPayload["variants"][0]["attributes"]),
			pricing: v.pricing,
		})),
		rating: (product as { rating?: number }).rating ?? null,
		reviewCount: (product as { reviews?: { totalCount?: number } }).reviews?.totalCount ?? null,
	};
}

const CHECKOUT_LINES_UPDATE_MUTATION = {
	toString: () => `mutation checkoutLinesUpdate($checkoutId: ID!, $lines: [CheckoutLineUpdateInput!]!) {
		checkoutLinesUpdate(id: $checkoutId, lines: $lines) {
			errors { message field code }
			checkout { id lines { id quantity variant { id } } }
		}
	}`,
} as const;

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
		let currentCheckout: Awaited<
			ReturnType<typeof executeGraphQL<typeof CheckoutFindDocument>>
		>["checkout"] = null;

		if (checkoutId) {
			const result = await executeGraphQL(CheckoutFindDocument, {
				variables: { id: checkoutId },
				cache: "no-cache",
			});
			currentCheckout = result.checkout;
		}

		if (!currentCheckout) {
			const result = await Checkout.create({ channel });
			currentCheckout = result.checkoutCreate?.checkout ?? null;
			if (currentCheckout) {
				checkoutId = currentCheckout.id;
				await Checkout.saveIdToCookie(channel, checkoutId);
			}
		}

		if (!currentCheckout) {
			return { success: false, error: "Could not create or find cart" };
		}

		const decodedVariantId = decodeURIComponent(variantId);
		const existingLine = currentCheckout.lines?.find(
			(line: { variant?: { id: string }; isGift?: boolean }) =>
				line.variant?.id === decodedVariantId && !(line as { isGift?: boolean }).isGift
		);

		if (existingLine) {
			const newQuantity = existingLine.quantity + quantity;
			const result = await executeGraphQL(CHECKOUT_LINES_UPDATE_MUTATION as any, {
				variables: {
					checkoutId: currentCheckout.id,
					lines: [{ lineId: existingLine.id, quantity: newQuantity }],
				},
				cache: "no-cache",
			});

			const update = (result as { checkoutLinesUpdate?: { errors?: Array<{ message?: string }>; checkout?: unknown } })
				?.checkoutLinesUpdate;
			if (update?.errors?.length) {
				return {
					success: false,
					error: update.errors[0].message ?? "Failed to update cart",
				};
			}
			if (!update?.checkout) {
				return { success: false, error: "Cart update did not return checkout" };
			}
		} else {
			const result = await executeGraphQL(CheckoutAddLinesDocument, {
				variables: {
					id: currentCheckout.id,
					lines: [{ variantId: decodedVariantId, quantity }],
				},
				cache: "no-cache",
			});

			const addResult = result.checkoutLinesAdd;
			if (addResult?.errors?.length) {
				const msg =
					addResult.errors[0].message ??
					addResult.errors[0].code ??
					"Failed to add item to cart";
				return { success: false, error: msg };
			}
			if (!addResult?.checkout) {
				return {
					success: false,
					error: "Could not add item to cart. Please try again.",
				};
			}
		}

		revalidatePath("/cart");
		revalidatePath(`/${channel}/cart`);
		if (productSlug) {
			revalidatePath(`/${channel}/products/${productSlug}`);
		}

		const { getCurrentUser, saveUserCheckoutId } = await import("@/lib/checkout");
		void getCurrentUser()
			.then((currentUser) => {
				if (!currentUser?.id) return;
				const checkoutUser = (currentCheckout as { user?: { id: string } | null })?.user
					?.id;
				if (checkoutUser === currentUser.id) {
					return saveUserCheckoutId(currentUser.id, channel, currentCheckout.id);
				}
				return import("@/gql/graphql").then(({ CheckoutCustomerAttachDocument }) =>
					executeGraphQL(CheckoutCustomerAttachDocument, {
						variables: { checkoutId: currentCheckout.id },
						cache: "no-cache",
					}).then(() =>
						saveUserCheckoutId(currentUser.id, channel, currentCheckout.id)
					)
				);
			})
			.catch(() => {});

		return { success: true };
	} catch (error: unknown) {
		const errorMessage =
			error instanceof Error ? error.message : "Failed to add item to cart";
		return { success: false, error: errorMessage };
	}
}
