import { describe, expect, it } from "vitest";

import {
  chargeSuccessResponse,
  chargeFailureResponse,
  authorizationSuccessResponse,
  authorizationFailureResponse,
  refundSuccessResponse,
  refundFailureResponse,
  cancelSuccessResponse,
  cancelFailureResponse,
  initializeActionRequiredResponse,
  initializeFailureResponse,
} from "./paypal-webhook-responses";

describe("chargeSuccessResponse", () => {
  it("returns CHARGE_SUCCESS result with default REFUND action", async () => {
    const response = chargeSuccessResponse({
      pspReference: "PP-123",
      amount: 99.99,
    });

    const body = await response.json();

    expect(body.result).toBe("CHARGE_SUCCESS");
    expect(body.pspReference).toBe("PP-123");
    expect(body.amount).toBe(99.99);
    expect(body.actions).toEqual(["REFUND"]);
    expect(body.message).toBe("Payment captured successfully");
  });

  it("uses custom message when provided", async () => {
    const response = chargeSuccessResponse({
      pspReference: "PP-123",
      amount: 50,
      message: "Custom success",
    });

    const body = await response.json();
    expect(body.message).toBe("Custom success");
  });

  it("includes externalUrl when provided", async () => {
    const response = chargeSuccessResponse({
      pspReference: "PP-123",
      amount: 50,
      externalUrl: "https://paypal.com/activity/payment/PP-123",
    });

    const body = await response.json();
    expect(body.externalUrl).toBe("https://paypal.com/activity/payment/PP-123");
  });
});

describe("chargeFailureResponse", () => {
  it("returns CHARGE_FAILURE result with default CHARGE retry action", async () => {
    const response = chargeFailureResponse({
      message: "Capture failed",
    });

    const body = await response.json();

    expect(body.result).toBe("CHARGE_FAILURE");
    expect(body.message).toBe("Capture failed");
    expect(body.actions).toEqual(["CHARGE"]);
  });

  it("includes pspReference when provided", async () => {
    const response = chargeFailureResponse({
      pspReference: "PP-456",
      message: "Capture failed",
    });

    const body = await response.json();
    expect(body.pspReference).toBe("PP-456");
  });

  it("omits pspReference when not provided", async () => {
    const response = chargeFailureResponse({
      message: "Capture failed",
    });

    const body = await response.json();
    expect(body.pspReference).toBeUndefined();
  });

  it("allows custom actions override", async () => {
    const response = chargeFailureResponse({
      message: "Non-retryable failure",
      actions: [],
    });

    const body = await response.json();
    expect(body.actions).toEqual([]);
  });
});

describe("authorizationSuccessResponse", () => {
  it("returns AUTHORIZATION_SUCCESS result with CHARGE and CANCEL actions", async () => {
    const response = authorizationSuccessResponse({
      pspReference: "PP-AUTH-1",
      amount: 200,
    });

    const body = await response.json();

    expect(body.result).toBe("AUTHORIZATION_SUCCESS");
    expect(body.pspReference).toBe("PP-AUTH-1");
    expect(body.amount).toBe(200);
    expect(body.actions).toEqual(["CHARGE", "CANCEL"]);
    expect(body.message).toBe("Payment authorized successfully");
  });

  it("uses custom message when provided", async () => {
    const response = authorizationSuccessResponse({
      pspReference: "PP-AUTH-1",
      amount: 200,
      message: "PayPal (john@example.com)",
    });

    const body = await response.json();
    expect(body.message).toBe("PayPal (john@example.com)");
  });
});

describe("authorizationFailureResponse", () => {
  it("returns AUTHORIZATION_FAILURE result with empty actions by default", async () => {
    const response = authorizationFailureResponse({
      message: "Authorization denied",
    });

    const body = await response.json();

    expect(body.result).toBe("AUTHORIZATION_FAILURE");
    expect(body.message).toBe("Authorization denied");
    expect(body.actions).toEqual([]);
  });

  it("allows custom actions override", async () => {
    const response = authorizationFailureResponse({
      message: "Retry possible",
      actions: ["AUTHORIZATION"],
    });

    const body = await response.json();
    expect(body.actions).toEqual(["AUTHORIZATION"]);
  });
});

