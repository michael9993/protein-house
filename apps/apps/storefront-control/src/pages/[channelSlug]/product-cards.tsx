import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import {
  CreditCard,
  Filter,
  Heart,
  Clock,
  Grid3X3,
  Link2,
} from "lucide-react";

import { AppShell } from "@/components/layout/AppShell";
import { SaveBar } from "@/components/layout/SaveBar";
import { LoadingState } from "@/components/shared/LoadingState";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useConfigPage } from "@/hooks/useConfigPage";
import {
  ProductCardsFormSchema,
  type ProductCardsFormData,
} from "@/components/pages/product-cards/types";
import { LocationCardOverrideTab } from "@/components/pages/product-cards/LocationCardOverrideTab";

// ---------------------------------------------------------------------------
// Tab definitions
// ---------------------------------------------------------------------------

const CARD_TABS = [
  { id: "plp", label: "Product Listing", icon: Filter },
  { id: "relatedProducts", label: "Related Products", icon: Link2 },
  { id: "recentlyViewed", label: "Recently Viewed", icon: Clock },
  { id: "wishlistDrawer", label: "Wishlist", icon: Heart },
  { id: "productGrid", label: "Product Grid", icon: Grid3X3 },
] as const;

type CardTabId = (typeof CARD_TABS)[number]["id"];

function isValidTab(value: string | undefined): value is CardTabId {
  return CARD_TABS.some((t) => t.id === value);
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

function ProductCardsPage() {
  const router = useRouter();
  const tabParam = router.query.tab as string | undefined;
  const initialTab = isValidTab(tabParam) ? tabParam : "plp";
  const [activeTab, setActiveTab] = useState<CardTabId>(initialTab);

  useEffect(() => {
    if (isValidTab(tabParam) && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [tabParam]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleTabChange(value: string) {
    const tab = value as CardTabId;
    setActiveTab(tab);
    router.replace(
      { pathname: router.pathname, query: { ...router.query, tab } },
      undefined,
      { shallow: true },
    );
  }

  const { config, isNotReady, form, onSubmit, saveStatus } = useConfigPage({
    schema: ProductCardsFormSchema,
    sections: ["cardOverrides"],
    extractFormData: (c) => ({
      cardOverrides: c.cardOverrides ?? {},
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
      <AppShell channelSlug="" activePage="product-cards" title="Product Cards">
        <LoadingState />
      </AppShell>
    );
  }

  return (
    <AppShell
      channelSlug={router.query.channelSlug as string}
      channelName={config?.store.name}
      activePage="product-cards"
      title="Product Cards"
      description="Per-location product card overrides. Global defaults are set in Global > Branding & Design."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 p-6">
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="mb-6 flex-wrap">
            {CARD_TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <TabsTrigger key={tab.id} value={tab.id} className="gap-2">
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {CARD_TABS.map((tab) => (
            <TabsContent
              key={tab.id}
              value={tab.id}
              forceMount
              className={activeTab !== tab.id ? "hidden" : "space-y-6"}
            >
              <LocationCardOverrideTab
                location={tab.id}
                control={control}
                watch={watch}
                setValue={setValue}
              />
            </TabsContent>
          ))}
        </Tabs>

        <SaveBar
          isDirty={isDirty}
          saveStatus={saveStatus}
          onReset={() => {
            if (config) {
              form.reset({
                cardOverrides: config.cardOverrides ?? {},
              });
            }
          }}
          onSubmit={handleSubmit(onSubmit)}
        />
      </form>
    </AppShell>
  );
}

export default ProductCardsPage;
