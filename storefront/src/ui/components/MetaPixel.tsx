"use client";

import Script from "next/script";
import { useEffect, useState } from "react";
import { useStoreConfig } from "@/providers/StoreConfigProvider";
import { hasConsent } from "@/lib/consent";
import { setMetaPixelChannel } from "@/lib/meta-pixel-events";

export function MetaPixel({ channel }: { channel: string }) {
	const config = useStoreConfig();
	const pixelId = config.integrations.analytics.facebookPixelId;
	const [consentGranted, setConsentGranted] = useState(false);

	useEffect(() => {
		setMetaPixelChannel(channel);
		if (hasConsent(channel, "marketing")) setConsentGranted(true);

		const handler = () => {
			if (hasConsent(channel, "marketing")) setConsentGranted(true);
		};
		window.addEventListener("consent-updated", handler);
		return () => window.removeEventListener("consent-updated", handler);
	}, [channel]);

	// Validate pixel ID format to prevent script injection via config
	if (!pixelId || !consentGranted || !/^\d+$/.test(pixelId)) return null;

	return (
		<Script
			id="meta-pixel-init"
			strategy="afterInteractive"
			dangerouslySetInnerHTML={{
				__html: `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${pixelId}');fbq('track','PageView');`,
			}}
		/>
	);
}
