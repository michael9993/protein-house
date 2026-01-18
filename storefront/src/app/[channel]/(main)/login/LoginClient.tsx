"use client";

import { useState, useTransition, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useBranding, useStoreInfo, useContentConfig } from "@/providers/StoreConfigProvider";
import { loginAction, registerAction } from "./actions";
import { getOAuthUrl } from "./oauth-actions";

interface LoginClientProps {
	channel: string;
	redirectUrl?: string;
	initialError?: string;
	confirmed?: boolean;
	initialEmail?: string;
	autoResend?: boolean;
}

export function LoginClient({ channel, redirectUrl, initialError, confirmed, initialEmail, autoResend }: LoginClientProps) {
	const [isLogin, setIsLogin] = useState(true);
	const [error, setError] = useState<string | null>(initialError || null);
	const [showSuccess, setShowSuccess] = useState(confirmed || false);
	const [showPassword, setShowPassword] = useState(false);
	const [isPending, startTransition] = useTransition();
	const router = useRouter();
	const branding = useBranding();
	const store = useStoreInfo();
	const content = useContentConfig();

	// Auto-hide success message after 5 seconds
	useEffect(() => {
		if (showSuccess) {
			const timer = setTimeout(() => setShowSuccess(false), 5000);
			return () => clearTimeout(timer);
		}
	}, [showSuccess]);

	// Auto-resend email after successful login if requested
	useEffect(() => {
		if (autoResend && initialEmail) {
			// This will be handled after login success
		}
	}, [autoResend, initialEmail]);

	const handleSubmit = async (formData: FormData) => {
		setError(null);
		
		// If registering, store password temporarily for auto-login after confirmation
		if (!isLogin) {
			const password = formData.get("password")?.toString();
			const email = formData.get("email")?.toString();
			if (password && email) {
				try {
					// Store with multiple keys to handle URL encoding issues
					const normalizedEmail = email.toLowerCase().trim();
					sessionStorage.setItem(`pending_confirmation_${normalizedEmail}`, password);
					// Also store with original email (in case it's used as-is)
					sessionStorage.setItem(`pending_confirmation_${email}`, password);
					console.log("[Register] ✅ Stored password temporarily for auto-login after confirmation");
				} catch (e) {
					console.warn("[Register] Could not store password in sessionStorage:", e);
				}
			}
		}
		
		// Add channel to FormData for cart merge
		formData.append("channel", channel);
		
		startTransition(async () => {
			const action = isLogin ? loginAction : registerAction;
			const result = await action(formData);

			if (result.error) {
				setError(result.error);
			} else if (result.success) {
				// If email confirmation is required, redirect to verification page
				if ((result as any).requiresConfirmation && (result as any).email) {
					router.push(`/${channel}/verify-email?email=${encodeURIComponent((result as any).email)}`);
					return;
				}
				
				// If auto-resend was requested, redirect to verify-email page to trigger resend
				if (autoResend && initialEmail) {
					router.push(`/${channel}/verify-email?email=${encodeURIComponent(initialEmail)}&autoResend=true`);
					return;
				}
				
				// Dispatch login event for wishlist to reload
				window.dispatchEvent(new CustomEvent("wishlist:login"));
				
				// Small delay to ensure cookies are set before navigation
				// This helps the wishlist load correctly after login
				await new Promise(resolve => setTimeout(resolve, 100));
				router.push(redirectUrl || `/${channel}`);
				router.refresh();
			}
		});
	};

	// Create focus ring color with transparency
	const focusRingColor = `${branding.colors.primary}33`; // 20% opacity

	return (
		<div className="flex min-h-[calc(100vh-200px)] items-center justify-center px-4 py-12 animate-fade-in">
			{/* Inject dynamic focus styles */}
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
					{isLogin ? content.account.signInTitle : content.account.signUpTitle}
				</h1>
				<p className="mt-2" style={{ color: "var(--store-text-muted)" }}>
					{isLogin 
						? content.account.signInSubtitle 
						: content.account.signUpSubtitle}
				</p>
				</div>

				{/* Form Card */}
				<div 
					className="rounded-2xl p-8 shadow-lg ring-1 animate-fade-in-up" 
					style={{ 
						animationDelay: "200ms", 
						animationFillMode: "both",
						backgroundColor: "var(--store-bg)",
					} as React.CSSProperties}
				>
					{/* Tab Switcher */}
					<div className="mb-6 flex rounded-lg p-1" style={{ backgroundColor: "var(--store-neutral-100)" }}>
						<button
							type="button"
							onClick={() => { setIsLogin(true); setError(null); }}
							className="flex-1 rounded-md py-2.5 text-sm font-medium transition-all"
							style={{
								backgroundColor: isLogin ? "var(--store-bg)" : "transparent",
								color: isLogin ? "var(--store-text)" : "var(--store-text-muted)",
								boxShadow: isLogin ? "0 1px 2px 0 rgb(0 0 0 / 0.05)" : "none"
							}}
						>
							{content.account.signInButton}
						</button>
						<button
							type="button"
							onClick={() => { setIsLogin(false); setError(null); }}
							className="flex-1 rounded-md py-2.5 text-sm font-medium transition-all"
							style={{
								backgroundColor: !isLogin ? "var(--store-bg)" : "transparent",
								color: !isLogin ? "var(--store-text)" : "var(--store-text-muted)",
								boxShadow: !isLogin ? "0 1px 2px 0 rgb(0 0 0 / 0.05)" : "none"
							}}
						>
							{content.account.signUpButton}
						</button>
					</div>

					{/* Success Message (Email Confirmed) */}
					{showSuccess && (
						<div className="state-success mb-4 rounded-lg px-4 py-3 text-sm">
							<div className="flex items-start gap-2">
								<svg className="h-5 w-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
								</svg>
								<div className="flex-1">
									<p className="font-medium">{content.account.emailConfirmedMessage}</p>
									<p className="mt-1 text-xs opacity-80">
										{content.account.canNowSignIn}
									</p>
								</div>
								<button
									type="button"
									onClick={() => setShowSuccess(false)}
									className="opacity-70 hover:opacity-100"
								>
									<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
									</svg>
								</button>
							</div>
						</div>
					)}

					{/* Error Message */}
					{error && (
						<div className="state-error mb-4 rounded-lg px-4 py-3 text-sm">
							<div className="flex items-start gap-2">
								<svg className="h-5 w-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
								</svg>
								<div className="flex-1">
									<p className="font-medium">{error}</p>
									{error.includes("Account already exists") && (
										<div className="mt-2">
											<p className="text-xs opacity-80 mb-2">
												{content.account.accountExistsMessage}
											</p>
											<button
												type="button"
												onClick={() => {
													setIsLogin(true);
													setError(null);
												}}
												className="text-xs font-medium underline hover:opacity-80"
											>
												{content.account.switchToSignIn}
											</button>
										</div>
									)}
								</div>
							</div>
						</div>
					)}

					<form action={handleSubmit} className="space-y-4">
						{/* Name Fields (Sign Up Only) */}
						{!isLogin && (
							<div className="grid grid-cols-2 gap-4">
								<div>
									<label htmlFor="firstName" className="auth-label mb-1.5 block text-sm font-medium">
										{content.account.firstNameLabel}
									</label>
								<input
									id="firstName"
									name="firstName"
									type="text"
									required={!isLogin}
									className="auth-input w-full rounded-lg border px-4 py-3 transition-colors"
									placeholder="John"
								/>
								</div>
								<div>
									<label htmlFor="lastName" className="auth-label mb-1.5 block text-sm font-medium">
										{content.account.lastNameLabel}
									</label>
								<input
									id="lastName"
									name="lastName"
									type="text"
									required={!isLogin}
									className="auth-input w-full rounded-lg border px-4 py-3 transition-colors"
									placeholder="Doe"
								/>
								</div>
							</div>
						)}

						{/* Email */}
						<div>
							<label htmlFor="email" className="auth-label mb-1.5 block text-sm font-medium">
								{content.account.emailLabel}
							</label>
							<input
								id="email"
								name="email"
								type="email"
								required
								autoComplete="email"
								defaultValue={initialEmail || ""}
								className="auth-input w-full rounded-lg border px-4 py-3 transition-colors"
								placeholder={content.account.emailPlaceholder}
							/>
						</div>

						{/* Password */}
						<div>
							<div className="mb-1.5 flex items-center justify-between">
								<label htmlFor="password" className="auth-label text-sm font-medium">
									{content.account.passwordLabel}
								</label>
								{isLogin && (
									<Link 
										href={`/${channel}/forgot-password`}
										className="text-sm font-medium hover:underline"
										style={{ color: branding.colors.primary }}
									>
										{content.account.forgotPasswordLink}
									</Link>
								)}
							</div>
							<div className="relative">
								<input
									id="password"
									name="password"
									type={showPassword ? "text" : "password"}
									required
									minLength={8}
									autoComplete={isLogin ? "current-password" : "new-password"}
									className="auth-input w-full rounded-lg border px-4 py-3 pe-12 transition-colors"
									placeholder={content.account.passwordPlaceholder}
								/>
								<button
									type="button"
									onClick={() => setShowPassword(!showPassword)}
									className="absolute right-3 top-1/2 -translate-y-1/2"
									style={{ color: "var(--store-neutral-400)" }}
								>
									{showPassword ? (
										<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
										</svg>
									) : (
										<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
										</svg>
									)}
								</button>
							</div>
						</div>

						{/* Confirm Password (Sign Up Only) */}
						{!isLogin && (
							<div>
								<label htmlFor="confirmPassword" className="auth-label mb-1.5 block text-sm font-medium">
									{content.account.confirmPasswordLabel}
								</label>
								<input
									id="confirmPassword"
									name="confirmPassword"
									type="password"
									required={!isLogin}
									minLength={8}
									autoComplete="new-password"
									className="auth-input w-full rounded-lg border px-4 py-3 transition-colors"
									placeholder={content.account.confirmPasswordPlaceholder}
								/>
							</div>
						)}

						{/* Submit Button */}
						<button
							type="submit"
							disabled={isPending}
							className="flex w-full items-center justify-center gap-2 rounded-lg py-3.5 text-base font-semibold text-white transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
							style={{ backgroundColor: branding.colors.primary }}
						>
							{isPending ? (
								<>
									<svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
										<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
										<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
									</svg>
									{content.account.processingText}
								</>
							) : (
								<>
									{isLogin ? content.account.signInButton : content.account.createAccountButton}
									<svg className="h-5 w-5 rtl:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
									</svg>
								</>
							)}
						</button>
					</form>

					{/* Divider */}
					<div className="my-6 flex items-center gap-4">
						<div className="h-px flex-1" style={{ backgroundColor: "var(--store-neutral-200)" }} />
						<span className="text-sm" style={{ color: "var(--store-text-muted)" }}>{content.account.orContinueWith}</span>
						<div className="h-px flex-1" style={{ backgroundColor: "var(--store-neutral-200)" }} />
					</div>

					{/* Social Login */}
					<div className="flex justify-center">
						<SocialLoginButton
							provider="google"
							channel={channel}
							redirectUrl={redirectUrl}
							onError={(msg) => setError(msg)}
						/>
					</div>
				</div>

				{/* Benefits */}
				<div 
					className="mt-8 rounded-xl p-6 animate-fade-in-up" 
					style={{ 
						animationDelay: "250ms", 
						animationFillMode: "both",
						backgroundColor: "var(--store-surface)"
					}}
				>
					<h3 className="mb-4 text-sm font-semibold" style={{ color: "var(--store-text)" }}>{content.account.whyCreateAccount}</h3>
					<ul className="space-y-3">
						{[
							{ icon: "🚀", text: content.account.benefitFasterCheckout },
							{ icon: "📦", text: content.account.benefitTrackOrders },
							{ icon: "❤️", text: content.account.benefitWishlist },
							{ icon: "🎁", text: content.account.benefitDiscounts },
						].map((benefit, index) => (
							<li key={index} className="flex items-center gap-3 text-sm" style={{ color: "var(--store-text-muted)" }}>
								<span className="text-lg">{benefit.icon}</span>
								{benefit.text}
							</li>
						))}
					</ul>
				</div>

				{/* Terms */}
				<p className="mt-6 text-center text-xs" style={{ color: "var(--store-text-muted)" }}>
					{content.account.termsAgreement}{" "}
					<Link href={`/${channel}/pages/terms-of-service`} className="underline hover:opacity-80">
						{content.account.termsOfService}
					</Link>{" "}
					and{" "}
					<Link href={`/${channel}/pages/privacy-policy`} className="underline hover:opacity-80">
						{content.account.privacyPolicy}
					</Link>
				</p>
			</div>
		</div>
	);
}

