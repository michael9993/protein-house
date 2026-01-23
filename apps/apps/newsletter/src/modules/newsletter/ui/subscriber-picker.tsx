import { Box, Button, Text } from "@saleor/macaw-ui";
import { useState, useMemo, useEffect } from "react";
import { Controller, Control, useWatch } from "react-hook-form";

import { defaultPadding } from "../../../components/ui-defaults";
import { trpcClient } from "../../trpc/trpc-client";

interface SubscriberPickerProps {
  control: Control<any>;
  filter?: {
    isActive?: boolean;
    sources?: string[];
  };
}

export const SubscriberPicker = ({ control, filter }: SubscriberPickerProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [pageCursor, setPageCursor] = useState<string | undefined>();

  // Guard against null control for useWatch
  const selectedSubscriberIds = useWatch({
    control: control || ({} as any),
    name: "recipientFilter.selectedSubscriberIds",
    defaultValue: [],
  });

  const {
    data: subscriptionsData,
    isLoading,
  } = trpcClient.newsletter.getSubscriptions.useQuery(
    {
      first: 50,
      after: pageCursor,
      filter: filter?.isActive !== undefined ? { isActive: filter.isActive } : undefined,
      search: searchTerm || undefined,
    },
    {
      retry: false,
    }
  );

  const subscribers = subscriptionsData?.subscriptions || [];

  if (!control) {
    return <Text color="default2">Loading...</Text>;
  }

  const filteredSubscribers = useMemo(() => {
    if (!searchTerm) return subscribers;
    const term = searchTerm.toLowerCase();
    return subscribers.filter(
      (sub) =>
        sub.email.toLowerCase().includes(term) ||
        sub.user?.firstName?.toLowerCase().includes(term) ||
        sub.user?.lastName?.toLowerCase().includes(term)
    );
  }, [subscribers, searchTerm]);

  return (
    <Box display="flex" flexDirection="column" gap={defaultPadding}>
      <Box>
        <Text size={2} color="default2" marginBottom={1}>
          Search Subscribers
        </Text>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by email, first name, or last name..."
          style={{
            width: "100%",
            padding: "8px 12px",
            border: "1px solid #d1d5db",
            borderRadius: "4px",
            fontSize: "14px",
          }}
        />
      </Box>

      <Controller
        control={control}
        name="recipientFilter.selectedSubscriberIds"
        defaultValue={[]}
        render={({ field: { onChange, value } }) => {
          const selectedIds = value || [];
          
          const toggleSubscriber = (id: string) => {
            const newSelection = selectedIds.includes(id)
              ? selectedIds.filter((sid) => sid !== id)
              : [...selectedIds, id];
            onChange(newSelection);
          };

          return (
            <Box
              style={{ maxHeight: "400px" }}
              overflow="auto"
              borderWidth={1}
              borderStyle="solid"
              borderColor="default1"
              borderRadius={2}
              padding={2}
            >
              {isLoading ? (
                <Text>Loading subscribers...</Text>
              ) : filteredSubscribers.length === 0 ? (
                <Text color="default2">No subscribers found</Text>
              ) : (
                <Box display="flex" flexDirection="column" gap={1}>
                  {filteredSubscribers.map((subscriber) => (
                    <Box
                      key={subscriber.id}
                      display="flex"
                      alignItems="center"
                      padding={2}
                      borderRadius={1}
                      backgroundColor={
                        selectedIds.includes(subscriber.id) ? "accent1" : "transparent"
                      }
                      style={{ cursor: "pointer" }}
                      onClick={() => toggleSubscriber(subscriber.id)}
                    >
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(subscriber.id)}
                        onChange={() => toggleSubscriber(subscriber.id)}
                        style={{ marginRight: "8px" }}
                      />
                      <Box style={{ flex: 1 }}>
                        <Text fontWeight={selectedIds.includes(subscriber.id) ? "bold" : "regular"}>
                          {subscriber.email}
                        </Text>
                        {(subscriber.user?.firstName || subscriber.user?.lastName) && (
                          <Text size={1} color="default2">
                            {subscriber.user?.firstName} {subscriber.user?.lastName}
                          </Text>
                        )}
                      </Box>
                      <Text size={1} color="default2">
                        {subscriber.isActive ? "Active" : "Inactive"}
                      </Text>
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
          );
        }}
      />

      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Controller
          control={control}
          name="recipientFilter.selectedSubscriberIds"
          defaultValue={[]}
          render={({ field: { value } }) => (
            <Text size={2} color="default2">
              {(value || []).length} subscriber(s) selected
            </Text>
          )}
        />
        {subscriptionsData?.pageInfo.hasNextPage && (
          <Button
            variant="tertiary"
            size="small"
            onClick={() => setPageCursor(subscriptionsData.pageInfo.endCursor || undefined)}
          >
            Load More
          </Button>
        )}
      </Box>
    </Box>
  );
};
