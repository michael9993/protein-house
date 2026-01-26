import { zodResolver } from "@hookform/resolvers/zod";
import { useAppBridge } from "@saleor/app-sdk/app-bridge";
import { Box, Button, Select, Text } from "@saleor/macaw-ui";
import { Input } from "@saleor/react-hook-form-macaw";
import { NextPage } from "next";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { gql, useQuery } from "urql";

import { BasicLayout } from "../../../components/basic-layout";
import { SectionWithDescription } from "../../../components/section-with-description";
import { defaultPadding } from "../../../components/ui-defaults";
import { GraphQLProvider } from "../../../modules/graphql/graphql-provider";
import { RecipientSelector } from "../../../modules/newsletter/ui/recipient-selector";
import { trpcClient } from "../../../modules/trpc/trpc-client";
import { updateCampaignInputSchema } from "../../../modules/newsletter/campaigns/campaign-schema";

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

interface Channel {
  id: string;
  slug: string;
  name: string;
  currencyCode: string;
  isActive: boolean;
}

const EditCampaignPage: NextPage = () => {
  const { appBridgeState } = useAppBridge();
  const router = useRouter();
  const campaignId = router.query.id as string | undefined;
  const utils = trpcClient.useUtils();

  const [{ data: channelsData }] = useQuery<{ channels: Channel[] }>({
    query: ChannelsQuery,
    pause: !appBridgeState?.ready,
    requestPolicy: "cache-first",
  });

  const { data: templatesData } = trpcClient.template.list.useQuery(undefined, {
    enabled: !!appBridgeState?.ready,
    staleTime: 60000, // Cache for 1 minute
    refetchOnWindowFocus: false,
  });
  
  const { data: campaignData, isLoading: isLoadingCampaign } = trpcClient.campaign.get.useQuery(
    { id: campaignId! },
    {
      enabled: !!campaignId && !!appBridgeState?.ready,
      staleTime: 30000, // Consider data fresh for 30 seconds
      refetchOnWindowFocus: true, // Refetch when window regains focus
      placeholderData: (previousData) => previousData,
    },
  );

  const { handleSubmit, control, reset } = useForm({
    defaultValues: {
      name: "",
      templateId: "",
      channelSlug: "",
      scheduledAt: "",
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      recipientFilter: {
        isActive: undefined,
        sources: [] as string[],
        selectionType: "all" as const,
        limit: undefined,
        selectedSubscriberIds: [] as string[],
      },
      batchSize: 25,
      rateLimitPerMinute: 60,
      maxRetries: 3,
    },
    resolver: zodResolver(updateCampaignInputSchema.omit({ id: true })),
  });

  // Load campaign data into form
  useEffect(() => {
    if (campaignData?.campaign) {
      const campaign = campaignData.campaign;
      // Convert ISO datetime to datetime-local format
      let scheduledAtDisplay = "";
      if (campaign.scheduledAt) {
        try {
          const date = new Date(campaign.scheduledAt);
          if (!isNaN(date.getTime())) {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, "0");
            const day = String(date.getDate()).padStart(2, "0");
            const hours = String(date.getHours()).padStart(2, "0");
            const minutes = String(date.getMinutes()).padStart(2, "0");
            scheduledAtDisplay = `${year}-${month}-${day}T${hours}:${minutes}`;
          }
        } catch (e) {
          // Invalid date, leave empty
        }
      }

      reset({
        name: campaign.name,
        templateId: campaign.templateId,
        channelSlug: campaign.channelSlug,
        scheduledAt: scheduledAtDisplay,
        timezone: campaign.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
        recipientFilter: {
          isActive: campaign.recipientFilter.isActive,
          sources: campaign.recipientFilter.sources || [],
          selectionType: campaign.recipientFilter.selectionType || "all",
          limit: campaign.recipientFilter.limit || undefined,
          selectedSubscriberIds: campaign.recipientFilter.selectedSubscriberIds || [],
        },
        batchSize: campaign.batchSize || 25,
        rateLimitPerMinute: campaign.rateLimitPerMinute || 60,
        maxRetries: campaign.maxRetries || 3,
      });
    }
  }, [campaignData, reset]);

  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const updateMutation = trpcClient.campaign.update.useMutation({
    onSuccess: async (result) => {
      // Invalidate all campaign queries
      await utils.campaign.list.invalidate();
      await utils.campaign.get.invalidate({ id: campaignId! });
      // Force refetch to ensure UI updates
      await utils.campaign.list.refetch();
      await utils.campaign.get.refetch({ id: campaignId! });
      
      // Update form with latest data
      if (result?.campaign) {
        const campaign = result.campaign;
        let scheduledAtDisplay = "";
        if (campaign.scheduledAt) {
          try {
            const date = new Date(campaign.scheduledAt);
            if (!isNaN(date.getTime())) {
              const year = date.getFullYear();
              const month = String(date.getMonth() + 1).padStart(2, "0");
              const day = String(date.getDate()).padStart(2, "0");
              const hours = String(date.getHours()).padStart(2, "0");
              const minutes = String(date.getMinutes()).padStart(2, "0");
              scheduledAtDisplay = `${year}-${month}-${day}T${hours}:${minutes}`;
            }
          } catch (e) {
            // Invalid date, leave empty
          }
        }
        
        reset({
          name: campaign.name,
          templateId: campaign.templateId,
          channelSlug: campaign.channelSlug,
          scheduledAt: scheduledAtDisplay,
          timezone: campaign.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
          recipientFilter: {
            isActive: campaign.recipientFilter.isActive,
            sources: campaign.recipientFilter.sources || [],
            selectionType: campaign.recipientFilter.selectionType || "all",
            limit: campaign.recipientFilter.limit || undefined,
            selectedSubscriberIds: campaign.recipientFilter.selectedSubscriberIds || [],
          },
          batchSize: campaign.batchSize || 25,
          rateLimitPerMinute: campaign.rateLimitPerMinute || 60,
          maxRetries: campaign.maxRetries || 3,
        });
      }
      
      setMessage({ type: "success", text: "Campaign updated successfully!" });
      setTimeout(() => setMessage(null), 3000);
    },
    onError: (error) => {
      setMessage({ type: "error", text: `Failed to update campaign: ${error.message}` });
    },
  });

  // Return null while App Bridge is initializing - this prevents race conditions
  if (!appBridgeState) {
    return null;
  }

  // Show loading while App Bridge is connecting
  if (!appBridgeState.ready) {
    return (
      <BasicLayout breadcrumbs={[{ name: "Campaigns", href: "/campaigns" }, { name: "Edit" }]}>
        <Text>Loading...</Text>
      </BasicLayout>
    );
  }

  if (isLoadingCampaign) {
    return (
      <BasicLayout breadcrumbs={[{ name: "Campaigns", href: "/campaigns" }, { name: "Edit" }]}>
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

  const campaign = campaignData.campaign;

  if (appBridgeState.user?.permissions.includes("MANAGE_APPS") === false) {
    return (
      <BasicLayout breadcrumbs={[{ name: "Campaigns", href: "/campaigns" }, { name: "Edit" }]}>
        <Text>You do not have permission to access this page.</Text>
      </BasicLayout>
    );
  }

  const channels = channelsData?.channels || [];
  const templates = templatesData?.templates || [];

  return (
    <BasicLayout breadcrumbs={[{ name: "Campaigns", href: "/campaigns" }, { name: campaign.name, href: `/campaigns/${campaignId}` }, { name: "Edit" }]}>
      <form
        onSubmit={handleSubmit(
          (data) => {
            // Convert string numbers to actual numbers for advanced settings and recipient filter
            const submitData = {
              ...data,
              batchSize: data.batchSize ? Number(data.batchSize) : undefined,
              rateLimitPerMinute: data.rateLimitPerMinute ? Number(data.rateLimitPerMinute) : undefined,
              maxRetries: data.maxRetries !== undefined ? Number(data.maxRetries) : undefined,
              recipientFilter: {
                ...data.recipientFilter,
                limit: data.recipientFilter?.limit ? Number(data.recipientFilter.limit) : undefined,
              },
            };
            updateMutation.mutate({
              id: campaignId!,
              ...submitData,
            });
          },
          (errors) => {
            console.error("Form validation errors:", errors);
            const errorMessages = Object.entries(errors)
              .map(([field, error]: [string, any]) => `${field}: ${error?.message || "Invalid"}`)
              .join(", ");
            setMessage({ type: "error", text: `Please fix the form errors: ${errorMessages}` });
            setTimeout(() => setMessage(null), 5000);
          }
        )}
      >
        <Box display="flex" flexDirection="column" gap={defaultPadding}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Text size={10} fontWeight="bold">
              Edit Campaign
            </Text>
            <Box display="flex" gap={2}>
              <Button variant="secondary" onClick={() => router.push(`/campaigns/${campaignId}`)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </Box>
          </Box>

          <Box display="grid" gridTemplateColumns={{ desktop: 2, mobile: 1 }} gap={defaultPadding}>
            <Input control={control} name="name" label="Campaign Name" required />
            <Controller
              control={control}
              name="channelSlug"
              render={({ field: { onChange, value } }) => (
                <Select
                  label="Channel"
                  options={channels.map((ch) => ({
                    value: ch.slug,
                    label: `${ch.name} (${ch.currencyCode})`,
                  }))}
                  value={value || ""}
                  onChange={(val) => onChange(val as string)}
                />
              )}
            />
          </Box>

          <Box display="grid" gridTemplateColumns={{ desktop: 2, mobile: 1 }} gap={defaultPadding}>
            <Controller
              control={control}
              name="templateId"
              render={({ field: { onChange, value } }) => (
                <Select
                  label="Template"
                  options={templates.map((t) => ({
                    value: t.id,
                    label: t.name,
                  }))}
                  value={value || ""}
                  onChange={(val) => onChange(val as string)}
                />
              )}
            />
            <Input
              control={control}
              name="scheduledAt"
              label="Schedule (optional)"
              type="datetime-local"
            />
          </Box>

          <SectionWithDescription
            title="Recipient Selection"
            description={<Text>Choose how to select recipients for this campaign.</Text>}
          >
            <RecipientSelector control={control} />
          </SectionWithDescription>

          <Box>
            <Text size={5} fontWeight="bold" marginBottom={2}>
              Advanced Settings
            </Text>
            <Box display="grid" gridTemplateColumns={{ desktop: 3, mobile: 1 }} gap={defaultPadding}>
              <Input
                control={control}
                name="batchSize"
                label="Batch Size"
                type="number"
                min={1}
                max={100}
              />
              <Input
                control={control}
                name="rateLimitPerMinute"
                label="Rate Limit (per minute)"
                type="number"
                min={1}
                max={1000}
              />
              <Input
                control={control}
                name="maxRetries"
                label="Max Retries"
                type="number"
                min={0}
                max={10}
              />
            </Box>
          </Box>

          {message && (
            <Box
              padding={3}
              backgroundColor={message.type === "success" ? "success1" : "critical1"}
              borderRadius={2}
            >
              <Text color={message.type === "success" ? "default1" : "critical2"}>
                {message.text}
              </Text>
            </Box>
          )}

          {updateMutation.error && !message && (
            <Box padding={3} backgroundColor="critical1" borderRadius={2}>
              <Text color="critical2">
                Error: {updateMutation.error.message || "Failed to update campaign"}
              </Text>
            </Box>
          )}
        </Box>
      </form>
    </BasicLayout>
  );
};

// Wrap with GraphQL provider for channel query
const EditCampaignPageWithProvider: NextPage = () => (
  <GraphQLProvider>
    <EditCampaignPage />
  </GraphQLProvider>
);

export default EditCampaignPageWithProvider;
