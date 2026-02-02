import React from "react";
import { useAppBridge } from "@saleor/app-sdk/app-bridge";
import { NextPage } from "next";
import { useRouter } from "next/router";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";

import { AppLayout } from "@/modules/ui/app-layout";
import { SectionCard } from "@/modules/ui/section-card";
import { FormField, SelectField } from "@/modules/ui/form-field";
import { StickySaveBar } from "@/modules/ui/sticky-save-bar";
import { SimpleCheckbox } from "@/modules/ui/simple-checkbox";
import { trpcClient } from "@/modules/trpc/trpc-client";
import { HeaderSchema } from "@/modules/config/schema";
import type { StorefrontConfig, ManualBannerItem } from "@/modules/config/schema";

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
  const useSaleorPromotions = watch("banner.useSaleorPromotions");
  const useSaleorVouchers = watch("banner.useSaleorVouchers");
  const useSaleorDiscounts = useSaleorPromotions || useSaleorVouchers;
  const useGradient = watch("banner.useGradient");
  const gradientFrom = watch("banner.gradientFrom");
  const gradientTo = watch("banner.gradientTo");
  const dismissible = watch("banner.dismissible");

  const { fields: manualItems, append: addManualItem, remove: removeManualItem } = useFieldArray({
    control,
    name: "banner.manualItems",
  });

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
                padding: "8px 12px",
                textAlign: "center",
                background: useGradient && (gradientFrom || gradientTo)
                  ? `linear-gradient(90deg, ${gradientFrom || primaryColor}, ${gradientTo || primaryColor})`
                  : (bannerBgColor || primaryColor),
                color: bannerTextColor || "#FFFFFF",
                fontSize: "12px",
              }}
            >
              {useSaleorDiscounts
                ? `Active ${useSaleorPromotions && useSaleorVouchers ? "promotions and vouchers" : useSaleorPromotions ? "promotions" : "vouchers"} (and manual items) will appear here on the storefront.`
                : manualItems.length > 0
                  ? `Manual items (${manualItems.length}) will rotate in the banner.`
                  : (bannerText || "Your banner text will appear here")}
            </div>
          )}

          <SimpleCheckbox
            name="banner.enabled"
            control={control}
            label="Show promotional banner"
            description="Display the promotional banner above the header (toggle off to hide)"
          />

          <SimpleCheckbox
            name="banner.dismissible"
            control={control}
            label="Allow visitors to dismiss"
            description="Show a close button; dismissed state is remembered per browser (localStorage)"
          />

          <SimpleCheckbox
            name="banner.useSaleorPromotions"
            control={control}
            label="Include Saleor promotions"
            description="Add active promotions from Dashboard → Discounts → Promotions to the banner (description used as main text)"
          />
          <SimpleCheckbox
            name="banner.useSaleorVouchers"
            control={control}
            label="Include Saleor vouchers"
            description="Add active vouchers from Dashboard → Discounts → Vouchers to the banner (code and discount shown)"
          />

          <FormField
            label="Fallback banner text"
            name="banner.text"
            register={register}
            errors={errors}
            placeholder="Free shipping on orders over $50 • Fast delivery worldwide"
            description="Shown when there are no manual items and no Saleor promotions/vouchers. You can also add manual items below."
          />

          <FormField
            label="Auto-scroll interval (seconds)"
            name="banner.autoScrollIntervalSeconds"
            register={register}
            errors={errors}
            type="number"
            description="Seconds between rotating banner slides (4–30)"
          />

          <SimpleCheckbox
            name="banner.useGradient"
            control={control}
            label="Use gradient background"
            description="Use two colors for a gradient instead of solid"
          />
          {useGradient && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginTop: "12px" }}>
              <FormField
                label="Gradient from"
                name="banner.gradientFrom"
                register={register}
                errors={errors}
                type="color"
                description="Start color"
              />
              <FormField
                label="Gradient to"
                name="banner.gradientTo"
                register={register}
                errors={errors}
                type="color"
                description="End color"
              />
            </div>
          )}

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

          <div style={{ marginTop: "24px" }}>
            <h3 style={{ fontSize: "14px", fontWeight: "600", marginBottom: "8px" }}>Manual banner items</h3>
            <p style={{ fontSize: "13px", color: "#555", marginBottom: "12px" }}>
              Add custom lines (text, optional link, emoji/icon). These appear in addition to Saleor promotions when enabled, or alone when disabled.
            </p>
            {manualItems.map((item, index) => (
              <div
                key={item.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr auto",
                  gap: "12px",
                  alignItems: "end",
                  marginBottom: "12px",
                  padding: "12px",
                  border: "1px solid #eee",
                  borderRadius: "8px",
                }}
              >
                <FormField
                  label="Text"
                  name={`banner.manualItems.${index}.text`}
                  register={register}
                  errors={errors}
                  placeholder="e.g. Free shipping on orders over $50"
                />
                <FormField
                  label="Link (optional)"
                  name={`banner.manualItems.${index}.link`}
                  register={register}
                  errors={errors}
                  placeholder="/sale or https://..."
                />
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Controller
                    name={`banner.manualItems.${index}.icon`}
                    control={control}
                    render={({ field }) => (
                      <input
                        {...field}
                        type="text"
                        placeholder="🎉 or icon"
                        style={{
                          width: "80px",
                          padding: "8px",
                          border: "1px solid #ddd",
                          borderRadius: "4px",
                          fontSize: "14px",
                        }}
                      />
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => removeManualItem(index)}
                    style={{
                      padding: "8px 12px",
                      background: "#f5f5f5",
                      border: "1px solid #ddd",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "13px",
                    }}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={() =>
                addManualItem({
                  id: `manual-${Date.now()}`,
                  text: "",
                  link: null,
                  icon: null,
                } as ManualBannerItem)
              }
              style={{
                padding: "8px 16px",
                background: "#2563EB",
                color: "#fff",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "14px",
              }}
            >
              Add manual item
            </button>
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

export async function getServerSideProps() {
  return { props: {} };
}

export default HeaderPage;
