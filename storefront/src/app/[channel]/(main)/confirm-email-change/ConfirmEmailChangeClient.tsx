"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useBranding, useContentConfig } from "@/providers/StoreConfigProvider";
import { confirmEmailChange } from "./actions";

interface ConfirmEmailChangeClientProps {
	channel: string;
}

export function ConfirmEmailChangeClient({ channel }: ConfirmEmailChangeClientProps) {
	const router = useRouter();
	const searchParams = useSearchParams();
	const content = useContentConfig();
	const branding = useBranding();
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
			<div className="auth-page flex min-h-[40vh] flex-col items-center justify-center px-4">
				<div className="auth-card p-8 text-center" style={{ color: "var(--store-text-muted)" }}>
					<svg className="mx-auto mb-4 h-8 w-8 animate-spin" style={{ color: branding.colors.primary }} fill="none" viewBox="0 0 24 24">
						<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
						<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
					</svg>
					{content?.account?.confirmAccountConfirmingText ?? "Confirming your new email..."}
				</div>
			</div>
		);
	}

	if (status === "success") {
		return (
			<div className="auth-page flex min-h-[40vh] flex-col items-center justify-center px-4">
				<div className="state-success rounded-lg px-6 py-4 text-sm">
					<div className="flex items-center gap-2">
						<svg className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
						</svg>
						{message}
					</div>
				</div>
				<Link
					href={`/${channel}/account/settings`}
					className="mt-4 inline-flex items-center gap-1 text-sm font-medium hover:underline"
					style={{ color: branding.colors.primary }}
				>
					<svg className="h-4 w-4 rtl:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
						<path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
					</svg>
					{content?.account?.confirmAccountBackToSignIn ?? "Back to Account Settings"}
				</Link>
			</div>
		);
	}

	return (
		<div className="auth-page flex min-h-[40vh] flex-col items-center justify-center px-4">
			<div className="state-error rounded-lg px-6 py-4 text-sm">
				<div className="flex items-center gap-2">
					<svg className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
					</svg>
					{message}
				</div>
			</div>
			<Link
				href={`/${channel}/account/settings`}
				className="mt-4 inline-flex items-center gap-1 text-sm font-medium hover:underline"
				style={{ color: branding.colors.primary }}
			>
				<svg className="h-4 w-4 rtl:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
					<path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
				</svg>
				{content?.account?.confirmAccountBackToSignIn ?? "Back to Account Settings"}
			</Link>
		</div>
	);
}
