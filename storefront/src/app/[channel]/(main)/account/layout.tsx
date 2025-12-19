import { redirect } from "next/navigation";
import { CurrentUserDocument } from "@/gql/graphql";
import { executeGraphQL } from "@/lib/graphql";
import { AccountSidebar } from "./AccountSidebar";

export default async function AccountLayout({
	children,
	params,
}: {
	children: React.ReactNode;
	params: Promise<{ channel: string }>;
}) {
	const { channel } = await params;
	const { me: user } = await executeGraphQL(CurrentUserDocument, {
		cache: "no-cache",
	});

	if (!user) {
		redirect(`/${channel}/login?redirect=/${channel}/account`);
	}

	return (
		<div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
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
	);
}

