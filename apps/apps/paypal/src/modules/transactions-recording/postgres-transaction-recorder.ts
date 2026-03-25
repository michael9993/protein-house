import { createLogger } from "@/lib/logger";
import { getPostgresClient } from "@/modules/postgres/postgres-client";

import { RecordedTransaction } from "./recorded-transaction";
import { TransactionListFilters, TransactionRecorder } from "./transaction-recorder";

const logger = createLogger("PostgresTransactionRecorder");

interface PaypalTransactionRow {
  id: number;
  saleor_transaction_id: string;
  saleor_order_id: string | null;
  paypal_order_id: string;
  paypal_capture_id: string | null;
  paypal_refund_id: string | null;
  type: string;
  status: string;
  amount: string;
  currency: string;
  payer_email: string | null;
  environment: string;
  metadata: Record<string, unknown> | null;
  created_at: Date;
}

let tableInitialized = false;

async function ensureTable(): Promise<void> {
  if (tableInitialized) return;

  const sql = getPostgresClient();

  await sql`
    CREATE TABLE IF NOT EXISTS paypal_transactions (
      id SERIAL PRIMARY KEY,
      saleor_transaction_id TEXT NOT NULL,
      saleor_order_id TEXT,
      paypal_order_id TEXT NOT NULL,
      paypal_capture_id TEXT,
      paypal_refund_id TEXT,
      type TEXT NOT NULL,
      status TEXT NOT NULL,
      amount NUMERIC(12, 2) NOT NULL,
      currency TEXT NOT NULL,
      payer_email TEXT,
      environment TEXT NOT NULL DEFAULT 'SANDBOX',
      metadata JSONB,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  // Create indexes for common query patterns
  await sql`
    CREATE INDEX IF NOT EXISTS idx_paypal_transactions_order_id
    ON paypal_transactions (paypal_order_id)
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS idx_paypal_transactions_saleor_id
    ON paypal_transactions (saleor_transaction_id)
  `;

  // Add saleor_order_id column if it doesn't exist (migration for existing tables)
  await sql`
    ALTER TABLE paypal_transactions
    ADD COLUMN IF NOT EXISTS saleor_order_id TEXT
  `.catch(() => { /* column may already exist */ });

  tableInitialized = true;
  logger.info("PostgreSQL table initialized (paypal_transactions)");
}

function rowToTransaction(row: PaypalTransactionRow): RecordedTransaction {
  return {
    id: String(row.id),
    saleorTransactionId: row.saleor_transaction_id,
    saleorOrderId: row.saleor_order_id ?? undefined,
    paypalOrderId: row.paypal_order_id,
    paypalCaptureId: row.paypal_capture_id ?? undefined,
    paypalRefundId: row.paypal_refund_id ?? undefined,
    type: row.type as RecordedTransaction["type"],
    status: row.status as RecordedTransaction["status"],
    amount: Number(row.amount),
    currency: row.currency,
    payerEmail: row.payer_email ?? undefined,
    environment: row.environment as RecordedTransaction["environment"],
    createdAt: row.created_at,
    metadata: row.metadata ?? undefined,
  };
}

export class PostgresTransactionRecorder implements TransactionRecorder {
  async record(transaction: RecordedTransaction): Promise<void> {
    await ensureTable();
    const sql = getPostgresClient();

    logger.debug("Recording PayPal transaction", {
      type: transaction.type,
      status: transaction.status,
      paypalOrderId: transaction.paypalOrderId,
      saleorTransactionId: transaction.saleorTransactionId,
    });

    await sql`
      INSERT INTO paypal_transactions (
        saleor_transaction_id,
        saleor_order_id,
        paypal_order_id,
        paypal_capture_id,
        paypal_refund_id,
        type,
        status,
        amount,
        currency,
        payer_email,
        environment,
        metadata
      ) VALUES (
        ${transaction.saleorTransactionId},
        ${transaction.saleorOrderId ?? null},
        ${transaction.paypalOrderId},
        ${transaction.paypalCaptureId ?? null},
        ${transaction.paypalRefundId ?? null},
        ${transaction.type},
        ${transaction.status},
        ${transaction.amount},
        ${transaction.currency},
        ${transaction.payerEmail ?? null},
        ${transaction.environment},
        ${transaction.metadata ? sql.json(transaction.metadata) : null}
      )
    `;

    logger.debug("Successfully recorded PayPal transaction", {
      type: transaction.type,
      paypalOrderId: transaction.paypalOrderId,
    });
  }

  async getByPaypalOrderId(paypalOrderId: string): Promise<RecordedTransaction[]> {
    await ensureTable();
    const sql = getPostgresClient();

    const rows = await sql<PaypalTransactionRow[]>`
      SELECT * FROM paypal_transactions
      WHERE paypal_order_id = ${paypalOrderId}
      ORDER BY created_at DESC
    `;

    return rows.map(rowToTransaction);
  }

  async getByPaypalCaptureId(paypalCaptureId: string): Promise<RecordedTransaction[]> {
    await ensureTable();
    const sql = getPostgresClient();

    const rows = await sql<PaypalTransactionRow[]>`
      SELECT * FROM paypal_transactions
      WHERE paypal_capture_id = ${paypalCaptureId}
      ORDER BY created_at DESC
    `;

    return rows.map(rowToTransaction);
  }

  async getBySaleorTransactionId(saleorTransactionId: string): Promise<RecordedTransaction[]> {
    await ensureTable();
    const sql = getPostgresClient();

    const rows = await sql<PaypalTransactionRow[]>`
      SELECT * FROM paypal_transactions
      WHERE saleor_transaction_id = ${saleorTransactionId}
      ORDER BY created_at DESC
    `;

    return rows.map(rowToTransaction);
  }

  async list(filters?: TransactionListFilters): Promise<RecordedTransaction[]> {
    await ensureTable();
    const sql = getPostgresClient();

    const limit = filters?.limit ?? 50;
    const offset = filters?.offset ?? 0;

    // Build dynamic query with optional filters
    const conditions: string[] = [];
    const values: unknown[] = [];

    if (filters?.type) {
      conditions.push(`type = $${values.length + 1}`);
      values.push(filters.type);
    }
    if (filters?.status) {
      conditions.push(`status = $${values.length + 1}`);
      values.push(filters.status);
    }
    if (filters?.environment) {
      conditions.push(`environment = $${values.length + 1}`);
      values.push(filters.environment);
    }

    // Use tagged template for simple case (most common), raw query for filtered
    if (conditions.length === 0) {
      const rows = await sql<PaypalTransactionRow[]>`
        SELECT * FROM paypal_transactions
        ORDER BY created_at DESC
        LIMIT ${limit}
        OFFSET ${offset}
      `;
      return rows.map(rowToTransaction);
    }

    // For filtered queries, use unsafe (the values are validated by TypeScript types)
    const whereClause = conditions.join(" AND ");
    const rows = await sql.unsafe<PaypalTransactionRow[]>(
      `SELECT * FROM paypal_transactions WHERE ${whereClause} ORDER BY created_at DESC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
      [...values, limit, offset],
    );

    return rows.map(rowToTransaction);
  }
}
