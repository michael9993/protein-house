"use client";

/**
 * ProductFiltersWrapper
 * 
 * Fetches filter data (categories, collections, brands) on the client side
 * and passes them to the ProductFilters component.
 * 
 * This fetches ALL available options, not filtered ones, so users can
 * always see the full range of filter choices.
 */

import { useState, useEffect } from "react";
import { getLanguageCodeForChannel } from "@/lib/language";
import { ProductFilters, MobileFilterDrawer, type Category, type Collection, type Brand, type Size, type Color } from "@/ui/components/Filters/ProductFilters";
import { useProductFilters } from "@/hooks/useProductFilters";
import { useFiltersText, useBranding } from "@/providers/StoreConfigProvider";
import { deriveBrandSlug } from "@/components/home/utils";

// Re-export types for convenience
export type { Category, Collection, Brand };

interface ProductFiltersWrapperProps {
  channel: string;
  mobileOnly?: boolean;
  // Optional server-provided data (for SSR optimization)
  initialCategories?: Category[];
  initialCollections?: Collection[];
  initialBrands?: Brand[];
  initialSizes?: Size[];
  initialColors?: Color[];
  minPrice?: number;
  maxPrice?: number;
  currencyCode?: string;
}

export function ProductFiltersWrapper({ 
  channel, 
  mobileOnly = false,
  initialCategories,
  initialCollections,
  initialBrands,
  initialSizes,
  initialColors,
  minPrice,
  maxPrice,
  currencyCode,
}: ProductFiltersWrapperProps) {
  const branding = useBranding();
  const filtersText = useFiltersText();
  const { filterCount } = useProductFilters();
  
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>(initialCategories || []);
  const [collections, setCollections] = useState<Collection[]>(initialCollections || []);
  const [brands, setBrands] = useState<Brand[]>(initialBrands || []);
  const [sizes, setSizes] = useState<Size[]>(initialSizes || []);
  const [colors, setColors] = useState<Color[]>(initialColors || []);
  const [loading, setLoading] = useState(
    !initialCategories || !initialCollections || !initialBrands || !initialSizes || !initialColors
  );

  console.log("[Brands Filter] Component initialized with:", {
    initialBrands: initialBrands?.length || 0,
    brands: brands.length,
    initialSizes: initialSizes?.length || 0,
    sizes: sizes.length,
    loading
  });

  // Fetch ALL filter data (not filtered by current selection)
  useEffect(() => {
    // If we have initial data, use it and only fetch what's missing
    if (initialCategories && initialCollections && initialBrands && initialSizes && initialColors) {
      console.log("[Brands Filter] Using initial data, skipping fetch");
      setLoading(false);
      return;
    }
    
    const fetchFilterData = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_SALEOR_API_URL;
        if (!apiUrl) {
          console.warn("NEXT_PUBLIC_SALEOR_API_URL not set");
          setLoading(false);
          return;
        }

        // Fetch only what's missing, use initial data if available
        const [categoriesData, collectionsData, brandsData, sizesData, colorsData] = await Promise.all([
          initialCategories ? Promise.resolve(initialCategories) : fetchCategories(apiUrl, channel),
          initialCollections ? Promise.resolve(initialCollections) : fetchCollections(apiUrl, channel),
          initialBrands && initialBrands.length > 0 ? Promise.resolve(initialBrands) : fetchBrands(apiUrl, channel),
          initialSizes && initialSizes.length > 0 ? Promise.resolve(initialSizes) : fetchSizes(apiUrl, channel),
          initialColors && initialColors.length > 0 ? Promise.resolve(initialColors) : fetchColors(apiUrl, channel),
        ]);

        setCategories(categoriesData);
        setCollections(collectionsData);
        setBrands(brandsData);
        setSizes(sizesData);
        setColors(colorsData);
        console.log("[Brands Filter] Final brands state:", brandsData.length, brandsData.map(b => b.name));
        console.log("[Sizes Filter] Final sizes state:", sizesData.length, sizesData.map(s => s.name));
        console.log("[Colors Filter] Final colors state:", colorsData.length, colorsData.map(c => c.name));
      } catch (error) {
        console.error("Failed to fetch filter data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFilterData();
  }, [channel, initialCategories, initialCollections, initialBrands, initialSizes, initialColors]);

  // Mobile-only: just render the button
  if (mobileOnly) {
    return (
      <>
        <button
          type="button"
          onClick={() => setMobileFiltersOpen(true)}
          className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 lg:hidden"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          {filtersText.filtersButtonText}
          {filterCount > 0 && (
            <span 
              className="flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold text-white"
              style={{ backgroundColor: branding.colors.primary }}
            >
              {filterCount}
            </span>
          )}
        </button>

        <MobileFilterDrawer 
          isOpen={mobileFiltersOpen} 
          onClose={() => setMobileFiltersOpen(false)}
        >
          <ProductFilters 
            categories={categories}
            collections={collections}
            brands={brands}
            sizes={sizes}
            colors={colors}
            channel={channel}
            minPrice={minPrice}
            maxPrice={maxPrice}
            currencyCode={currencyCode}
          />
        </MobileFilterDrawer>
      </>
    );
  }

  // Desktop sidebar
  if (loading) {
    return (
      <div className="rounded-lg bg-white p-4 shadow-sm">
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-20 rounded bg-neutral-200" />
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-4 w-4 rounded bg-neutral-200" />
                <div className="h-4 w-24 rounded bg-neutral-200" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <ProductFilters 
        categories={categories}
        collections={collections}
        brands={brands}
        sizes={sizes}
        colors={colors}
        channel={channel}
        minPrice={minPrice}
        maxPrice={maxPrice}
        currencyCode={currencyCode}
      />
    </div>
  );
}

// ============================================================================
// Data Fetching Functions
// ============================================================================

async function fetchCategories(apiUrl: string, channel: string): Promise<Category[]> {
  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: `
          query CategoriesForFilter($channel: String!, $languageCode: LanguageCodeEnum!) {
            categories(first: 100, level: 0) {
              edges {
                node {
                  id
                  name
                  translation(languageCode: $languageCode) { name }
                  slug
                  products(first: 1, channel: $channel) {
                    totalCount
                  }
                  children(first: 50) {
                    edges {
                      node {
                        id
                        name
                        translation(languageCode: $languageCode) { name }
                        slug
                        products(first: 1, channel: $channel) {
                          totalCount
                        }
                        children(first: 20) {
                          edges {
                            node {
                              id
                              name
                              translation(languageCode: $languageCode) { name }
                              slug
                              products(first: 1, channel: $channel) {
                                totalCount
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        `,
        variables: { channel, languageCode: getLanguageCodeForChannel(channel) },
      }),
    });

    const { data } = await response.json() as { data?: { categories?: { edges?: any[] } } };
    if (!data?.categories?.edges) return [];

    // Build category tree from API response (3 levels: root → L1 → L2, aligned with nav)
    function mapNode(node: any): Category {
      const category: Category = {
        id: node.id,
        name: node.translation?.name || node.name,
        slug: node.slug,
        productCount: node.products?.totalCount || 0,
        children: [],
      };
      if (node.children?.edges?.length > 0) {
        category.children = node.children.edges.map((childEdge: any) => mapNode(childEdge.node));
      }
      return category;
    }

    return data.categories.edges.map((edge: any) => mapNode(edge.node));
  } catch (error) {
    console.warn("Failed to fetch categories:", error);
    return [];
  }
}

