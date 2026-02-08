"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { parseDescription } from "./utils";
import { useBranding, useCollectionMosaicConfig, useContentConfig } from "@/providers/StoreConfigProvider";

// Type for collection data from GraphQL
interface CollectionItem {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  backgroundImage?: {
    url: string;
    alt?: string | null;
  } | null;
  products?: {
    totalCount?: number | null;
    edges: Array<{
      node: {
        id: string;
        name: string;
        slug: string;
        thumbnail?: {
          url: string;
          alt?: string | null;
        } | null;
        media?: Array<{
          url: string;
          alt?: string | null;
        }> | null;
      };
    }>;
  } | null;
}

interface CollectionMosaicProps {
  collections: CollectionItem[];
  channel: string;
}

// Default values when config is not available
const DEFAULTS = {
  enabled: true,
  title: "Shop by Collection",
  subtitle: "Curated for you",
  maxCollections: 5,
  excludeSlugs: ["hero-banner", "testimonials", "brands"],
};

function CollectionGridCard({
  collection,
  channel,
  itemsText,
  shopCollectionText,
}: {
  collection: CollectionItem;
  channel: string;
  itemsText: string;
  shopCollectionText: string;
}) {
  const productCount = collection.products?.totalCount ?? 0;
  const image = collection.backgroundImage?.url || collection.products?.edges?.[0]?.node?.thumbnail?.url;

  return (
    <Link
      href={`/${encodeURIComponent(channel)}/products?collections=${collection.slug}`}
      className="group relative flex h-72 flex-col overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl"
    >
      {/* Image Area */}
      <div className="relative flex-1 bg-gradient-to-br from-neutral-50 to-white">
        {image ? (
          <Image
            src={image}
            alt={collection.backgroundImage?.alt || collection.name}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-110"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        ) : (
          // Fallback: Show product thumbnails in a grid
          <div className="grid h-full grid-cols-2 gap-1 p-2">
            {collection.products?.edges?.slice(0, 4).map((edge) => (
              <div key={edge.node.id} className="relative overflow-hidden rounded-lg bg-neutral-100">
                {edge.node.thumbnail?.url && (
                  <Image
                    src={edge.node.thumbnail.url}
                    alt={edge.node.thumbnail.alt || edge.node.name}
                    fill
                    className="object-contain p-2"
                    sizes="100px"
                  />
                )}
              </div>
            ))}
          </div>
        )}
        {/* Overlay gradient */}
        <div
          className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"
          aria-hidden="true"
        />
        {/* Product count badge */}
        <div className="absolute start-4 top-4 rounded-full bg-white/90 px-3 py-1 backdrop-blur-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-700">
            {productCount} {itemsText}
          </span>
        </div>
      </div>

      {/* Info Area */}
      <div className="absolute bottom-0 start-0 end-0 p-5">
        <h3 className="text-lg font-black uppercase tracking-tight text-white">
          {collection.name}
        </h3>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-xs font-medium text-white/80">{shopCollectionText}</span>
          <ArrowRight
            size={16}
            className="text-white transition-all duration-300 group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1"
            aria-hidden="true"
          />
        </div>
      </div>
    </Link>
  );
}

