"use client";

import React from "react";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { useStoreConfig, useContentConfig } from "@/providers/StoreConfigProvider";

import { SectionHeader } from "./SectionHeader";
import { generateSectionBackground, generatePatternOverlay, type SectionBackgroundConfig } from "@/lib/section-backgrounds";
import { getAllProductReviews, getStoreStatistics, type ReviewWithProduct } from "@/app/actions";
import { useParams } from "next/navigation";

// Avatar component with error handling
function Avatar({ src, name, backgroundColor }: { src?: string; name: string; backgroundColor: string }) {
  const [imageError, setImageError] = useState(false);
  
  if (!src || imageError) {
    return (
      <div 
        className="flex h-full w-full items-center justify-center text-sm font-bold text-white"
        style={{ backgroundColor }}
      >
        {name.charAt(0)}
      </div>
    );
  }
  
  return (
    <Image
      src={src}
      alt={name}
      width={40}
      height={40}
      className="h-full w-full object-cover"
      onError={() => setImageError(true)}
    />
  );
}

interface Testimonial {
  id: string;
  name: string;
  role: string;
  avatar?: string;
  content: string;
  rating: number;
  product?: string;
}

interface CMSTestimonial {
  id: string;
  name: string;
  role?: string;
  quote: string;
  image?: string;
  rating?: number;
}

interface TestimonialsProps {
  testimonials?: Testimonial[];
  /** Testimonials from "testimonials" collection metadata */
  cmsTestimonials?: CMSTestimonial[];
  title?: string;
  subtitle?: string;
  /** Channel for fetching reviews */
  channel?: string;
}


/**
 * Testimonials Section
 * 
 * Customer reviews carousel with ratings.
 * Fetches real product reviews (4+ stars) and displays them in an animated carousel.
 * Configurable via store config (homepage.sections.testimonials)
 */