async function fetchCollections(apiUrl: string, channel: string): Promise<Collection[]> {
  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: `
          query CollectionsForFilter($channel: String!, $languageCode: LanguageCodeEnum!) {
            collections(channel: $channel, first: 50) {
              edges {
                node {
                  id
                  name
                  translation(languageCode: $languageCode) { name }
                  slug
                  products(first: 1) {
                    totalCount
                  }
                }
              }
            }
          }
        `,
        variables: { channel, languageCode: getLanguageCodeForChannel(channel) },
      }),
    });

    const { data } = await response.json() as { data?: { collections?: { edges?: any[] } } };
    if (!data?.collections?.edges) return [];

    return data.collections.edges
      .map((edge: any) => ({
        id: edge.node.id,
        name: edge.node.translation?.name || edge.node.name,
        slug: edge.node.slug,
        productCount: edge.node.products?.totalCount || 0,
      }))
      .filter((c: Collection) => (c.productCount ?? 0) > 0);
  } catch (error) {
    console.warn("Failed to fetch collections:", error);
    return [];
  }
}

async function fetchBrands(apiUrl: string, channel: string): Promise<Brand[]> {
  try {
    // Query products with brand field to extract unique brands
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: `
          query ProductsForBrands($channel: String!, $languageCode: LanguageCodeEnum!) {
            products(first: 100, channel: $channel) {
              edges {
                cursor
                node {
                  name
                  channel
                  attributes {
                    values {
                      name
                      translation(languageCode: $languageCode) { name }
                      value
                    }
                    attribute {
                      name
                    }
                  }
                }
              }
            }
          }
        `,
        variables: { channel, languageCode: getLanguageCodeForChannel(channel) },
      }),
    });

    const { data, errors } = await response.json() as { data?: any; errors?: any[] };
    
    // Check if there are GraphQL errors (e.g., brand field doesn't exist)
    if (errors && errors.length > 0) {
      // If brand field doesn't exist, fall back to attributes
      const hasBrandFieldError = errors.some((err: any) => 
        err.message?.includes('brand') || 
        err.message?.includes('Cannot query field')
      );
      if (hasBrandFieldError) {
        return await fetchBrandsFromAttributes(apiUrl, channel);
      }
    }
    
    // If products have brand field, extract unique brands
    if (data?.products?.edges && !errors) {
      const brandsMap = new Map<string, { id: string; name: string; slug: string; count: number }>();

      data.products.edges.forEach((edge: any) => {
        const product = edge.node;
        if (product.brand) {
          const brand = product.brand;
          const brandId = brand.id;
          
          if (!brandsMap.has(brandId)) {
            brandsMap.set(brandId, {
              id: brand.id,
              name: brand.name,
              slug: brand.slug || brand.id,
              count: 0,
            });
          }
          brandsMap.get(brandId)!.count++;
        }
      });

      // Convert to array and sort by product count
      return Array.from(brandsMap.values())
        .map((brand) => ({
          id: brand.id,
          name: brand.name,
          slug: brand.slug,
          productCount: brand.count,
        }))
        .sort((a, b) => (b.productCount || 0) - (a.productCount || 0));
    }

    // Fallback: extract from product attributes (legacy approach)
    return await fetchBrandsFromAttributes(apiUrl, channel);
  } catch (error) {
    console.warn("Failed to fetch brands from product.brand field, trying attributes:", error);
    // Fallback to attribute-based approach
    return await fetchBrandsFromAttributes(apiUrl, channel);
  }
}

