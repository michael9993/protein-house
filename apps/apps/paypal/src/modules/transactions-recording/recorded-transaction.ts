export type TransactionType = "CHARGE" | "AUTHORIZATION" | "REFUND" | "CANCEL";
export type TransactionStatus = "SUCCESS" | "FAILURE" | "PENDING";
export type PayPalEnvironment = "SANDBOX" | "LIVE";

export interface RecordedTransaction {
  id?: string;
  saleorTransactionId: string;
  paypalOrderId: string;
  paypalCaptureId?: string;
  paypalRefundId?: string;
  type: TransactionType;
  status: TransactionStatus;
  amount: number;
  currency: string;
  payerEmail?: string;
  environment: PayPalEnvironment;
  createdAt?: Date;
  metadata?: Record<string, unknown>;
}
