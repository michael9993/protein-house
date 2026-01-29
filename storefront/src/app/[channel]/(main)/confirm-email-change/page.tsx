import { ConfirmEmailChangeClient } from "./ConfirmEmailChangeClient";

export const metadata = {
	title: "Confirm Email Change",
	description: "Confirm your new email address.",
};

export default async function ConfirmEmailChangePage({
	params,
}: {
	params: Promise<{ channel: string }>;
}) {
	const { channel } = await params;
	return <ConfirmEmailChangeClient channel={channel} />;
}
