import { useAppBridge } from "@saleor/app-sdk/app-bridge";
import { Box, Text, Button, Checkbox } from "@saleor/macaw-ui";
import { NextPage } from "next";
import { useRouter } from "next/router";
import { useForm, Controller, Control } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";

import { AppLayout } from "@/modules/ui/app-layout";
import { SectionCard } from "@/modules/ui/section-card";
import { trpcClient } from "@/modules/trpc/trpc-client";
import { FeaturesSchema } from "@/modules/config/schema";
import type { StorefrontConfig } from "@/modules/config/schema";

type FeaturesFormData = StorefrontConfig["features"];

interface FeatureToggleProps {
  label: string;
  description: string;
  name: keyof FeaturesFormData;
  control: Control<FeaturesFormData>;
}

function FeatureToggle({ label, description, name, control }: FeatureToggleProps) {
  return (
    <Box 
      display="flex" 
      alignItems="flex-start" 
      gap={3}
      paddingY={3}
      borderBottomWidth={1}
      borderBottomStyle="solid"
      borderColor="default2"
    >
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <Checkbox
            checked={field.value === true}
            onCheckedChange={(checked) => field.onChange(checked)}
          />
        )}
      />
      <Box>
        <Text as="label" variant="bodyStrong">{label}</Text>
        <Text as="p" variant="caption" color="default2">{description}</Text>
      </Box>
    </Box>
  );
}

const FeaturesPage: NextPage = () => {
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

  const { control, handleSubmit, reset, formState: { isDirty } } = useForm<FeaturesFormData>({
    resolver: zodResolver(FeaturesSchema),
  });

  useEffect(() => {
    if (config?.features) {
      reset(config.features);
    }
  }, [config, reset]);

  const onSubmit = async (data: FeaturesFormData) => {
    await updateMutation.mutateAsync({ channelSlug, section: "features", data });
  };

  if (!appBridgeState?.ready || isLoading) {
    return <Box display="flex" justifyContent="center" alignItems="center" height="100vh"><Text>Loading...</Text></Box>;
  }

  return (
    <AppLayout channelSlug={channelSlug} channelName={config?.store.name} activeTab="features">
      <form onSubmit={handleSubmit(onSubmit)}>
        <SectionCard title="Customer Features" description="Features that enhance the shopping experience">
          <FeatureToggle label="Wishlist" description="Allow customers to save products to a wishlist" name="wishlist" control={control} />
          <FeatureToggle label="Compare Products" description="Enable side-by-side product comparison" name="compareProducts" control={control} />
          <FeatureToggle label="Product Reviews" description="Allow customers to leave product reviews" name="productReviews" control={control} />
          <FeatureToggle label="Recently Viewed" description="Show recently viewed products section" name="recentlyViewed" control={control} />
        </SectionCard>

        <SectionCard title="Checkout Features" description="Checkout and payment options">
          <FeatureToggle label="Guest Checkout" description="Allow checkout without creating an account" name="guestCheckout" control={control} />
          <FeatureToggle label="Express Checkout" description="One-click checkout for returning customers" name="expressCheckout" control={control} />
          <FeatureToggle label="Save Payment Methods" description="Allow customers to save cards for future purchases" name="savePaymentMethods" control={control} />
        </SectionCard>

        <SectionCard title="Product Features" description="Product-related functionality">
          <FeatureToggle label="Digital Downloads" description="Support for downloadable products" name="digitalDownloads" control={control} />
          <FeatureToggle label="Subscriptions" description="Recurring product subscriptions" name="subscriptions" control={control} />
          <FeatureToggle label="Gift Cards" description="Gift card purchasing and redemption" name="giftCards" control={control} />
          <FeatureToggle label="Product Bundles" description="Group products together as bundles" name="productBundles" control={control} />
        </SectionCard>

        <SectionCard title="Marketing Features" description="Marketing and engagement tools">
          <FeatureToggle label="Newsletter" description="Email newsletter subscription" name="newsletter" control={control} />
          <FeatureToggle label="Promotional Banners" description="Display promotional banners and popups" name="promotionalBanners" control={control} />
          <FeatureToggle label="Abandoned Cart Emails" description="Send reminders for abandoned carts" name="abandonedCartEmails" control={control} />
        </SectionCard>

        <SectionCard title="Social Features" description="Social integration options">
          <FeatureToggle label="Social Login" description="Login with Google, Facebook, etc." name="socialLogin" control={control} />
          <FeatureToggle label="Share Buttons" description="Social media share buttons on products" name="shareButtons" control={control} />
          <FeatureToggle label="Instagram Feed" description="Display Instagram feed on homepage" name="instagramFeed" control={control} />
        </SectionCard>

        <Box display="flex" justifyContent="flex-end" gap={2} marginTop={4}>
          <Button type="button" variant="secondary" onClick={() => reset(config?.features)} disabled={!isDirty}>Reset</Button>
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

export default FeaturesPage;
