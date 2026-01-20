import { useAppBridge } from "@saleor/app-sdk/app-bridge";
import { NextPage } from "next";
import { useRouter } from "next/router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { z } from "zod";

import { AppLayout } from "@/modules/ui/app-layout";
import { SectionCard } from "@/modules/ui/section-card";
import { FormField, SelectField, CheckboxField } from "@/modules/ui/form-field";
import { StickySaveBar } from "@/modules/ui/sticky-save-bar";
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
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <span>Loading...</span>
      </div>
    );
  }

  return (
    <AppLayout channelSlug={channelSlug} channelName={config?.store.name} activeTab="store">
      <form onSubmit={handleSubmit(onSubmit)}>
        <SectionCard
          id="store-basic"
          title="Basic Information"
          description="Your store's identity and contact details"
          keywords={["store", "name", "tagline", "type", "description"]}
          icon="🏪"
        >
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
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
          </div>
          
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

        <SectionCard
          id="store-contact"
          title="Contact Information"
          description="Customer-facing support details"
          keywords={["contact", "email", "phone", "support"]}
          icon="📞"
        >
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
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
          </div>
        </SectionCard>

        <SectionCard
          id="store-address"
          title="Address"
          description="Your physical store or business address"
          keywords={["address", "street", "city", "zip", "country"]}
          icon="📍"
        >
          <FormField
            label="Street Address"
            name="store.address.street"
            register={register}
            errors={errors}
            placeholder="123 Main Street"
          />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
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
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
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
          </div>
        </SectionCard>

        <SectionCard
          id="store-localization"
          title="Localization"
          description="Language, direction, and regional settings"
          keywords={["locale", "direction", "rtl", "time", "date"]}
          icon="🌍"
        >
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <FormField
              label="Default Locale"
              name="localization.defaultLocale"
              register={register}
              errors={errors}
              placeholder="en-US"
              description="e.g., en-US, he-IL, ar"
            />
            <FormField
              label="Supported Locales"
              name="localization.supportedLocales"
              register={register}
              errors={errors}
              placeholder="en-US, fr-FR, es-ES"
              description="Comma-separated list"
            />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
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
                { value: "12h", label: "12-hour" },
                { value: "24h", label: "24-hour" },
              ]}
            />
          </div>
          <SelectField
            label="Direction"
            name="localization.direction"
            register={register}
            options={[
              { value: "auto", label: "Auto (based on locale)" },
              { value: "ltr", label: "Left to Right" },
              { value: "rtl", label: "Right to Left" },
            ]}
          />
          <FormField
            label="RTL Locales"
            name="localization.rtlLocales"
            register={register}
            errors={errors}
            placeholder="he, ar, fa"
            description="Locales that should render right-to-left when direction is auto"
          />
        </SectionCard>

        <SectionCard
          id="store-dark-mode"
          title="Dark Mode"
          description="Configure dark mode appearance"
          keywords={["dark mode", "theme", "colors"]}
          icon="🌙"
        >
          <CheckboxField
            label="Enable Dark Mode"
            name="darkMode.enabled"
            register={register}
            description="Allow users to switch to dark mode"
          />
          {darkModeEnabled && (
            <div style={{ marginTop: "16px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <FormField
                label="Dark Background"
                name="darkMode.colors.background"
                register={register}
                errors={errors}
                type="color"
              />
              <FormField
                label="Dark Surface"
                name="darkMode.colors.surface"
                register={register}
                errors={errors}
                type="color"
              />
              <FormField
                label="Dark Text"
                name="darkMode.colors.text"
                register={register}
                errors={errors}
                type="color"
              />
              <FormField
                label="Dark Muted Text"
                name="darkMode.colors.textMuted"
                register={register}
                errors={errors}
                type="color"
              />
            </div>
          )}
          <CheckboxField
            label="Auto Dark Mode"
            name="darkMode.auto"
            register={register}
            description="Match the user's system preference"
          />
        </SectionCard>

        <StickySaveBar
          isDirty={isDirty}
          isLoading={isSubmitting}
          isSuccess={isSuccess}
          isError={hasError}
          onReset={() => config && reset({ store: config.store, localization: config.localization, darkMode: config.darkMode })}
          onSubmit={handleSubmit(onSubmit)}
        />
      </form>
    </AppLayout>
  );
};

export default StoreInfoPage;
