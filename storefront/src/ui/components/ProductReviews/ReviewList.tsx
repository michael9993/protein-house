"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ReviewItem } from "./ReviewItem";
import { RatingStars } from "./RatingStars";
import { getProductReviews, markReviewHelpful, getCurrentUser, type ProductReview } from "@/app/actions";
import { useProductDetailText } from "@/providers/StoreConfigProvider";

interface ReviewListProps {
  productId: string;
  averageRating?: number;
  reviewCount?: number;
  onReviewSubmit?: () => void;
}

type Review = ProductReview;

export function ReviewList({
  productId,
  averageRating: initialAverageRating = 0,
  reviewCount: initialReviewCount = 0,
  onReviewSubmit,
}: ReviewListProps) {
  const router = useRouter();
  const productDetailText = useProductDetailText();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterByRating, setFilterByRating] = useState<number | null>(null);
  const [filterByVerified, setFilterByVerified] = useState<boolean | null>(null);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [endCursor, setEndCursor] = useState<string | null>(null);
  const [markingHelpful, setMarkingHelpful] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(initialReviewCount);
  const [currentRating, setCurrentRating] = useState(initialAverageRating);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  // Update rating and count when reviews are loaded
  useEffect(() => {
    if (reviews.length > 0) {
      // Calculate average from loaded reviews (only if no filter is applied)
      // Otherwise, use the product's stored rating
      if (!filterByRating && !filterByVerified) {
        const avg = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
        setCurrentRating(avg);
      }
    } else {
      // If no reviews, reset rating to 0
      setCurrentRating(0);
    }
  }, [reviews, filterByRating, filterByVerified]);
  
  // Use current rating if available, otherwise use initial (but prefer 0 if no reviews)
  const averageRating = reviews.length > 0 
    ? (currentRating > 0 ? currentRating : initialAverageRating)
    : 0;
  
  // Use totalCount from query if available, otherwise use reviews length or 0 if empty
  const reviewCount = totalCount > 0 ? totalCount : (reviews.length > 0 ? reviews.length : 0);

  const loadReviews = async (after?: string | null) => {
    try {
      setLoading(true);
      setError(null);

      const result = await getProductReviews(productId, {
        first: 20,
        after: after || undefined,
        filterByRating: filterByRating || undefined,
        filterByVerified: filterByVerified !== null ? filterByVerified : undefined,
      });

      if (result) {
        if (after) {
          setReviews((prev) => [...prev, ...result.reviews]);
        } else {
          setReviews(result.reviews);
        }
        setHasNextPage(result.pageInfo.hasNextPage || false);
        setEndCursor(result.pageInfo.endCursor || null);
        // Always update totalCount from the query result
        setTotalCount(result.totalCount || 0);
        // Reset rating if no reviews
        if (result.reviews.length === 0 && result.totalCount === 0) {
          setCurrentRating(0);
        }
      } else {
        setError(productDetailText.failedToLoadReviews);
      }
    } catch (err: any) {
      console.error("Error loading reviews:", err);
      setError(productDetailText.failedToLoadReviews);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
    // Get current user ID
    getCurrentUser().then((user) => {
      setCurrentUserId(user?.id || null);
    });
  }, [productId, filterByRating, filterByVerified]);

  // Reload reviews when a new review is submitted
  useEffect(() => {
    if (onReviewSubmit) {
      // Small delay to ensure backend has processed the review
      const timer = setTimeout(() => {
        loadReviews();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [onReviewSubmit]);

  const handleMarkHelpful = async (reviewId: string) => {
    setMarkingHelpful(reviewId);
    try {
      const result = await markReviewHelpful(reviewId);
      if (result.success && result.helpfulCount !== undefined) {
        setReviews((prev) =>
          prev.map((review) =>
            review.id === reviewId
              ? { ...review, helpfulCount: result.helpfulCount! }
              : review
          )
        );
      } else {
        console.error("Failed to mark review as helpful:", result.error);
      }
    } catch (error) {
      console.error("Error marking review as helpful:", error);
    } finally {
      setMarkingHelpful(null);
    }
  };

  const handleLoadMore = () => {
    if (hasNextPage && endCursor) {
      loadReviews(endCursor);
    }
  };

  if (loading && reviews.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm text-neutral-600">{productDetailText.loadingReviews}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm text-error-600">{error}</p>
        <button
          onClick={() => loadReviews()}
          className="mt-2 text-sm font-medium text-neutral-900 hover:underline"
        >
          {productDetailText.tryAgain}
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Summary - Always show if there are reviews or rating/count > 0, or if filters are active */}
      {(averageRating > 0 || reviewCount > 0 || reviews.length > 0 || filterByRating !== null || filterByVerified !== null) && (
        <div className="mb-6 flex items-center justify-between border-b border-neutral-200 pb-4">
          <div>
            <div className="flex items-center gap-3">
              {averageRating > 0 && (
                <RatingStars rating={averageRating} size="lg" showValue />
              )}
              {reviewCount > 0 && (
                <span className="text-sm text-neutral-600">
                  {reviewCount} {reviewCount === 1 ? productDetailText.reviewSingular : productDetailText.reviewPlural}
                </span>
              )}
            </div>
          </div>

          {/* Filters - Always visible when there are reviews or filters are active */}
          {(reviews.length > 0 || filterByRating !== null || filterByVerified !== null) && (
            <div className="flex items-center gap-2">
              <select
                value={filterByRating || ""}
                onChange={(e) => setFilterByRating(e.target.value ? Number(e.target.value) : null)}
                className="rounded border border-neutral-300 px-3 py-1 text-sm"
              >
                <option value="">{productDetailText.allRatings}</option>
                <option value="5">5 Stars</option>
                <option value="4">4 Stars</option>
                <option value="3">3 Stars</option>
                <option value="2">2 Stars</option>
                <option value="1">1 Star</option>
              </select>
              <button
                onClick={() => setFilterByVerified(filterByVerified === true ? null : true)}
                className={`rounded border border-neutral-300 px-3 py-1 text-sm ${
                  filterByVerified === true ? "bg-neutral-100" : ""
                }`}
              >
                {productDetailText.verifiedOnly}
              </button>
              {(filterByRating !== null || filterByVerified !== null) && (
                <button
                  onClick={() => {
                    setFilterByRating(null);
                    setFilterByVerified(null);
                  }}
                  className="rounded border border-neutral-300 px-3 py-1 text-sm text-neutral-600 hover:bg-neutral-50"
                >
                  {productDetailText.clearFilters}
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <div className="py-8 text-center">
          {filterByRating !== null || filterByVerified !== null ? (
            <>
              <p className="text-sm text-neutral-600">{productDetailText.noReviewsMatchFilters}</p>
              <button
                onClick={() => {
                  setFilterByRating(null);
                  setFilterByVerified(null);
                }}
                className="mt-2 text-sm font-medium text-neutral-900 hover:underline"
              >
                {productDetailText.clearFiltersLowercase}
              </button>
            </>
          ) : (
            <p className="text-sm text-neutral-600">{productDetailText.noReviewsYet}</p>
          )}
        </div>
      ) : (
        <>
            <div>
              {reviews.map((review) => (
                <ReviewItem
                  key={review.id}
                  {...review}
                  currentUserId={currentUserId}
                  onMarkHelpful={handleMarkHelpful}
                  isMarkingHelpful={markingHelpful === review.id}
                  onUpdate={() => {
                    loadReviews();
                    // Refresh page to update product rating
                    router.refresh();
                  }}
                  onDelete={() => {
                    loadReviews();
                    // Refresh page to update product rating and review count
                    router.refresh();
                  }}
                />
              ))}
            </div>

          {hasNextPage && (
            <div className="mt-6 text-center">
              <button
                onClick={handleLoadMore}
                className="rounded bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
              >
                {productDetailText.loadMoreReviews}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

