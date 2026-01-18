import { useAppBridge } from "@saleor/app-sdk/app-bridge";
import { Box, Text, Button } from "@saleor/macaw-ui";
import { NextPage } from "next";
import { useRouter } from "next/router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";

import { AppLayout } from "@/modules/ui/app-layout";
import { SectionCard } from "@/modules/ui/section-card";
import { FormField, SelectField } from "@/modules/ui/form-field";
import { trpcClient } from "@/modules/trpc/trpc-client";
import { BrandingSchema } from "@/modules/config/schema";
import type { StorefrontConfig } from "@/modules/config/schema";

type BrandingFormData = StorefrontConfig["branding"];

const BrandingPage: NextPage = () => {
  const router = useRouter();
  const { channelSlug } = router.query as { channelSlug: string };
  const { appBridgeState } = useAppBridge();

  const { data: config, isLoading, refetch } = trpcClient.config.getConfig.useQuery(
    { channelSlug },
    { enabled: !!channelSlug && !!appBridgeState?.ready }
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
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <Text>Loading...</Text>
      </Box>
    );
  }

  return (
    <AppLayout channelSlug={channelSlug} channelName={config?.store.name} activeTab="branding">
      <form onSubmit={handleSubmit(onSubmit)}>
        <SectionCard title="Logo & Assets" description="Your brand identity assets">
          <Box display="grid" __gridTemplateColumns="1fr 1fr" gap={4}>
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
          </Box>
          <FormField
            label="Favicon URL"
            name="favicon"
            register={register}
            errors={errors}
            type="url"
            placeholder="/favicon.ico"
          />
        </SectionCard>

        <SectionCard title="Brand Colors" description="Your store's color palette">
          {/* Color Preview */}
          <Box 
            display="flex" 
            gap={2} 
            marginBottom={4}
            padding={4}
            borderRadius={4}
            style={{ backgroundColor: colors?.background || "#fff" }}
          >
            <Box 
              padding={3} 
              borderRadius={2}
              style={{ backgroundColor: colors?.primary || "#2563EB", color: "#fff" }}
            >
              Primary
            </Box>
            <Box 
              padding={3} 
              borderRadius={2}
              style={{ backgroundColor: colors?.secondary || "#1F2937", color: "#fff" }}
            >
              Secondary
            </Box>
            <Box 
              padding={3} 
              borderRadius={2}
              style={{ backgroundColor: colors?.accent || "#F59E0B", color: "#fff" }}
            >
              Accent
            </Box>
          </Box>

          <Box display="grid" __gridTemplateColumns="1fr 1fr 1fr" gap={4}>
            <FormField label="Primary" name="colors.primary" register={register} errors={errors} type="color" />
            <FormField label="Secondary" name="colors.secondary" register={register} errors={errors} type="color" />
            <FormField label="Accent" name="colors.accent" register={register} errors={errors} type="color" />
          </Box>
          <Box display="grid" __gridTemplateColumns="1fr 1fr" gap={4}>
            <FormField label="Background" name="colors.background" register={register} errors={errors} type="color" />
            <FormField label="Surface" name="colors.surface" register={register} errors={errors} type="color" />
          </Box>
          <Box display="grid" __gridTemplateColumns="1fr 1fr" gap={4}>
            <FormField label="Text" name="colors.text" register={register} errors={errors} type="color" />
            <FormField label="Text Muted" name="colors.textMuted" register={register} errors={errors} type="color" />
          </Box>
          <Box display="grid" __gridTemplateColumns="1fr 1fr 1fr" gap={4}>
            <FormField label="Success" name="colors.success" register={register} errors={errors} type="color" />
            <FormField label="Warning" name="colors.warning" register={register} errors={errors} type="color" />
            <FormField label="Error" name="colors.error" register={register} errors={errors} type="color" />
          </Box>
        </SectionCard>

        <SectionCard title="Typography" description="Font families for your store">
          <Box display="grid" __gridTemplateColumns="1fr 1fr 1fr" gap={4}>
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
          </Box>
        </SectionCard>

        <SectionCard title="Font Sizes" description="Font sizes for different text elements (RTL-aware)">
          <Box display="grid" __gridTemplateColumns="1fr 1fr 1fr 1fr" gap={4}>
            <FormField
              label="H1 Size"
              name="typography.fontSize.h1"
              register={register}
              errors={errors}
              type="select"
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
            <FormField
              label="H2 Size"
              name="typography.fontSize.h2"
              register={register}
              errors={errors}
              type="select"
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
            <FormField
              label="H3 Size"
              name="typography.fontSize.h3"
              register={register}
              errors={errors}
              type="select"
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
            <FormField
              label="H4 Size"
              name="typography.fontSize.h4"
              register={register}
              errors={errors}
              type="select"
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
            <FormField
              label="Body Size"
              name="typography.fontSize.body"
              register={register}
              errors={errors}
              type="select"
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
            <FormField
              label="Small Size"
              name="typography.fontSize.small"
              register={register}
              errors={errors}
              type="select"
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
            <FormField
              label="Button Size"
              name="typography.fontSize.button"
              register={register}
              errors={errors}
              type="select"
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
            <FormField
              label="Caption Size"
              name="typography.fontSize.caption"
              register={register}
              errors={errors}
              type="select"
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
          </Box>
        </SectionCard>

        <SectionCard title="Style Options" description="Visual style preferences">
          <Box display="grid" __gridTemplateColumns="1fr 1fr 1fr" gap={4}>
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
          </Box>
        </SectionCard>

        <Box display="flex" justifyContent="flex-end" gap={2} marginTop={4}>
          <Button type="button" variant="secondary" onClick={() => reset(config?.branding)} disabled={!isDirty}>
            Reset
          </Button>
          <Button type="submit" variant="primary" disabled={!isDirty || updateMutation.isLoading}>
            {updateMutation.isLoading ? "Saving..." : "Save Changes"}
          </Button>
        </Box>

        {updateMutation.isSuccess && <Text color="success1" marginTop={2}>✓ Changes saved successfully</Text>}
        {updateMutation.isError && <Text color="critical1" marginTop={2}>Error saving changes. Please try again.</Text>}
      </form>
    </AppLayout>
  );
};

export default BrandingPage;
