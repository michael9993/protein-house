import { RecordedTransaction } from "./recorded-transaction";

export interface TransactionListFilters {
  type?: RecordedTransaction["type"];
  status?: RecordedTransaction["status"];
  environment?: RecordedTransaction["environment"];
  limit?: number;
  offset?: number;
}

export interface TransactionRecorder {
  record(transaction: RecordedTransaction): Promise<void>;
  getByPaypalOrderId(paypalOrderId: string): Promise<RecordedTransaction[]>;
  getByPaypalCaptureId(paypalCaptureId: string): Promise<RecordedTransaction[]>;
  getBySaleorTransactionId(saleorTransactionId: string): Promise<RecordedTransaction[]>;
  list(filters?: TransactionListFilters): Promise<RecordedTransaction[]>;
}
