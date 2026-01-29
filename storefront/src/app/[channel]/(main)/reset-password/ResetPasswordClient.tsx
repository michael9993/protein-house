"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { saleorAuthClient } from "@/ui/components/AuthProvider";
import { useBranding, useStoreInfo, useContentConfig } from "@/providers/StoreConfigProvider";

interface ResetPasswordClientProps {
	channel: string;
	email: string | null;
	token: string | null;
}

export function ResetPasswordClient({ channel, email, token }: ResetPasswordClientProps) {
	const [error, setError] = useState<string | null>(null);
	const [isPending, startTransition] = useTransition();
	const router = useRouter();
	const branding = useBranding();
	const store = useStoreInfo();
	const content = useContentConfig();

	const focusRingColor = `${branding.colors.primary}33`;
	const invalidLink = !email?.trim() || !token?.trim();

	const handleSubmit = async (formData: FormData) => {
		if (invalidLink) return;
		setError(null);
		const password = formData.get("password")?.toString();
		const confirmPassword = formData.get("confirmPassword")?.toString();
		if (!password || password.length < 8) {
			setError(content.account.passwordTooShortError);
			return;
		}
		if (password !== confirmPassword) {
			setError(content.account.passwordMismatchError);
			return;
		}
		startTransition(async () => {
			try {
				await saleorAuthClient.resetPassword({ email: email!, token: token!, password });
				router.push(`/${channel}/login`);
				router.refresh();
			} catch (err) {
				const message = (err as { message?: string })?.message ?? content.account.resetLinkExpiredError ?? "Reset link is invalid or has expired. Please request a new one.";
				setError(message);
			}
		});
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
						{content.account.resetPasswordTitle ?? "Set new password"}
					</h1>
					<p className="mt-2" style={{ color: "var(--store-text-muted)" }}>
						{content.account.resetPasswordSubtitle ?? "Enter your new password below."}
					</p>
				</div>

				<div
					className="rounded-2xl p-8 shadow-lg ring-1 animate-fade-in-up"
					style={{
						animationDelay: "200ms",
						animationFillMode: "both",
						backgroundColor: "var(--store-bg)",
					} as React.CSSProperties}
				>
					{invalidLink ? (
						<>
							<div className="state-error mb-4 rounded-lg px-4 py-3 text-sm">
								<p className="font-medium">
									{content.account.invalidResetLinkMessage ?? "Invalid or expired link. Please request a new password reset."}
								</p>
							</div>
							<div className="flex flex-col gap-3">
								<Link
									href={`/${channel}/forgot-password`}
									className="flex w-full items-center justify-center rounded-lg py-3.5 text-base font-semibold text-white transition-all hover:opacity-90"
									style={{ backgroundColor: branding.colors.primary }}
								>
									{content.account.sendResetLinkButton ?? "Send reset link"}
								</Link>
								<Link
									href={`/${channel}/login`}
									className="text-center text-sm font-medium hover:underline"
									style={{ color: branding.colors.primary }}
								>
									{content.account.signInButton} ←
								</Link>
							</div>
						</>
					) : (
						<>
							{error && (
								<div className="state-error mb-4 rounded-lg px-4 py-3 text-sm">
									<p className="font-medium">{error}</p>
								</div>
							)}
							<form action={handleSubmit} className="space-y-4">
								<div>
									<label htmlFor="password" className="auth-label mb-1.5 block text-sm font-medium">
										{content.account.newPasswordLabel ?? "New password"}
									</label>
									<input
										id="password"
										name="password"
										type="password"
										required
										minLength={8}
										autoComplete="new-password"
										className="auth-input w-full rounded-lg border px-4 py-3 transition-colors"
										placeholder={content.account.newPasswordPlaceholder ?? "Enter new password"}
									/>
								</div>
								<div>
									<label htmlFor="confirmPassword" className="auth-label mb-1.5 block text-sm font-medium">
										{content.account.confirmPasswordLabel}
									</label>
									<input
										id="confirmPassword"
										name="confirmPassword"
										type="password"
										required
										minLength={8}
										autoComplete="new-password"
										className="auth-input w-full rounded-lg border px-4 py-3 transition-colors"
										placeholder={content.account.confirmPasswordPlaceholder}
									/>
								</div>
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
										content.account.resetPasswordTitle ?? "Set new password"
									)}
								</button>
							</form>
							<p className="mt-6 text-center text-sm" style={{ color: "var(--store-text-muted)" }}>
								<Link href={`/${channel}/login`} className="font-medium hover:underline" style={{ color: branding.colors.primary }}>
									{content.account.signInButton} ←
								</Link>
							</p>
						</>
					)}
				</div>
			</div>
		</div>
	);
}
