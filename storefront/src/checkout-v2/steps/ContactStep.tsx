"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useUser } from "@/lib/checkout/UserContext";
import { saleorAuthClient } from "@/ui/components/AuthProvider";
import { getQueryParams } from "@/lib/checkout/url";
import { useCheckoutState } from "../CheckoutStateProvider";
import { useCheckoutText } from "../hooks/useCheckoutText";
import { FormField } from "../components/FormField";
import { contactSchema, type ContactFormValues } from "../schemas";
import { updateEmail } from "../_actions/update-email";
import { syncAuthToCookies, clearAuthCookies } from "@/app/actions";
import { STEP_CONTACT, STEP_SHIPPING } from "../types";

// ---------------------------------------------------------------------------
// GoogleSignInButton — reusable Google OAuth trigger
// ---------------------------------------------------------------------------

function GoogleSignInButton({
	channel,
	label,
}: {
	channel: string;
	label: string;
}) {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	async function handleClick() {
		setLoading(true);
		setError(null);
		try {
			const { getOAuthUrl } = await import(
				"@/app/[channel]/(main)/login/oauth-actions"
			);
			const callbackUrl = `${window.location.origin}/${channel}/auth/callback`;
			const result = await getOAuthUrl("google", callbackUrl, window.location.href);
			if (result.error) {
				setError(result.error);
				setLoading(false);
				return;
			}
			if (result.url) {
				window.location.href = result.url;
			}
		} catch {
			setError("Failed to initiate Google login");
			setLoading(false);
		}
	}

	return (
		<div className="space-y-2">
			<button
				type="button"
				onClick={handleClick}
				disabled={loading}
				className="flex w-full items-center justify-center gap-3 rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 disabled:opacity-50"
			>
				{loading ? (
					<svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
						<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
						<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
					</svg>
				) : (
					<svg className="h-5 w-5" viewBox="0 0 24 24">
						<path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
						<path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
						<path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
						<path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
					</svg>
				)}
				{label}
			</button>
			{error && <p className="text-xs text-red-500">{error}</p>}
		</div>
	);
}

// ---------------------------------------------------------------------------
// Or-divider
// ---------------------------------------------------------------------------

function OrDivider({ text }: { text: string }) {
	return (
		<div className="flex items-center gap-3">
			<div className="h-px flex-1 bg-neutral-200" />
			<span className="text-xs text-neutral-400">{text}</span>
			<div className="h-px flex-1 bg-neutral-200" />
		</div>
	);
}

// ---------------------------------------------------------------------------
// GuestSection — email + optional account creation
// ---------------------------------------------------------------------------

