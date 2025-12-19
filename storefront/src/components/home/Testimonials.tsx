"use client";

import Image from "next/image";
import { useStoreConfig } from "@/providers/StoreConfigProvider";
import { useState } from "react";

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
}

// Default testimonials for sports store
const defaultTestimonials: Testimonial[] = [
  {
    id: "1",
    name: "Marcus Johnson",
    role: "Professional Runner",
    avatar: "/testimonials/avatar-1.jpg",
    content: "The running shoes I got from SportZone are absolutely incredible. Best grip and comfort I've ever experienced. Shaved 2 minutes off my marathon time!",
    rating: 5,
    product: "Pro Runner X1",
  },
  {
    id: "2",
    name: "Sarah Chen",
    role: "Fitness Instructor",
    avatar: "/testimonials/avatar-2.jpg",
    content: "I've tried many sports brands, but nothing compares to the quality here. The training gear is durable, stylish, and perfect for high-intensity workouts.",
    rating: 5,
    product: "Training Essential Kit",
  },
  {
    id: "3",
    name: "David Rodriguez",
    role: "Basketball Coach",
    avatar: "/testimonials/avatar-3.jpg",
    content: "Outstanding customer service and fast shipping. The basketball gear for my team arrived in perfect condition. We're now fully equipped for the season!",
    rating: 5,
    product: "Team Basketball Set",
  },
  {
    id: "4",
    name: "Emma Thompson",
    role: "Yoga Enthusiast",
    avatar: "/testimonials/avatar-4.jpg",
    content: "Love the eco-friendly yoga mats and apparel. Great quality, beautiful designs, and I feel good knowing they're sustainably made.",
    rating: 5,
    product: "Eco Yoga Collection",
  },
];

/**
 * Testimonials Section
 * 
 * Customer reviews carousel with ratings.
 * Configurable via store config (homepage.sections.testimonials)
 * 
 * DASHBOARD SETUP:
 * 1. Create collection with slug "testimonials" (Dashboard > Catalog > Collections)
 * 2. Add metadata key "testimonials_json" with JSON array:
 *    [
 *      { "id": "1", "name": "John Doe", "role": "Customer", "quote": "Great service!", "rating": 5 },
 *      ...
 *    ]
 */
export function Testimonials({
  testimonials = defaultTestimonials,
  cmsTestimonials = [],
  title = "What Our Athletes Say",
  subtitle = "Join thousands of satisfied customers who trust us for their sports gear",
}: TestimonialsProps) {
  const { homepage, branding } = useStoreConfig();
  const [activeIndex, setActiveIndex] = useState(0);

  // Don't render if disabled
  if (!homepage.sections.testimonials.enabled) {
    return null;
  }

  // Use CMS testimonials if available, otherwise use defaults
  const displayTestimonials: Testimonial[] = cmsTestimonials.length > 0
    ? cmsTestimonials.map(t => ({
        id: t.id,
        name: t.name,
        role: t.role || "Customer",
        avatar: t.image,
        content: t.quote,
        rating: t.rating || 5,
      }))
    : testimonials;

  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center">
          <h2 
            className="heading text-3xl font-bold tracking-tight sm:text-4xl"
            style={{ color: branding.colors.text }}
          >
            {title}
          </h2>
          <p 
            className="mt-3 text-lg"
            style={{ color: branding.colors.textMuted }}
          >
            {subtitle}
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {displayTestimonials.map((testimonial, index) => (
            <div
              key={testimonial.id}
              className="group relative overflow-hidden p-6 transition-all hover:-translate-y-1 hover:shadow-xl"
              style={{ 
                backgroundColor: branding.colors.surface,
                borderRadius: `var(--store-radius)`,
                border: `1px solid ${branding.colors.textMuted}20`,
              }}
            >
              {/* Quote Icon */}
              <div 
                className="absolute -right-2 -top-2 text-6xl font-serif opacity-10"
                style={{ color: branding.colors.primary }}
              >
                "
              </div>

              {/* Rating */}
              <div className="flex gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <svg
                    key={i}
                    className="h-5 w-5"
                    fill={i < testimonial.rating ? branding.colors.accent : `${branding.colors.textMuted}30`}
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
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
                  className="mt-4 inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium"
                  style={{ 
                    backgroundColor: `${branding.colors.primary}15`,
                    color: branding.colors.primary,
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
                  className="h-10 w-10 overflow-hidden rounded-full"
                  style={{ backgroundColor: branding.colors.primary }}
                >
                  {testimonial.avatar ? (
                    <Image
                      src={testimonial.avatar}
                      alt={testimonial.name}
                      width={40}
                      height={40}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm font-bold text-white">
                      {testimonial.name.charAt(0)}
                    </div>
                  )}
                </div>
                <div>
                  <p 
                    className="font-medium"
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
          ))}
        </div>

        {/* Trust Badges */}
        <div className="mt-16 flex flex-wrap items-center justify-center gap-8 border-t border-neutral-200 pt-12">
          <TrustBadge 
            icon="⭐" 
            value="4.9/5" 
            label="Average Rating" 
            branding={branding} 
          />
          <TrustBadge 
            icon="👥" 
            value="50K+" 
            label="Happy Customers" 
            branding={branding} 
          />
          <TrustBadge 
            icon="🏆" 
            value="98%" 
            label="Satisfaction Rate" 
            branding={branding} 
          />
          <TrustBadge 
            icon="📦" 
            value="100K+" 
            label="Orders Delivered" 
            branding={branding} 
          />
        </div>
      </div>
    </section>
  );
}

function TrustBadge({ 
  icon, 
  value, 
  label, 
  branding 
}: { 
  icon: string; 
  value: string; 
  label: string;
  branding: any;
}) {
  return (
    <div className="flex items-center gap-3 text-center">
      <span className="text-3xl">{icon}</span>
      <div className="text-left">
        <p 
          className="text-2xl font-bold"
          style={{ color: branding.colors.text }}
        >
          {value}
        </p>
        <p 
          className="text-sm"
          style={{ color: branding.colors.textMuted }}
        >
          {label}
        </p>
      </div>
    </div>
  );
}

