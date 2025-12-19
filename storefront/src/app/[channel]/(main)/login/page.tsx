import { redirect } from "next/navigation";
import { CurrentUserDocument } from "@/gql/graphql";
import { executeGraphQL } from "@/lib/graphql";
import { LoginClient } from "./LoginClient";

export const metadata = {
	title: "Sign In | SportZone",
	description: "Sign in to your SportZone account to access your orders, wishlist, and more.",
};

export default async function LoginPage({ 
	params,
	searchParams 
}: { 
	params: Promise<{ channel: string }>;
	searchParams: Promise<{ redirect?: string; error?: string; confirmed?: string }>;
}) {
	const { channel } = await params;
	const { redirect: redirectPath, error, confirmed } = await searchParams;
	
	// Check if user is already logged in
	const { me: user } = await executeGraphQL(CurrentUserDocument, {
		cache: "no-cache",
	});

	if (user) {
		redirect(redirectPath || `/${channel}`);
	}

	return <LoginClient channel={channel} redirectUrl={redirectPath} initialError={error} confirmed={!!confirmed} />;
}
