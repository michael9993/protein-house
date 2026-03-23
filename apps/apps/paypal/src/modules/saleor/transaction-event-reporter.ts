import { err, ok, Result } from "neverthrow";
import { Client } from "urql";

import { createLogger } from "@/lib/logger";
import {
  TransactionEventReportDocument,
  TransactionEventReportMutationVariables,
  TransactionEventTypeEnum,
  TransactionActionEnum,
} from "@/generated/graphql";

const logger = createLogger("TransactionEventReporter");

export interface TransactionEventReportInput {
  transactionId: string;
  message: string;
  amount: number;
  pspReference: string;
  time: string;
  type: TransactionEventTypeEnum;
  availableActions?: TransactionActionEnum[];
  externalUrl?: string;
}

export class TransactionEventReportError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
  ) {
    super(message);
    this.name = "TransactionEventReportError";
  }
}

/**
 * Returned when Saleor says the event was already reported (ALREADY_EXISTS).
 * This is idempotent — not really an error, but callers may want to distinguish it.
 */
export class AlreadyReportedError extends TransactionEventReportError {
  constructor(message: string) {
    super(message, "ALREADY_EXISTS");
    this.name = "AlreadyReportedError";
  }
}

/**
 * Returned when the GraphQL transport itself fails (network error, malformed query, etc.).
 */
export class GraphqlError extends TransactionEventReportError {
  constructor(message: string) {
    super(message, "GRAPHQL_ERROR");
    this.name = "GraphqlError";
  }
}

/**
 * Returned for server-side mutation errors: INVALID, NOT_FOUND, INCORRECT_DETAILS, REQUIRED, etc.
 */
export class ServerError extends TransactionEventReportError {
  constructor(message: string, code: string) {
    super(message, code);
    this.name = "ServerError";
  }
}

export async function reportTransactionEvent(
  client: Pick<Client, "mutation">,
  input: TransactionEventReportInput,
): Promise<Result<{ eventId: string; alreadyProcessed: boolean }, TransactionEventReportError>> {
  const variables: TransactionEventReportMutationVariables = {
    transactionId: input.transactionId,
    message: input.message,
    amount: input.amount,
    pspReference: input.pspReference,
    time: input.time,
    type: input.type,
    availableActions: input.availableActions ?? null,
    externalUrl: input.externalUrl ?? null,
  };

  logger.info("Reporting transaction event to Saleor", {
    transactionId: input.transactionId,
    type: input.type,
    pspReference: input.pspReference,
    amount: input.amount,
  });

  const result = await client
    .mutation(TransactionEventReportDocument, variables)
    .toPromise();

  if (result.error) {
    logger.error("GraphQL error reporting transaction event", {
      error: result.error.message,
    });
    return err(new GraphqlError(result.error.message));
  }

  const data = result.data?.transactionEventReport;
  if (!data) {
    return err(new ServerError("No data returned from mutation", "INVALID"));
  }

  if (data.errors && data.errors.length > 0) {
    const firstError = data.errors[0];

    if (data.errors.length > 1) {
      logger.warn("Multiple errors returned from transactionEventReport mutation", {
        pspReference: input.pspReference,
        errorCount: data.errors.length,
        errors: data.errors.map((e) => ({ code: e.code, message: e.message })),
      });
    }

    switch (firstError.code) {
      case "ALREADY_EXISTS":
        logger.info("Transaction event already reported (idempotent)", {
          pspReference: input.pspReference,
        });
        return ok({ eventId: "", alreadyProcessed: true });

      case "GRAPHQL_ERROR":
        return err(new GraphqlError(firstError.message ?? "Unknown GraphQL error"));

      case "INVALID":
      case "NOT_FOUND":
      case "INCORRECT_DETAILS":
      case "REQUIRED":
        return err(new ServerError(firstError.message ?? "Server error", firstError.code));

      default:
        return err(
          new TransactionEventReportError(
            firstError.message ?? "Unknown error",
            firstError.code ?? undefined,
          ),
        );
    }
  }

  return ok({
    eventId: data.transactionEvent?.id ?? "",
    alreadyProcessed: data.alreadyProcessed ?? false,
  });
}
