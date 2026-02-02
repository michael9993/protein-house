"use server";

import { cookies } from "next/headers";
import * as Checkout from "@/lib/checkout";
import { executeGraphQL } from "@/lib/graphql";
import { CheckoutDeleteLinesDocument, CheckoutCreateWithLinesDocument } from "@/gql/graphql";
import { revalidatePath } from "next/cache";

/** Cookie name for "no gift" checkout ID so checkout page can add it to sessionStorage (e.g. when opened in new tab). */
const CHECKOUT_NO_GIFT_COOKIE = "checkout-no-gift-id";

// Server action for deleting lines (including gift lines).
// Returns { success, error? } so the UI can show a toast on failure.
export async function deleteLineAction(
    channel: string,
    lineId: string,
    productSlug?: string
): Promise<{ success: boolean; error?: string }> {
    const currentCheckoutId = await Checkout.getIdFromCookies(channel);
    if (!currentCheckoutId) {
        return { success: false, error: "Cart not found" };
    }

    try {
        const result = await executeGraphQL(CheckoutDeleteLinesDocument, {
            variables: {
                checkoutId: currentCheckoutId,
                lineIds: [lineId],
            },
            cache: "no-cache",
        });

        const data = result as { checkoutLinesDelete?: { errors: Array<{ code: string }> } };
        const errors = data?.checkoutLinesDelete?.errors ?? [];
        if (errors.length > 0) {
            const code = errors[0]?.code ?? "INVALID";
            const message =
                code === "NON_REMOVABLE_GIFT_LINE"
                    ? "This gift cannot be removed."
                    : code === "INVALID" || code === "GRAPHQL_ERROR"
                      ? "Could not remove item. Please try again."
                      : "Could not remove item.";
            return { success: false, error: message };
        }

        revalidatePath("/cart");
        revalidatePath(`/${channel}/cart`);
        if (productSlug) {
            revalidatePath(`/${channel}/products/${productSlug}`);
        }
        return { success: true };
    } catch (err) {
        console.error("[Delete Line] Error:", err);
        return {
            success: false,
            error: err instanceof Error ? err.message : "Could not remove item",
        };
    }
}

// Server action for updating line quantity
export async function updateLineQuantityAction(channel: string, lineId: string, quantity: number, productSlug?: string) {
    const currentCheckoutId = await Checkout.getIdFromCookies(channel);
    if (!currentCheckoutId) {
        return { success: false, error: "Cart not found" };
    }

    try {
        // Use inline GraphQL mutation for updating checkout lines
        const checkoutLinesUpdateMutation = {
            toString: () => `mutation checkoutLinesUpdate($checkoutId: ID!, $lines: [CheckoutLineUpdateInput!]!) {
				checkoutLinesUpdate(id: $checkoutId, lines: $lines) {
					errors {
						message
						field
						code
					}
					checkout {
						id
						lines {
							id
							quantity
							variant {
								id
							}
						}
					}
				}
			}`,
        } as any;

        await executeGraphQL(checkoutLinesUpdateMutation, {
            variables: {
                checkoutId: currentCheckoutId,
                lines: [{
                    lineId: lineId,
                    quantity: quantity,
                }],
            },
            cache: "no-cache",
        });

        // Revalidate cart page
        revalidatePath("/cart");
        revalidatePath(`/${channel}/cart`);

        // Revalidate product page if product slug is provided
        if (productSlug) {
            revalidatePath(`/${channel}/products/${productSlug}`);
        }

        return { success: true };
    } catch (error: any) {
        console.error("[Update Quantity] Error:", error);

        // Handle GraphQL errors
        if (error instanceof Error && (error.name === "GraphQLError" || error.constructor?.name === "GraphQLError")) {
            let errorMessage = error.message || "Failed to update quantity";

            if ((error as any).errorResponse?.errors) {
                const errors = (error as any).errorResponse.errors;
                const firstError = errors[0];
                if (firstError) {
                    errorMessage = firstError.message || errorMessage;

                    if (firstError.code === "INSUFFICIENT_STOCK" || firstError.extensions?.code === "INSUFFICIENT_STOCK") {
                        errorMessage = "Sorry, there isn't enough stock available for this quantity.";
                    }
                }
            }

            return { success: false, error: errorMessage };
        }

        return { success: false, error: "Failed to update quantity. Please try again." };
    }
}

