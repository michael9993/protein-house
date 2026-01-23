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

  const { data: campaignsData, isLoading } = trpcClient.campaign.list.useQuery(undefined, {
    enabled: !!appBridgeState?.ready,
    staleTime: 30000, // Cache for 30 seconds
    refetchOnWindowFocus: false,
  });

  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);

  const deleteMutation = trpcClient.campaign.delete.useMutation({
    onSuccess: async () => {
      await utils.campaign.list.invalidate();
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

  const handleDuplicate = async (id: string) => {
    try {
      const result = await trpcClient.campaign.duplicate.mutate({ id });
      await utils.campaign.list.invalidate();
      // Navigate to the new duplicated campaign
      if (result?.campaign) {
        setMessage({ type: "success", text: "Campaign duplicated successfully!" });
        setTimeout(() => {
          router.push(`/campaigns/${result.campaign.id}`);
        }, 1000);
      }
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Failed to duplicate campaign" });
      setTimeout(() => setMessage(null), 5000);
    }
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

  if (!appBridgeState?.ready) {
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
          <Text color={message.type === "success" ? "default1" : "critical2"}>
            {message.text}
          </Text>
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
            <Button variant="primary" onClick={confirmDelete} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? "Deleting..." : "Yes, Delete"}
            </Button>
            <Button variant="secondary" onClick={() => setDeleteConfirm(null)}>
              Cancel
            </Button>
          </Box>
        </Box>
      )}

      <Box display="flex" justifyContent="space-between" alignItems="center" marginBottom={4}>
        <Box>
          <Text as="h1" variant="hero">
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
        {isLoading ? (
          <Text>Loading campaigns...</Text>
        ) : campaignsData?.campaigns.length === 0 ? (
          <Box padding={6} textAlign="center">
            <Text color="default2">No campaigns yet. Create your first campaign to get started.</Text>
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
                const progress =
                  campaign.recipientCount > 0
                    ? Math.round((campaign.sentCount / campaign.recipientCount) * 100)
                    : 0;

                return (
                  <Table.Row key={campaign.id}>
                    <Table.Cell>
                      <Text fontWeight="bold">{campaign.name}</Text>
                    </Table.Cell>
                    <Table.Cell>
                      <Text color={getStatusColor(campaign.status)}>
                        {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                      </Text>
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
                      <Text>
                        {campaign.sentCount} / {campaign.recipientCount} ({progress}%)
                      </Text>
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
                        >
                          Duplicate
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
