import { CurrentUserDocument } from "@/gql/graphql";
import { executeGraphQL } from "@/lib/graphql";
import { storeConfig } from "@/config";
import { SettingsClient } from "./SettingsClient";

export const metadata = {
	title: "Account Settings | SportZone",
	description: "Manage your account settings and preferences.",
};

export default async function SettingsPage({ 
	params 
}: { 
	params: Promise<{ channel: string }> 
}) {
	const { channel } = await params;
	const { me: user } = await executeGraphQL(CurrentUserDocument, {
		cache: "no-cache",
	});

	if (!user) {
		return null;
	}

	return <SettingsClient user={user} channel={channel} />;
}

