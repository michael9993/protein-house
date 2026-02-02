import { zodResolver } from "@hookform/resolvers/zod";
import { useAppBridge } from "@saleor/app-sdk/app-bridge";
import { Box, Button, Select, Text } from "@saleor/macaw-ui";
import { Input } from "@saleor/react-hook-form-macaw";
import { NextPage } from "next";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { gql, useQuery } from "urql";

import { BasicLayout } from "../../components/basic-layout";
import { SectionWithDescription } from "../../components/section-with-description";
import { defaultPadding } from "../../components/ui-defaults";
import { GraphQLProvider } from "../../modules/graphql/graphql-provider";
import { RecipientSelector } from "../../modules/newsletter/ui/recipient-selector";
import { trpcClient } from "../../modules/trpc/trpc-client";
import { createCampaignInputSchema } from "../../modules/newsletter/campaigns/campaign-schema";

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

const CreateCampaignPage: NextPage = () => {
  const { appBridgeState } = useAppBridge();
  const router = useRouter();
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

  const { handleSubmit, control, watch } = useForm({
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
    resolver: zodResolver(createCampaignInputSchema),
  });

  const selectedTemplateId = watch("templateId");
  const selectedChannelSlug = watch("channelSlug");

  const createMutation = trpcClient.campaign.create.useMutation({
    onSuccess: async () => {
      // Invalidate all campaign queries
      await utils.campaign.list.invalidate();
      await utils.campaign.get.invalidate();
      // Force refetch to ensure UI updates
      await utils.campaign.list.refetch();
      // Redirect to campaigns list
      router.push("/campaigns");
    },
  });

  // Return null while App Bridge is initializing - this prevents race conditions
  if (!appBridgeState) {
    return null;
  }

  // Show loading while App Bridge is connecting
  if (!appBridgeState.ready) {
    return (
      <BasicLayout breadcrumbs={[{ name: "Campaigns", href: "/campaigns" }, { name: "New" }]}>
        <Text>Loading...</Text>
      </BasicLayout>
    );
  }

  if (appBridgeState.user?.permissions.includes("MANAGE_APPS") === false) {
    return (
      <BasicLayout breadcrumbs={[{ name: "Campaigns", href: "/campaigns" }, { name: "New" }]}>
        <Text>You do not have permission to access this page.</Text>
      </BasicLayout>
    );
  }

  const channels = channelsData?.channels || [];
  const templates = templatesData?.templates || [];

  return (
    <BasicLayout breadcrumbs={[{ name: "Campaigns", href: "/campaigns" }, { name: "New" }]}>
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
            createMutation.mutate(submitData);
          },
          (errors) => {
            console.error("Form validation errors:", errors);
            console.error("Form validation errors:", errors);
          }
        )}
      >
        <Box display="flex" flexDirection="column" gap={defaultPadding}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Text size={10} fontWeight="bold">
              Create Campaign
            </Text>
            <Box display="flex" gap={2}>
              <Button variant="secondary" onClick={() => router.push("/campaigns")}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isLoading}>
                {createMutation.isLoading ? "Creating..." : "Create Campaign"}
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
              />
              <Input
                control={control}
                name="rateLimitPerMinute"
                label="Rate Limit (per minute)"
                type="number"
              />
              <Input
                control={control}
                name="maxRetries"
                label="Max Retries"
                type="number"
              />
            </Box>
          </Box>

          {createMutation.error && (
            <Box padding={3} backgroundColor="critical1" borderRadius={2}>
              <Text color="critical2">
                Error: {createMutation.error.message || "Failed to create campaign"}
              </Text>
            </Box>
          )}
        </Box>
      </form>
    </BasicLayout>
  );
};

// Wrap with GraphQL provider for channel query
const CreateCampaignPageWithProvider: NextPage = () => (
  <GraphQLProvider>
    <CreateCampaignPage />
  </GraphQLProvider>
);

export default CreateCampaignPageWithProvider;
