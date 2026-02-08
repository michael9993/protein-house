"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useBranding, useStoreInfo, useStoreConfig, usePageEnabled } from "@/providers/StoreConfigProvider";
import { DEFAULT_CONTENT_CONFIG } from "@/providers/StoreConfigProvider";

// Persist across remounts (e.g. React Strict Mode) so we only ever send one confirm request per link
const CONFIRM_DEBOUNCE_MS = 8000;
const lastConfirmAttempt = { key: "", time: 0 };

interface ConfirmEmailClientProps {
	channel: string;
	email?: string;
	token?: string;
}

export function ConfirmEmailClient({ channel, email: initialEmail, token: initialToken }: ConfirmEmailClientProps) {
	const router = useRouter();
	const searchParams = useSearchParams();
	const branding = useBranding();
	const store = useStoreInfo();
	const config = useStoreConfig();
	const content = { ...DEFAULT_CONTENT_CONFIG.account, ...config?.content?.account };
	const confirmEmailPageEnabled = usePageEnabled("confirmEmail");

	const [email, setEmail] = useState(initialEmail || "");
	const [token, setToken] = useState(initialToken || "");
	const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
	const [message, setMessage] = useState<string | null>(null);
	const autoConfirmAttemptedRef = useRef(false);

	// If email and token are in URL, auto-confirm once. Use module-level guard so we only send one request
	// even when React Strict Mode remounts the component (which would reset the ref and fire the effect twice).
	useEffect(() => {
		const urlEmail = searchParams.get("email");
		const urlToken = searchParams.get("token");
		const emailToUse = initialEmail || urlEmail;
		const tokenToUse = initialToken || urlToken;

		if (!emailToUse || !tokenToUse || status !== "idle") {
			return;
		}

		let decodedEmail = emailToUse;
		let decodedToken = tokenToUse;
		try {
			decodedEmail = decodeURIComponent(emailToUse);
			decodedToken = decodeURIComponent(tokenToUse);
		} catch {
			// use as-is
		}

		const attemptKey = `${decodedEmail}:${decodedToken}`;
		const now = Date.now();
		if (
			lastConfirmAttempt.key === attemptKey &&
			now - lastConfirmAttempt.time < CONFIRM_DEBOUNCE_MS
		) {
			return;
		}
		lastConfirmAttempt.key = attemptKey;
		lastConfirmAttempt.time = now;
		autoConfirmAttemptedRef.current = true;

		setEmail(decodedEmail);
		setToken(decodedToken);
		handleConfirm(decodedEmail, decodedToken);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [searchParams, initialEmail, initialToken, status]);

	const handleConfirm = async (confirmEmail: string, confirmToken: string) => {
		if (!confirmEmail || !confirmToken) {
			setStatus("error");
			setMessage("Email and token are required");
			return;
		}

		// Ensure email and token are properly decoded
		let decodedEmail = confirmEmail;
		let decodedToken = confirmToken;

		try {
			decodedEmail = decodeURIComponent(confirmEmail);
			decodedToken = decodeURIComponent(confirmToken);
		} catch (e) {
			// If decoding fails, they might already be decoded - use as-is
			console.log("[Confirm Email Client] URL decode not needed, using original values");
		}

		setStatus("loading");
		setMessage(content.confirmAccountCheckingMessage ?? "Confirming your email...");

		try {
			// Use the new confirm-and-login action that automatically logs the user in
			const { confirmAndLoginAction } = await import("./actions");
			const result = await confirmAndLoginAction(decodedEmail, decodedToken, channel);

			console.log("[Confirm Email] Result:", { success: result.success, error: result.error });

			if (!result.success) {
				setStatus("error");
				const rawError = result.error || "Failed to confirm account";

				// Check "already confirmed" first
				if (rawError.toLowerCase().includes("already")) {
					setMessage(content.confirmAccountAlreadyConfirmed ?? "This account has already been confirmed. Redirecting to sign in...");
					setTimeout(() => {
						router.push(`/${channel}/login?confirmed=true`);
					}, 1500);
					return;
				}

				// Invalid or expired: show message + link to request new email
				if (rawError.includes("Invalid") || rawError.includes("expired")) {
					setMessage("LINK_EXPIRED");
				} else {
					setMessage(rawError);
				}
				return;
			}

			// Success - user is already logged in via tokens!
			setStatus("success");
			setMessage(content.confirmAccountSuccessMessage ?? "Account confirmed and logged in! Redirecting...");

			// Clear any stored passwords (no longer needed)
			const emailVariants = [decodedEmail, email, decodedEmail.toLowerCase(), email.toLowerCase()];
			for (const emailVariant of emailVariants) {
				try {
					sessionStorage.removeItem(`pending_confirmation_${emailVariant}`);
				} catch (e) {
					// Ignore
				}
			}

			// Dispatch login event for wishlist to reload
			window.dispatchEvent(new CustomEvent("wishlist:login"));

			// Small delay to ensure cookies are set before navigation
			await new Promise(resolve => setTimeout(resolve, 100));

			// Redirect to home page
			router.push(`/${channel}`);
			router.refresh();
		} catch (error: any) {
			console.error("[Confirm Email] Unexpected error:", error);
			setStatus("error");
			setMessage("An unexpected error occurred. Please try again or request a new confirmation email.");
		}
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		handleConfirm(email, token);
	};

	// Don't render form if page is disabled (redirect will happen)
	if (confirmEmailPageEnabled === false) {
		return null;
	}

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
								width={120}
								height={32}
								className="h-8 w-auto"
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
						{content.confirmAccountTitle ?? "Confirm Your Email"}
					</h1>
					<p className="mt-2 text-sm" style={{ color: "var(--store-text-muted)" }}>
						{content.confirmAccountSubtitle ?? "Click the link in your email or enter your confirmation details below"}
					</p>
				</div>

				{/* Status Messages */}
				{status === "loading" && (
					<div className="auth-status-info mb-4 rounded-xl border px-5 py-5 text-sm shadow-sm">
						<div className="flex items-start gap-4">
							<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: `${branding.colors.primary}15` }}>
								<svg className="h-6 w-6 animate-spin" style={{ color: branding.colors.primary }} fill="none" viewBox="0 0 24 24" aria-hidden>
									<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
									<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
								</svg>
							</div>
							<div className="min-w-0 flex-1 space-y-1">
								<p className="font-semibold" style={{ color: "var(--store-text)" }}>
									{content.confirmAccountCheckingMessage ?? "Confirming your email..."}
								</p>
								<p style={{ color: "var(--store-text-muted)" }}>
									{content.confirmAccountAutoLoginHint ?? "You'll be logged in automatically when verification succeeds. If nothing happens, press the Confirm Account button below."}
								</p>
							</div>
						</div>
					</div>
				)}

				{status === "success" && (
					<div className="state-success mb-4 rounded-lg px-4 py-3 text-sm">
						<div className="flex items-center gap-2">
							<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
							</svg>
							{message}
						</div>
					</div>
				)}

				{status === "error" && (
					<div className="state-error mb-4 rounded-lg px-4 py-3 text-sm">
						<div className="flex flex-wrap items-start gap-2">
							<svg className="h-5 w-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
							</svg>
							<span className="flex-1">
								{message === "LINK_EXPIRED" ? (
									<>
										{content.confirmAccountLinkExpiredError ?? "This confirmation link is invalid or has expired."}
										{" "}
										<Link
											href={`/${channel}/verify-email`}
											className="font-medium underline hover:no-underline"
											style={{ color: branding.colors.primary }}
										>
											{content.confirmAccountRequestNewLink ?? "Request a new confirmation email"}
										</Link>
									</>
								) : message === "UNEXPECTED_ERROR" ? (
									content.confirmAccountUnexpectedError ?? "An unexpected error occurred. Please try again or request a new confirmation email."
								) : (
									message
								)}
							</span>
						</div>
					</div>
				)}

				{/* Confirmation Form */}
				{status !== "success" && (
					<div className="auth-card p-8">
						<form onSubmit={handleSubmit} className="space-y-4">
							<div>
								<label htmlFor="email" className="auth-label mb-1.5 block text-sm font-medium">
									{content.confirmAccountEmailLabel ?? content.emailLabel ?? "Email Address"}
								</label>
								<input
									id="email"
									type="email"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									required
									disabled={!!initialEmail}
									className="auth-input w-full rounded-xl border px-4 py-3 transition-colors disabled:opacity-60"
									placeholder={content.confirmAccountEmailPlaceholder ?? content.emailPlaceholder ?? "you@example.com"}
								/>
							</div>

							<div>
								<label htmlFor="token" className="auth-label mb-1.5 block text-sm font-medium">
									{content.confirmAccountTokenLabel ?? "Confirmation Token"}
								</label>
								<input
									id="token"
									type="text"
									value={token}
									onChange={(e) => setToken(e.target.value)}
									required
									disabled={!!initialToken}
									className="auth-input w-full rounded-xl border px-4 py-3 transition-colors disabled:opacity-60"
									placeholder={content.confirmAccountTokenPlaceholder ?? "Enter token from email"}
								/>
								<p className="mt-1 text-xs" style={{ color: "var(--store-text-muted)" }}>
									{content.confirmAccountTokenHint ?? "The token was sent to your email address"}
								</p>
							</div>

							<button
								type="submit"
								disabled={status === "loading" || !email || !token}
								className="auth-submit w-full rounded-xl px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
								style={{ backgroundColor: branding.colors.primary }}
							>
								{status === "loading" ? (content.confirmAccountConfirmingText ?? "Confirming...") : (content.confirmAccountButton ?? "Confirm Account")}
							</button>
						</form>

						<div className="mt-6 text-center">
							<Link
								href={`/${channel}/login`}
								className="inline-flex items-center gap-1 text-sm font-medium hover:underline"
								style={{ color: branding.colors.primary }}
							>
								<svg className="h-4 w-4 rtl:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
									<path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
								</svg>
								{content.confirmAccountBackToSignIn ?? content.backToSignIn ?? "Back to Sign In"}
							</Link>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
