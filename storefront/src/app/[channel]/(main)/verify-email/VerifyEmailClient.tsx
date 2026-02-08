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
		<div className="auth-page flex min-h-[calc(100vh-200px)] items-center justify-center px-4 py-12">
			<div className="w-full max-w-md">
				{/* Logo */}
				<div className="mb-8 text-center">
					<Link
						href={`/${channel}`}
						className="inline-flex items-center gap-2.5"
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
								<svg className="h-8 w-8" style={{ color: branding.colors.primary }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
									<path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.15c0 .415.336.75.75.75z" />
								</svg>
								<span className="text-xl font-bold" style={{ color: branding.colors.primary }}>{store.name}</span>
							</>
						)}
					</Link>
					<h1 className="mt-6 text-2xl font-bold" style={{ color: "var(--store-text)" }}>
						{content.account.verifyEmailTitle ?? "Check Your Email"}
					</h1>
					<p className="mt-2 text-sm" style={{ color: "var(--store-text-muted)" }}>
						{content.account.verifyEmailSubtitle ?? "We've sent a confirmation link to your email address"}
					</p>
				</div>

				{/* Main Content */}
				<div className="auth-card p-8">
					{/* Email Icon */}
					<div className="mb-6 flex justify-center">
						<div className="rounded-full p-4" style={{ backgroundColor: `${branding.colors.primary}0A` }}>
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
									strokeWidth={1.5}
									d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
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
							<ul className="mt-1 ms-4 list-disc space-y-1">
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
								className="auth-submit flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-base font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
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
										className="block w-full rounded-xl border-2 py-2.5 text-center text-sm font-medium transition-colors hover:opacity-90"
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
							className="inline-flex items-center gap-1 text-sm font-medium hover:underline"
							style={{ color: branding.colors.primary }}
						>
							<svg className="h-4 w-4 rtl:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
								<path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
							</svg>
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
