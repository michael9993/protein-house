"use client";

import { useStoreConfig } from "@/providers/StoreConfigProvider";
import { LinkWithChannel } from "@/ui/atoms/LinkWithChannel";
import { useEffect, useRef, useState } from "react";

interface HeroVideoProps {
  videoSrc?: string;
  posterImage?: string;
  title?: string;
  subtitle?: string;
  ctaText?: string;
  ctaLink?: string;
}

export function HeroVideo({
  videoSrc = "/hero-video.mp4",
  posterImage = "/hero-poster.jpg",
  title,
  subtitle,
  ctaText,
  ctaLink = "/products",
}: HeroVideoProps) {
  const { store, branding, content } = useStoreConfig();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasVideo, setHasVideo] = useState(true);

  const heroTitle = title || store.tagline || `Welcome to ${store.name}`;
  const heroSubtitle = subtitle || store.description;
  const heroCta = ctaText || content.homepage.heroCtaText;
  
  // Get hero config for badge text
  const { homepage } = useStoreConfig();
  const heroBadgeText = homepage?.sections?.hero?.badgeText || null;

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = 0.75;
      
      // Handle video load error
      videoRef.current.onerror = () => {
        setHasVideo(false);
      };
    }
  }, []);

  return (
    <section className="relative h-[80vh] min-h-[500px] w-full overflow-hidden lg:min-h-[600px]" style={{ backgroundColor: branding.colors.secondary }}>
      {/* Animated Gradient Background (fallback when no video) */}
      <div 
        className="absolute inset-0"
        style={{
          background: `
            linear-gradient(135deg, ${branding.colors.secondary} 0%, #0f0f23 50%, ${branding.colors.secondary} 100%)
          `,
        }}
      >
        {/* Animated gradient orbs */}
        <div 
          className="absolute -left-20 -top-20 h-[500px] w-[500px] rounded-full opacity-30 blur-3xl"
          style={{
            animation: 'pulse 4s ease-in-out infinite',
            willChange: 'opacity',
          }}
          style={{ backgroundColor: branding.colors.primary }}
        />
        <div 
          className="absolute -bottom-20 -right-20 h-[400px] w-[400px] rounded-full opacity-20 blur-3xl"
          style={{ 
            backgroundColor: branding.colors.accent, 
            animation: 'pulse 4s ease-in-out infinite 1s',
            willChange: 'opacity',
          }}
        />
        <div 
          className="absolute left-1/2 top-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-10 blur-3xl"
          style={{ 
            backgroundColor: '#00D4FF', 
            animation: 'pulse 4s ease-in-out infinite 2s',
            willChange: 'opacity',
          }}
        />
        
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-5">
          <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="heroGrid" width="60" height="60" patternUnits="userSpaceOnUse">
                <path d="M 60 0 L 0 0 0 60" fill="none" stroke="white" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#heroGrid)" />
          </svg>
        </div>
      </div>

      {/* Video Background (if available) */}
      {hasVideo && (
        <div className="absolute inset-0">
          <video
            ref={videoRef}
            autoPlay
            muted
            loop
            playsInline
            poster={posterImage}
            onLoadedData={() => setIsLoaded(true)}
            onError={() => setHasVideo(false)}
            className={`h-full w-full object-cover transition-opacity duration-300 ease-out ${
              isLoaded ? "opacity-100" : "opacity-0"
            }`}
          >
            <source src={videoSrc} type="video/mp4" />
          </video>
        </div>
      )}
      
      {/* Gradient Overlay - uses logical properties for RTL support */}
      <div 
        className="absolute inset-0"
        style={{
          background: `linear-gradient(to inline-end, ${branding.colors.secondary}ee 0%, ${branding.colors.secondary}aa 40%, ${branding.colors.secondary}40 70%, transparent 100%)`,
        }}
      />
      
      {/* Bottom Fade */}
      <div 
        className="absolute bottom-0 start-0 end-0 h-32"
        style={{
          background: `linear-gradient(to top, ${branding.colors.background}, transparent)`,
        }}
      />

      {/* Content */}
      <div className="relative z-10 mx-auto flex h-full max-w-7xl flex-col justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          {/* Badge */}
          {heroBadgeText && (
            <div 
              className="mb-6 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium"
              style={{ 
                backgroundColor: `${branding.colors.primary}20`,
                color: branding.colors.primary,
                border: `1px solid ${branding.colors.primary}40`,
              }}
            >
              <span className="relative flex h-2 w-2">
                <span 
                  className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
                  style={{ backgroundColor: branding.colors.primary }}
                />
                <span 
                  className="relative inline-flex h-2 w-2 rounded-full"
                  style={{ backgroundColor: branding.colors.primary }}
                />
              </span>
              {heroBadgeText}
            </div>
          )}

          <h1 
            className="heading text-5xl font-bold tracking-tight text-white sm:text-6xl md:text-7xl"
            style={{ 
              fontFamily: `var(--font-${branding.typography.fontHeading.toLowerCase().replace(/\s+/g, '-')}, var(--store-font-heading))`,
              textShadow: '2px 2px 8px rgba(0,0,0,0.3)',
            }}
          >
            {heroTitle}
          </h1>
          <p className="mt-6 text-xl text-white/90 sm:text-2xl">
            {heroSubtitle}
          </p>
          
          {/* CTA Buttons */}
          <div className="mt-10 flex flex-wrap gap-4">
            <LinkWithChannel
              href={ctaLink}
              className="group inline-flex items-center gap-3 rounded-full px-8 py-4 text-lg font-bold text-white transition-transform duration-200 ease-out hover:scale-[1.02] hover:shadow-lg"
              style={{ willChange: 'transform' }}
              style={{ 
                backgroundColor: branding.colors.primary,
                boxShadow: `0 4px 20px ${branding.colors.primary}60`,
              }}
            >
              {heroCta}
              <svg 
                className="h-5 w-5 transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </LinkWithChannel>
            
            <LinkWithChannel
              href="/collections/new-arrivals"
              className="group inline-flex items-center gap-3 rounded-full border-2 border-white/30 bg-white/10 px-8 py-4 text-lg font-bold text-white backdrop-blur-sm transition-all hover:border-white hover:bg-white/20"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {content.homepage.watchVideoButton}
            </LinkWithChannel>
          </div>

          {/* Stats */}
          <div className="mt-12 flex gap-12">
            <div className="text-white">
              <p className="text-3xl font-bold">500+</p>
              <p className="text-sm text-white/60">Products</p>
            </div>
            <div className="text-white">
              <p className="text-3xl font-bold">50+</p>
              <p className="text-sm text-white/60">Brands</p>
            </div>
            <div className="text-white">
              <p className="text-3xl font-bold">24/7</p>
              <p className="text-sm text-white/60">Support</p>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator - uses logical properties for RTL support */}
      <div className="absolute bottom-8 start-1/2 -translate-x-1/2 rtl:translate-x-1/2">
        <div className="flex flex-col items-center gap-2 text-white/60">
          <span className="text-xs uppercase tracking-widest">Scroll</span>
          <div className="h-12 w-[1px] bg-gradient-to-b from-white/60 to-transparent" />
        </div>
      </div>
    </section>
  );
}

