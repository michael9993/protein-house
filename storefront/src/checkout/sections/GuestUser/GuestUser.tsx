import React, { useState } from "react";
import { useParams } from "next/navigation";
import { SignInFormContainer, type SignInFormContainerProps } from "../Contact/SignInFormContainer";
import { PasswordInput } from "@/checkout/components/PasswordInput";
import { Checkbox } from "@/checkout/components/Checkbox";
import { TextInput } from "@/checkout/components/TextInput";
import { useGuestUserForm } from "@/checkout/sections/GuestUser/useGuestUserForm";
import { FormProvider } from "@/checkout/hooks/useForm/FormProvider";
import { useUser } from "@/checkout/hooks/useUser";
import { getQueryParams } from "@/checkout/lib/utils/url";
import { DefaultChannelSlug } from "@/app/config";
import { useCheckoutText } from "@/checkout/hooks/useCheckoutText";

type GuestUserProps = Pick<SignInFormContainerProps, "onSectionChange"> & {
	onEmailChange: (email: string) => void;
	email: string;
};

export const GuestUser: React.FC<GuestUserProps> = ({
	onSectionChange,
	onEmailChange,
	email: initialEmail,
}) => {
	const { authenticated, user: _user, loading: _loading } = useUser();
	const form = useGuestUserForm({ initialEmail });
	const { handleChange } = form;
	const { createAccount } = form.values;
	const [_oauthError, setOauthError] = useState<string | null>(null);
	const [isOauthLoading, setIsOauthLoading] = useState(false);
	const params = useParams();
	const text = useCheckoutText();

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

	// Only show "Already have an account?" and "Sign in" when user is NOT logged in
	// Only show "I want to create account" checkbox when user is NOT logged in
	const showAuthOptions = !authenticated;

	// Removed excessive debug logging - only log errors if needed

	// Handle Google OAuth login
	const handleGoogleSignIn = async () => {
		setIsOauthLoading(true);
		setOauthError(null);
		
		try {
			const { getOAuthUrl } = await import("@/app/[channel]/(main)/login/oauth-actions");
			const { checkoutId } = getQueryParams();
			const channel = getChannel();
			const callbackUrl = `${window.location.origin}/${channel}/auth/callback`;
			// Final redirect back to checkout (channel-aware)
			const finalRedirectUrl = `/${channel}/checkout?checkout=${checkoutId}`;
			
			const result = await getOAuthUrl("google", callbackUrl, finalRedirectUrl);
			
			if (result.error) {
				setOauthError(result.error);
				setIsOauthLoading(false);
				return;
			}
			
			if (result.url) {
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
			title={text.contactDetailsTitle || "Contact details"}
			redirectSubtitle={showAuthOptions ? (text.alreadyHaveAccount || "Already have an account?") : undefined}
			redirectButtonLabel={showAuthOptions ? (text.signInButton || "Sign in") : undefined}
			onSectionChange={showAuthOptions ? onSectionChange : () => {}}
			customHeaderAction={showAuthOptions ? (
				<button
					type="button"
					onClick={handleGoogleSignIn}
					disabled={isOauthLoading}
					className="flex items-center justify-center gap-1.5 rounded border bg-white px-3 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50"
					style={{ borderColor: "var(--store-neutral-200)", color: "var(--store-neutral-700)" }}
					title={text.signInWithGoogle || "Sign in with Google"}
				>
					{isOauthLoading ? (
						<svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
							<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
							<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
						</svg>
					) : (
						<svg className="h-4 w-4" viewBox="0 0 24 24">
							<path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
							<path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
							<path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
							<path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
						</svg>
					)}
					<span className="hidden @sm:inline">Google</span>
				</button>
			) : undefined}
		>
			<FormProvider form={form}>
				<div className="grid grid-cols-1 gap-3">
					<TextInput
						required
						name="email"
						label={text.guestEmailLabel || "Email"}
						onChange={(event) => {
							handleChange(event);
							onEmailChange(event.currentTarget.value);
						}}
					/>
					{showAuthOptions && (
						<Checkbox
							name="createAccount"
							label={text.createAccountLabel || "I want to create account"}
							data-testid={"createAccountCheckbox"}
						/>
					)}
					{createAccount && showAuthOptions && (
						<div className="mt-2">
							<PasswordInput name="password" label={text.passwordMinChars || "Password (minimum 8 characters)"} required />
						</div>
					)}
				</div>
			</FormProvider>
		</SignInFormContainer>
	);
};
