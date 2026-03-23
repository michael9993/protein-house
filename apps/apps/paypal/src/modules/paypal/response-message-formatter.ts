import { createLogger } from "@/lib/logger";

const logger = createLogger("ResponseMessageFormatter");

/**
 * Formats user-facing messages for PayPal webhook responses.
 * Keeps a consistent pattern for message formatting across all webhook handlers.
 */
export class ResponseMessageFormatter {
  constructor(private context: { appName: string }) {}

  /**
   * Format a user-facing message, optionally logging the underlying error.
   * Returns only the user message — the error is for logging, not for the end user.
   */
  formatMessage(userMessage: string, error?: Error): string {
    if (error) {
      logger.debug("Formatting error message", {
        appName: this.context.appName,
        userMessage,
        errorMessage: error.message,
      });
    }
    return userMessage;
  }

  /**
   * Format an error message that includes the error detail.
   * Use when the error message is safe to expose (e.g., PayPal API public messages).
   */
  formatErrorMessage(userMessage: string, error: Error): string {
    return `${userMessage}: ${error.message}`;
  }
}
