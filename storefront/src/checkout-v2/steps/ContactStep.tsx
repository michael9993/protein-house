"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useUser } from "@/lib/checkout/UserContext";
import { getQueryParams } from "@/lib/checkout/url";
import { useCheckoutState } from "../CheckoutStateProvider";
import { useCheckoutText } from "../hooks/useCheckoutText";
import { FormField } from "../components/FormField";
import { contactSchema, type ContactFormValues } from "../schemas";
import { updateEmail } from "../_actions/update-email";
import { STEP_CONTACT } from "../types";

// ---------------------------------------------------------------------------
// GuestSection — email + optional account creation
// ---------------------------------------------------------------------------

function GuestSection({
	checkoutId,
	initialEmail,
	onSignIn,
	onSuccess,
}: {
	checkoutId: string;
	initialEmail: string;
	onSignIn: () => void;
	onSuccess: (email: string) => void;
}) {
	const t = useCheckoutText();
	const { state, setCheckout, setMutating, setStepErrors, completeStepAndAdvance } = useCheckoutState();

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

		const result = await updateEmail({ checkoutId, email: values.email });

		setMutating(null);

		if (result.errors?.length) {
			setStepErrors(STEP_CONTACT, result.errors.map((e) => e.message ?? "Unknown error"));
			return;
		}

		// Persist email in checkout state so Edit button re-populates the field
		if (state.checkout) {
			setCheckout({ ...state.checkout, email: values.email });
		}

		onSuccess(values.email);
		completeStepAndAdvance(STEP_CONTACT);
	}

	return (
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
	);
}

// ---------------------------------------------------------------------------
// SignInSection — email + password
// ---------------------------------------------------------------------------

function SignInSection({
	initialEmail,
	onGuestCheckout,
	onSuccess,
}: {
	initialEmail: string;
	onGuestCheckout: () => void;
	onSuccess: () => void;
}) {
	const t = useCheckoutText();
	const [email, setEmail] = useState(initialEmail);
	const [password, setPassword] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	// signIn is provided by the auth SDK's useUser hook
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const userCtx = useUser() as any;
	const signIn = userCtx?.signIn as
		| ((e: string, p: string) => Promise<{ errors?: { message: string }[] }>)
		| undefined;

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!signIn) return;
		setLoading(true);
		setError(null);

		const result = await signIn(email, password);
		setLoading(false);

		if (result.errors?.length) {
			setError(result.errors[0]?.message ?? "Sign-in failed");
			return;
		}

		onSuccess();
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
		</form>
	);
}

// ---------------------------------------------------------------------------
// SignedInSection — show user email + sign-out + continue
// ---------------------------------------------------------------------------

function SignedInSection({
	onSignOut,
	onContinue,
}: {
	onSignOut: () => void;
	onContinue: () => void;
}) {
	const t = useCheckoutText();
	const { user } = useUser();

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3">
				<div>
					<p className="text-xs text-neutral-500">{t.accountLabel ?? "Account"}</p>
					<p className="text-sm font-medium text-neutral-900">{user?.email}</p>
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
}

export function ContactStep({ checkoutId }: ContactStepProps) {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const userCtx = useUser() as any;
	const user = userCtx?.user as { email?: string } | null | undefined;
	const authenticated: boolean = userCtx?.authenticated ?? false;
	const signOut = userCtx?.signOut as (() => Promise<void>) | undefined;

	const { state, completeStepAndAdvance } = useCheckoutState();

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

	// Sync section when auth state changes
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
		await signOut?.();
		setSection("guest");
	}

	function handleSignedInContinue() {
		completeStepAndAdvance(STEP_CONTACT);
	}

	return (
		<div>
			{section === "guest" && (
				<GuestSection
					checkoutId={checkoutId}
					initialEmail={email}
					onSignIn={() => setSection("signIn")}
					onSuccess={(e) => setEmail(e)}
				/>
			)}

			{section === "signIn" && (
				<SignInSection
					initialEmail={email}
					onGuestCheckout={() => setSection("guest")}
					onSuccess={() => setSection("signedIn")}
				/>
			)}

			{section === "signedIn" && (
				<SignedInSection
					onSignOut={handleSignOut}
					onContinue={handleSignedInContinue}
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
