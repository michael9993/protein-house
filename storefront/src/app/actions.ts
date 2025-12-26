"use server";

import { cookies } from "next/headers";
import { getServerAuthClient } from "@/app/config";
import { executeGraphQL } from "@/lib/graphql";
import { CurrentUserDocument } from "@/gql/graphql";

/**
 * Gets the current user ID if authenticated.
 */
async function getCurrentUserId(): Promise<string | null> {
	try {
		const { me } = await executeGraphQL(CurrentUserDocument, {
			cache: "no-cache",
		});
		return me?.id || null;
	} catch {
		return null;
	}
}

/**
 * Gets user ID using CurrentUser query.
 * This works after auth cookies are set.
 */
async function getUserIdFromCurrentUser(): Promise<string | null> {
	try {
		const { me } = await executeGraphQL(CurrentUserDocument, {
			cache: "no-cache",
		});
		return me?.id || null;
	} catch (error) {
		console.error("[Get User ID] Error getting user from CurrentUser query:", error);
		return null;
	}
}

/**
 * Gets the current user for client-side use (e.g., checkout).
 * This is a Server Action that has access to cookies, just like the wishlist does.
 */
export async function getCurrentUser() {
	"use server";
	
	try {
		const { me } = await executeGraphQL(CurrentUserDocument, {
			cache: "no-cache",
		});
		return me;
	} catch (error) {
		console.error("[Get Current User] Error:", error);
		return null;
	}
}

/**
 * Saves the user's checkout ID to metadata.
 * User carts are stored in metadata (server-side, syncs across devices).
 * Cookies are ONLY used for guest carts.
 */
export async function saveUserCheckoutId(userId: string, channel: string, checkoutId: string) {
	"use server";
	
	const metadataKey = `checkoutId-${channel}`;
	
	try {
		const { AccountUpdateDocument } = await import("@/gql/graphql");
		const { TypedDocumentString } = await import("@/gql/graphql");
		
		// Get current user to read existing metadata
		const currentUser = await executeGraphQL(CurrentUserDocument, {
			cache: "no-cache",
		});
		
		if (!currentUser.me) {
			console.error(`[Save User Checkout] ❌ User not found`);
			return;
		}
		
		// Merge with existing metadata
		const existingMetadata = currentUser.me.metadata || [];
		const otherMetadata = existingMetadata.filter((m: any) => m.key !== metadataKey);
		const updatedMetadata = [
			...otherMetadata,
			{ key: metadataKey, value: checkoutId },
		];
		
		// Update user metadata
		await executeGraphQL(AccountUpdateDocument, {
			variables: {
				input: {
					metadata: updatedMetadata,
				},
			},
			cache: "no-cache",
		});
		
		console.log(`[Save User Checkout] ✅ Saved checkout ${checkoutId} to user metadata (key: ${metadataKey}) - syncs across devices`);
	} catch (error) {
		console.error(`[Save User Checkout] ❌ Failed to save to metadata:`, error);
	}
}

/**
 * Gets the saved checkout ID for a specific user from metadata.
 * User carts are stored in metadata (server-side, syncs across devices).
 * Cookies are ONLY used for guest carts.
 */
export async function getUserCheckoutId(userId: string, channel: string): Promise<string | null> {
	"use server";
	
	const metadataKey = `checkoutId-${channel}`;
	
	try {
		const currentUser = await executeGraphQL(CurrentUserDocument, {
			cache: "no-cache",
		});
		
		if (currentUser.me?.metadata) {
			const checkoutMetadata = currentUser.me.metadata.find((m: any) => m.key === metadataKey);
			if (checkoutMetadata?.value && checkoutMetadata.value.trim() !== "") {
				const checkoutId = checkoutMetadata.value;
				console.log(`[Get User Checkout] ✅ Found checkout ${checkoutId} in user metadata (key: ${metadataKey}) - syncs across devices`);
				return checkoutId;
			}
		}
		
		console.log(`[Get User Checkout] ❌ Checkout not found in metadata for channel ${channel}`);
		return null;
	} catch (error) {
		console.error(`[Get User Checkout] ❌ Failed to read from metadata:`, error);
		return null;
	}
}

/**
 * Logs out the current user.
 * 
 * Professional logout lifecycle:
 * 1. Save user's checkout to user-specific storage (preserves cart for re-login)
 * 2. Clear active session checkout cookies (detach from user cart)
 * 3. Sign out from Saleor (clears auth tokens)
 * 
 * This ensures:
 * - User's cart is preserved for re-login
 * - Next user/guest cannot see previous user's cart
 * - Session starts with empty anonymous cart
 */
