"use client";

import { useBranding, useStoreInfo, useHeaderConfig } from "@/providers/StoreConfigProvider";

/**
 * Client component for the store name in the mobile header.
 * Only shows on mobile when configured to show store name.
 */
export function HeaderStoreName() {
	const branding = useBranding();
	const store = useStoreInfo();
	const headerConfig = useHeaderConfig();
	
	if (!headerConfig.showStoreName) {
		return null;
	}
	
	return (
		<div className="flex-1 flex md:hidden items-center justify-center px-2">
			<span 
				className="text-sm font-bold uppercase tracking-tight text-center"
				style={{ color: branding.colors.primary }}
			>
				{store.name}
			</span>
		</div>
	);
}
