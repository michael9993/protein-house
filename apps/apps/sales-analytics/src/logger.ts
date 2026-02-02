import { rootLogger } from "@saleor/apps-logger";

export const createLogger = (name: string, params?: Record<string, unknown>) =>
  rootLogger.getSubLogger({ name }, params);

export const logger = createLogger("sales-analytics");
