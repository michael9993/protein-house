import { NavLink } from "./NavLink";
import { executeGraphQL } from "@/lib/graphql";
import { MenuGetBySlugDocument } from "@/gql/graphql";

export const NavLinks = async ({ channel }: { channel: string }) => {
	const navLinks = await executeGraphQL(MenuGetBySlugDocument, {
		variables: { slug: "navbar", channel },
		revalidate: 60 * 60 * 24,
	});

	return (
		<>
			{/* Main Products Link - Always show first */}
			<NavLink href="/products" className="font-medium">
				Shop All
			</NavLink>
			
			{/* Category Links from CMS */}
			{navLinks.menu?.items?.map((item) => {
				// Only show categories for now
				if (item.category) {
					return (
						<NavLink key={item.id} href={`/categories/${item.category.slug}`}>
							{item.category.name}
						</NavLink>
					);
				}
				return null;
			})}
		</>
	);
};
