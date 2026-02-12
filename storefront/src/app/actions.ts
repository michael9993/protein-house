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

// Review with product info for testimonials
export interface ReviewWithProduct extends ProductReview {
  product?: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

/**
 * Debug helper: Fetch a specific review by ID to check its properties
 */
export async function getReviewById(reviewId: string): Promise<ProductReview | null> {
  "use server";
  
  try {
    const { getServerAuthClient } = await import("@/app/config");
    const saleorApiUrl = process.env.SALEOR_API_URL || process.env.NEXT_PUBLIC_SALEOR_API_URL;
    
    if (!saleorApiUrl) {
      console.error("[Get Review By ID] No API URL configured");
      return null;
    }

    const authClient = await getServerAuthClient();
    
    // Try the review query (requires MANAGE_PRODUCTS permission)
    const reviewQuery = `
      query GetReview($id: ID!) {
        review(id: $id) {
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
          product {
            id
            name
            slug
          }
          user {
            id
            email
            firstName
            lastName
          }
        }
      }
    `;

    const response = await authClient.fetchWithAuth(saleorApiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: reviewQuery,
        variables: { id: reviewId },
      }),
      next: { revalidate: 0 },
    });

    if (response.ok) {
      const result = (await response.json()) as {
        data?: { review?: ProductReview & { product?: { id: string; name: string; slug: string } } };
        errors?: any[];
      };
      
      if (result.data?.review) {
        console.log(`[Get Review By ID] ✅ Found review:`, {
          id: result.data.review.id,
          rating: result.data.review.rating,
          status: result.data.review.status,
          product: result.data.review.product?.name,
        });
        return result.data.review;
      }
    }
    
    return null;
  } catch (error) {
    console.error("[Get Review By ID] Error:", error);
    return null;
  }
}

/**
 * Fetch reviews from multiple products (for testimonials section)
 * Only returns reviews with rating >= 4
 */
