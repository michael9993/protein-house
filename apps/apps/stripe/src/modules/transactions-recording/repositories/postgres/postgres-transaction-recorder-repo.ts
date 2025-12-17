import { err, ok, Result } from "neverthrow";

import { BaseError } from "@/lib/errors";
import { createLogger } from "@/lib/logger";
import { createResolvedTransactionFlow } from "@/modules/resolved-transaction-flow";
import { createSaleorTransactionFlow } from "@/modules/saleor/saleor-transaction-flow";
import { createSaleorTransactionId } from "@/modules/saleor/saleor-transaction-id";
import { getPostgresClient } from "@/modules/postgres/postgres-client";
import { PaymentMethod } from "@/modules/stripe/payment-methods/types";
import {
  createStripePaymentIntentId,
  StripePaymentIntentId,
} from "@/modules/stripe/stripe-payment-intent-id";
import { RecordedTransaction } from "@/modules/transactions-recording/domain/recorded-transaction";
import {
  TransactionRecorderError,
  TransactionRecorderRepo,
  TransactionRecorderRepoAccess,
} from "@/modules/transactions-recording/repositories/transaction-recorder-repo";

const logger = createLogger("PostgresTransactionRecorderRepo");

interface RecordedTransactionRow {
  id: number;
  saleor_api_url: string;
  app_id: string;
  payment_intent_id: string;
  saleor_transaction_id: string;
  saleor_transaction_flow: string;
  resolved_transaction_flow: string;
  selected_payment_method: string;
  saleor_schema_version_major: number;
  saleor_schema_version_minor: number;
  created_at: Date;
  updated_at: Date;
}

export class PostgresTransactionRecorderRepo implements TransactionRecorderRepo {
  async recordTransaction(
    accessPattern: TransactionRecorderRepoAccess,
    transaction: RecordedTransaction,
  ): Promise<Result<null, TransactionRecorderError>> {
    try {
      const sql = getPostgresClient();
      const saleorApiUrlStr = accessPattern.saleorApiUrl.toString();
      const [major, minor] = transaction.saleorSchemaVersion;

      logger.debug("Recording transaction to PostgreSQL", {
        paymentIntentId: transaction.stripePaymentIntentId,
        saleorTransactionId: transaction.saleorTransactionId,
      });

      await sql`
        INSERT INTO recorded_transactions (
          saleor_api_url,
          app_id,
          payment_intent_id,
          saleor_transaction_id,
          saleor_transaction_flow,
          resolved_transaction_flow,
          selected_payment_method,
          saleor_schema_version_major,
          saleor_schema_version_minor
        ) VALUES (
          ${saleorApiUrlStr},
          ${accessPattern.appId},
          ${transaction.stripePaymentIntentId},
          ${transaction.saleorTransactionId},
          ${transaction.saleorTransactionFlow},
          ${transaction.resolvedTransactionFlow},
          ${transaction.selectedPaymentMethod},
          ${major},
          ${minor}
        )
        ON CONFLICT (saleor_api_url, app_id, payment_intent_id)
        DO UPDATE SET
          saleor_transaction_id = EXCLUDED.saleor_transaction_id,
          saleor_transaction_flow = EXCLUDED.saleor_transaction_flow,
          resolved_transaction_flow = EXCLUDED.resolved_transaction_flow,
          selected_payment_method = EXCLUDED.selected_payment_method,
          saleor_schema_version_major = EXCLUDED.saleor_schema_version_major,
          saleor_schema_version_minor = EXCLUDED.saleor_schema_version_minor,
          updated_at = NOW()
      `;

      logger.debug("Successfully recorded transaction to PostgreSQL", {
        paymentIntentId: transaction.stripePaymentIntentId,
      });

      return ok(null);
    } catch (error) {
      logger.error("Failed to record transaction to PostgreSQL", { cause: error });
      return err(
        new TransactionRecorderError.FailedWritingTransactionError(
          "Failed to write transaction to PostgreSQL",
          {
            cause: error,
          },
        ),
      );
    }
  }

  async getTransactionByStripePaymentIntentId(
    accessPattern: TransactionRecorderRepoAccess,
    id: StripePaymentIntentId,
    fallbackAppIds?: string[],
  ): Promise<Result<RecordedTransaction, TransactionRecorderError>> {
    try {
      const sql = getPostgresClient();
      const saleorApiUrlStr = accessPattern.saleorApiUrl.toString();

      logger.debug("Fetching transaction from PostgreSQL", {
        paymentIntentId: id,
        saleorApiUrl: saleorApiUrlStr,
        appId: accessPattern.appId,
        fallbackAppIds,
      });

      // First, try with the provided appId
      let rows = await sql<RecordedTransactionRow[]>`
        SELECT * FROM recorded_transactions
        WHERE saleor_api_url = ${saleorApiUrlStr}
          AND app_id = ${accessPattern.appId}
          AND payment_intent_id = ${id}
        LIMIT 1
      `;

      // If not found and we have fallback appIds, try those
      if (rows.length === 0 && fallbackAppIds && fallbackAppIds.length > 0) {
        logger.debug("Transaction not found with primary appId, trying fallback appIds", {
          paymentIntentId: id,
          primaryAppId: accessPattern.appId,
          fallbackAppIds,
        });

        // Try each fallback appId
        for (const fallbackAppId of fallbackAppIds) {
          if (fallbackAppId === accessPattern.appId) continue; // Skip the one we already tried

          rows = await sql<RecordedTransactionRow[]>`
            SELECT * FROM recorded_transactions
            WHERE saleor_api_url = ${saleorApiUrlStr}
              AND app_id = ${fallbackAppId}
              AND payment_intent_id = ${id}
            LIMIT 1
          `;

          if (rows.length > 0) {
            logger.info("Found transaction with fallback appId", {
              paymentIntentId: id,
              fallbackAppId,
            });
            break;
          }
        }
      }

      if (rows.length === 0) {
        logger.debug("Transaction not found in PostgreSQL", {
          paymentIntentId: id,
          saleorApiUrl: saleorApiUrlStr,
          triedAppIds: [accessPattern.appId, ...(fallbackAppIds || [])],
        });
        return err(
          new TransactionRecorderError.TransactionMissingError(
            "Transaction not found in Database",
            {
              props: {
                paymentIntentId: id,
              },
            },
          ),
        );
      }

      const row = rows[0];

      const recordedTransaction = new RecordedTransaction({
        resolvedTransactionFlow: createResolvedTransactionFlow(row.resolved_transaction_flow),
        saleorTransactionFlow: createSaleorTransactionFlow(row.saleor_transaction_flow),
        saleorTransactionId: createSaleorTransactionId(row.saleor_transaction_id),
        stripePaymentIntentId: createStripePaymentIntentId(row.payment_intent_id),
        selectedPaymentMethod: row.selected_payment_method as PaymentMethod["type"],
        saleorSchemaVersion: [row.saleor_schema_version_major, row.saleor_schema_version_minor],
      });

      logger.debug("Successfully fetched transaction from PostgreSQL", {
        paymentIntentId: id,
        appId: row.app_id,
      });

      return ok(recordedTransaction);
    } catch (error) {
      logger.error("Failed to fetch transaction from PostgreSQL", { cause: error });
      return err(
        new TransactionRecorderError.FailedFetchingTransactionError(
          "Failed to fetch transaction from PostgreSQL",
          {
            cause: error,
          },
        ),
      );
    }
  }
}
