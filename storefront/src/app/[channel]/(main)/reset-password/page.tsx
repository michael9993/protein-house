import { ResetPasswordClient } from "./ResetPasswordClient";

export const metadata = {
	title: "Reset Password",
	description: "Set a new password for your account.",
};

export default async function ResetPasswordPage({
	params,
	searchParams,
}: {
	params: Promise<{ channel: string }>;
	searchParams: Promise<{ email?: string; token?: string }>;
}) {
	const { channel } = await params;
	const { email = null, token = null } = await searchParams;
	return (
		<ResetPasswordClient
			channel={channel}
			email={email ?? null}
			token={token ?? null}
		/>
	);
}
