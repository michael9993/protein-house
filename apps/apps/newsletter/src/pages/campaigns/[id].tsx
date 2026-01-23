import { useAppBridge } from "@saleor/app-sdk/app-bridge";
import { Box, Button, Text } from "@saleor/macaw-ui";
import { NextPage } from "next";
import { useRouter } from "next/router";
import { useState } from "react";

import { BasicLayout } from "../../components/basic-layout";
import { SectionWithDescription } from "../../components/section-with-description";
import { trpcClient } from "../../modules/trpc/trpc-client";

const DeleteCampaignButton = ({ campaignId, campaignName }: { campaignId: string; campaignName: string }) => {
  const router = useRouter();
  const utils = trpcClient.useUtils();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const deleteMutation = trpcClient.campaign.delete.useMutation({
    onSuccess: async () => {
      await utils.campaign.list.invalidate();
      await utils.campaign.list.refetch();
      setMessage({ type: "success", text: "Campaign deleted successfully!" });
      setTimeout(() => {
        router.push("/campaigns");
      }, 1000);
    },
    onError: (error) => {
      setMessage({ type: "error", text: `Failed to delete campaign: ${error.message}` });
      console.error("Delete error:", error);
      setIsDeleting(false);
      setShowConfirm(false);
    },
  });

  const handleDelete = () => {
    setShowConfirm(true);
  };

  const confirmDelete = () => {
    setIsDeleting(true);
    deleteMutation.mutate({ id: campaignId });
  };

  return (
    <>
      {message && (
        <Box
          padding={2}
          marginBottom={2}
          backgroundColor={message.type === "success" ? "success1" : "critical1"}
          borderRadius={2}
        >
          <Text color={message.type === "success" ? "default1" : "critical2"} size={2}>
            {message.text}
          </Text>
        </Box>
      )}
      {showConfirm && (
        <Box
          padding={3}
          marginBottom={2}
          backgroundColor="warning1"
          borderRadius={2}
          borderWidth={1}
          borderStyle="solid"
          borderColor="default1"
        >
          <Text marginBottom={2} fontWeight="bold" size={3}>
            Delete Campaign?
          </Text>
          <Text marginBottom={3} size={2}>
            Are you sure you want to delete "{campaignName}"? This action cannot be undone.
          </Text>
          <Box display="flex" gap={2}>
            <Button variant="primary" size="small" onClick={confirmDelete} disabled={isDeleting}>
              {isDeleting ? "Deleting..." : "Yes, Delete"}
            </Button>
            <Button variant="secondary" size="small" onClick={() => setShowConfirm(false)}>
              Cancel
            </Button>
          </Box>
        </Box>
      )}
      {!showConfirm && (
        <Button variant="tertiary" onClick={handleDelete} disabled={isDeleting}>
          Delete
        </Button>
      )}
    </>
  );
};

