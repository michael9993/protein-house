import { useAppBridge } from "@saleor/app-sdk/app-bridge";
import { Box, Text, Button } from "@saleor/macaw-ui";
import { NextPage } from "next";
import { useRouter } from "next/router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { z } from "zod";

import { AppLayout } from "@/modules/ui/app-layout";
import { SectionCard } from "@/modules/ui/section-card";
import { FormField, SelectField, CheckboxField } from "@/modules/ui/form-field";
import { trpcClient } from "@/modules/trpc/trpc-client";
import { StoreSchema, LocalizationSchema, DarkModeSchema } from "@/modules/config/schema";
import type { StorefrontConfig } from "@/modules/config/schema";

// Combined form schema for store + localization + darkMode
const CombinedFormSchema = z.object({
  store: StoreSchema,
  localization: LocalizationSchema,
  darkMode: DarkModeSchema,
});

type CombinedFormData = z.infer<typeof CombinedFormSchema>;

const StoreInfoPage: NextPage = () => {
  const router = useRouter();
  const { channelSlug } = router.query as { channelSlug: string };
  const { appBridgeState } = useAppBridge();

  const { data: config, isLoading, refetch } = trpcClient.config.getConfig.useQuery(
    { channelSlug },
    { enabled: !!channelSlug && !!appBridgeState?.ready }
  );

  const updateStoreMutation = trpcClient.config.updateSection.useMutation({
    onSuccess: () => refetch(),
  });
  
  const updateLocalizationMutation = trpcClient.config.updateSection.useMutation({
    onSuccess: () => refetch(),
  });

  const updateDarkModeMutation = trpcClient.config.updateSection.useMutation({
    onSuccess: () => refetch(),
  });

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isDirty },
  } = useForm<CombinedFormData>({
    resolver: zodResolver(CombinedFormSchema),
  });

  const darkModeEnabled = watch("darkMode.enabled");

  useEffect(() => {
    if (config) {
      reset({
        store: config.store,
        localization: config.localization,
        darkMode: config.darkMode,
      });
    }
  }, [config, reset]);

  const onSubmit = async (data: CombinedFormData) => {
    // Update all three sections
    await Promise.all([
      updateStoreMutation.mutateAsync({
        channelSlug,
        section: "store",
        data: data.store,
      }),
      updateLocalizationMutation.mutateAsync({
        channelSlug,
        section: "localization",
        data: data.localization,
      }),
      updateDarkModeMutation.mutateAsync({
        channelSlug,
        section: "darkMode",
        data: data.darkMode,
      }),
    ]);
  };

  const isSubmitting = updateStoreMutation.isLoading || updateLocalizationMutation.isLoading || updateDarkModeMutation.isLoading;
  const isSuccess = updateStoreMutation.isSuccess && updateLocalizationMutation.isSuccess && updateDarkModeMutation.isSuccess;
  const hasError = updateStoreMutation.isError || updateLocalizationMutation.isError || updateDarkModeMutation.isError;

  if (!appBridgeState?.ready || isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <Text>Loading...</Text>
      </Box>
    );
  }

  return (
    <AppLayout channelSlug={channelSlug} channelName={config?.store.name} activeTab="store">
      <form onSubmit={handleSubmit(onSubmit)}>
        <SectionCard title="Basic Information" description="Your store's identity and contact details">
          <Box display="grid" __gridTemplateColumns="1fr 1fr" gap={4}>
            <FormField
              label="Store Name"
              name="store.name"
              register={register}
              errors={errors}
              placeholder="My Awesome Store"
              required
            />
            <FormField
              label="Tagline"
              name="store.tagline"
              register={register}
              errors={errors}
              placeholder="Quality products, great prices"
            />
          </Box>
          
          <SelectField
            label="Store Type"
            name="store.type"
            register={register}
            options={[
              { value: "physical", label: "Physical Products" },
              { value: "digital", label: "Digital Products" },
              { value: "food", label: "Food & Grocery" },
              { value: "services", label: "Services" },
              { value: "mixed", label: "Mixed" },
            ]}
            description="This affects default settings and UX patterns"
          />
          
          <FormField
            label="Description"
            name="store.description"
            register={register}
            errors={errors}
            type="textarea"
            placeholder="Welcome to our store..."
          />
        </SectionCard>

        <SectionCard title="Contact Information">
          <Box display="grid" __gridTemplateColumns="1fr 1fr" gap={4}>
            <FormField
              label="Email"
              name="store.email"
              register={register}
              errors={errors}
              type="email"
              placeholder="support@store.com"
              required
            />
            <FormField
              label="Phone"
              name="store.phone"
              register={register}
              errors={errors}
              placeholder="+1 (555) 123-4567"
            />
          </Box>
        </SectionCard>

        <SectionCard title="Address" description="Your physical store or business address">
          <FormField
            label="Street Address"
            name="store.address.street"
            register={register}
            errors={errors}
            placeholder="123 Main Street"
          />
          <Box display="grid" __gridTemplateColumns="1fr 1fr" gap={4}>
            <FormField
              label="City"
              name="store.address.city"
              register={register}
              errors={errors}
              placeholder="New York"
            />
            <FormField
              label="State/Province"
              name="store.address.state"
              register={register}
              errors={errors}
              placeholder="NY"
            />
          </Box>
          <Box display="grid" __gridTemplateColumns="1fr 1fr" gap={4}>
            <FormField
              label="ZIP/Postal Code"
              name="store.address.zip"
              register={register}
              errors={errors}
              placeholder="10001"
            />
            <FormField
              label="Country"
              name="store.address.country"
              register={register}
              errors={errors}
              placeholder="United States"
            />
          </Box>
        </SectionCard>

        <SectionCard title="Localization" description="Language, direction, and regional settings">
          <Box display="grid" __gridTemplateColumns="1fr 1fr" gap={4}>
            <FormField
              label="Default Locale"
              name="localization.defaultLocale"
              register={register}
              errors={errors}
              placeholder="en-US"
              description="e.g., en-US, he-IL, ar"
            />
            <SelectField
              label="Text Direction"
              name="localization.direction"
              register={register}
              options={[
                { value: "auto", label: "Auto (detect from locale)" },
                { value: "ltr", label: "Left-to-Right" },
                { value: "rtl", label: "Right-to-Left" },
              ]}
              description="Auto detects Hebrew, Arabic, Persian, Urdu, Yiddish, Pashto"
            />
          </Box>
          <Box display="grid" __gridTemplateColumns="1fr 1fr" gap={4}>
            <FormField
              label="Date Format"
              name="localization.dateFormat"
              register={register}
              errors={errors}
              placeholder="MM/DD/YYYY"
            />
            <SelectField
              label="Time Format"
              name="localization.timeFormat"
              register={register}
              options={[
                { value: "12h", label: "12-hour (AM/PM)" },
                { value: "24h", label: "24-hour" },
              ]}
            />
          </Box>
        </SectionCard>

        <SectionCard title="Dark Mode" description="Configure dark mode appearance">
          <Box display="flex" flexDirection="column" gap={4}>
            <Box display="flex" gap={4}>
              <CheckboxField
                label="Enable Dark Mode"
                name="darkMode.enabled"
                register={register}
                description="Allow users to use dark mode"
              />
              <CheckboxField
                label="Auto (System Preference)"
                name="darkMode.auto"
                register={register}
                description="Follow user's system preference"
              />
            </Box>
            
            {darkModeEnabled && (
              <Box>
                <Text variant="bodyStrong" marginBottom={2}>Dark Mode Colors</Text>
                <Box display="grid" __gridTemplateColumns="1fr 1fr 1fr 1fr" gap={4}>
                  <FormField label="Background" name="darkMode.colors.background" register={register} errors={errors} type="color" />
                  <FormField label="Surface" name="darkMode.colors.surface" register={register} errors={errors} type="color" />
                  <FormField label="Text" name="darkMode.colors.text" register={register} errors={errors} type="color" />
                  <FormField label="Text Muted" name="darkMode.colors.textMuted" register={register} errors={errors} type="color" />
                </Box>
              </Box>
            )}
          </Box>
        </SectionCard>

        <Box display="flex" justifyContent="flex-end" gap={2} marginTop={4}>
          <Button
            type="button"
            variant="secondary"
            onClick={() => config && reset({ store: config.store, localization: config.localization, darkMode: config.darkMode })}
            disabled={!isDirty}
          >
            Reset
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={!isDirty || isSubmitting}
          >
            {isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
        </Box>

        {isSuccess && (
          <Text color="success1" marginTop={2}>
            ✓ Changes saved successfully
          </Text>
        )}
        {hasError && (
          <Text color="critical1" marginTop={2}>
            Error saving changes. Please try again.
          </Text>
        )}
      </form>
    </AppLayout>
  );
};

export default StoreInfoPage;
