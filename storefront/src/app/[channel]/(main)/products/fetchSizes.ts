import { getLanguageCodeForChannel } from "@/lib/language";

export interface Size {
  id: string;
  name: string;
  slug: string;
  productCount?: number;
}

export async function fetchSizesForQuickFilters(channel: string): Promise<{ sizes: Size[]; attributeSlug: string | null }> {
  try {
    const apiUrl = process.env.SALEOR_API_URL || process.env.NEXT_PUBLIC_SALEOR_API_URL;
    if (!apiUrl) return { sizes: [], attributeSlug: null };

    // Query variants directly - much faster than querying all products
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
                      translation(languageCode: $languageCode) { name }
                      slug
                    }
                    values {
                      id
                      name
                      translation(languageCode: $languageCode) { name }
                      slug
                    }
                  }
                }
              }
            }
          }
        `,
        variables: { channel, languageCode: getLanguageCodeForChannel(channel) },
      }),
      next: { revalidate: 30 },
    });

    if (!response.ok) {
      console.error("[Sizes Filter] HTTP error:", response.status, response.statusText);
      return { sizes: [], attributeSlug: null };
    }

    const responseData = (await response.json()) as { data?: any; errors?: any[] };
    
    if (responseData.errors) {
      console.error("[Sizes Filter] GraphQL errors:", responseData.errors);
      return { sizes: [], attributeSlug: null };
    }
    
    const { data } = responseData;
    
    if (!data?.productVariants?.edges) {
      return { sizes: [], attributeSlug: null };
    }

    const sizesMap = new Map<string, { id: string; name: string; slug: string; count: number }>();
    let detectedAttributeSlug: string | null = null;

    data.productVariants.edges.forEach((edge: any) => {
      const variant = edge.node;
      if (variant.attributes) {
        variant.attributes.forEach((attr: any) => {
          const attrName = attr?.attribute?.name?.trim().toLowerCase();
          const attrSlug = attr?.attribute?.slug?.trim().toLowerCase();
          // Look for size-related attributes (by name or slug)
          if (attrName === "size" || attrName === "shoe size" || attrName === "clothing size" || attrName === "apparel size"
            || attrSlug === "size" || attrSlug === "shoe-size" || attrSlug === "clothing-size" || attrSlug === "apparel-size") {
            // Detect the attribute slug
            if (!detectedAttributeSlug && attr.attribute?.slug) {
              detectedAttributeSlug = attr.attribute.slug;
            }
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

    return {
      sizes: Array.from(sizesMap.values())
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
      }),
      attributeSlug: detectedAttributeSlug || "size", // Default to "size" if not detected
    };
  } catch (error) {
    console.error("[Sizes Filter] Failed to fetch sizes:", error);
    return { sizes: [], attributeSlug: null };
  }
}