const CampaignDetailPage: NextPage = () => {
  const { appBridgeState } = useAppBridge();
  const router = useRouter();
  const campaignId = router.query.id as string | undefined;
  const utils = trpcClient.useUtils();

  const { data: campaignData, isLoading } = trpcClient.campaign.get.useQuery(
    { id: campaignId! },
    {
      enabled: !!campaignId && !!appBridgeState?.ready,
      staleTime: 30000, // Cache for 30 seconds
      refetchOnWindowFocus: false,
    },
  );

  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const updateStatusMutation = trpcClient.campaign.updateStatus.useMutation({
    onSuccess: async (result) => {
      await utils.campaign.get.invalidate({ id: campaignId! });
      await utils.campaign.list.invalidate();
      
      // Show success message
      if (result?.campaign) {
        const recipientCount = result.campaign.recipientCount || 0;
        if (recipientCount > 0) {
          setStatusMessage({ type: "success", text: `Campaign started! It will send to ${recipientCount} subscriber(s).` });
        } else {
          setStatusMessage({ type: "error", text: "Campaign started, but no subscribers match the selected filters." });
        }
      }
    },
    onError: (error) => {
      setStatusMessage({ type: "error", text: `Failed to start campaign: ${error.message}` });
      console.error("Failed to start campaign:", error);
    },
  });

  const handleStart = async () => {
    if (!campaignId) return;
    if (!confirm("Are you sure you want to start this campaign? It will begin sending emails immediately.")) {
      return;
    }

    updateStatusMutation.mutate({
      id: campaignId,
      status: "sending",
    });
  };

  const cancelMutation = trpcClient.campaign.updateStatus.useMutation({
    onSuccess: async () => {
      await utils.campaign.get.invalidate({ id: campaignId! });
      await utils.campaign.list.invalidate();
      setStatusMessage({ type: "success", text: "Campaign cancelled successfully!" });
    },
    onError: (error) => {
      setStatusMessage({ type: "error", text: `Failed to cancel campaign: ${error.message}` });
      console.error("Failed to cancel campaign:", error);
    },
  });

  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const handleCancel = () => {
    setShowCancelConfirm(true);
  };

  const confirmCancel = () => {
    if (!campaignId) return;
    cancelMutation.mutate({
      id: campaignId,
      status: "cancelled",
    });
    setShowCancelConfirm(false);
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
      <BasicLayout breadcrumbs={[{ name: "Campaigns", href: "/campaigns" }, { name: "Details" }]}>
        <Text>Loading...</Text>
      </BasicLayout>
    );
  }

  if (isLoading) {
    return (
      <BasicLayout breadcrumbs={[{ name: "Campaigns", href: "/campaigns" }, { name: "Details" }]}>
        <Text>Loading campaign...</Text>
      </BasicLayout>
    );
  }

  if (!campaignData?.campaign) {
    return (
      <BasicLayout breadcrumbs={[{ name: "Campaigns", href: "/campaigns" }, { name: "Not Found" }]}>
        <Text>Campaign not found</Text>
      </BasicLayout>
    );
  }

  if (appBridgeState.user?.permissions.includes("MANAGE_APPS") === false) {
    return (
      <BasicLayout breadcrumbs={[{ name: "Campaigns", href: "/campaigns" }, { name: "Details" }]}>
        <Text>You do not have permission to access this page.</Text>
      </BasicLayout>
    );
  }

  const campaign = campaignData.campaign;
  const progress =
    campaign.recipientCount > 0
      ? Math.round((campaign.sentCount / campaign.recipientCount) * 100)
      : 0;

  return (
    <BasicLayout breadcrumbs={[{ name: "Campaigns", href: "/campaigns" }, { name: campaign.name }]}>
      <Box display="flex" justifyContent="space-between" alignItems="center" marginBottom={4}>
        <Box>
          <Text as="h1" variant="hero">
            {campaign.name}
          </Text>
          <Text as="p" color="default2" marginTop={2}>
            Campaign details and progress
          </Text>
        </Box>
        <Box display="flex" gap={2}>
          {(campaign.status === "draft" || campaign.status === "failed" || campaign.status === "cancelled") && (
            <Button 
              variant="primary" 
              onClick={handleStart}
              disabled={updateStatusMutation.isPending}
            >
              {updateStatusMutation.isPending ? "Starting..." : "Start Campaign"}
            </Button>
          )}
          {(campaign.status === "scheduled" || campaign.status === "sending") && (
            <Button 
              variant="secondary" 
              onClick={handleCancel}
              disabled={cancelMutation.isPending}
            >
              {cancelMutation.isPending ? "Cancelling..." : "Cancel Campaign"}
            </Button>
          )}
          <Button variant="secondary" onClick={() => router.push(`/campaigns/${campaign.id}/edit`)}>
            Edit
          </Button>
          <DeleteCampaignButton campaignId={campaign.id} campaignName={campaign.name} />
          <Button variant="secondary" onClick={() => router.push("/campaigns")}>
            Back to List
          </Button>
        </Box>
      </Box>

      <SectionWithDescription
        title="Campaign Information"
        description={<Text>Basic information about this campaign.</Text>}
      >
        <Box display="grid" gridTemplateColumns={{ desktop: 2, mobile: 1 }} gap={4}>
          <Box>
            <Text size={2} color="default2" marginBottom={1}>
              Status
            </Text>
            <Text color={getStatusColor(campaign.status)} fontWeight="bold">
              {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
            </Text>
          </Box>
          <Box>
            <Text size={2} color="default2" marginBottom={1}>
              Channel
            </Text>
            <Text>{campaign.channelSlug}</Text>
          </Box>
          <Box>
            <Text size={2} color="default2" marginBottom={1}>
              Scheduled For
            </Text>
            <Text>
              {campaign.scheduledAt
                ? new Date(campaign.scheduledAt).toLocaleString()
                : "Not scheduled"}
            </Text>
          </Box>
          <Box>
            <Text size={2} color="default2" marginBottom={1}>
              Created
            </Text>
            <Text>{new Date(campaign.createdAt).toLocaleString()}</Text>
          </Box>
        </Box>
      </SectionWithDescription>

      <SectionWithDescription
        title="Progress"
        description={<Text>Campaign sending progress and statistics.</Text>}
      >
        <Box display="grid" gridTemplateColumns={{ desktop: 3, mobile: 1 }} gap={4}>
          <Box padding={4} borderWidth={1} borderStyle="solid" borderColor="default1" borderRadius={2}>
            <Text size={1} color="default2" marginBottom={1}>
              Recipients
            </Text>
            <Text size={8} fontWeight="bold">
              {campaign.recipientCount}
            </Text>
          </Box>
          <Box padding={4} borderWidth={1} borderStyle="solid" borderColor="default1" borderRadius={2}>
            <Text size={1} color="default2" marginBottom={1}>
              Sent
            </Text>
            <Text size={8} fontWeight="bold" color="success1">
              {campaign.sentCount}
            </Text>
          </Box>
          <Box padding={4} borderWidth={1} borderStyle="solid" borderColor="default1" borderRadius={2}>
            <Text size={1} color="default2" marginBottom={1}>
              Failed
            </Text>
            <Text size={8} fontWeight="bold" color="critical1">
              {campaign.failedCount}
            </Text>
          </Box>
        </Box>

        {campaign.status === "sending" && (
          <Box marginTop={4}>
            <Text size={2} color="default2" marginBottom={2}>
              Progress: {progress}%
            </Text>
            <Box
              width="100%"
              height={8}
              backgroundColor="default1"
              borderRadius={4}
              overflow="hidden"
            >
              <Box
                width={`${progress}%`}
                height="100%"
                backgroundColor="info1"
                style={{ transition: "width 0.3s" }}
              />
            </Box>
          </Box>
        )}
      </SectionWithDescription>

      {campaign.errorLog && campaign.errorLog.length > 0 && (
        <SectionWithDescription
          title="Errors"
          description={<Text>Errors encountered during campaign sending.</Text>}
        >
          <Box
            maxHeight={400}
            overflow="auto"
            padding={3}
            backgroundColor="default1"
            borderRadius={2}
          >
            {campaign.errorLog.slice(-50).map((error, index) => (
              <Box key={index} marginBottom={2} padding={2} backgroundColor="critical1" borderRadius={1}>
                <Text size={1} color="critical2">
                  <strong>{error.email}</strong>: {error.error}
                </Text>
                <Text size={1} color="default2">
                  {new Date(error.timestamp).toLocaleString()}
                </Text>
              </Box>
            ))}
          </Box>
        </SectionWithDescription>
      )}
    </BasicLayout>
  );
};

export default CampaignDetailPage;
