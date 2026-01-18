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
    { enabled: !!channelSlug && !!appBridgeState?.ready }
  );

  const utils = trpcClient.useUtils();
  const updateMutation = trpcClient.config.updateSection.useMutation();

  const { control, register, handleSubmit, reset, watch, formState: { isDirty } } = useForm<PromoPopupFormData>({
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
    return <Box display="flex" justifyContent="center" alignItems="center" height="100vh"><Text>Loading...</Text></Box>;
  }

  return (
    <AppLayout channelSlug={channelSlug} channelName={config?.store.name} activeTab="promoPopup">
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Main Toggle */}
        <SectionCard title="🎯 Promotional Popup" description="Configure promotional popups to engage visitors with special offers">
          <Box display="flex" alignItems="center" gap={3} marginBottom={4} paddingBottom={4} borderBottomWidth={1} borderBottomStyle="solid" borderColor="default2">
            <Controller
              name="enabled"
              control={control}
              render={({ field }) => (
                <Checkbox checked={field.value === true} onCheckedChange={(checked) => field.onChange(checked)} />
              )}
            />
            <Box>
              <Text variant="bodyStrong">Enable Promotional Popup</Text>
              <Text variant="caption" color="default2">Show promotional popups to visitors</Text>
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
                    <Checkbox checked={field.value === true} onCheckedChange={(checked) => field.onChange(checked)} />
                  )}
                />
                <Box>
                  <Text variant="bodyStrong">🔮 Auto-detect from Sale Collection</Text>
                  <Text variant="caption" color="default2">
                    Automatically show popup when products are in the "sale" collection. Uses collection data for content.
                  </Text>
                </Box>
              </Box>
            </>
          )}
        </SectionCard>

        {/* Content Configuration */}
        {popupEnabled && !autoDetectSales && (
          <SectionCard title="📝 Popup Content" description="Customize the text and messaging of your promotional popup">
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

        {/* Media Configuration */}
        {popupEnabled && !autoDetectSales && (
          <SectionCard title="🖼️ Popup Media" description="Add images to make your popup more engaging">
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
          <SectionCard title="⚙️ Popup Behavior" description="Control when and how the popup appears">
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
              <Text variant="bodyStrong" marginBottom={3}>Display Options</Text>
              <Box display="flex" flexDirection="column" gap={3}>
                <Box display="flex" alignItems="center" gap={3}>
                  <Controller
                    name="showOncePerSession"
                    control={control}
                    render={({ field }) => (
                      <Checkbox checked={field.value === true} onCheckedChange={(checked) => field.onChange(checked)} />
                    )}
                  />
                  <Box>
                    <Text variant="body">Show once per session</Text>
                    <Text variant="caption" color="default2">Only show popup once per browser session</Text>
                  </Box>
                </Box>
              </Box>
            </Box>

            <Box marginTop={4}>
              <Text variant="bodyStrong" marginBottom={3}>Page Exclusions</Text>
              <Text variant="caption" color="default2" marginBottom={3}>
                Don't show popup on these pages
              </Text>
              <Box display="flex" gap={4}>
                <Box display="flex" alignItems="center" gap={2}>
                  <Controller
                    name="excludeCheckout"
                    control={control}
                    render={({ field }) => (
                      <Checkbox checked={field.value === true} onCheckedChange={(checked) => field.onChange(checked)} />
                    )}
                  />
                  <Text>Checkout pages</Text>
                </Box>
                <Box display="flex" alignItems="center" gap={2}>
                  <Controller
                    name="excludeCart"
                    control={control}
                    render={({ field }) => (
                      <Checkbox checked={field.value === true} onCheckedChange={(checked) => field.onChange(checked)} />
                    )}
                  />
                  <Text>Cart page</Text>
                </Box>
              </Box>
            </Box>
          </SectionCard>
        )}

        {/* Preview Card */}
        {popupEnabled && !autoDetectSales && (
          <SectionCard title="👁️ Preview" description="Visual preview of your popup configuration">
            <Box 
              padding={6}
              borderRadius={4}
              backgroundColor="default1"
              __textAlign="center"
            >
              <Box
                padding={4}
                borderRadius={4}
                backgroundColor="surfaceNeutralHighlight"
                boxShadow="defaultFocused"
                __maxWidth="350px"
                __margin="0 auto"
              >
                <Text variant="caption" color="accent1" marginBottom={1} display="block">
                  {watch("badge") || "Up to 25% Off"}
                </Text>
                <Text as="h3" variant="heading" marginBottom={2}>
                  {watch("title") || "Special Offer"}
                </Text>
                <Text variant="body" color="default2" marginBottom={4}>
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

        {/* Save Button */}
        <Box display="flex" justifyContent="flex-end" gap={2} marginTop={4}>
          <Button type="button" variant="secondary" onClick={() => reset(config?.promoPopup)} disabled={!isDirty}>
            Reset
          </Button>
          <Button type="submit" variant="primary" disabled={!isDirty || saveStatus === "saving"}>
            {saveStatus === "saving" ? "Saving..." : "Save Changes"}
          </Button>
        </Box>

        {saveStatus === "success" && <Text color="success1" marginTop={2}>✓ Changes saved successfully</Text>}
        {saveStatus === "error" && <Text color="critical1" marginTop={2}>Error saving changes. Please try again.</Text>}
      </form>
    </AppLayout>
  );
};

export default PromoPopupPage;
