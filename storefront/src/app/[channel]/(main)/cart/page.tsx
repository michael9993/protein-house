import * as Checkout from "@/lib/checkout";
import { storeConfig } from "@/config";
import { CartClient } from "./CartClient";
import { CartRestoreTrigger } from "./CartRestoreTrigger";
import { CartPageDrawerGuard } from "./CartPageDrawerGuard";
import {
    deleteLineAction as sharedDeleteLineAction,
    updateLineQuantityAction as sharedUpdateLineQuantityAction,
    applyPromoCodeAction as sharedApplyPromoCodeAction,
    removePromoCodeAction as sharedRemovePromoCodeAction,
    createCheckoutWithItemsAction as sharedCreateCheckoutWithItemsAction,
} from "@/app/cart-actions";

export const metadata = {
	title: `Shopping Cart | ${storeConfig.store.name}`,
	description: "Review your shopping cart",
	robots: { index: false, follow: false },
};

export default async function Page(props: { params: Promise<{ channel: string }> }) {
	const params = await props.params;
	
	// Use resolveCheckout which handles:
	// - Restoring user's saved checkout on login
	// - Finding existing session checkout
	// - Creating new checkout if needed
	let { checkout } = await Checkout.resolveCheckout({ channel: params.channel });

	// Auto-apply vouchers with metadata auto=true when checkout has no voucher yet (check cart value vs voucher rules)
	const subtotalAmount = checkout?.subtotalPrice?.gross?.amount ?? 0;
	let appliedVoucherInfo: Awaited<ReturnType<typeof Checkout.applyAutoVouchers>> = null;
	if (checkout?.id && !(checkout as { voucherCode?: string }).voucherCode) {
		appliedVoucherInfo = await Checkout.applyAutoVouchers(checkout.id, params.channel, subtotalAmount);
		if (appliedVoucherInfo) {
			checkout = await Checkout.find(checkout.id, { channel: params.channel, skipOwnershipCheck: true }) ?? checkout;
		}
	}

	// Server action for deleting lines (including gift lines)
	async function deleteLineAction(lineId: string, productSlug?: string) {
		"use server";
		return sharedDeleteLineAction(params.channel, lineId, productSlug);
	}

	// Server action for updating line quantity
	async function updateLineQuantityAction(lineId: string, quantity: number, productSlug?: string) {
		"use server";
		return await sharedUpdateLineQuantityAction(params.channel, lineId, quantity, productSlug);
	}

	async function applyPromoCodeAction(checkoutId: string, promoCode: string) {
		"use server";
		return sharedApplyPromoCodeAction(params.channel, checkoutId, promoCode);
	}
	async function removePromoCodeAction(checkoutId: string, options: { promoCodeId?: string; promoCode?: string }) {
		"use server";
		return sharedRemovePromoCodeAction(params.channel, checkoutId, options);
	}

	// Server action: create checkout with only selected items (keeps main cart intact); applies cart voucher if any
	async function createCheckoutWithItems(
		items: { variantId: string; quantity: number }[],
		channelSlug: string
	): Promise<{ checkoutId: string } | null> {
		"use server";
		const voucherCode = (checkout as { voucherCode?: string })?.voucherCode ?? undefined;
		return sharedCreateCheckoutWithItemsAction(channelSlug, items, voucherCode);
	}

	// Transform checkout data for client component
	const cartData = checkout && checkout.lines ? {
		id: checkout.id,
		lines: checkout.lines.map((line) => ({
			id: line.id,
			quantity: line.quantity,
			isGift: (line as { isGift?: boolean }).isGift ?? false,
			totalPrice: {
				gross: {
					amount: line.totalPrice.gross.amount,
					currency: line.totalPrice.gross.currency,
				},
			},
			// Unit price from variant pricing
			unitPrice: {
				gross: {
					amount: line.variant.pricing?.price?.gross.amount || (line.totalPrice.gross.amount / line.quantity),
					currency: line.variant.pricing?.price?.gross.currency || line.totalPrice.gross.currency,
				},
			},
			variant: {
				id: line.variant.id,
				name: (line.variant as any).translation?.name || line.variant.name,
				quantityAvailable: line.variant.quantityAvailable || 0,
				attributes: line.variant.attributes && line.variant.attributes.length > 0 ? line.variant.attributes : null,
				pricing: line.variant.pricing ? {
					price: line.variant.pricing.price ? {
						gross: {
							amount: line.variant.pricing.price.gross.amount,
							currency: line.variant.pricing.price.gross.currency,
						},
					} : null,
					priceUndiscounted: line.variant.pricing.priceUndiscounted ? {
						gross: {
							amount: line.variant.pricing.priceUndiscounted.gross.amount,
							currency: line.variant.pricing.priceUndiscounted.gross.currency,
						},
					} : null,
				} : null,
				product: {
					slug: line.variant.product.slug,
					name: (line.variant.product as any).translation?.name || line.variant.product.name,
					thumbnail: line.variant.product.thumbnail ? {
						url: line.variant.product.thumbnail.url,
						alt: line.variant.product.thumbnail.alt || null,
					} : null,
					category: line.variant.product.category ? {
						name: (line.variant.product.category as any).translation?.name || line.variant.product.category.name,
					} : null,
				},
			},
		})),
		totalPrice: {
			gross: {
				amount: checkout.totalPrice.gross.amount,
				currency: checkout.totalPrice.gross.currency,
			},
		},
		// Use totalPrice as subtotal since we don't have separate subtotalPrice
		subtotalPrice: {
			gross: {
				amount: checkout.totalPrice.gross.amount,
				currency: checkout.totalPrice.gross.currency,
			},
		},
		// Voucher/promo applied (from CheckoutFind: voucherCode, voucher.id, discount, discountName)
		voucherCode: (checkout as { voucherCode?: string }).voucherCode ?? null,
		voucherId: (checkout as { voucher?: { id: string } }).voucher?.id ?? null,
		discount: (checkout as { discount?: { amount: number; currency: string } }).discount
			? {
					amount: (checkout as { discount: { amount: number; currency: string } }).discount.amount,
					currency: (checkout as { discount: { amount: number; currency: string } }).discount.currency,
				}
			: null,
		discountName: (checkout as { discountName?: string }).discountName ?? null,
	} : null;

	return (
		<CartPageDrawerGuard channel={params.channel}>
			<CartRestoreTrigger channel={params.channel} />
			<CartClient
				cart={cartData as any}
				channel={params.channel}
				deleteLineAction={deleteLineAction}
				updateLineQuantityAction={updateLineQuantityAction}
				createCheckoutWithItems={createCheckoutWithItems}
				applyPromoCodeAction={applyPromoCodeAction}
				removePromoCodeAction={removePromoCodeAction}
			/>
		</CartPageDrawerGuard>
	);
}
