"use client";

import { useBranding, useDashboardText } from "@/providers/StoreConfigProvider";

interface AccountWelcomeHeaderProps {
	userFirstName: string | null;
}

export function AccountWelcomeHeader({ userFirstName }: AccountWelcomeHeaderProps) {
	const dashboardText = useDashboardText();
	const branding = useBranding();

	return (
		<div
			className="rounded-lg px-6 py-6"
			style={{
				background: `linear-gradient(135deg, ${branding.colors.primary}, ${branding.colors.primary}cc)`,
			}}
		>
			<h1 className="text-xl font-bold text-white">
				{dashboardText.welcomeBack.replace("{name}", userFirstName || "there")}
			</h1>
			<p className="mt-1 text-sm text-white/75">
				{dashboardText.welcomeBackMessage}
			</p>
		</div>
	);
}