// Server action for applying a promo/voucher code (used by cart page and drawer)
export async function applyPromoCodeAction(channel: string, checkoutId: string, promoCode: string): Promise<{ success: boolean; error?: string }> {
    const result = await Checkout.applyPromoCode(checkoutId, promoCode.trim());
    if (result.success) {
        revalidatePath("/cart");
        revalidatePath(`/${channel}/cart`);
        return { success: true };
    }
    return { success: false, error: result.errors?.[0] ?? "Invalid code" };
}

// Server action for removing the applied voucher (used by cart page and drawer)
export async function removePromoCodeAction(
    channel: string,
    checkoutId: string,
    options: { promoCodeId?: string; promoCode?: string }
): Promise<{ success: boolean; error?: string }> {
    const result = await Checkout.removePromoCode(checkoutId, options);
    if (result.success) {
        revalidatePath("/cart");
        revalidatePath(`/${channel}/cart`);
        return { success: true };
    }
    return { success: false, error: result.errors?.[0] ?? "Failed to remove" };
}

/**
 * Create a checkout with only the given lines (e.g. selected items from cart).
 * Used when user proceeds to checkout with partial selection (e.g. gift deselected).
 * Does NOT save the new checkout ID to cookies so the main cart stays intact.
 * If voucherCode is provided (from the cart), it is applied to the new checkout;
 * otherwise auto-vouchers are applied. Any gift lines the backend adds are then removed.
 */
export async function createCheckoutWithItemsAction(
    channel: string,
    items: { variantId: string; quantity: number }[],
    voucherCode?: string | null
): Promise<{ checkoutId: string } | null> {
    try {
        if (!items.length || !channel) return null;

        const { checkoutCreate } = await executeGraphQL(CheckoutCreateWithLinesDocument, {
            variables: {
                channel,
                lines: items.map((item) => ({ variantId: item.variantId, quantity: item.quantity })),
            },
            cache: "no-cache",
        });

        if (checkoutCreate?.errors?.length) {
            console.error("[Create Checkout With Items] Errors:", checkoutCreate.errors);
            return null;
        }

        const newCheckoutId = checkoutCreate?.checkout?.id;
        if (!newCheckoutId) return null;

        if (voucherCode?.trim()) {
            const applied = await Checkout.applyPromoCode(newCheckoutId, voucherCode.trim());
            if (!applied.success) {
                console.warn("[Create Checkout With Items] Could not apply voucher:", applied.errors);
            }
        } else {
            await Checkout.applyAutoVouchers(newCheckoutId, channel);
        }

        // Remove any gift lines the backend may have auto-added (e.g. after applying voucher)
        const checkout = await Checkout.find(newCheckoutId, { channel, skipOwnershipCheck: true });
        const giftLineIds = checkout?.lines?.filter((l) => (l as { isGift?: boolean }).isGift).map((l) => l.id) ?? [];
        if (giftLineIds.length > 0) {
            await executeGraphQL(CheckoutDeleteLinesDocument, {
                variables: { checkoutId: newCheckoutId, lineIds: giftLineIds },
                cache: "no-cache",
            });
        }

        // Set short-lived cookie so checkout page can add this ID to no-gift list (e.g. when opened in new tab)
        try {
            (await cookies()).set(CHECKOUT_NO_GIFT_COOKIE, newCheckoutId, {
                maxAge: 120,
                path: "/",
                sameSite: "lax",
            });
        } catch {
            /* ignore */
        }

        return { checkoutId: newCheckoutId };
    } catch (error) {
        console.error("[Create Checkout With Items] Error:", error);
        return null;
    }
}
