import { useAppBridge } from "@saleor/app-sdk/app-bridge";
import { Box, Button, Text } from "@saleor/macaw-ui";
import { NextPage } from "next";
import { useRouter } from "next/router";
import { useState } from "react";

import { BasicLayout } from "../components/basic-layout";
import { SectionWithDescription } from "../components/section-with-description";
import { Table } from "../components/table";
import { trpcClient } from "../modules/trpc/trpc-client";

const CampaignsPage: NextPage = () => {
  const { appBridgeState } = useAppBridge();
  const router = useRouter();
  const utils = trpcClient.useUtils();

  const {
    data: campaignsData,
    isLoading,
    isFetching,
  } = trpcClient.campaign.list.useQuery(undefined, {
    enabled: !!appBridgeState?.ready,
    staleTime: 0, // Always consider stale so refetch keeps table current after create/delete
    refetchOnWindowFocus: true,
    refetchOnMount: "always", // Refetch when navigating back from detail/create so table shows current state
    // Dynamic refetch interval - faster when campaigns are sending
    refetchInterval: (data) => {
      const hasSending = data?.campaigns?.some((c) => c.status === "sending");
      return hasSending ? 2000 : 10000; // 2s when sending, 10s otherwise
    },
  });

  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);

  const deleteMutation = trpcClient.campaign.delete.useMutation({
    onSuccess: async () => {
      // Invalidate all campaign-related queries
      await utils.campaign.list.invalidate();
      await utils.campaign.get.invalidate();
      // Force refetch to ensure UI updates immediately
      await utils.campaign.list.refetch();
      setMessage({ type: "success", text: "Campaign deleted successfully!" });
      setDeleteConfirm(null);
      setTimeout(() => setMessage(null), 3000);
    },
    onError: (error) => {
      setMessage({ type: "error", text: `Failed to delete campaign: ${error.message}` });
      setDeleteConfirm(null);
      console.error("Failed to delete campaign:", error);
      setTimeout(() => setMessage(null), 5000);
    },
  });

  const duplicateMutation = trpcClient.campaign.duplicate.useMutation({
    onSuccess: async (result) => {
      // Invalidate and refetch to show the new campaign in the list
      await utils.campaign.list.invalidate();
      await utils.campaign.list.refetch();
      // Navigate to the new duplicated campaign
      if (result?.campaign) {
        setMessage({ type: "success", text: "Campaign duplicated successfully!" });
        setTimeout(() => {
          router.push(`/campaigns/${result.campaign.id}`);
        }, 1000);
      }
    },
    onError: (error) => {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to duplicate campaign",
      });
      setTimeout(() => setMessage(null), 5000);
    },
  });

  const handleDelete = (id: string) => {
    const campaign = campaignsData?.campaigns.find((c) => c.id === id);
    if (campaign) {
      setDeleteConfirm({ id, name: campaign.name });
    }
  };

  const confirmDelete = () => {
    if (deleteConfirm) {
      deleteMutation.mutate({ id: deleteConfirm.id });
    }
  };

  const handleDuplicate = (id: string) => {
    duplicateMutation.mutate({ id });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "sent":
        return "success1";
      case "sending":
        return "info1";
      case "failed":
        return "critical1";
      case "cancelled":
        return "default2";
      case "scheduled":
        return "warning1";
      default:
        return "default1";
    }
  };

  // Return null while App Bridge is initializing - this prevents race conditions
  if (!appBridgeState) {
    return null;
  }

  // Show loading while App Bridge is connecting
  if (!appBridgeState.ready) {
    return (
      <BasicLayout breadcrumbs={[{ name: "Campaigns" }]}>
        <Text>Loading...</Text>
      </BasicLayout>
    );
  }

  if (appBridgeState.user?.permissions.includes("MANAGE_APPS") === false) {
    return (
      <BasicLayout breadcrumbs={[{ name: "Campaigns" }]}>
        <Text>You do not have permission to access this page.</Text>
      </BasicLayout>
    );
  }

  return (
    <BasicLayout breadcrumbs={[{ name: "Campaigns" }]}>
      {message && (
        <Box
          padding={3}
          marginBottom={4}
          backgroundColor={message.type === "success" ? "success1" : "critical1"}
          borderRadius={2}
        >
          <Text color={message.type === "success" ? "default1" : "critical2"}>{message.text}</Text>
        </Box>
      )}

      {deleteConfirm && (
        <Box
          padding={4}
          marginBottom={4}
          backgroundColor="warning1"
          borderRadius={2}
          borderWidth={1}
          borderStyle="solid"
          borderColor="default1"
        >
          <Text marginBottom={2} fontWeight="bold">
            Delete Campaign?
          </Text>
          <Text marginBottom={3}>
            Are you sure you want to delete "{deleteConfirm.name}"? This action cannot be undone.
          </Text>
          <Box display="flex" gap={2}>
            <Button variant="primary" onClick={confirmDelete} disabled={deleteMutation.isLoading}>
              {deleteMutation.isLoading ? "Deleting..." : "Yes, Delete"}
            </Button>
            <Button variant="secondary" onClick={() => setDeleteConfirm(null)}>
              Cancel
            </Button>
          </Box>
        </Box>
      )}

      <Box display="flex" justifyContent="space-between" alignItems="center" marginBottom={4}>
        <Box>
          <Text as="h1" size={5} fontWeight="bold">
            Campaigns
          </Text>
          <Text as="p" color="default2" marginTop={2}>
            Create and manage email campaigns for your newsletter subscribers.
          </Text>
        </Box>
        <Button variant="primary" onClick={() => router.push("/campaigns/new")}>
          Create Campaign
        </Button>
      </Box>

      <SectionWithDescription
        title="Campaigns"
        description={<Text>Manage your email campaigns. Track progress and view statistics.</Text>}
      >
        {isLoading && !campaignsData ? (
          <Text>Loading campaigns...</Text>
        ) : campaignsData?.campaigns.length === 0 ? (
          <Box padding={6} textAlign="center">
            <Text color="default2">
              No campaigns yet. Create your first campaign to get started.
            </Text>
          </Box>
        ) : (
          <Table.Container>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Name</Table.HeaderCell>
                <Table.HeaderCell>Status</Table.HeaderCell>
                <Table.HeaderCell>Channel</Table.HeaderCell>
                <Table.HeaderCell>Scheduled</Table.HeaderCell>
                <Table.HeaderCell>Progress</Table.HeaderCell>
                <Table.HeaderCell>Actions</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {campaignsData?.campaigns.map((campaign) => {
                const totalProcessed = campaign.sentCount + campaign.failedCount;
                const progress =
                  campaign.recipientCount > 0
                    ? Math.round((totalProcessed / campaign.recipientCount) * 100)
                    : 0;
                const successRate =
                  totalProcessed > 0 ? Math.round((campaign.sentCount / totalProcessed) * 100) : 0;

                return (
                  <Table.Row key={campaign.id}>
                    <Table.Cell>
                      <Text fontWeight="bold">{campaign.name}</Text>
                    </Table.Cell>
                    <Table.Cell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Box
                          width={2}
                          height={2}
                          borderRadius={3}
                          backgroundColor={
                            campaign.status === "sending"
                              ? "info1"
                              : campaign.status === "sent"
                                ? "success1"
                                : campaign.status === "failed"
                                  ? "critical1"
                                  : campaign.status === "cancelled"
                                    ? "default2"
                                    : campaign.status === "scheduled"
                                      ? "warning1"
                                      : "default1"
                          }
                          style={{
                            animation: campaign.status === "sending" ? "pulse 2s infinite" : "none",
                          }}
                        />
                        <Text color={getStatusColor(campaign.status)}>
                          {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                        </Text>
                      </Box>
                    </Table.Cell>
                    <Table.Cell>
                      <Text>{campaign.channelSlug}</Text>
                    </Table.Cell>
                    <Table.Cell>
                      <Text size={3}>
                        {campaign.scheduledAt
                          ? new Date(campaign.scheduledAt).toLocaleDateString()
                          : "—"}
                      </Text>
                    </Table.Cell>
                    <Table.Cell>
                      <Box display="flex" flexDirection="column" gap={1}>
                        {/* Progress bar */}
                        <Box
                          width="100%"
                          height={2}
                          backgroundColor="default2"
                          borderRadius={1}
                          overflow="hidden"
                        >
                          <Box
                            height="100%"
                            borderRadius={1}
                            style={{
                              width: `${progress}%`,
                              backgroundColor:
                                campaign.status === "sending"
                                  ? "#3B82F6"
                                  : campaign.status === "sent"
                                    ? "#10B981"
                                    : campaign.status === "failed"
                                      ? "#EF4444"
                                      : "#6B7280",
                              transition: "width 0.3s ease-in-out",
                            }}
                          />
                        </Box>
                        {/* Progress text */}
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Text size={2}>
                            {campaign.sentCount} sent
                            {campaign.failedCount > 0 ? `, ${campaign.failedCount} failed` : ""} /{" "}
                            {campaign.recipientCount}
                          </Text>
                          <Text
                            size={2}
                            color={campaign.status === "sending" ? "info1" : "default2"}
                          >
                            {progress}%
                          </Text>
                        </Box>
                      </Box>
                    </Table.Cell>
                    <Table.Cell>
                      <Box display="flex" gap={2}>
                        <Button
                          variant="tertiary"
                          size="small"
                          onClick={() => router.push(`/campaigns/${campaign.id}`)}
                        >
                          View
                        </Button>
                        <Button
                          variant="tertiary"
                          size="small"
                          onClick={() => router.push(`/campaigns/${campaign.id}/edit`)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="tertiary"
                          size="small"
                          onClick={() => handleDuplicate(campaign.id)}
                          disabled={duplicateMutation.isLoading}
                        >
                          {duplicateMutation.isLoading ? "Duplicating..." : "Duplicate"}
                        </Button>
                        <Button
                          variant="tertiary"
                          size="small"
                          onClick={() => handleDelete(campaign.id)}
                        >
                          Delete
                        </Button>
                      </Box>
                    </Table.Cell>
                  </Table.Row>
                );
              })}
            </Table.Body>
          </Table.Container>
        )}
      </SectionWithDescription>
    </BasicLayout>
  );
};

export default CampaignsPage;
