import { getRedisConnection } from "@/modules/jobs/queues";

const RATE_LIMIT_WINDOW_SECONDS = 60;
const RATE_LIMIT_MAX_REQUESTS = 100;
const RATE_LIMIT_KEY_PREFIX = "dropship:ratelimit:";

export async function checkRateLimit(
  ip: string,
): Promise<{ allowed: boolean; remaining: number }> {
  const redis = getRedisConnection();
  const key = RATE_LIMIT_KEY_PREFIX + ip;
  const current = await redis.incr(key);

  if (current === 1) {
    await redis.expire(key, RATE_LIMIT_WINDOW_SECONDS);
  }

  return {
    allowed: current <= RATE_LIMIT_MAX_REQUESTS,
    remaining: Math.max(0, RATE_LIMIT_MAX_REQUESTS - current),
  };
}
