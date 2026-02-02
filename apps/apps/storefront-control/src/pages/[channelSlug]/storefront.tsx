import React from "react";
import { useAppBridge } from "@saleor/app-sdk/app-bridge";
import { NextPage } from "next";
import { useRouter } from "next/router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";

import { AppLayout } from "@/modules/ui/app-layout";
import { SectionCard } from "@/modules/ui/section-card";
import { StickySaveBar } from "@/modules/ui/sticky-save-bar";
import { trpcClient } from "@/modules/trpc/trpc-client";
import { StorefrontUXSchema } from "@/modules/config/schema";
import type { StorefrontConfig } from "@/modules/config/schema";

type StorefrontFormData = StorefrontConfig["storefront"];

const StorefrontPage: NextPage = () => {
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
    control,
    handleSubmit,
    reset,
    watch,
    formState: { isDirty },
  } = useForm<StorefrontFormData>({
    resolver: zodResolver(StorefrontUXSchema),
  });

  const displayMode = watch("cart.displayMode");

  useEffect(() => {
    if (config?.storefront) {
      reset(config.storefront);
    }
  }, [config, reset]);

  const onSubmit = async (data: StorefrontFormData) => {
    setSaveStatus(null);
    await updateMutation.mutateAsync({
      channelSlug,
      section: "storefront",
      data,
    });
  };

  if (!appBridgeState?.ready || isLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <span>Loading...</span>
      </div>
    );
  }

  return (
    <AppLayout channelSlug={channelSlug} channelName={config?.store.name} activeTab="storefront">
      <form onSubmit={handleSubmit(onSubmit)}>
        <SectionCard 
          id="storefront-cart"
          title="Cart Display" 
          description="Choose how the shopping cart is displayed to customers"
          keywords={["cart", "drawer", "page", "slide", "panel"]}
          icon="🛒"
        >
          <Controller
            name="cart.displayMode"
            control={control}
            render={({ field }) => (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {/* Cart Page Option */}
                <label
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "12px",
                    padding: "16px",
                    border: field.value === "page" ? "2px solid #000" : "1px solid #ddd",
                    backgroundColor: field.value === "page" ? "#f5f5f5" : "#fff",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="radio"
                    value="page"
                    checked={field.value === "page"}
                    onChange={() => field.onChange("page")}
                    style={{ marginTop: "4px" }}
                  />
                  <div>
                    <div style={{ fontWeight: "bold", marginBottom: "4px" }}>
                      Cart Page
                    </div>
                    <div style={{ fontSize: "13px", color: "#666" }}>
                      Traditional full-page cart experience. Clicking the cart icon navigates to /cart page.
                    </div>
                  </div>
                </label>

                {/* Cart Drawer Option */}
                <label
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "12px",
                    padding: "16px",
                    border: field.value === "drawer" ? "2px solid #000" : "1px solid #ddd",
                    backgroundColor: field.value === "drawer" ? "#f5f5f5" : "#fff",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="radio"
                    value="drawer"
                    checked={field.value === "drawer"}
                    onChange={() => field.onChange("drawer")}
                    style={{ marginTop: "4px" }}
                  />
                  <div>
                    <div style={{ fontWeight: "bold", marginBottom: "4px" }}>
                      Cart Drawer
                    </div>
                    <div style={{ fontSize: "13px", color: "#666" }}>
                      Slide-in panel from the right side. Fast and seamless shopping experience without page navigation.
                    </div>
                  </div>
                </label>
              </div>
            )}
          />

          {/* Preview indicator */}
          <div style={{ marginTop: "24px", padding: "12px", backgroundColor: "#f9fafb", border: "1px solid #e5e7eb" }}>
            <div style={{ fontSize: "12px", color: "#666", marginBottom: "8px" }}>
              Current setting:
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "20px" }}>
                {displayMode === "drawer" ? "📥" : "📄"}
              </span>
              <span style={{ fontWeight: "500" }}>
                {displayMode === "drawer" ? "Cart Drawer (slide-in panel)" : "Cart Page (full page)"}
              </span>
            </div>
          </div>
        </SectionCard>

        <StickySaveBar
          isDirty={isDirty}
          isLoading={updateMutation.isLoading}
          isSuccess={saveStatus === "success"}
          isError={saveStatus === "error"}
          onReset={() => reset(config?.storefront)}
          onSubmit={handleSubmit(onSubmit)}
        />
      </form>
    </AppLayout>
  );
};

export async function getServerSideProps() {
  return { props: {} };
}

export default StorefrontPage;