function GuestSection({
	checkoutId,
	channel,
	initialEmail,
	onSignIn,
	onSuccess,
}: {
	checkoutId: string;
	channel: string;
	initialEmail: string;
	onSignIn: () => void;
	onSuccess: (email: string) => void;
}) {
	const t = useCheckoutText();
	const { state, setCheckout, setMutating, setStepErrors, clearStepErrors, completeStepAndAdvance } = useCheckoutState();

	const {
		register,
		handleSubmit,
		watch,
		formState: { errors, isSubmitting },
	} = useForm<ContactFormValues>({
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		resolver: zodResolver(contactSchema) as import("react-hook-form").Resolver<ContactFormValues, any>,
		defaultValues: { email: initialEmail, createAccount: false, password: "" },
	});

	const createAccount = watch("createAccount");

	async function onSubmit(values: ContactFormValues) {
		if (!checkoutId) return;
		setMutating("email");
		clearStepErrors(STEP_CONTACT);

		const result = await updateEmail({ checkoutId, email: values.email });

		if (result.errors?.length) {
			setMutating(null);
			setStepErrors(STEP_CONTACT, result.errors.map((e) => e.message ?? "Unknown error"));
			return;
		}

		// Defer account creation to after order placement (best practice: never interrupt checkout)
		// Use sessionStorage — survives component re-renders between checkout steps
		if (values.createAccount && values.password) {
			sessionStorage.setItem("checkout_pending_account", values.password);
		} else {
			sessionStorage.removeItem("checkout_pending_account");
		}

		setMutating(null);

		// Persist email in checkout state so Edit button re-populates the field
		if (state.checkout) {
			setCheckout({ ...state.checkout, email: values.email });
		}

		onSuccess(values.email);
		completeStepAndAdvance(STEP_CONTACT);
	}

	return (
		<div className="space-y-4">
			<GoogleSignInButton
				channel={channel}
				label={t.continueWithGoogle ?? "Continue with Google"}
			/>
			<OrDivider text={t.orText ?? "or"} />

			<form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
				<FormField
					{...register("email")}
					label={t.guestEmailLabel ?? "Email"}
					type="email"
					autoComplete="email"
					placeholder={t.guestEmailPlaceholder ?? "Enter your email"}
					error={errors.email?.message}
					required
				/>

				<div className="flex items-center gap-2">
					<input
						{...register("createAccount")}
						type="checkbox"
						id="createAccount"
						className="h-4 w-4 rounded border-neutral-300"
					/>
					<label htmlFor="createAccount" className="text-sm text-neutral-700">
						{t.createAccountCheckbox ?? "Create account for faster checkout"}
					</label>
				</div>

				{createAccount && (
					<FormField
						{...register("password")}
						label={t.passwordLabel ?? "Password"}
						type="password"
						autoComplete="new-password"
						placeholder="••••••••"
						hint={t.passwordMinChars ?? "Minimum 8 characters"}
						error={errors.password?.message}
						required
					/>
				)}

				{state.stepErrors.get(STEP_CONTACT)?.map((msg) => (
					<p key={msg} className="text-sm text-red-600" role="alert">
						{msg}
					</p>
				))}

				<div className="flex items-center justify-between gap-4">
					<button
						type="button"
						onClick={onSignIn}
						className="text-sm text-[var(--store-primary,theme(colors.neutral.900))] underline-offset-2 hover:underline"
					>
						{t.alreadyHaveAccount ?? "Already have an account?"}
					</button>

					<button
						type="submit"
						disabled={isSubmitting}
						className="rounded-lg bg-[var(--store-primary,theme(colors.neutral.900))] px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:opacity-90 disabled:opacity-60"
					>
						{isSubmitting ? (t.processingText ?? "Processing…") : (t.continueButtonText ?? "Continue")}
					</button>
				</div>
			</form>
		</div>
	);
}

// ---------------------------------------------------------------------------
// SignInSection — email + password (uses saleorAuthClient directly)
// ---------------------------------------------------------------------------

