"use server";

import { executeGraphQL } from "@/lib/graphql";
import { CurrentUserDocument } from "@/gql/graphql";
import type { WishlistItem } from "@/lib/wishlist";
import { TypedDocumentString } from "@/gql/graphql";

const WISHLIST_METADATA_KEY = "wishlist";

// AccountUpdate mutation document
const AccountUpdateDocument = new TypedDocumentString(`
	mutation AccountUpdate($input: AccountInput!) {
		accountUpdate(input: $input) {
			user {
				id
				email
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
 * Get wishlist from user metadata
 */
export async function getWishlist(): Promise<WishlistItem[]> {
	try {
		// Server action - has access to cookies from the request
		// Use withAuth: true to send authentication cookies
		const result = await executeGraphQL(CurrentUserDocument, {
			cache: "no-store",
			withAuth: true, // Use authentication to get user metadata
		});

		const user = result.me;
		if (!user) {
			// User not authenticated - return empty array (don't throw)
			// This allows the client to distinguish between "no items" and "not authenticated"
			console.log("[Wishlist] No user found in response - user not authenticated");
			return [];
		}

		console.log("[Wishlist] ✅ User found:", user.id, "Loading wishlist metadata...");

		// Find wishlist metadata - metadata might not be in the type yet, so we need to check
		const metadata = (user as any).metadata as Array<{ key: string; value: string }> | undefined;
		
		if (!metadata || !Array.isArray(metadata)) {
			console.log("[Wishlist] No metadata array found for user");
			return [];
		}

		const wishlistMetadata = metadata.find((m: { key: string; value: string }) => m.key === WISHLIST_METADATA_KEY);
		
		if (!wishlistMetadata?.value) {
			console.log("[Wishlist] No wishlist metadata found for user (wishlist is empty)");
			return [];
		}

		try {
			const items = JSON.parse(wishlistMetadata.value) as WishlistItem[];
			if (!Array.isArray(items)) {
				console.error("[Wishlist] Parsed wishlist is not an array:", items);
				return [];
			}
			console.log("[Wishlist] ✅ Successfully parsed", items.length, "items from metadata");
			return items;
		} catch (error) {
			console.error("[Wishlist] ❌ Failed to parse wishlist metadata:", error);
			console.error("[Wishlist] Raw metadata value:", wishlistMetadata.value);
			return [];
		}
	} catch (error: any) {
		// Check if it's an auth error - if so, return empty array instead of throwing
		// This allows retry logic to work while not breaking the flow
		const errorMessage = error?.message || String(error);
		const isAuthError = errorMessage.includes("401") || 
		                   errorMessage.includes("403") || 
		                   errorMessage.includes("authentication") ||
		                   errorMessage.includes("not authenticated");
		
		if (isAuthError) {
			console.log("[Wishlist] 🔐 Authentication error - cookies might not be ready yet:", errorMessage);
			// Throw to trigger retry logic
			throw error;
		} else {
			console.error("[Wishlist] ❌ Error getting wishlist:", errorMessage);
			// Throw to trigger retry logic
			throw error;
		}
	}
}

/**
 * Save wishlist to user metadata
 */
async function saveWishlist(items: WishlistItem[]): Promise<{ success: boolean; error?: string }> {
	try {
		const result = await executeGraphQL(CurrentUserDocument, {
			cache: "no-store",
			withAuth: true, // Use authentication to get user
		});

		const user = result.me;
		if (!user) {
			return { success: false, error: "User not authenticated" };
		}

		// Get existing metadata
		const existingMetadata = ((user as any).metadata as Array<{ key: string; value: string }>) || [];
		
		// Filter out existing wishlist metadata
		const otherMetadata = existingMetadata.filter((m: { key: string; value: string }) => m.key !== WISHLIST_METADATA_KEY);
		
		// Build metadata array - always include wishlist entry (even if empty) to ensure it's saved/cleared properly
		const metadata = [
			...otherMetadata,
			{ key: WISHLIST_METADATA_KEY, value: items.length > 0 ? JSON.stringify(items) : "[]" },
		];

		const updateResult = await executeGraphQL(AccountUpdateDocument, {
			variables: {
				input: {
					metadata,
				},
			},
			cache: "no-store",
			withAuth: true, // Use authentication for mutation
		}) as any;

		if (updateResult.accountUpdate?.errors && updateResult.accountUpdate.errors.length > 0) {
			const errorMessage = updateResult.accountUpdate.errors[0]?.message || "Failed to save wishlist";
			return { success: false, error: errorMessage };
		}

		// Note: revalidatePath is not available in Server Actions in Next.js 13+
		// The cache will be invalidated on the next request
		return { success: true };
	} catch (error) {
		console.error("[Wishlist] Error saving wishlist:", error);
		return { success: false, error: "Failed to save wishlist" };
	}
}

/**
 * Add item to wishlist
 */
export async function addWishlistItem(item: Omit<WishlistItem, "addedAt">): Promise<{ success: boolean; error?: string }> {
	try {
		const currentItems = await getWishlist();
		
		// Check if item already exists
		if (currentItems.some((i) => i.id === item.id)) {
			return { success: true }; // Already in wishlist
		}

		const newItems = [...currentItems, { ...item, addedAt: new Date().toISOString() }];
		return await saveWishlist(newItems);
	} catch (error) {
		console.error("[Wishlist] Error adding item:", error);
		return { success: false, error: "Failed to add item to wishlist" };
	}
}

/**
 * Remove item from wishlist
 */
export async function removeWishlistItem(productId: string): Promise<{ success: boolean; error?: string }> {
	const currentItems = await getWishlist();
	const newItems = currentItems.filter((item) => item.id !== productId);
	return await saveWishlist(newItems);
}

/**
 * Clear wishlist
 */
export async function clearWishlist(): Promise<{ success: boolean; error?: string }> {
	return await saveWishlist([]);
}

/**
 * Migrate wishlist from localStorage to backend
 */
export async function migrateWishlistFromLocalStorage(items: WishlistItem[]): Promise<{ success: boolean; error?: string }> {
	if (items.length === 0) {
		return { success: true };
	}

	// Get current backend wishlist
	const backendItems = await getWishlist();
	
	// Merge: backend items take precedence, then add localStorage items that don't exist
	const backendIds = new Set(backendItems.map((i) => i.id));
	const newItems = [
		...backendItems,
		...items.filter((item) => !backendIds.has(item.id)),
	];

	return await saveWishlist(newItems);
}

