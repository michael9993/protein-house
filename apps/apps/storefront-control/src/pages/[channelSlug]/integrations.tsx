import { useAppBridge } from "@saleor/app-sdk/app-bridge";
import { Box, Text, Button } from "@saleor/macaw-ui";
import { NextPage } from "next";
import { useRouter } from "next/router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";

import { AppLayout } from "@/modules/ui/app-layout";
import { SectionCard } from "@/modules/ui/section-card";
import { FormField } from "@/modules/ui/form-field";
import { StickySaveBar } from "@/modules/ui/sticky-save-bar";
import { trpcClient } from "@/modules/trpc/trpc-client";
import { IntegrationsSchema } from "@/modules/config/schema";
import type { StorefrontConfig } from "@/modules/config/schema";

type IntegrationsFormData = StorefrontConfig["integrations"];

const IntegrationsPage: NextPage = () => {
  const router = useRouter();
  const { channelSlug } = router.query as { channelSlug: string };
  const { appBridgeState } = useAppBridge();

  const { data: config, isLoading, refetch } = trpcClient.config.getConfig.useQuery(
    { channelSlug },
    { enabled: !!channelSlug && !!appBridgeState?.ready }
  );

  const updateMutation = trpcClient.config.updateSection.useMutation({
    onSuccess: () => refetch(),
  });

  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm<IntegrationsFormData>({
    resolver: zodResolver(IntegrationsSchema),
  });

  useEffect(() => {
    if (config?.integrations) {
      reset(config.integrations);
    }
  }, [config, reset]);

  const onSubmit = async (data: IntegrationsFormData) => {
    await updateMutation.mutateAsync({ channelSlug, section: "integrations", data });
  };

  if (!appBridgeState?.ready || isLoading) {
    return <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}><span>Loading...</span></div>;
  }

  return (
    <AppLayout channelSlug={channelSlug} channelName={config?.store.name} activeTab="integrations">
      <form onSubmit={handleSubmit(onSubmit)}>
        <SectionCard
          id="integrations-analytics"
          title="Analytics"
          description="Tracking and analytics integrations"
          keywords={["analytics", "google", "facebook", "hotjar"]}
          icon="📊"
        >

          <Box display="grid" __gridTemplateColumns="1fr 1fr" gap={4}>
            <FormField
              label="Google Analytics ID"
              name="analytics.googleAnalyticsId"
              register={register}
              errors={errors}
              placeholder="G-XXXXXXXXXX"
              description="Your GA4 measurement ID"
            />
            <FormField
              label="Google Tag Manager ID"
              name="analytics.googleTagManagerId"
              register={register}
              errors={errors}
              placeholder="GTM-XXXXXXX"
            />
            <FormField
              label="Facebook Pixel ID"
              name="analytics.facebookPixelId"
              register={register}
              errors={errors}
              placeholder="XXXXXXXXXXXXXXX"
            />
            <FormField
              label="Hotjar ID"
              name="analytics.hotjarId"
              register={register}
              errors={errors}
              placeholder="XXXXXXX"
            />
          </Box>
        </SectionCard>

        <SectionCard
          id="integrations-marketing"
          title="Marketing"
          description="Email marketing and automation"
          keywords={["mailchimp", "klaviyo"]}
          icon="📧"
        >

          <Box display="grid" __gridTemplateColumns="1fr 1fr" gap={4}>
            <FormField
              label="Mailchimp List ID"
              name="marketing.mailchimpListId"
              register={register}
              errors={errors}
              placeholder="abcdef1234"
            />
            <FormField
              label="Klaviyo API Key"
              name="marketing.klaviyoApiKey"
              register={register}
              errors={errors}
              placeholder="pk_xxxxxxxxxxxxxxxxxxxxxxxx"
            />
          </Box>
        </SectionCard>

        <SectionCard
          id="integrations-support"
          title="Customer Support"
          description="Live chat and support tools"
          keywords={["intercom", "zendesk", "crisp"]}
          icon="💬"
        >

          <Box display="grid" __gridTemplateColumns="1fr 1fr 1fr" gap={4}>
            <FormField
              label="Intercom App ID"
              name="support.intercomAppId"
              register={register}
              errors={errors}
              placeholder="xxxxxxxx"
            />
            <FormField
              label="Zendesk Key"
              name="support.zendeskKey"
              register={register}
              errors={errors}
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
            />
            <FormField
              label="Crisp Website ID"
              name="support.crispWebsiteId"
              register={register}
              errors={errors}
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
            />
          </Box>
        </SectionCard>

        <SectionCard
          id="integrations-social"
          title="Social Media"
          description="Your social media profile URLs"
          keywords={["facebook", "instagram", "tiktok", "pinterest"]}
          icon="🌐"
        >

          <Box display="grid" __gridTemplateColumns="1fr 1fr" gap={4}>
            <FormField
              label="Facebook"
              name="social.facebook"
              register={register}
              errors={errors}
              type="url"
              placeholder="https://facebook.com/yourstore"
            />
            <FormField
              label="Instagram"
              name="social.instagram"
              register={register}
              errors={errors}
              type="url"
              placeholder="https://instagram.com/yourstore"
            />
            <FormField
              label="Twitter / X"
              name="social.twitter"
              register={register}
              errors={errors}
              type="url"
              placeholder="https://twitter.com/yourstore"
            />
            <FormField
              label="YouTube"
              name="social.youtube"
              register={register}
              errors={errors}
              type="url"
              placeholder="https://youtube.com/c/yourstore"
            />
            <FormField
              label="TikTok"
              name="social.tiktok"
              register={register}
              errors={errors}
              type="url"
              placeholder="https://tiktok.com/@yourstore"
            />
            <FormField
              label="Pinterest"
              name="social.pinterest"
              register={register}
              errors={errors}
              type="url"
              placeholder="https://pinterest.com/yourstore"
            />
          </Box>
        </SectionCard>

        <StickySaveBar
          isDirty={isDirty}
          isLoading={updateMutation.isLoading}
          isSuccess={updateMutation.isSuccess}
          isError={updateMutation.isError}
          onReset={() => reset(config?.integrations)}
          onSubmit={handleSubmit(onSubmit)}
        />
      </form>
    </AppLayout>
  );
};

export default IntegrationsPage;
