import React, { useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/checkout/components/Button";
import { PasswordInput } from "@/checkout/components/PasswordInput";
import { TextInput } from "@/checkout/components/TextInput";
import { useSignInForm } from "@/checkout/sections/SignIn/useSignInForm";
import { usePasswordResetRequest } from "@/checkout/sections/SignIn/usePasswordResetRequest";
import { FormProvider } from "@/checkout/hooks/useForm/FormProvider";
import {
	SignInFormContainer,
	type SignInFormContainerProps,
} from "@/checkout/sections/Contact/SignInFormContainer";
import { isValidEmail } from "@/checkout/lib/utils/common";
import { useErrorMessages } from "@/checkout/hooks/useErrorMessages";
import { useCheckout } from "@/checkout/hooks/useCheckout";
import { getQueryParams } from "@/checkout/lib/utils/url";
import { DefaultChannelSlug } from "@/app/config";

interface SignInProps extends Pick<SignInFormContainerProps, "onSectionChange"> {
	onSignInSuccess: () => void;
	onEmailChange: (email: string) => void;
	email: string;
}

export const SignIn: React.FC<SignInProps> = ({
	onSectionChange,
	onSignInSuccess,
	onEmailChange,
	email: initialEmail,
}) => {
	const { checkout } = useCheckout();
	const checkoutEmail = checkout?.email;
	const { errorMessages } = useErrorMessages();
	const [oauthError, setOauthError] = useState<string | null>(null);
	const [isOauthLoading, setIsOauthLoading] = useState(false);
	const params = useParams();

	// Get channel from Next.js params, fallback to pathname extraction, then config default
	const getChannel = (): string => {
		if (params?.channel) {
			return params.channel as string;
		}
		const pathParts = window.location.pathname.split("/");
		const channel = pathParts.find((part, index) => 
			index > 0 && part && part !== "checkout" && part !== "api" && part !== "_next"
		);
		return channel || DefaultChannelSlug;
	};

	const form = useSignInForm({
		onSuccess: onSignInSuccess,
		initialEmail: initialEmail || checkoutEmail || "",
	});

	const {
		values: { email },
		handleChange,
		setErrors,
		setTouched,
		isSubmitting,
	} = form;

	const { onPasswordResetRequest, passwordResetSent } = usePasswordResetRequest({
		email,
		shouldAbort: async () => {
			// @todo we'll use validateField once we fix it because
			// https://github.com/jaredpalmer/formik/issues/1755
			const isValid = await isValidEmail(email);

			if (!isValid) {
				await setTouched({ email: true });
				setErrors({ email: errorMessages.emailInvalid });
				return true;
			}
			setErrors({});

			return false;
		},
	});

	// Handle Google OAuth login - reuses the same OAuth flow as global login
	const handleGoogleSignIn = async () => {
		setIsOauthLoading(true);
		setOauthError(null);
		
		try {
			// Import OAuth action dynamically to avoid bundling issues
			const { getOAuthUrl } = await import("@/app/[channel]/(main)/login/oauth-actions");
			
			// Get current checkout URL to redirect back after OAuth
			const { checkoutId } = getQueryParams();
			
			const channel = getChannel();
			
			// OAuth callback URL
			const callbackUrl = `${window.location.origin}/${channel}/auth/callback`;
			
			// Final redirect back to checkout
			const finalRedirectUrl = `/checkout?checkout=${checkoutId}`;
			
			const result = await getOAuthUrl("google", callbackUrl, finalRedirectUrl);
			
			if (result.error) {
				setOauthError(result.error);
				setIsOauthLoading(false);
				return;
			}
			
			if (result.url) {
				// Redirect to Google OAuth
				window.location.href = result.url;
			} else {
				setOauthError("Failed to get OAuth URL");
				setIsOauthLoading(false);
			}
		} catch (error) {
			console.error("Google sign-in error:", error);
			setOauthError("Failed to initiate Google sign-in");
			setIsOauthLoading(false);
		}
	};

	return (
		<SignInFormContainer
			title="Sign in"
			redirectSubtitle="New customer?"
			redirectButtonLabel="Guest checkout"
			onSectionChange={onSectionChange}
		>
			<FormProvider form={form}>
				<div className="grid grid-cols-1 gap-3">
					<TextInput
						required
						name="email"
						label="Email"
						onChange={(event) => {
							handleChange(event);
							onEmailChange(event.currentTarget.value);
						}}
					/>
					<PasswordInput name="password" label="Password" required />
					<div className="flex w-full flex-row items-center justify-end">
						<Button
							ariaDisabled={isSubmitting}
							ariaLabel="send password reset link"
							variant="tertiary"
							label={passwordResetSent ? "Resend?" : "Forgot password?"}
							className="ml-1 mr-4"
							onClick={(e) => (isSubmitting ? e.preventDefault() : onPasswordResetRequest)}
						/>
						<Button
							type="submit"
							disabled={isSubmitting}
							ariaLabel={"Sign in"}
							label={isSubmitting ? "Processing…" : "Sign in"}
						/>
					</div>
					
					{/* Divider */}
					<div className="my-2 flex items-center gap-2">
						<div className="h-px flex-1" style={{ backgroundColor: "var(--store-neutral-200)" }} />
						<span className="text-xs" style={{ color: "var(--store-text-muted)" }}>or</span>
						<div className="h-px flex-1" style={{ backgroundColor: "var(--store-neutral-200)" }} />
					</div>
					
					{/* Google Sign-in Button */}
					{oauthError && (
						<div className="text-sm mb-2" style={{ color: "var(--store-error)" }}>{oauthError}</div>
					)}
					<button
						type="button"
						onClick={handleGoogleSignIn}
						disabled={isOauthLoading}
						className="flex w-full items-center justify-center gap-2 rounded border bg-white px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50"
						style={{ borderColor: "var(--store-neutral-200)", color: "var(--store-neutral-700)" }}
					>
						{isOauthLoading ? (
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
						Continue with Google
					</button>
				</div>
			</FormProvider>
		</SignInFormContainer>
	);
};
