export interface PayPalWebhookUrlParams {
  saleorApiUrl: string;
  configurationId: string;
  appId: string;
}

/**
 * Builds the webhook URL with encoded params (following Stripe pattern).
 * PayPal will POST events to this URL.
 */
export function buildPayPalWebhookUrl(
  appBaseUrl: string,
  params: PayPalWebhookUrlParams,
): string {
  const url = new URL(appBaseUrl + "/api/webhooks/paypal");
  url.searchParams.set("saleorApiUrl", params.saleorApiUrl);
  url.searchParams.set("configurationId", params.configurationId);
  url.searchParams.set("appId", params.appId);
  return url.toString();
}
