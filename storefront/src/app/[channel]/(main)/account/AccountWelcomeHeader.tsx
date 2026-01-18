"use client";

import { useDashboardText } from "@/providers/StoreConfigProvider";

interface AccountWelcomeHeaderProps {
	userFirstName: string | null;
}

export function AccountWelcomeHeader({ userFirstName }: AccountWelcomeHeaderProps) {
	const dashboardText = useDashboardText();

	return (
		<div className="rounded-xl bg-gradient-to-r from-neutral-900 to-neutral-800 px-6 py-8 text-white animate-fade-in-up" style={{ animationDelay: "50ms", animationFillMode: "both" }}>
			<h1 className="text-2xl font-bold">
				{dashboardText.welcomeBack.replace("{name}", userFirstName || "there")} 👋
			</h1>
			<p className="mt-2 text-neutral-300">
				{dashboardText.welcomeBackMessage}
			</p>
		</div>
	);
}
