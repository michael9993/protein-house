import { Box, Button, Text } from "@saleor/macaw-ui";
import { useState, useMemo, useEffect, useRef } from "react";
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
      enabled: !!control, // Only run query when control is available
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

  // Helper function to validate Saleor Global IDs (base64-encoded strings)
  const isValidGlobalId = (id: string): boolean => {
    if (typeof id !== "string" || id.length === 0) return false;
    try {
      // Try to decode base64 - Global IDs are base64-encoded strings
      const decoded = atob(id);
      // Check if it follows the format "TypeName:ID"
      return decoded.includes(":") && decoded.split(":").length === 2;
    } catch {
      // Not valid base64
      return false;
    }
  };

  // UUID validation regex - REMOVED, using Global ID validation instead
  // const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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
        render={({ field: { onChange, value, ...field } }) => {
          // Ensure we only have valid Global ID strings (filter out any error objects or invalid values)
          // This is critical - React Hook Form might store error objects in the array
          const selectedIds = useMemo(() => {
            if (!Array.isArray(value)) return [];
            return value.filter((id): id is string => {
              // Only accept valid string Global IDs
              return isValidGlobalId(id);
            });
          }, [value]);

          // Clean up invalid values immediately if they exist
          const cleanupRef = useRef(false);
          useEffect(() => {
            if (Array.isArray(value)) {
              const hasInvalidValues = value.some((id) => !isValidGlobalId(id));

              if (hasInvalidValues && !cleanupRef.current) {
                cleanupRef.current = true;
                // Only update if there are actually invalid values
                if (selectedIds.length !== value.length) {
                  onChange(selectedIds);
                }
                // Reset flag after a short delay
                setTimeout(() => {
                  cleanupRef.current = false;
                }, 100);
              }
            }
          }, [value, selectedIds, onChange]);

          // Normalize onChange to always set clean array of valid Global ID strings
          const handleChange = (newValue: string[]) => {
            const cleanValue = Array.isArray(newValue)
              ? newValue.filter((id): id is string => isValidGlobalId(id))
              : [];
            onChange(cleanValue);
          };

          const toggleSubscriber = (id: string) => {
            // Validate the ID is a valid Global ID before adding
            if (!isValidGlobalId(id)) {
              console.warn("Invalid Global ID provided to toggleSubscriber:", id);
              return;
            }

            const newSelection = selectedIds.includes(id)
              ? selectedIds.filter((sid) => sid !== id)
              : [...selectedIds, id];
            handleChange(newSelection);
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
          render={({ field: { value } }) => {
            // Ensure we only count valid Global ID strings
            const validIds = Array.isArray(value)
              ? value.filter((id): id is string => {
                  if (typeof id !== "string" || id.length === 0) return false;
                  return isValidGlobalId(id);
                })
              : [];
            return (
              <Text size={2} color="default2">
                {validIds.length} subscriber(s) selected
              </Text>
            );
          }}
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
