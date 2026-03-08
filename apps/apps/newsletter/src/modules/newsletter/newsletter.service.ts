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
    channel: {
        id: string;
        slug: string;
        name: string;
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
          channel {
            id
            slug
            name
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

// Stats query - fetch all subscriptions across all channels
// Note: newsletterSubscriptions doesn't require channel, it's a global query
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

// Query to get a single subscription by ID using node query (for delete)
const GET_SUBSCRIPTION_BY_ID_QUERY = gql`
  query GetNewsletterSubscription($id: ID!) {
    node(id: $id) {
      ... on NewsletterSubscription {
        id
        email
      }
    }
  }
`;

export class NewsletterService {
    constructor(private client: Client) { }

    async getSubscriptions(args: {
        first?: number;
        after?: string;
        last?: number;
        before?: string;
        filter?: {
            isActive?: boolean;
            source?: string;
            channel?: string;
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
            // Build filter object, including channel if provided
            const filter: Record<string, unknown> = {};
            if (args.filter?.isActive !== undefined) {
                filter.isActive = args.filter.isActive;
            }
            if (args.filter?.source) {
                filter.source = args.filter.source;
            }
            if (args.filter?.channel) {
                filter.channel = args.filter.channel;
            }
            if (args.filter?.subscribedAt) {
                filter.subscribedAt = args.filter.subscribedAt;
            }

            const result = await this.client
                .query<NewsletterSubscriptionsResponse>(NEWSLETTER_SUBSCRIPTIONS_QUERY, {
                    first: args.first ?? 50,
                    after: args.after,
                    last: args.last,
                    before: args.before,
                    filter: Object.keys(filter).length > 0 ? filter : undefined,
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
            // Note: newsletterSubscriptions is a global query that doesn't require channel
            // However, Saleor's filter_connection_queryset may try to get a default channel
            // We work around this by fetching stats in a way that doesn't trigger channel requirements
            const result = await this.client
                .query<{
                    active: { totalCount: number | null };
                    inactive: { totalCount: number | null };
                    all: {
                        totalCount: number | null;
                        edges: Array<{ node: { source: string | null } }>;
                    };
                }>(NEWSLETTER_SUBSCRIPTIONS_STATS_QUERY, {}, {
                    // Add requestPolicy to avoid channel requirement issues
                    requestPolicy: "network-only",
                })
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
        channel?: string;
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
        const headers = ["Email", "User", "Channel", "Status", "Subscribed At", "Unsubscribed At", "Source"];
        const rows = allSubscriptions.map((sub) => {
            const userStr = sub.user
                ? `${sub.user.firstName || ""} ${sub.user.lastName || ""}`.trim() || sub.user.email
                : "";
            return [
                sub.email,
                userStr,
                sub.channel?.name || "",
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

    async toggleSubscriptionStatus(id: string, isActive: boolean): Promise<void> {
        logger.debug("Toggling newsletter subscription status", { id, isActive });

        // Query the subscription by ID using the newsletterSubscription query
        const GET_SUBSCRIPTION_QUERY = gql`
      query GetNewsletterSubscription($id: ID!) {
        newsletterSubscription(id: $id) {
          id
          email
          isActive
        }
      }
    `;

        const subscriptionResult = await this.client
            .query<{
                newsletterSubscription: {
                    id: string;
                    email: string;
                    isActive: boolean;
                } | null;
            }>(GET_SUBSCRIPTION_QUERY, { id })
            .toPromise();

        if (subscriptionResult.error) {
            logger.error("Error fetching subscription", { error: subscriptionResult.error });
            throw new Error(`Failed to fetch subscription: ${subscriptionResult.error.message}`);
        }

        if (!subscriptionResult.data?.newsletterSubscription) {
            throw new Error("Subscription not found");
        }

        const subscription = subscriptionResult.data.newsletterSubscription;

        // If already in the desired state, no need to update
        if (subscription.isActive === isActive) {
            logger.debug("Subscription already in desired state", { id, isActive });
            return;
        }

        // Use the unsubscribe mutation to deactivate, or subscribe mutation to reactivate
        if (!isActive) {
            // Deactivate using unsubscribe mutation
            const UNSUBSCRIBE_MUTATION = gql`
        mutation NewsletterUnsubscribe($email: String!) {
          newsletterUnsubscribe(email: $email) {
            unsubscribed
            errors {
              field
              message
              code
            }
          }
        }
      `;

            const result = await this.client
                .mutation<{
                    newsletterUnsubscribe: {
                        unsubscribed: boolean;
                        errors: Array<{
                            field: string;
                            message: string;
                            code: string;
                        }>;
                    };
                }>(UNSUBSCRIBE_MUTATION, {
                    email: subscription.email,
                })
                .toPromise();

            if (result.error) {
                logger.error("Error deactivating newsletter subscription", { error: result.error });
                throw new Error(`Failed to deactivate subscription: ${result.error.message}`);
            }

            if (result.data?.newsletterUnsubscribe.errors && result.data.newsletterUnsubscribe.errors.length > 0) {
                const error = result.data.newsletterUnsubscribe.errors[0];
                logger.error("Newsletter unsubscribe error", { error });
                throw new Error(error.message || "Failed to deactivate subscription");
            }

            logger.debug("Newsletter subscription deactivated", { id, email: subscription.email });
        } else {
            // Reactivate using subscribe mutation
            const SUBSCRIBE_MUTATION = gql`
        mutation NewsletterSubscribe($email: String!) {
          newsletterSubscribe(email: $email) {
            subscribed
            alreadySubscribed
            errors {
              field
              message
              code
            }
          }
        }
      `;

            const result = await this.client
                .mutation<{
                    newsletterSubscribe: {
                        subscribed: boolean;
                        alreadySubscribed: boolean;
                        errors: Array<{
                            field: string;
                            message: string;
                            code: string;
                        }>;
                    };
                }>(SUBSCRIBE_MUTATION, {
                    email: subscription.email,
                })
                .toPromise();

            if (result.error) {
                logger.error("Error reactivating newsletter subscription", { error: result.error });
                throw new Error(`Failed to reactivate subscription: ${result.error.message}`);
            }

            if (result.data?.newsletterSubscribe.errors && result.data.newsletterSubscribe.errors.length > 0) {
                const error = result.data.newsletterSubscribe.errors[0];
                logger.error("Newsletter subscribe error", { error });
                throw new Error(error.message || "Failed to reactivate subscription");
            }

            logger.debug("Newsletter subscription reactivated", { id, email: subscription.email });
        }
    }
}