/**
 * Fallback: Extract brands from product attributes
 */
async function fetchBrandsFromAttributes(apiUrl: string, channel: string): Promise<Brand[]> {
  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: `
          query ProductsForBrands($channel: String!, $languageCode: LanguageCodeEnum!) {
            products(first: 100, channel: $channel) {
              edges {
                cursor
                node {
                  id
                  name
                  attributes {
                    attribute {
                      id
                      name
                      slug
                    }
                    values {
                      id
                      name
                      slug
                      translation(languageCode: $languageCode) { name }
                    }
                  }
                }
              }
            }
          }
        `,
        variables: { channel, languageCode: getLanguageCodeForChannel(channel) },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Brands Filter] HTTP error:", response.status, response.statusText, errorText);
      return [];
    }

    const responseData = await response.json() as any;
    console.log("[Brands Filter] Full response:", JSON.stringify(responseData, null, 2));
    
    if (responseData.errors) {
      console.error("[Brands Filter] GraphQL errors:", responseData.errors);
      return [];
    }
    
    const { data } = responseData;
    console.log("[Brands Filter] Attributes query data:", JSON.stringify(data, null, 2));
    
    if (!data) {
      console.warn("[Brands Filter] No data in response");
      return [];
    }
    
    if (!data.products) {
      console.warn("[Brands Filter] No products field in data");
      return [];
    }
    
    if (!data.products.edges || data.products.edges.length === 0) {
      console.warn("[Brands Filter] No products found in response (empty edges array)");
      return [];
    }

    console.log(`[Brands Filter] Processing ${data.products.edges.length} products for brand extraction`);

    // Extract unique brands from products
    const brandsMap = new Map<string, { name: string; slug: string; count: number }>();

    data.products.edges.forEach((edge: any, index: number) => {
      const product = edge.node;
      if (!product.attributes || !Array.isArray(product.attributes)) {
        if (index < 3) console.log(`[Brands Filter] Product ${index}: No attributes`, product.name);
        return;
      }

      if (index < 3) {
        console.log(`[Brands Filter] Product ${index} (${product.name}) attributes:`, product.attributes.map((a: any) => ({
          attrName: a.attribute?.name,
          attrSlug: a.attribute?.slug,
          values: a.values?.map((v: any) => ({ name: v.name, slug: v.slug }))
        })));
      }

      const brandAttr = product.attributes.find((attr: any) => {
        const attrName = attr?.attribute?.name?.toLowerCase()?.trim();
        const attrSlug = attr?.attribute?.slug?.toLowerCase()?.trim();
        return attrName === "brand" || attrSlug === "brand" || attrSlug === "manufacturer";
      });

      if (brandAttr && index < 3) {
        console.log(`[Brands Filter] Product ${index}: Found brand attribute:`, brandAttr);
      }

      // Handle all brand values (some products might have multiple brand values)
      const brandValues = brandAttr?.values || [];
      if (brandValues.length > 0) {
        brandValues.forEach((value: any) => {
          const brandName = value?.translation?.name || value?.name || value?.value;
          if (brandName && typeof brandName === 'string' && brandName.trim()) {
            // Dedup by normalized name (not slug) to handle Saleor auto-incremented slugs
            const dedupKey = brandName.toLowerCase().trim();
            // Always derive slug from name for human-readable URLs
            const brandSlug = deriveBrandSlug(brandName);

            if (dedupKey) {
              if (!brandsMap.has(dedupKey)) {
                brandsMap.set(dedupKey, { name: brandName.trim(), slug: brandSlug, count: 0 });
                console.log(`[Brands Filter] Added new brand: ${brandName} (slug: ${brandSlug})`);
              }
              brandsMap.get(dedupKey)!.count++;
            } else {
              console.warn(`[Brands Filter] Skipping brand with no slug:`, value);
            }
          } else {
            console.warn(`[Brands Filter] Skipping invalid brand value:`, value);
          }
        });
      } else if (brandAttr && index < 3) {
        console.log(`[Brands Filter] Product ${index}: Brand attribute found but no values`);
      }
    });

    // Convert to array and sort by product count
    const brands = Array.from(brandsMap.values())
      .map((brand) => ({
        id: `brand-${brand.slug}`,
        name: brand.name,
        slug: brand.slug,
        productCount: brand.count,
      }))
      .sort((a, b) => (b.productCount || 0) - (a.productCount || 0));

    // Debug logging
    console.log(`[Brands Filter] Extraction complete. Brands map size: ${brandsMap.size}`);
    if (brands.length > 0) {
      console.log(`[Brands Filter] ✅ Found ${brands.length} brands:`, brands.map(b => `${b.name} (${b.slug}) - ${b.productCount} products`));
    } else {
      console.warn("[Brands Filter] ❌ No brands found. Products checked:", data.products.edges.length);
      if (data.products.edges.length > 0) {
        console.warn("[Brands Filter] Sample product attributes:", JSON.stringify(data.products.edges[0]?.node?.attributes, null, 2));
      }
    }

    return brands;
  } catch (error) {
    console.error("[Brands Filter] Failed to fetch brands from attributes:", error);
    return [];
  }
}

