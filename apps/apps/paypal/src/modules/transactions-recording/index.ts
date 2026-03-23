export { PostgresTransactionRecorder } from "./postgres-transaction-recorder";
export type { RecordedTransaction, TransactionType, TransactionStatus, PayPalEnvironment } from "./recorded-transaction";
export type { TransactionRecorder, TransactionListFilters } from "./transaction-recorder";

import { PostgresTransactionRecorder } from "./postgres-transaction-recorder";
import { TransactionRecorder } from "./transaction-recorder";

/**
 * Singleton transaction recorder instance.
 * Uses PostgreSQL for persistence.
 */
export const transactionRecorder: TransactionRecorder = new PostgresTransactionRecorder();
