import { ForgotPasswordClient } from "./ForgotPasswordClient";

export const metadata = {
	title: "Forgot Password",
	description: "Request a password reset link for your account.",
};

export default async function ForgotPasswordPage({
	params,
}: {
	params: Promise<{ channel: string }>;
}) {
	const { channel } = await params;
	return <ForgotPasswordClient channel={channel} />;
}
