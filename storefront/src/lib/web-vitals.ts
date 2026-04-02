import { onCLS, onINP, onLCP, onFCP, onTTFB, type Metric } from "web-vitals";
import { pushDataLayer } from "@/lib/analytics";

/**
 * Sends a Core Web Vitals metric to GA4 via the dataLayer.
 * Consent-gated automatically by pushDataLayer (queues if no analytics consent).
 */
function sendToGA4(metric: Metric): void {
	pushDataLayer({
		event: "web_vitals",
		metric_name: metric.name,
		metric_value: Math.round(metric.name === "CLS" ? metric.value * 1000 : metric.value),
		metric_delta: Math.round(metric.name === "CLS" ? metric.delta * 1000 : metric.delta),
		metric_id: metric.id,
		metric_rating: metric.rating,
	});
}

/**
 * Registers all Core Web Vitals observers.
 * Call once per page load from a client component.
 *
 * Metrics reported:
 * - LCP  (Largest Contentful Paint) — loading performance
 * - INP  (Interaction to Next Paint) — responsiveness
 * - CLS  (Cumulative Layout Shift)  — visual stability
 * - FCP  (First Contentful Paint)    — perceived load speed
 * - TTFB (Time to First Byte)       — server responsiveness
 */
export function reportWebVitals(): void {
	onLCP(sendToGA4);
	onINP(sendToGA4);
	onCLS(sendToGA4);
	onFCP(sendToGA4);
	onTTFB(sendToGA4);
}
