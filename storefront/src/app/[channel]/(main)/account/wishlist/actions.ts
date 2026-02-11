"use server";

import { executeGraphQL } from "@/lib/graphql";
import { CurrentUserDocument } from "@/gql/graphql";
import type { WishlistItem } from "@/lib/wishlist";
import { TypedDocumentString } from "@/gql/graphql";

const WISHLIST_METADATA_KEY = "wishlist";

const AccountUpdateDocument = new TypedDocumentString(`
	mutation AccountUpdate($input: AccountInput!) {
		accountUpdate(input: $input) {
			user {
				id
				metadata {
					key
					value
				}
			}
			errors {
				field
				message
				code
			}
		}
	}
`) as any;

/**
 * Get wishlist from user metadata.
 * Returns null if user is not authenticated (distinct from empty array).
 */
export async function getWishlist(): Promise<WishlistItem[] | null> {
	try {
		const result = await executeGraphQL(CurrentUserDocument, {
			cache: "no-store",
			withAuth: true,
		});

		const user = result.me;
		if (!user) return null;

		const metadata = (user as any).metadata as Array<{ key: string; value: string }> | undefined;
		if (!metadata || !Array.isArray(metadata)) return [];

		const wishlistMetadata = metadata.find((m) => m.key === WISHLIST_METADATA_KEY);
		if (!wishlistMetadata?.value) return [];

		try {
			const items = JSON.parse(wishlistMetadata.value) as WishlistItem[];
			return Array.isArray(items) ? items : [];
		} catch {
			return [];
		}
	} catch (error: any) {
		const msg = error?.message || String(error);
		const isAuthError =
			msg.includes("401") || msg.includes("403") ||
			msg.includes("authentication") || msg.includes("not authenticated") ||
			msg.includes("Invalid token") || msg.includes("UNAUTHENTICATED") ||
			msg.includes("does not exist") || msg.includes("is inactive");

		if (isAuthError) return null;
		throw error;
	}
}

/**
 * Save wishlist items to user metadata.
 * Single mutation — no extra read needed (Saleor metadata is upsert).
 */
export async function saveWishlist(items: WishlistItem[]): Promise<{ success: boolean; error?: string }> {
	try {
		const updateResult = await executeGraphQL(AccountUpdateDocument, {
			variables: {
				input: {
					metadata: [
						{ key: WISHLIST_METADATA_KEY, value: JSON.stringify(items) },
					],
				},
			},
			cache: "no-store",
			withAuth: true,
		}) as any;

		const errors = updateResult.accountUpdate?.errors;
		if (errors && errors.length > 0) {
			return { success: false, error: errors[0]?.message || "Failed to save wishlist" };
		}
		return { success: true };
	} catch (error) {
		console.error("[Wishlist] Error saving:", error);
		return { success: false, error: "Failed to save wishlist" };
	}
}
