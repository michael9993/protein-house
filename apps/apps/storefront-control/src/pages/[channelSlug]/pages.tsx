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
import { PagesSchema } from "@/modules/config/schema";
import type { StorefrontConfig } from "@/modules/config/schema";

type PagesFormData = StorefrontConfig["pages"];

interface PageToggleProps {
  label: string;
  description: string;
  name: keyof PagesFormData;
  control: Control<PagesFormData>;
}

function PageToggle({ label, description, name, control }: PageToggleProps) {
  return (
    <Box 
      display="flex" 
      alignItems="flex-start" 
      gap={3}
      padding={4}
      backgroundColor="default1"
      borderRadius={4}
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

const PagesPage: NextPage = () => {
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

  const { control, handleSubmit, reset, formState: { isDirty } } = useForm<PagesFormData>({
    resolver: zodResolver(PagesSchema),
  });

  useEffect(() => {
    if (config?.pages) {
      reset(config.pages);
    }
  }, [config, reset]);

  const onSubmit = async (data: PagesFormData) => {
    await updateMutation.mutateAsync({ channelSlug, section: "pages", data });
  };

  if (!appBridgeState?.ready || isLoading) {
    return <Box display="flex" justifyContent="center" alignItems="center" height="100vh"><Text>Loading...</Text></Box>;
  }

  return (
    <AppLayout channelSlug={channelSlug} channelName={config?.store.name} activeTab="pages">
      <form onSubmit={handleSubmit(onSubmit)}>
        <SectionCard title="Information Pages" description="Enable or disable static content pages">
          <Box display="grid" __gridTemplateColumns="1fr 1fr" gap={4}>
            <PageToggle label="About Us" description="Company information and story" name="aboutUs" control={control} />
            <PageToggle label="Contact" description="Contact form and information" name="contact" control={control} />
            <PageToggle label="FAQ" description="Frequently asked questions" name="faq" control={control} />
            <PageToggle label="Blog" description="News and articles section" name="blog" control={control} />
          </Box>
        </SectionCard>

        <SectionCard title="Legal Pages" description="Required legal and policy pages">
          <Box display="grid" __gridTemplateColumns="1fr 1fr" gap={4}>
            <PageToggle label="Privacy Policy" description="Data privacy information" name="privacyPolicy" control={control} />
            <PageToggle label="Terms of Service" description="Terms and conditions" name="termsOfService" control={control} />
            <PageToggle label="Shipping Policy" description="Shipping information" name="shippingPolicy" control={control} />
            <PageToggle label="Return Policy" description="Returns and refunds" name="returnPolicy" control={control} />
          </Box>
        </SectionCard>

        <Box display="flex" justifyContent="flex-end" gap={2} marginTop={4}>
          <Button type="button" variant="secondary" onClick={() => reset(config?.pages)} disabled={!isDirty}>Reset</Button>
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

export default PagesPage;
