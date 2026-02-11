import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Home, Type } from "lucide-react";

import { AppShell } from "@/components/layout/AppShell";
import { SaveBar } from "@/components/layout/SaveBar";
import { LoadingState } from "@/components/shared/LoadingState";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useConfigPage } from "@/hooks/useConfigPage";

import { HomepageFormSchema } from "@/components/pages/homepage/types";
import { HomepageSectionsTab } from "@/components/pages/homepage/HomepageSectionsTab";
import { HomepageContentTab } from "@/components/pages/homepage/HomepageContentTab";

// ---------------------------------------------------------------------------
// Tab definitions
// ---------------------------------------------------------------------------

const HOMEPAGE_TABS = [
  { id: "sections", label: "Sections & Layout", icon: Home },
  { id: "content", label: "Content", icon: Type },
] as const;

type HomepageTabId = (typeof HOMEPAGE_TABS)[number]["id"];

function isValidTab(value: string | undefined): value is HomepageTabId {
  return HOMEPAGE_TABS.some((t) => t.id === value);
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

function HomepagePage() {
  const router = useRouter();
  const tabParam = router.query.tab as string | undefined;
  const initialTab = isValidTab(tabParam) ? tabParam : "sections";
  const [activeTab, setActiveTab] = useState<HomepageTabId>(initialTab);

  useEffect(() => {
    if (isValidTab(tabParam) && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [tabParam]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleTabChange(value: string) {
    const tab = value as HomepageTabId;
    setActiveTab(tab);
    router.replace(
      { pathname: router.pathname, query: { ...router.query, tab } },
      undefined,
      { shallow: true },
    );
  }

  const { config, isNotReady, form, onSubmit, saveStatus } = useConfigPage({
    schema: HomepageFormSchema,
    sections: ["homepage", "content"],
    extractFormData: (c) => ({
      homepage: c.homepage,
      content: c.content,
    }),
  });

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = form;

  if (isNotReady) {
    return (
      <AppShell channelSlug="" activePage="homepage" title="Homepage">
        <LoadingState />
      </AppShell>
    );
  }

  return (
    <AppShell
      channelSlug={router.query.channelSlug as string}
      channelName={config?.store.name}
      activePage="homepage"
      title="Homepage"
      description="Homepage sections, section order, and homepage content text"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 p-6">
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="mb-6">
            {HOMEPAGE_TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <TabsTrigger key={tab.id} value={tab.id} className="gap-2">
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {/* Sections & Layout */}
          <TabsContent
            value="sections"
            forceMount
            className={activeTab !== "sections" ? "hidden" : "space-y-6"}
          >
            <HomepageSectionsTab
              register={register}
              control={control}
              errors={errors}
              watch={watch}
              setValue={setValue}
            />
          </TabsContent>

          {/* Content */}
          <TabsContent
            value="content"
            forceMount
            className={activeTab !== "content" ? "hidden" : "space-y-6"}
          >
            <HomepageContentTab
              register={register}
              control={control}
              errors={errors}
              watch={watch}
            />
          </TabsContent>
        </Tabs>

        <SaveBar
          isDirty={isDirty}
          saveStatus={saveStatus}
          onReset={() => {
            if (config) {
              form.reset({
                homepage: config.homepage,
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

export default HomepagePage;
