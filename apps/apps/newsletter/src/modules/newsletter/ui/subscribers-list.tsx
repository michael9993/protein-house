import { Box, Button, Text } from "@saleor/macaw-ui";
import { useState } from "react";

import { Table } from "../../../components/table";
import { defaultPadding } from "../../../components/ui-defaults";
import { trpcClient } from "../../../modules/trpc/trpc-client";

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

interface SubscribersListProps {
  subscriptions: NewsletterSubscription[];
  isLoading: boolean;
  pageInfo: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCursor: string | null;
    endCursor: string | null;
  };
  onLoadMore: (direction: "next" | "previous") => void;
  onExport: () => void;
  queryInput?: any; // The query input used to fetch subscriptions
  onRefetch?: () => void; // Callback to trigger parent refetch
  onRefetchStats?: () => void; // Callback to trigger stats refetch
}

export const SubscribersList = ({
  subscriptions,
  isLoading,
  pageInfo,
  onLoadMore,
  onExport,
  queryInput,
  onRefetch,
  onRefetchStats,
}: SubscribersListProps) => {
  const utils = trpcClient.useUtils();
  const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set());
  const [optimisticUpdates, setOptimisticUpdates] = useState<Map<string, boolean>>(new Map());

  const toggleMutation = trpcClient.newsletter.toggleSubscriptionStatus.useMutation({
    onMutate: async ({ id, isActive }) => {
      // Cancel any outgoing refetches to avoid race conditions
      if (queryInput) {
        await utils.newsletter.getSubscriptions.cancel(queryInput);
      }

      // Snapshot the previous value for rollback
      const previousData = queryInput ? utils.newsletter.getSubscriptions.getData(queryInput) : undefined;

      // Optimistically update local state immediately
      setOptimisticUpdates((prev) => {
        const next = new Map(prev);
        next.set(id, isActive);
        return next;
      });

      // Optimistically update the cache for immediate UI feedback
      if (previousData && queryInput) {
        utils.newsletter.getSubscriptions.setData(queryInput, (old) => {
          if (!old) return old;
          return {
            ...old,
            subscriptions: old.subscriptions.map((sub) =>
              sub.id === id ? { ...sub, isActive } : sub
            ),
          };
        });
      }

      return { previousData };
    },
    onSuccess: async () => {
      // Clear optimistic updates
      setOptimisticUpdates(new Map());
      setTogglingIds(new Set());
      
      // Invalidate all subscription queries to ensure fresh data
      await utils.newsletter.getSubscriptions.invalidate();
      await utils.newsletter.getStats.invalidate();
      
      // Force refetch the current query with the exact same input
      if (queryInput) {
        await utils.newsletter.getSubscriptions.refetch(queryInput);
      } else {
        // If no queryInput, invalidate and let React Query refetch automatically
        await utils.newsletter.getSubscriptions.invalidate();
      }
      
      // Force refetch stats to update the counts
      await utils.newsletter.getStats.refetch();
      
      // Also trigger parent refetch callbacks if provided
      if (onRefetch) {
        onRefetch();
      }
      if (onRefetchStats) {
        onRefetchStats();
      }
    },
    onError: (error, variables, context) => {
      // Rollback optimistic updates
      setOptimisticUpdates(new Map());
      setTogglingIds(new Set());
      
      // Rollback cache to previous value on error
      if (context?.previousData && queryInput) {
        utils.newsletter.getSubscriptions.setData(queryInput, context.previousData);
      }
      
      console.error("Failed to toggle subscriber status:", error);
      alert(`Failed to update subscriber status: ${error.message}`);
    },
  });

  const handleToggle = (id: string, currentStatus: boolean) => {
    setTogglingIds((prev) => new Set(prev).add(id));
    toggleMutation.mutate({ id, isActive: !currentStatus });
  };

  // Get the effective status (optimistic or actual)
  const getEffectiveStatus = (subscription: NewsletterSubscription): boolean => {
    if (optimisticUpdates.has(subscription.id)) {
      return optimisticUpdates.get(subscription.id)!;
    }
    return subscription.isActive;
  };
  if (isLoading && subscriptions.length === 0) {
    return (
      <Box padding={defaultPadding} display="grid" alignItems="center" justifyContent="center">
        <Text>Loading subscribers...</Text>
      </Box>
    );
  }

  if (subscriptions.length === 0) {
    return (
      <Box padding={defaultPadding} display="grid" alignItems="center" justifyContent="center">
        <Text>No subscribers found.</Text>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" marginBottom={3}>
        <Text size={5} fontWeight="bold">
          Subscribers ({subscriptions.length})
        </Text>
        <Button variant="secondary" onClick={onExport}>
          Export to CSV
        </Button>
      </Box>

      <Table.Container>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Email</Table.HeaderCell>
            <Table.HeaderCell>User</Table.HeaderCell>
            <Table.HeaderCell>Channel</Table.HeaderCell>
            <Table.HeaderCell>Status</Table.HeaderCell>
            <Table.HeaderCell>Subscribed</Table.HeaderCell>
            <Table.HeaderCell>Source</Table.HeaderCell>
            <Table.HeaderCell>Actions</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {subscriptions.map((subscription) => (
            <Table.Row key={subscription.id}>
              <Table.Cell>
                <Text>{subscription.email}</Text>
              </Table.Cell>
              <Table.Cell>
                {subscription.user ? (
                  <Text>
                    {subscription.user.firstName || subscription.user.lastName
                      ? `${subscription.user.firstName || ""} ${subscription.user.lastName || ""}`.trim()
                      : subscription.user.email}
                  </Text>
                ) : (
                  <Text color="default2">—</Text>
                )}
              </Table.Cell>
              <Table.Cell>
                <Text size={3}>{subscription.channel?.name || "—"}</Text>
              </Table.Cell>
              <Table.Cell>
                {(() => {
                  const effectiveStatus = getEffectiveStatus(subscription);
                  return (
                    <Text color={effectiveStatus ? "success1" : "default2"}>
                      {effectiveStatus ? "Active" : "Inactive"}
                    </Text>
                  );
                })()}
              </Table.Cell>
              <Table.Cell>
                <Text size={3}>
                  {new Date(subscription.subscribedAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </Text>
              </Table.Cell>
              <Table.Cell>
                <Text size={3}>{subscription.source || "—"}</Text>
              </Table.Cell>
              <Table.Cell>
                {(() => {
                  const effectiveStatus = getEffectiveStatus(subscription);
                  return (
                    <Box display="flex" alignItems="center" gap={2}>
                      <input
                        type="checkbox"
                        checked={effectiveStatus}
                        onChange={() => handleToggle(subscription.id, effectiveStatus)}
                        disabled={togglingIds.has(subscription.id)}
                        style={{
                          width: "18px",
                          height: "18px",
                          cursor: togglingIds.has(subscription.id) ? "not-allowed" : "pointer",
                          opacity: togglingIds.has(subscription.id) ? 0.5 : 1,
                        }}
                      />
                      <Text size={2} color="default2">
                        {togglingIds.has(subscription.id) ? "Updating..." : effectiveStatus ? "Active" : "Inactive"}
                      </Text>
                    </Box>
                  );
                })()}
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Container>

      <Box display="flex" justifyContent="space-between" alignItems="center" marginTop={4}>
        <Box display="flex" gap={2}>
          <Button
            variant="secondary"
            disabled={!pageInfo.hasPreviousPage || isLoading}
            onClick={() => onLoadMore("previous")}
          >
            Previous
          </Button>
          <Button
            variant="secondary"
            disabled={!pageInfo.hasNextPage || isLoading}
            onClick={() => onLoadMore("next")}
          >
            Next
          </Button>
        </Box>
        {isLoading && <Text size={2} color="default2">Loading...</Text>}
      </Box>
    </Box>
  );
};
