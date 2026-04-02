/**
 * Detect if the current browser is an in-app WebView (Instagram, Facebook, etc.).
 * These browsers have restrictions on cookies, localStorage, popups, and OAuth.
 */
export function isInAppBrowser(): boolean {
	if (typeof navigator === "undefined") return false;
	const ua = navigator.userAgent || "";
	return /FBAN|FBAV|Instagram|Line\/|Twitter|Snapchat|Pinterest|TikTok/i.test(ua);
}

/**
 * Open a URL — uses window.location.href in WebViews (where window.open is blocked),
 * falls back to window.open in normal browsers.
 */
export function openUrl(url: string): void {
	if (isInAppBrowser()) {
		window.location.href = url;
	} else {
		window.open(url, "_blank", "noopener,noreferrer");
	}
}

/**
 * Trigger a file download — uses a temporary <a> element with download attribute.
 * Works in WebViews where window.open is blocked.
 */
export function downloadUrl(url: string, filename?: string): void {
	const a = document.createElement("a");
	a.href = url;
	a.target = "_blank";
	a.rel = "noopener noreferrer";
	if (filename) a.download = filename;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
}
