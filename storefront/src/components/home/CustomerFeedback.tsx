"use client";

import { useState, useEffect } from "react";
import { Star, Quote, BadgeCheck, ShoppingBag } from "lucide-react";
import { useParams } from "next/navigation";
import { getAllProductReviews, type ReviewWithProduct } from "@/app/actions";
import { useBranding, useCustomerFeedbackConfig, useContentConfig, useComponentStyle, useComponentClasses } from "@/providers/StoreConfigProvider";
import { buildComponentStyle } from "@/config";
import type { Testimonial } from "@/lib/cms";

interface CustomerFeedbackProps {
  channel?: string;
  /** CMS testimonials from "testimonials" collection metadata */
  cmsTestimonials?: Testimonial[];
}

/**
 * CustomerFeedback - Customer reviews/testimonials section
 * Displays real product reviews with fallback to CMS testimonials.
 * Configurable via Storefront Control.
 */
export function CustomerFeedback({ channel, cmsTestimonials = [] }: CustomerFeedbackProps) {
  const params = useParams();
  const currentChannel = channel || (params?.channel as string) || "usd";
  const { colors } = useBranding();
  const config = useCustomerFeedbackConfig();
  const contentConfig = useContentConfig();
  const cdStyle = useComponentStyle("homepage.customerFeedback");
  const cdClasses = useComponentClasses("homepage.customerFeedback");

  // Get translated content from config
  const homepageContent = contentConfig.homepage;
  const curatedLabel = homepageContent.curatedLabel || "Curated";
  const reviewedProductLabel = homepageContent.reviewedProductLabel || "Reviewed Product";
  const verifiedBuyerLabel = homepageContent.verifiedBuyerLabel || "Verified Buyer";
  const anonymousLabel = homepageContent.anonymousLabel || "Anonymous";

  // State for real product reviews
  const [reviews, setReviews] = useState<ReviewWithProduct[]>([]);
  const [loading, setLoading] = useState(true);

  // Config values with fallback chain
  const enabled = config?.enabled ?? true;
  const title = config?.title ?? contentConfig.homepage.testimonialsTitle ?? "";
  const subtitle = config?.subtitle ?? contentConfig.homepage.testimonialsSubtitle ?? "";
  const maxReviews = config?.maxReviews ?? 3;
  const minRating = config?.minRating ?? 4;
  const showProductName = config?.showProductName ?? true;

  // Fetch real product reviews
  useEffect(() => {
    async function fetchReviews() {
      try {
        const data = await getAllProductReviews(currentChannel, { limit: maxReviews, minRating });
        setReviews(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Failed to fetch reviews:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchReviews();
  }, [currentChannel, maxReviews, minRating]);

  // Hide if disabled
  if (!enabled) return null;

  // Helper to get user display name
  const getUserName = (review: ReviewWithProduct): string => {
    if (review.user?.firstName && review.user?.lastName) {
      return `${review.user.firstName} ${review.user.lastName.charAt(0)}.`;
    }
    if (review.user?.firstName) {
      return review.user.firstName;
    }
    if (review.user?.email) {
      return review.user.email.split("@")[0];
    }
    return anonymousLabel;
  };

  // Determine which testimonials to show (priority: real reviews > CMS > hide)
  const safeReviews = reviews ?? [];
  const safeTestimonials = cmsTestimonials ?? [];
  const displayItems = safeReviews.length > 0
    ? safeReviews.map((review) => ({
        id: review.id,
        name: getUserName(review),
        role: review.product?.name || "",
        quote: review.body || review.title,
        rating: review.rating,
      }))
    : safeTestimonials.length > 0
    ? safeTestimonials.slice(0, maxReviews).map((t) => ({
        id: t.id,
        name: t.name,
        role: t.role || "",
        quote: t.quote,
        rating: t.rating ?? 5,
      }))
    : [];

  // Hide section when no real reviews and no CMS testimonials
  if (!loading && displayItems.length === 0) return null;

  return (
    <section
      data-cd="homepage-customerFeedback"
      className={`py-24 ${cdClasses}`}
      aria-label="Customer testimonials"
      style={{
        ...buildComponentStyle("homepage.customerFeedback", cdStyle),
      }}
    >
      <div className="mx-auto max-w-[var(--design-container-max)] px-6 lg:px-12">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-neutral-500">{curatedLabel}</p>
            <h2 className="mt-3 text-4xl font-black uppercase italic tracking-tighter text-neutral-900 md:text-5xl">
              {title}
            </h2>
            {subtitle && (
              <p className="mt-3 max-w-2xl text-sm font-medium text-neutral-500 md:text-base">{subtitle}</p>
            )}
          </div>
        </div>

        {/* Reviews Grid */}
        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {loading ? (
            // Loading skeleton
            [...Array(maxReviews)].map((_, i) => (
              <div
                key={`skeleton-${i}`}
                className="animate-pulse rounded-3xl border border-neutral-200 bg-white"
              >
                {/* Product badge skeleton */}
                <div className="border-b border-neutral-100 px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-neutral-200" />
                    <div className="flex-1 space-y-1">
                      <div className="h-2 w-20 rounded bg-neutral-200" />
                      <div className="h-3 w-32 rounded bg-neutral-200" />
                    </div>
                  </div>
                </div>
                {/* Content skeleton */}
                <div className="p-6">
                  <div className="mb-4 flex items-start justify-between">
                    <div className="h-10 w-10 rounded-full bg-neutral-200" />
                    <div className="flex gap-1">
                      {[...Array(5)].map((_, j) => (
                        <div key={j} className="h-3 w-3 rounded bg-neutral-200" />
                      ))}
                    </div>
                  </div>
                  <div className="mb-6 space-y-2">
                    <div className="h-4 w-full rounded bg-neutral-200" />
                    <div className="h-4 w-full rounded bg-neutral-200" />
                    <div className="h-4 w-2/3 rounded bg-neutral-200" />
                  </div>
                  <div className="flex items-center gap-3 border-t border-neutral-100 pt-5">
                    <div className="h-11 w-11 rounded-full bg-neutral-200" />
                    <div className="space-y-1">
                      <div className="h-4 w-24 rounded bg-neutral-200" />
                      <div className="h-3 w-16 rounded bg-neutral-200" />
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            displayItems.map((item) => (
              <article
                key={item.id}
                className="group relative flex flex-col rounded-3xl border border-neutral-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
                {/* Product Badge - Top */}
                {showProductName && item.role && (
                  <div className="border-b border-neutral-100 px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div
                        className="flex h-8 w-8 items-center justify-center rounded-lg"
                        style={{ backgroundColor: colors.primary + "12" }}
                      >
                        <ShoppingBag size={14} style={{ color: colors.primary }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-neutral-400">
                          {reviewedProductLabel}
                        </p>
                        <p className="truncate text-sm font-bold text-neutral-900">
                          {item.role}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Main Content */}
                <div className="flex flex-1 flex-col p-6">
                  {/* Quote Icon & Rating Row */}
                  <div className="mb-4 flex items-start justify-between">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-full"
                      style={{ backgroundColor: colors.primary + "10" }}
                    >
                      <Quote size={18} style={{ color: colors.primary }} />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="flex" aria-label={`Rating: ${item.rating} out of 5 stars`}>
                        {[...Array(5)].map((_, starIndex) => (
                          <Star
                            key={`${item.id}-star-${starIndex}`}
                            size={12}
                            fill="currentColor"
                            className={
                              starIndex < item.rating
                                ? "text-warning-400 fill-warning-400"
                                : "text-neutral-200 fill-neutral-200"
                            }
                            aria-hidden="true"
                          />
                        ))}
                      </div>
                      <span className="text-xs font-bold text-neutral-600">{item.rating}.0</span>
                    </div>
                  </div>

                  {/* Quote */}
                  <blockquote className="mb-6 flex-1 text-[15px] font-medium leading-relaxed text-neutral-700">
                    &ldquo;{item.quote}&rdquo;
                  </blockquote>

                  {/* Author Section */}
                  <footer className="flex items-center gap-3 border-t border-neutral-100 pt-5">
                    <div
                      className="flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold"
                      style={{
                        background: `linear-gradient(135deg, ${colors.primary}20, ${colors.accent || colors.primary}30)`,
                        color: colors.primary,
                      }}
                    >
                      {item.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5">
                        <cite className="text-sm font-bold text-neutral-900 not-italic">
                          {item.name}
                        </cite>
                        <BadgeCheck
                          size={14}
                          className="text-info-500 fill-info-500"
                          aria-label="Verified purchase"
                        />
                      </div>
                      <p className="text-xs text-neutral-500">{verifiedBuyerLabel}</p>
                    </div>
                  </footer>
                </div>
              </article>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
