import { hasConsent } from "@/lib/consent";

let _channel = "";

export function setTikTokPixelChannel(ch: string) {
	_channel = ch;
}

function ttq(method: string, ...args: unknown[]): void {
	if (typeof window === "undefined") return;
	if (!hasConsent(_channel, "marketing")) return;
	if (typeof window.ttq?.[method] === "function") {
		window.ttq[method](...args);
	}
}

export function trackTikTokViewContent(params: {
	content_id: string;
	content_name: string;
	content_type: string;
	value: number;
	currency: string;
}): void {
	ttq("track", "ViewContent", params);
}

export function trackTikTokAddToCart(params: {
	content_id: string;
	content_name: string;
	content_type: string;
	value: number;
	currency: string;
	quantity: number;
}): void {
	ttq("track", "AddToCart", params);
}

export function trackTikTokPlaceAnOrder(params: {
	content_id: string;
	content_type: string;
	value: number;
	currency: string;
}): void {
	ttq("track", "PlaceAnOrder", params);
}

export function trackTikTokCompletePayment(params: {
	content_id: string;
	content_type: string;
	value: number;
	currency: string;
}): void {
	ttq("track", "CompletePayment", params);
}
