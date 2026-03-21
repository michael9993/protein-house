/**
 * Generate URLs to PayPal Dashboard for viewing transaction details.
 */

export function generatePayPalOrderUrl(orderId: string, sandbox: boolean): string {
  const domain = sandbox ? "www.sandbox.paypal.com" : "www.paypal.com";
  return `https://${domain}/activity/payment/${orderId}`;
}

export function generatePayPalRefundUrl(captureId: string, sandbox: boolean): string {
  // PayPal doesn't have a direct refund URL — link to the activity page
  const domain = sandbox ? "www.sandbox.paypal.com" : "www.paypal.com";
  return `https://${domain}/activity/payment/${captureId}`;
}
