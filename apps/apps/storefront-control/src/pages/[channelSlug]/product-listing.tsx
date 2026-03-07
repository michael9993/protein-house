import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Filter, FileText, CreditCard } from "lucide-react";

import { AppShell } from "@/components/layout/AppShell";
import { SaveBar } from "@/components/layout/SaveBar";
import { LoadingState } from "@/components/shared/LoadingState";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useConfigPage } from "@/hooks/useConfigPage";
import { CatalogFormSchema, type CatalogFormData } from "@/components/pages/catalog/types";
import { ProductListingTab } from "@/components/pages/catalog/ProductListingTab";
import { CatalogContentTab } from "@/components/pages/catalog/CatalogContentTab";

const TABS = [
  { id: "filters", label: "Filters & Grid", icon: Filter },
  { id: "content", label: "Listing Text", icon: FileText },
] as const;

type TabId = (typeof TABS)[number]["id"];

function isValidTab(v: string | undefined): v is TabId {
  return TABS.some((t) => t.id === v);
}

function ProductListingPage() {
  const router = useRouter();
  const tabParam = router.query.tab as string | undefined;
  const initialTab = isValidTab(tabParam) ? tabParam : "filters";
  const [activeTab, setActiveTab] = useState<TabId>(initialTab);

  useEffect(() => {
    if (isValidTab(tabParam) && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [tabParam]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleTabChange(value: string) {
    const tab = value as TabId;
    setActiveTab(tab);
    router.replace(
      { pathname: router.pathname, query: { ...router.query, tab } },
      undefined,
      { shallow: true },
    );
  }

  const { config, isNotReady, form, onSubmit, saveStatus } = useConfigPage({
    schema: CatalogFormSchema,
    sections: ["filters", "quickFilters", "features", "relatedProducts", "content"],
    extractFormData: (c) => ({
      features: c.features,
      filters: c.filters,
      quickFilters: c.quickFilters,
      relatedProducts: c.relatedProducts,
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
      <AppShell channelSlug="" activePage="product-listing" title="Product Listing">
        <LoadingState />
      </AppShell>
    );
  }

  return (
    <AppShell
      channelSlug={router.query.channelSlug as string}
      channelName={config?.store.name}
      activePage="product-listing"
      title="Product Listing"
      description="Filters, grid layout, and listing page text"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 p-6">
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="mb-6">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <TabsTrigger key={tab.id} value={tab.id} className="gap-2">
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </TabsTrigger>
              );
            })}
          </TabsList>

          <TabsContent
            value="filters"
            forceMount
            className={activeTab !== "filters" ? "hidden" : "space-y-6"}
          >
            <ProductListingTab
              control={control}
              register={register}
              errors={errors}
              watch={watch}
            />
          </TabsContent>

          <TabsContent
            value="content"
            forceMount
            className={activeTab !== "content" ? "hidden" : "space-y-6"}
          >
            <CatalogContentTab
              control={control}
              register={register}
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
                features: config.features,
                filters: config.filters,
                quickFilters: config.quickFilters,
                relatedProducts: config.relatedProducts,
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

export default ProductListingPage;
