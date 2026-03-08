import { createHash } from "crypto";

import { createLogger } from "../../../logger";

const logger = createLogger("UnsubscribeUrlGenerator");

const TOKEN_SECRET = process.env.UNSUBSCRIBE_SECRET || "change-me-in-production";

if (!process.env.UNSUBSCRIBE_SECRET) {
    logger.warn(
        "UNSUBSCRIBE_SECRET env var is not set — using insecure default. " +
        "Set UNSUBSCRIBE_SECRET to a random 32+ character string in production.",
    );
}

export interface UnsubscribeTokenData {
    campaignId: string;
    subscriberId: string;
    email: string;
    channelSlug: string;
    saleorApiUrl: string;
    timestamp: number;
}

/**
 * Generate a secure unsubscribe token
 */
export function generateUnsubscribeToken(
    campaignId: string,
    subscriberId: string,
    email: string,
    channelSlug: string,
    saleorApiUrl: string,
): string {
    const timestamp = Date.now();
    const data: UnsubscribeTokenData = {
        campaignId,
        subscriberId,
        email,
        channelSlug,
        saleorApiUrl,
        timestamp,
    };

    const payload = JSON.stringify(data);
    const hash = createHash("sha256")
        .update(payload + TOKEN_SECRET)
        .digest("hex");

    // Combine payload and hash, then base64 encode
    const token = Buffer.from(`${payload}:${hash}`).toString("base64url");

    logger.debug("Generated unsubscribe token", { campaignId, subscriberId, channelSlug });

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
 * Returns a newsletter app API URL that will handle the unsubscribe and redirect to storefront
 * This approach avoids CORS issues by having the email link directly to the API
 */
export function generateUnsubscribeUrl(
    baseUrl: string,
    campaignId: string,
    subscriberId: string,
    email: string,
    channelSlug: string,
    saleorApiUrl: string,
): string {
    const token = generateUnsubscribeToken(campaignId, subscriberId, email, channelSlug, saleorApiUrl);
    // Use the newsletter app URL (tunnel URL for external access)
    const newsletterAppUrl = process.env.NEWSLETTER_APP_TUNNEL_URL || process.env.APP_API_BASE_URL || baseUrl;
    // Link directly to the API endpoint - it will process and redirect to storefront
    return `${newsletterAppUrl}/api/newsletter/unsubscribe/${token}`;
}
