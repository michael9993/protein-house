"use client";

import { useState } from "react";
import { type UserDetailsFragment } from "@/gql/graphql";
import { useBranding, useSettingsText, useContentConfig } from "@/providers/StoreConfigProvider";
import { changePassword, setNewsletterActive, updateProfile, requestEmailChange } from "./actions";

/** Common TLD typos (e.g. .comm instead of .com) to reject */
const INVALID_TLD_TYPOS = new Set([
	"comm", "cim", "con", "comk", "orgg", "neto", "gmial", "gmai", "yaho", "yahooo",
	"hotmali", "outlok", "gmal", "gmil", "gnail", "gmeil", "gmsil", "yahoocom",
]);

/**
 * Validate email format and catch common typos (e.g. .comm, gmaik.com).
 * Returns { valid: true } or { valid: false, message: string }.
 */
function validateEmail(email: string): { valid: true } | { valid: false; message: string } {
	const trimmed = email?.trim() ?? "";
	if (!trimmed) return { valid: false, message: "Email is required." };
	const basicRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	if (!basicRegex.test(trimmed)) {
		return { valid: false, message: "Please enter a valid email address." };
	}
	const parts = trimmed.split("@");
	const domain = parts[1] ?? "";
	const lastDot = domain.lastIndexOf(".");
	const tld = domain.slice(lastDot + 1).toLowerCase();
	if (lastDot < 0 || !tld) return { valid: false, message: "Please enter a valid email address." };
	if (tld.length < 2 || tld.length > 6) return { valid: false, message: "Please enter a valid email address. Check the domain extension." };
	if (!/^[a-z]+$/.test(tld)) return { valid: false, message: "Please enter a valid email address. The extension should be letters only (e.g. .com)." };
	if (INVALID_TLD_TYPOS.has(tld)) {
		return { valid: false, message: "Please enter a valid email address. Check the extension (e.g. .com not .comm)." };
	}
	const domainBeforeTld = domain.slice(0, lastDot).toLowerCase();
	const commonDomainTypos: Record<string, string> = {
		gmaik: "gmail",
		gmial: "gmail",
		gnail: "gmail",
		gmal: "gmail",
		yaho: "yahoo",
		hotmali: "hotmail",
		outlok: "outlook",
	};
	for (const [typo, suggestion] of Object.entries(commonDomainTypos)) {
		if (domainBeforeTld === typo || domainBeforeTld.endsWith("." + typo)) {
			return { valid: false, message: `Please check the email domain (did you mean ${suggestion}.com?).` };
		}
	}
	return { valid: true };
}

interface SettingsClientProps {
	user: UserDetailsFragment;
	channel: string;
	/** Newsletter subscription active state (from newsletter app); synced with account settings toggle */
	initialNewsletterActive?: boolean;
}

