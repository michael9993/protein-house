import { gql } from "graphql-tag";
import { Client } from "urql";

import { createLogger } from "@/logger";

const logger = createLogger("AuditLogger");

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AuditEventType =
  | "order_classified"
  | "fraud_check"
  | "exception_created"
  | "order_forwarded"
  | "order_forward_failed"
  | "order_cancelled"
  | "fulfillment_created"
  | "tracking_synced"
  | "token_refreshed"
  | "reconciliation"
  | "stock_updated"
  | "webhook_received"
  | "return_created"
  | "return_updated"
  | "order_refunded";

export interface AuditEvent {
  type: AuditEventType;
  supplierId?: string;
  orderId?: string;
  action: string;
  request?: Record<string, unknown>;
  response?: Record<string, unknown>;
  status: "success" | "failure" | "skipped";
  duration?: number;
  timestamp: string;
  error?: string;
}

export interface AuditFilters {
  type?: AuditEventType;
  orderId?: string;
  supplierId?: string;
  status?: "success" | "failure" | "skipped";
  since?: string;
  limit?: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const METADATA_KEY = "dropship-audit-log";
const MAX_AUDIT_ENTRIES = 1000;

// ---------------------------------------------------------------------------
// GraphQL
// ---------------------------------------------------------------------------

const FETCH_APP_METADATA = gql`
  query FetchAppMetadataForAudit {
    app {
      id
      privateMetadata {
        key
        value
      }
    }
  }
`;

const UPDATE_APP_METADATA = gql`
  mutation UpdateAuditMetadata($id: ID!, $input: [MetadataInput!]!) {
    updatePrivateMetadata(id: $id, input: $input) {
      item {
        privateMetadata {
          key
          value
        }
      }
      errors {
        field
        message
      }
    }
  }
`;

// ---------------------------------------------------------------------------
// PII redaction
// ---------------------------------------------------------------------------

const PII_KEY_PATTERNS = {
  email: /email/i,
  phone: /phone|mobile|tel/i,
  street: /street|streetAddress/i,
} as const;

function redactValue(key: string, value: string): string {
  if (PII_KEY_PATTERNS.email.test(key) && value.includes("@")) {
    return "***" + value.slice(value.indexOf("@"));
  }
  if (PII_KEY_PATTERNS.phone.test(key) && value.length >= 4) {
    return "***" + value.slice(-4);
  }
  if (PII_KEY_PATTERNS.street.test(key)) {
    return "[redacted]";
  }
  return value;
}

function sanitizeObject(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === "string") return obj;
  if (Array.isArray(obj)) return obj.map((item) => sanitizeObject(item));
  if (typeof obj === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(obj as Record<string, unknown>)) {
      if (typeof val === "string") {
        result[key] = redactValue(key, val);
      } else if (typeof val === "object" && val !== null) {
        result[key] = sanitizeObject(val);
      } else {
        result[key] = val;
      }
    }
    return result;
  }
  return obj;
}

function sanitizeForAudit(event: AuditEvent): AuditEvent {
  return {
    ...event,
    request: event.request
      ? (sanitizeObject(event.request) as Record<string, unknown>)
      : undefined,
    response: event.response
      ? (sanitizeObject(event.response) as Record<string, unknown>)
      : undefined,
  };
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

async function fetchAuditEntries(
  client: Client,
): Promise<{ appId: string; entries: AuditEvent[] }> {
  const { data, error } = await client.query(FETCH_APP_METADATA, {}).toPromise();

  if (error || !data?.app) {
    logger.error("Failed to fetch audit log metadata", { error: error?.message });
    return { appId: "", entries: [] };
  }

  const appId: string = data.app.id;
  const raw = (data.app.privateMetadata as Array<{ key: string; value: string }>)?.find(
    (m) => m.key === METADATA_KEY,
  );

  if (!raw) {
    return { appId, entries: [] };
  }

  try {
    const entries = JSON.parse(raw.value) as AuditEvent[];
    return { appId, entries };
  } catch {
    logger.warn("Corrupt audit log metadata — starting fresh");
    return { appId, entries: [] };
  }
}

async function persistAuditEntries(
  client: Client,
  appId: string,
  entries: AuditEvent[],
): Promise<void> {
  // Keep only the most recent entries
  const trimmed = entries.slice(-MAX_AUDIT_ENTRIES);

  const { error } = await client
    .mutation(UPDATE_APP_METADATA, {
      id: appId,
      input: [{ key: METADATA_KEY, value: JSON.stringify(trimmed) }],
    })
    .toPromise();

  if (error) {
    logger.error("Failed to persist audit log", { error: error.message });
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Append an audit event to the log stored in Saleor app metadata.
 * Events are capped at {@link MAX_AUDIT_ENTRIES} — the oldest entries are
 * evicted first.
 */
export async function logAuditEvent(client: Client, event: AuditEvent): Promise<void> {
  logger.info("Audit event", {
    type: event.type,
    action: event.action,
    orderId: event.orderId,
    supplierId: event.supplierId,
    status: event.status,
    duration: event.duration,
  });

  try {
    const { appId, entries } = await fetchAuditEntries(client);

    if (!appId) {
      logger.warn("Cannot persist audit event — appId unavailable");
      return;
    }

    entries.push(sanitizeForAudit(event));
    await persistAuditEntries(client, appId, entries);
  } catch (e) {
    // Audit logging should never crash the main flow
    logger.error("Unexpected error writing audit event", {
      error: e instanceof Error ? e.message : String(e),
    });
  }
}

/**
 * Retrieve the audit log with optional filters.
 */
export async function getAuditLog(
  client: Client,
  filters?: AuditFilters,
): Promise<AuditEvent[]> {
  const { entries } = await fetchAuditEntries(client);

  let filtered = entries;

  if (filters?.type) {
    filtered = filtered.filter((e) => e.type === filters.type);
  }

  if (filters?.orderId) {
    filtered = filtered.filter((e) => e.orderId === filters.orderId);
  }

  if (filters?.supplierId) {
    filtered = filtered.filter((e) => e.supplierId === filters.supplierId);
  }

  if (filters?.status) {
    filtered = filtered.filter((e) => e.status === filters.status);
  }

  if (filters?.since) {
    const sinceDate = new Date(filters.since).getTime();
    filtered = filtered.filter((e) => new Date(e.timestamp).getTime() >= sinceDate);
  }

  // Sort by timestamp DESC (newest first)
  filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  if (filters?.limit && filters.limit > 0) {
    filtered = filtered.slice(0, filters.limit);
  }

  return filtered;
}