/**
 * Social Login Button Component
 * Handles Google and Facebook OAuth login
 */
function SocialLoginButton({
	provider,
	channel,
	redirectUrl,
	onError,
}: {
	provider: "google" | "facebook";
	channel: string;
	redirectUrl?: string;
	onError: (message: string) => void;
}) {
	const [isLoading, setIsLoading] = useState(false);

	const handleSocialLogin = async () => {
		setIsLoading(true);
		try {
			// Only Google is supported via OpenID Connect plugin
			if (provider !== "google") {
				onError("Only Google login is currently supported");
				setIsLoading(false);
				return;
			}

			// Build redirect URL for OAuth callback
			// Saleor will redirect here after processing OAuth
			const callbackUrl = `${window.location.origin}/${channel}/auth/callback`;
			
			// Build the final redirect URL after OAuth (where to send user after login)
			const finalRedirectUrl = redirectUrl || `/${channel}`;
			
			const result = await getOAuthUrl("google", callbackUrl, finalRedirectUrl);

			if (result.error) {
				console.error(`${provider} login error:`, result.error);
				onError(result.error);
				setIsLoading(false);
				return;
			}

			// Validate URL before redirecting
			if (result.url && typeof result.url === "string" && result.url.startsWith("http")) {
				// Redirect to OAuth provider (via Saleor)
				window.location.href = result.url;
			} else {
				console.error(`${provider} invalid URL:`, result.url);
				onError(`Invalid OAuth URL received. Please contact support.`);
				setIsLoading(false);
			}
		} catch (error) {
			console.error(`${provider} login error:`, error);
			onError(`Failed to initiate ${provider} login. Please try again.`);
			setIsLoading(false);
		}
	};

	const providers = {
		google: {
			name: "Google",
			icon: (
				<svg className="h-5 w-5" viewBox="0 0 24 24">
					<path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
					<path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
					<path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
					<path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
				</svg>
			),
		},
		facebook: {
			name: "Facebook",
			icon: (
				<svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
					<path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
				</svg>
			),
		},
	};

	const providerInfo = providers[provider];

	return (
		<button
			type="button"
			onClick={handleSocialLogin}
			disabled={isLoading}
			className="flex items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50"
			style={provider === "facebook" 
				? { borderColor: "#1877F2", color: "#1877F2" }
				: { borderColor: "var(--store-neutral-200)", color: "var(--store-neutral-700)" }
			}
		>
			{isLoading ? (
				<svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
					<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
					<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
				</svg>
			) : (
				providerInfo.icon
			)}
			{providerInfo.name}
		</button>
	);
}
