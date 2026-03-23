import { err, ok } from "neverthrow";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { TransactionProcessSessionUseCase } from "./use-case";
import { PayPalApiClient } from "@/modules/paypal/paypal-api-client";

// ---------------------------------------------------------------------------
// Module-level mocks
// ---------------------------------------------------------------------------

vi.mock("@/lib/logger", () => ({
  createLogger: () => ({
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  }),
}));

const mockAppContext = { paypalEnv: null };

vi.mock("@/lib/app-context", () => ({
  appContextContainer: {
    getContextValue: () => mockAppContext,
  },
}));

// Mock PayPalApiClient at the module level so we can control instance methods
const mockGetOrder = vi.fn();
const mockCaptureOrder = vi.fn();
const mockAuthorizeOrder = vi.fn();

vi.mock("@/modules/paypal/paypal-api-client", () => ({
  PayPalApiClient: vi.fn().mockImplementation(() => ({
    getOrder: mockGetOrder,
    captureOrder: mockCaptureOrder,
    authorizeOrder: mockAuthorizeOrder,
  })),
}));

// Mock createSaleorApiUrl to accept any valid-looking URL
vi.mock("@/modules/saleor/saleor-api-url", () => ({
  createSaleorApiUrl: (raw: string) => {
    if (raw.includes("graphql")) {
      return ok(raw);
    }
    return err(new Error("Invalid Saleor API URL"));
  },
}));

// Mock createPayPalOrderId to accept any non-empty string
vi.mock("@/modules/paypal/paypal-order-id", () => ({
  createPayPalOrderId: (raw: string) => {
    if (raw && raw.length > 0) {
      return ok(raw);
    }
    return err(new Error("Invalid PayPal order ID"));
  },
}));

// Mock parsePayPalAmount to just parseFloat
vi.mock("@/modules/paypal/paypal-money", () => ({
  parsePayPalAmount: (value: string) => parseFloat(value),
}));

// Mock generatePayPalOrderUrl
vi.mock("@/modules/paypal/generate-paypal-dashboard-urls", () => ({
  generatePayPalOrderUrl: (orderId: string, sandbox: boolean) =>
    `https://www.${sandbox ? "sandbox." : ""}paypal.com/activity/payment/${orderId}`,
}));

// Mock BaseError
vi.mock("@/lib/errors", () => ({
  BaseError: {
    normalize: (e: unknown) => (e instanceof Error ? e : new Error(String(e))),
  },
}));

// Mock saleor-webhook-responses — constructors must match real signatures
vi.mock("@/app/api/webhooks/saleor/saleor-webhook-responses", () => ({
  AppIsNotConfiguredResponse: class {
    constructor(_appContext: unknown) {}
    getResponse() {
      return Response.json({ message: "App is not configured for this channel" }, { status: 500 });
    }
  },
  BrokenAppResponse: class {
    message: string;
    constructor(_appContext: unknown, error: Error) {
      this.message = error.message;
    }
    getResponse() {
      return Response.json({ message: this.message }, { status: 500 });
    }
  },
  MalformedRequestResponse: class {
    constructor(_appContext: unknown, _error: Error) {}
    getResponse() {
      return Response.json({ message: "Malformed request" }, { status: 400 });
    }
  },
  UnhandledErrorResponse: class {
    constructor(_appContext: unknown, _error: Error) {}
    getResponse() {
      return Response.json({ message: "Unhandled error" }, { status: 500 });
    }
  },
}));

