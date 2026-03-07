import type { NextApiRequest, NextApiResponse } from "next";
import { createGraphQLClient } from "@saleor/apps-shared/create-graphql-client";
import type { Client } from "urql";

import { createLogger } from "@/logger";
import { getRedisConnection } from "@/modules/jobs/queues";
import { getClientIp, isIpAllowed } from "@/modules/security/ip-whitelist";
import { checkRateLimit } from "@/modules/security/rate-limiter";
import { saleorApp } from "@/saleor-app";

const CJ_WEBHOOK_IPS = [
  "47.252.50.116",
  "47.252.50.117",
  "47.252.50.118",
  "47.252.50.119",
  "47.88.76.0/24",
];

const DEDUP_KEY_PREFIX = "dropship:cj:dedup:";

export interface CJWebhookContext {
  client: Client;
  clientIp: string;
  startTime: number;
}

/**
 * Shared authentication and setup wrapper for all CJ webhook handlers.
 *
 * Consolidates: method check, IP whitelist, rate limiting, secret verification,
 * deduplication, Saleor auth resolution, and GraphQL client creation.
 *
 * The handler callback receives a context with `{ client, clientIp, startTime }`.
 * Dedup mark happens AFTER the handler succeeds (DLQ-safe pattern).
 */
export async function withCJWebhookAuth(
  req: NextApiRequest,
  res: NextApiResponse,
  opts: { messageId: string; dedupTtl?: number; loggerName: string },
  handler: (ctx: CJWebhookContext) => Promise<void>,
): Promise<void> {
  const startTime = Date.now();
  const logger = createLogger(opts.loggerName);

  // --- Method check ---
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const clientIp = getClientIp(req);

  // --- IP whitelist (log-only behind Cloudflare tunnel) ---
  if (!isIpAllowed(clientIp, CJ_WEBHOOK_IPS)) {
    logger.warn("IP not in whitelist (allowed — behind tunnel)", { clientIp });
  }

  // --- Rate limit ---
  try {
    const rateLimit = await checkRateLimit(clientIp);
    if (!rateLimit.allowed) {
      logger.warn("Rate limit exceeded", { clientIp, remaining: rateLimit.remaining });
      res.status(429).json({ error: "Too many requests" });
      return;
    }
  } catch (error) {
    logger.warn("Rate limit check failed — allowing request", {
      error: error instanceof Error ? error.message : String(error),
    });
  }

  // --- Webhook secret verification ---
  try {
    const expectedSecret = await getRedisConnection().get("dropship:cj-webhook-secret");
    if (expectedSecret && req.query.secret !== expectedSecret) {
      logger.warn("Invalid webhook secret", { clientIp });
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
  } catch (error) {
    logger.warn("Secret check failed — allowing request", {
      error: error instanceof Error ? error.message : String(error),
    });
  }

  // --- Dedup check (do NOT mark processed yet — caller marks after success) ---
  try {
    const redis = getRedisConnection();
    const existing = await redis.get(DEDUP_KEY_PREFIX + opts.messageId);
    if (existing !== null) {
      logger.info("Duplicate message — skipping", { messageId: opts.messageId });
      res.status(200).json({ success: true, message: "Duplicate — already processed" });
      return;
    }
  } catch (error) {
    logger.warn("Dedup check failed — allowing message", {
      messageId: opts.messageId,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  // --- Resolve Saleor auth data ---
  const allAuth = typeof (saleorApp.apl as any).getAll === "function"
    ? await (saleorApp.apl as any).getAll()
    : [];
  const authData = Array.isArray(allAuth) ? allAuth[0] : null;

  if (!authData) {
    logger.error("No Saleor auth data available");
    res.status(200).json({ success: true, message: "No auth data — acknowledged" });
    return;
  }

  const client = createGraphQLClient({
    saleorApiUrl: authData.saleorApiUrl,
    token: authData.token,
  });

  // --- Run handler (with DLQ on failure) ---
  try {
    await handler({ client, clientIp, startTime });
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : String(e);
    logger.error("CJ webhook handler failed — queuing to DLQ", {
      messageId: opts.messageId,
      error: errorMessage,
    });

    try {
      const redis = getRedisConnection();
      await redis.lpush(
        "dropship:dlq:cj",
        JSON.stringify({
          payload: req.body,
          error: errorMessage,
          timestamp: new Date().toISOString(),
          endpoint: req.url,
        }),
      );
    } catch (dlqError) {
      logger.error("Failed to push to DLQ", {
        messageId: opts.messageId,
        error: dlqError instanceof Error ? dlqError.message : String(dlqError),
      });
    }

    // Return 200 so CJ doesn't retry — we handle retries via DLQ
    res.status(200).json({ success: true, message: "Processing failed — queued for retry" });
    return;
  }

  // --- Mark processed AFTER success ---
  try {
    const redis = getRedisConnection();
    await redis.set(DEDUP_KEY_PREFIX + opts.messageId, "1", "EX", opts.dedupTtl ?? 86400);
  } catch (error) {
    logger.warn("Dedup mark failed", {
      messageId: opts.messageId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
