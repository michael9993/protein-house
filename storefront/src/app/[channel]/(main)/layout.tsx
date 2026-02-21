import { type ReactNode } from "react";
import { Footer } from "@/ui/components/Footer";
import { Header } from "@/ui/components/Header";
import { PromoPopupLoader } from "@/ui/components/PromoPopup";
import { ProductListByCollectionDocument, CurrentUserDocument } from "@/gql/graphql";
import { executeGraphQL } from "@/lib/graphql";
import { getLanguageCodeForChannel } from "@/lib/language";
import { homepageCollections } from "@/lib/cms";
import { StoreConfigProvider } from "@/providers/StoreConfigProvider";
import { DirectionProvider } from "@/providers/DirectionProvider";
import { fetchStorefrontConfig } from "@/lib/storefront-control";
import { ConfigSync } from "@/components/ConfigSync";
import { PageTransition } from "@/components/PageTransition";
import { DirectionSetter } from "@/components/DirectionSetter";
import { ScrollHideController } from "@/components/ScrollHideController";
import { resolveDirection } from "@/lib/direction";
import { getNavData } from "@/ui/components/nav/components/NavLinks";
import { CartDrawerShell } from "@/ui/components/CartDrawer";
import { createCheckoutWithItemsAction } from "@/app/cart-actions";
import { WhatsAppChatButton } from "@/components/WhatsAppChatButton";
import { RecentlyViewedProvider } from "@/lib/recently-viewed";
import { WishlistProvider } from "@/lib/wishlist";
import { RecentlyViewedFloatingButton } from "@/components/RecentlyViewedDrawer";
import { WishlistFloatingButton } from "@/components/WishlistDrawer";
import { QuickViewWrapper } from "./QuickViewWrapper";
import { CookieConsent } from "@/ui/components/CookieConsent";
import { GoogleTagManager } from "@/ui/components/GoogleTagManager";

/**
 * Generate metadata with direction attribute to prevent FOUC
 */
export async function generateMetadata(props: { params: Promise<{ channel: string }> }) {
	const channel = (await props.params).channel;
	const storeConfig = await fetchStorefrontConfig(channel);
	const resolvedDirection = resolveDirection(storeConfig);
	const resolvedLocale = storeConfig.localization?.defaultLocale || 'en-US';

	return {
		title: "Saleor Storefront example",
		description: "Starter pack for building performant e-commerce experiences with Saleor.",
		other: {
			// This will be set via the blocking script, but we include it here for reference
		},
	};
}

/**
 * Fetch sale products to determine if there are active promotions
 * Uses the same "sale" collection as the homepage
 * 
 * Collection metadata keys:
 * - "Promotion": Name of the promotion (from Dashboard > Discounts)
 */
