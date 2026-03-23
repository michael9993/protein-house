import { describe, expect, it } from "vitest";

import { generatePayPalOrderUrl, generatePayPalRefundUrl } from "./generate-paypal-dashboard-urls";

describe("generatePayPalOrderUrl", () => {
  it("generates sandbox order URL", () => {
    const url = generatePayPalOrderUrl("ORDER-123", true);
    expect(url).toBe("https://www.sandbox.paypal.com/activity/payment/ORDER-123");
  });

  it("generates live order URL", () => {
    const url = generatePayPalOrderUrl("ORDER-456", false);
    expect(url).toBe("https://www.paypal.com/activity/payment/ORDER-456");
  });
});

describe("generatePayPalRefundUrl", () => {
  it("generates sandbox refund URL", () => {
    const url = generatePayPalRefundUrl("CAPTURE-789", true);
    expect(url).toBe("https://www.sandbox.paypal.com/activity/payment/CAPTURE-789");
  });

  it("generates live refund URL", () => {
    const url = generatePayPalRefundUrl("CAPTURE-012", false);
    expect(url).toBe("https://www.paypal.com/activity/payment/CAPTURE-012");
  });
});