// Mock generated graphql types (only need the type, not runtime values)
vi.mock("@/generated/graphql", () => ({}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createMockConfigRepo(config: unknown = null, error?: Error) {
  return {
    getPayPalConfig: vi.fn().mockResolvedValue(error ? err(error) : ok(config)),
    savePayPalConfig: vi.fn(),
    getRootConfig: vi.fn(),
    removeConfig: vi.fn(),
    updateMapping: vi.fn(),
  };
}

function createMockLogger() {
  return {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  } as unknown as ReturnType<typeof import("@/lib/logger").createLogger>;
}

const VALID_AUTH_DATA = {
  saleorApiUrl: "http://localhost:8000/graphql/",
  appId: "app-123",
};

function createPayload(overrides?: Record<string, unknown>) {
  return {
    action: { amount: 100.0, currency: "USD", actionType: "CHARGE" },
    transaction: {
      id: "txn-1",
      pspReference: "PP-ORDER-ABC",
      checkout: { channel: { id: "channel-1" } },
      order: null,
    },
    sourceObject: {
      channel: { id: "channel-1" },
    },
    ...overrides,
  } as any;
}

function createPayPalConfig() {
  return {
    clientId: "sb-client-id",
    clientSecret: "sb-client-secret",
    environment: "SANDBOX",
    name: "Test Config",
    id: "config-1",
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("TransactionProcessSessionUseCase", () => {
  beforeEach(() => {
    mockGetOrder.mockReset();
    mockCaptureOrder.mockReset();
    mockAuthorizeOrder.mockReset();

    // Re-apply PayPalApiClient constructor mock (mockReset: true clears it between tests)
    vi.mocked(PayPalApiClient).mockImplementation(
      () =>
        ({
          getOrder: mockGetOrder,
          captureOrder: mockCaptureOrder,
          authorizeOrder: mockAuthorizeOrder,
        }) as any,
    );
  });

  it("returns AppIsNotConfiguredResponse when channelId is missing", async () => {
    const configRepo = createMockConfigRepo(createPayPalConfig());

    const payload = createPayload({
      sourceObject: { channel: null },
      transaction: {
        id: "txn-1",
        pspReference: "PP-ORDER-ABC",
        checkout: { channel: null },
        order: null,
      },
    });

    const uc = new TransactionProcessSessionUseCase({
      configRepo,
      logger: createMockLogger(),
    });

    const response = await uc.execute(payload, VALID_AUTH_DATA);
    const body = await response.json();

    expect(body.message).toBe("App is not configured for this channel");
  });

  it("returns AppIsNotConfiguredResponse when config is null", async () => {
    const configRepo = createMockConfigRepo(null);

    const uc = new TransactionProcessSessionUseCase({
      configRepo,
      logger: createMockLogger(),
    });

    const response = await uc.execute(createPayload(), VALID_AUTH_DATA);
    const body = await response.json();

    expect(body.message).toBe("App is not configured for this channel");
  });

  it("returns BrokenAppResponse when config repo returns error", async () => {
    const configRepo = createMockConfigRepo(null, new Error("DB connection failed"));

    const uc = new TransactionProcessSessionUseCase({
      configRepo,
      logger: createMockLogger(),
    });

    const response = await uc.execute(createPayload(), VALID_AUTH_DATA);
    const body = await response.json();

    expect(body.message).toBe("DB connection failed");
  });

  it("returns CHARGE_FAILURE when pspReference is missing", async () => {
    const configRepo = createMockConfigRepo(createPayPalConfig());

    const payload = createPayload({
      transaction: {
        id: "txn-1",
        pspReference: null,
        checkout: { channel: { id: "channel-1" } },
        order: null,
      },
    });

    const uc = new TransactionProcessSessionUseCase({
      configRepo,
      logger: createMockLogger(),
    });

    const response = await uc.execute(payload, VALID_AUTH_DATA);
    const body = await response.json();

    expect(body.result).toBe("CHARGE_FAILURE");
    expect(body.message).toBe("Missing PayPal order ID (pspReference)");
  });

  it("returns CHARGE_FAILURE when getOrder fails", async () => {
    const configRepo = createMockConfigRepo(createPayPalConfig());

    mockGetOrder.mockResolvedValue(
      err({ message: "Order not found", publicMessage: "Order not found" }),
    );

    const uc = new TransactionProcessSessionUseCase({
      configRepo,
      logger: createMockLogger(),
    });

    const response = await uc.execute(createPayload(), VALID_AUTH_DATA);
    const body = await response.json();

    expect(body.result).toBe("CHARGE_FAILURE");
    expect(body.message).toContain("Failed to get PayPal order");
  });

  describe("CAPTURE intent flow", () => {
    it("returns CHARGE_SUCCESS when order is APPROVED and capture succeeds", async () => {
      const configRepo = createMockConfigRepo(createPayPalConfig());

      mockGetOrder.mockResolvedValue(
        ok({
          id: "PP-ORDER-ABC",
          status: "APPROVED",
          intent: "CAPTURE",
          payer: { email_address: "buyer@example.com" },
          purchase_units: [],
        }),
      );

      mockCaptureOrder.mockResolvedValue(
        ok({
          id: "PP-ORDER-ABC",
          status: "COMPLETED",
          purchase_units: [
            {
              payments: {
                captures: [
                  {
                    id: "CAPTURE-1",
                    status: "COMPLETED",
                    amount: { value: "100.00", currency_code: "USD" },
                  },
                ],
              },
            },
          ],
        }),
      );

      const uc = new TransactionProcessSessionUseCase({
        configRepo,
        logger: createMockLogger(),
      });

      const response = await uc.execute(createPayload(), VALID_AUTH_DATA);
      const body = await response.json();

      expect(body.result).toBe("CHARGE_SUCCESS");
      expect(body.pspReference).toBe("PP-ORDER-ABC");
      expect(body.amount).toBe(100.0);
      expect(body.actions).toEqual(["REFUND"]);
      expect(body.externalUrl).toContain("sandbox.paypal.com");
      expect(body.message).toBe("PayPal (buyer@example.com)");
    });

    it("returns CHARGE_FAILURE when capture fails", async () => {
      const configRepo = createMockConfigRepo(createPayPalConfig());

      mockGetOrder.mockResolvedValue(
        ok({
          id: "PP-ORDER-ABC",
          status: "APPROVED",
          intent: "CAPTURE",
          purchase_units: [],
        }),
      );

      mockCaptureOrder.mockResolvedValue(
        err({ message: "Insufficient funds", publicMessage: "Insufficient funds" }),
      );

      const uc = new TransactionProcessSessionUseCase({
        configRepo,
        logger: createMockLogger(),
      });

      const response = await uc.execute(createPayload(), VALID_AUTH_DATA);
      const body = await response.json();

      expect(body.result).toBe("CHARGE_FAILURE");
      expect(body.message).toContain("Capture failed");
    });

    it("returns CHARGE_FAILURE when capture status is not COMPLETED", async () => {
      const configRepo = createMockConfigRepo(createPayPalConfig());

      mockGetOrder.mockResolvedValue(
        ok({
          id: "PP-ORDER-ABC",
          status: "APPROVED",
          intent: "CAPTURE",
          purchase_units: [],
        }),
      );

      mockCaptureOrder.mockResolvedValue(
        ok({
          id: "PP-ORDER-ABC",
          status: "COMPLETED",
          purchase_units: [
            {
              payments: {
                captures: [
                  {
                    id: "CAPTURE-1",
                    status: "PENDING",
                    amount: { value: "100.00", currency_code: "USD" },
                  },
                ],
              },
            },
          ],
        }),
      );

      const uc = new TransactionProcessSessionUseCase({
        configRepo,
        logger: createMockLogger(),
      });

      const response = await uc.execute(createPayload(), VALID_AUTH_DATA);
      const body = await response.json();

      expect(body.result).toBe("CHARGE_FAILURE");
      expect(body.message).toContain("PENDING");
    });

    it("returns CHARGE_SUCCESS when order is already COMPLETED (CAPTURE intent)", async () => {
      const configRepo = createMockConfigRepo(createPayPalConfig());

      mockGetOrder.mockResolvedValue(
        ok({
          id: "PP-ORDER-ABC",
          status: "COMPLETED",
          intent: "CAPTURE",
          payer: { email_address: "buyer@example.com" },
          purchase_units: [
            {
              payments: {
                captures: [
                  {
                    id: "CAPTURE-1",
                    status: "COMPLETED",
                    amount: { value: "50.00", currency_code: "USD" },
                  },
                ],
              },
            },
          ],
        }),
      );

      const uc = new TransactionProcessSessionUseCase({
        configRepo,
        logger: createMockLogger(),
      });

      const response = await uc.execute(createPayload(), VALID_AUTH_DATA);
      const body = await response.json();

      expect(body.result).toBe("CHARGE_SUCCESS");
      expect(body.amount).toBe(50.0);
      expect(body.actions).toEqual(["REFUND"]);
      // captureOrder should NOT have been called since order was already COMPLETED
      expect(mockCaptureOrder).not.toHaveBeenCalled();
    });
  });

  describe("AUTHORIZE intent flow", () => {
    it("returns AUTHORIZATION_SUCCESS when order is APPROVED and authorize succeeds", async () => {
      const configRepo = createMockConfigRepo(createPayPalConfig());

      mockGetOrder.mockResolvedValue(
        ok({
          id: "PP-ORDER-ABC",
          status: "APPROVED",
          intent: "AUTHORIZE",
          payer: { email_address: "buyer@example.com" },
          purchase_units: [],
        }),
      );

      mockAuthorizeOrder.mockResolvedValue(
        ok({
          id: "PP-ORDER-ABC",
          status: "COMPLETED",
          purchase_units: [
            {
              payments: {
                authorizations: [
                  {
                    id: "AUTH-1",
                    status: "CREATED",
                    amount: { value: "200.00", currency_code: "USD" },
                  },
                ],
              },
            },
          ],
        }),
      );

      const uc = new TransactionProcessSessionUseCase({
        configRepo,
        logger: createMockLogger(),
      });

      const response = await uc.execute(createPayload(), VALID_AUTH_DATA);
      const body = await response.json();

      expect(body.result).toBe("AUTHORIZATION_SUCCESS");
      expect(body.pspReference).toBe("PP-ORDER-ABC");
      expect(body.amount).toBe(200.0);
      expect(body.actions).toEqual(["CHARGE", "CANCEL"]);
      expect(body.message).toBe("PayPal (buyer@example.com)");
    });

    it("returns AUTHORIZATION_FAILURE when authorize fails", async () => {
      const configRepo = createMockConfigRepo(createPayPalConfig());

      mockGetOrder.mockResolvedValue(
        ok({
          id: "PP-ORDER-ABC",
          status: "APPROVED",
          intent: "AUTHORIZE",
          purchase_units: [],
        }),
      );

      mockAuthorizeOrder.mockResolvedValue(
        err({ message: "Auth declined", publicMessage: "Authorization declined" }),
      );

      const uc = new TransactionProcessSessionUseCase({
        configRepo,
        logger: createMockLogger(),
      });

      const response = await uc.execute(createPayload(), VALID_AUTH_DATA);
      const body = await response.json();

      expect(body.result).toBe("AUTHORIZATION_FAILURE");
      expect(body.message).toContain("Authorization failed");
    });

    it("returns AUTHORIZATION_SUCCESS when order is already COMPLETED (AUTHORIZE intent)", async () => {
      const configRepo = createMockConfigRepo(createPayPalConfig());

      mockGetOrder.mockResolvedValue(
        ok({
          id: "PP-ORDER-ABC",
          status: "COMPLETED",
          intent: "AUTHORIZE",
          payer: null,
          purchase_units: [
            {
              payments: {
                authorizations: [
                  {
                    id: "AUTH-1",
                    amount: { value: "150.00", currency_code: "USD" },
                  },
                ],
              },
            },
          ],
        }),
      );

      const uc = new TransactionProcessSessionUseCase({
        configRepo,
        logger: createMockLogger(),
      });

      const response = await uc.execute(createPayload(), VALID_AUTH_DATA);
      const body = await response.json();

      expect(body.result).toBe("AUTHORIZATION_SUCCESS");
      expect(body.amount).toBe(150.0);
      expect(body.actions).toEqual(["CHARGE", "CANCEL"]);
      expect(body.message).toBe("PayPal");
      // authorizeOrder should NOT have been called
      expect(mockAuthorizeOrder).not.toHaveBeenCalled();
    });
  });

  describe("unexpected order status", () => {
    it("returns CHARGE_FAILURE for unexpected status with CAPTURE intent", async () => {
      const configRepo = createMockConfigRepo(createPayPalConfig());

      mockGetOrder.mockResolvedValue(
        ok({
          id: "PP-ORDER-ABC",
          status: "CREATED",
          intent: "CAPTURE",
          purchase_units: [],
        }),
      );

      const uc = new TransactionProcessSessionUseCase({
        configRepo,
        logger: createMockLogger(),
      });

      const response = await uc.execute(createPayload(), VALID_AUTH_DATA);
      const body = await response.json();

      expect(body.result).toBe("CHARGE_FAILURE");
      expect(body.message).toContain("Unexpected order status: CREATED");
    });

    it("returns AUTHORIZATION_FAILURE for unexpected status with AUTHORIZE intent", async () => {
      const configRepo = createMockConfigRepo(createPayPalConfig());

      mockGetOrder.mockResolvedValue(
        ok({
          id: "PP-ORDER-ABC",
          status: "VOIDED",
          intent: "AUTHORIZE",
          purchase_units: [],
        }),
      );

      const uc = new TransactionProcessSessionUseCase({
        configRepo,
        logger: createMockLogger(),
      });

      const response = await uc.execute(createPayload(), VALID_AUTH_DATA);
      const body = await response.json();

      expect(body.result).toBe("AUTHORIZATION_FAILURE");
      expect(body.message).toContain("Unexpected order status: VOIDED");
    });
  });

  describe("payment method name formatting", () => {
    it("shows PayPal with payer email when available", async () => {
      const configRepo = createMockConfigRepo(createPayPalConfig());

      mockGetOrder.mockResolvedValue(
        ok({
          id: "PP-ORDER-ABC",
          status: "COMPLETED",
          intent: "CAPTURE",
          payer: { email_address: "john@doe.com" },
          purchase_units: [
            {
              payments: {
                captures: [
                  { id: "C-1", status: "COMPLETED", amount: { value: "10.00" } },
                ],
              },
            },
          ],
        }),
      );

      const uc = new TransactionProcessSessionUseCase({
        configRepo,
        logger: createMockLogger(),
      });

      const response = await uc.execute(createPayload(), VALID_AUTH_DATA);
      const body = await response.json();

      expect(body.message).toBe("PayPal (john@doe.com)");
    });

    it("shows plain PayPal when payer email is not available", async () => {
      const configRepo = createMockConfigRepo(createPayPalConfig());

      mockGetOrder.mockResolvedValue(
        ok({
          id: "PP-ORDER-ABC",
          status: "COMPLETED",
          intent: "CAPTURE",
          payer: null,
          purchase_units: [
            {
              payments: {
                captures: [
                  { id: "C-1", status: "COMPLETED", amount: { value: "10.00" } },
                ],
              },
            },
          ],
        }),
      );

      const uc = new TransactionProcessSessionUseCase({
        configRepo,
        logger: createMockLogger(),
      });

      const response = await uc.execute(createPayload(), VALID_AUTH_DATA);
      const body = await response.json();

      expect(body.message).toBe("PayPal");
    });
  });

  describe("external URL generation", () => {
    it("generates sandbox URL when environment is SANDBOX", async () => {
      const configRepo = createMockConfigRepo(createPayPalConfig());

      mockGetOrder.mockResolvedValue(
        ok({
          id: "PP-ORDER-ABC",
          status: "COMPLETED",
          intent: "CAPTURE",
          payer: null,
          purchase_units: [
            {
              payments: {
                captures: [
                  { id: "C-1", status: "COMPLETED", amount: { value: "10.00" } },
                ],
              },
            },
          ],
        }),
      );

      const uc = new TransactionProcessSessionUseCase({
        configRepo,
        logger: createMockLogger(),
      });

      const response = await uc.execute(createPayload(), VALID_AUTH_DATA);
      const body = await response.json();

      expect(body.externalUrl).toContain("sandbox.paypal.com");
      expect(body.externalUrl).toContain("PP-ORDER-ABC");
    });

    it("generates live URL when environment is LIVE", async () => {
      const liveConfig = { ...createPayPalConfig(), environment: "LIVE" };
      const configRepo = createMockConfigRepo(liveConfig);

      mockGetOrder.mockResolvedValue(
        ok({
          id: "PP-ORDER-ABC",
          status: "COMPLETED",
          intent: "CAPTURE",
          payer: null,
          purchase_units: [
            {
              payments: {
                captures: [
                  { id: "C-1", status: "COMPLETED", amount: { value: "10.00" } },
                ],
              },
            },
          ],
        }),
      );

      const uc = new TransactionProcessSessionUseCase({
        configRepo,
        logger: createMockLogger(),
      });

      const response = await uc.execute(createPayload(), VALID_AUTH_DATA);
      const body = await response.json();

      expect(body.externalUrl).not.toContain("sandbox");
      expect(body.externalUrl).toContain("paypal.com");
    });
  });

  describe("channel ID resolution", () => {
    it("extracts channelId from sourceObject.channel", async () => {
      const configRepo = createMockConfigRepo(createPayPalConfig());

      mockGetOrder.mockResolvedValue(
        ok({
          id: "PP-ORDER-ABC",
          status: "COMPLETED",
          intent: "CAPTURE",
          payer: null,
          purchase_units: [
            {
              payments: {
                captures: [
                  { id: "C-1", status: "COMPLETED", amount: { value: "10.00" } },
                ],
              },
            },
          ],
        }),
      );

      const payload = createPayload({
        sourceObject: { channel: { id: "channel-from-source" } },
        transaction: {
          id: "txn-1",
          pspReference: "PP-ORDER-ABC",
          checkout: null,
          order: null,
        },
      });

      const uc = new TransactionProcessSessionUseCase({
        configRepo,
        logger: createMockLogger(),
      });

      await uc.execute(payload, VALID_AUTH_DATA);

      expect(configRepo.getPayPalConfig).toHaveBeenCalledWith(
        expect.objectContaining({ channelId: "channel-from-source" }),
      );
    });

    it("falls back to transaction.checkout.channel when sourceObject.channel is null", async () => {
      const configRepo = createMockConfigRepo(createPayPalConfig());

      mockGetOrder.mockResolvedValue(
        ok({
          id: "PP-ORDER-ABC",
          status: "COMPLETED",
          intent: "CAPTURE",
          payer: null,
          purchase_units: [
            {
              payments: {
                captures: [
                  { id: "C-1", status: "COMPLETED", amount: { value: "10.00" } },
                ],
              },
            },
          ],
        }),
      );

      const payload = createPayload({
        sourceObject: { channel: null },
        transaction: {
          id: "txn-1",
          pspReference: "PP-ORDER-ABC",
          checkout: { channel: { id: "channel-from-checkout" } },
          order: null,
        },
      });

      const uc = new TransactionProcessSessionUseCase({
        configRepo,
        logger: createMockLogger(),
      });

      await uc.execute(payload, VALID_AUTH_DATA);

      expect(configRepo.getPayPalConfig).toHaveBeenCalledWith(
        expect.objectContaining({ channelId: "channel-from-checkout" }),
      );
    });
  });
});
