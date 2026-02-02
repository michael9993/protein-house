import React from "react";
import { useAppBridge } from "@saleor/app-sdk/app-bridge";
import { NextPage } from "next";
import { useRouter } from "next/router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";

import { AppLayout } from "@/modules/ui/app-layout";
import { SectionCard } from "@/modules/ui/section-card";
import { FormField, SelectField } from "@/modules/ui/form-field";
import { StickySaveBar } from "@/modules/ui/sticky-save-bar";
import { trpcClient } from "@/modules/trpc/trpc-client";
import { BrandingSchema } from "@/modules/config/schema";
import type { StorefrontConfig } from "@/modules/config/schema";

type BrandingFormData = StorefrontConfig["branding"];

const BrandingPage: NextPage = () => {
  const router = useRouter();
  const { channelSlug } = router.query as { channelSlug: string };
  const { appBridgeState } = useAppBridge();

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
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isDirty },
  } = useForm<BrandingFormData>({
    resolver: zodResolver(BrandingSchema),
  });

  const colors = watch("colors");

  useEffect(() => {
    if (config?.branding) {
      reset(config.branding);
    }
  }, [config, reset]);

  const onSubmit = async (data: BrandingFormData) => {
    await updateMutation.mutateAsync({
      channelSlug,
      section: "branding",
      data,
    });
  };

  if (!appBridgeState?.ready || isLoading) {
    return (
      <div
        style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}
      >
        <span>Loading...</span>
      </div>
    );
  }

  return (
    <AppLayout channelSlug={channelSlug} channelName={config?.store.name} activeTab="branding">
      <form onSubmit={handleSubmit(onSubmit)}>
        <SectionCard
          id="branding-identity"
          title="Logo & Assets"
          description="Your brand identity assets"
          keywords={["logo", "branding", "favicon", "alt"]}
        >
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <FormField
              label="Logo URL"
              name="logo"
              register={register}
              errors={errors}
              type="url"
              placeholder="/logo.svg"
              description="Path or URL to your logo image"
            />
            <FormField
              label="Logo Alt Text"
              name="logoAlt"
              register={register}
              errors={errors}
              placeholder="My Store Logo"
            />
          </div>
          <FormField
            label="Favicon URL"
            name="favicon"
            register={register}
            errors={errors}
            type="url"
            placeholder="/favicon.ico"
          />
        </SectionCard>

        <SectionCard
          id="branding-colors"
          title="Brand Colors"
          description="Your store's color palette"
          keywords={["colors", "primary", "secondary", "accent", "background", "text"]}
          icon="🎨"
        >
          {/* Color Preview */}
          <div
            style={{
              display: "flex",
              gap: "8px",
              marginBottom: "24px",
              padding: "16px",
              backgroundColor: colors?.background || "#fff",
              border: "1px solid #ddd",
            }}
          >
            <div
              style={{
                padding: "12px",
                backgroundColor: colors?.primary || "#2563EB",
                color: "#fff",
                borderRadius: "4px",
              }}
            >
              Primary
            </div>
            <div
              style={{
                padding: "12px",
                backgroundColor: colors?.secondary || "#1F2937",
                color: "#fff",
                borderRadius: "4px",
              }}
            >
              Secondary
            </div>
            <div
              style={{
                padding: "12px",
                backgroundColor: colors?.accent || "#F59E0B",
                color: "#fff",
                borderRadius: "4px",
              }}
            >
              Accent
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
            <FormField
              label="Primary"
              name="colors.primary"
              register={register}
              errors={errors}
              type="color"
            />
            <FormField
              label="Secondary"
              name="colors.secondary"
              register={register}
              errors={errors}
              type="color"
            />
            <FormField
              label="Accent"
              name="colors.accent"
              register={register}
              errors={errors}
              type="color"
            />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <FormField
              label="Background"
              name="colors.background"
              register={register}
              errors={errors}
              type="color"
            />
            <FormField
              label="Surface"
              name="colors.surface"
              register={register}
              errors={errors}
              type="color"
            />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <FormField
              label="Text"
              name="colors.text"
              register={register}
              errors={errors}
              type="color"
            />
            <FormField
              label="Text Muted"
              name="colors.textMuted"
              register={register}
              errors={errors}
              type="color"
            />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
            <FormField
              label="Success"
              name="colors.success"
              register={register}
              errors={errors}
              type="color"
            />
            <FormField
              label="Warning"
              name="colors.warning"
              register={register}
              errors={errors}
              type="color"
            />
            <FormField
              label="Error"
              name="colors.error"
              register={register}
              errors={errors}
              type="color"
            />
          </div>
        </SectionCard>

        <SectionCard
          id="branding-typography"
          title="Typography"
          description="Font families for your store"
          keywords={["typography", "fonts", "heading", "body"]}
          icon="✍️"
        >
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
            <FormField
              label="Heading Font"
              name="typography.fontHeading"
              register={register}
              errors={errors}
              placeholder="Inter"
            />
            <FormField
              label="Body Font"
              name="typography.fontBody"
              register={register}
              errors={errors}
              placeholder="Inter"
            />
            <FormField
              label="Mono Font"
              name="typography.fontMono"
              register={register}
              errors={errors}
              placeholder="JetBrains Mono"
            />
          </div>
        </SectionCard>

        <SectionCard
          id="branding-font-sizes"
          title="Font Sizes"
          description="Font sizes for different text elements (RTL-aware)"
          keywords={["font sizes", "typography", "text"]}
        >
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "16px" }}>
            <SelectField
              label="H1 Size"
              name="typography.fontSize.h1"
              register={register}
              options={[
                { value: "xs", label: "xs" },
                { value: "sm", label: "sm" },
                { value: "base", label: "base" },
                { value: "lg", label: "lg" },
                { value: "xl", label: "xl" },
                { value: "2xl", label: "2xl" },
                { value: "3xl", label: "3xl" },
                { value: "4xl", label: "4xl" },
                { value: "5xl", label: "5xl" },
                { value: "6xl", label: "6xl" },
                { value: "7xl", label: "7xl" },
                { value: "8xl", label: "8xl" },
                { value: "9xl", label: "9xl" },
              ]}
            />
            <SelectField
              label="H2 Size"
              name="typography.fontSize.h2"
              register={register}
              options={[
                { value: "xs", label: "xs" },
                { value: "sm", label: "sm" },
                { value: "base", label: "base" },
                { value: "lg", label: "lg" },
                { value: "xl", label: "xl" },
                { value: "2xl", label: "2xl" },
                { value: "3xl", label: "3xl" },
                { value: "4xl", label: "4xl" },
                { value: "5xl", label: "5xl" },
                { value: "6xl", label: "6xl" },
                { value: "7xl", label: "7xl" },
                { value: "8xl", label: "8xl" },
                { value: "9xl", label: "9xl" },
              ]}
            />
            <SelectField
              label="H3 Size"
              name="typography.fontSize.h3"
              register={register}
              options={[
                { value: "xs", label: "xs" },
                { value: "sm", label: "sm" },
                { value: "base", label: "base" },
                { value: "lg", label: "lg" },
                { value: "xl", label: "xl" },
                { value: "2xl", label: "2xl" },
                { value: "3xl", label: "3xl" },
                { value: "4xl", label: "4xl" },
                { value: "5xl", label: "5xl" },
                { value: "6xl", label: "6xl" },
                { value: "7xl", label: "7xl" },
                { value: "8xl", label: "8xl" },
                { value: "9xl", label: "9xl" },
              ]}
            />
            <SelectField
              label="H4 Size"
              name="typography.fontSize.h4"
              register={register}
              options={[
                { value: "xs", label: "xs" },
                { value: "sm", label: "sm" },
                { value: "base", label: "base" },
                { value: "lg", label: "lg" },
                { value: "xl", label: "xl" },
                { value: "2xl", label: "2xl" },
                { value: "3xl", label: "3xl" },
                { value: "4xl", label: "4xl" },
                { value: "5xl", label: "5xl" },
                { value: "6xl", label: "6xl" },
                { value: "7xl", label: "7xl" },
                { value: "8xl", label: "8xl" },
                { value: "9xl", label: "9xl" },
              ]}
            />
            <SelectField
              label="Body Size"
              name="typography.fontSize.body"
              register={register}
              options={[
                { value: "xs", label: "xs" },
                { value: "sm", label: "sm" },
                { value: "base", label: "base" },
                { value: "lg", label: "lg" },
                { value: "xl", label: "xl" },
                { value: "2xl", label: "2xl" },
                { value: "3xl", label: "3xl" },
                { value: "4xl", label: "4xl" },
                { value: "5xl", label: "5xl" },
                { value: "6xl", label: "6xl" },
                { value: "7xl", label: "7xl" },
                { value: "8xl", label: "8xl" },
                { value: "9xl", label: "9xl" },
              ]}
            />
            <SelectField
              label="Small Size"
              name="typography.fontSize.small"
              register={register}
              options={[
                { value: "xs", label: "xs" },
                { value: "sm", label: "sm" },
                { value: "base", label: "base" },
                { value: "lg", label: "lg" },
                { value: "xl", label: "xl" },
                { value: "2xl", label: "2xl" },
                { value: "3xl", label: "3xl" },
                { value: "4xl", label: "4xl" },
                { value: "5xl", label: "5xl" },
                { value: "6xl", label: "6xl" },
                { value: "7xl", label: "7xl" },
                { value: "8xl", label: "8xl" },
                { value: "9xl", label: "9xl" },
              ]}
            />
            <SelectField
              label="Button Size"
              name="typography.fontSize.button"
              register={register}
              options={[
                { value: "xs", label: "xs" },
                { value: "sm", label: "sm" },
                { value: "base", label: "base" },
                { value: "lg", label: "lg" },
                { value: "xl", label: "xl" },
                { value: "2xl", label: "2xl" },
                { value: "3xl", label: "3xl" },
                { value: "4xl", label: "4xl" },
                { value: "5xl", label: "5xl" },
                { value: "6xl", label: "6xl" },
                { value: "7xl", label: "7xl" },
                { value: "8xl", label: "8xl" },
                { value: "9xl", label: "9xl" },
              ]}
            />
            <SelectField
              label="Caption Size"
              name="typography.fontSize.caption"
              register={register}
              options={[
                { value: "xs", label: "xs" },
                { value: "sm", label: "sm" },
                { value: "base", label: "base" },
                { value: "lg", label: "lg" },
                { value: "xl", label: "xl" },
                { value: "2xl", label: "2xl" },
                { value: "3xl", label: "3xl" },
                { value: "4xl", label: "4xl" },
                { value: "5xl", label: "5xl" },
                { value: "6xl", label: "6xl" },
                { value: "7xl", label: "7xl" },
                { value: "8xl", label: "8xl" },
                { value: "9xl", label: "9xl" },
              ]}
            />
          </div>
        </SectionCard>

        <SectionCard
          id="branding-style"
          title="Style Options"
          description="Visual style preferences"
          keywords={["style", "radius", "buttons", "shadows"]}
          icon="✨"
        >
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
            <SelectField
              label="Border Radius"
              name="style.borderRadius"
              register={register}
              options={[
                { value: "none", label: "None (Sharp)" },
                { value: "sm", label: "Small" },
                { value: "md", label: "Medium" },
                { value: "lg", label: "Large" },
                { value: "full", label: "Full (Pill)" },
              ]}
            />
            <SelectField
              label="Button Style"
              name="style.buttonStyle"
              register={register}
              options={[
                { value: "solid", label: "Solid" },
                { value: "outline", label: "Outline" },
                { value: "ghost", label: "Ghost" },
              ]}
            />
            <SelectField
              label="Card Shadow"
              name="style.cardShadow"
              register={register}
              options={[
                { value: "none", label: "None" },
                { value: "sm", label: "Small" },
                { value: "md", label: "Medium" },
                { value: "lg", label: "Large" },
              ]}
            />
          </div>
        </SectionCard>

        <StickySaveBar
          isDirty={isDirty}
          isLoading={updateMutation.isLoading}
          isSuccess={updateMutation.isSuccess}
          isError={updateMutation.isError}
          onReset={() => reset(config?.branding)}
          onSubmit={handleSubmit(onSubmit)}
        />
      </form>
    </AppLayout>
  );
};

export async function getServerSideProps() {
  return { props: {} };
}

export default BrandingPage;
