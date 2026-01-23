import { createHash, randomBytes } from "crypto";

import { createLogger } from "../../../logger";

const logger = createLogger("UnsubscribeUrlGenerator");

const TOKEN_SECRET = process.env.UNSUBSCRIBE_SECRET || "change-me-in-production";

export interface UnsubscribeTokenData {
  campaignId: string;
  subscriberId: string;
  email: string;
  timestamp: number;
}

/**
 * Generate a secure unsubscribe token
 */
export function generateUnsubscribeToken(
  campaignId: string,
  subscriberId: string,
  email: string,
): string {
  const timestamp = Date.now();
  const data: UnsubscribeTokenData = {
    campaignId,
    subscriberId,
    email,
    timestamp,
  };

  const payload = JSON.stringify(data);
  const hash = createHash("sha256")
    .update(payload + TOKEN_SECRET)
    .digest("hex");

  // Combine payload and hash, then base64 encode
  const token = Buffer.from(`${payload}:${hash}`).toString("base64url");

  logger.debug("Generated unsubscribe token", { campaignId, subscriberId });

  return token;
}

/**
 * Validate and decode an unsubscribe token
 */
export function validateUnsubscribeToken(token: string): UnsubscribeTokenData | null {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf-8");
    const [payload, hash] = decoded.split(":");

    if (!payload || !hash) {
      logger.warn("Invalid token format");
      return null;
    }

    // Verify hash
    const expectedHash = createHash("sha256")
      .update(payload + TOKEN_SECRET)
      .digest("hex");

    if (hash !== expectedHash) {
      logger.warn("Token hash mismatch");
      return null;
    }

    const data: UnsubscribeTokenData = JSON.parse(payload);

    // Check expiration (tokens expire after 1 year)
    const oneYear = 365 * 24 * 60 * 60 * 1000;
    if (Date.now() - data.timestamp > oneYear) {
      logger.warn("Token expired", { timestamp: data.timestamp });
      return null;
    }

    return data;
  } catch (error) {
    logger.error("Error validating unsubscribe token", { error });
    return null;
  }
}

/**
 * Generate unsubscribe URL
 */
export function generateUnsubscribeUrl(
  baseUrl: string,
  campaignId: string,
  subscriberId: string,
  email: string,
): string {
  const token = generateUnsubscribeToken(campaignId, subscriberId, email);
  return `${baseUrl}/api/newsletter/unsubscribe/${token}`;
}
