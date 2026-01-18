import { MenuGetBySlugDocument } from "@/gql/graphql";
import { executeGraphQL } from "@/lib/graphql";
import { FooterClient } from "./FooterClient";

export async function Footer({ channel }: { channel: string }) {
	// Fetch footer menu from GraphQL (server-side)
	const footerLinks = await executeGraphQL(MenuGetBySlugDocument, {
		variables: { slug: "footer", channel },
		revalidate: 60 * 60 * 24,
	});

	// Extract menu items for the client component
	const menuItems = footerLinks.menu?.items || [];

	// Render client component with server-fetched data
	return <FooterClient menuItems={menuItems} />;
}
