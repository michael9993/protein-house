import { Metadata } from "next";
import { fetchStorefrontConfig } from "@/lib/storefront-control";
import { PolicyPageView } from "../_components/PolicyPageView";

type Props = { params: Promise<{ channel: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { channel } = await params;
	const config = await fetchStorefrontConfig(channel);
	const title = config.footer?.accessibilityPageTitle?.trim() || "Accessibility Statement";
	const storeName = config.store?.name || "";
	return {
		title: `${title} | ${storeName}`,
		description: `Accessibility statement for ${storeName}`,
	};
}

export default function AccessibilityPage() {
	return <PolicyPageView policyKey="accessibility" />;
}
