import type { NextApiRequest } from "next";

import { createLogger } from "@/logger";

const logger = createLogger("security:ip-whitelist");

// ---------------------------------------------------------------------------
// CIDR parsing
// ---------------------------------------------------------------------------

/**
 * Parse an IPv4 address into a 32-bit unsigned integer.
 * Returns `null` for invalid addresses.
 */
function ipToNumber(ip: string): number | null {
  const parts = ip.trim().split(".");

  if (parts.length !== 4) {
    return null;
  }

  let result = 0;

  for (const part of parts) {
    const octet = Number(part);

    if (!Number.isInteger(octet) || octet < 0 || octet > 255) {
      return null;
    }

    // Use unsigned right shift of 0 to ensure unsigned 32-bit
    result = ((result << 8) | octet) >>> 0;
  }

  return result;
}

/**
 * Check whether an IP address falls within a CIDR range.
 *
 * @param ip   - The IP address to check (e.g. "47.88.12.34")
 * @param cidr - The CIDR block (e.g. "47.88.0.0/16")
 */
function isInCidrRange(ip: string, cidr: string): boolean {
  const [network, prefixStr] = cidr.split("/");

  if (!network || !prefixStr) {
    return false;
  }

  const prefix = Number(prefixStr);

  if (!Number.isInteger(prefix) || prefix < 0 || prefix > 32) {
    return false;
  }

  const ipNum = ipToNumber(ip);
  const networkNum = ipToNumber(network);

  if (ipNum === null || networkNum === null) {
    return false;
  }

  // Create the subnet mask: e.g. prefix=16 -> 0xFFFF0000
  // Use unsigned right shift to handle 32-bit unsigned properly
  const mask = prefix === 0 ? 0 : (~0 << (32 - prefix)) >>> 0;

  return ((ipNum & mask) >>> 0) === ((networkNum & mask) >>> 0);
}

// ---------------------------------------------------------------------------
// Client IP extraction
// ---------------------------------------------------------------------------

/**
 * Extract the client IP address from a Next.js API request.
 *
 * Checks (in order):
 *   1. `x-forwarded-for` header (first entry, commonly set by proxies/LBs)
 *   2. `x-real-ip` header
 *   3. `req.socket.remoteAddress`
 *
 * Falls back to `"unknown"` if none are available.
 */
export function getClientIp(req: NextApiRequest): string {
  // x-forwarded-for can be a comma-separated list; first entry is the client
  const forwarded = req.headers["x-forwarded-for"];

  if (forwarded) {
    const first = (Array.isArray(forwarded) ? forwarded[0] : forwarded)?.split(",")[0]?.trim();

    if (first && first.length > 0) {
      // Normalize IPv4-mapped IPv6
      if (first.startsWith("::ffff:")) {
        return first.slice(7);
      }

      return first;
    }
  }

  const realIp = req.headers["x-real-ip"];

  if (realIp) {
    const value = Array.isArray(realIp) ? realIp[0] : realIp;

    if (value && value.trim().length > 0) {
      const trimmed = value.trim();

      if (trimmed.startsWith("::ffff:")) {
        return trimmed.slice(7);
      }

      return trimmed;
    }
  }

  const remoteAddress = req.socket?.remoteAddress;

  if (remoteAddress) {
    // Node may return IPv6-mapped IPv4 like "::ffff:127.0.0.1"
    if (remoteAddress.startsWith("::ffff:")) {
      return remoteAddress.slice(7);
    }

    return remoteAddress;
  }

  return "unknown";
}

// ---------------------------------------------------------------------------
// IP allowance check
// ---------------------------------------------------------------------------

/**
 * Check whether an IP address is in the allowed list.
 * Supports both individual IPs and CIDR notation.
 *
 * An empty `allowedIps` list means **all IPs are allowed** (whitelist disabled).
 */
export function isIpAllowed(ip: string, allowedIps: string[]): boolean {
  // Empty whitelist = no restriction
  if (allowedIps.length === 0) {
    return true;
  }

  for (const entry of allowedIps) {
    const trimmed = entry.trim();

    // CIDR notation
    if (trimmed.includes("/")) {
      if (isInCidrRange(ip, trimmed)) {
        return true;
      }

      continue;
    }

    // Exact IP match
    if (ip === trimmed) {
      return true;
    }
  }

  return false;
}

// ---------------------------------------------------------------------------
// Middleware factory
// ---------------------------------------------------------------------------

/**
 * Create a middleware function that checks whether the incoming request's IP
 * is on the whitelist.
 *
 * Returns `true` if the request is allowed, `false` if blocked.
 * Blocked requests are logged as security events.
 *
 * @param allowedIps - Array of allowed IPs / CIDR ranges.
 *                     Pass an empty array to disable the whitelist.
 */
export function createIpWhitelistMiddleware(
  allowedIps: string[],
): (req: NextApiRequest) => boolean {
  return (req: NextApiRequest): boolean => {
    const clientIp = getClientIp(req);
    const allowed = isIpAllowed(clientIp, allowedIps);

    if (!allowed) {
      logger.warn("IP whitelist: blocked request from unauthorized IP", {
        clientIp,
        path: req.url,
        method: req.method,
        allowedCount: allowedIps.length,
      });
    } else {
      logger.debug("IP whitelist: request allowed", {
        clientIp,
      });
    }

    return allowed;
  };
}