/**
 * Fetch colors from product variants - much faster than querying products
 */
async function fetchColors(apiUrl: string, channel: string): Promise<Color[]> {
  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: `
          query VariantsForColors($channel: String!, $languageCode: LanguageCodeEnum!) {
            productVariants(first: 100, channel: $channel) {
              edges {
                node {
                  id
                  attributes {
                    attribute {
                      id
                      name
                      slug
                    }
                    values {
                      id
                      name
                      slug
                      translation(languageCode: $languageCode) { name }
                    }
                  }
                }
              }
            }
          }
        `,
        variables: { channel, languageCode: getLanguageCodeForChannel(channel) },
      }),
    });

    if (!response.ok) {
      console.error("[Colors Filter] HTTP error:", response.status, response.statusText);
      return [];
    }

    const responseData = await response.json() as any;
    
    if (responseData.errors) {
      console.error("[Colors Filter] GraphQL errors:", responseData.errors);
      return [];
    }
    
    const { data } = responseData;
    
    if (!data?.productVariants?.edges) {
      return [];
    }

    const colorsMap = new Map<string, { id: string; name: string; slug: string; count: number }>();

    data.productVariants.edges.forEach((edge: any) => {
      const variant = edge.node;
      if (variant.attributes) {
        variant.attributes.forEach((attr: any) => {
          const attrName = attr?.attribute?.name?.trim().toLowerCase();
          const attrSlug = attr?.attribute?.slug?.trim().toLowerCase();
          // Look for color-related attributes
          if (attrName === "color" || attrName === "colour" || attrSlug === "color" || attrSlug === "colour") {
            if (attr.values && attr.values.length > 0) {
              attr.values.forEach((value: any) => {
                const colorId = value.id || value.slug || value.name;
                const colorName = value.translation?.name || value.name;
                const colorSlug = value.slug || value.name.toLowerCase().replace(/\s+/g, "-");
                
                if (!colorsMap.has(colorId)) {
                  colorsMap.set(colorId, {
                    id: colorId,
                    name: colorName,
                    slug: colorSlug,
                    count: 0,
                  });
                }
                colorsMap.get(colorId)!.count++;
              });
            }
          }
        });
      }
    });

    return Array.from(colorsMap.values())
      .map((color) => ({
        id: color.id,
        name: color.name,
        slug: color.slug,
        productCount: color.count,
      }))
      .sort((a, b) => a.name.localeCompare(b.name)); // Sort alphabetically
  } catch (error) {
    console.error("[Colors Filter] Failed to fetch colors:", error);
    return [];
  }
}

