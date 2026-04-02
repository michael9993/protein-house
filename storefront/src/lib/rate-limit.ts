/**
 * Shared sliding-window rate limiter for Next.js API routes.
 *
 * Uses an in-memory Map keyed by client identifier (typically IP).
 * Each entry stores an array of request timestamps within the active window.
 * Expired timestamps are pruned on every check, and a background interval
 * sweeps the entire store every 5 minutes to prevent memory leaks.
 */

interface RateLimitConfig {
	windowMs: number;
	maxRequests: number;
}

interface RateLimitResult {
	allowed: boolean;
	remaining: number;
	resetAt: number;
}

export function createRateLimiter(config: RateLimitConfig): (identifier: string) => RateLimitResult {
	const store = new Map<string, { timestamps: number[] }>();

	const cleanupInterval = setInterval(() => {
		const now = Date.now();
		for (const [key, record] of store) {
			record.timestamps = record.timestamps.filter((t) => now - t < config.windowMs);
			if (record.timestamps.length === 0) {
				store.delete(key);
			}
		}
	}, 5 * 60 * 1000);

	if (cleanupInterval.unref) {
		cleanupInterval.unref();
	}

	return function checkLimit(identifier: string): RateLimitResult {
		const now = Date.now();
		const record = store.get(identifier) ?? { timestamps: [] };

		record.timestamps = record.timestamps.filter((t) => now - t < config.windowMs);

		if (record.timestamps.length >= config.maxRequests) {
			return {
				allowed: false,
				remaining: 0,
				resetAt: record.timestamps[0] + config.windowMs,
			};
		}

		record.timestamps.push(now);
		store.set(identifier, record);

		return {
			allowed: true,
			remaining: config.maxRequests - record.timestamps.length,
			resetAt: now + config.windowMs,
		};
	};
}

export function getClientIp(request: Request): string {
	const forwarded = request.headers.get("x-forwarded-for");
	if (forwarded) {
		return forwarded.split(",")[0].trim();
	}
	return request.headers.get("x-real-ip") ?? "unknown";
}

export function rateLimitResponse(resetAt: number): Response {
	const retryAfterSeconds = Math.ceil((resetAt - Date.now()) / 1000);

	return new Response(JSON.stringify({ error: "Too many requests. Please try again later." }), {
		status: 429,
		headers: {
			"Content-Type": "application/json",
			"Retry-After": String(Math.max(retryAfterSeconds, 1)),
		},
	});
}

/** Strict: 5 req/min — for sensitive endpoints (contact, data-export, recover-cart) */
export const strictLimiter = createRateLimiter({ windowMs: 60_000, maxRequests: 5 });

/** Normal: 30 req/min — for general API routes (search, cart, reviews) */
export const normalLimiter = createRateLimiter({ windowMs: 60_000, maxRequests: 30 });

/** Relaxed: 60 req/min — for config/draft endpoints */
export const relaxedLimiter = createRateLimiter({ windowMs: 60_000, maxRequests: 60 });
