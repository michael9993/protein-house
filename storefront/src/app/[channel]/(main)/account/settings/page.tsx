import { CurrentUserDocument } from "@/gql/graphql";
import { executeGraphQL } from "@/lib/graphql";
import { fetchStorefrontConfig } from "@/lib/storefront-control";
import { getNewsletterStatus } from "./actions";
import { SettingsClient } from "./SettingsClient";

export async function generateMetadata({ params }: { params: Promise<{ channel: string }> }) {
	const { channel } = await params;
	const config = await fetchStorefrontConfig(channel);
	const storeName = config.store?.name || "Store";
	const settingsTitle = config.content?.settings?.accountSettings || "Account Settings";
	return {
		title: `${settingsTitle} | ${storeName}`,
		description: config.content?.settings?.settingsSubtitle || "Manage your account settings and preferences.",
		robots: { index: false, follow: false },
	};
}

export default async function SettingsPage({
	params,
}: {
	params: Promise<{ channel: string }>;
}) {
	const { channel } = await params;
	const { me: user } = await executeGraphQL(CurrentUserDocument, {
		cache: "no-cache",
	});

	if (!user) {
		return null;
	}

	const newsletterStatus = await getNewsletterStatus(user.email);
	const newsletterActive = newsletterStatus?.isActive ?? false;

	return (
		<SettingsClient
			user={user}
			channel={channel}
			initialNewsletterActive={newsletterActive}
		/>
	);
}

