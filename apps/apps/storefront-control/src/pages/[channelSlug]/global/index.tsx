import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import {
  Globe,
  Palette,
  Plug,
  Search,
  Store,
  Type,
  Zap,
} from "lucide-react";

import { AppShell } from "@/components/layout/AppShell";
import { SaveBar } from "@/components/layout/SaveBar";
import { LoadingState } from "@/components/shared/LoadingState";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useConfigPage } from "@/hooks/useConfigPage";

import { GlobalFormSchema } from "@/components/pages/global/types";
import { StoreIdentityTab } from "@/components/pages/global/StoreIdentityTab";
import { BrandingDesignTab } from "@/components/pages/global/BrandingDesignTab";
import { LocalizationSeoTab } from "@/components/pages/global/LocalizationSeoTab";
import { IntegrationsToolsTab } from "@/components/pages/global/IntegrationsToolsTab";
import { GlobalFeaturesTab } from "@/components/pages/global/GlobalFeaturesTab";
import { GlobalContentTab } from "@/components/pages/global/GlobalContentTab";

// ---------------------------------------------------------------------------
// Tab definitions
// ---------------------------------------------------------------------------

const GLOBAL_TABS = [
  { id: "identity", label: "Store Identity", icon: Store },
  { id: "branding", label: "Branding & Design", icon: Palette },
  { id: "localization", label: "Localization & SEO", icon: Globe },
  { id: "integrations", label: "Integrations", icon: Plug },
  { id: "features", label: "Features", icon: Zap },
  { id: "content", label: "Content", icon: Type },
] as const;

type GlobalTabId = (typeof GLOBAL_TABS)[number]["id"];

function isValidTab(value: string | undefined): value is GlobalTabId {
  return GLOBAL_TABS.some((t) => t.id === value);
}

// ---------------------------------------------------------------------------
// Sections loaded by useConfigPage
// ---------------------------------------------------------------------------

const SECTIONS = [
  "store",
  "localization",
  "seo",
  "branding",
  "ui",
  "darkMode",
  "design",
  "integrations",
  "features",
  "content",
] as const;

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

function GlobalPage() {
  const router = useRouter();
  const tabParam = router.query.tab as string | undefined;
  const initialTab = isValidTab(tabParam) ? tabParam : "identity";
  const [activeTab, setActiveTab] = useState<GlobalTabId>(initialTab);

  useEffect(() => {
    if (isValidTab(tabParam) && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [tabParam]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleTabChange(value: string) {
    const tab = value as GlobalTabId;
    setActiveTab(tab);
    router.replace(
      { pathname: router.pathname, query: { ...router.query, tab } },
      undefined,
      { shallow: true },
    );
  }

  const { config, isNotReady, form, onSubmit, saveStatus } = useConfigPage({
    schema: GlobalFormSchema,
    sections: [...SECTIONS],
    extractFormData: (c) => ({
      store: c.store,
      localization: c.localization,
      seo: c.seo,
      branding: c.branding,
      ui: c.ui,
      darkMode: c.darkMode,
      design: c.design,
      integrations: c.integrations,
      features: c.features,
      content: c.content,
    }),
  });

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors, isDirty },
  } = form;

  if (isNotReady) {
    return (
      <AppShell channelSlug="" activePage="global" title="Global">
        <LoadingState />
      </AppShell>
    );
  }

  return (
    <AppShell
      channelSlug={router.query.channelSlug as string}
      channelName={config?.store.name}
      activePage="global"
      title="Global"
      description="Store identity, branding, localization, integrations, and global settings"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 p-6">
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="mb-6 flex-wrap">
            {GLOBAL_TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <TabsTrigger key={tab.id} value={tab.id} className="gap-2">
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {/* Store Identity */}
          <TabsContent
            value="identity"
            forceMount
            className={activeTab !== "identity" ? "hidden" : "space-y-6"}
          >
            <StoreIdentityTab
              register={register}
              control={control}
              errors={errors}
            />
          </TabsContent>

          {/* Branding & Design */}
          <TabsContent
            value="branding"
            forceMount
            className={activeTab !== "branding" ? "hidden" : "space-y-6"}
          >
            <BrandingDesignTab
              register={register}
              control={control}
              errors={errors}
              watch={watch}
            />
          </TabsContent>

          {/* Localization & SEO */}
          <TabsContent
            value="localization"
            forceMount
            className={activeTab !== "localization" ? "hidden" : "space-y-6"}
          >
            <LocalizationSeoTab
              register={register}
              control={control}
              errors={errors}
            />
          </TabsContent>

          {/* Integrations */}
          <TabsContent
            value="integrations"
            forceMount
            className={activeTab !== "integrations" ? "hidden" : "space-y-6"}
          >
            <IntegrationsToolsTab
              register={register}
              control={control}
              errors={errors}
            />
          </TabsContent>

          {/* Features */}
          <TabsContent
            value="features"
            forceMount
            className={activeTab !== "features" ? "hidden" : "space-y-6"}
          >
            <GlobalFeaturesTab
              register={register}
              control={control}
              errors={errors}
            />
          </TabsContent>

          {/* Content */}
          <TabsContent
            value="content"
            forceMount
            className={activeTab !== "content" ? "hidden" : "space-y-6"}
          >
            <GlobalContentTab
              register={register}
              control={control}
              errors={errors}
            />
          </TabsContent>
        </Tabs>

        <SaveBar
          isDirty={isDirty}
          saveStatus={saveStatus}
          onReset={() => {
            if (config) {
              form.reset({
                store: config.store,
                localization: config.localization,
                seo: config.seo,
                branding: config.branding,
                ui: config.ui,
                darkMode: config.darkMode,
                design: config.design,
                integrations: config.integrations,
                features: config.features,
                content: config.content,
              });
            }
          }}
          onSubmit={handleSubmit(onSubmit)}
        />
      </form>
    </AppShell>
  );
}

export default GlobalPage;
