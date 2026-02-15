"use client";

import Image from "next/image";
import Link from "next/link";
import { deriveBrandSlug } from "./utils";
import { buildProductsUrl, buildBrandUrl, withChannel } from "@/lib/urls";
import { SectionViewAllButton } from "./SectionViewAllButton";
import { SectionWrapper } from "./SectionWrapper";
import { type FeaturedBrand } from "@/lib/cms";
import { useBranding, useBrandGridConfig, useContentConfig } from "@/providers/StoreConfigProvider";

interface BrandGridProps {
  brands: FeaturedBrand[];
  channel: string;
}

/**
 * BrandGrid - Display featured brand partners in a clean e-commerce grid.
 * Brand logos come from Saleor Pages (brand-logo file attribute).
 * Configurable via Storefront Control.
 */
export function BrandGrid({ brands, channel }: BrandGridProps) {
  const { colors } = useBranding();
  const config = useBrandGridConfig();
  const contentConfig = useContentConfig();

  // Use config values with fallback chain
  const enabled = config?.enabled ?? true;
  const title = config?.title ?? contentConfig.homepage.brandsTitle ?? "";
  const subtitle = config?.subtitle ?? contentConfig.homepage.brandsSubtitle ?? "";
  const maxBrands = config?.maxBrands ?? 8;

  // Get translated content from config
  const homepageContent = contentConfig.homepage;
  const curatedLabel = homepageContent.curatedLabel || "Curated";
  const viewAllBrandsText = homepageContent.viewAllBrandsButton || "View all brands";
  const shopNowText = homepageContent.shopNowButton || "Shop now";

  // Hide if explicitly disabled or no brands
  if (!enabled || brands.length === 0) return null;

  return (
    <section
      className="border-b border-neutral-100"
      aria-label="Featured brands"
    >
      <div className="mx-auto max-w-[var(--design-container-max)] px-6 py-16 lg:px-12">
        <SectionWrapper>
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-neutral-500">{curatedLabel}</p>
              <h2 className="mt-3 font-heading text-4xl font-black uppercase tracking-tighter text-neutral-900 md:text-5xl">
                {title}
              </h2>
              {subtitle && (
                <p className="mt-3 max-w-2xl text-sm font-medium text-neutral-500">{subtitle}</p>
              )}
            </div>
            <SectionViewAllButton
              href={withChannel(channel, buildProductsUrl())}
              text={viewAllBrandsText}
            />
          </div>
        </SectionWrapper>

        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-4">
          {brands.slice(0, maxBrands).map((brand) => {
            const brandSlug = deriveBrandSlug(brand.name);
            const href = brand.url
              ? withChannel(channel, brand.url)
              : withChannel(channel, buildBrandUrl(brandSlug));

            return (
              <SectionWrapper key={brand.id} as="div">
                <Link
                  href={href}
                  className="group relative flex flex-col items-center justify-center overflow-hidden rounded-xl border border-neutral-200 bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:border-neutral-300 hover:shadow-lg sm:p-8"
                >
                  {/* Brand logo or name */}
                  <div className="flex h-16 w-full items-center justify-center sm:h-20">
                    {brand.logo ? (
                      <Image
                        src={brand.logo}
                        alt={`${brand.name} logo`}
                        width={120}
                        height={60}
                        className="max-h-14 w-auto object-contain opacity-70 transition-all duration-300 group-hover:opacity-100 group-hover:scale-105 sm:max-h-16"
                      />
                    ) : (
                      <span className="text-xl font-black uppercase tracking-tight text-neutral-800 transition-colors group-hover:text-neutral-950 sm:text-2xl">
                        {brand.name}
                      </span>
                    )}
                  </div>

                  {/* Brand name (shown below logo if logo exists) */}
                  {brand.logo && (
                    <span className="mt-3 text-[11px] font-semibold uppercase tracking-wider text-neutral-400 transition-colors group-hover:text-neutral-600">
                      {brand.name}
                    </span>
                  )}

                  {/* Hover CTA */}
                  <span
                    className="mt-3 inline-block rounded-full px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white opacity-0 transition-all duration-300 group-hover:opacity-100"
                    style={{ backgroundColor: colors.primary }}
                  >
                    {shopNowText}
                  </span>
                </Link>
              </SectionWrapper>
            );
          })}
        </div>
      </div>
    </section>
  );
}
