"use client";

import { useState } from "react";
import { type UserDetailsFragment } from "@/gql/graphql";
import { storeConfig } from "@/config";

interface SettingsClientProps {
	user: UserDetailsFragment;
	channel: string;
}

export function SettingsClient({ user, channel: _channel }: SettingsClientProps) {
	const [firstName, setFirstName] = useState(user.firstName || "");
	const [lastName, setLastName] = useState(user.lastName || "");
	const [email, setEmail] = useState(user.email);
	const [currentPassword, setCurrentPassword] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [saving, setSaving] = useState(false);
	const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
	const { branding } = storeConfig;

	// Notification preferences
	const [notifications, setNotifications] = useState({
		orderUpdates: true,
		promotions: true,
		newsletter: false,
		sms: false,
	});

	const handleProfileUpdate = async (e: React.FormEvent) => {
		e.preventDefault();
		setSaving(true);
		setMessage(null);

		try {
			// Would call API to update profile
			await new Promise((resolve) => setTimeout(resolve, 1000));
			setMessage({ type: "success", text: "Profile updated successfully!" });
		} catch (error) {
			setMessage({ type: "error", text: "Failed to update profile. Please try again." });
		} finally {
			setSaving(false);
		}
	};

	const handlePasswordUpdate = async (e: React.FormEvent) => {
		e.preventDefault();
		if (newPassword !== confirmPassword) {
			setMessage({ type: "error", text: "New passwords do not match." });
			return;
		}
		setSaving(true);
		setMessage(null);

		try {
			// Would call API to update password
			await new Promise((resolve) => setTimeout(resolve, 1000));
			setMessage({ type: "success", text: "Password updated successfully!" });
			setCurrentPassword("");
			setNewPassword("");
			setConfirmPassword("");
		} catch (error) {
			setMessage({ type: "error", text: "Failed to update password. Please try again." });
		} finally {
			setSaving(false);
		}
	};

	return (
		<div className="space-y-8 animate-fade-in">
			{/* Header */}
			<div className="animate-fade-in-up" style={{ animationDelay: "50ms", animationFillMode: "both" }}>
				<h1 className="text-2xl font-bold text-neutral-900">Account Settings</h1>
				<p className="mt-1 text-neutral-500">
					Manage your profile, security, and notification preferences
				</p>
			</div>

			{/* Status Message */}
			{message && (
				<div className={`flex items-center gap-3 rounded-lg px-4 py-3 animate-fade-in-up ${
					message.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
				}`}
				style={{ animationDelay: "100ms", animationFillMode: "both" }}>
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
			<div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-neutral-100 animate-fade-in-up" style={{ animationDelay: "100ms", animationFillMode: "both" }}>
				<h2 className="text-lg font-semibold text-neutral-900">Profile Information</h2>
				<p className="mt-1 text-sm text-neutral-500">
					Update your personal details
				</p>

				<form onSubmit={handleProfileUpdate} className="mt-6 space-y-4">
					<div className="grid gap-4 sm:grid-cols-2">
						<div>
							<label htmlFor="firstName" className="mb-1.5 block text-sm font-medium text-neutral-700">
								First Name
							</label>
							<input
								id="firstName"
								type="text"
								value={firstName}
								onChange={(e) => setFirstName(e.target.value)}
								className="w-full rounded-lg border border-neutral-200 px-4 py-3 text-neutral-900 transition-colors focus:border-[#FF5722] focus:outline-none focus:ring-2 focus:ring-[#FF5722]/20"
							/>
						</div>
						<div>
							<label htmlFor="lastName" className="mb-1.5 block text-sm font-medium text-neutral-700">
								Last Name
							</label>
							<input
								id="lastName"
								type="text"
								value={lastName}
								onChange={(e) => setLastName(e.target.value)}
								className="w-full rounded-lg border border-neutral-200 px-4 py-3 text-neutral-900 transition-colors focus:border-[#FF5722] focus:outline-none focus:ring-2 focus:ring-[#FF5722]/20"
							/>
						</div>
					</div>

					<div>
						<label htmlFor="email" className="mb-1.5 block text-sm font-medium text-neutral-700">
							Email Address
						</label>
						<input
							id="email"
							type="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							className="w-full rounded-lg border border-neutral-200 px-4 py-3 text-neutral-900 transition-colors focus:border-[#FF5722] focus:outline-none focus:ring-2 focus:ring-[#FF5722]/20"
						/>
					</div>

					<div className="flex justify-end pt-4">
						<button
							type="submit"
							disabled={saving}
							className="inline-flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
							style={{ backgroundColor: branding.colors.primary }}
						>
							{saving ? "Saving..." : "Save Changes"}
						</button>
					</div>
				</form>
			</div>

			{/* Password */}
			<div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-neutral-100 animate-fade-in-up" style={{ animationDelay: "150ms", animationFillMode: "both" }}>
				<h2 className="text-lg font-semibold text-neutral-900">Change Password</h2>
				<p className="mt-1 text-sm text-neutral-500">
					Update your password to keep your account secure
				</p>

				<form onSubmit={handlePasswordUpdate} className="mt-6 space-y-4">
					<div>
						<label htmlFor="currentPassword" className="mb-1.5 block text-sm font-medium text-neutral-700">
							Current Password
						</label>
						<input
							id="currentPassword"
							type="password"
							value={currentPassword}
							onChange={(e) => setCurrentPassword(e.target.value)}
							required
							className="w-full rounded-lg border border-neutral-200 px-4 py-3 text-neutral-900 transition-colors focus:border-[#FF5722] focus:outline-none focus:ring-2 focus:ring-[#FF5722]/20"
						/>
					</div>

					<div className="grid gap-4 sm:grid-cols-2">
						<div>
							<label htmlFor="newPassword" className="mb-1.5 block text-sm font-medium text-neutral-700">
								New Password
							</label>
							<input
								id="newPassword"
								type="password"
								value={newPassword}
								onChange={(e) => setNewPassword(e.target.value)}
								required
								minLength={8}
								className="w-full rounded-lg border border-neutral-200 px-4 py-3 text-neutral-900 transition-colors focus:border-[#FF5722] focus:outline-none focus:ring-2 focus:ring-[#FF5722]/20"
							/>
						</div>
						<div>
							<label htmlFor="confirmPassword" className="mb-1.5 block text-sm font-medium text-neutral-700">
								Confirm New Password
							</label>
							<input
								id="confirmPassword"
								type="password"
								value={confirmPassword}
								onChange={(e) => setConfirmPassword(e.target.value)}
								required
								minLength={8}
								className="w-full rounded-lg border border-neutral-200 px-4 py-3 text-neutral-900 transition-colors focus:border-[#FF5722] focus:outline-none focus:ring-2 focus:ring-[#FF5722]/20"
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
							{saving ? "Updating..." : "Update Password"}
						</button>
					</div>
				</form>
			</div>

			{/* Notification Preferences */}
			<div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-neutral-100 animate-fade-in-up" style={{ animationDelay: "200ms", animationFillMode: "both" }}>
				<h2 className="text-lg font-semibold text-neutral-900">Notification Preferences</h2>
				<p className="mt-1 text-sm text-neutral-500">
					Choose how you want to receive updates
				</p>

				<div className="mt-6 space-y-4">
					{[
						{
							id: "orderUpdates",
							title: "Order Updates",
							description: "Receive notifications about your order status",
						},
						{
							id: "promotions",
							title: "Promotions & Offers",
							description: "Get notified about sales and exclusive deals",
						},
						{
							id: "newsletter",
							title: "Newsletter",
							description: "Weekly updates about new arrivals and trends",
						},
						{
							id: "sms",
							title: "SMS Notifications",
							description: "Receive text messages for important updates",
						},
					].map((item) => (
						<div
							key={item.id}
							className="flex items-center justify-between rounded-lg border border-neutral-100 p-4"
						>
							<div>
								<p className="font-medium text-neutral-900">{item.title}</p>
								<p className="text-sm text-neutral-500">{item.description}</p>
							</div>
							<label className="relative inline-flex cursor-pointer items-center">
								<input
									type="checkbox"
									checked={notifications[item.id as keyof typeof notifications]}
									onChange={(e) => setNotifications({
										...notifications,
										[item.id]: e.target.checked,
									})}
									className="peer sr-only"
								/>
								<div className="peer h-6 w-11 rounded-full bg-neutral-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-neutral-300 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none"
									style={{ backgroundColor: notifications[item.id as keyof typeof notifications] ? branding.colors.primary : undefined }}
								/>
							</label>
						</div>
					))}
				</div>
			</div>

			{/* Danger Zone */}
			<div className="rounded-xl border border-red-200 bg-red-50 p-6 animate-fade-in-up" style={{ animationDelay: "250ms", animationFillMode: "both" }}>
				<h2 className="text-lg font-semibold text-red-900">Danger Zone</h2>
				<p className="mt-1 text-sm text-red-700">
					Permanently delete your account and all associated data
				</p>
				<button className="mt-4 inline-flex items-center gap-2 rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50">
					<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
					</svg>
					Delete Account
				</button>
			</div>
		</div>
	);
}

