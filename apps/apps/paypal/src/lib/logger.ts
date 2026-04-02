import { attachLoggerConsoleTransport, rootLogger } from "@saleor/apps-logger";

import { env } from "./env";

rootLogger.settings.maskValuesOfKeys = ["token", "secretKey", "clientSecret"];

// Always attach console transport — logs are essential for debugging webhooks
attachLoggerConsoleTransport(rootLogger);

export const createLogger = (name: string, params?: Record<string, unknown>) =>
  rootLogger.getSubLogger(
    {
      name: name,
    },
    params,
  );
