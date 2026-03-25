"use client";

import Script from "next/script";
import { useEffect, useState } from "react";
import { useStoreConfig } from "@/providers/StoreConfigProvider";
import { hasConsent } from "@/lib/consent";
import {
  initDataLayer,
  flushEventQueue,
  setAnalyticsChannel,
} from "@/lib/analytics";

export function GoogleTagManager({ channel }: { channel: string }) {
  const config = useStoreConfig();
  const gtmId = config.integrations.analytics.googleTagManagerId;
  const [consentGranted, setConsentGranted] = useState(false);

  useEffect(() => {
    setAnalyticsChannel(channel);
    initDataLayer();

    if (hasConsent(channel, "analytics")) {
      setConsentGranted(true);
      flushEventQueue();
    }

    const handler = () => {
      if (hasConsent(channel, "analytics")) {
        setConsentGranted(true);
        flushEventQueue();
      }
    };
    window.addEventListener("consent-updated", handler);
    return () => window.removeEventListener("consent-updated", handler);
  }, [channel]);

  // Validate GTM ID format to prevent script injection via config
  if (!gtmId || !consentGranted || !/^GTM-[A-Z0-9]+$/i.test(gtmId)) return null;

  return (
    <Script
      id="gtm-init"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtmId}');`,
      }}
    />
  );
}
