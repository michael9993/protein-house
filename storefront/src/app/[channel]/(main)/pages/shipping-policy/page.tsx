import { Metadata } from "next";
import { fetchStorefrontConfig } from "@/lib/storefront-control";
import { PolicyPageView } from "../_components/PolicyPageView";

type Props = { params: Promise<{ channel: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { channel } = await params;
	const config = await fetchStorefrontConfig(channel);
	const title =
		config.footer?.shippingPolicyPageTitle?.trim() ||
		config.content?.footer?.shippingLink ||
		"Shipping Policy";
	const storeName = config.store?.name || "";
	return {
		title: `${title} | ${storeName}`,
		description: config.footer?.shippingPolicyHeader?.trim() || `Shipping and delivery policy for ${storeName}`,
	};
}

export default function ShippingPolicyPage() {
	return <PolicyPageView policyKey="shippingPolicy" />;
}
