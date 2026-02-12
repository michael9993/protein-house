import { getLanguageCodeForChannel } from "@/lib/language";

export interface Color {
  id: string;
  name: string;
  slug: string;
  productCount?: number;
}

export async function fetchColorsForQuickFilters(channel: string): Promise<{
  colors: Color[];
  attributeSlug: string | null;
}> {
  try {
    const apiUrl = process.env.SALEOR_API_URL || process.env.NEXT_PUBLIC_SALEOR_API_URL;
    if (!apiUrl) return { colors: [], attributeSlug: null };

    // Query variants directly - much faster than querying all products
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
      console.error("[Colors Filter] HTTP error:", response.status, response.statusText);
      return { colors: [], attributeSlug: null };
    }

    const responseData = (await response.json()) as { data?: any; errors?: any[] };
    
    if (responseData.errors) {
      console.error("[Colors Filter] GraphQL errors:", responseData.errors);
      return { colors: [], attributeSlug: null };
    }
    
    const { data } = responseData;
    
    if (!data?.productVariants?.edges) {
      return { colors: [], attributeSlug: null };
    }

    const colorsMap = new Map<string, { id: string; name: string; slug: string; count: number }>();
    let detectedAttributeSlug: string | null = null;

    data.productVariants.edges.forEach((edge: any) => {
      const variant = edge.node;
      if (variant.attributes) {
        variant.attributes.forEach((attr: any) => {
          const attrName = attr?.attribute?.name?.trim().toLowerCase();
          const attrSlug = attr?.attribute?.slug?.trim().toLowerCase();
          // Look for color-related attributes
          if (attrName === "color" || attrName === "colour" || attrSlug === "color" || attrSlug === "colour") {
            // Detect the attribute slug
            if (!detectedAttributeSlug && attr.attribute?.slug) {
              detectedAttributeSlug = attr.attribute.slug;
            }
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

    console.log(`[Colors Filter] Extraction complete. Colors map size: ${colorsMap.size}, Attribute slug: ${detectedAttributeSlug}`);
    
    return {
      colors: Array.from(colorsMap.values())
        .map((color) => ({
          id: color.id,
          name: color.name,
          slug: color.slug,
          productCount: color.count,
        }))
        .sort((a, b) => a.name.localeCompare(b.name)), // Sort alphabetically
      attributeSlug: detectedAttributeSlug || "color", // Default to "color" if not detected
    };
  } catch (error) {
    console.error("[Colors Filter] Failed to fetch colors:", error);
    return { colors: [], attributeSlug: null };
  }
}

