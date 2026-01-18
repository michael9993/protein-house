import { type ReactNode } from "react";
import { Footer } from "@/ui/components/Footer";
import { Header } from "@/ui/components/Header";
import { PromoPopupLoader } from "@/ui/components/PromoPopup";
import { ProductListByCollectionDocument } from "@/gql/graphql";
import { executeGraphQL } from "@/lib/graphql";
import { homepageCollections } from "@/lib/cms";
import { StoreConfigProvider } from "@/providers/StoreConfigProvider";
import { fetchStorefrontConfig } from "@/lib/storefront-control";

export const metadata = {
	title: "Saleor Storefront example",
	description: "Starter pack for building performant e-commerce experiences with Saleor.",
};

/**
 * Fetch sale products to determine if there are active promotions
 * Uses the same "sale" collection as the homepage
 * 
 * Collection metadata keys:
 * - "Promotion": Name of the promotion (from Dashboard > Discounts)
 */
async function getSalePromoData(channel: string) {
	try {
		const result = await executeGraphQL(ProductListByCollectionDocument, {
			variables: { slug: homepageCollections.sale, channel },
			revalidate: 30,
		});
		
		const collection = result.collection;
		const products = collection?.products?.edges || [];
		const productCount = products.length;
		
		// Get collection description and metadata
		const description = collection?.description || "";
		const metadata = collection?.metadata || [];
		
		// Get background image from collection
		const backgroundImage = collection?.backgroundImage
			? {
					url: collection.backgroundImage.url,
					alt: collection.backgroundImage.alt || collection.name || "Promotion background",
				}
			: null;
		
		// Extract promotion name from metadata (key: "Promotion")
		const promotionMeta = metadata.find(
			(m: { key: string; value: string }) => m.key.toLowerCase() === "promotion"
		);
		const promotionName = promotionMeta?.value || "";
		
		// Calculate max discount percentage from products
		let maxDiscountPercent = 0;
		let currencyCode = "USD";
		
		for (const { node } of products) {
			const current = node.pricing?.priceRange?.start?.gross;
			const original = node.pricing?.priceRangeUndiscounted?.start?.gross;
			
			if (current && original && original.amount > current.amount) {
				const discount = Math.round((1 - current.amount / original.amount) * 100);
				if (discount > maxDiscountPercent) {
					maxDiscountPercent = discount;
				}
				currencyCode = current.currency || currencyCode;
			}
		}
		
		return { 
			productCount, 
			maxDiscountPercent, 
			currencyCode,
			description,
			promotionName,
			backgroundImage,
		};
	} catch {
		return { 
			productCount: 0, 
			maxDiscountPercent: 0, 
			currencyCode: "USD",
			description: "",
			promotionName: "",
			backgroundImage: null,
		};
	}
}

export default async function RootLayout(props: {
	children: ReactNode;
	params: Promise<{ channel: string }>;
}) {
	const channel = (await props.params).channel;
	
	// Fetch promo data and storefront config in parallel
	const [promoData, storeConfig] = await Promise.all([
		getSalePromoData(channel),
		fetchStorefrontConfig(channel),
	]);

	return (
		<StoreConfigProvider config={storeConfig}>
			<Header channel={channel} />
			<div className="flex min-h-[calc(100dvh-64px)] flex-col pb-16 md:pb-0">
				<main className="flex-1">{props.children}</main>
				<Footer channel={channel} />
			</div>
			{/* Promotion Popup - only renders client-side if there are active sales */}
			<PromoPopupLoader
				channel={channel}
				saleProductCount={promoData.productCount}
				currencyCode={promoData.currencyCode}
				maxDiscountPercent={promoData.maxDiscountPercent}
				description={promoData.description}
				promotionName={promoData.promotionName}
				backgroundImage={promoData.backgroundImage}
			/>
		</StoreConfigProvider>
	);
}
