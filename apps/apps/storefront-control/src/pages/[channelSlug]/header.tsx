import React from "react";
import { useAppBridge } from "@saleor/app-sdk/app-bridge";
import { NextPage } from "next";
import { useRouter } from "next/router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";

import { AppLayout } from "@/modules/ui/app-layout";
import { SectionCard } from "@/modules/ui/section-card";
import { FormField, SelectField } from "@/modules/ui/form-field";
import { StickySaveBar } from "@/modules/ui/sticky-save-bar";
import { SimpleCheckbox } from "@/modules/ui/simple-checkbox";
import { trpcClient } from "@/modules/trpc/trpc-client";
import { HeaderSchema } from "@/modules/config/schema";
import type { StorefrontConfig } from "@/modules/config/schema";

type HeaderFormData = StorefrontConfig["header"];

const HeaderPage: NextPage = () => {
  const router = useRouter();
  const { channelSlug } = router.query as { channelSlug: string };
  const { appBridgeState } = useAppBridge();
  const [saveStatus, setSaveStatus] = useState<"success" | "error" | null>(null);

  const { data: config, isLoading, refetch } = trpcClient.config.getConfig.useQuery(
    { channelSlug },
    { enabled: !!channelSlug && !!appBridgeState?.ready }
  );

  const updateMutation = trpcClient.config.updateSection.useMutation({
    onSuccess: () => {
      setSaveStatus("success");
      refetch();
      setTimeout(() => setSaveStatus(null), 3000);
    },
    onError: () => {
      setSaveStatus("error");
      setTimeout(() => setSaveStatus(null), 5000);
    },
  });

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isDirty },
  } = useForm<HeaderFormData>({
    resolver: zodResolver(HeaderSchema),
  });

  const bannerEnabled = watch("banner.enabled");
  const bannerBgColor = watch("banner.backgroundColor");
  const bannerTextColor = watch("banner.textColor");
  const bannerText = watch("banner.text");

  useEffect(() => {
    if (config?.header) {
      reset(config.header);
    }
  }, [config, reset]);

  const onSubmit = async (data: HeaderFormData) => {
    setSaveStatus(null);
    await updateMutation.mutateAsync({
      channelSlug,
      section: "header",
      data,
    });
  };

  if (!appBridgeState?.ready || isLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <span>Loading...</span>
      </div>
    );
  }

  // Get primary color for default banner background
  const primaryColor = config?.branding.colors.primary || "#2563EB";

  return (
    <AppLayout channelSlug={channelSlug} channelName={config?.store.name} activeTab="header">
      <form onSubmit={handleSubmit(onSubmit)}>
        <SectionCard 
          id="header-banner"
          title="Promotional Banner" 
          description="Configure the banner that appears above your header"
          keywords={["header", "banner", "announcement"]}
          icon="📢"
        >

          {/* Banner Preview */}
          {bannerEnabled && (
            <div 
              style={{ 
                marginBottom: "24px",
                padding: "12px",
                textAlign: "center",
                backgroundColor: bannerBgColor || primaryColor,
                color: bannerTextColor || "#FFFFFF",
              }}
            >
              <span style={{ fontSize: "13px", color: "inherit" }}>
                {bannerText || "Your banner text will appear here"}
              </span>
            </div>
          )}

          <SimpleCheckbox
            name="banner.enabled"
            control={control}
            label="Enable Promotional Banner"
            description="Show a promotional message above the header"
          />

          <FormField
            label="Banner Text"
            name="banner.text"
            register={register}
            errors={errors}
            placeholder="Free shipping on orders over $50 • Fast delivery worldwide"
            description="The message to display in the banner"
          />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginTop: "24px" }}>
            <div>
              <FormField
                label="Background Color"
                name="banner.backgroundColor"
                register={register}
                errors={errors}
                type="color"
                description="Leave empty to use primary brand color"
              />
              <p style={{ fontSize: "12px", color: "#666", marginTop: "8px", margin: "8px 0 0 0" }}>
                Default: {primaryColor}
              </p>
            </div>
            <div>
              <FormField
                label="Text Color"
                name="banner.textColor"
                register={register}
                errors={errors}
                type="color"
                description="Leave empty for white text"
              />
              <p style={{ fontSize: "12px", color: "#666", marginTop: "8px", margin: "8px 0 0 0" }}>
                Default: #FFFFFF
              </p>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          id="header-layout"
          title="Header Layout"
          description="Configure how your header appears"
          keywords={["logo", "header", "store name"]}
          icon="📐"
        >

          <SimpleCheckbox
            name="showStoreName"
            control={control}
            label="Show Store Name"
            description="Display the store name next to the logo on mobile"
          />

          <SelectField
            label="Logo Position"
            name="logoPosition"
            register={register}
            options={[
              { value: "left", label: "Left" },
              { value: "center", label: "Center" },
            ]}
            description="Where to position the logo in the header"
          />
        </SectionCard>

        <StickySaveBar
          isDirty={isDirty}
          isLoading={updateMutation.isLoading}
          isSuccess={saveStatus === "success"}
          isError={saveStatus === "error"}
          onReset={() => reset(config?.header)}
          onSubmit={handleSubmit(onSubmit)}
        />
      </form>
    </AppLayout>
  );
};

export default HeaderPage;
