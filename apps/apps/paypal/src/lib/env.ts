import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";
import { fromError } from "zod-validation-error";

import { BaseError } from "@/lib/errors";

export const env = createEnv({
  client: {},
  server: {
    ALLOWED_DOMAIN_PATTERN: z.string().optional(),
    APP_API_BASE_URL: z.string().optional(),
    APP_IFRAME_BASE_URL: z.string().optional(),
    APP_LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace"]).default("info"),
    DATABASE_URL: z.string(),
    MANIFEST_APP_ID: z.string().optional().default("saleor.app.payment.paypal"),
    PORT: z.coerce.number().optional().default(3000),
    SECRET_KEY: z.string(),
    APP_NAME: z.string().optional().default("PayPal"),
  },
  shared: {
    NODE_ENV: z.enum(["development", "production", "test"]).optional().default("development"),
  },
  runtimeEnv: {
    ALLOWED_DOMAIN_PATTERN: process.env.ALLOWED_DOMAIN_PATTERN,
    APP_API_BASE_URL: process.env.APP_API_BASE_URL,
    APP_IFRAME_BASE_URL: process.env.APP_IFRAME_BASE_URL,
    APP_LOG_LEVEL: process.env.APP_LOG_LEVEL,
    DATABASE_URL: process.env.DATABASE_URL,
    MANIFEST_APP_ID: process.env.MANIFEST_APP_ID,
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT,
    SECRET_KEY: process.env.SECRET_KEY,
    APP_NAME: process.env.APP_NAME,
  },
  isServer: typeof window === "undefined" || process.env.NODE_ENV === "test",
  onValidationError(issues) {
    const validationError = fromError(issues);
    const EnvValidationError = BaseError.subclass("EnvValidationError");
    throw new EnvValidationError(validationError.toString(), { cause: issues });
  },
});
