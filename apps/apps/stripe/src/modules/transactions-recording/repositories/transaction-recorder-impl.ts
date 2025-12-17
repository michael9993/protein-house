import { PostgresTransactionRecorderRepo } from "@/modules/transactions-recording/repositories/postgres/postgres-transaction-recorder-repo";
import { TransactionRecorderRepo } from "@/modules/transactions-recording/repositories/transaction-recorder-repo";

/**
 * Transaction recording: Always uses PostgreSQL
 */
export const transactionRecorder: TransactionRecorderRepo = new PostgresTransactionRecorderRepo();
