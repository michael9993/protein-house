"use server";

import { cookies } from "next/headers";
import { getServerAuthClient } from "@/app/config";
import { executeGraphQL } from "@/lib/graphql";
import { CurrentUserDocument } from "@/gql/graphql";

// Removed unused function _getCurrentUserId

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

import { TypedDocumentString } from "@/gql/graphql";

// ProductReviews query document
const ProductReviewsDocument = new TypedDocumentString(`
  query ProductReviews(
    $productId: ID!
    $first: Int = 20
    $after: String
    $filterByRating: Int
    $filterByVerified: Boolean
  ) {
    productReviews(
      productId: $productId
      first: $first
      after: $after
      filterByRating: $filterByRating
      filterByVerified: $filterByVerified
    ) {
      edges {
        node {
          id
          rating
          title
          body
          images
          helpfulCount
          status
          isVerifiedPurchase
          createdAt
          updatedAt
          user {
            id
            email
            firstName
            lastName
          }
        }
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
      totalCount
    }
  }
`) as any;

export interface ProductReview {
  id: string;
  rating: number;
  title: string;
  body: string;
  images: string[];
  helpfulCount: number;
  status: string;
  isVerifiedPurchase: boolean;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    email: string;
    firstName?: string | null;
    lastName?: string | null;
  } | null;
}

export interface ProductReviewsResult {
  reviews: ProductReview[];
  pageInfo: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCursor: string | null;
    endCursor: string | null;
  };
  totalCount: number;
}

/**
 * Fetch product reviews from the server
 */
export async function getProductReviews(
  productId: string,
  options?: {
    first?: number;
    after?: string | null;
    filterByRating?: number | null;
    filterByVerified?: boolean | null;
  }
): Promise<ProductReviewsResult | null> {
  "use server";
  
  try {
    const result = await executeGraphQL(ProductReviewsDocument, {
      variables: {
        productId,
        first: options?.first ?? 20,
        after: options?.after ?? undefined,
        filterByRating: options?.filterByRating ?? undefined,
        filterByVerified: options?.filterByVerified !== null && options?.filterByVerified !== undefined ? options.filterByVerified : undefined,
      },
      cache: "no-store",
      withAuth: false, // Reviews are public, no auth needed
    }) as any;

    if (result?.productReviews) {
      return {
        reviews: result.productReviews.edges?.map((edge: any) => edge.node) || [],
        pageInfo: result.productReviews.pageInfo || {
          hasNextPage: false,
          hasPreviousPage: false,
          startCursor: null,
          endCursor: null,
        },
        totalCount: result.productReviews.totalCount || 0,
      };
    }

    return null;
  } catch (error) {
    console.error("[Product Reviews] Error fetching reviews:", error);
    return null;
  }
}

