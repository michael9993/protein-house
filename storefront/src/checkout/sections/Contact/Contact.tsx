import React, { type FC, useCallback, useEffect, useState, useRef } from "react";
import { SignedInUser } from "../SignedInUser/SignedInUser";
import { ResetPassword } from "../ResetPassword/ResetPassword";
import { useCustomerAttach } from "@/checkout/hooks/useCustomerAttach";
import { getQueryParams } from "@/checkout/lib/utils/url";
import { SignIn } from "@/checkout/sections/SignIn/SignIn";
import { GuestUser } from "@/checkout/sections/GuestUser/GuestUser";
import { useUser } from "@/checkout/hooks/useUser";

type Section = "signedInUser" | "guestUser" | "signIn" | "resetPassword";

const onlyContactShownSections: Section[] = ["signIn", "resetPassword"];

interface ContactProps {
	setShowOnlyContact: (value: boolean) => void;
}

export const Contact: FC<ContactProps> = ({ setShowOnlyContact }) => {
	useCustomerAttach();
	const { user, authenticated, loading } = useUser();
	const [email, setEmail] = useState(user?.email || "");

	const [passwordResetShown, setPasswordResetShown] = useState(false);

	const selectInitialSection = (): Section => {
		const shouldShowPasswordReset = passwordResetToken && !passwordResetShown;

		if (shouldShowPasswordReset) {
			return "resetPassword";
		}

		return user ? "signedInUser" : "guestUser";
	};

	const passwordResetToken = getQueryParams().passwordResetToken;
	const [currentSection, setCurrentSection] = useState<Section>(selectInitialSection());

	// Removed excessive debug logging - only log errors if needed

	const handleChangeSection = (section: Section) => () => {
		if (onlyContactShownSections.includes(section)) {
			setShowOnlyContact(true);
		}
		setCurrentSection(section);
	};

	const isCurrentSection = useCallback((section: Section) => currentSection === section, [currentSection]);

	const shouldShowOnlyContact = onlyContactShownSections.includes(currentSection);

	useEffect(() => {
		if (isCurrentSection("resetPassword")) {
			setPasswordResetShown(true);
		}
	}, [isCurrentSection]);

	useEffect(() => {
		setShowOnlyContact(shouldShowOnlyContact);
	}, [currentSection, setShowOnlyContact, shouldShowOnlyContact]);

	// Update section when auth state changes (with guard to prevent loops)
	const prevAuthenticatedRef = useRef<boolean | undefined>(undefined);
	useEffect(() => {
		// Only update if authenticated state actually changed
		if (prevAuthenticatedRef.current !== authenticated) {
			prevAuthenticatedRef.current = authenticated;
			if (authenticated && currentSection !== "signedInUser") {
				setCurrentSection("signedInUser");
			} else if (!authenticated && currentSection === "signedInUser") {
				setCurrentSection("guestUser");
			}
		}
	}, [authenticated, currentSection]);

	return (
		<div>
			{isCurrentSection("guestUser") && (
				<GuestUser onSectionChange={handleChangeSection("signIn")} onEmailChange={setEmail} email={email} />
			)}

			{isCurrentSection("signIn") && (
				<SignIn
					onSectionChange={handleChangeSection("guestUser")}
					onSignInSuccess={handleChangeSection("signedInUser")}
					onEmailChange={setEmail}
					email={email}
				/>
			)}

			{isCurrentSection("signedInUser") && (
				<SignedInUser
					onSectionChange={handleChangeSection("guestUser")}
					onSignOutSuccess={handleChangeSection("guestUser")}
				/>
			)}

			{isCurrentSection("resetPassword") && (
				<ResetPassword
					onSectionChange={handleChangeSection("signIn")}
					onResetPasswordSuccess={handleChangeSection("signedInUser")}
				/>
			)}
		</div>
	);
};
