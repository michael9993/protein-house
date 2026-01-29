import { Metadata } from "next";
import { fetchStorefrontConfig } from "@/lib/storefront-control";
import { PolicyPageView } from "../_components/PolicyPageView";

type Props = { params: Promise<{ channel: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { channel } = await params;
	const config = await fetchStorefrontConfig(channel);
	const title =
		config.footer?.returnPolicyPageTitle?.trim() ||
		config.content?.footer?.returnPolicyLink ||
		"Return Policy";
	const storeName = config.store?.name || "";
	return {
		title: `${title} | ${storeName}`,
		description: config.footer?.returnPolicyHeader?.trim() || `Return and refund policy for ${storeName}`,
	};
}

export default function ReturnPolicyPage() {
	return <PolicyPageView policyKey="returnPolicy" />;
}
