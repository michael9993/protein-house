"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useContentConfig } from "@/providers/StoreConfigProvider";
import { confirmEmailChange } from "./actions";

interface ConfirmEmailChangeClientProps {
	channel: string;
}

export function ConfirmEmailChangeClient({ channel }: ConfirmEmailChangeClientProps) {
	const router = useRouter();
	const searchParams = useSearchParams();
	const content = useContentConfig();
	const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
	const [message, setMessage] = useState<string | null>(null);

	const token = searchParams.get("token") ?? searchParams.get("key") ?? "";

	useEffect(() => {
		if (!token || status !== "idle") return;
		setStatus("loading");
		confirmEmailChange(token, channel).then((result) => {
			if (result.success) {
				setStatus("success");
				setMessage(content?.account?.confirmAccountSuccessMessage ?? "Email updated successfully. Redirecting...");
				setTimeout(() => router.push(`/${channel}/account/settings?emailConfirmed=1`), 2000);
			} else {
				setStatus("error");
				setMessage(result.error ?? "Invalid or expired link. Please request a new email change from account settings.");
			}
		});
	}, [token, channel, status, router, content?.account?.confirmAccountSuccessMessage]);

	if (status === "idle" || status === "loading") {
		return (
			<div className="flex min-h-[40vh] flex-col items-center justify-center px-4">
				<div className="text-center text-neutral-600">
					{content?.account?.confirmAccountConfirmingText ?? "Confirming your new email..."}
				</div>
			</div>
		);
	}

	if (status === "success") {
		return (
			<div className="flex min-h-[40vh] flex-col items-center justify-center px-4">
				<div className="rounded-lg bg-green-50 px-6 py-4 text-green-700">
					{message}
				</div>
				<Link href={`/${channel}/account/settings`} className="mt-4 text-sm underline">
					{content?.account?.confirmAccountBackToSignIn ?? "Back to Account Settings"}
				</Link>
			</div>
		);
	}

	return (
		<div className="flex min-h-[40vh] flex-col items-center justify-center px-4">
			<div className="rounded-lg bg-red-50 px-6 py-4 text-red-700">
				{message}
			</div>
			<Link href={`/${channel}/account/settings`} className="mt-4 text-sm underline">
				{content?.account?.confirmAccountBackToSignIn ?? "Back to Account Settings"}
			</Link>
		</div>
	);
}
