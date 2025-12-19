import { redirect } from "next/navigation";
import { CurrentUserDocument } from "@/gql/graphql";
import { executeGraphQL } from "@/lib/graphql";
import { WishlistClient } from "./WishlistClient";

export const metadata = {
	title: "My Wishlist | SportZone",
	description: "View and manage your saved items.",
};

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
