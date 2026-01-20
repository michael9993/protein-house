"use client";

import Image from "next/image";
import { useStoreConfig } from "@/providers/StoreConfigProvider";
import { LinkWithChannel } from "@/ui/atoms/LinkWithChannel";
import { useState, useEffect, useCallback } from "react";

interface Slide {
  image: string;
  title: string;
  subtitle: string;
  ctaText: string;
  ctaLink: string;
}

interface HeroSliderProps {
  slides?: Slide[];
  autoPlayInterval?: number;
}

const defaultSlides: Slide[] = [
  {
    image: "/slides/slide-1.jpg",
    title: "New Season Collection",
    subtitle: "Discover the latest arrivals for this season",
    ctaText: "Shop New Arrivals",
    ctaLink: "/collections/new-arrivals",
  },
  {
    image: "/slides/slide-2.jpg",
    title: "Up to 50% Off",
    subtitle: "Don't miss our biggest sale of the year",
    ctaText: "Shop Sale",
    ctaLink: "/collections/sale",
  },
  {
    image: "/slides/slide-3.jpg",
    title: "Premium Quality",
    subtitle: "Crafted for champions, made to last",
    ctaText: "Explore Collection",
    ctaLink: "/collections/premium",
  },
];

export function HeroSlider({
  slides = defaultSlides,
  autoPlayInterval = 5000,
}: HeroSliderProps) {
  const { branding } = useStoreConfig();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const goToSlide = useCallback((index: number) => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentSlide(index);
    setTimeout(() => setIsAnimating(false), 500);
  }, [isAnimating]);

  const nextSlide = useCallback(() => {
    goToSlide((currentSlide + 1) % slides.length);
  }, [currentSlide, slides.length, goToSlide]);

  const prevSlide = useCallback(() => {
    goToSlide((currentSlide - 1 + slides.length) % slides.length);
  }, [currentSlide, slides.length, goToSlide]);

  // Auto-play
  useEffect(() => {
    const timer = setInterval(nextSlide, autoPlayInterval);
    return () => clearInterval(timer);
  }, [nextSlide, autoPlayInterval]);

  return (
    <section className="relative h-[70vh] min-h-[500px] w-full overflow-hidden">
      {/* Slides */}
      {slides.map((slide, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-300 ease-out ${
            index === currentSlide ? "opacity-100 z-10" : "opacity-0 z-0"
          }`}
          style={{ willChange: 'opacity' }}
        >
          {/* Background Image */}
          <Image
            src={slide.image}
            alt={slide.title}
            fill
            priority={index === 0}
            className="object-cover"
            sizes="100vw"
          />
          
          {/* Gradient Overlay */}
          <div 
            className="absolute inset-0"
            style={{
              background: `linear-gradient(135deg, ${branding.colors.secondary}ee 0%, ${branding.colors.secondary}88 50%, transparent 100%)`,
            }}
          />

          {/* Content */}
          <div className="relative z-10 mx-auto flex h-full max-w-7xl flex-col justify-center px-4 sm:px-6 lg:px-8">
            <div 
              className={`max-w-2xl transition-opacity duration-300 ease-out ${
                index === currentSlide 
                  ? "opacity-100" 
                  : "opacity-0"
              }`}
              style={{
                transform: index === currentSlide ? 'translateY(0)' : 'translateY(16px)',
                transition: 'opacity 300ms ease-out, transform 300ms ease-out',
                willChange: 'transform, opacity',
              }}
            >
              <h1 
                className="heading text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl"
              >
                {slide.title}
              </h1>
              <p className="mt-4 text-lg text-white/90 sm:text-xl md:mt-6 md:text-2xl">
                {slide.subtitle}
              </p>
              <div className="mt-8">
                <LinkWithChannel
                  href={slide.ctaLink}
                  className="btn-primary inline-flex items-center gap-2 px-8 py-4 text-lg font-semibold transition-transform duration-200 ease-out hover:scale-[1.02]"
                  style={{ willChange: 'transform' }}
                  style={{ backgroundColor: branding.colors.primary }}
                >
                  {slide.ctaText}
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </LinkWithChannel>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Navigation Arrows - uses logical properties for RTL support */}
      <button
        onClick={prevSlide}
        className="absolute start-4 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white backdrop-blur-sm transition-all hover:bg-white/20"
        aria-label="Previous slide"
      >
        <svg className="h-6 w-6 rtl:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <button
        onClick={nextSlide}
        className="absolute end-4 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white backdrop-blur-sm transition-all hover:bg-white/20"
        aria-label="Next slide"
      >
        <svg className="h-6 w-6 rtl:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Dots Navigation - uses logical properties for RTL support */}
      <div className="absolute bottom-8 start-1/2 z-20 flex -translate-x-1/2 rtl:translate-x-1/2 gap-3">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`h-2 rounded-full transition-all ${
              index === currentSlide 
                ? "w-8 bg-white" 
                : "w-2 bg-white/40 hover:bg-white/60"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
}

