import { useAppBridge } from "@saleor/app-sdk/app-bridge";
import { Box, Text, Button, Checkbox } from "@saleor/macaw-ui";
import { NextPage } from "next";
import { useRouter } from "next/router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { z } from "zod";

import { AppLayout } from "@/modules/ui/app-layout";
import { SectionCard } from "@/modules/ui/section-card";
import { FormField } from "@/modules/ui/form-field";
import { trpcClient } from "@/modules/trpc/trpc-client";
import { FiltersSchema, QuickFiltersSchema } from "@/modules/config/schema";

// Combined form for filters + quickFilters
const FiltersPageSchema = z.object({
  filters: FiltersSchema,
  quickFilters: QuickFiltersSchema,
});

type FiltersPageFormData = z.infer<typeof FiltersPageSchema>;

const FiltersPage: NextPage = () => {
  const router = useRouter();
  const { channelSlug } = router.query as { channelSlug: string };
  const { appBridgeState } = useAppBridge();

  const utils = trpcClient.useUtils();
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  
  const { data: config, isLoading } = trpcClient.config.getConfig.useQuery(
    { channelSlug },
    { 
      enabled: !!channelSlug && !!appBridgeState?.ready,
      refetchOnWindowFocus: false, // Prevent refetch when user switches tabs
    }
  );

  const updateMutation = trpcClient.config.updateMultipleSections.useMutation();

  const { control, register, handleSubmit, reset, formState: { isDirty } } = useForm<FiltersPageFormData>({
    resolver: zodResolver(FiltersPageSchema),
  });

  useEffect(() => {
    if (config) {
      console.log("[FiltersPage] Resetting form with config:", {
        filtersEnabled: config.filters.enabled,
        priceFilterEnabled: config.filters.priceFilter.enabled,
        quickFiltersEnabled: config.quickFilters.enabled,
      });
      reset({
        filters: config.filters,
        quickFilters: config.quickFilters,
      });
    }
  }, [config, reset]);

  const onSubmit = async (data: FiltersPageFormData) => {
    console.log("[FiltersPage] Submitting data:", JSON.stringify(data, null, 2));
    setSaveStatus("saving");
    setSaveError(null);
    
    try {
      // Use single mutation to update both sections atomically
      const result = await updateMutation.mutateAsync({ 
        channelSlug, 
        updates: {
          filters: data.filters,
          quickFilters: data.quickFilters,
        }
      });
      console.log("[FiltersPage] Save result:", result);
      
      // Invalidate the cache to force refetch
      await utils.config.getConfig.invalidate({ channelSlug });
      
      // Reset form to mark as not dirty after successful save
      reset(data);
      
      setSaveStatus("success");
      
      // Reset success message after 3 seconds
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch (error) {
      console.error("[FiltersPage] Error saving:", error);
      setSaveStatus("error");
      setSaveError(error instanceof Error ? error.message : "Unknown error");
    }
  };

  const isSubmitting = saveStatus === "saving";

  if (!appBridgeState?.ready || isLoading) {
    return <Box display="flex" justifyContent="center" alignItems="center" height="100vh"><Text>Loading...</Text></Box>;
  }

  return (
    <AppLayout channelSlug={channelSlug} channelName={config?.store.name} activeTab="filters">
      <form onSubmit={handleSubmit(onSubmit)}>
        <SectionCard title="Product Filters" description="Configure which filters appear in product listings">
          <Box display="flex" alignItems="center" gap={3} marginBottom={4} paddingBottom={4} borderBottomWidth={1} borderBottomStyle="solid" borderColor="default2">
            <Controller
              name="filters.enabled"
              control={control}
              render={({ field }) => (
                <Checkbox checked={field.value === true} onCheckedChange={(checked) => field.onChange(checked)} />
              )}
            />
            <Box>
              <Text variant="bodyStrong">Enable Product Filters</Text>
              <Text variant="caption" color="default2">Show filter sidebar on product listing pages</Text>
            </Box>
          </Box>

          <Text as="h4" variant="bodyStrong" marginBottom={3}>Individual Filters</Text>
          <Box display="grid" __gridTemplateColumns="1fr 1fr" gap={3}>
            <Box display="flex" alignItems="center" gap={3} padding={3} backgroundColor="default1" borderRadius={2}>
              <Controller
                name="filters.priceFilter.enabled"
                control={control}
                render={({ field }) => (
                  <Checkbox checked={field.value === true} onCheckedChange={(checked) => field.onChange(checked)} />
                )}
              />
              <Box>
                <Text variant="body">Price Filter</Text>
                <Box display="flex" alignItems="center" gap={2} marginTop={1}>
                  <Controller
                    name="filters.priceFilter.showQuickButtons"
                    control={control}
                    render={({ field }) => (
                      <Checkbox checked={field.value === true} onCheckedChange={(checked) => field.onChange(checked)} />
                    )}
                  />
                  <Text variant="caption" color="default2">Show quick buttons</Text>
                </Box>
              </Box>
            </Box>

            <Box display="flex" alignItems="center" gap={3} padding={3} backgroundColor="default1" borderRadius={2}>
              <Controller
                name="filters.ratingFilter.enabled"
                control={control}
                render={({ field }) => (
                  <Checkbox checked={field.value === true} onCheckedChange={(checked) => field.onChange(checked)} />
                )}
              />
              <Text variant="body">Rating Filter</Text>
            </Box>

            <Box display="flex" alignItems="center" gap={3} padding={3} backgroundColor="default1" borderRadius={2}>
              <Controller
                name="filters.brandFilter.enabled"
                control={control}
                render={({ field }) => (
                  <Checkbox checked={field.value === true} onCheckedChange={(checked) => field.onChange(checked)} />
                )}
              />
              <Text variant="body">Brand Filter</Text>
            </Box>

            <Box display="flex" alignItems="center" gap={3} padding={3} backgroundColor="default1" borderRadius={2}>
              <Controller
                name="filters.sizeFilter.enabled"
                control={control}
                render={({ field }) => (
                  <Checkbox checked={field.value === true} onCheckedChange={(checked) => field.onChange(checked)} />
                )}
              />
              <Text variant="body">Size Filter</Text>
            </Box>

            <Box display="flex" alignItems="center" gap={3} padding={3} backgroundColor="default1" borderRadius={2}>
              <Controller
                name="filters.colorFilter.enabled"
                control={control}
                render={({ field }) => (
                  <Checkbox checked={field.value === true} onCheckedChange={(checked) => field.onChange(checked)} />
                )}
              />
              <Text variant="body">Color Filter</Text>
            </Box>

            <Box display="flex" alignItems="center" gap={3} padding={3} backgroundColor="default1" borderRadius={2}>
              <Controller
                name="filters.categoryFilter.enabled"
                control={control}
                render={({ field }) => (
                  <Checkbox checked={field.value === true} onCheckedChange={(checked) => field.onChange(checked)} />
                )}
              />
              <Text variant="body">Category Filter</Text>
            </Box>

            <Box display="flex" alignItems="center" gap={3} padding={3} backgroundColor="default1" borderRadius={2}>
              <Controller
                name="filters.collectionFilter.enabled"
                control={control}
                render={({ field }) => (
                  <Checkbox checked={field.value === true} onCheckedChange={(checked) => field.onChange(checked)} />
                )}
              />
              <Text variant="body">Collection Filter</Text>
            </Box>

            <Box display="flex" alignItems="center" gap={3} padding={3} backgroundColor="default1" borderRadius={2}>
              <Controller
                name="filters.stockFilter.enabled"
                control={control}
                render={({ field }) => (
                  <Checkbox checked={field.value === true} onCheckedChange={(checked) => field.onChange(checked)} />
                )}
              />
              <Text variant="body">Stock Filter</Text>
            </Box>
          </Box>
        </SectionCard>

        <SectionCard title="Quick Filters" description="Visual filter cards at the top of product listings">
          <Box display="flex" alignItems="center" gap={3} marginBottom={4} paddingBottom={4} borderBottomWidth={1} borderBottomStyle="solid" borderColor="default2">
            <Controller
              name="quickFilters.enabled"
              control={control}
              render={({ field }) => (
                <Checkbox checked={field.value === true} onCheckedChange={(checked) => field.onChange(checked)} />
              )}
            />
            <Box>
              <Text variant="bodyStrong">Enable Quick Filters</Text>
              <Text variant="caption" color="default2">Show visual filter cards above product grid</Text>
            </Box>
          </Box>

          <Text as="h4" variant="bodyStrong" marginBottom={3}>Show Quick Filters For</Text>
          <Box display="flex" flexDirection="column" gap={3} marginBottom={4}>
            <Box display="flex" alignItems="center" gap={3}>
              <Controller
                name="quickFilters.showCategories"
                control={control}
                render={({ field }) => (
                  <Checkbox checked={field.value === true} onCheckedChange={(checked) => field.onChange(checked)} />
                )}
              />
              <Text>Categories</Text>
            </Box>
            <Box display="flex" alignItems="center" gap={3}>
              <Controller
                name="quickFilters.showCollections"
                control={control}
                render={({ field }) => (
                  <Checkbox checked={field.value === true} onCheckedChange={(checked) => field.onChange(checked)} />
                )}
              />
              <Text>Collections</Text>
            </Box>
            <Box display="flex" alignItems="center" gap={3}>
              <Controller
                name="quickFilters.showBrands"
                control={control}
                render={({ field }) => (
                  <Checkbox checked={field.value === true} onCheckedChange={(checked) => field.onChange(checked)} />
                )}
              />
              <Text>Brands</Text>
            </Box>
          </Box>

          <Text as="h4" variant="bodyStrong" marginBottom={3}>Display Limits</Text>
          <Box display="grid" __gridTemplateColumns="1fr 1fr 1fr" gap={4} marginBottom={6}>
            <FormField
              label="Category Limit"
              name="quickFilters.categoryLimit"
              register={register}
              type="number"
              placeholder="8"
              description="Max categories to show"
            />
            <FormField
              label="Collection Limit"
              name="quickFilters.collectionLimit"
              register={register}
              type="number"
              placeholder="6"
              description="Max collections to show"
            />
            <FormField
              label="Brand Limit"
              name="quickFilters.brandLimit"
              register={register}
              type="number"
              placeholder="6"
              description="Max brands to show"
            />
          </Box>

          <Text as="h4" variant="bodyStrong" marginBottom={3}>Shop All Button Style</Text>
          <Box display="grid" __gridTemplateColumns="1fr 1fr" gap={4}>
            <FormField
              label="Background Color"
              name="quickFilters.style.shopAllButtonBackgroundColor"
              register={register}
              placeholder="#000000"
              description="Leave empty to use theme primary color"
            />
            <FormField
              label="Text Color"
              name="quickFilters.style.shopAllButtonTextColor"
              register={register}
              placeholder="#FFFFFF"
              description="Leave empty to use white"
            />
            <FormField
              label="Hover Background Color"
              name="quickFilters.style.shopAllButtonHoverBackgroundColor"
              register={register}
              placeholder="#333333"
              description="Leave empty for auto darken"
            />
            <FormField
              label="Border Color"
              name="quickFilters.style.shopAllButtonBorderColor"
              register={register}
              placeholder="#000000"
              description="Leave empty for no border"
            />
          </Box>
        </SectionCard>

        <Box display="flex" justifyContent="flex-end" gap={2} marginTop={4}>
          <Button type="button" variant="secondary" onClick={() => reset({ filters: config?.filters, quickFilters: config?.quickFilters })} disabled={!isDirty}>Reset</Button>
          <Button type="submit" variant="primary" disabled={!isDirty || isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
        </Box>

        {saveStatus === "success" && <Text color="success1" marginTop={2}>✓ Changes saved successfully</Text>}
        {saveStatus === "error" && <Text color="critical1" marginTop={2}>Error saving changes: {saveError || "Unknown error. Check console for details."}</Text>}
      </form>
    </AppLayout>
  );
};

export default FiltersPage;