/**
 * Fetch sizes from product variants - much faster than querying products
 */
async function fetchSizes(apiUrl: string, channel: string): Promise<Size[]> {
  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: `
          query VariantsForSizes($channel: String!, $languageCode: LanguageCodeEnum!) {
            productVariants(first: 100, channel: $channel) {
              edges {
                node {
                  id
                  attributes {
                    attribute {
                      id
                      name
                      slug
                    }
                    values {
                      id
                      name
                      slug
                      translation(languageCode: $languageCode) { name }
                    }
                  }
                }
              }
            }
          }
        `,
        variables: { channel, languageCode: getLanguageCodeForChannel(channel) },
      }),
    });

    if (!response.ok) {
      console.error("[Sizes Filter] HTTP error:", response.status, response.statusText);
      return [];
    }

    const responseData = await response.json() as any;
    
    if (responseData.errors) {
      console.error("[Sizes Filter] GraphQL errors:", responseData.errors);
      return [];
    }
    
    const { data } = responseData;
    
    if (!data?.productVariants?.edges) {
      return [];
    }

    const sizesMap = new Map<string, { id: string; name: string; slug: string; count: number }>();

    data.productVariants.edges.forEach((edge: any) => {
      const product = edge.node;
      if (product.attributes) {
        product.attributes.forEach((attr: any) => {
          const attrName = attr.attribute?.name?.trim().toLowerCase();
          // Look for size-related attributes
          if (attrName === "size" || attrName === "shoe size" || attrName === "clothing size") {
            if (attr.values && attr.values.length > 0) {
              attr.values.forEach((value: any) => {
                const sizeId = value.id || value.slug || value.name;
                const sizeName = value.translation?.name || value.name;
                const sizeSlug = value.slug || value.name.toLowerCase().replace(/\s+/g, "-");
                
                if (!sizesMap.has(sizeId)) {
                  sizesMap.set(sizeId, {
                    id: sizeId,
                    name: sizeName,
                    slug: sizeSlug,
                    count: 0,
                  });
                }
                sizesMap.get(sizeId)!.count++;
              });
            }
          }
        });
      }
    });

    console.log(`[Sizes Filter] Extraction complete. Sizes map size: ${sizesMap.size}`);
    
    return Array.from(sizesMap.values())
      .map((size) => ({
        id: size.id,
        name: size.name,
        slug: size.slug,
        productCount: size.count,
      }))
      .sort((a, b) => {
        // Sort sizes logically: XS, S, M, L, XL, XXL, then numbers
        const sizeOrder = ["xs", "s", "m", "l", "xl", "xxl", "xxxl"];
        const aLower = a.slug.toLowerCase();
        const bLower = b.slug.toLowerCase();
        const aIndex = sizeOrder.indexOf(aLower);
        const bIndex = sizeOrder.indexOf(bLower);
        
        if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
        if (aIndex !== -1) return -1;
        if (bIndex !== -1) return 1;
        
        // For numeric sizes, sort numerically
        const aNum = parseFloat(aLower);
        const bNum = parseFloat(bLower);
        if (!isNaN(aNum) && !isNaN(bNum)) return aNum - bNum;
        
        // Otherwise, alphabetical
        return aLower.localeCompare(bLower);
      });
  } catch (error) {
    console.error("[Sizes Filter] Failed to fetch sizes from attributes:", error);
    return [];
  }
}
