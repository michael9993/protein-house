import { TrackOrderClient } from "./TrackOrderClient";

export const metadata = {
	title: "Track Your Order",
	description: "Track your order status using your order number and email address.",
	robots: { index: false, follow: false },
};

export default async function TrackOrderPage({
	params,
}: {
	params: Promise<{ channel: string }>;
}) {
	const { channel } = await params;

	return <TrackOrderClient channel={channel} />;
}
