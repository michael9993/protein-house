import { CurrentUserDocument } from "@/gql/graphql";
import { executeGraphQL } from "@/lib/graphql";
import { getNewsletterStatus } from "./actions";
import { SettingsClient } from "./SettingsClient";

export const metadata = {
	title: "Account Settings | SportZone",
	description: "Manage your account settings and preferences.",
};

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