describe("refundSuccessResponse", () => {
  it("returns REFUND_SUCCESS result with empty actions", async () => {
    const response = refundSuccessResponse({
      pspReference: "PP-REFUND-1",
      amount: 25.5,
    });

    const body = await response.json();

    expect(body.result).toBe("REFUND_SUCCESS");
    expect(body.pspReference).toBe("PP-REFUND-1");
    expect(body.amount).toBe(25.5);
    expect(body.actions).toEqual([]);
    expect(body.message).toBe("Refund processed successfully");
  });
});

describe("refundFailureResponse", () => {
  it("returns REFUND_FAILURE result with REFUND retry action by default", async () => {
    const response = refundFailureResponse({
      message: "Refund failed",
    });

    const body = await response.json();

    expect(body.result).toBe("REFUND_FAILURE");
    expect(body.message).toBe("Refund failed");
    expect(body.actions).toEqual(["REFUND"]);
  });

  it("allows empty actions for non-retryable failures", async () => {
    const response = refundFailureResponse({
      message: "Cannot refund",
      actions: [],
    });

    const body = await response.json();
    expect(body.actions).toEqual([]);
  });
});

describe("cancelSuccessResponse", () => {
  it("returns CANCEL_SUCCESS result with empty actions", async () => {
    const response = cancelSuccessResponse({
      pspReference: "PP-VOID-1",
    });

    const body = await response.json();

    expect(body.result).toBe("CANCEL_SUCCESS");
    expect(body.pspReference).toBe("PP-VOID-1");
    expect(body.actions).toEqual([]);
    expect(body.message).toBe("Cancellation acknowledged");
  });
});

describe("cancelFailureResponse", () => {
  it("returns CANCEL_FAILURE result with empty actions by default", async () => {
    const response = cancelFailureResponse({
      message: "Order already captured",
    });

    const body = await response.json();

    expect(body.result).toBe("CANCEL_FAILURE");
    expect(body.message).toBe("Order already captured");
    expect(body.actions).toEqual([]);
  });
});

describe("initializeActionRequiredResponse", () => {
  it("returns AUTHORIZATION_ACTION_REQUIRED result with data passthrough", async () => {
    const data = {
      paypalOrderId: "PP-NEW-ORDER",
      clientId: "sb-client-123",
    };

    const response = initializeActionRequiredResponse({
      pspReference: "PP-INIT-1",
      data,
    });

    const body = await response.json();

    expect(body.result).toBe("AUTHORIZATION_ACTION_REQUIRED");
    expect(body.pspReference).toBe("PP-INIT-1");
    expect(body.data).toEqual(data);
    expect(body.actions).toEqual([]);
    expect(body.message).toBe("PayPal order created");
  });

  it("includes amount when provided", async () => {
    const response = initializeActionRequiredResponse({
      pspReference: "PP-INIT-2",
      data: { orderId: "123" },
      amount: 75.0,
    });

    const body = await response.json();
    expect(body.amount).toBe(75.0);
  });

  it("omits amount when not provided", async () => {
    const response = initializeActionRequiredResponse({
      pspReference: "PP-INIT-3",
      data: { orderId: "456" },
    });

    const body = await response.json();
    expect(body.amount).toBeUndefined();
  });
});

describe("initializeFailureResponse", () => {
  it("returns AUTHORIZATION_FAILURE result with empty actions", async () => {
    const response = initializeFailureResponse({
      message: "Config missing",
    });

    const body = await response.json();

    expect(body.result).toBe("AUTHORIZATION_FAILURE");
    expect(body.message).toBe("Config missing");
    expect(body.actions).toEqual([]);
  });

  it("includes pspReference when provided", async () => {
    const response = initializeFailureResponse({
      message: "Failed",
      pspReference: "PP-FAIL-1",
    });

    const body = await response.json();
    expect(body.pspReference).toBe("PP-FAIL-1");
  });
});
