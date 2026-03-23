import { describe, expect, it, vi } from "vitest";

import { ResponseMessageFormatter } from "./response-message-formatter";

// Mock the logger
vi.mock("@/lib/logger", () => ({
  createLogger: () => ({
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  }),
}));

describe("ResponseMessageFormatter", () => {
  const formatter = new ResponseMessageFormatter({ appName: "PayPal" });

  describe("formatMessage", () => {
    it("returns user message without error", () => {
      const result = formatter.formatMessage("Payment captured successfully");
      expect(result).toBe("Payment captured successfully");
    });

    it("returns user message even when error is provided", () => {
      const error = new Error("Internal PayPal failure");
      const result = formatter.formatMessage("Payment failed", error);
      expect(result).toBe("Payment failed");
    });

    it("does not include the error message in the return value", () => {
      const error = new Error("Sensitive internal detail");
      const result = formatter.formatMessage("Something went wrong", error);
      expect(result).not.toContain("Sensitive internal detail");
    });
  });

  describe("formatErrorMessage", () => {
    it("concatenates user message and error message", () => {
      const error = new Error("INVALID_RESOURCE_ID");
      const result = formatter.formatErrorMessage("Refund failed", error);
      expect(result).toBe("Refund failed: INVALID_RESOURCE_ID");
    });

    it("handles empty error message", () => {
      const error = new Error("");
      const result = formatter.formatErrorMessage("Operation failed", error);
      expect(result).toBe("Operation failed: ");
    });
  });
});
