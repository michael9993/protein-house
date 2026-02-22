import { NextRequest, NextResponse } from "next/server";
import * as Checkout from "@/lib/checkout";
import { getClientIp, rateLimitResponse, normalLimiter } from "@/lib/rate-limit";

/**
 * API route to get cart data for the cart drawer.
 * Returns checkout lines with product details.
 */
export async function GET(request: NextRequest) {
    const { allowed, resetAt } = normalLimiter(getClientIp(request));
    if (!allowed) return rateLimitResponse(resetAt);

    try {
        const searchParams = request.nextUrl.searchParams;
        const channel = searchParams.get("channel");

        if (!channel) {
            return NextResponse.json({ checkout: null }, { status: 200 });
        }

        const checkoutId = await Checkout.getIdFromCookies(channel);
        if (!checkoutId) {
            return NextResponse.json({ checkout: null }, { status: 200 });
        }

        const checkout = await Checkout.find(checkoutId);
        if (!checkout) {
            return NextResponse.json({ checkout: null }, { status: 200 });
        }

        // Return simplified checkout data for the drawer
        // Map to a cleaner structure for the client
        const data = {
            checkout: {
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
                    unitPrice: {
                        gross: {
                            amount: line.variant.pricing?.price?.gross.amount || (line.totalPrice.gross.amount / line.quantity),
                            currency: line.variant.pricing?.price?.gross.currency || line.totalPrice.gross.currency,
                        },
                    },
                    variant: {
                        id: line.variant.id,
                        name: line.variant.name,
                        quantityAvailable: line.variant.quantityAvailable || 0,
                        attributes: line.variant.attributes ? line.variant.attributes.map(attr => ({
                            attribute: { name: attr.attribute.name },
                            values: attr.values.map(val => ({ name: val.name }))
                        })) : [],
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
                            name: line.variant.product.name,
                            thumbnail: line.variant.product.thumbnail ? {
                                url: line.variant.product.thumbnail.url,
                                alt: line.variant.product.thumbnail.alt || null,
                            } : null,
                            category: line.variant.product.category ? {
                                name: line.variant.product.category.name,
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
                voucherCode: (checkout as { voucherCode?: string }).voucherCode ?? null,
                voucherId: (checkout as { voucher?: { id: string } }).voucher?.id ?? null,
                discount: (checkout as { discount?: { amount: number; currency: string } }).discount
                    ? {
                            amount: (checkout as { discount: { amount: number; currency: string } }).discount.amount,
                            currency: (checkout as { discount: { amount: number; currency: string } }).discount.currency,
                        }
                    : null,
                discountName: (checkout as { discountName?: string }).discountName ?? null,
                // Infer shipping voucher from discountName for drawer (eligibility-only display)
                voucherType: (() => {
                    const name = (checkout as { discountName?: string }).discountName ?? "";
                    if (/shipping|free\s*shipping|משלוח/i.test(name)) return "SHIPPING";
                    return undefined;
                })(),
            },
        };
        return NextResponse.json(data, { status: 200 });
    } catch (error) {
        console.debug('[Cart Data API] Error:', error);
        return NextResponse.json({ checkout: null }, { status: 200 });
    }
}
