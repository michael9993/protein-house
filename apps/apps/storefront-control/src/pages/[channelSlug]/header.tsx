import { useAppBridge } from "@saleor/app-sdk/app-bridge";
import { Box, Text, Button, Checkbox } from "@saleor/macaw-ui";
import { NextPage } from "next";
import { useRouter } from "next/router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";

import { AppLayout } from "@/modules/ui/app-layout";
import { SectionCard } from "@/modules/ui/section-card";
import { FormField, SelectField } from "@/modules/ui/form-field";
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
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <Text>Loading...</Text>
      </Box>
    );
  }

  // Get primary color for default banner background
  const primaryColor = config?.branding.colors.primary || "#2563EB";

  return (
    <AppLayout channelSlug={channelSlug} channelName={config?.store.name} activeTab="header">
      <form onSubmit={handleSubmit(onSubmit)}>
        <SectionCard 
          title="Promotional Banner" 
          description="Configure the banner that appears above your header"
        >
          {/* Banner Preview */}
          {bannerEnabled && (
            <Box 
              marginBottom={4}
              padding={3}
              borderRadius={2}
              __textAlign="center"
              style={{ 
                backgroundColor: bannerBgColor || primaryColor,
                color: bannerTextColor || "#FFFFFF",
              }}
            >
              <Text variant="caption" style={{ color: "inherit" }}>
                {bannerText || "Your banner text will appear here"}
              </Text>
            </Box>
          )}

          <Box 
            display="flex" 
            alignItems="center" 
            gap={3} 
            marginBottom={4}
            paddingBottom={4}
            borderBottomWidth={1}
            borderBottomStyle="solid"
            borderColor="default2"
          >
            <Controller
              name="banner.enabled"
              control={control}
              render={({ field }) => (
                <Checkbox
                  checked={field.value === true}
                  onCheckedChange={(checked) => field.onChange(checked)}
                />
              )}
            />
            <Box>
              <Text variant="bodyStrong">Enable Promotional Banner</Text>
              <Text variant="caption" color="default2">
                Show a promotional message above the header
              </Text>
            </Box>
          </Box>

          <FormField
            label="Banner Text"
            name="banner.text"
            register={register}
            errors={errors}
            placeholder="Free shipping on orders over $50 • Fast delivery worldwide"
            description="The message to display in the banner"
          />

          <Box display="grid" __gridTemplateColumns="1fr 1fr" gap={4} marginTop={4}>
            <Box>
              <FormField
                label="Background Color"
                name="banner.backgroundColor"
                register={register}
                errors={errors}
                type="color"
                description="Leave empty to use primary brand color"
              />
              <Text variant="caption" color="default2" marginTop={1}>
                Default: {primaryColor}
              </Text>
            </Box>
            <Box>
              <FormField
                label="Text Color"
                name="banner.textColor"
                register={register}
                errors={errors}
                type="color"
                description="Leave empty for white text"
              />
              <Text variant="caption" color="default2" marginTop={1}>
                Default: #FFFFFF
              </Text>
            </Box>
          </Box>
        </SectionCard>

        <SectionCard 
          title="Header Layout" 
          description="Configure how your header appears"
        >
          <Box 
            display="flex" 
            alignItems="center" 
            gap={3} 
            marginBottom={4}
          >
            <Controller
              name="showStoreName"
              control={control}
              render={({ field }) => (
                <Checkbox
                  checked={field.value === true}
                  onCheckedChange={(checked) => field.onChange(checked)}
                />
              )}
            />
            <Box>
              <Text variant="bodyStrong">Show Store Name</Text>
              <Text variant="caption" color="default2">
                Display the store name next to the logo on mobile
              </Text>
            </Box>
          </Box>

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

        <Box display="flex" justifyContent="flex-end" gap={2} marginTop={4}>
          <Button 
            type="button" 
            variant="secondary" 
            onClick={() => reset(config?.header)} 
            disabled={!isDirty}
          >
            Reset
          </Button>
          <Button 
            type="submit" 
            variant="primary" 
            disabled={!isDirty || updateMutation.isLoading}
          >
            {updateMutation.isLoading ? "Saving..." : "Save Changes"}
          </Button>
        </Box>

        {saveStatus === "success" && (
          <Text color="success1" marginTop={2}>✓ Changes saved successfully</Text>
        )}
        {saveStatus === "error" && (
          <Text color="critical1" marginTop={2}>Error saving changes. Please try again.</Text>
        )}
      </form>
    </AppLayout>
  );
};

export default HeaderPage;
