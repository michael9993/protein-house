import { useAppBridge } from "@saleor/app-sdk/app-bridge";
import { Box, Text, Button } from "@saleor/macaw-ui";
import { NextPage } from "next";
import { useRouter } from "next/router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";

import { AppLayout } from "@/modules/ui/app-layout";
import { SectionCard } from "@/modules/ui/section-card";
import { FormField } from "@/modules/ui/form-field";
import { trpcClient } from "@/modules/trpc/trpc-client";
import { SeoSchema } from "@/modules/config/schema";
import type { StorefrontConfig } from "@/modules/config/schema";

type SeoFormData = StorefrontConfig["seo"];

const SeoPage: NextPage = () => {
  const router = useRouter();
  const { channelSlug } = router.query as { channelSlug: string };
  const { appBridgeState } = useAppBridge();

  const { data: config, isLoading, refetch } = trpcClient.config.getConfig.useQuery(
    { channelSlug },
    { enabled: !!channelSlug && !!appBridgeState?.ready }
  );

  const updateMutation = trpcClient.config.updateSection.useMutation({
    onSuccess: () => refetch(),
  });

  const { register, handleSubmit, reset, watch, formState: { errors, isDirty } } = useForm<SeoFormData>({
    resolver: zodResolver(SeoSchema),
  });

  const titleTemplate = watch("titleTemplate");
  const defaultTitle = watch("defaultTitle");

  useEffect(() => {
    if (config?.seo) {
      reset(config.seo);
    }
  }, [config, reset]);

  const onSubmit = async (data: SeoFormData) => {
    await updateMutation.mutateAsync({ channelSlug, section: "seo", data });
  };

  if (!appBridgeState?.ready || isLoading) {
    return <Box display="flex" justifyContent="center" alignItems="center" height="100vh"><Text>Loading...</Text></Box>;
  }

  return (
    <AppLayout channelSlug={channelSlug} channelName={config?.store.name} activeTab="seo">
      <form onSubmit={handleSubmit(onSubmit)}>
        <SectionCard title="Page Titles" description="Configure how page titles appear in search results">
          <FormField
            label="Title Template"
            name="titleTemplate"
            register={register}
            errors={errors}
            placeholder="%s | Your Store Name"
            description="Use %s as placeholder for page-specific title. Example: 'Product Name | Your Store'"
          />
          
          {/* Preview */}
          <Box backgroundColor="default1" padding={4} borderRadius={4} marginTop={2} marginBottom={4}>
            <Text variant="caption" color="default2" marginBottom={2}>Preview:</Text>
            <Text variant="body" style={{ color: "#1a0dab" }}>
              {titleTemplate?.replace("%s", "Running Shoes") || "Running Shoes | Your Store Name"}
            </Text>
            <Text variant="caption" color="success1" style={{ display: "block", marginTop: "4px" }}>
              www.yourstore.com/products/running-shoes
            </Text>
          </Box>

          <FormField
            label="Default Title"
            name="defaultTitle"
            register={register}
            errors={errors}
            placeholder="Your Store Name - Online Shopping"
            description="Used when no page-specific title is set"
          />
        </SectionCard>

        <SectionCard title="Meta Description" description="Default description for search engines">
          <FormField
            label="Default Description"
            name="defaultDescription"
            register={register}
            errors={errors}
            type="textarea"
            placeholder="Shop the best products at Your Store Name. Free shipping on orders over $50."
            description="Recommended: 150-160 characters"
          />
        </SectionCard>

        <SectionCard title="Social Sharing" description="Open Graph and Twitter card settings">
          <FormField
            label="Default OG Image URL"
            name="defaultImage"
            register={register}
            errors={errors}
            type="url"
            placeholder="/og-image.jpg"
            description="Image shown when your site is shared. Recommended: 1200x630px"
          />
          <FormField
            label="Twitter Handle"
            name="twitterHandle"
            register={register}
            errors={errors}
            placeholder="@yourstore"
            description="Your Twitter/X username for attribution"
          />

          {/* OG Preview */}
          <Box marginTop={4}>
            <Text variant="caption" color="default2" marginBottom={2}>Social Share Preview:</Text>
            <Box 
              backgroundColor="default1" 
              borderRadius={4} 
              overflow="hidden"
              __maxWidth="500px"
              borderWidth={1}
              borderStyle="solid"
              borderColor="default2"
            >
              <Box 
                __height="150px" 
                backgroundColor="default2" 
                display="flex" 
                alignItems="center" 
                justifyContent="center"
              >
                <Text color="default2" variant="caption">OG Image Preview</Text>
              </Box>
              <Box padding={3}>
                <Text variant="caption" color="default2">yourstore.com</Text>
                <Text variant="bodyStrong" marginTop={1}>{defaultTitle || "Your Store Name - Online Shopping"}</Text>
                <Text variant="caption" color="default2" marginTop={1}>
                  {config?.seo?.defaultDescription?.slice(0, 100) || "Shop the best products..."}
                </Text>
              </Box>
            </Box>
          </Box>
        </SectionCard>

        <Box display="flex" justifyContent="flex-end" gap={2} marginTop={4}>
          <Button type="button" variant="secondary" onClick={() => reset(config?.seo)} disabled={!isDirty}>Reset</Button>
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

export default SeoPage;
