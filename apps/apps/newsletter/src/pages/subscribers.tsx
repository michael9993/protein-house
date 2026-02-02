import { useAppBridge } from "@saleor/app-sdk/app-bridge";
import { Box, Text } from "@saleor/macaw-ui";
import { NextPage } from "next";
import { useCallback, useEffect, useMemo, useState } from "react";
import { gql, useQuery } from "urql";

import { BasicLayout } from "../components/basic-layout";
import { SectionWithDescription } from "../components/section-with-description";
import { GraphQLProvider } from "../modules/graphql/graphql-provider";
import { SubscriberFilters } from "../modules/newsletter/ui/subscriber-filters";
import { SubscriberStats } from "../modules/newsletter/ui/subscriber-stats";
import { SubscribersList } from "../modules/newsletter/ui/subscribers-list";
import { trpcClient } from "../modules/trpc/trpc-client";

const ChannelsQuery = gql`
  query Channels {
    channels {
      id
      slug
      name
      currencyCode
      isActive
    }
  }
`;

const SubscribersPageContent: React.FC = () => {
  const { appBridgeState } = useAppBridge();
  const [filters, setFilters] = useState<{
    isActive?: boolean;
    source?: string;
    channel?: string;
    search?: string;
  }>({
    isActive: true, // Default to active subscribers
  });
  const [pageCursor, setPageCursor] = useState<string | undefined>();

  const [{ data: channelsData }] = useQuery<{ channels: Array<{ slug: string; name: string; isActive: boolean }> }>({
    query: ChannelsQuery,
    pause: !appBridgeState?.ready,
    requestPolicy: "cache-first",
  });

  const queryInput = {
    first: 50,
    after: pageCursor,
    filter: {
      ...(filters.isActive !== undefined ? { isActive: filters.isActive } : {}),
      ...(filters.source ? { source: filters.source } : {}),
      ...(filters.channel ? { channel: filters.channel } : {}),
    },
    search: filters.search,
  };

  const {
    data: subscriptionsData,
    isLoading: isLoadingSubscriptions,
    error: subscriptionsError,
    refetch: refetchSubscriptions,
  } = trpcClient.newsletter.getSubscriptions.useQuery(
    queryInput,
    {
      enabled: !!appBridgeState?.ready,
      retry: false,
      staleTime: 30000, // Consider data fresh for 30 seconds
      refetchOnWindowFocus: true, // Refetch when window regains focus
    },
  );

  const {
    data: statsData,
    isLoading: isLoadingStats,
    error: statsError,
    refetch: refetchStats,
  } = trpcClient.newsletter.getStats.useQuery(undefined, {
    enabled: !!appBridgeState?.ready,
    retry: false,
    staleTime: 30000, // Consider data fresh for 30 seconds
    refetchOnWindowFocus: true, // Refetch when window regains focus
    });

  // Extract available sources from stats
  const availableSources = useMemo(() => {
    if (!statsData?.bySource) return [];
    return Object.keys(statsData.bySource);
  }, [statsData]);

  // Extract available channels
  const availableChannels = useMemo(() => {
    if (!channelsData?.channels) return [];
    return channelsData.channels
      .filter((ch) => ch.isActive)
      .map((ch) => ({ slug: ch.slug, name: ch.name }));
  }, [channelsData]);

  const utils = trpcClient.useUtils();

  const handleLoadMore = useCallback((direction: "next" | "previous") => {
    if (!subscriptionsData) return;

    if (direction === "next" && subscriptionsData.pageInfo.hasNextPage) {
      setPageCursor(subscriptionsData.pageInfo.endCursor || undefined);
    } else if (direction === "previous" && subscriptionsData.pageInfo.hasPreviousPage) {
      // For previous, we'd need to use 'before' cursor, but for simplicity, reset to start
      setPageCursor(undefined);
    }
  }, [subscriptionsData]);

  const handleExport = useCallback(async () => {
    try {
      const result = await utils.newsletter.exportToCSV.fetch({
        filter: filters.isActive !== undefined ? { isActive: filters.isActive } : undefined,
      });

      // Create download
      const blob = new Blob([result.csv], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `newsletter-subscribers-${new Date().toISOString().split("T")[0]}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Failed to export CSV:", error);
      alert("Failed to export subscribers. Please try again.");
    }
  }, [filters, utils]);

  // Reset cursor when filters change
  useEffect(() => {
    setPageCursor(undefined);
  }, [filters]);

  // Return null while App Bridge is initializing - this prevents race conditions
  if (!appBridgeState) {
    return null;
  }

  // Show loading while App Bridge is connecting
  if (!appBridgeState.ready) {
    return (
      <BasicLayout breadcrumbs={[{ name: "Subscribers" }]}>
        <Text size={10} fontWeight="bold">
          Loading...
        </Text>
      </BasicLayout>
    );
  }

  // Show loading only on initial fetch (when we have no data yet)
  const isInitialLoading = (isLoadingSubscriptions && !subscriptionsData) || (isLoadingStats && !statsData);
  
  if (isInitialLoading) {
    return (
      <BasicLayout breadcrumbs={[{ name: "Subscribers" }]}>
        <Text size={10} fontWeight="bold">
          Loading...
        </Text>
      </BasicLayout>
    );
  }

  if (appBridgeState.user?.permissions.includes("MANAGE_APPS") === false) {
    return (
      <BasicLayout breadcrumbs={[{ name: "Subscribers" }]}>
        <Text>You do not have permission to access this page.</Text>
      </BasicLayout>
    );
  }

  return (
    <BasicLayout breadcrumbs={[{ name: "Subscribers" }]}>
      <Box display="grid" gridTemplateColumns={{ desktop: 3, mobile: 1 }}>
        <Box>
          <Text>View and manage newsletter subscribers. Filter by status, source, or search by email.</Text>
        </Box>
      </Box>

      <SectionWithDescription
        title="Subscriber Statistics"
        description={<Text>Overview of your newsletter subscribers.</Text>}
      >
        {statsError && (
          <Box padding={3} marginBottom={3} backgroundColor="critical1" borderRadius={2}>
            <Text color="critical2">
              Error loading statistics: {statsError.message || "Unknown error"}
            </Text>
          </Box>
        )}
        <SubscriberStats stats={statsData} isLoading={isLoadingStats} />
      </SectionWithDescription>

      <SectionWithDescription
        title="Subscribers"
        description={<Text>Filter and search your newsletter subscribers.</Text>}
      >
        {subscriptionsError && (
          <Box padding={3} marginBottom={3} backgroundColor="critical1" borderRadius={2}>
            <Text color="critical2">
              Error loading subscribers: {subscriptionsError.message || "Unknown error"}
            </Text>
          </Box>
        )}
        <Box display="grid" gap={4}>
          <SubscriberFilters
            filters={filters}
            onFiltersChange={setFilters}
            availableSources={availableSources}
            availableChannels={availableChannels}
          />
          <SubscribersList
            subscriptions={subscriptionsData?.subscriptions || []}
            isLoading={isLoadingSubscriptions}
            pageInfo={subscriptionsData?.pageInfo || {
              hasNextPage: false,
              hasPreviousPage: false,
              startCursor: null,
              endCursor: null,
            }}
            onLoadMore={handleLoadMore}
            onExport={handleExport}
            queryInput={queryInput}
            onRefetch={refetchSubscriptions}
            onRefetchStats={refetchStats}
          />
        </Box>
      </SectionWithDescription>
    </BasicLayout>
  );
};

const SubscribersPage: NextPage = () => {
  return (
    <GraphQLProvider>
      <SubscribersPageContent />
    </GraphQLProvider>
  );
};

export default SubscribersPage;