export async function logout() {
	"use server";
	
	console.log("[Logout] 🔍 Starting logout process...");
	
	try {
		const userId = await getUserIdFromCurrentUser();
		console.log("[Logout] - User ID:", userId || "none");
		
		if (userId) {
			console.log("[Logout] 🔍 Step 1: Saving user's checkout to persistent storage...");
			
			// Step 1: Save current checkout to user metadata before signing out
			const cookieStore = await cookies();
			const channels = ["default-channel"]; // Add other channels if needed
			
			for (const channel of channels) {
				const checkoutId = cookieStore.get(`checkoutId-${channel}`)?.value;
				if (checkoutId) {
					await saveUserCheckoutId(userId, channel, checkoutId);
					console.log(`[Logout] ✅ Saved checkout ${checkoutId} to user metadata for channel ${channel}`);
				}
			}
			
			console.log("[Logout] ✅ Step 1: Saved checkout(s) to user storage");
		}
		
		// Step 2: Clear session checkout cookies
		console.log("[Logout] 🔍 Step 2: Clearing session checkout cookies...");
		const cookieStore = await cookies();
		const channels = ["default-channel"]; // Add other channels if needed
		let deletedCount = 0;
		
		for (const channel of channels) {
			const cookieName = `checkoutId-${channel}`;
			if (cookieStore.get(cookieName)) {
				cookieStore.delete(cookieName);
				deletedCount++;
			}
		}
		
		console.log(`[Logout] ✅ Step 2: Deleted ${deletedCount} session checkout cookie(s)`);
		
		// Step 3: Sign out from Saleor
		console.log("[Logout] 🔍 Step 3: Signing out from Saleor...");
		(await getServerAuthClient()).signOut();
		console.log("[Logout] ✅ Step 3: Signed out from Saleor");
		
		console.log("[Logout] 🎉 Logout complete - user's cart is saved for next login");
	} catch (error) {
		console.error("[Logout] ❌ Error during logout:", error);
		throw error;
	}
}

export async function clearCheckout(channel: string) {
	"use server";
	
	const cookieStore = await cookies();
	cookieStore.delete(`checkoutId-${channel}`);
}

/**
 * Restores user's cart on login.
 * The checkout is stored in Saleor database with user.id attached.
 * We restore from the saved checkout ID in metadata.
 * Guest cart merge should ONLY happen on signup, not login.
 * 
 * NOTE: This function is READ-ONLY - it does NOT write cookies.
 * Cookie writes must happen in Server Actions, not Server Components.
 */
export async function restoreUserCart(channel: string) {
	"use server";
	
	console.log(`[Restore Cart] 🔍 Step 1: Getting user ID for channel ${channel}...`);
	
	// Get user ID using CurrentUser query
	const userId = await getUserIdFromCurrentUser();
	
	if (!userId) {
		console.log(`[Restore Cart] ❌ User not authenticated, skipping restore`);
		return { success: false, error: "User not authenticated" };
	}
	
	console.log(`[Restore Cart] ✅ Step 2: User authenticated: ${userId}`);
	console.log(`[Restore Cart] 🔍 Step 3: Looking for saved checkout in metadata...`);
	
	const { executeGraphQL } = await import("@/lib/graphql");
	const { CheckoutFindDocument } = await import("@/gql/graphql");
	
	// Restore from saved checkout ID in metadata
	const savedCheckoutId = await getUserCheckoutId(userId, channel);
	
	if (!savedCheckoutId) {
		console.log(`[Restore Cart] ⚠️  Step 4: No saved checkout found in metadata for user ${userId}`);
		console.log(`[Restore Cart] 📝 This means either:`);
		console.log(`[Restore Cart]    - User never added items to cart before`);
		console.log(`[Restore Cart]    - Metadata was cleared`);
		console.log(`[Restore Cart]    - User is logging in for the first time`);
		console.log(`[Restore Cart] ✅ User will start with empty cart (this is OK)`);
		return { success: true, checkoutId: null };
	}
	
	console.log(`[Restore Cart] ✅ Step 4: Found saved checkout ID: ${savedCheckoutId}`);
	console.log(`[Restore Cart] 🔍 Step 5: Fetching checkout from Saleor...`);
	
	// Fetch checkout from Saleor
	const { checkout } = await executeGraphQL(CheckoutFindDocument, {
		variables: { id: savedCheckoutId },
		cache: "no-cache",
	});
	
	if (!checkout) {
		console.log(`[Restore Cart] ⚠️  Checkout not found in Saleor (may have been deleted)`);
		return { success: true, checkoutId: null };
	}
	
	console.log(`[Restore Cart] ✅ Step 6: Checkout found in Saleor`);
	console.log(`[Restore Cart]    - Checkout ID: ${checkout.id}`);
	console.log(`[Restore Cart]    - Checkout user: ${checkout.user?.id || "none"}`);
	console.log(`[Restore Cart]    - Checkout lines: ${checkout.lines?.length || 0}`);
	
	// Verify ownership
	if (checkout.user?.id !== userId) {
		console.log(`[Restore Cart] ⚠️  Checkout belongs to different user, skipping restore`);
		return { success: true, checkoutId: null };
	}
	
	console.log(`[Restore Cart] ✅ Step 7: Checkout ownership verified`);
	console.log(`[Restore Cart] 📝 Returning checkout ID - caller (Server Action) will save to session cookie`);
	
	console.log(`[Restore Cart] 🎉 SUCCESS: Found checkout ${checkout.id} with ${checkout.lines?.length || 0} items`);
	
	return { success: true, checkoutId: checkout.id };
}

