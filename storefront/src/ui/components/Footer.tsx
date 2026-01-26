import { MenuGetBySlugDocument } from "@/gql/graphql";
import { executeGraphQL } from "@/lib/graphql";
import { FooterClient } from "./FooterClient";

export async function Footer({ channel }: { channel: string }) {
	// Fetch footer menu from GraphQL (server-side)
	// Use channel-specific menu slug: "footer-{channelSlug}" (e.g., "footer-ils")
	// Falls back to "footer" if channel-specific menu doesn't exist
	const channelSpecificSlug = `footer-${channel}`;
	
	let footerLinks = await executeGraphQL(MenuGetBySlugDocument, {
		variables: { slug: channelSpecificSlug, channel },
		revalidate: 60 * 60 * 24,
	});

	// If channel-specific menu doesn't exist, fall back to generic "footer" menu
	if (!footerLinks.menu || !footerLinks.menu.items || footerLinks.menu.items.length === 0) {
		footerLinks = await executeGraphQL(MenuGetBySlugDocument, {
			variables: { slug: "footer", channel },
			revalidate: 60 * 60 * 24,
		});
	}

	// Extract menu items for the client component
	const menuItems = footerLinks.menu?.items || [];

	// Render client component with server-fetched data
	return <FooterClient menuItems={menuItems} channel={channel} />;
}
