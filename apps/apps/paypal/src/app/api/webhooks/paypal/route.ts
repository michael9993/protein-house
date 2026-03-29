import { NextRequest } from "next/server";

import { createLogger } from "@/lib/logger";
import { webhookLimiter, getClientIp } from "@/lib/rate-limit";
import { parseWebhookParams } from "./webhook-params";
import { handlePayPalWebhook } from "./use-case";

const logger = createLogger("PayPalWebhookRoute");

export async function POST(request: NextRequest) {
  // Rate limit webhook requests to prevent flooding
  const clientIp = getClientIp(request);
  const { allowed, resetAt } = webhookLimiter(clientIp);
  if (!allowed) {
    logger.warn("Webhook rate limited", { clientIp });
    const retryAfter = Math.ceil((resetAt - Date.now()) / 1000);
    return Response.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(Math.max(retryAfter, 1)) } },
    );
  }

  try {
    // Parse webhook params from URL query string
    const paramsResult = parseWebhookParams(request.url);
    if (paramsResult.isErr()) {
      return Response.json(
        { error: paramsResult.error.message },
        { status: 400 },
      );
    }

    // Read raw body for signature verification
    const rawBody = await request.text();

    // Extract PayPal signature headers
    const headers: Record<string, string> = {};
    for (const key of [
      "paypal-transmission-id",
      "paypal-transmission-time",
      "paypal-cert-url",
      "paypal-auth-algo",
      "paypal-transmission-sig",
    ]) {
      const value = request.headers.get(key);
      if (value) headers[key] = value;
    }

    const result = await handlePayPalWebhook({
      rawBody,
      headers,
      webhookParams: paramsResult.value,
    });

    if (result.isErr()) {
      return Response.json(
        { error: result.error.message },
        { status: result.error.status },
      );
    }

    return Response.json(result.value, { status: 200 });
  } catch (error) {
    logger.error("Unhandled error in PayPal webhook", { error });
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}
