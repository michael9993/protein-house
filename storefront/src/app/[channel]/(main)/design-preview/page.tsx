
import Image from "next/image";
import Link from "next/link";
import { ProductsNewestDocument, ProductsTopRatedDocument, type ProductListItemFragment } from "@/gql/graphql";
import { executeGraphQL } from "@/lib/graphql";
import { formatMoney, formatMoneyRange } from "@/lib/utils";
import { DesignStyles } from "./DesignStyles";


export const metadata = {
  title: "Storefront Design Preview",
};

type PageProps = {
  params: Promise<{
    channel: string;
  }>;
  searchParams?: {
    dir?: string;
  };
};

const palette = {
  primary: "#1B5BFF",
  primaryDark: "#1142CC",
  accent: "#FF6B2C",
  lime: "#C5FF3C",
  ink: "#0B0F1A",
  muted: "#4B5563",
  surface: "#FFFFFF",
  surfaceMuted: "#F8FAFC",
};

const NEW_DAYS = 30;
const FALLBACK_MARQUEE = ["Performance", "Trail", "Studio", "Speed", "Recovery", "Grip", "Stability", "Sprint"];

const isNewProduct = (created: string) => {
  const createdDate = new Date(created).getTime();
  return Date.now() - createdDate < NEW_DAYS * 24 * 60 * 60 * 1000;
};

const getProductImage = (product: ProductListItemFragment | undefined | null) =>
  product?.thumbnail?.url || product?.media?.[0]?.url || null;

const getProductAlt = (product: ProductListItemFragment | undefined | null) =>
  product?.thumbnail?.alt || product?.media?.[0]?.alt || product?.name || "Product image";

const getProductBadge = (product: ProductListItemFragment) => {
  const current = product.pricing?.priceRange?.start?.gross;
  const undiscounted = product.pricing?.priceRangeUndiscounted?.start?.gross;
  const isOnSale = Boolean(current && undiscounted && undiscounted.amount > current.amount);
  if (isOnSale) return "Sale";
  if (isNewProduct(product.created)) return "New";
  if ((product.rating ?? 0) >= 4.6) return "Top Rated";
  return "Featured";
};

const uniqueBy = <T, K extends string | number>(items: T[], getKey: (item: T) => K | null | undefined) => {
  const map = new Map<K, T>();
  items.forEach((item) => {
    const key = getKey(item);
    if (!key || map.has(key)) return;
    map.set(key, item);
  });
  return Array.from(map.values());
};

