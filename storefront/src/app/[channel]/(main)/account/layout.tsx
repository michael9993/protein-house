import { redirect } from "next/navigation";
import { CurrentUserDocument, type CurrentUserQuery } from "@/gql/graphql";
import { executeGraphQL } from "@/lib/graphql";
import { isAuthOrRscContextError } from "@/lib/auth-errors";
import { AccountSidebar } from "./AccountSidebar";
import { AccountMobileMenu } from "./AccountMobileMenu";

export default async function AccountLayout({
	children,
	params,
}: {
	children: React.ReactNode;
	params: Promise<{ channel: string }>;
}) {
	const { channel } = await params;
	let user: CurrentUserQuery["me"] = null;
	try {
		const result = await executeGraphQL(CurrentUserDocument, {
			cache: "no-cache",
		});
		user = result.me;
	} catch (error) {
		if (isAuthOrRscContextError(error)) {
			user = null;
		} else {
			throw error;
		}
	}

	if (!user) {
		redirect(`/${channel}/login?redirect=/${channel}/account`);
	}

	return (
		<>
			<div className="mx-auto max-w-7xl px-4 py-8 pb-24 lg:pb-8 sm:px-6 lg:px-8">
				<div className="lg:grid lg:grid-cols-12 lg:gap-8">
					{/* Sidebar */}
					<div className="hidden lg:col-span-3 lg:block">
						<AccountSidebar user={user} channel={channel} />
					</div>

					{/* Main Content */}
					<main className="lg:col-span-9">
						{children}
					</main>
				</div>
			</div>
			{/* Fixed bottom nav for mobile */}
			<AccountMobileMenu channel={channel} />
		</>
	);
}

