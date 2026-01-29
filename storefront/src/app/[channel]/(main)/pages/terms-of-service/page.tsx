import { Metadata } from "next";
import { fetchStorefrontConfig } from "@/lib/storefront-control";
import { PolicyPageView } from "../_components/PolicyPageView";

type Props = { params: Promise<{ channel: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { channel } = await params;
	const config = await fetchStorefrontConfig(channel);
	const title =
		config.footer?.termsOfServicePageTitle?.trim() ||
		config.content?.footer?.termsOfServiceLink ||
		"Terms of Service";
	const storeName = config.store?.name || "";
	return {
		title: `${title} | ${storeName}`,
		description: config.footer?.termsOfServiceHeader?.trim() || `Terms of service for ${storeName}`,
	};
}

export default function TermsOfServicePage() {
	return <PolicyPageView policyKey="termsOfService" />;
}
