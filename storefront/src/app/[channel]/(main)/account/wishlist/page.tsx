import { redirect } from "next/navigation";
import { CurrentUserDocument } from "@/gql/graphql";
import { executeGraphQL } from "@/lib/graphql";
import { fetchStorefrontConfig } from "@/lib/storefront-control";
import { WishlistClient } from "./WishlistClient";

export async function generateMetadata({ params }: { params: Promise<{ channel: string }> }) {
	const { channel } = await params;
	const config = await fetchStorefrontConfig(channel);
	const storeName = config.store?.name || "Store";
	const wishlistTitle = config.content?.wishlist?.myWishlistTitle || "My Wishlist";
	return {
		title: `${wishlistTitle} | ${storeName}`,
		description: "View and manage your saved items.",
		robots: { index: false, follow: false },
	};
}

export default async function WishlistPage({
	params,
}: {
	params: Promise<{ channel: string }>;
}) {
	const { channel } = await params;

	const { me: user } = await executeGraphQL(CurrentUserDocument, {
		cache: "no-cache",
	});

	if (!user) {
		redirect(`/${channel}/login?redirect=/${channel}/account/wishlist`);
	}

	return <WishlistClient channel={channel} />;
}
