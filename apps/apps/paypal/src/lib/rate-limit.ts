/**
 * Sliding-window rate limiter for webhook endpoints.
 *
 * In-memory Map keyed by client IP. Background sweep every 5 minutes.
 * For multi-instance deployments, replace with Redis-based limiter.
 */

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

interface RateLimitResult {
  allowed: boolean;
  resetAt: number;
}

export function createRateLimiter(config: RateLimitConfig) {
  const store = new Map<string, number[]>();

  const cleanup = setInterval(() => {
    const now = Date.now();
    for (const [key, timestamps] of store) {
      const valid = timestamps.filter((t) => now - t < config.windowMs);
      if (valid.length === 0) store.delete(key);
      else store.set(key, valid);
    }
  }, 5 * 60 * 1000);
  cleanup.unref?.();

  return function check(identifier: string): RateLimitResult {
    const now = Date.now();
    const timestamps = (store.get(identifier) ?? []).filter(
      (t) => now - t < config.windowMs,
    );

    if (timestamps.length >= config.maxRequests) {
      return { allowed: false, resetAt: timestamps[0] + config.windowMs };
    }

    timestamps.push(now);
    store.set(identifier, timestamps);
    return { allowed: true, resetAt: now + config.windowMs };
  };
}

export function getClientIp(request: Request): string {
  const forwarded = (request.headers.get("x-forwarded-for") ?? "").split(",")[0].trim();
  return forwarded || request.headers.get("x-real-ip") || "unknown";
}

/** 60 requests per minute — generous for webhooks but stops flooding */
export const webhookLimiter = createRateLimiter({
  windowMs: 60_000,
  maxRequests: 60,
});
