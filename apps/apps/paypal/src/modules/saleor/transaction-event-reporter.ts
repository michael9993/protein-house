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
    return err(new TransactionEventReportError(result.error.message, "GRAPHQL_ERROR"));
  }

  const data = result.data?.transactionEventReport;
  if (!data) {
    return err(new TransactionEventReportError("No data returned from mutation"));
  }

  if (data.errors && data.errors.length > 0) {
    const firstError = data.errors[0];
    if (firstError.code === "ALREADY_EXISTS") {
      logger.info("Transaction event already reported", { pspReference: input.pspReference });
      return ok({ eventId: "", alreadyProcessed: true });
    }
    return err(new TransactionEventReportError(firstError.message ?? "Unknown error", firstError.code ?? undefined));
  }

  return ok({
    eventId: data.transactionEvent?.id ?? "",
    alreadyProcessed: data.alreadyProcessed ?? false,
  });
}
