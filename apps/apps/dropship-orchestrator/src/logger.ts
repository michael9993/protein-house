import { attachLoggerConsoleTransport, rootLogger } from "@saleor/apps-logger";

// Always attach console transport — we don't run on Vercel so there's no
// Vercel runtime transport available. Without this, tslog's `type: "hidden"`
// swallows all log output silently.
attachLoggerConsoleTransport(rootLogger);

export const createLogger = (name: string, params?: Record<string, unknown>) =>
  rootLogger.getSubLogger({ name }, params);

export const logger = createLogger("dropship-orchestrator");