function CollectionHeroCard({
  collection,
  channel,
  accentColor,
  itemsText,
  featuredCollectionLabel,
  shopNowText,
}: {
  collection: CollectionItem;
  channel: string;
  accentColor: string;
  itemsText: string;
  featuredCollectionLabel: string;
  shopNowText: string;
}) {
  const productCount = collection.products?.totalCount ?? 0;
  const image = collection.backgroundImage?.url || collection.products?.edges?.[0]?.node?.thumbnail?.url;

  return (
    <Link
      href={`/${encodeURIComponent(channel)}/products?collections=${collection.slug}`}
      className="group relative flex min-h-[580px] flex-col overflow-hidden rounded-[36px] border-2 border-neutral-200 bg-white shadow-lg transition-all duration-500 hover:shadow-2xl"
      aria-label={`Featured collection: ${collection.name}`}
    >
      {/* Large Image Area */}
      <div className="relative flex-1 bg-gradient-to-br from-neutral-100 via-white to-neutral-50">
        {image ? (
          <Image
            src={image}
            alt={collection.backgroundImage?.alt || collection.name}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
        ) : (
          // Fallback: Large product grid
          <div className="grid h-full grid-cols-2 gap-2 p-4">
            {collection.products?.edges?.slice(0, 4).map((edge) => (
              <div key={edge.node.id} className="relative overflow-hidden rounded-xl bg-neutral-100">
                {edge.node.thumbnail?.url && (
                  <Image
                    src={edge.node.thumbnail.url}
                    alt={edge.node.thumbnail.alt || edge.node.name}
                    fill
                    className="object-contain p-4"
                    sizes="200px"
                  />
                )}
              </div>
            ))}
          </div>
        )}
        {/* Overlay gradient */}
        <div
          className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"
          aria-hidden="true"
        />
        {/* Floating Badge */}
        <div className="absolute end-6 top-6 rounded-full border border-white/50 bg-white/90 px-4 py-2 shadow-lg backdrop-blur-md">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-900">
            {productCount} {itemsText}
          </span>
        </div>
      </div>

      {/* Floating Info Card */}
      <div className="absolute bottom-6 start-6 max-w-xs rounded-2xl border border-white/50 bg-white/95 p-6 shadow-2xl backdrop-blur-xl transition-all duration-300 group-hover:bottom-8">
        <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-neutral-500">
          {featuredCollectionLabel}
        </div>
        <h3 className="mt-2 text-xl font-black uppercase tracking-tight text-neutral-900">
          {collection.name}
        </h3>
        {collection.description && parseDescription(collection.description) && (
          <p className="mt-2 line-clamp-2 text-xs text-neutral-600">
            {parseDescription(collection.description)}
          </p>
        )}
        <div className="mt-3 flex items-center justify-between">
          <span className="text-sm font-bold text-neutral-700">{shopNowText}</span>
          <div
            className="flex h-10 w-10 items-center justify-center rounded-full transition-all duration-300 group-hover:scale-110"
            style={{ backgroundColor: accentColor }}
          >
            <ArrowRight
              size={20}
              className="text-white rtl:rotate-180"
              aria-hidden="true"
            />
          </div>
        </div>
      </div>
    </Link>
  );
}

/**
 * CollectionMosaic - Featured collections showcase in mosaic layout
 * Configurable via Storefront Control.
 */
export function CollectionMosaic({ collections, channel }: CollectionMosaicProps) {
  const { colors } = useBranding();
  const config = useCollectionMosaicConfig();
  const contentConfig = useContentConfig();

  // Get translated content from config
  const homepageContent = contentConfig.homepage;
  const allCollectionsText = homepageContent.allCollectionsButton || "All Collections";
  const itemsText = homepageContent.itemsText || "items";
  const shopCollectionText = homepageContent.shopCollectionButton || "Shop collection";
  const featuredCollectionLabel = homepageContent.featuredCollectionLabel || "Featured Collection";
  const shopNowText = homepageContent.shopNowButton || "Shop Now";

  // Use config values with defaults fallback
  const enabled = config?.enabled ?? DEFAULTS.enabled;
  const title = config?.title ?? DEFAULTS.title;
  const subtitle = config?.subtitle ?? DEFAULTS.subtitle;

  // Hide if explicitly disabled or no collections
  if (!enabled || collections.length === 0) return null;

  // Hero is the first collection, grid is the next 4
  const heroCollection = collections[0];
  const gridCollections = collections.slice(1, 5);

  if (!heroCollection) return null;

  return (
    <section
      className="relative overflow-hidden border-t border-neutral-100 bg-gradient-to-b from-white to-neutral-50"
      aria-label="Collection showcase"
    >
      {/* Background gradient */}
      <div
        className="absolute inset-0 opacity-[0.12]"
        style={{
          backgroundImage: `radial-gradient(circle at 30% 50%, ${colors.primary} 0%, transparent 60%)`,
        }}
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-[var(--design-container-max)] px-6 py-20 lg:px-12 lg:py-24">
        {/* Header */}
        <div className="mb-12 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h2 className="font-heading text-3xl font-black uppercase tracking-tighter text-neutral-900 lg:text-4xl">
              {title}
            </h2>
            {subtitle && (
              <p className="mt-2 max-w-lg text-sm font-medium text-neutral-600">
                {subtitle}
              </p>
            )}
          </div>
          <Link
            href={`/${encodeURIComponent(channel)}/products`}
            className="group inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-neutral-900 transition hover:gap-3"
          >
            {allCollectionsText}
            <ArrowRight
              size={16}
              className="transition-transform duration-300 group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1"
              aria-hidden="true"
            />
          </Link>
        </div>

        {/* Mosaic Grid */}
        <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          {/* Left: 2x2 Grid */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {gridCollections.map((collection) => (
              <CollectionGridCard
                key={collection.id}
                collection={collection}
                channel={channel}
                itemsText={itemsText}
                shopCollectionText={shopCollectionText}
              />
            ))}
          </div>

          {/* Right: Large Hero Card */}
          <CollectionHeroCard
            collection={heroCollection}
            channel={channel}
            accentColor={colors.primary}
            itemsText={itemsText}
            featuredCollectionLabel={featuredCollectionLabel}
            shopNowText={shopNowText}
          />
        </div>
      </div>
    </section>
  );
}