/**
 * Restores user's cart and saves it to session cookie.
 * This is a Server Action that can be called from client components.
 */
export async function restoreAndSaveUserCart(channel: string) {
	"use server";
	
	const result = await restoreUserCart(channel);
	
	if (result.success && result.checkoutId) {
		const cookieStore = await cookies();
		cookieStore.set(`checkoutId-${channel}`, result.checkoutId, {
			path: "/",
			httpOnly: true,
			sameSite: "lax",
			secure: process.env.NODE_ENV === "production",
		});
		console.log(`[Restore And Save Cart] ✅ Saved checkout ${result.checkoutId} to session cookie`);
	}
	
	return result;
}

/**
 * Merges guest cart into user cart on SIGNUP ONLY.
 * This is the ONLY allowed case of cart merge (guest → user on signup).
 */
export async function mergeGuestCartIntoUserCart(channel: string) {
	"use server";
	
	console.log(`[Cart Merge] 🔍 Starting cart merge for channel ${channel}...`);
	
	const userId = await getUserIdFromCurrentUser();
	if (!userId) {
		console.log(`[Cart Merge] ❌ User not authenticated, skipping merge`);
		return { success: false, error: "User not authenticated" };
	}
	
	const cookieStore = await cookies();
	const guestCheckoutId = cookieStore.get(`checkoutId-${channel}`)?.value;
	
	if (!guestCheckoutId) {
		console.log(`[Cart Merge] ℹ️  No guest cart to merge`);
		return { success: true };
	}
	
	try {
		const { executeGraphQL } = await import("@/lib/graphql");
		const { CheckoutFindDocument, CheckoutLinesAddDocument } = await import("@/gql/graphql");
		
		// Get guest checkout
		const { checkout: guestCheckout } = await executeGraphQL(CheckoutFindDocument, {
			variables: { id: guestCheckoutId },
			cache: "no-cache",
		});
		
		if (!guestCheckout || guestCheckout.lines?.length === 0) {
			console.log(`[Cart Merge] ℹ️  Guest cart is empty, nothing to merge`);
			return { success: true };
		}
		
		// Get or create user checkout
		const userCheckoutId = await getUserCheckoutId(userId, channel);
		let userCheckout;
		
		if (userCheckoutId) {
			const { checkout } = await executeGraphQL(CheckoutFindDocument, {
				variables: { id: userCheckoutId },
				cache: "no-cache",
			});
			userCheckout = checkout;
		}
		
		if (!userCheckout) {
			// User has no existing cart, just attach guest checkout to user
			const { CheckoutCustomerAttachDocument } = await import("@/gql/graphql");
			await executeGraphQL(CheckoutCustomerAttachDocument, {
				variables: {
					checkoutId: guestCheckoutId,
				},
				cache: "no-cache",
			});
			
			await saveUserCheckoutId(userId, channel, guestCheckoutId);
			console.log(`[Cart Merge] ✅ Attached guest checkout to user`);
			return { success: true };
		}
		
		// Merge guest cart lines into user cart
		const linesToAdd = guestCheckout.lines?.map((line: any) => ({
			variantId: line.variant.id,
			quantity: line.quantity,
		})) || [];
		
		if (linesToAdd.length > 0) {
			await executeGraphQL(CheckoutLinesAddDocument, {
				variables: {
					checkoutId: userCheckout.id,
					lines: linesToAdd,
				},
				cache: "no-cache",
			});
			
			console.log(`[Cart Merge] ✅ Merged ${linesToAdd.length} items from guest cart to user cart`);
		}
		
		// Update session cookie to use user checkout
		cookieStore.set(`checkoutId-${channel}`, userCheckout.id, {
			path: "/",
			httpOnly: true,
			sameSite: "lax",
			secure: process.env.NODE_ENV === "production",
		});
		
		return { success: true };
	} catch (error) {
		console.error(`[Cart Merge] ❌ Error merging carts:`, error);
		return { success: false, error: String(error) };
	}
}
