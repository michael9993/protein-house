import { NextRequest } from "next/server";
import { timingSafeEqual } from "node:crypto";

import { createLogger } from "@/lib/logger";

const logger = createLogger("PollPendingRefunds");

/**
 * Poll PayPal for pending refund status updates.
 * Called via cron or manually: GET /api/webhooks/paypal/poll-pending-refunds
 *
 * This is a fallback -- primary tracking is via PayPal webhooks.
 * Checks any refunds that were returned as PENDING and queries PayPal for updates.
 */
export async function GET(request: NextRequest) {
  // Auth: require a secret header to prevent unauthorized polling
  const expectedSecret = process.env.POLL_SECRET;
  if (!expectedSecret) {
    logger.error("POLL_SECRET environment variable is not configured");
    return Response.json({ error: "Endpoint not configured" }, { status: 500 });
  }

  const authHeader = request.headers.get("x-poll-secret") ?? "";
  // Use timing-safe comparison to prevent timing attacks
  const a = Buffer.from(authHeader);
  const b = Buffer.from(expectedSecret);
  if (a.byteLength !== b.byteLength || !timingSafeEqual(a, b)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  logger.info("Polling for pending refunds");

  // Placeholder: full implementation requires a pending refunds tracking table.
  // When a refund returns PENDING status, we'd store { refundId, transactionId, createdAt }
  // in a DB table. This endpoint would:
  // 1. Query pending refunds from the table
  // 2. Call PayPal GET /v2/payments/refunds/{id} for each
  // 3. If status changed from PENDING -> COMPLETED/FAILED, call transactionEventReport
  // 4. Remove completed/failed entries from the tracking table

  return Response.json({
    message: "Polling endpoint ready -- pending refund tracking not yet implemented",
    timestamp: new Date().toISOString(),
  });
}