function SignInSection({
	channel,
	initialEmail,
	onGuestCheckout,
	onSuccess,
	reloadUser,
}: {
	channel: string;
	initialEmail: string;
	onGuestCheckout: () => void;
	onSuccess: (email: string) => void;
	reloadUser: (force?: boolean) => Promise<void>;
}) {
	const t = useCheckoutText();
	const [email, setEmail] = useState(initialEmail);
	const [password, setPassword] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setLoading(true);
		setError(null);

		try {
			const { data } = await saleorAuthClient.signIn(
				{ email, password },
				{ cache: "no-store" },
			);

			const tokenErrors = data?.tokenCreate?.errors;
			if (tokenErrors?.length) {
				setError(tokenErrors[0]?.message ?? "Sign-in failed");
				setLoading(false);
				return;
			}

			if (!data?.tokenCreate?.token) {
				setError("Sign-in failed. Please check your credentials.");
				setLoading(false);
				return;
			}

			// Sync tokens to server-side cookies so that server actions
			// (getCurrentUser, executeGraphQL with auth) can authenticate.
			// Without this, tokens live only in client localStorage/memory
			// and the server auth client can't find them.
			const refreshToken = data.tokenCreate.refreshToken;
			if (refreshToken) {
				await syncAuthToCookies(refreshToken, data.tokenCreate.token);
			}

			// Reload user data NOW — cookies are set so getCurrentUser()
			// will return the user with their saved addresses.
			// NOTE: useAuthChange.onSignedIn may have already fired (race condition)
			// but it ran before cookies were set, so it got null. force=true
			// bypasses the concurrency guard to ensure we get real user data.
			await reloadUser(true);

			setLoading(false);
			onSuccess(email);
		} catch (err) {
			setError("An error occurred. Please try again.");
			setLoading(false);
		}
	}

	return (
		<form onSubmit={handleSubmit} noValidate className="space-y-4">
			<div className="space-y-3">
				<div className="space-y-1">
					<label htmlFor="si-email" className="block text-sm font-medium text-neutral-700">
						{t.guestEmailLabel ?? "Email"}
					</label>
					<input
						id="si-email"
						type="email"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						autoComplete="email"
						required
						className="block w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--store-primary,theme(colors.neutral.900))]"
					/>
				</div>

				<div className="space-y-1">
					<label htmlFor="si-password" className="block text-sm font-medium text-neutral-700">
						{t.passwordLabel ?? "Password"}
					</label>
					<input
						id="si-password"
						type="password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						autoComplete="current-password"
						required
						className="block w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--store-primary,theme(colors.neutral.900))]"
					/>
				</div>
			</div>

			{error && (
				<p className="text-sm text-red-600" role="alert">
					{error}
				</p>
			)}

			<div className="flex items-center justify-between gap-4">
				<button
					type="button"
					onClick={onGuestCheckout}
					className="text-sm text-[var(--store-primary,theme(colors.neutral.900))] underline-offset-2 hover:underline"
				>
					{t.guestCheckoutButton ?? "Guest checkout"}
				</button>

				<button
					type="submit"
					disabled={loading}
					className="rounded-lg bg-[var(--store-primary,theme(colors.neutral.900))] px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:opacity-90 disabled:opacity-60"
				>
					{loading ? (t.processingText ?? "Processing…") : (t.signInButton ?? "Sign in")}
				</button>
			</div>

			<div className="mt-4 space-y-4">
				<OrDivider text={t.orText ?? "or"} />
				<GoogleSignInButton
					channel={channel}
					label={t.signInWithGoogle ?? "Sign in with Google"}
				/>
			</div>
		</form>
	);
}

// ---------------------------------------------------------------------------
// SignedInSection — show user email + sign-out + continue
// ---------------------------------------------------------------------------

function SignedInSection({
	onSignOut,
	onContinue,
	fallbackEmail,
}: {
	onSignOut: () => void;
	onContinue: () => void;
	fallbackEmail?: string;
}) {
	const t = useCheckoutText();
	const { user } = useUser();

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3">
				<div>
					<p className="text-xs text-neutral-500">{t.accountLabel ?? "Account"}</p>
					<p className="text-sm font-medium text-neutral-900">{user?.email ?? fallbackEmail}</p>
				</div>
				<button
					type="button"
					onClick={onSignOut}
					className="text-sm text-neutral-500 underline-offset-2 hover:underline"
				>
					{t.signOutButton ?? "Sign out"}
				</button>
			</div>

			<div className="flex justify-end">
				<button
					type="button"
					onClick={onContinue}
					className="rounded-lg bg-[var(--store-primary,theme(colors.neutral.900))] px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:opacity-90"
				>
					{t.continueButtonText ?? "Continue"}
				</button>
			</div>
		</div>
	);
}

// ---------------------------------------------------------------------------
// ResetPasswordSection — password reset via URL token
// ---------------------------------------------------------------------------

function ResetPasswordSection({ onBack }: { onBack: () => void }) {
	const t = useCheckoutText();

	return (
		<div className="space-y-4">
			<p className="text-sm text-neutral-600">
				{t.provideNewPasswordText ?? "Provide a new password for your account"}
			</p>
			<div className="rounded-lg border border-dashed border-neutral-200 p-6 text-center text-sm text-neutral-400">
				Password reset form — integrates with existing reset flow
			</div>
			<button
				type="button"
				onClick={onBack}
				className="text-sm text-[var(--store-primary,theme(colors.neutral.900))] underline-offset-2 hover:underline"
			>
				{t.rememberedPasswordText ?? "Remembered your password?"}
			</button>
		</div>
	);
}