async function getSalePromoData(channel: string) {
	try {
		const languageCode = getLanguageCodeForChannel(channel);
		const result = await executeGraphQL(ProductListByCollectionDocument, {
			variables: { slug: homepageCollections.sale, channel, languageCode },
			revalidate: 300,
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
		
		// Extract promotion name and end date from metadata
		const promotionMeta = metadata.find(
			(m: { key: string; value: string }) => m.key.toLowerCase() === "promotion"
		);
		const promotionName = promotionMeta?.value || "";

		const endDateMeta = metadata.find(
			(m: { key: string; value: string }) => m.key.toLowerCase() === "enddate"
		);
		const saleEndDate = endDateMeta?.value || null;
		
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
			saleEndDate,
		};
	} catch {
		return {
			productCount: 0,
			maxDiscountPercent: 0,
			currencyCode: "USD",
			description: "",
			promotionName: "",
			backgroundImage: null,
			saleEndDate: null,
		};
	}
}

export default async function RootLayout(props: {
	children: ReactNode;
	params: Promise<{ channel: string }>;
}) {
	const channel = (await props.params).channel;
	
	// Fetch promo data, storefront config, nav data, and current user (for mobile account link) in parallel
	const [promoData, storeConfig, navData, userResult] = await Promise.all([
		getSalePromoData(channel),
		fetchStorefrontConfig(channel),
		getNavData(channel),
		executeGraphQL(CurrentUserDocument, { cache: "no-cache" }).catch(() => ({ me: null })),
	]);
	const isLoggedIn = !!userResult?.me;

	// Resolve direction server-side
	const resolvedDirection = resolveDirection(storeConfig);
	const resolvedLocale = storeConfig.localization?.defaultLocale || 'en-US';

	// Build sitewide JSON-LD (Organization + WebSite with SearchAction)
	const siteUrl = process.env.NEXT_PUBLIC_STOREFRONT_URL || `https://shops.halacosmetics.org`;
	const socialLinks = [
		storeConfig.integrations?.social?.facebook,
		storeConfig.integrations?.social?.instagram,
		storeConfig.integrations?.social?.twitter,
		storeConfig.integrations?.social?.youtube,
		storeConfig.integrations?.social?.tiktok,
		storeConfig.integrations?.social?.pinterest,
	].filter(Boolean) as string[];

	const organizationJsonLd = {
		"@context": "https://schema.org",
		"@type": "Organization",
		name: storeConfig.store?.name || "Aura Store",
		url: siteUrl,
		logo: storeConfig.branding?.logo || undefined,
		description: storeConfig.store?.description || storeConfig.seo?.defaultDescription || undefined,
		email: storeConfig.store?.email || undefined,
		telephone: storeConfig.store?.phone || undefined,
		...(socialLinks.length > 0 ? { sameAs: socialLinks } : {}),
		...(storeConfig.store?.address ? {
			address: {
				"@type": "PostalAddress",
				streetAddress: storeConfig.store.address.street,
				addressLocality: storeConfig.store.address.city,
				addressRegion: storeConfig.store.address.state,
				postalCode: storeConfig.store.address.zip,
				addressCountry: storeConfig.store.address.country,
			},
		} : {}),
	};

	const websiteJsonLd = {
		"@context": "https://schema.org",
		"@type": "WebSite",
		name: storeConfig.store?.name || "Aura Store",
		url: siteUrl,
		potentialAction: {
			"@type": "SearchAction",
			target: {
				"@type": "EntryPoint",
				urlTemplate: `${siteUrl}/${channel}/products?search={search_term_string}`,
			},
			"query-input": "required name=search_term_string",
		},
	};

	return (
		<>
			{/* Sitewide JSON-LD: Organization + WebSite with SearchAction */}
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
			/>
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
			/>
			{/* Blocking inline script - runs synchronously before React hydration */}
			{/* This prevents FOUC by setting direction immediately */}
			<script
				dangerouslySetInnerHTML={{
					__html: `document.documentElement.setAttribute('dir','${resolvedDirection}');document.documentElement.setAttribute('lang','${resolvedLocale}');`,
				}}
			/>
			<StoreConfigProvider config={storeConfig}>
			<DirectionProvider>
			<WishlistProvider channel={channel}>
			<RecentlyViewedProvider channel={channel}>
			<CartDrawerShell createCheckoutWithItems={createCheckoutWithItemsAction}>
				<QuickViewWrapper channel={channel}>
				{/* GA4/GTM — loads only after analytics consent */}
				<GoogleTagManager channel={channel} />
				{/* Client-side direction setter - backup and for dynamic updates */}
				<DirectionSetter config={storeConfig} />
				<ScrollHideController />
				<ConfigSync channel={channel} />
				<Header channel={channel} navData={navData} isLoggedIn={isLoggedIn} />
			<div className="flex min-h-[calc(100dvh-64px)] flex-col pb-16 md:pb-0">
				<main id="main-content" className="flex-1">
					<PageTransition>
						{props.children}
					</PageTransition>
				</main>
				<Footer channel={channel} />
			</div>
			<WhatsAppChatButton />
			<WishlistFloatingButton channel={channel} />
			<RecentlyViewedFloatingButton />
			{/* Cookie Consent Banner — GDPR/Israeli Privacy Law */}
			<CookieConsent channel={channel} />
			{/* Promotion Popup - only renders client-side if there are active sales */}
			<PromoPopupLoader
				channel={channel}
				saleProductCount={promoData.productCount}
				currencyCode={promoData.currencyCode}
				maxDiscountPercent={promoData.maxDiscountPercent}
				description={promoData.description}
				promotionName={promoData.promotionName}
				backgroundImage={promoData.backgroundImage}
				saleEndDate={promoData.saleEndDate}
			/>
				</QuickViewWrapper>
			</CartDrawerShell>
			</RecentlyViewedProvider>
			</WishlistProvider>
			</DirectionProvider>
			</StoreConfigProvider>
		</>
	);
}
