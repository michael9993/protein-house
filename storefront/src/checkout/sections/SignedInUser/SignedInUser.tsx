import React from "react";
import { useSaleorAuthContext } from "@saleor/auth-sdk/react";
import { SignInFormContainer, type SignInFormContainerProps } from "../Contact/SignInFormContainer";
import { Button } from "@/checkout/components/Button";
import { useUser } from "@/checkout/hooks/useUser";
import { dispatchCheckoutLogout } from "@/lib/checkout-client";

interface SignedInUserProps extends Pick<SignInFormContainerProps, "onSectionChange"> {
	onSignOutSuccess: () => void;
}

export const SignedInUser: React.FC<SignedInUserProps> = ({ onSectionChange, onSignOutSuccess }) => {
	const { signOut } = useSaleorAuthContext();

	const { user } = useUser();

	const handleLogout = async () => {
		// Clear client-side checkout state for proper isolation
		dispatchCheckoutLogout();
		
		signOut();
		onSignOutSuccess();
	};

	return (
		<SignInFormContainer title="Account" onSectionChange={onSectionChange}>
			<div className="flex flex-row justify-between">
				<p className="text-base font-bold">{user?.email}</p>
				<Button ariaLabel="Sign out" variant="tertiary" onClick={handleLogout} label="Sign out" />
			</div>
		</SignInFormContainer>
	);
};