export function SettingsClient({
	user,
	channel,
	initialNewsletterActive = false,
}: SettingsClientProps) {
	const [firstName, setFirstName] = useState(user.firstName || "");
	const [lastName, setLastName] = useState(user.lastName || "");
	const [email, setEmail] = useState(user.email);
	const [emailChangePassword, setEmailChangePassword] = useState("");
	const [currentPassword, setCurrentPassword] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [saving, setSaving] = useState(false);
	const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
	const [passwordMessage, setPasswordMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
	const [newsletterSaving, setNewsletterSaving] = useState(false);
	const branding = useBranding();
	const settingsText = useSettingsText();
	const contentConfig = useContentConfig();

	// Focus ring color with transparency
	const focusRingColor = `${branding.colors.primary}33`;

	// Notification preferences: newsletter (synced with newsletter app); order status is always on and not shown
	const [notifications, setNotifications] = useState({
		newsletter: initialNewsletterActive,
		sms: false,
	});

	const handleProfileUpdate = async (e: React.FormEvent) => {
		e.preventDefault();
		const requiredMsg = contentConfig.account?.loginEmailPasswordRequiredError?.replace?.("Email and password", "First name, last name, and email") ?? "First name, last name, and email are required.";
		if (!firstName?.trim()) {
			setMessage({ type: "error", text: settingsText.profileUpdateFailed ?? requiredMsg });
			return;
		}
		if (!lastName?.trim()) {
			setMessage({ type: "error", text: settingsText.profileUpdateFailed ?? requiredMsg });
			return;
		}
		const emailTrimmed = email?.trim() ?? "";
		if (!emailTrimmed) {
			setMessage({ type: "error", text: contentConfig.account?.emailLabel ? `${contentConfig.account.emailLabel} is required.` : "Email is required." });
			return;
		}
		const emailValidation = validateEmail(emailTrimmed);
		if (!emailValidation.valid) {
			const invalidEmailMsg = settingsText.profileInvalidEmailError ?? "Please enter a valid email address. Check the domain and extension (e.g. .com not .comm).";
			setMessage({ type: "error", text: emailValidation.message ?? invalidEmailMsg });
			return;
		}
		const emailChanged = emailTrimmed.toLowerCase() !== (user.email || "").toLowerCase();
		if (emailChanged && !emailChangePassword?.trim()) {
			setMessage({ type: "error", text: settingsText.emailChangePasswordRequired ?? "Password is required to change your email. We will send a confirmation link to your new address." });
			return;
		}
		setSaving(true);
		setMessage(null);

		try {
			if (emailChanged) {
				const result = await requestEmailChange(emailTrimmed, emailChangePassword, channel);
				if (result.success) {
					setMessage({ type: "success", text: settingsText.emailChangeConfirmationSent ?? "A confirmation link has been sent to your new email address. Please click it to complete the change." });
					setEmailChangePassword("");
				} else {
					const isPasswordError =
						result.error &&
						(/password/i.test(result.error) && (/valid|invalid|incorrect|wrong/i.test(result.error) || result.error.includes("isn't valid")));
					const displayError = isPasswordError
						? (settingsText.emailChangePasswordInvalid ?? result.error)
						: (result.error ?? settingsText.profileUpdateFailed);
					setMessage({ type: "error", text: displayError });
				}
			} else {
				const result = await updateProfile(firstName.trim(), lastName.trim());
				if (result.success) {
					setMessage({ type: "success", text: settingsText.profileUpdated });
				} else {
					setMessage({ type: "error", text: result.error ?? settingsText.profileUpdateFailed });
				}
			}
		} catch (error) {
			setMessage({ type: "error", text: settingsText.profileUpdateFailed ?? "Failed to update profile. Please try again." });
		} finally {
			setSaving(false);
		}
	};

	const handlePasswordUpdate = async (e: React.FormEvent) => {
		e.preventDefault();
		const mismatchMsg = contentConfig.account?.passwordMismatchError ?? "New passwords do not match.";
		if (newPassword !== confirmPassword) {
			setPasswordMessage({ type: "error", text: mismatchMsg });
			return;
		}
		const tooShortMsg = contentConfig.account?.passwordTooShortError ?? "Password must be at least 8 characters.";
		if (newPassword.length < 8) {
			setPasswordMessage({ type: "error", text: tooShortMsg });
			return;
		}
		setSaving(true);
		setPasswordMessage(null);

		try {
			const result = await changePassword(currentPassword, newPassword);
			if (result.success) {
				setPasswordMessage({ type: "success", text: settingsText.passwordUpdated });
				setCurrentPassword("");
				setNewPassword("");
				setConfirmPassword("");
			} else {
				const failedMsg = settingsText.passwordUpdateFailed ?? "Failed to update password. Please try again.";
				setPasswordMessage({ type: "error", text: result.error ?? failedMsg });
			}
		} catch (error) {
			setPasswordMessage({ type: "error", text: settingsText.passwordUpdateFailed ?? "Failed to update password. Please try again." });
		} finally {
			setSaving(false);
		}
	};

	return (
		<div className="space-y-6">
			{/* Inject dynamic focus styles */}
			<style>{`
				.settings-input:focus {
					border-color: ${branding.colors.primary} !important;
					box-shadow: 0 0 0 3px ${focusRingColor} !important;
					outline: none !important;
				}
			`}</style>
			{/* Header */}
			<div>
				<h1 className="text-2xl font-bold text-neutral-900">{settingsText.accountSettings}</h1>
				<p className="mt-1 text-neutral-500">
					{settingsText.settingsSubtitle}
				</p>
			</div>

			{/* Status Message */}
			{message && (
				<div className={`flex items-center gap-3 rounded-lg px-4 py-3 ${
					message.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
				}`}>
					{message.type === "success" ? (
						<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
						</svg>
					) : (
						<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
					)}
					{message.text}
				</div>
			)}

			{/* Profile Information */}
			<div className="rounded-lg border border-neutral-200 bg-white p-6">
				<h2 className="text-lg font-semibold text-neutral-900">{settingsText.profileInformation}</h2>
				<p className="mt-1 text-sm text-neutral-500">
					{settingsText.updatePersonalDetails}
				</p>

				<form onSubmit={handleProfileUpdate} className="mt-6 space-y-4">
					<div className="grid gap-4 sm:grid-cols-2">
						<div>
							<label htmlFor="firstName" className="mb-1.5 block text-sm font-medium text-neutral-700">
								{contentConfig.account.firstNameLabel}
							</label>
							<input
								id="firstName"
								type="text"
								value={firstName}
								onChange={(e) => setFirstName(e.target.value)}
								className="settings-input w-full rounded-lg border border-neutral-200 px-4 py-3 text-neutral-900 transition-colors"
							/>
						</div>
						<div>
							<label htmlFor="lastName" className="mb-1.5 block text-sm font-medium text-neutral-700">
								{contentConfig.account.lastNameLabel}
							</label>
							<input
								id="lastName"
								type="text"
								value={lastName}
								onChange={(e) => setLastName(e.target.value)}
								className="settings-input w-full rounded-lg border border-neutral-200 px-4 py-3 text-neutral-900 transition-colors"
							/>
						</div>
					</div>

					<div>
						<label htmlFor="email" className="mb-1.5 block text-sm font-medium text-neutral-700">
							{contentConfig.account.emailLabel}
						</label>
						<input
							id="email"
							type="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							className="settings-input w-full rounded-lg border border-neutral-200 px-4 py-3 text-neutral-900 transition-colors"
						/>
						{(email?.trim() ?? "").toLowerCase() !== (user.email || "").toLowerCase() && (
							<div className="mt-3">
								<label htmlFor="emailChangePassword" className="mb-1.5 block text-sm font-medium text-neutral-700">
									{settingsText.currentPassword}
								</label>
								<input
									id="emailChangePassword"
									type="password"
									value={emailChangePassword}
									onChange={(e) => setEmailChangePassword(e.target.value)}
									placeholder={contentConfig.account?.passwordPlaceholder ?? "Enter your password"}
									className="settings-input w-full rounded-lg border border-neutral-200 px-4 py-3 text-neutral-900 transition-colors"
								/>
								<p className="mt-1 text-xs text-neutral-500">
									{settingsText.emailChangePasswordRequired}
								</p>
							</div>
						)}
					</div>

					<div className="flex justify-end pt-4">
						<button
							type="submit"
							disabled={saving}
							className="inline-flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
							style={{ backgroundColor: branding.colors.primary }}
						>
							{saving ? settingsText.savingChanges : settingsText.saveChangesButton}
						</button>
					</div>
				</form>
			</div>

			{/* Password */}
			<div className="rounded-lg border border-neutral-200 bg-white p-6">
				<h2 className="text-lg font-semibold text-neutral-900">{settingsText.changePassword}</h2>
				<p className="mt-1 text-sm text-neutral-500">
					{settingsText.passwordSecurityNote}
				</p>

				{/* Password success/error message - shown in this section */}
				{passwordMessage && (
					<div
						className={`mt-4 flex items-center gap-3 rounded-lg px-4 py-3 ${
							passwordMessage.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
						}`}
						role="alert"
					>
						{passwordMessage.type === "success" ? (
							<svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
							</svg>
						) : (
							<svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
							</svg>
						)}
						<span className="text-sm font-medium">{passwordMessage.text}</span>
					</div>
				)}

				<form onSubmit={handlePasswordUpdate} className="mt-6 space-y-4">
					<div>
						<label htmlFor="currentPassword" className="mb-1.5 block text-sm font-medium text-neutral-700">
							{settingsText.currentPassword}
						</label>
						<input
							id="currentPassword"
							type="password"
							value={currentPassword}
							onChange={(e) => setCurrentPassword(e.target.value)}
							required
							className="settings-input w-full rounded-lg border border-neutral-200 px-4 py-3 text-neutral-900 transition-colors"
						/>
					</div>

					<div className="grid gap-4 sm:grid-cols-2">
						<div>
							<label htmlFor="newPassword" className="mb-1.5 block text-sm font-medium text-neutral-700">
								{settingsText.newPasswordLabel}
							</label>
							<input
								id="newPassword"
								type="password"
								value={newPassword}
								onChange={(e) => setNewPassword(e.target.value)}
								required
								minLength={8}
								className="settings-input w-full rounded-lg border border-neutral-200 px-4 py-3 text-neutral-900 transition-colors"
							/>
						</div>
						<div>
							<label htmlFor="confirmPassword" className="mb-1.5 block text-sm font-medium text-neutral-700">
								{settingsText.confirmNewPassword}
							</label>
							<input
								id="confirmPassword"
								type="password"
								value={confirmPassword}
								onChange={(e) => setConfirmPassword(e.target.value)}
								required
								minLength={8}
								className="settings-input w-full rounded-lg border border-neutral-200 px-4 py-3 text-neutral-900 transition-colors"
							/>
						</div>
					</div>

					<div className="flex justify-end pt-4">
						<button
							type="submit"
							disabled={saving}
							className="inline-flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
							style={{ backgroundColor: branding.colors.primary }}
						>
							{saving ? settingsText.savingChanges : settingsText.updatePasswordButton}
						</button>
					</div>
				</form>
			</div>

			{/* Notification Preferences */}
			<div className="rounded-lg border border-neutral-200 bg-white p-6">
				<h2 className="text-lg font-semibold text-neutral-900">{settingsText.notificationPreferences}</h2>
				<p className="mt-1 text-sm text-neutral-500">
					{settingsText.notificationSubtitle}
				</p>

				<div className="mt-6 space-y-4">
					{[
						{
							id: "newsletter",
							title: settingsText.newsletterSetting,
							description: settingsText.newsletterDesc,
							syncWithNewsletter: true,
						},
						{
							id: "sms",
							title: settingsText.smsNotifications,
							description: settingsText.smsDesc,
							syncWithNewsletter: false,
						},
					].map((item) => {
						const isNewsletter = item.syncWithNewsletter;
						return (
							<div
								key={item.id}
								className="flex items-center justify-between rounded-lg border border-neutral-100 p-4"
							>
								<div>
									<p className="font-medium text-neutral-900">{item.title}</p>
									<p className="text-sm text-neutral-500">{item.description}</p>
								</div>
								<label
									className={`relative inline-flex cursor-pointer items-center ${newsletterSaving && isNewsletter ? "pointer-events-none opacity-70" : ""}`}
								>
									<input
										type="checkbox"
										checked={notifications[item.id as keyof typeof notifications]}
										disabled={isNewsletter && newsletterSaving}
										onChange={async (e) => {
											const checked = e.target.checked;
											setNotifications((prev) => ({ ...prev, [item.id]: checked }));
											if (isNewsletter) {
												setNewsletterSaving(true);
												const result = await setNewsletterActive(user.email, checked, channel);
												setNewsletterSaving(false);
												if (!result.success && result.error) {
													setNotifications((prev) => ({ ...prev, newsletter: !checked }));
													setMessage({ type: "error", text: result.error });
												}
											}
										}}
										className="peer sr-only"
									/>
									<div
										className="peer h-6 w-11 rounded-full bg-neutral-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-neutral-300 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none"
										style={{
											backgroundColor:
												notifications[item.id as keyof typeof notifications]
													? branding.colors.primary
													: undefined,
										}}
									/>
								</label>
							</div>
						);
					})}
				</div>
			</div>

			{/* Danger Zone */}
			<div className="rounded-lg border border-red-200 bg-red-50 p-6">
				<h2 className="text-lg font-semibold text-red-900">{settingsText.dangerZone}</h2>
				<p className="mt-1 text-sm text-red-700">
					{settingsText.deleteAccountWarning}
				</p>
				<button className="mt-4 inline-flex items-center gap-2 rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50">
					<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
					</svg>
					{settingsText.deleteAccountButton}
				</button>
			</div>
		</div>
	);
}

