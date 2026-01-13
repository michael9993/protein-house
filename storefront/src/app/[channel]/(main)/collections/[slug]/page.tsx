import { redirect } from "next/navigation";
import { type ResolvingMetadata, type Metadata } from "next";
import { ProductListByCollectionDocument } from "@/gql/graphql";
import { executeGraphQL } from "@/lib/graphql";
import { storeConfig } from "@/config";

/**
 * Collection Page - Redirects to unified /products page
 * 
 * This page now redirects to /products?collections=[slug] to maintain
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
  const { collection } = await executeGraphQL(ProductListByCollectionDocument, {
    variables: { slug: params.slug, channel: params.channel },
    revalidate: 60,
  });

  return {
    title: `${collection?.name || "Collection"} | ${storeConfig.store.name}`,
    description: collection?.seoDescription || collection?.description || `Shop ${collection?.name} collection at ${storeConfig.store.name}`,
    // Add canonical URL pointing to the unified products page
    alternates: {
      canonical: `/${params.channel}/products?collections=${params.slug}`,
    },
  };
};

export default async function Page(props: { 
  params: Promise<{ slug: string; channel: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [params, searchParams] = await Promise.all([props.params, props.searchParams]);
  
  // Build redirect URL with all existing search params + collection filter
  const redirectParams = new URLSearchParams();
  
  // Preserve existing search params
  Object.entries(searchParams).forEach(([key, value]) => {
    if (value !== undefined) {
      redirectParams.set(key, Array.isArray(value) ? value[0] : value);
    }
  });
  
  // Add collection filter
  redirectParams.set("collections", params.slug);
  
  // Redirect to unified products page
  redirect(`/${params.channel}/products?${redirectParams.toString()}`);
}
