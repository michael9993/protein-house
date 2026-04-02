import { hasConsent } from "@/lib/consent";

let _channel = "";

export function setMetaPixelChannel(ch: string) {
	_channel = ch;
}

function fbq(...args: unknown[]): void {
	if (typeof window === "undefined") return;
	if (!hasConsent(_channel, "marketing")) return;
	if (typeof window.fbq === "function") {
		window.fbq(...args);
	}
}

export function trackMetaViewContent(params: {
	content_ids: string[];
	content_name: string;
	content_type: string;
	value: number;
	currency: string;
}): void {
	fbq("track", "ViewContent", params);
}

export function trackMetaAddToCart(params: {
	content_ids: string[];
	content_name: string;
	content_type: string;
	value: number;
	currency: string;
	num_items: number;
}): void {
	fbq("track", "AddToCart", params);
}

export function trackMetaInitiateCheckout(params: {
	content_ids: string[];
	value: number;
	currency: string;
	num_items: number;
}): void {
	fbq("track", "InitiateCheckout", params);
}

export function trackMetaPurchase(params: {
	content_ids: string[];
	content_name: string;
	value: number;
	currency: string;
	num_items: number;
}): void {
	fbq("track", "Purchase", params);
}
