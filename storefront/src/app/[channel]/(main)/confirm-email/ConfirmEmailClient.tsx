"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { storeConfig } from "@/config";

interface ConfirmEmailClientProps {
	channel: string;
	email?: string;
	token?: string;
}

export function ConfirmEmailClient({ channel, email: initialEmail, token: initialToken }: ConfirmEmailClientProps) {
	const router = useRouter();
	const searchParams = useSearchParams();
	const { branding, store } = storeConfig;
	
	const [email, setEmail] = useState(initialEmail || "");
	const [token, setToken] = useState(initialToken || "");
	const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
	const [message, setMessage] = useState<string | null>(null);

	// If email and token are in URL, auto-confirm
	useEffect(() => {
		const urlEmail = searchParams.get("email");
		const urlToken = searchParams.get("token");
		
		// Use props if available, otherwise use URL params
		const emailToUse = initialEmail || urlEmail;
		const tokenToUse = initialToken || urlToken;
		
		if (emailToUse && tokenToUse && status === "idle") {
			// Decode URL parameters (they might be encoded)
			const decodedEmail = decodeURIComponent(emailToUse);
			const decodedToken = decodeURIComponent(tokenToUse);
			
			setEmail(decodedEmail);
			setToken(decodedToken);
			handleConfirm(decodedEmail, decodedToken);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [searchParams, initialEmail, initialToken]);

	const handleConfirm = async (confirmEmail: string, confirmToken: string) => {
		if (!confirmEmail || !confirmToken) {
			setStatus("error");
			setMessage("Email and token are required");
			return;
		}

		// Ensure email and token are properly decoded
		// Use try-catch in case they're already decoded
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
		setMessage("Confirming your account...");

		try {
			// Use the new confirm-and-login action that automatically logs the user in
			const { confirmAndLoginAction } = await import("./actions");
			const result = await confirmAndLoginAction(decodedEmail, decodedToken, channel);
			
			console.log("[Confirm Email] Result:", { success: result.success, error: result.error });

			if (!result.success) {
				setStatus("error");
				let errorMessage = result.error || "Failed to confirm account";
				
				// Provide helpful error messages
				if (errorMessage.includes("Invalid") || errorMessage.includes("expired")) {
					errorMessage = "This confirmation link is invalid or has expired. Please request a new confirmation email.";
				} else if (errorMessage.includes("already")) {
					errorMessage = "This account has already been confirmed. Redirecting to login...";
					// If already confirmed, try to login anyway (endpoint will return tokens)
					setTimeout(() => {
						router.push(`/${channel}/login?confirmed=true`);
					}, 2000);
					return;
				}
				
				setMessage(errorMessage);
				return;
			}

			// Success - user is already logged in via tokens!
			setStatus("success");
			setMessage("Account confirmed and logged in! Redirecting...");
			
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

	return (
		<div className="flex min-h-[calc(100vh-200px)] items-center justify-center px-4 py-12">
			<div className="w-full max-w-md">
				{/* Logo */}
				<div className="mb-8 text-center">
					<Link 
						href={`/${channel}`} 
						className="inline-flex items-center gap-2 text-2xl font-bold"
						style={{ color: branding.colors.primary }}
					>
						<svg className="h-10 w-10" viewBox="0 0 24 24" fill="currentColor">
							<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
						</svg>
						{store.name}
					</Link>
					<h1 className="mt-6 text-2xl font-bold text-neutral-900">
						Confirm Your Email
					</h1>
					<p className="mt-2 text-neutral-600">
						Click the link in your email or enter your confirmation details below
					</p>
				</div>

				{/* Status Messages */}
				{status === "loading" && (
					<div className="mb-4 flex items-center gap-2 rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-600">
						<svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
							<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
							<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
						</svg>
						{message}
					</div>
				)}

				{status === "success" && (
					<div className="mb-4 flex items-center gap-2 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-600">
						<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
						</svg>
						{message}
					</div>
				)}

				{status === "error" && (
					<div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
						<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
						{message}
					</div>
				)}

				{/* Confirmation Form */}
				{status !== "success" && (
					<div className="rounded-2xl bg-white p-8 shadow-lg ring-1 ring-neutral-100">
						<form onSubmit={handleSubmit} className="space-y-4">
							<div>
								<label htmlFor="email" className="mb-1.5 block text-sm font-medium text-neutral-700">
									Email Address
								</label>
								<input
									id="email"
									type="email"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									required
									disabled={!!initialEmail}
									className="w-full rounded-lg border border-neutral-200 px-4 py-3 text-neutral-900 placeholder-neutral-400 transition-colors focus:border-[#FF5722] focus:outline-none focus:ring-2 focus:ring-[#FF5722]/20 disabled:bg-neutral-50 disabled:text-neutral-500"
									placeholder="you@example.com"
								/>
							</div>

							<div>
								<label htmlFor="token" className="mb-1.5 block text-sm font-medium text-neutral-700">
									Confirmation Token
								</label>
								<input
									id="token"
									type="text"
									value={token}
									onChange={(e) => setToken(e.target.value)}
									required
									disabled={!!initialToken}
									className="w-full rounded-lg border border-neutral-200 px-4 py-3 text-neutral-900 placeholder-neutral-400 transition-colors focus:border-[#FF5722] focus:outline-none focus:ring-2 focus:ring-[#FF5722]/20 disabled:bg-neutral-50 disabled:text-neutral-500"
									placeholder="Enter token from email"
								/>
								<p className="mt-1 text-xs text-neutral-500">
									The token was sent to your email address
								</p>
							</div>

							<button
								type="submit"
								disabled={status === "loading" || !email || !token}
								className="w-full rounded-lg px-4 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
								style={{ backgroundColor: branding.colors.primary }}
							>
								{status === "loading" ? "Confirming..." : "Confirm Account"}
							</button>
						</form>

						<div className="mt-6 text-center">
							<Link
								href={`/${channel}/login`}
								className="text-sm font-medium text-neutral-600 hover:text-neutral-900"
								style={{ color: branding.colors.primary }}
							>
								Back to Sign In
							</Link>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}

