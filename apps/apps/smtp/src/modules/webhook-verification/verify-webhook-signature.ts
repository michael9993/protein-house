import { createPublicKey, verify } from "node:crypto";

import { createLogger } from "../../logger";

const logger = createLogger("verifyWebhookSignature");

/**
 * Saleor signs webhooks with JWS (PyJWT): detached payload, b64:false (RFC 7797).
 * Signing input = base64url(header) + "." + raw_body_bytes.
 * JWS token = base64url(header) + "." + "" + "." + base64url(signature).
 * We verify manually so we match this format exactly (SDK's verifySignatureWithJwks can fail with "JWKS verification failed").
 */

const ALG = "RS256";

type JwksKey = { kid?: string; kty?: string; n?: string; e?: string };

function base64UrlDecode(str: string): Buffer {
  const base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  const pad = base64.length % 4;
  const padded = pad ? base64 + "=".repeat(4 - pad) : base64;

  return Buffer.from(padded, "base64");
}

function getRsaKeysFromJwks(jwksJson: { keys?: JwksKey[] }): JwksKey[] {
  const keys = jwksJson?.keys;

  if (!Array.isArray(keys)) return [];

  return keys.filter((k) => k?.kty === "RSA" && k?.n && k?.e);
}

function getJwkByKid(jwksJson: { keys?: JwksKey[] }, kid: string): JwksKey | undefined {
  const keys = jwksJson?.keys;

  if (!Array.isArray(keys)) return undefined;

  return keys.find((k) => k?.kid === kid && k?.kty === "RSA" && k?.n && k?.e);
}


/**
 * Verify Saleor webhook JWS manually (detached payload, b64:false).
 * Uses same signing input as PyJWT: base64url(header) + "." + payload_bytes.
 * Tries key by kid first; if no match (e.g. kid encoding differs), tries each RSA key until one verifies.
 */
function verifySaleorJws(signature: string, rawBody: string, jwksJson: { keys?: JwksKey[] }): void {
  const parts = signature.split(".");

  if (parts.length !== 3) {

    throw new Error(`Invalid JWS structure: expected 3 parts, got ${parts.length}`);
  }

  const [headerB64, , sigB64] = parts;

  if (!headerB64 || !sigB64) {

    throw new Error("Invalid JWS: missing header or signature");
  }

  const headerJson = base64UrlDecode(headerB64).toString("utf8");
  const header = JSON.parse(headerJson) as { kid?: string; alg?: string; b64?: boolean };

  if (header.alg !== ALG) {

    throw new Error(`Unsupported JWS alg: ${header.alg}`);
  }

  const signingInput = `${headerB64}.${rawBody}`;
  const signingInputBuffer = Buffer.from(signingInput, "utf8");
  const signatureBuffer = base64UrlDecode(sigB64);
  const rsaKeys = getRsaKeysFromJwks(jwksJson);

  if (rsaKeys.length === 0) {

    throw new Error("No RSA keys in JWKS");
  }

  const kid = header.kid;
  let keysToTry: JwksKey[] = kid ? [getJwkByKid(jwksJson, kid)].filter(Boolean) as JwksKey[] : [];

  if (keysToTry.length === 0) {

    keysToTry = rsaKeys;
  }

  let lastError: Error | undefined;

  for (const jwk of keysToTry) {
    try {
      const publicKey = createPublicKey({
        key: { kty: "RSA", n: jwk.n, e: jwk.e },
        format: "jwk",
      });

      const ok = verify("RSA-SHA256", signingInputBuffer, publicKey, signatureBuffer);

      if (ok) return;
    } catch (e) {

      lastError = e instanceof Error ? e : new Error(String(e));
    }
  }

  throw lastError ?? new Error("Signature verification failed");
}


/**
 * Custom webhook signature verification for SMTP app.
 *
 * Verifies Saleor's JWS manually (detached payload, b64:false) so we match the signer exactly.
 * Fetches fresh JWKS from NEXT_PUBLIC_SALEOR_API_URL (tunnel or domain) then verifies.
 */
export async function verifyWebhookSignature(
  jwks: string,
  signature: string,
  rawBody: string,
): Promise<void> {
  logger.debug("verifyWebhookSignature called", {
    jwksLength: typeof jwks === "string" ? jwks.length : 0,
    signatureLength: signature.length,
    rawBodyLength: rawBody.length,
  });

  try {
    const jwksToUse = await resolveJwks(jwks);
    const jwksJson = JSON.parse(jwksToUse) as { keys?: JwksKey[] };

    if (!jwksJson?.keys || !Array.isArray(jwksJson.keys) || jwksJson.keys.length === 0) {

      throw new Error("Invalid JWKS structure");
    }

    verifySaleorJws(signature, rawBody, jwksJson);

    logger.debug("Signature verification succeeded");
  } catch (error) {
    logger.error("Webhook signature verification error", {
      error: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
    });

    throw error;
  }
}

async function resolveJwks(jwks: string): Promise<string> {
  const envSaleorApiUrl = process.env.NEXT_PUBLIC_SALEOR_API_URL;
  const saleorBaseUrl = envSaleorApiUrl
    ? envSaleorApiUrl.replace(/\/graphql\/?$/, "")
    : typeof jwks === "string" && (jwks.startsWith("http://") || jwks.startsWith("https://"))
      ? new URL(jwks).origin
      : "http://localhost:8000";

  const jwksEndpoint = `${saleorBaseUrl}/.well-known/jwks.json`;

  logger.debug("Fetching JWKS from Saleor", { jwksEndpoint });

  try {
    const response = await fetch(jwksEndpoint, {
      method: "GET",
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {

      throw new Error(`Failed to fetch JWKS: ${response.status} ${response.statusText}`);
    }

    const jwksJson = (await response.json()) as { keys?: unknown[] };

    if (!jwksJson?.keys || !Array.isArray(jwksJson.keys) || jwksJson.keys.length === 0) {

      throw new Error("Invalid JWKS structure");
    }

    return JSON.stringify(jwksJson);
  } catch (fetchError) {
    if (typeof jwks === "string" && jwks.length > 0 && !jwks.startsWith("http://") && !jwks.startsWith("https://")) {
      try {
        const parsed = JSON.parse(jwks) as { keys?: unknown[] };

        if (parsed?.keys && Array.isArray(parsed.keys) && parsed.keys.length > 0) {

          logger.debug("Using stored JWKS from APL after fetch failure");

          return jwks;
        }
      } catch {
        // fall through to rethrow fetch error
      }
    }

    throw fetchError;
  }
}
