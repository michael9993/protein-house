import { attachLoggerConsoleTransport, rootLogger } from "@saleor/apps-logger";

attachLoggerConsoleTransport(rootLogger);

export const createLogger = (name: string, params?: Record<string, unknown>) =>
  rootLogger.getSubLogger({ name }, params);

export const logger = createLogger("tax-manager");
