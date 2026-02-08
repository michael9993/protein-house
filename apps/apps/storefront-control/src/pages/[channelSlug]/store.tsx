import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Controller } from "react-hook-form";
import { z } from "zod";
import { Globe, Search, Store } from "lucide-react";

import { AppShell } from "@/components/layout/AppShell";
import { SaveBar } from "@/components/layout/SaveBar";
import { FormField } from "@/components/forms/FormField";
import { FormSelect } from "@/components/forms/FormSelect";
import { FormTextarea } from "@/components/forms/FormTextarea";
import { FormSection } from "@/components/forms/FormSection";
import { LoadingState } from "@/components/shared/LoadingState";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useConfigPage } from "@/hooks/useConfigPage";
import { StoreSchema, LocalizationSchema, SeoSchema } from "@/modules/config/schema";

const STORE_TABS = ["identity", "localization", "seo"] as const;
type StoreTab = (typeof STORE_TABS)[number];

const StoreFormSchema = z.object({
  store: StoreSchema,
  localization: LocalizationSchema,
  seo: SeoSchema,
});

function StorePage() {
  const router = useRouter();
  const initialTab = STORE_TABS.includes(router.query.tab as StoreTab)
    ? (router.query.tab as StoreTab)
    : "identity";

  const [activeTab, setActiveTab] = useState<StoreTab>(initialTab);

  // Sync tab state when URL query param changes externally
  useEffect(() => {
    const { tab } = router.query;

    if (tab && STORE_TABS.includes(tab as StoreTab) && tab !== activeTab) {
      setActiveTab(tab as StoreTab);
    }
  }, [router.query.tab]);

  function handleTabChange(tab: string) {
    const newTab = tab as StoreTab;

    setActiveTab(newTab);
    router.replace(
      { pathname: router.pathname, query: { ...router.query, tab: newTab } },
      undefined,
      { shallow: true },
    );
  }

  const { config, isNotReady, form, onSubmit, saveStatus, channelSlug } = useConfigPage({
    schema: StoreFormSchema,
    sections: ["store", "localization", "seo"],
    extractFormData: (c) => ({
      store: c.store,
      localization: c.localization,
      seo: c.seo,
    }),
  });

  if (isNotReady) {
    return (
      <AppShell
        channelSlug={channelSlug}
        channelName={config?.store.name}
        activePage="store"
        title="Store"
      >
        <LoadingState />
      </AppShell>
    );
  }

  const { register, control, handleSubmit, reset, formState } = form;

  return (
    <AppShell
      channelSlug={channelSlug}
      channelName={config?.store.name}
      activePage="store"
      title="Store"
      description="Store identity, localization, and SEO settings"
    >
      <form onSubmit={handleSubmit(onSubmit)}>
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="mb-6">
            <TabsTrigger value="identity">
              <Store className="mr-2 h-4 w-4" />
              Identity
            </TabsTrigger>
            <TabsTrigger value="localization">
              <Globe className="mr-2 h-4 w-4" />
              Localization
            </TabsTrigger>
            <TabsTrigger value="seo">
              <Search className="mr-2 h-4 w-4" />
              SEO
            </TabsTrigger>
          </TabsList>

          {/* Identity Tab */}
          <TabsContent
            value="identity"
            forceMount
            className={activeTab !== "identity" ? "hidden" : ""}
          >
            <div className="space-y-6 p-6">
              <FormSection title="Basic Information">
                <FormField
                  label="Store Name"
                  name="store.name"
                  register={register}
                  errors={formState.errors}
                  placeholder="My Awesome Store"
                  required
                />
                <FormField
                  label="Tagline"
                  name="store.tagline"
                  register={register}
                  errors={formState.errors}
                  placeholder="Quality products, great prices"
                />
                <FormSelect
                  label="Store Type"
                  name="store.type"
                  control={control}
                  options={[
                    { value: "physical", label: "Physical Products" },
                    { value: "digital", label: "Digital Products" },
                    { value: "food", label: "Food & Grocery" },
                    { value: "services", label: "Services" },
                    { value: "mixed", label: "Mixed" },
                  ]}
                />
                <FormTextarea
                  label="Description"
                  name="store.description"
                  register={register}
                  errors={formState.errors}
                  placeholder="Welcome to our store..."
                />
              </FormSection>

              <FormSection title="Contact Information">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    label="Email"
                    name="store.email"
                    register={register}
                    errors={formState.errors}
                    type="email"
                    placeholder="support@store.com"
                  />
                  <FormField
                    label="Phone"
                    name="store.phone"
                    register={register}
                    errors={formState.errors}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </FormSection>

              <FormSection title="Address">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    label="Street Address"
                    name="store.address.street"
                    register={register}
                    errors={formState.errors}
                    className="col-span-2"
                  />
                  <FormField
                    label="City"
                    name="store.address.city"
                    register={register}
                    errors={formState.errors}
                  />
                  <FormField
                    label="State/Province"
                    name="store.address.state"
                    register={register}
                    errors={formState.errors}
                  />
                  <FormField
                    label="ZIP/Postal Code"
                    name="store.address.zip"
                    register={register}
                    errors={formState.errors}
                  />
                  <FormField
                    label="Country"
                    name="store.address.country"
                    register={register}
                    errors={formState.errors}
                  />
                </div>
              </FormSection>
            </div>
          </TabsContent>

          {/* Localization Tab */}
          <TabsContent
            value="localization"
            forceMount
            className={activeTab !== "localization" ? "hidden" : ""}
          >
            <div className="space-y-6 p-6">
              <FormSection title="Language & Direction">
                <FormField
                  label="Default Locale"
                  name="localization.defaultLocale"
                  register={register}
                  errors={formState.errors}
                  description="e.g., en-US, he-IL, ar"
                />
                <Controller
                  name="localization.supportedLocales"
                  control={control}
                  render={({ field }) => (
                    <div className="space-y-2">
                      <Label>Supported Locales</Label>
                      <Input
                        value={Array.isArray(field.value) ? field.value.join(", ") : ""}
                        onChange={(e) => {
                          const arr = e.target.value
                            .split(",")
                            .map((s) => s.trim())
                            .filter(Boolean);
                          field.onChange(arr);
                        }}
                        placeholder="en-US, he-IL, ar"
                      />
                      <p className="text-xs text-muted-foreground">
                        Comma-separated list of supported locales
                      </p>
                    </div>
                  )}
                />
                <FormSelect
                  label="Direction"
                  name="localization.direction"
                  control={control}
                  options={[
                    { value: "auto", label: "Auto (based on locale)" },
                    { value: "ltr", label: "Left to Right" },
                    { value: "rtl", label: "Right to Left" },
                  ]}
                />
                <Controller
                  name="localization.rtlLocales"
                  control={control}
                  render={({ field }) => (
                    <div className="space-y-2">
                      <Label>RTL Locales</Label>
                      <Input
                        value={Array.isArray(field.value) ? field.value.join(", ") : ""}
                        onChange={(e) => {
                          const arr = e.target.value
                            .split(",")
                            .map((s) => s.trim())
                            .filter(Boolean);
                          field.onChange(arr);
                        }}
                        placeholder="he, ar, fa, ur"
                      />
                      <p className="text-xs text-muted-foreground">
                        Locales that render RTL when direction is set to Auto
                      </p>
                    </div>
                  )}
                />
              </FormSection>

              <FormSection title="Format">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    label="Date Format"
                    name="localization.dateFormat"
                    register={register}
                    errors={formState.errors}
                    placeholder="MM/DD/YYYY"
                  />
                  <FormSelect
                    label="Time Format"
                    name="localization.timeFormat"
                    control={control}
                    options={[
                      { value: "12h", label: "12-hour" },
                      { value: "24h", label: "24-hour" },
                    ]}
                  />
                </div>
              </FormSection>

              <FormSection title="UI Overrides">
                <FormSelect
                  label="Drawer Side Override"
                  name="localization.drawerSideOverride"
                  control={control}
                  options={[
                    { value: "auto", label: "Auto (RTL=Left, LTR=Right)" },
                    { value: "left", label: "Always Left" },
                    { value: "right", label: "Always Right" },
                  ]}
                />
              </FormSection>
            </div>
          </TabsContent>

          {/* SEO Tab */}
          <TabsContent
            value="seo"
            forceMount
            className={activeTab !== "seo" ? "hidden" : ""}
          >
            <div className="space-y-6 p-6">
              <FormSection title="Page Titles">
                <FormField
                  label="Title Template (Coming Soon)"
                  name="seo.titleTemplate"
                  register={register}
                  errors={formState.errors}
                  placeholder="%s | Your Store Name"
                  description="Use %s as placeholder for the page title. Not yet applied by the storefront."
                />
                <FormField
                  label="Default Title"
                  name="seo.defaultTitle"
                  register={register}
                  errors={formState.errors}
                  placeholder="Your Store Name - Online Shopping"
                />
              </FormSection>

              <FormSection title="Meta Description">
                <FormTextarea
                  label="Default Description"
                  name="seo.defaultDescription"
                  register={register}
                  errors={formState.errors}
                  placeholder="Shop the best products..."
                  description="Recommended: 150-160 characters"
                />
              </FormSection>

              <FormSection title="Social Sharing">
                <FormField
                  label="Default OG Image URL"
                  name="seo.defaultImage"
                  register={register}
                  errors={formState.errors}
                  placeholder="/og-image.jpg"
                />
                <FormField
                  label="Twitter Handle"
                  name="seo.twitterHandle"
                  register={register}
                  errors={formState.errors}
                  placeholder="@yourstore"
                />
              </FormSection>
            </div>
          </TabsContent>
        </Tabs>

        <SaveBar
          isDirty={formState.isDirty}
          saveStatus={saveStatus}
          onReset={() => {
            if (config) {
              reset({
                store: config.store,
                localization: config.localization,
                seo: config.seo,
              });
            }
          }}
          onSubmit={handleSubmit(onSubmit)}
        />
      </form>
    </AppShell>
  );
}

export default StorePage;
