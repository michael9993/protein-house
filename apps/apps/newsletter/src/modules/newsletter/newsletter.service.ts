import { Client } from "urql";
import { gql } from "urql";

import { createLogger } from "../../logger";

const logger = createLogger("NewsletterService");

interface NewsletterSubscription {
  id: string;
  email: string;
  user: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
  } | null;
  isActive: boolean;
  subscribedAt: string;
  unsubscribedAt: string | null;
  source: string | null;
}

interface NewsletterSubscriptionsResponse {
  newsletterSubscriptions: {
    edges: Array<{
      node: NewsletterSubscription;
    }>;
    pageInfo: {
      hasNextPage: boolean;
      hasPreviousPage: boolean;
      startCursor: string | null;
      endCursor: string | null;
    };
    totalCount: number | null;
  };
}

interface NewsletterSubscriptionsStats {
  total: number;
  active: number;
  inactive: number;
  bySource: Record<string, number>;
}

const NEWSLETTER_SUBSCRIPTIONS_QUERY = gql`
  query NewsletterSubscriptions(
    $first: Int
    $after: String
    $last: Int
    $before: String
    $filter: NewsletterSubscriptionFilterInput
    $where: NewsletterSubscriptionWhereInput
    $sortBy: NewsletterSubscriptionSortingInput
    $search: String
  ) {
    newsletterSubscriptions(
      first: $first
      after: $after
      last: $last
      before: $before
      filter: $filter
      where: $where
      sortBy: $sortBy
      search: $search
    ) {
      edges {
        node {
          id
          email
          user {
            id
            email
            firstName
            lastName
          }
          isActive
          subscribedAt
          unsubscribedAt
          source
        }
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
      totalCount
    }
  }
`;

const NEWSLETTER_SUBSCRIPTIONS_STATS_QUERY = gql`
  query NewsletterSubscriptionsStats {
    active: newsletterSubscriptions(filter: { isActive: true }, first: 1) {
      totalCount
    }
    inactive: newsletterSubscriptions(filter: { isActive: false }, first: 1) {
      totalCount
    }
    all: newsletterSubscriptions(first: 100) {
      totalCount
      edges {
        node {
          source
        }
      }
    }
  }
`;

export class NewsletterService {
  constructor(private client: Client) {}

  async getSubscriptions(args: {
    first?: number;
    after?: string;
    last?: number;
    before?: string;
    filter?: {
      isActive?: boolean;
      source?: string;
      subscribedAt?: {
        gte?: string;
        lte?: string;
      };
    };
    sortBy?: {
      direction: "ASC" | "DESC";
      field: "SUBSCRIBED_AT" | "EMAIL" | "UNSUBSCRIBED_AT";
    };
    search?: string;
  }): Promise<{
    subscriptions: NewsletterSubscription[];
    pageInfo: {
      hasNextPage: boolean;
      hasPreviousPage: boolean;
      startCursor: string | null;
      endCursor: string | null;
    };
    totalCount: number | null;
  }> {
    logger.debug("Fetching newsletter subscriptions", { args });

    try {
      const result = await this.client
        .query<NewsletterSubscriptionsResponse>(NEWSLETTER_SUBSCRIPTIONS_QUERY, {
          first: args.first ?? 50,
          after: args.after,
          last: args.last,
          before: args.before,
          filter: args.filter,
          sortBy: args.sortBy,
          search: args.search,
        })
        .toPromise();

      if (result.error) {
        logger.error("Error fetching newsletter subscriptions", { error: result.error });
        throw new Error(`Failed to fetch newsletter subscriptions: ${result.error.message}`);
      }

      if (!result.data) {
        logger.warn("No data returned from newsletter subscriptions query");
        return {
          subscriptions: [],
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            startCursor: null,
            endCursor: null,
          },
          totalCount: 0,
        };
      }

      const subscriptions = result.data.newsletterSubscriptions.edges.map((edge) => edge.node);

      logger.debug("Fetched newsletter subscriptions", {
        count: subscriptions.length,
        totalCount: result.data.newsletterSubscriptions.totalCount,
      });

      return {
        subscriptions,
        pageInfo: result.data.newsletterSubscriptions.pageInfo,
        totalCount: result.data.newsletterSubscriptions.totalCount,
      };
    } catch (error) {
      logger.error("Error in getSubscriptions", { error });
      throw error;
    }
  }

  async getStats(): Promise<NewsletterSubscriptionsStats> {
    logger.debug("Fetching newsletter subscription statistics");

    try {
      const result = await this.client
        .query<{
          active: { totalCount: number | null };
          inactive: { totalCount: number | null };
          all: {
            totalCount: number | null;
            edges: Array<{ node: { source: string | null } }>;
          };
        }>(NEWSLETTER_SUBSCRIPTIONS_STATS_QUERY)
        .toPromise();

      if (result.error) {
        logger.error("Error fetching newsletter stats", { error: result.error });
        throw new Error(`Failed to fetch newsletter stats: ${result.error.message}`);
      }

      if (!result.data) {
        logger.warn("No data returned from newsletter stats query");
        return {
          total: 0,
          active: 0,
          inactive: 0,
          bySource: {},
        };
      }

      // Calculate stats by source
      const bySource: Record<string, number> = {};
      result.data.all.edges.forEach((edge) => {
        const source = edge.node.source || "unknown";
        bySource[source] = (bySource[source] || 0) + 1;
      });

      const stats: NewsletterSubscriptionsStats = {
        total: result.data.all.totalCount ?? 0,
        active: result.data.active.totalCount ?? 0,
        inactive: result.data.inactive.totalCount ?? 0,
        bySource,
      };

      logger.debug("Fetched newsletter stats", stats);

      return stats;
    } catch (error) {
      logger.error("Error in getStats", { error });
      throw error;
    }
  }

  async exportToCSV(filter?: {
    isActive?: boolean;
    source?: string;
    subscribedAt?: {
      gte?: string;
      lte?: string;
    };
  }): Promise<string> {
    logger.debug("Exporting newsletter subscriptions to CSV", { filter });

    // Fetch all subscriptions (no pagination for export)
    const allSubscriptions: NewsletterSubscription[] = [];
    let hasNextPage = true;
    let cursor: string | undefined;

    while (hasNextPage) {
      const result = await this.getSubscriptions({
        first: 100,
        after: cursor,
        filter,
      });

      allSubscriptions.push(...result.subscriptions);
      hasNextPage = result.pageInfo.hasNextPage;
      cursor = result.pageInfo.endCursor || undefined;
    }

    // Generate CSV
    const headers = ["Email", "User", "Status", "Subscribed At", "Unsubscribed At", "Source"];
    const rows = allSubscriptions.map((sub) => {
      const userStr = sub.user
        ? `${sub.user.firstName || ""} ${sub.user.lastName || ""}`.trim() || sub.user.email
        : "";
      return [
        sub.email,
        userStr,
        sub.isActive ? "Active" : "Inactive",
        sub.subscribedAt,
        sub.unsubscribedAt || "",
        sub.source || "",
      ];
    });

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    logger.debug("Generated CSV export", { rowCount: allSubscriptions.length });

    return csvContent;
  }
}
