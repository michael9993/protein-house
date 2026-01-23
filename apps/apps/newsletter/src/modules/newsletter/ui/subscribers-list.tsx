import { Box, Button, Text } from "@saleor/macaw-ui";

import { Table } from "../../../components/table";
import { defaultPadding } from "../../../components/ui-defaults";

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
}

export const SubscribersList = ({
  subscriptions,
  isLoading,
  pageInfo,
  onLoadMore,
  onExport,
}: SubscribersListProps) => {
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
            <Table.HeaderCell>Status</Table.HeaderCell>
            <Table.HeaderCell>Subscribed</Table.HeaderCell>
            <Table.HeaderCell>Source</Table.HeaderCell>
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
                <Text color={subscription.isActive ? "success1" : "default2"}>
                  {subscription.isActive ? "Active" : "Inactive"}
                </Text>
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
