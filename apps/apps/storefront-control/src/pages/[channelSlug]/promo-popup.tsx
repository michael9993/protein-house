import { useAppBridge } from "@saleor/app-sdk/app-bridge";
import { Box, Text, Button, Checkbox } from "@saleor/macaw-ui";
import { NextPage } from "next";
import { useRouter } from "next/router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";

import { AppLayout } from "@/modules/ui/app-layout";
import { SectionCard } from "@/modules/ui/section-card";
import { FormField } from "@/modules/ui/form-field";
import { StickySaveBar } from "@/modules/ui/sticky-save-bar";
import { trpcClient } from "@/modules/trpc/trpc-client";
import { PromoPopupSchema } from "@/modules/config/schema";
import type { StorefrontConfig } from "@/modules/config/schema";

type PromoPopupFormData = StorefrontConfig["promoPopup"];

const PromoPopupPage: NextPage = () => {
  const router = useRouter();
  const { channelSlug } = router.query as { channelSlug: string };
  const { appBridgeState } = useAppBridge();
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "success" | "error">("idle");

  const { data: config, isLoading } = trpcClient.config.getConfig.useQuery(
    { channelSlug },
    { enabled: !!channelSlug && !!appBridgeState?.ready },
  );

  const utils = trpcClient.useUtils();
  const updateMutation = trpcClient.config.updateSection.useMutation();

  const {
    control,
    register,
    handleSubmit,
    reset,
    watch,
    formState: { isDirty },
  } = useForm<PromoPopupFormData>({
    resolver: zodResolver(PromoPopupSchema),
  });

  const popupEnabled = watch("enabled");
  const autoDetectSales = watch("autoDetectSales");

  useEffect(() => {
    if (config?.promoPopup) {
      reset(config.promoPopup);
    }
  }, [config, reset]);

  const onSubmit = async (data: PromoPopupFormData) => {
    setSaveStatus("saving");
    try {
      await updateMutation.mutateAsync({ channelSlug, section: "promoPopup", data });
      await utils.config.getConfig.invalidate({ channelSlug });
      reset(data);
      setSaveStatus("success");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch {
      setSaveStatus("error");
    }
  };

  if (!appBridgeState?.ready || isLoading) {
    return (
      <div
        style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}
      >
        <span>Loading...</span>
      </div>
    );
  }

  return (
    <AppLayout channelSlug={channelSlug} channelName={config?.store.name} activeTab="promoPopup">
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Main Toggle */}
        <SectionCard
          id="promo-main"
          title="Promotional Popup"
          description="Configure promotional popups to engage visitors with special offers"
          keywords={["popup", "promotion", "cta", "banner"]}
          icon="🎁"
        >
          <Box
            display="flex"
            alignItems="flex-start"
            gap={3}
            marginBottom={4}
            padding={4}
            borderRadius={4}
            backgroundColor="default1"
            borderWidth={1}
            borderStyle="solid"
            borderColor="default2"
            __transition="all 0.2s ease"
          >
            <Controller
              name="enabled"
              control={control}
              render={({ field }) => (
                <Checkbox
                  checked={field.value === true}
                  onCheckedChange={(checked) => field.onChange(checked)}
                />
              )}
            />
            <Box style={{ flex: 1 }}>
              <Text fontWeight="bold" marginBottom={0.5} style={{ fontSize: "14px" }}>
                Enable Promotional Popup
              </Text>
              <Text color="default2" style={{ fontSize: "12px", lineHeight: 1.5 }}>
                Show promotional popups to visitors
              </Text>
            </Box>
          </Box>

          {popupEnabled && (
            <>
              {/* Auto-detect toggle */}
              <Box
                display="flex"
                alignItems="center"
                gap={3}
                padding={4}
                backgroundColor="accent1Pressed"
                borderRadius={4}
                marginBottom={4}
              >
                <Controller
                  name="autoDetectSales"
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      checked={field.value === true}
                      onCheckedChange={(checked) => field.onChange(checked)}
                    />
                  )}
                />
                <Box>
                  <Text>🔮 Auto-detect from Sale Collection</Text>
                  <Text color="default2">
                    Automatically show popup when products are in the "sale" collection. Uses
                    collection data for content.
                  </Text>
                </Box>
              </Box>
            </>
          )}
        </SectionCard>

        {/* Content Configuration */}
        {popupEnabled && !autoDetectSales && (
          <SectionCard
            id="promo-content"
            title="Popup Content"
            description="Customize the text and messaging of your promotional popup"
            keywords={["title", "body", "badge", "cta"]}
          >
            <Box display="grid" __gridTemplateColumns="1fr 1fr" gap={4}>
              <FormField
                label="Title"
                name="title"
                register={register}
                placeholder="Special Offer"
                description="Main headline"
              />
              <FormField
                label="Badge Text"
                name="badge"
                register={register}
                placeholder="Up to 25% Off"
                description="Small badge above title"
              />
            </Box>
            <FormField
              label="Body Text"
              name="body"
              register={register}
              type="textarea"
              placeholder="Don't miss out on our biggest sale of the season!"
              description="Main description text"
            />
            <Box display="grid" __gridTemplateColumns="1fr 1fr" gap={4}>
              <FormField
                label="CTA Button Text"
                name="ctaText"
                register={register}
                placeholder="Shop Sale Items"
              />
              <FormField
                label="CTA Button Link"
                name="ctaLink"
                register={register}
                placeholder="/products?onSale=true"
              />
            </Box>
          </SectionCard>
        )}

        {/* Text Labels - Always shown when popup is enabled */}
        {popupEnabled && (
          <SectionCard
            id="promo-text-labels"
            title="Text Labels"
            description="Customize button and label text"
            keywords={["text", "labels", "buttons"]}
            icon="📝"
          >
            {autoDetectSales && (
              <FormField
                label="Items on Sale Text"
                name="itemsOnSaleText"
                register={register}
                placeholder="{count} {count, plural, =1 {item} other {items}} on sale"
                description="Text shown when auto-detect finds sale items. Use {count} for number and {count, plural, =1 {singular} other {plural}} for pluralization"
              />
            )}
            <FormField
              label="Maybe Later Text"
              name="maybeLaterText"
              register={register}
              placeholder="Maybe later"
              description="Text for the dismiss button"
            />
          </SectionCard>
        )}

        {/* Media Configuration */}
        {popupEnabled && !autoDetectSales && (
          <SectionCard
            id="promo-media"
            title="Popup Media"
            description="Add images to make your popup more engaging"
            keywords={["image", "background"]}
          >
            <FormField
              label="Background Image URL"
              name="backgroundImageUrl"
              register={register}
              type="url"
              placeholder="https://example.com/promo-bg.jpg"
              description="Background image for the popup header (recommended: 800x400px)"
            />
            <FormField
              label="Featured Image URL"
              name="imageUrl"
              register={register}
              type="url"
              placeholder="https://example.com/promo-image.jpg"
              description="Optional product or promotional image"
            />
          </SectionCard>
        )}

        {/* Behavior Settings */}
        {popupEnabled && (
          <SectionCard
            id="promo-behavior"
            title="Popup Behavior"
            description="Control when and how the popup appears"
            keywords={["delay", "session", "exclude", "auto"]}
            icon="⚙️"
          >
            <Box display="grid" __gridTemplateColumns="1fr 1fr 1fr" gap={4}>
              <FormField
                label="Delay (seconds)"
                name="delaySeconds"
                register={register}
                type="number"
                placeholder="2"
                description="Wait before showing"
              />
              <FormField
                label="Show Again After (hours)"
                name="ttlHours"
                register={register}
                type="number"
                placeholder="24"
                description="Time until popup shows again"
              />
            </Box>

            <Box marginTop={4}>
              <Text marginBottom={3}>Display Options</Text>
              <Box display="flex" flexDirection="column" gap={3}>
                <Box
                  display="flex"
                  alignItems="flex-start"
                  gap={3}
                  padding={3}
                  borderRadius={4}
                  backgroundColor="default1"
                  borderWidth={1}
                  borderStyle="solid"
                  borderColor="default2"
                >
                  <Controller
                    name="showOncePerSession"
                    control={control}
                    render={({ field }) => (
                      <Checkbox
                        checked={field.value === true}
                        onCheckedChange={(checked) => field.onChange(checked)}
                      />
                    )}
                  />
                  <Box style={{ flex: 1 }}>
                    <Text fontWeight="medium" marginBottom={0.5} style={{ fontSize: "14px" }}>
                      Show once per session
                    </Text>
                    <Text color="default2" style={{ fontSize: "12px" }}>
                      Only show popup once per browser session
                    </Text>
                  </Box>
                </Box>
              </Box>
            </Box>

            <Box marginTop={4}>
              <Text marginBottom={3}>Page Exclusions</Text>
              <Text color="default2" marginBottom={3}>
                Don't show popup on these pages
              </Text>
              <Box display="flex" gap={3}>
                <Box
                  display="flex"
                  alignItems="flex-start"
                  gap={2}
                  padding={3}
                  borderRadius={4}
                  backgroundColor="default1"
                  borderWidth={1}
                  borderStyle="solid"
                  borderColor="default2"
                  style={{ flex: 1 }}
                >
                  <Controller
                    name="excludeCheckout"
                    control={control}
                    render={({ field }) => (
                      <Checkbox
                        checked={field.value === true}
                        onCheckedChange={(checked) => field.onChange(checked)}
                      />
                    )}
                  />
                  <Text fontWeight="medium" style={{ fontSize: "13px" }}>
                    Checkout pages
                  </Text>
                </Box>
                <Box
                  display="flex"
                  alignItems="flex-start"
                  gap={2}
                  padding={3}
                  borderRadius={4}
                  backgroundColor="default1"
                  borderWidth={1}
                  borderStyle="solid"
                  borderColor="default2"
                  style={{ flex: 1 }}
                >
                  <Controller
                    name="excludeCart"
                    control={control}
                    render={({ field }) => (
                      <Checkbox
                        checked={field.value === true}
                        onCheckedChange={(checked) => field.onChange(checked)}
                      />
                    )}
                  />
                  <Text fontWeight="medium" style={{ fontSize: "13px" }}>
                    Cart page
                  </Text>
                </Box>
              </Box>
            </Box>
          </SectionCard>
        )}

        {/* Preview Card */}
        {popupEnabled && !autoDetectSales && (
          <SectionCard
            id="promo-preview"
            title="Preview"
            description="Visual preview of your popup configuration"
            icon="👁️"
          >
            <Box padding={6} borderRadius={4} backgroundColor="default1" __textAlign="center">
              <Box
                padding={4}
                borderRadius={4}
                backgroundColor="default2"
                boxShadow="defaultFocused"
                __maxWidth="350px"
                __margin="0 auto"
              >
                <Text color="accent1" marginBottom={1} display="block">
                  {watch("badge") || "Up to 25% Off"}
                </Text>
                <Text as="h3" marginBottom={2}>
                  {watch("title") || "Special Offer"}
                </Text>
                <Text color="default2" marginBottom={4}>
                  {(watch("body") || "Don't miss out on our biggest sale!").substring(0, 100)}...
                </Text>
                <Box
                  as="span"
                  padding={2}
                  paddingX={4}
                  backgroundColor="accent1"
                  borderRadius={2}
                  color="buttonDefaultPrimary"
                >
                  {watch("ctaText") || "Shop Now"}
                </Box>
              </Box>
            </Box>
          </SectionCard>
        )}

        <StickySaveBar
          isDirty={isDirty}
          isLoading={saveStatus === "saving"}
          isSuccess={saveStatus === "success"}
          isError={saveStatus === "error"}
          onReset={() => reset(config?.promoPopup)}
          onSubmit={handleSubmit(onSubmit)}
        />
      </form>
    </AppLayout>
  );
};

export async function getServerSideProps() {
  return { props: {} };
}

export default PromoPopupPage;
