import { redirect } from "next/navigation";
import { type ResolvingMetadata, type Metadata } from "next";
import { ProductListByCategoryDocument } from "@/gql/graphql";
import { executeGraphQL } from "@/lib/graphql";
import { getLanguageCodeForChannel } from "@/lib/language";
import { storeConfig } from "@/config";

/**
 * Category Page - Redirects to unified /products page
 * 
 * This page now redirects to /products?categories=[slug] to maintain
 * a single canonical products listing with consistent filtering.
 * 
 * SEO metadata is still generated for the redirect to maintain
 * search engine compatibility.
 */

export const generateMetadata = async (
  props: { params: Promise<{ slug: string; channel: string }> },
  _parent: ResolvingMetadata,
): Promise<Metadata> => {
  const params = await props.params;
  const languageCode = getLanguageCodeForChannel(params.channel);
  const { category } = await executeGraphQL(ProductListByCategoryDocument, {
    variables: { slug: params.slug, channel: params.channel, first: 1, languageCode },
    revalidate: 60,
  });

  const translatedName = category?.translation?.name || category?.name;
  return {
    title: translatedName || "Category",
    description: category?.translation?.seoDescription || category?.seoDescription || category?.translation?.description || category?.description || `Shop ${translatedName} at ${storeConfig.store.name}`,
    // Add canonical URL pointing to the unified products page
    alternates: {
      canonical: `/${params.channel}/products?categories=${params.slug}`,
    },
  };
};

export default async function Page(props: { 
  params: Promise<{ slug: string; channel: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [params, searchParams] = await Promise.all([props.params, props.searchParams]);
  
  // Build redirect URL with all existing search params + category filter
  const redirectParams = new URLSearchParams();
  
  // Preserve existing search params
  Object.entries(searchParams).forEach(([key, value]) => {
    if (value !== undefined) {
      redirectParams.set(key, Array.isArray(value) ? value[0] : value);
    }
  });
  
  // Add category filter
  redirectParams.set("categories", params.slug);
  
  // Redirect to unified products page
  redirect(`/${params.channel}/products?${redirectParams.toString()}`);
}
