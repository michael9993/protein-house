import { MenuGetBySlugDocument } from "@/gql/graphql";
import { executeGraphQL } from "@/lib/graphql";
import { FooterClient } from "./FooterClient";

export async function Footer({ channel }: { channel: string }) {
	// Fetch footer menu from GraphQL (server-side). Use withAuth: false so invalid/expired
	// tokens don't cause 500 — footer menu is public.
	const channelSpecificSlug = `footer-${channel}`;

	let menuItems: Awaited<ReturnType<typeof executeGraphQL<typeof MenuGetBySlugDocument>>>["menu"]["items"] = [];
	try {
		let footerLinks = await executeGraphQL(MenuGetBySlugDocument, {
			variables: { slug: channelSpecificSlug, channel },
			revalidate: 60 * 60 * 24,
			withAuth: false,
		});

		if (!footerLinks.menu?.items?.length) {
			footerLinks = await executeGraphQL(MenuGetBySlugDocument, {
				variables: { slug: "footer", channel },
				revalidate: 60 * 60 * 24,
				withAuth: false,
			});
		}
		menuItems = footerLinks.menu?.items || [];
	} catch {
		menuItems = [];
	}

	// Render client component with server-fetched data
	return <FooterClient menuItems={menuItems} channel={channel} />;
}
