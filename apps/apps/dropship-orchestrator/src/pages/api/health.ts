import type { NextApiRequest, NextApiResponse } from "next";

import { getRedisConnection } from "@/modules/jobs/queues";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const checks: Record<string, { status: "ok" | "error"; message?: string }> = {};

  // Check Redis
  try {
    const redis = getRedisConnection();
    await redis.ping();
    checks.redis = { status: "ok" };
  } catch (err) {
    checks.redis = {
      status: "error",
      message: err instanceof Error ? err.message : "Redis unavailable",
    };
  }

  // Check Saleor API
  try {
    const { saleorApp } = await import("@/saleor-app");
    const allAuth =
      typeof (saleorApp.apl as any).getAll === "function"
        ? await (saleorApp.apl as any).getAll()
        : [];
    checks.saleor =
      allAuth.length > 0
        ? { status: "ok" }
        : { status: "error", message: "No auth data registered" };
  } catch (err) {
    checks.saleor = {
      status: "error",
      message: err instanceof Error ? err.message : "Saleor check failed",
    };
  }

  const allHealthy = Object.values(checks).every((c) => c.status === "ok");

  res.status(allHealthy ? 200 : 503).json({
    status: allHealthy ? "healthy" : "degraded",
    timestamp: new Date().toISOString(),
    checks,
  });
}
