"use client";

import { useEffect } from "react";
import { reportWebVitals } from "@/lib/web-vitals";

/**
 * Invisible client component that registers Core Web Vitals observers.
 * Sends LCP, INP, CLS, FCP, and TTFB metrics to GA4 via the dataLayer.
 * Consent-gated — metrics queue until analytics consent is granted.
 */
export function WebVitalsReporter() {
	useEffect(() => {
		reportWebVitals();
	}, []);

	return null;
}