export default async function DesignPreviewPage({ params, searchParams }: PageProps) {
  const { channel } = await params;
  const dir = searchParams?.dir === "rtl" ? "rtl" : "ltr";

  const [newestData, topRatedData] = await Promise.all([
    executeGraphQL(ProductsNewestDocument, {
      variables: { channel, first: 10 },
      revalidate: 60,
    }),
    executeGraphQL(ProductsTopRatedDocument, {
      variables: { channel, first: 10 },
      revalidate: 60,
    }),
  ]);

  const newestProducts = (newestData.products?.edges ?? [])
    .map((edge) => edge?.node)
    .filter((node): node is ProductListItemFragment => Boolean(node));
  const topRatedProducts = (topRatedData.products?.edges ?? [])
    .map((edge) => edge?.node)
    .filter((node): node is ProductListItemFragment => Boolean(node));
  const allProducts = newestProducts.length ? newestProducts : topRatedProducts;

  const heroProduct = allProducts[0] ?? null;
  const heroImage = getProductImage(heroProduct);

  const categoryCards = uniqueBy(
    allProducts.filter((product) => product.category?.id),
    (product) => product.category?.id,
  )
    .slice(0, 3)
    .map((product) => ({
      title: product.category?.name ?? "Category",
      subtitle: product.category?.slug?.replace(/-/g, " ") ?? "Performance gear",
      image: getProductImage(product),
      alt: getProductAlt(product),
    }));

  const collectionCards = uniqueBy(
    allProducts.flatMap((product) => product.collections || []),
    (collection) => collection.id,
  ).slice(0, 6);

  const marqueeItems = [
    ...categoryCards.map((category) => category.title),
    ...collectionCards.map((collection) => collection.name),
  ].filter(Boolean);

  return (
    <div className="relative w-full overflow-hidden bg-white text-neutral-900" dir={dir}>
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="aurora-layer" />
        <div className="grid-lines" />
        <div className="float-orb orb-1" />
        <div className="float-orb orb-2" />
        <div className="float-orb orb-3" />
      </div>

      <section className="relative overflow-hidden border-b border-neutral-200">
        <div className="absolute inset-0 hero-aurora" />
        <div className="absolute inset-0 hero-lines" />
        <div className="mx-auto flex max-w-[1440px] flex-col gap-12 px-6 py-16 lg:flex-row lg:items-center lg:gap-16 lg:px-12">
          <div className="flex-1">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/70 px-4 py-1 text-xs font-semibold uppercase tracking-wider">
              Performance Drop
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: palette.accent }} />
              2026
            </div>
            <h1 className="text-4xl font-bold leading-tight text-neutral-900 md:text-5xl lg:text-6xl">
              Built for speed. Tuned for control.
            </h1>
            <p className="mt-4 max-w-xl text-base text-neutral-600 md:text-lg">
              Precision footwear and training gear engineered for athletes who demand consistency,
              responsiveness, and confidence in every stride.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                className="rounded-xl px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/30"
                style={{ backgroundColor: palette.primary }}
                type="button"
              >
                Shop New Arrivals
              </button>
              <button
                className="rounded-xl border border-neutral-300 bg-white/80 px-6 py-3 text-sm font-semibold text-neutral-900"
                type="button"
              >
                Explore Performance Gear
              </button>
            </div>
            <div className="mt-8 flex flex-wrap gap-2">
              {(collectionCards.length ? collectionCards : FALLBACK_MARQUEE).slice(0, 6).map((item) => (
                <span
                  key={typeof item === "string" ? item : item.id}
                  className="rounded-full border border-white/40 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-neutral-700"
                >
                  {typeof item === "string" ? item : item.name}
                </span>
              ))}
            </div>
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {[
                { label: "Weight", value: "240g" },
                { label: "Grip", value: "Tri-Flex" },
                { label: "Material", value: "Carbon Mesh" },
              ].map((item) => (
                <div key={item.label} className="rounded-xl border border-white/40 bg-white/80 px-4 py-3 shadow-sm">
                  <div className="text-xs font-semibold uppercase tracking-wider text-neutral-500">{item.label}</div>
                  <div className="mt-1 text-lg font-semibold text-neutral-900">{item.value}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex-1">
            <div className="relative mx-auto h-[440px] w-full max-w-[520px] overflow-hidden rounded-[32px] border border-white/40 bg-white/90 shadow-2xl">
              <div className="absolute inset-0 hero-card-glow" />
              <div className="absolute inset-6 rounded-2xl border border-neutral-200 bg-white shadow-sm">
                <div className="flex h-full flex-col justify-between p-6">
                  <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-neutral-500">
                    <span>{heroProduct?.name ?? "Velocity Trainer X"}</span>
                    <span className="rounded-full bg-neutral-900 px-3 py-1 text-white">
                      {heroProduct ? getProductBadge(heroProduct) : "Launch"}
                    </span>
                  </div>
                  <div className="relative flex h-full items-center justify-center">
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-neutral-100 to-neutral-50" />
                    {heroImage ? (
                      <Image
                        src={heroImage}
                        alt={getProductAlt(heroProduct)}
                        fill
                        className="object-contain p-8"
                        sizes="520px"
                        priority
                      />
                    ) : (
                      <div className="h-48 w-72 rounded-[32px] bg-gradient-to-br from-neutral-200 to-neutral-50 shadow-lg" />
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs uppercase tracking-wider text-neutral-500">Starting at</div>
                      <div className="text-2xl font-bold text-neutral-900">
                        {heroProduct?.pricing?.priceRange?.start?.gross
                          ? formatMoney(
                              heroProduct.pricing.priceRange.start.gross.amount,
                              heroProduct.pricing.priceRange.start.gross.currency,
                            )
                          : "$129"}
                      </div>
                    </div>
                    {heroProduct ? (
                      <Link
                        className="rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white"
                        style={{ backgroundColor: palette.primaryDark }}
                        href={`/${encodeURIComponent(channel)}/products/${heroProduct.slug}`}
                      >
                        View Product
                      </Link>
                    ) : (
                      <button
                        className="rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white"
                        style={{ backgroundColor: palette.primaryDark }}
                        type="button"
                      >
                        Preorder
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="relative border-b border-neutral-200 bg-white/80 py-6">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-12">
          <div className="marquee">
            <div className="marquee-track">
              {(marqueeItems.length ? marqueeItems : FALLBACK_MARQUEE).map((item, index) => (
                <span
                  key={`${item}-${index}`}
                  className="rounded-full border border-neutral-200 bg-white px-6 py-2 text-xs font-semibold uppercase tracking-wider text-neutral-600"
                >
                  {item}
                </span>
              ))}
              {(marqueeItems.length ? marqueeItems : FALLBACK_MARQUEE).map((item, index) => (
                <span
                  key={`${item}-dup-${index}`}
                  className="rounded-full border border-neutral-200 bg-white px-6 py-2 text-xs font-semibold uppercase tracking-wider text-neutral-600"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="relative bg-white">
        <div className="absolute inset-0 section-aurora" />
        <div className="mx-auto max-w-[1400px] px-6 py-14 lg:px-12">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-neutral-900">New Arrivals</h2>
              <p className="mt-1 text-sm text-neutral-500">Engineered for speed, tuned for comfort.</p>
            </div>
            <button className="text-sm font-semibold text-neutral-900 underline" type="button">
              View all
            </button>
          </div>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {(newestProducts.length ? newestProducts : topRatedProducts).slice(0, 8).map((product) => {
              const badge = getProductBadge(product);
              const image = getProductImage(product);
              const priceRange = formatMoneyRange({
                start: product.pricing?.priceRange?.start?.gross,
                stop: product.pricing?.priceRange?.stop?.gross,
              });
              const originalRange = formatMoneyRange({
                start: product.pricing?.priceRangeUndiscounted?.start?.gross,
                stop: product.pricing?.priceRangeUndiscounted?.stop?.gross,
              });
              const hasDiscount = priceRange && originalRange && priceRange !== originalRange;
              return (
                <Link
                  key={product.id}
                  href={`/${encodeURIComponent(channel)}/products/${product.slug}`}
                  className="group rounded-2xl border border-neutral-200 bg-white/90 p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="relative h-48 overflow-hidden rounded-xl bg-gradient-to-br from-neutral-100 to-neutral-50">
                    <span
                      className="absolute start-3 top-3 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white"
                      style={{
                        backgroundColor:
                          badge === "Sale" ? palette.accent : badge === "Featured" ? palette.ink : palette.primary,
                      }}
                    >
                      {badge}
                    </span>
                    {image && (
                      <Image
                        src={image}
                        alt={getProductAlt(product)}
                        fill
                        className="object-cover transition duration-500 group-hover:scale-105"
                        sizes="320px"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent" />
                  </div>
                  <div className="mt-4">
                    <div className="text-sm font-semibold text-neutral-900">{product.name}</div>
                    <div className="mt-1 text-xs uppercase tracking-wider text-neutral-500">
                      {product.category?.name ?? "Performance"}
                    </div>
                    <div className="mt-2 flex items-center gap-2 text-sm">
                      <span className="font-bold text-neutral-900">{priceRange || "N/A"}</span>
                      {hasDiscount && <span className="text-neutral-400 line-through">{originalRange}</span>}
                    </div>
                    <button
                      className="mt-4 w-full rounded-xl border border-neutral-200 py-2 text-xs font-semibold uppercase tracking-wider text-neutral-900 transition group-hover:border-neutral-300"
                      type="button"
                    >
                      Quick View
                    </button>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
      <section className="relative border-t border-neutral-200 bg-white">
        <div className="absolute inset-0 mosaic-aurora" />
        <div className="mx-auto max-w-[1400px] px-6 py-14 lg:px-12">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-neutral-900">Performance Mosaic</h2>
              <p className="mt-1 text-sm text-neutral-500">Signature drops curated from live products.</p>
            </div>
            <button className="text-sm font-semibold text-neutral-900 underline" type="button">
              Explore
            </button>
          </div>
          <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_1fr]">
            <div className="grid gap-6 sm:grid-cols-2">
              {topRatedProducts.slice(0, 4).map((product) => {
                const image = getProductImage(product);
                return (
                  <Link
                    key={product.id}
                    href={`/${encodeURIComponent(channel)}/products/${product.slug}`}
                    className="group relative h-64 overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-lg"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-neutral-100 to-neutral-50" />
                    {image && (
                      <Image
                        src={image}
                        alt={getProductAlt(product)}
                        fill
                        className="object-cover transition duration-700 group-hover:scale-110"
                        sizes="420px"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                    <div className="absolute bottom-4 start-4 text-white">
                      <div className="text-sm uppercase tracking-wider text-white/80">
                        {product.category?.name ?? "Performance"}
                      </div>
                      <div className="text-lg font-semibold">{product.name}</div>
                    </div>
                  </Link>
                );
              })}
            </div>
            <div className="relative min-h-[540px] overflow-hidden rounded-[36px] border border-neutral-200 bg-white shadow-xl">
              <div className="absolute inset-0 bg-gradient-to-br from-neutral-100 via-white to-neutral-50" />
              {heroImage && (
                <Image
                  src={heroImage}
                  alt={getProductAlt(heroProduct)}
                  fill
                  className="object-contain p-10"
                  sizes="560px"
                />
              )}
              <div className="absolute bottom-8 start-8 rounded-2xl border border-white/40 bg-white/80 px-6 py-4 shadow-lg">
                <div className="text-xs uppercase tracking-wider text-neutral-500">Featured drop</div>
                <div className="text-lg font-semibold text-neutral-900">{heroProduct?.name ?? "Velocity Trainer X"}</div>
                <div className="mt-2 text-sm font-semibold text-neutral-700">
                  {heroProduct?.pricing?.priceRange?.start?.gross
                    ? formatMoney(
                        heroProduct.pricing.priceRange.start.gross.amount,
                        heroProduct.pricing.priceRange.start.gross.currency,
                      )
                    : "$129"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-neutral-200 bg-white">
        <div className="mx-auto max-w-[1400px] px-6 py-12 lg:px-12">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-neutral-900">Shop by Category</h2>
            <div className="flex gap-3">
              <button
                className="rounded-xl border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-900"
                type="button"
              >
                View All Categories
              </button>
              <button
                className="rounded-xl px-4 py-2 text-sm font-semibold text-white"
                style={{ backgroundColor: palette.primary }}
                type="button"
              >
                Shop Collection
              </button>
            </div>
          </div>
          <div className="mt-6 grid gap-6 md:grid-cols-3">
            {(categoryCards.length
              ? categoryCards
              : [
                  { title: "Training Shoes", subtitle: "Stability and power" },
                  { title: "Running", subtitle: "Lightweight speed" },
                  { title: "Outdoor", subtitle: "Grip and durability" },
                ]
            ).map((category) => (
              <div key={category.title} className="relative h-64 overflow-hidden rounded-2xl border border-neutral-200">
                <div className="absolute inset-0 bg-gradient-to-br from-neutral-200 to-neutral-50" />
                {"image" in category && category.image && (
                  <Image
                    src={category.image}
                    alt={category.alt ?? category.title}
                    fill
                    className="object-cover"
                    sizes="420px"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-4 start-4 text-white">
                  <div className="text-lg font-semibold">{category.title}</div>
                  <div className="text-sm text-white/80">{category.subtitle}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section
        className="relative border-t border-neutral-200"
        style={{
          background:
            "linear-gradient(135deg, rgba(27,91,255,0.12) 0%, rgba(108,124,255,0.08) 50%, rgba(255,107,44,0.12) 100%)",
        }}
      >
        <div className="absolute inset-0 promo-sheen" />
        <div className="mx-auto flex max-w-[1400px] flex-col items-start justify-between gap-6 px-6 py-12 lg:flex-row lg:items-center lg:px-12">
          <div>
            <div className="text-sm font-semibold uppercase tracking-wider text-neutral-600">Performance Week</div>
            <div className="mt-2 text-3xl font-bold text-neutral-900">Up to 40% off training essentials</div>
          </div>
          <button
            className="rounded-xl px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/30"
            style={{ backgroundColor: palette.primary }}
            type="button"
          >
            Shop the Drop
          </button>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-[1400px] px-6 py-12 lg:px-12">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-neutral-900">Top Rated</h2>
              <p className="mt-1 text-sm text-neutral-500">Athlete-approved performance picks.</p>
            </div>
            <button className="text-sm font-semibold text-neutral-900 underline" type="button">
              View all
            </button>
          </div>
          <div className="mt-6 flex gap-6 overflow-x-auto pb-4">
            {topRatedProducts.slice(0, 6).map((product) => {
              const image = getProductImage(product);
              return (
                <Link
                  key={product.id}
                  href={`/${encodeURIComponent(channel)}/products/${product.slug}`}
                  className="group min-w-[240px] rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="relative h-44 overflow-hidden rounded-xl bg-gradient-to-br from-neutral-100 to-neutral-50">
                    {image && (
                      <Image
                        src={image}
                        alt={getProductAlt(product)}
                        fill
                        className="object-cover transition duration-500 group-hover:scale-105"
                        sizes="240px"
                      />
                    )}
                  </div>
                  <div className="mt-3 text-sm font-semibold text-neutral-900">{product.name}</div>
                  <div className="mt-1 text-xs uppercase tracking-wider text-neutral-500">
                    {product.category?.name ?? "Performance"}
                  </div>
                  <div className="mt-2 text-sm font-semibold text-neutral-900">
                    {formatMoneyRange({
                      start: product.pricing?.priceRange?.start?.gross,
                      stop: product.pricing?.priceRange?.stop?.gross,
                    }) || "N/A"}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-[1400px] px-6 py-12 lg:px-12">
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { title: "Endurance Lab", desc: "Gear tested by pro athletes in real conditions." },
              { title: "Recovery Tech", desc: "Post-training essentials that accelerate recovery." },
              { title: "Studio Essentials", desc: "Precision fits for controlled movement." },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
                <div className="text-lg font-semibold text-neutral-900">{item.title}</div>
                <div className="mt-2 text-sm text-neutral-500">{item.desc}</div>
                <button className="mt-6 text-sm font-semibold text-neutral-900 underline" type="button">
                  Learn more
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-neutral-200 bg-white">
        <div className="mx-auto max-w-[1400px] px-6 py-10 lg:px-12">
          <div className="text-sm font-semibold uppercase tracking-wider text-neutral-500">Trusted by</div>
          <div className="mt-4 grid grid-cols-2 gap-4 text-sm font-semibold text-neutral-500 sm:grid-cols-3 lg:grid-cols-6">
            {["Strides", "AeroLab", "Pulse", "Nova", "SprintX", "Core"].map((brand) => (
              <div key={brand} className="rounded-xl border border-neutral-200 bg-white px-4 py-3 text-center">
                {brand}
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="bg-white">
        <div className="mx-auto max-w-[1400px] px-6 py-12 lg:px-12">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-neutral-900">Shop by Sport</h2>
            <button className="text-sm font-semibold text-neutral-900 underline" type="button">
              View all
            </button>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(collectionCards.length
              ? collectionCards.map((collection) => collection.name)
              : ["Running", "Training", "Basketball", "Soccer", "Tennis", "Yoga"]
            ).map((sport) => (
              <div key={sport} className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
                <div className="text-lg font-semibold text-neutral-900">{sport}</div>
                <div className="mt-1 text-sm text-neutral-500">Performance gear curated for {sport.toLowerCase()}.</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-neutral-200 bg-white">
        <div className="mx-auto max-w-[1400px] px-6 py-12 lg:px-12">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-neutral-900">Athlete Community</h2>
            <button className="text-sm font-semibold text-neutral-900 underline" type="button">
              Follow us
            </button>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {allProducts.slice(0, 6).map((product) => {
              const image = getProductImage(product);
              return (
                <div
                  key={product.id}
                  className="relative aspect-square overflow-hidden rounded-2xl border border-neutral-200 bg-gradient-to-br from-neutral-100 to-neutral-50"
                >
                  {image && (
                    <Image src={image} alt={getProductAlt(product)} fill className="object-cover" sizes="200px" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-t border-neutral-200 bg-neutral-900 text-white">
        <div className="mx-auto flex max-w-[1400px] flex-col items-start justify-between gap-6 px-6 py-12 lg:flex-row lg:items-center lg:px-12">
          <div>
            <div className="text-sm font-semibold uppercase tracking-wider text-white/60">Stay ahead</div>
            <div className="mt-2 text-2xl font-bold">Get launch alerts and training drops</div>
          </div>
          <div className="flex w-full max-w-md flex-col gap-3 sm:flex-row">
            <input
              className="w-full rounded-xl border border-white/30 bg-white/10 px-4 py-3 text-sm text-white placeholder-white/60"
              placeholder="Enter your email"
              type="email"
            />
            <button
              className="rounded-xl px-6 py-3 text-sm font-semibold text-neutral-900"
              style={{ backgroundColor: palette.lime }}
              type="button"
            >
              Join
            </button>
          </div>
        </div>
      </section>

      <DesignStyles />

    </div>
  );
}
