import React, { useEffect, useState } from "react";
import { useAppBridge } from "@saleor/app-sdk/app-bridge";
import { NextPage } from "next";
import { useRouter } from "next/router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { AppLayout } from "@/modules/ui/app-layout";
import { SectionCard } from "@/modules/ui/section-card";
import { StickySaveBar } from "@/modules/ui/sticky-save-bar";
import { trpcClient } from "@/modules/trpc/trpc-client";
import { ShippingSettingsSchema } from "@/modules/config/schema";
import type { StorefrontConfig } from "@/modules/config/schema";

type ShippingFormData = StorefrontConfig["ecommerce"]["shipping"];

const ShippingPage: NextPage = () => {
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
    formState: { isDirty },
  } = useForm<ShippingFormData>({
    resolver: zodResolver(ShippingSettingsSchema),
  });

  useEffect(() => {
    if (config?.ecommerce?.shipping) {
      reset(config.ecommerce.shipping);
    }
  }, [config, reset]);

  const onSubmit = async (data: ShippingFormData) => {
    setSaveStatus(null);
    if (!config?.ecommerce) return;
    await updateMutation.mutateAsync({
      channelSlug,
      section: "ecommerce",
      data: {
        ...config.ecommerce,
        shipping: data,
      },
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
    <AppLayout channelSlug={channelSlug} channelName={config?.store.name} activeTab="shipping">
      <form onSubmit={handleSubmit(onSubmit)}>
        <SectionCard
          id="shipping-free"
          title="Free shipping"
          description="Price threshold for cart indication (progress bar, “Add X more”, “You've unlocked free shipping”). Actual free shipping method is configured in Saleor shipping zones."
          keywords={["shipping", "free", "threshold", "cart", "progress"]}
          icon="📦"
        >
          <Controller
            name="freeShippingThreshold"
            control={control}
            render={({ field, fieldState }) => (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label style={{ fontWeight: 500 }}>Free shipping threshold (price)</label>
                <input
                  type="number"
                  min={0}
                  step={1}
                  placeholder="e.g. 50"
                  value={field.value ?? ""}
                  onChange={(e) => {
                    const v = e.target.value;
                    field.onChange(v === "" ? null : Number(v));
                  }}
                  style={{
                    padding: "8px 12px",
                    border: "1px solid #ddd",
                    borderRadius: "6px",
                    maxWidth: "160px",
                  }}
                />
                {fieldState.error && (
                  <span style={{ fontSize: "12px", color: "#b91c1c" }}>{fieldState.error.message}</span>
                )}
                <span style={{ fontSize: "13px", color: "#666" }}>
                  Cart and drawer use this value for messaging only. Leave empty to hide threshold messaging.
                </span>
              </div>
            )}
          />
        </SectionCard>

        <StickySaveBar
          isDirty={isDirty}
          isLoading={updateMutation.isLoading}
          isSuccess={saveStatus === "success"}
          isError={saveStatus === "error"}
          onReset={() => reset(config?.ecommerce?.shipping)}
          onSubmit={handleSubmit(onSubmit)}
        />
      </form>
    </AppLayout>
  );
};

export async function getServerSideProps() {
  return { props: {} };
}

export default ShippingPage;
