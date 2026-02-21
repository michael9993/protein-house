"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { saleorAuthClient } from "@/ui/components/AuthProvider";
import { useBranding, useStoreInfo, useContentConfig, usePageEnabled } from "@/providers/StoreConfigProvider";

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
	const resetPasswordEnabled = usePageEnabled("resetPassword");

	if (!resetPasswordEnabled) {
		return (
			<div className="flex min-h-[50vh] items-center justify-center">
				<p className="text-lg text-neutral-500">This page is not available.</p>
			</div>
		);
	}

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
		<div className="auth-page flex min-h-[calc(100vh-200px)] items-center justify-center px-4 py-12">
			<div className="w-full max-w-md">
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
						{content.account.resetPasswordTitle ?? "Set new password"}
					</h1>
					<p className="mt-2 text-sm" style={{ color: "var(--store-text-muted)" }}>
						{content.account.resetPasswordSubtitle ?? "Enter your new password below."}
					</p>
				</div>

				<div className="auth-card p-8">
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
									className="auth-submit flex w-full items-center justify-center rounded-xl py-3.5 text-base font-semibold text-white"
									style={{ backgroundColor: branding.colors.primary }}
								>
									{content.account.sendResetLinkButton ?? "Send reset link"}
								</Link>
								<p className="text-center">
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
								</p>
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
										className="auth-input w-full rounded-xl border px-4 py-3 transition-colors"
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
										className="auth-input w-full rounded-xl border px-4 py-3 transition-colors"
										placeholder={content.account.confirmPasswordPlaceholder}
									/>
								</div>
								<button
									type="submit"
									disabled={isPending}
									className="auth-submit flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-base font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
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
								<Link href={`/${channel}/login`} className="inline-flex items-center gap-1 font-medium hover:underline" style={{ color: branding.colors.primary }}>
									<svg className="h-4 w-4 rtl:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
										<path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
									</svg>
									{content.account.backToSignIn ?? "Back to Sign In"}
								</Link>
							</p>
						</>
					)}
				</div>
			</div>
		</div>
	);
}
