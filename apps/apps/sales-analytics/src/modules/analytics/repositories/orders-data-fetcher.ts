import { Result, ok, err } from "neverthrow";
import { Client, type OperationResult } from "urql";
import { format, parseISO } from "date-fns";

import { createLogger } from "../../../logger";
import {
  FetchOrdersAnalyticsDocument,
  FetchChannelsDocument,
  type FetchOrdersAnalyticsQuery,
  type FetchChannelsQuery,
  type OrderAnalyticsFragment,
  type ChannelDetailsFragment,
} from "../../../../generated/graphql";

const logger = createLogger("orders-data-fetcher");

/**
 * Error types for data fetching
 */
export class DataFetchError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = "DataFetchError";
  }
}

/**
 * Fetch all channels
 */
export async function fetchChannels(
  client: Client
): Promise<Result<ChannelDetailsFragment[], DataFetchError>> {
  try {
    const result = await client
      .query<FetchChannelsQuery>(FetchChannelsDocument, {})
      .toPromise();

    if (result.error) {
      return err(new DataFetchError("Failed to fetch channels", result.error));
    }

    return ok(result.data?.channels ?? []);
  } catch (error) {
    return err(new DataFetchError("Failed to fetch channels", error));
  }
}

/**
 * Fetch orders with pagination and date filtering
 */
export async function fetchOrdersForAnalytics(
  client: Client,
  options: {
    channelSlug?: string;
    dateFrom: string;
    dateTo: string;
    limit?: number;
  }
): Promise<Result<OrderAnalyticsFragment[], DataFetchError>> {
  try {
    const allOrders: OrderAnalyticsFragment[] = [];
    let hasNextPage = true;
    let cursor: string | null = null;
    const pageSize = 100;
    const maxOrders = options.limit ?? 1000; // Default limit to prevent excessive fetching

    while (hasNextPage && allOrders.length < maxOrders) {
      // Convert ISO datetime strings to Date format (YYYY-MM-DD) for Saleor's DateRangeInput
      const dateFrom = format(parseISO(options.dateFrom), "yyyy-MM-dd");
      const dateTo = format(parseISO(options.dateTo), "yyyy-MM-dd");

      const result: OperationResult<FetchOrdersAnalyticsQuery> = await client
        .query<FetchOrdersAnalyticsQuery>(FetchOrdersAnalyticsDocument, {
          channel: options.channelSlug,
          first: Math.min(pageSize, maxOrders - allOrders.length),
          after: cursor,
          filter: {
            created: {
              gte: dateFrom,
              lte: dateTo,
            },
          },
        })
        .toPromise();

      if (result.error) {
        const errorMessage = result.error.graphQLErrors?.[0]?.message || result.error.message || "Unknown GraphQL error";
        logger.error("[fetchOrdersForAnalytics] GraphQL error", { message: errorMessage });
        return err(new DataFetchError(`Failed to fetch orders: ${errorMessage}`, result.error));
      }

      const orders: FetchOrdersAnalyticsQuery["orders"] = result.data?.orders ?? null;
      if (!orders) {
        break;
      }

      for (const edge of orders.edges) {
        allOrders.push(edge.node);
      }

      hasNextPage = orders.pageInfo.hasNextPage;
      cursor = orders.pageInfo.endCursor;
    }

    return ok(allOrders);
  } catch (error) {
    return err(new DataFetchError("Failed to fetch orders", error));
  }
}