// ---------------------------------------------------------------------------
// Main ContactStep — 4-state machine
// ---------------------------------------------------------------------------

interface ContactStepProps {
	checkoutId: string;
	channel: string;
}

export function ContactStep({ checkoutId, channel }: ContactStepProps) {
	const { user, authenticated, reload: reloadUser } = useUser();
	const { state, dispatch, setMutating, completeStepAndAdvance } = useCheckoutState();

	const passwordResetToken = getQueryParams().passwordResetToken;
	const [passwordResetShown, setPasswordResetShown] = useState(false);
	const [email, setEmail] = useState(user?.email ?? state.checkout?.email ?? "");
	const prevAuthRef = useRef<boolean | undefined>(undefined);

	// Sync email from auth when user data arrives asynchronously
	useEffect(() => {
		if (user?.email && !email) {
			setEmail(user.email);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [user?.email]);

	const selectInitial = (): "guest" | "signIn" | "signedIn" | "resetPassword" => {
		if (passwordResetToken && !passwordResetShown) return "resetPassword";
		return user ? "signedIn" : "guest";
	};

	const [section, setSection] = useState<"guest" | "signIn" | "signedIn" | "resetPassword">(
		selectInitial,
	);

	// Sync section when auth state changes (sign-in/out detected via useAuthChange)
	useEffect(() => {
		if (prevAuthRef.current !== authenticated) {
			prevAuthRef.current = authenticated;
			if (authenticated && section !== "signedIn") setSection("signedIn");
			else if (!authenticated && section === "signedIn") setSection("guest");
		}
	}, [authenticated, section]);

	useEffect(() => {
		if (section === "resetPassword") setPasswordResetShown(true);
	}, [section]);

	async function handleSignOut() {
		// Clear server-side auth cookies first, then client-side tokens
		await clearAuthCookies();
		saleorAuthClient.signOut();
		// Reset checkout state — user needs to re-enter contact info,
		// and shipping step loses saved addresses so uncomplete it too
		dispatch({ type: "UNCOMPLETE_STEP", step: STEP_CONTACT });
		dispatch({ type: "UNCOMPLETE_STEP", step: STEP_SHIPPING });
		dispatch({ type: "OPEN_STEP", step: STEP_CONTACT });
		setSection("guest");
	}

	async function handleSignedInContinue() {
		// Update checkout email to the authenticated user's email
		const userEmail = user?.email ?? email;
		if (userEmail && checkoutId) {
			setMutating("email");
			await updateEmail({ checkoutId, email: userEmail });
			setMutating(null);
		}
		completeStepAndAdvance(STEP_CONTACT);
	}

	return (
		<div>
			{section === "guest" && (
				<GuestSection
					checkoutId={checkoutId}
					channel={channel}
					initialEmail={email}
					onSignIn={() => setSection("signIn")}
					onSuccess={(e) => setEmail(e)}
				/>
			)}

			{section === "signIn" && (
				<SignInSection
					channel={channel}
					initialEmail={email}
					onGuestCheckout={() => setSection("guest")}
					reloadUser={reloadUser}
					onSuccess={(e) => {
						setEmail(e);
						setSection("signedIn");
					}}
				/>
			)}

			{section === "signedIn" && (
				<SignedInSection
					onSignOut={handleSignOut}
					onContinue={handleSignedInContinue}
					fallbackEmail={email}
				/>
			)}

			{section === "resetPassword" && (
				<ResetPasswordSection onBack={() => setSection("signIn")} />
			)}
		</div>
	);
}

/** Collapsed summary shown in AccordionStep header */
export function ContactSummary({ email }: { email: string }) {
	return <span className="truncate">{email}</span>;
}
