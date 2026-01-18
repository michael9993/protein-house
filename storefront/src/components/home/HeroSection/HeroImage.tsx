"use client";

import Image from "next/image";
import { useStoreConfig, useContentConfig } from "@/providers/StoreConfigProvider";
import { LinkWithChannel } from "@/ui/atoms/LinkWithChannel";

interface HeroImageProps {
  image?: string;
  title?: string;
  subtitle?: string;
  ctaText?: string;
  ctaLink?: string;
}

export function HeroImage({
  image = "/hero-sports.jpg",
  title,
  subtitle,
  ctaText,
  ctaLink = "/products",
}: HeroImageProps) {
  const { store, branding } = useStoreConfig();
  const content = useContentConfig();

  const heroTitle = title || store.tagline || `Welcome to ${store.name}`;
  const heroSubtitle = subtitle || store.description;
  const heroCta = ctaText || content.homepage.heroCtaText;
  const heroSecondaryCta = content.homepage.heroSecondaryCtaText;

  return (
    <section className="relative h-[70vh] min-h-[500px] w-full overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <Image
          src={image}
          alt={heroTitle}
          fill
          priority
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
      </div>

      {/* Content */}
      <div className="relative z-10 mx-auto flex h-full max-w-7xl flex-col justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl animate-slide-up">
          <h1 
            className="heading text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl"
            style={{ fontFamily: `var(--font-${branding.typography.fontHeading.toLowerCase().replace(/\s+/g, '-')}, var(--store-font-heading))` }}
          >
            {heroTitle}
          </h1>
          <p className="mt-4 text-lg text-white/90 sm:text-xl md:mt-6 md:text-2xl">
            {heroSubtitle}
          </p>
          <div className="mt-8 flex gap-4">
            <LinkWithChannel
              href={ctaLink}
              className="btn-primary inline-flex items-center gap-2 px-8 py-4 text-lg font-semibold transition-all hover:scale-105"
              style={{ backgroundColor: branding.colors.primary }}
            >
              {heroCta}
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </LinkWithChannel>
            <LinkWithChannel
              href="/categories"
              className="btn-outline inline-flex items-center gap-2 border-2 border-white px-8 py-4 text-lg font-semibold text-white transition-all hover:bg-white hover:text-neutral-900"
            >
              {heroSecondaryCta}
            </LinkWithChannel>
          </div>
        </div>
      </div>

      {/* Scroll Indicator - uses logical properties for RTL support */}
      <div className="absolute bottom-8 start-1/2 -translate-x-1/2 rtl:translate-x-1/2 animate-bounce">
        <svg className="h-8 w-8 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </div>
    </section>
  );
}

