import { describe, expect, it, vi } from "vitest";

import {
  reportTransactionEvent,
  TransactionEventReportInput,
  AlreadyReportedError,
  GraphqlError,
  ServerError,
  TransactionEventReportError,
} from "./transaction-event-reporter";

// Mock the logger so it doesn't pollute test output
vi.mock("@/lib/logger", () => ({
  createLogger: () => ({
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  }),
}));

// Mock generated graphql — the module doesn't exist in dev (only after codegen)
vi.mock("@/generated/graphql", () => ({
  TransactionEventReportDocument: "TransactionEventReportDocument",
}));

function createMockClient(mutationResult: unknown) {
  return {
    mutation: vi.fn().mockReturnValue({
      toPromise: () => Promise.resolve(mutationResult),
    }),
  };
}

function createValidInput(overrides?: Partial<TransactionEventReportInput>): TransactionEventReportInput {
  return {
    transactionId: "txn-123",
    message: "Payment captured",
    amount: 100.0,
    pspReference: "PP-ORDER-ABC",
    time: "2026-03-22T12:00:00Z",
    type: "CHARGE_SUCCESS" as const,
    ...overrides,
  };
}

describe("reportTransactionEvent", () => {
  it("returns ok with eventId on successful report", async () => {
    const client = createMockClient({
      data: {
        transactionEventReport: {
          alreadyProcessed: false,
          transactionEvent: { id: "evt-456" },
          errors: [],
        },
      },
    });

    const result = await reportTransactionEvent(client, createValidInput());

    expect(result.isOk()).toBe(true);

    const value = result._unsafeUnwrap();
    expect(value.eventId).toBe("evt-456");
    expect(value.alreadyProcessed).toBe(false);
  });

  it("returns ok with alreadyProcessed: true when Saleor returns ALREADY_EXISTS", async () => {
    const client = createMockClient({
      data: {
        transactionEventReport: {
          alreadyProcessed: false,
          transactionEvent: null,
          errors: [{ code: "ALREADY_EXISTS", message: "Event already reported" }],
        },
      },
    });

    const result = await reportTransactionEvent(client, createValidInput());

    expect(result.isOk()).toBe(true);

    const value = result._unsafeUnwrap();
    expect(value.alreadyProcessed).toBe(true);
    expect(value.eventId).toBe("");
  });

  it("returns GraphqlError when client.mutation returns a transport error", async () => {
    const client = createMockClient({
      error: { message: "Network timeout" },
      data: undefined,
    });

    const result = await reportTransactionEvent(client, createValidInput());

    expect(result.isErr()).toBe(true);

    const error = result._unsafeUnwrapErr();
    expect(error).toBeInstanceOf(GraphqlError);
    expect(error.message).toBe("Network timeout");
    expect(error.code).toBe("GRAPHQL_ERROR");
  });

  it("returns ServerError with INVALID code when Saleor returns INVALID error", async () => {
    const client = createMockClient({
      data: {
        transactionEventReport: {
          errors: [{ code: "INVALID", message: "Invalid transaction ID" }],
        },
      },
    });

    const result = await reportTransactionEvent(client, createValidInput());

    expect(result.isErr()).toBe(true);

    const error = result._unsafeUnwrapErr();
    expect(error).toBeInstanceOf(ServerError);
    expect(error.code).toBe("INVALID");
    expect(error.message).toBe("Invalid transaction ID");
  });

  it("returns ServerError with NOT_FOUND code", async () => {
    const client = createMockClient({
      data: {
        transactionEventReport: {
          errors: [{ code: "NOT_FOUND", message: "Transaction not found" }],
        },
      },
    });

    const result = await reportTransactionEvent(client, createValidInput());

    expect(result.isErr()).toBe(true);

    const error = result._unsafeUnwrapErr();
    expect(error).toBeInstanceOf(ServerError);
    expect(error.code).toBe("NOT_FOUND");
  });

  it("returns ServerError with INCORRECT_DETAILS code", async () => {
    const client = createMockClient({
      data: {
        transactionEventReport: {
          errors: [{ code: "INCORRECT_DETAILS", message: "Amount mismatch" }],
        },
      },
    });

    const result = await reportTransactionEvent(client, createValidInput());

    expect(result.isErr()).toBe(true);

    const error = result._unsafeUnwrapErr();
    expect(error).toBeInstanceOf(ServerError);
    expect(error.code).toBe("INCORRECT_DETAILS");
  });

  it("returns ServerError with REQUIRED code", async () => {
    const client = createMockClient({
      data: {
        transactionEventReport: {
          errors: [{ code: "REQUIRED", message: "Field is required" }],
        },
      },
    });

    const result = await reportTransactionEvent(client, createValidInput());

    expect(result.isErr()).toBe(true);

    const error = result._unsafeUnwrapErr();
    expect(error).toBeInstanceOf(ServerError);
    expect(error.code).toBe("REQUIRED");
  });

  it("returns ServerError when no data returned from mutation", async () => {
    const client = createMockClient({
      data: { transactionEventReport: null },
    });

    const result = await reportTransactionEvent(client, createValidInput());

    expect(result.isErr()).toBe(true);

    const error = result._unsafeUnwrapErr();
    expect(error).toBeInstanceOf(ServerError);
    expect(error.code).toBe("INVALID");
    expect(error.message).toBe("No data returned from mutation");
  });

  it("returns TransactionEventReportError for unknown error codes", async () => {
    const client = createMockClient({
      data: {
        transactionEventReport: {
          errors: [{ code: "SOME_UNKNOWN_CODE", message: "Something weird" }],
        },
      },
    });

    const result = await reportTransactionEvent(client, createValidInput());

    expect(result.isErr()).toBe(true);

    const error = result._unsafeUnwrapErr();
    expect(error).toBeInstanceOf(TransactionEventReportError);
    expect(error.code).toBe("SOME_UNKNOWN_CODE");
    expect(error.message).toBe("Something weird");
  });

  it("returns GraphqlError when error code is GRAPHQL_ERROR in mutation errors", async () => {
    const client = createMockClient({
      data: {
        transactionEventReport: {
          errors: [{ code: "GRAPHQL_ERROR", message: "Schema mismatch" }],
        },
      },
    });

    const result = await reportTransactionEvent(client, createValidInput());

    expect(result.isErr()).toBe(true);

    const error = result._unsafeUnwrapErr();
    expect(error).toBeInstanceOf(GraphqlError);
    expect(error.code).toBe("GRAPHQL_ERROR");
  });

  it("logs warning and returns first error when multiple errors are returned", async () => {
    const client = createMockClient({
      data: {
        transactionEventReport: {
          errors: [
            { code: "INVALID", message: "First error" },
            { code: "REQUIRED", message: "Second error" },
          ],
        },
      },
    });

    const result = await reportTransactionEvent(client, createValidInput());

    expect(result.isErr()).toBe(true);

    const error = result._unsafeUnwrapErr();
    expect(error).toBeInstanceOf(ServerError);
    expect(error.code).toBe("INVALID");
    expect(error.message).toBe("First error");
  });

  it("returns ok with empty eventId when transactionEvent is null on success", async () => {
    const client = createMockClient({
      data: {
        transactionEventReport: {
          alreadyProcessed: false,
          transactionEvent: null,
          errors: [],
        },
      },
    });

    const result = await reportTransactionEvent(client, createValidInput());

    expect(result.isOk()).toBe(true);

    const value = result._unsafeUnwrap();
    expect(value.eventId).toBe("");
    expect(value.alreadyProcessed).toBe(false);
  });

  it("passes correct variables to the GraphQL mutation", async () => {
    const input = createValidInput({
      availableActions: ["REFUND" as const],
      externalUrl: "https://paypal.com/activity/payment/ABC",
    });

    const client = createMockClient({
      data: {
        transactionEventReport: {
          alreadyProcessed: false,
          transactionEvent: { id: "evt-789" },
          errors: [],
        },
      },
    });

    await reportTransactionEvent(client, input);

    expect(client.mutation).toHaveBeenCalledOnce();

    const [_document, variables] = client.mutation.mock.calls[0];
    expect(variables).toEqual({
      transactionId: "txn-123",
      message: "Payment captured",
      amount: 100.0,
      pspReference: "PP-ORDER-ABC",
      time: "2026-03-22T12:00:00Z",
      type: "CHARGE_SUCCESS",
      availableActions: ["REFUND"],
      externalUrl: "https://paypal.com/activity/payment/ABC",
    });
  });

  it("passes null for optional fields when not provided", async () => {
    const input = createValidInput();
    // input has no availableActions or externalUrl

    const client = createMockClient({
      data: {
        transactionEventReport: {
          alreadyProcessed: false,
          transactionEvent: { id: "evt-000" },
          errors: [],
        },
      },
    });

    await reportTransactionEvent(client, input);

    const [_document, variables] = client.mutation.mock.calls[0];
    expect(variables.availableActions).toBeNull();
    expect(variables.externalUrl).toBeNull();
  });
});
