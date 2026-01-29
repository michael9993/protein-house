"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useBranding, useStoreInfo, useContentConfig } from "@/providers/StoreConfigProvider";
import { resendConfirmationEmail } from "./actions";

interface VerifyEmailClientProps {
	channel: string;
	email: string;
	autoResend?: boolean;
}

export function VerifyEmailClient({ channel, email: initialEmail, autoResend: _autoResend }: VerifyEmailClientProps) {
	const [email] = useState(initialEmail);
	const [isResending, setIsResending] = useState(false);
	const [resendStatus, setResendStatus] = useState<"idle" | "success" | "error">("idle");
	const [resendMessage, setResendMessage] = useState<string | null>(null);
	const branding = useBranding();
	const store = useStoreInfo();
	const content = useContentConfig();

	const focusRingColor = `${branding.colors.primary}33`;

	const handleResend = async () => {
		if (!email) {
			setResendStatus("error");
			setResendMessage(content.account.verifyEmailRequiredError ?? "Email address is required");
			return;
		}

		setIsResending(true);
		setResendStatus("idle");
		setResendMessage(null);

		try {
			const decodedEmail = decodeURIComponent(email);
			const result = await resendConfirmationEmail(decodedEmail, channel);

			if (result.success) {
				setResendStatus("success");
				setResendMessage(content.account.resendSuccessMessage ?? "Confirmation email sent! Please check your inbox.");
			} else {
				setResendStatus("error");
				let errorMessage = result.error ?? "Failed to resend confirmation email. Please try again.";
				if (errorMessage.includes("sign in")) {
					errorMessage = content.account.signInFirstToResend ?? "Unable to resend email automatically. Please sign in first, or wait a few minutes and try again.";
				}
				setResendMessage(errorMessage);
			}
		} catch {
			setResendStatus("error");
			setResendMessage("An error occurred. Please try again later.");
		} finally {
			setIsResending(false);
		}
	};

	return (
		<div className="flex min-h-[calc(100vh-200px)] items-center justify-center px-4 py-12 animate-fade-in">
			<style>{`
				.auth-input:focus {
					border-color: ${branding.colors.primary} !important;
					box-shadow: 0 0 0 3px ${focusRingColor} !important;
					outline: none !important;
				}
			`}</style>
			<div className="w-full max-w-md animate-fade-in-up" style={{ animationDelay: "100ms", animationFillMode: "both" }}>
				{/* Logo */}
				<div className="mb-8 text-center animate-fade-in-up" style={{ animationDelay: "150ms", animationFillMode: "both" }}>
					<Link
						href={`/${channel}`}
						className="inline-flex items-center gap-2 text-2xl font-bold"
						style={{ color: branding.colors.primary }}
					>
						{branding.logo && branding.logo !== "/logo.svg" ? (
							<Image
								src={branding.logo}
								alt={branding.logoAlt || store.name}
								width={140}
								height={36}
								className="h-9 w-auto"
							/>
						) : (
							<>
								<svg className="h-10 w-10" viewBox="0 0 24 24" fill="currentColor">
									<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
								</svg>
								{store.name}
							</>
						)}
					</Link>
					<h1 className="mt-6 text-2xl font-bold" style={{ color: "var(--store-text)" }}>
						{content.account.verifyEmailTitle ?? "Check Your Email"}
					</h1>
					<p className="mt-2" style={{ color: "var(--store-text-muted)" }}>
						{content.account.verifyEmailSubtitle ?? "We've sent a confirmation link to your email address"}
					</p>
				</div>

				{/* Main Content */}
				<div
					className="rounded-2xl p-8 shadow-lg ring-1 animate-fade-in-up"
					style={{
						animationDelay: "200ms",
						animationFillMode: "both",
						backgroundColor: "var(--store-bg)",
					} as React.CSSProperties}
				>
					{/* Email Icon */}
					<div className="mb-6 flex justify-center">
						<div className="rounded-full p-4" style={{ backgroundColor: "var(--store-neutral-100)" }}>
							<svg
								className="h-12 w-12"
								style={{ color: branding.colors.primary }}
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
								/>
							</svg>
						</div>
					</div>

					{email && (
						<div className="mb-6 text-center">
							<p className="text-sm" style={{ color: "var(--store-text-muted)" }}>
								{content.account.verifyEmailSentTo ?? "We sent a confirmation email to:"}
							</p>
							<p className="mt-1 text-base font-semibold" style={{ color: "var(--store-text)" }}>
								{email}
							</p>
						</div>
					)}

					{/* Instructions */}
					<div className="mb-6 space-y-3 text-sm" style={{ color: "var(--store-text-muted)" }}>
						<p>{content.account.verifyEmailInstructions ?? "Please click the confirmation link in the email to activate your account."}</p>
						<p>{content.account.verifyEmailNotReceived ?? "If you don't see the email, check your spam folder or click the button below to resend it."}</p>
						<div className="mt-4 rounded-lg p-3 text-xs" style={{ backgroundColor: "var(--store-neutral-100)", color: "var(--store-text-muted)" }}>
							<p className="font-medium mb-1" style={{ color: "var(--store-text)" }}>
								{content.account.verifyEmailNotReceivedTitle ?? "Email not received?"}
							</p>
							<p>{content.account.verifyEmailNotReceivedIntro ?? "The confirmation email is sent automatically after registration. If you don't see it:"}</p>
							<ul className="mt-1 ml-4 list-disc space-y-1">
								<li>{content.account.verifyEmailCheckSpam ?? "Check your spam/junk folder"}</li>
								<li>{content.account.verifyEmailWaitMinutes ?? "Wait a few minutes (emails may be delayed)"}</li>
								<li>{content.account.verifyEmailSignInToResend ?? "Sign in below to resend the email"}</li>
							</ul>
						</div>
					</div>

					{resendStatus === "success" && (
						<div className="state-success mb-4 rounded-lg px-4 py-3 text-sm">
							<div className="flex items-center gap-2">
								<svg className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
								</svg>
								{resendMessage}
							</div>
						</div>
					)}

					{resendStatus === "error" && (
						<div className="state-error mb-4 rounded-lg px-4 py-3 text-sm">
							<div className="flex items-center gap-2">
								<svg className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
								</svg>
								{resendMessage}
							</div>
						</div>
					)}

					{email && (
						<div className="space-y-3">
							<button
								type="button"
								onClick={handleResend}
								disabled={isResending}
								className="flex w-full items-center justify-center gap-2 rounded-lg py-3.5 text-base font-semibold text-white transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
								style={{ backgroundColor: branding.colors.primary }}
							>
								{isResending ? (
									<>
										<svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
											<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
											<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
										</svg>
										{content.account.resendSendingText ?? "Sending..."}
									</>
								) : (
									content.account.resendConfirmationButton ?? "Resend Confirmation Email"
								)}
							</button>
							{resendStatus === "error" && resendMessage?.includes("sign in") && (
								<div className="space-y-2">
									<p className="text-xs text-center" style={{ color: "var(--store-text-muted)" }}>
										{content.account.signInFirstToResend ?? "You need to sign in first to resend the confirmation email."}
									</p>
									<Link
										href={`/${channel}/login?email=${encodeURIComponent(email)}&resend=true`}
										className="block w-full rounded-lg border-2 py-2.5 text-center text-sm font-medium transition-colors hover:opacity-90"
										style={{ borderColor: branding.colors.primary, color: branding.colors.primary }}
									>
										{content.account.signInToResendEmail ?? "Sign In to Resend Email"}
									</Link>
								</div>
							)}
						</div>
					)}

					<div className="mt-6 text-center">
						<Link
							href={`/${channel}/login`}
							className="text-sm font-medium hover:underline"
							style={{ color: branding.colors.primary }}
						>
							{content.account.backToSignIn ?? "Back to Sign In"}
						</Link>
					</div>
				</div>

				<div className="mt-6 text-center">
					<p className="text-xs" style={{ color: "var(--store-text-muted)" }}>
						{content.account.verifyEmailExpiryHelp ?? "The confirmation link will expire in 24 hours. If you need help, please contact support."}
					</p>
				</div>
			</div>
		</div>
	);
}