export async function getAllProductReviews(
  channel: string,
  options?: {
    limit?: number; // Max number of reviews to return
    minRating?: number; // Minimum rating (default: 4)
  }
): Promise<ReviewWithProduct[]> {
  "use server";
  
  try {
    const { executeGraphQL } = await import("@/lib/graphql");
    const { ProductListDocument } = await import("@/gql/graphql");
    const { getLanguageCodeForChannel } = await import("@/lib/language");
    const minRating = options?.minRating ?? 4;
    const limit = options?.limit ?? 50;
    const languageCode = getLanguageCodeForChannel(channel);

    console.log(`[All Product Reviews] 🔍 Starting fetch for channel "${channel}", minRating: ${minRating}, limit: ${limit}`);

    // Use public queries (like getProductReviews does) - no auth needed for reviews
    // Fetch products first, then reviews for each product
    console.log(`[All Product Reviews] 🔄 Fetching products and reviews using public queries...`);

    // First, fetch products using public query (like getProductReviews does)
    const productsResult = await executeGraphQL(ProductListDocument, {
      variables: {
        channel,
        first: 50, // Fetch up to 50 products
        languageCode,
      },
      revalidate: 60,
      withAuth: false, // Products are public
    }) as any;

    const products = productsResult.products?.edges?.map(({ node }: any) => ({
      id: node.id,
      name: node.name,
      slug: node.slug,
    })) || [];
    
    console.log(`[All Product Reviews] 📦 Found ${products.length} products`);
    
    if (products.length === 0) {
      console.warn("[All Product Reviews] ⚠️ No products found in channel");
      return [];
    }

    // Now fetch reviews for each product
    const allReviews: ReviewWithProduct[] = [];
    
    // Fetch reviews for products in batches (to avoid too many requests)
    const batchSize = 10;
    for (let i = 0; i < products.length; i += batchSize) {
      const batch = products.slice(i, i + batchSize);
      
      // Fetch reviews for each product in the batch using public query (like getProductReviews does)
      const reviewPromises = batch.map(async (product: { id: string; name: string; slug?: string }) => {
        try {
          // Use the same approach as getProductReviews - public query with executeGraphQL
          const reviewResult = await getProductReviews(product.id, {
            first: 50, // Get more reviews to filter in JS (productReviews only returns approved)
            filterByRating: undefined, // Don't filter by rating here - we'll filter >= minRating in JS
            filterByVerified: undefined,
          });

          if (!reviewResult) {
            return [];
          }

          const allProductReviews = reviewResult.reviews || [];
          
          if (allProductReviews.length > 0) {
            const statusCounts = allProductReviews.reduce((acc, r) => {
              acc[r.status] = (acc[r.status] || 0) + 1;
              return acc;
            }, {} as Record<string, number>);
            const ratingCounts = allProductReviews.reduce((acc, r) => {
              acc[r.rating] = (acc[r.rating] || 0) + 1;
              return acc;
            }, {} as Record<number, number>);
            console.log(`[All Product Reviews] 📊 Product "${product.name}": ${allProductReviews.length} approved reviews`);
            console.log(`[All Product Reviews] 📊 Status breakdown:`, statusCounts);
            console.log(`[All Product Reviews] 📊 Rating breakdown:`, ratingCounts);
          } else {
            console.log(`[All Product Reviews] ⚠️ Product "${product.name}": No approved reviews found`);
          }

          // NOTE: productReviews query only returns APPROVED reviews, so we don't need to filter by status
          // We only filter by rating >= minRating
          const reviews = allProductReviews
            .filter((review) => {
              const hasMinRating = review.rating >= minRating;
              
              if (!hasMinRating && allProductReviews.length > 0) {
                console.log(`[All Product Reviews] ⚠️ Review ${review.id} excluded: rating ${review.rating} < ${minRating} (minRating: ${minRating})`);
              }
              
              return hasMinRating;
            })
            .map((review) => ({
              ...review,
              product: {
                id: product.id,
                name: product.name,
                slug: product.slug ?? "",
              },
            } as ReviewWithProduct));

          if (reviews.length > 0) {
            console.log(`[All Product Reviews] ✅ Product "${product.name}": ${reviews.length} reviews match criteria (rating >= ${minRating}, approved)`);
          } else if (allProductReviews.length > 0) {
            console.log(`[All Product Reviews] ⚠️ Product "${product.name}": ${allProductReviews.length} approved reviews found, but none have rating >= ${minRating}`);
            console.log(`[All Product Reviews] 💡 Tip: Reviews need to be approved AND have rating >= ${minRating} to appear in testimonials`);
          }

          return reviews;
        } catch (error) {
          console.error(`[All Product Reviews] ❌ Error fetching reviews for product ${product.id} (${product.name}):`, error);
          return [];
        }
      });

      const batchResults = await Promise.all(reviewPromises);
      const batchReviews = batchResults.flat();
      allReviews.push(...batchReviews);
      
      console.log(`[All Product Reviews] Batch ${Math.floor(i / batchSize) + 1}: Found ${batchReviews.length} reviews (total so far: ${allReviews.length})`);

      // If we have enough reviews, stop fetching
      if (allReviews.length >= limit) {
        break;
      }
    }

    console.log(`[All Product Reviews] 📊 Total reviews collected: ${allReviews.length}`);

    if (allReviews.length === 0) {
      console.warn(`[All Product Reviews] ⚠️ No reviews found matching criteria (rating >= ${minRating}, approved status)`);
      console.warn(`[All Product Reviews] 💡 Tip: Reviews must be:`);
      console.warn(`[All Product Reviews]    1. APPROVED (pending reviews won't show up)`);
      console.warn(`[All Product Reviews]    2. Have rating >= ${minRating} stars`);
      console.warn(`[All Product Reviews]    3. Belong to a product in the channel "${channel}"`);
      return [];
    }

    // Shuffle and limit
    const shuffled = allReviews.sort(() => Math.random() - 0.5);
    const result = shuffled.slice(0, limit);
    
    const statusBreakdown = result.reduce((acc, r) => {
      acc[r.status] = (acc[r.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    console.log(`[All Product Reviews] ✅ Returning ${result.length} reviews (from ${allReviews.length} total, minRating: ${minRating})`);
    console.log(`[All Product Reviews] 📊 Status breakdown:`, statusBreakdown);
    
    return result;
  } catch (error) {
    console.error("[All Product Reviews] ❌ Fatal error:", error);
    if (error instanceof Error) {
      console.error("[All Product Reviews] Error message:", error.message);
      console.error("[All Product Reviews] Error stack:", error.stack);
    }
    return [];
  }
}

/**
 * Get store statistics (average rating, customer count, orders delivered, satisfaction rate)
 * Calculated from actual data
 */
export async function getStoreStatistics(channel: string): Promise<{
  averageRating: number;
  customerCount: number;
  ordersDelivered: number;
  satisfactionRate: number; // Percentage of 4+ star reviews
}> {
  "use server";
  
  try {
    const { getServerAuthClient } = await import("@/app/config");
    const saleorApiUrl = process.env.SALEOR_API_URL || process.env.NEXT_PUBLIC_SALEOR_API_URL;
    
    if (!saleorApiUrl) {
      console.error("[Store Statistics] No API URL configured");
      return { averageRating: 0, customerCount: 0, ordersDelivered: 0, satisfactionRate: 0 };
    }

    const authClient = await getServerAuthClient();
    
    console.log(`[Store Statistics] 🔍 Calculating statistics for channel "${channel}"...`);

    // Fetch all reviews to calculate average rating and satisfaction rate
    const allReviews = await getAllProductReviews(channel, {
      limit: 1000, // Get as many as possible for accurate stats
      minRating: 1, // Get all ratings, not just 4+
    });

    console.log(`[Store Statistics] 📊 Total reviews fetched: ${allReviews.length}`);

    // Filter to only approved reviews for statistics
    const approvedReviews = allReviews.filter(r => 
      r.status === "approved" || r.status === "APPROVED"
    );

    console.log(`[Store Statistics] ✅ Approved reviews: ${approvedReviews.length}`);

    // Calculate average rating from approved reviews only
    const averageRating = approvedReviews.length > 0
      ? approvedReviews.reduce((sum, review) => sum + review.rating, 0) / approvedReviews.length
      : 0;

    // Calculate satisfaction rate (percentage of 4+ star reviews)
    const fourPlusStarReviews = approvedReviews.filter(r => r.rating >= 4).length;
    const satisfactionRate = approvedReviews.length > 0
      ? Math.round((fourPlusStarReviews / approvedReviews.length) * 100)
      : 0;

    console.log(`[Store Statistics] ⭐ Average rating: ${averageRating.toFixed(2)} (from ${approvedReviews.length} approved reviews)`);
    console.log(`[Store Statistics] 🏆 Satisfaction rate: ${satisfactionRate}% (${fourPlusStarReviews}/${approvedReviews.length} are 4+ stars)`);

    // For customer count and orders, we need to query the API
    // Note: These queries might require permissions, so we'll try to get them
    // If they fail, we'll use fallback values
    let customerCount = 0;
    let ordersDelivered = 0;

    try {
      // Try to get customer count (this might require permissions)
      const customersQuery = `
        query CustomerCount($channel: String!) {
          customers(first: 1, filter: { dateJoined: { gte: "1970-01-01" } }) {
            totalCount
          }
        }
      `;

      const customersResponse = await authClient.fetchWithAuth(saleorApiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: customersQuery,
          variables: { channel },
        }),
        next: { revalidate: 300 }, // Cache for 5 minutes
      });

      if (customersResponse.ok) {
        const customersResult = (await customersResponse.json()) as {
          data?: { customers?: { totalCount?: number } };
          errors?: any[];
        };
        
        if (!customersResult.errors && customersResult.data?.customers?.totalCount !== undefined) {
          customerCount = customersResult.data.customers.totalCount;
        }
      }
    } catch (error) {
      console.warn("[Store Statistics] Could not fetch customer count (requires MANAGE_USERS permission):", error);
      // Use unique user count from reviews as fallback
      const uniqueUsers = new Set(approvedReviews.map(r => r.user?.id).filter(Boolean));
      customerCount = uniqueUsers.size > 0 ? uniqueUsers.size : (approvedReviews.length > 0 ? approvedReviews.length : 0);
      console.log(`[Store Statistics] Using fallback customer count from reviews: ${customerCount} (${uniqueUsers.size} unique users, ${approvedReviews.length} total reviews)`);
    }
    
    // If customer count is still 0 but we have reviews, use review count as estimate
    if (customerCount === 0 && approvedReviews.length > 0) {
      customerCount = approvedReviews.length;
      console.log(`[Store Statistics] Using review count as customer count estimate: ${customerCount}`);
    }

    try {
      // Try to get orders count (this requires MANAGE_ORDERS permission, might fail)
      const ordersQuery = `
        query OrdersCount($channel: String!) {
          orders(first: 1, channel: $channel, filter: { status: [FULFILLED, PARTIALLY_FULFILLED] }) {
            totalCount
          }
        }
      `;

      const ordersResponse = await authClient.fetchWithAuth(saleorApiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: ordersQuery,
          variables: { channel },
        }),
        next: { revalidate: 300 }, // Cache for 5 minutes
      });

      if (ordersResponse.ok) {
        const ordersResult = (await ordersResponse.json()) as {
          data?: { orders?: { totalCount?: number } };
          errors?: any[];
        };
        
        if (!ordersResult.errors && ordersResult.data?.orders?.totalCount !== undefined) {
          ordersDelivered = ordersResult.data.orders.totalCount;
        }
      }
    } catch (error) {
      console.warn("[Store Statistics] Could not fetch orders count (requires MANAGE_ORDERS permission):", error);
      // Use verified purchase count as fallback estimate
      const verifiedPurchases = approvedReviews.filter(r => r.isVerifiedPurchase).length;
      ordersDelivered = verifiedPurchases > 0 ? verifiedPurchases : (approvedReviews.length > 0 ? approvedReviews.length : 0);
      console.log(`[Store Statistics] Using fallback orders count: ${ordersDelivered} (${verifiedPurchases} verified purchases, ${approvedReviews.length} total reviews)`);
    }
    
    // If orders delivered is still 0 but we have reviews, use review count as estimate
    if (ordersDelivered === 0 && approvedReviews.length > 0) {
      ordersDelivered = approvedReviews.length;
      console.log(`[Store Statistics] Using review count as orders delivered estimate: ${ordersDelivered}`);
    }

    const finalStats = {
      averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
      customerCount,
      ordersDelivered,
      satisfactionRate,
    };

    console.log(`[Store Statistics] ✅ Final stats:`, {
      ...finalStats,
      totalApprovedReviews: approvedReviews.length,
      totalReviews: allReviews.length,
    });

    return finalStats;
  } catch (error) {
    console.error("[Store Statistics] ❌ Error:", error);
    if (error instanceof Error) {
      console.error("[Store Statistics] Error message:", error.message);
      console.error("[Store Statistics] Error stack:", error.stack);
    }
    return { averageRating: 0, customerCount: 0, ordersDelivered: 0, satisfactionRate: 0 };
  }
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
		variables: { id: savedCheckoutId, languageCode: (await import("@/lib/language")).getLanguageCodeForChannel(channel) },
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
			variables: { id: guestCheckoutId, languageCode: (await import("@/lib/language")).getLanguageCodeForChannel(channel) },
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
				variables: { id: userCheckoutId, languageCode: (await import("@/lib/language")).getLanguageCodeForChannel(channel) },
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
					languageCode: (await import("@/lib/language")).getLanguageCodeForChannel(channel),
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
