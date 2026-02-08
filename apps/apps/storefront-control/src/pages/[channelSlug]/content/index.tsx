import { useAppBridge } from "@saleor/app-sdk/app-bridge";
import { CreditCard, FileText, Globe, Package, ShoppingBag, User } from "lucide-react";
import { NextPage } from "next";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { AppShell, SaveBar } from "@/components/layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpcClient } from "@/modules/trpc/trpc-client";
import { ContentSchema } from "@/modules/config/schema";

import { ContentTabShop } from "./ContentTabShop";
import { ContentTabCheckout } from "./ContentTabCheckout";
import { ContentTabCatalog } from "./ContentTabCatalog";
import { ContentTabAccount } from "./ContentTabAccount";
import { ContentTabPages } from "./ContentTabPages";
import { ContentTabGlobal } from "./ContentTabGlobal";
import type { ContentFormData } from "./types";

const CONTENT_TABS = [
  { id: "shop", label: "Shop", icon: ShoppingBag },
  { id: "account", label: "Account", icon: User },
  { id: "checkout", label: "Checkout", icon: CreditCard },
  { id: "catalog", label: "Catalog", icon: Package },
  { id: "pages", label: "Pages", icon: FileText },
  { id: "global", label: "Global", icon: Globe },
] as const;

type ContentTabId = (typeof CONTENT_TABS)[number]["id"];

const TAB_FIELD_MAP: Record<ContentTabId, string[]> = {
  shop: ["cart", "product"],
  checkout: ["checkout"],
  catalog: ["filters", "productDetail"],
  account: ["account", "confirmEmail", "dashboard", "orders", "orderTracking", "addresses", "settings"],
  pages: ["contact", "wishlist"],
  global: ["general", "homepage", "footer", "navbar", "error", "notFound"],
};

function hasErrorsInTab(tabId: ContentTabId, errors: Record<string, unknown>): boolean {
  return TAB_FIELD_MAP[tabId].some((key) => key in errors);
}

const ContentPage: NextPage = () => {
  const router = useRouter();
  const { channelSlug, tab } = router.query as { channelSlug: string; tab?: string };
  const { appBridgeState } = useAppBridge();
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [formReady, setFormReady] = useState(false);

  // Resolve initial tab from URL query param
  const initialTab = CONTENT_TABS.some((t) => t.id === tab) ? (tab as ContentTabId) : "shop";
  const [activeTab, setActiveTab] = useState<ContentTabId>(initialTab);

  // Sync tab state with URL query param
  useEffect(() => {
    if (tab && CONTENT_TABS.some((t) => t.id === tab) && tab !== activeTab) {
      setActiveTab(tab as ContentTabId);
    }
  }, [tab]);

  function handleTabChange(newTab: string): void {
    setActiveTab(newTab as ContentTabId);
    // Update URL without navigation
    router.replace(
      { pathname: router.pathname, query: { ...router.query, tab: newTab } },
      undefined,
      { shallow: true },
    );
  }

  const {
    data: config,
    isLoading,
    refetch,
  } = trpcClient.config.getConfig.useQuery(
    { channelSlug },
    { enabled: !!channelSlug && !!appBridgeState?.ready },
  );

  const updateMutation = trpcClient.config.updateSection.useMutation({
    onSuccess: () => {
      refetch();
      setSaveStatus("success");
      setTimeout(() => setSaveStatus("idle"), 3000);
    },
    onError: () => {
      setSaveStatus("error");
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isDirty },
  } = useForm<ContentFormData>({
    resolver: zodResolver(ContentSchema),
  });

  const {
    fields: faqFields,
    append: addFaq,
    remove: removeFaq,
  } = useFieldArray({
    control,
    name: "contact.faqs",
  });

  useEffect(() => {
    if (config?.content) {
      reset(config.content);
      if (!formReady) setFormReady(true);
    }
  }, [config, reset]);

  async function onSubmit(data: ContentFormData): Promise<void> {
    setSaveStatus("saving");
    await updateMutation.mutateAsync({
      channelSlug,
      section: "content",
      data,
    });
  }

  if (!appBridgeState?.ready || isLoading || !formReady) {
    return (
      <AppShell
        channelSlug={channelSlug ?? ""}
        channelName={config?.store.name}
        activePage="content"
        title="Content"
      >
        <div className="flex items-center justify-center h-64">
          <span className="text-muted-foreground">Loading...</span>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      channelSlug={channelSlug}
      channelName={config?.store.name}
      activePage="content"
      title="Content"
      description="Manage all UI text and translations"
    >
      <form onSubmit={handleSubmit(onSubmit)}>
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="mb-6">
            {CONTENT_TABS.map((tab) => {
              const Icon = tab.icon;
              const hasErrors = Object.keys(errors).length > 0 && hasErrorsInTab(tab.id, errors);
              return (
                <TabsTrigger key={tab.id} value={tab.id} className="relative">
                  <Icon className="mr-2 h-4 w-4" />
                  {tab.label}
                  {hasErrors && (
                    <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-destructive" />
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>

          <TabsContent value="shop" forceMount hidden={activeTab !== "shop"}>
            <ContentTabShop register={register} errors={errors} control={control} />
          </TabsContent>
          <TabsContent value="checkout" forceMount hidden={activeTab !== "checkout"}>
            <ContentTabCheckout register={register} errors={errors} control={control} />
          </TabsContent>
          <TabsContent value="catalog" forceMount hidden={activeTab !== "catalog"}>
            <ContentTabCatalog register={register} errors={errors} control={control} />
          </TabsContent>
          <TabsContent value="account" forceMount hidden={activeTab !== "account"}>
            <ContentTabAccount register={register} errors={errors} control={control} />
          </TabsContent>
          <TabsContent value="pages" forceMount hidden={activeTab !== "pages"}>
            <ContentTabPages
              register={register}
              errors={errors}
              control={control}
              faqFields={faqFields}
              addFaq={addFaq}
              removeFaq={removeFaq}
            />
          </TabsContent>
          <TabsContent value="global" forceMount hidden={activeTab !== "global"}>
            <ContentTabGlobal register={register} errors={errors} control={control} />
          </TabsContent>
        </Tabs>

        <SaveBar
          isDirty={isDirty}
          saveStatus={saveStatus}
          onReset={() => reset(config?.content)}
          onSubmit={handleSubmit(onSubmit)}
        />
      </form>
    </AppShell>
  );
};

export default ContentPage;
