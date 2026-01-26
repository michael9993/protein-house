import React from "react";
import { SignInFormContainer, type SignInFormContainerProps } from "../Contact/SignInFormContainer";
import { Button } from "@/checkout/components/Button";
import { PasswordInput } from "@/checkout/components/PasswordInput";
import { useResetPasswordForm } from "@/checkout/sections/ResetPassword/useResetPasswordForm";
import { FormProvider } from "@/checkout/hooks/useForm/FormProvider";
import { useCheckoutText } from "@/checkout/hooks/useCheckoutText";

interface ResetPasswordProps extends Pick<SignInFormContainerProps, "onSectionChange"> {
	onResetPasswordSuccess: () => void;
}

export const ResetPassword: React.FC<ResetPasswordProps> = ({ onSectionChange, onResetPasswordSuccess }) => {
	const form = useResetPasswordForm({ onSuccess: onResetPasswordSuccess });
	const text = useCheckoutText();

	return (
		<SignInFormContainer
			title={text.resetPasswordTitle || "Reset password"}
			redirectSubtitle={text.rememberedPasswordText || "Remembered your password?"}
			redirectButtonLabel={text.signInButton || "Sign in"}
			onSectionChange={onSectionChange}
			subtitle={text.provideNewPasswordText || "Provide a new password for your account"}
		>
			<FormProvider form={form}>
				<PasswordInput name="password" label={text.passwordLabel || "Password"} required />
				<div className="mt-4 flex w-full flex-row items-center justify-end">
					<Button ariaLabel={text.resetPasswordTitle || "Reset password"} label={text.resetPasswordTitle || "Reset password"} type="submit" />
				</div>
			</FormProvider>
		</SignInFormContainer>
	);
};