export function Testimonials({
  testimonials: _testimonials,
  cmsTestimonials: _cmsTestimonials,
  title,
  subtitle,
  channel,
}: TestimonialsProps) {
  const params = useParams();
  const currentChannel = channel || (params?.channel as string) || "usd";
  const { homepage, branding } = useStoreConfig();
  const content = useContentConfig();
  
  // Get testimonials config
  const testimonialsConfig = homepage.sections.testimonials;
  const [reviews, setReviews] = useState<ReviewWithProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [statistics, setStatistics] = useState<{
    averageRating: number;
    customerCount: number;
    ordersDelivered: number;
    satisfactionRate: number;
  } | null>(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  const displayTitle = title || content.homepage.testimonialsTitle;
  const displaySubtitle = subtitle || content.homepage.testimonialsSubtitle;

  // Fetch reviews and statistics on mount
  // Note: Component is only rendered when enabled (checked by parent), so we always fetch
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [fetchedReviews, stats] = await Promise.all([
          getAllProductReviews(currentChannel, {
            limit: 20,
            minRating: 4,
          }),
          getStoreStatistics(currentChannel),
        ]);
        
        console.log("[Testimonials] ✅ Fetched reviews:", fetchedReviews.length, "reviews");
        if (fetchedReviews.length > 0) {
          console.log("[Testimonials] 📊 Review details:", fetchedReviews.map(r => ({ 
            id: r.id, 
            rating: r.rating, 
            status: r.status, 
            product: r.product?.name 
          })));
        } else {
          console.warn("[Testimonials] ⚠️ No reviews found. Check console logs from getAllProductReviews for details.");
        }
        console.log("[Testimonials] 📈 Statistics:", stats);
        
        setReviews(fetchedReviews);
        setStatistics(stats);
      } catch (error) {
        console.error("[Testimonials] Error fetching data:", error);
        setReviews([]);
        setStatistics(null);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [currentChannel]);

  // Auto-rotate carousel
  useEffect(() => {
    if (reviews.length <= 4) return; // Only auto-rotate if we have more than one slide

    intervalRef.current = setInterval(() => {
      setCurrentIndex((prev: number) => {
        const totalSlides = Math.ceil(reviews.length / 4);
        return (prev + 1) % totalSlides;
      });
    }, 5000); // Change every 5 seconds

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [reviews.length]);

  // Convert reviews to testimonials format
  // Show approved reviews first, then pending if no approved exist
  const approvedReviews = reviews.filter((r: ReviewWithProduct) => 
    r.status === "approved" || r.status === "APPROVED"
  );
  const pendingReviews = reviews.filter((r: ReviewWithProduct) => 
    r.status === "pending" || r.status === "PENDING"
  );
  
  // Use approved if available, otherwise use pending
  const reviewsToShow = approvedReviews.length > 0 ? approvedReviews : pendingReviews;
  
  console.log(`[Testimonials] Reviews breakdown: ${approvedReviews.length} approved, ${pendingReviews.length} pending, total: ${reviews.length}`);
  
  const displayTestimonials: Testimonial[] = reviewsToShow.map((review: ReviewWithProduct) => {
      const userName = review.user
        ? `${review.user.firstName || ""} ${review.user.lastName || ""}`.trim() || ((testimonialsConfig as any)?.customerLabel || "Customer")
        : ((testimonialsConfig as any)?.customerLabel || "Customer");
      
      const verifiedPurchaseLabel = (content.homepage as any).verifiedPurchaseLabel || "Verified Purchase";
      const customerLabel = (testimonialsConfig as any)?.customerLabel || "Customer";
      
      return {
        id: review.id,
        name: userName,
        role: review.isVerifiedPurchase ? verifiedPurchaseLabel : customerLabel,
        avatar: review.images?.[0] || undefined,
        content: review.body || review.title || "",
        rating: review.rating,
        product: review.product?.name,
      };
    });

  // If no reviews and not loading, don't render
  // But we need to keep hooks consistent, so we'll render empty state instead
  const hasReviews = !loading && displayTestimonials.length > 0;

  // Don't render if disabled - check AFTER all hooks to maintain hook consistency
  if (!homepage.sections.testimonials.enabled) {
    return null;
  }

  // Get background config
  const backgroundConfig = homepage.sections.testimonials.background as SectionBackgroundConfig | undefined;
  const backgroundStyles = generateSectionBackground(backgroundConfig, branding);
  const patternOverlay = generatePatternOverlay(backgroundConfig, branding);

  const sectionStyles: React.CSSProperties = {
    ...backgroundStyles,
  };

  return (
    <section 
      className="premium-band py-16 sm:py-20"
      style={sectionStyles}
    >
      {/* Pattern overlay for pattern backgrounds */}
      {patternOverlay && (
        <div className="absolute inset-0" style={{ opacity: (backgroundConfig?.patternOpacity ?? 10) / 100 }}>
          <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id={patternOverlay.patternId} width="40" height="40" patternUnits="userSpaceOnUse">
                {backgroundConfig?.patternType === "grid" && (
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke={branding.colors.text} strokeWidth="1"/>
                )}
                {backgroundConfig?.patternType === "dots" && (
                  <circle cx="10" cy="10" r="1.5" fill={branding.colors.text}/>
                )}
                {backgroundConfig?.patternType === "lines" && (
                  <path d="M 0 20 L 40 20" fill="none" stroke={branding.colors.text} strokeWidth="1"/>
                )}
                {backgroundConfig?.patternType === "waves" && (
                  <>
                    <path d="M 0 30 Q 15 20, 30 30 T 60 30" fill="none" stroke={branding.colors.text} strokeWidth="1"/>
                    <path d="M 0 40 Q 15 50, 30 40 T 60 40" fill="none" stroke={branding.colors.text} strokeWidth="1"/>
                  </>
                )}
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill={`url(#${patternOverlay.patternId})`} />
          </svg>
        </div>
      )}
      <div className="premium-band-content relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <SectionHeader
          title={displayTitle}
          subtitle={displaySubtitle}
          type="testimonials"
          align="center"
        />

        {/* Testimonials Carousel */}
        {loading ? (
          <div className="mt-12 flex items-center justify-center py-20">
            <div className="text-center">
              <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-neutral-200 border-t-transparent" 
                   style={{ borderTopColor: branding.colors.primary }} />
              <p className="mt-4 text-sm" style={{ color: branding.colors.textMuted }}>
                {(content.homepage as any).loadingReviewsText || "Loading reviews..."}
              </p>
            </div>
          </div>
        ) : !hasReviews ? (
          // Show message if no reviews found
          <div className="mt-12 text-center py-12">
            <div className="mx-auto max-w-md">
              <p className="text-sm font-medium" style={{ color: branding.colors.text }}>
                {reviews.length > 0 
                  ? ((content.homepage as any).noApprovedReviewsText || "No approved reviews with 4+ stars yet. {count} review(s) pending approval.").replace("{count}", reviews.length.toString())
                  : (content.homepage as any).noReviewsAvailableText || "No reviews available yet. Be the first to review our products!"}
              </p>
              {reviews.length === 0 && (
                <p className="mt-2 text-xs" style={{ color: branding.colors.textMuted }}>
                  {(content.homepage as any).noReviewsSubtext || "Reviews will appear here once customers start leaving feedback."}
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="mt-12 relative overflow-hidden">
            {/* Carousel Container */}
            <div
              ref={carouselRef}
              className="flex transition-transform duration-700 ease-in-out"
              style={{
                transform: `translateX(-${currentIndex * 100}%)`,
              }}
            >
              {/* Group testimonials into slides of 4 */}
              {Array.from({ length: Math.ceil(displayTestimonials.length / 4) }).map((_, slideIndex) => {
                const slideTestimonials = displayTestimonials.slice(slideIndex * 4, slideIndex * 4 + 4);
                return (
                  <div
                    key={slideIndex}
                    className="min-w-full px-4"
                    style={{
                      flexShrink: 0,
                    }}
                  >
                    <div className="mx-auto max-w-6xl">
                      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
                        {slideTestimonials.map((testimonial) => (
                          <TestimonialCard
                            key={testimonial.id}
                            testimonial={testimonial}
                            branding={branding}
                            cardConfig={(testimonialsConfig as any)?.card}
                            testimonialsConfig={testimonialsConfig as any}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Navigation Dots */}
            {displayTestimonials.length > 4 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                {Array.from({ length: Math.ceil(displayTestimonials.length / 4) }).map((_, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setCurrentIndex(index);
                      if (intervalRef.current) {
                        clearInterval(intervalRef.current);
                        intervalRef.current = null;
                      }
                    }}
                    className="h-2 rounded-full transition-all duration-300"
                    style={{
                      width: currentIndex === index ? "24px" : "8px",
                      backgroundColor: currentIndex === index 
                        ? branding.colors.primary 
                        : `${branding.colors.primary}40`,
                    }}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
            )}

            {/* Navigation Arrows */}
            {displayTestimonials.length > 4 && (
              <>
                <button
                  onClick={() => {
                    setCurrentIndex((prev) => (prev - 1 + Math.ceil(displayTestimonials.length / 4)) % Math.ceil(displayTestimonials.length / 4));
                    if (intervalRef.current) {
                      clearInterval(intervalRef.current);
                    }
                  }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white p-3 shadow-lg transition-all hover:scale-110"
                  style={{
                    border: `2px solid ${branding.colors.primary}40`,
                    color: branding.colors.primary,
                  }}
                  aria-label="Previous reviews"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={() => {
                    const totalSlides = Math.ceil(displayTestimonials.length / 4);
                    setCurrentIndex((prev: number) => (prev + 1) % totalSlides);
                    if (intervalRef.current) {
                      clearInterval(intervalRef.current);
                      intervalRef.current = null;
                    }
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white p-3 shadow-lg transition-all hover:scale-110"
                  style={{
                    border: `2px solid ${branding.colors.primary}40`,
                    color: branding.colors.primary,
                  }}
                  aria-label="Next reviews"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}
          </div>
        )}

        {/* Trust Badges - Real Statistics */}
        {statistics && (testimonialsConfig as any)?.trustBadges && (
          <div 
            className="mt-16 flex flex-wrap items-center justify-center gap-8 border-t pt-12"
            style={{
              borderColor: (testimonialsConfig as any).trustBadges?.borderColor || "rgb(229, 231, 235)",
            }}
          >
            {(testimonialsConfig as any).trustBadges?.showAverageRating !== false && (
              <TrustBadge 
                icon="⭐" 
                value={statistics.averageRating > 0 ? `${statistics.averageRating.toFixed(1)}/5` : "—"} 
                label={(content.homepage as any).averageRatingLabel || "Average Rating"} 
                branding={branding}
                textColor={(testimonialsConfig as any).trustBadges?.textColor}
              />
            )}
            {(testimonialsConfig as any).trustBadges?.showCustomerCount !== false && (
              <TrustBadge 
                icon="👥" 
                value={statistics.customerCount > 0 
                  ? statistics.customerCount >= 1000 
                    ? `${(statistics.customerCount / 1000).toFixed(1)}K+`
                    : statistics.customerCount.toString()
                  : "—"} 
                label={(content.homepage as any).happyCustomersLabel || "Happy Customers"} 
                branding={branding}
                textColor={(testimonialsConfig as any).trustBadges?.textColor}
              />
            )}
            {(testimonialsConfig as any).trustBadges?.showSatisfactionRate !== false && (
              <TrustBadge 
                icon="🏆" 
                value={statistics.satisfactionRate > 0 ? `${statistics.satisfactionRate}%` : "—"} 
                label={(content.homepage as any).satisfactionRateLabel || "Satisfaction Rate"} 
                branding={branding}
                textColor={(testimonialsConfig as any).trustBadges?.textColor}
              />
            )}
            {(testimonialsConfig as any).trustBadges?.showOrdersDelivered !== false && (
              <TrustBadge 
                icon="📦" 
                value={statistics.ordersDelivered > 0
                  ? statistics.ordersDelivered >= 1000
                    ? `${(statistics.ordersDelivered / 1000).toFixed(1)}K+`
                    : statistics.ordersDelivered.toString()
                  : "—"} 
                label={(content.homepage as any).ordersDeliveredLabel || "Orders Delivered"} 
                branding={branding}
                textColor={(testimonialsConfig as any).trustBadges?.textColor}
              />
            )}
          </div>
        )}
      </div>
    </section>
  );
}

// Testimonial Card Component
function TestimonialCard({ 
  testimonial, 
  branding,
  cardConfig,
  testimonialsConfig
}: { 
  testimonial: Testimonial;
  branding: any;
  cardConfig?: any;
  testimonialsConfig?: any;
}) {
  // Get card styling from config or use defaults
  const cardBg = cardConfig?.backgroundColor || "#ffffff";
  const cardBorder = cardConfig?.borderColor || "rgba(229, 231, 235, 0.5)";
  const cardRadius = cardConfig?.borderRadius || "var(--store-radius)";
  const cardPadding = cardConfig?.padding || "1.5rem"; // p-6 = 1.5rem
  const cardShadow = cardConfig?.shadow || `0 4px 16px -4px ${branding.colors.primary}15`;
  const hoverShadow = cardConfig?.hoverShadow || "0 12px 24px -8px rgba(0,0,0,0.15)";
  const hoverTransform = cardConfig?.hoverTransform || "translateY(-4px)";
  
  return (
    <div
      className="group relative overflow-hidden transition-shadow duration-200 ease-out"
      style={{ 
        backgroundColor: cardBg,
        border: `1px solid ${cardBorder}`,
        borderRadius: cardRadius,
        padding: cardPadding,
        boxShadow: cardShadow,
        transform: 'translateY(0)',
        transition: 'box-shadow 200ms ease-out, transform 200ms ease-out',
        willChange: 'transform',
      }}
      onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => {
        e.currentTarget.style.transform = hoverTransform;
        e.currentTarget.style.boxShadow = hoverShadow;
      }}
      onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = cardShadow;
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: `linear-gradient(120deg, ${branding.colors.accent}08, transparent 60%)`,
        }}
      />
      {/* Quote Icon */}
      <div 
        className="absolute -right-2 -top-2 text-6xl font-serif opacity-10"
        style={{ color: branding.colors.primary }}
      >
        "
      </div>

      {/* Rating */}
      <div className="flex gap-1">
        {Array.from({ length: 5 }).map((_, i) => {
          const starColor = (testimonialsConfig as any)?.starColor || "#FFD700"; // Gold default
          const starEmptyColor = (testimonialsConfig as any)?.starEmptyColor || `${branding.colors.textMuted}30`;
          const starSize = (testimonialsConfig as any)?.starSize || "base";
          const sizeClasses: Record<string, string> = {
            xs: "h-3 w-3",
            sm: "h-4 w-4",
            base: "h-5 w-5",
            lg: "h-6 w-6",
            xl: "h-7 w-7",
          };
          
          return (
            <svg
              key={i}
              className={`${sizeClasses[starSize] || sizeClasses.base} transition-transform duration-300 group-hover:scale-110`}
              fill={i < testimonial.rating ? starColor : starEmptyColor}
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          );
        })}
      </div>

      {/* Content */}
      <p 
        className="mt-4 text-sm leading-relaxed"
        style={{ color: branding.colors.text }}
      >
        "{testimonial.content}"
      </p>

      {/* Product Badge */}
      {testimonial.product && (
        <div 
          className="mt-4 inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide"
          style={{ 
            backgroundColor: `${branding.colors.primary}15`,
            color: branding.colors.primary,
            border: `1px solid ${branding.colors.primary}35`,
          }}
        >
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          {testimonial.product}
        </div>
      )}

      {/* Author */}
      <div className="mt-6 flex items-center gap-3">
        <div
          className="h-10 w-10 overflow-hidden rounded-full ring-2"
          style={{
            backgroundColor: `${branding.colors.primary}30`,
            boxShadow: `0 6px 14px ${branding.colors.primary}40`,
          }}
        >
          <Avatar 
            src={testimonial.avatar}
            name={testimonial.name}
            backgroundColor={branding.colors.primary}
          />
        </div>
        <div>
          <p 
            className="font-semibold"
            style={{ color: branding.colors.text }}
          >
            {testimonial.name}
          </p>
          <p 
            className="text-sm"
            style={{ color: branding.colors.textMuted }}
          >
            {testimonial.role}
          </p>
        </div>
      </div>
    </div>
  );
}

function TrustBadge({ 
  icon, 
  value, 
  label, 
  branding,
  textColor
}: { 
  icon: string; 
  value: string; 
  label: string;
  branding: any;
  textColor?: string | null;
}) {
  const primaryTextColor = textColor || branding.colors.text;
  const mutedTextColor = textColor || branding.colors.textMuted;
  
  return (
    <div className="flex items-center gap-3 text-center">
      <span className="text-3xl">{icon}</span>
      <div className="text-left">
        <p 
          className="text-2xl font-bold"
          style={{ color: primaryTextColor }}
        >
          {value}
        </p>
        <p 
          className="text-sm"
          style={{ color: mutedTextColor }}
        >
          {label}
        </p>
      </div>
    </div>
  );
}