// CreateProductReview mutation document
const CreateProductReviewDocument = new TypedDocumentString(`
  mutation CreateProductReview($input: ProductReviewInput!) {
    productReviewCreate(input: $input) {
      review {
        id
        rating
        title
        body
        images
        helpfulCount
        status
        isVerifiedPurchase
        createdAt
        user {
          id
          email
          firstName
          lastName
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

export interface CreateReviewInput {
  productId: string;
  rating: number;
  title: string;
  body: string;
  images?: string[];
}

export interface CreateReviewResult {
  success: boolean;
  review?: ProductReview;
  error?: string;
}

/**
 * Create a product review (server action)
 */
export async function createProductReview(input: CreateReviewInput): Promise<CreateReviewResult> {
  "use server";
  
  try {
    // Validate input
    if (!input.rating || input.rating < 1 || input.rating > 5) {
      return { success: false, error: "Rating must be between 1 and 5" };
    }
    
    if (!input.title?.trim()) {
      return { success: false, error: "Review title is required" };
    }
    
    if (!input.body?.trim()) {
      return { success: false, error: "Review body is required" };
    }
    
    const result = await executeGraphQL(CreateProductReviewDocument, {
      variables: {
        input: {
          productId: input.productId,
          rating: input.rating,
          title: input.title.trim(),
          body: input.body.trim(),
          images: input.images?.filter(Boolean) || [],
        },
      },
      cache: "no-store",
      withAuth: true, // Reviews may require authentication (optional, but good for verified purchases)
    }) as any;

    if (result?.productReviewCreate?.errors && result.productReviewCreate.errors.length > 0) {
      return {
        success: false,
        error: result.productReviewCreate.errors[0].message || "Failed to submit review",
      };
    }

    if (result?.productReviewCreate?.review) {
      // Revalidate the product page to refresh rating and review count
      const { revalidatePath } = await import("next/cache");
      revalidatePath("/products", "layout");
      
      return {
        success: true,
        review: result.productReviewCreate.review,
      };
    }

    return { success: false, error: "Unexpected response from server" };
  } catch (error: any) {
    console.error("[Product Reviews] Error creating review:", error);
    return {
      success: false,
      error: error?.message || "Failed to submit review. Please try again.",
    };
  }
}

// MarkReviewHelpful mutation document
const MarkReviewHelpfulDocument = new TypedDocumentString(`
  mutation MarkReviewHelpful($reviewId: ID!) {
    productReviewMarkHelpful(reviewId: $reviewId) {
      review {
        id
        helpfulCount
      }
      marked
      errors {
        field
        message
        code
      }
    }
  }
`) as any;

/**
 * Mark a review as helpful (server action)
 */
export async function markReviewHelpful(reviewId: string): Promise<{ success: boolean; helpfulCount?: number; error?: string }> {
  "use server";
  
  try {
    const result = await executeGraphQL(MarkReviewHelpfulDocument, {
      variables: {
        reviewId,
      },
      cache: "no-store",
      withAuth: false, // Marking helpful doesn't require auth
    }) as any;

    if (result?.productReviewMarkHelpful?.errors && result.productReviewMarkHelpful.errors.length > 0) {
      return {
        success: false,
        error: result.productReviewMarkHelpful.errors[0].message || "Failed to mark review as helpful",
      };
    }

    if (result?.productReviewMarkHelpful?.review) {
      return {
        success: true,
        helpfulCount: result.productReviewMarkHelpful.review.helpfulCount,
      };
    }

    return { success: false, error: "Unexpected response from server" };
  } catch (error: any) {
    console.error("[Product Reviews] Error marking review as helpful:", error);
    return {
      success: false,
      error: error?.message || "Failed to mark review as helpful. Please try again.",
    };
  }
}

// UpdateProductReview mutation document
const UpdateProductReviewDocument = new TypedDocumentString(`
  mutation UpdateProductReview($input: ProductReviewUpdateInput!) {
    productReviewUpdate(input: $input) {
      review {
        id
        rating
        title
        body
        images
        helpfulCount
        status
        isVerifiedPurchase
        createdAt
        updatedAt
        user {
          id
          email
          firstName
          lastName
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

// DeleteProductReview mutation document
const DeleteProductReviewDocument = new TypedDocumentString(`
  mutation DeleteProductReview($reviewId: ID!) {
    productReviewDelete(reviewId: $reviewId) {
      review {
        id
      }
      errors {
        field
        message
        code
      }
    }
  }
`) as any;

export interface UpdateReviewInput {
  reviewId: string;
  rating?: number;
  title?: string;
  body?: string;
  images?: string[];
}

export interface UpdateReviewResult {
  success: boolean;
  review?: ProductReview;
  error?: string;
}

/**
 * Update a product review (server action)
 */
export async function updateProductReview(input: UpdateReviewInput): Promise<UpdateReviewResult> {
  "use server";
  
  try {
    const result = await executeGraphQL(UpdateProductReviewDocument, {
      variables: {
        input: {
          reviewId: input.reviewId,
          rating: input.rating,
          title: input.title?.trim(),
          body: input.body?.trim(),
          images: input.images?.filter(Boolean) || [],
        },
      },
      cache: "no-store",
      withAuth: true, // Requires authentication
    }) as any;

    if (result?.productReviewUpdate?.errors && result.productReviewUpdate.errors.length > 0) {
      return {
        success: false,
        error: result.productReviewUpdate.errors[0].message || "Failed to update review",
      };
    }

    if (result?.productReviewUpdate?.review) {
      // Revalidate the product page to refresh rating
      const { revalidatePath } = await import("next/cache");
      revalidatePath("/products", "layout");
      
      return {
        success: true,
        review: result.productReviewUpdate.review,
      };
    }

    return { success: false, error: "Unexpected response from server" };
  } catch (error: any) {
    console.error("[Product Reviews] Error updating review:", error);
    return {
      success: false,
      error: error?.message || "Failed to update review. Please try again.",
    };
  }
}

/**
 * Delete a product review (server action)
 */
export async function deleteProductReview(reviewId: string): Promise<{ success: boolean; error?: string }> {
  "use server";
  
  try {
    const result = await executeGraphQL(DeleteProductReviewDocument, {
      variables: {
        reviewId,
      },
      cache: "no-store",
      withAuth: true, // Requires authentication
    }) as any;

    if (result?.productReviewDelete?.errors && result.productReviewDelete.errors.length > 0) {
      return {
        success: false,
        error: result.productReviewDelete.errors[0].message || "Failed to delete review",
      };
    }

    // Revalidate the product page to refresh rating and review count
    const { revalidatePath } = await import("next/cache");
    // Revalidate all product pages to ensure rating updates
    revalidatePath("/products", "layout");
    revalidatePath("/[channel]/products", "page");
    
    return { success: true };
  } catch (error: any) {
    console.error("[Product Reviews] Error deleting review:", error);
    return {
      success: false,
      error: error?.message || "Failed to delete review. Please try again.",
    };
  }
}

/**
 * Gets the access token from cookies (server-side only).
 * This is used by the checkout to authenticate GraphQL requests when
 * the cookie isn't accessible via document.cookie (e.g., httpOnly cookies).
 */
export async function getAccessToken(): Promise<string | null> {
	"use server";
	
	try {
		const cookieStore = await cookies();
		const saleorApiUrl = process.env.SALEOR_API_URL || process.env.NEXT_PUBLIC_SALEOR_API_URL || "";
		
		// The cookie name format is: {apiUrl}/+saleor_auth_access_token
		// Where apiUrl might include /graphql or not
		// IMPORTANT: Do NOT remove /graphql - the cookie name includes it!
		// Just remove trailing slashes
		const cookiePrefix = saleorApiUrl.replace(/\/+$/, "");
		
		// Try multiple cookie name formats based on how the URL might be structured
		const possibleCookieNames = [
			`${cookiePrefix}/+saleor_auth_access_token`, // Standard format (includes /graphql if URL has it)
			`${cookiePrefix.replace(/\/graphql$/, "")}/+saleor_auth_access_token`, // Without /graphql
			`${cookiePrefix}/graphql/+saleor_auth_access_token`, // With /graphql added
		];
		
		// Also get all cookies to search through them
		const allCookies = cookieStore.getAll();
		console.log("[Get Access Token] 🔍 All cookie names:", allCookies.map(c => c.name).join(", "));
		console.log("[Get Access Token] 🔍 Searching for:", possibleCookieNames);
		console.log("[Get Access Token] 🔍 Saleor API URL:", saleorApiUrl);
		
		// Try exact matches first
		for (const cookieName of possibleCookieNames) {
			const token = cookieStore.get(cookieName)?.value;
			if (token) {
				console.log("[Get Access Token] ✅ Found access token with name:", cookieName);
				return token;
			}
		}
		
		// Fallback: search for any cookie containing "saleor_auth_access_token"
		// This handles cases where the cookie name might be URL-encoded or formatted differently
		for (const cookie of allCookies) {
			if (cookie.name.includes("saleor_auth_access_token") || cookie.name.includes("saleor_auth_access_token".replace(/_/g, "%5F"))) {
				console.log("[Get Access Token] ✅ Found access token with partial match:", cookie.name);
				return cookie.value;
			}
		}
		
		console.log("[Get Access Token] ⚠️ No access token found in cookies");
		console.log("[Get Access Token] 🔍 Available cookie names for debugging:", allCookies.map(c => c.name));
		return null;
	} catch (error) {
		console.error("[Get Access Token] ❌ Error:", error);
		return null;
	}
}

/**
 * Saves the user's checkout ID to metadata.
 * User carts are stored in metadata (server-side, syncs across devices).
 * Cookies are ONLY used for guest carts.
 */
export async function saveUserCheckoutId(_userId: string, channel: string, checkoutId: string) {
	"use server";
	
	const metadataKey = `checkoutId-${channel}`;
	
	try {
		const { AccountUpdateDocument } = await import("@/gql/graphql");
		
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
export async function getUserCheckoutId(_userId: string, channel: string): Promise<string | null> {
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
			// Dynamically find all channels from checkout cookies
			const allCookies = cookieStore.getAll();
			const channels = new Set<string>();
			
			// Extract channels from checkout cookie names (format: checkoutId-{channel})
			allCookies.forEach(cookie => {
				if (cookie.name.startsWith("checkoutId-")) {
					const channel = cookie.name.replace("checkoutId-", "");
					if (channel) {
						channels.add(channel);
					}
				}
			});
			
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
		// Dynamically find all channels from checkout cookies
		const allCookies = cookieStore.getAll();
		const channels = new Set<string>();
		
		// Extract channels from checkout cookie names (format: checkoutId-{channel})
		allCookies.forEach(cookie => {
			if (cookie.name.startsWith("checkoutId-")) {
				const channel = cookie.name.replace("checkoutId-", "");
				if (channel) {
					channels.add(channel);
				}
			}
		});
		
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
		const { CheckoutFindDocument, CheckoutAddLinesDocument } = await import("@/gql/graphql");
		
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
			await executeGraphQL(CheckoutAddLinesDocument, {
				variables: {
					id: userCheckout.id,
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
