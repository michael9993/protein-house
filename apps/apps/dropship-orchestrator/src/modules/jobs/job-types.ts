// ---------------------------------------------------------------------------
// BullMQ Job Data Types
// ---------------------------------------------------------------------------

/**
 * Data payload for the tracking sync repeatable job.
 * Polls supplier APIs for tracking updates on orders that have been forwarded
 * but not yet fulfilled in Saleor.
 */
export interface TrackingSyncJobData {
  /** The Saleor GraphQL API URL (e.g. "https://api.example.com/graphql/"). */
  saleorApiUrl: string;

  /** The app's auth token for making GraphQL mutations. */
  appToken: string;
}

/**
 * Data payload for the reconciliation repeatable job.
 * Catches missed webhook updates and flags state discrepancies.
 */
export interface ReconciliationJobData {
  /** The Saleor GraphQL API URL. */
  saleorApiUrl: string;

  /** The app's auth token. */
  appToken: string;
}

/**
 * Data payload for the token refresh repeatable job.
 * Refreshes supplier API tokens before they expire.
 */
export interface TokenRefreshJobData {
  /** The Saleor GraphQL API URL. */
  saleorApiUrl: string;

  /** The app's auth token. */
  appToken: string;

  /** Which supplier's token to refresh (e.g. "cj", "aliexpress"). */
  supplierId: string;
}

/**
 * Data payload for the stock sync repeatable job.
 * Queries supplier APIs for current stock levels and updates Saleor.
 */
export interface StockSyncJobData {
  /** The Saleor GraphQL API URL. */
  saleorApiUrl: string;

  /** The app's auth token. */
  appToken: string;
}
