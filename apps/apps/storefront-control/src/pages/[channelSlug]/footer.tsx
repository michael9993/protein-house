import { useAppBridge } from "@saleor/app-sdk/app-bridge";
import { Box, Text, Button, Checkbox } from "@saleor/macaw-ui";
import { NextPage } from "next";
import { useRouter } from "next/router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";

import { AppLayout } from "@/modules/ui/app-layout";
import { SectionCard } from "@/modules/ui/section-card";
import { FormField } from "@/modules/ui/form-field";
import { trpcClient } from "@/modules/trpc/trpc-client";
import { FooterSchema } from "@/modules/config/schema";
import type { StorefrontConfig } from "@/modules/config/schema";

type FooterFormData = StorefrontConfig["footer"];

const FooterPage: NextPage = () => {
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
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<FooterFormData>({
    resolver: zodResolver(FooterSchema),
  });

  useEffect(() => {
    if (config?.footer) {
      reset(config.footer);
    }
  }, [config, reset]);

  const onSubmit = async (data: FooterFormData) => {
    setSaveStatus(null);
    await updateMutation.mutateAsync({
      channelSlug,
      section: "footer",
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
    <AppLayout channelSlug={channelSlug} channelName={config?.store.name} activeTab="footer">
      <form onSubmit={handleSubmit(onSubmit)}>
        <SectionCard 
          title="Footer Sections" 
          description="Choose which sections to display in your footer"
        >
          <Box display="flex" flexDirection="column" gap={4}>
            <Box 
              display="flex" 
              alignItems="center" 
              gap={3}
              padding={3}
              backgroundColor="default1"
              borderRadius={2}
            >
              <Controller
                name="showNewsletter"
                control={control}
                render={({ field }) => (
                  <Checkbox
                    checked={field.value === true}
                    onCheckedChange={(checked) => field.onChange(checked)}
                  />
                )}
              />
              <Box>
                <Text variant="bodyStrong">Newsletter Signup</Text>
                <Text variant="caption" color="default2">
                  Show newsletter subscription form in the footer
                </Text>
              </Box>
            </Box>

            <Box 
              display="flex" 
              alignItems="center" 
              gap={3}
              padding={3}
              backgroundColor="default1"
              borderRadius={2}
            >
              <Controller
                name="showSocialLinks"
                control={control}
                render={({ field }) => (
                  <Checkbox
                    checked={field.value === true}
                    onCheckedChange={(checked) => field.onChange(checked)}
                  />
                )}
              />
              <Box>
                <Text variant="bodyStrong">Social Media Links</Text>
                <Text variant="caption" color="default2">
                  Display social media icons (configured in Integrations)
                </Text>
              </Box>
            </Box>

            <Box 
              display="flex" 
              alignItems="center" 
              gap={3}
              padding={3}
              backgroundColor="default1"
              borderRadius={2}
            >
              <Controller
                name="showContactInfo"
                control={control}
                render={({ field }) => (
                  <Checkbox
                    checked={field.value === true}
                    onCheckedChange={(checked) => field.onChange(checked)}
                  />
                )}
              />
              <Box>
                <Text variant="bodyStrong">Contact Information</Text>
                <Text variant="caption" color="default2">
                  Show email, phone, and address in the footer
                </Text>
              </Box>
            </Box>
          </Box>
        </SectionCard>

        <SectionCard 
          title="Copyright" 
          description="Customize the copyright text in your footer"
        >
          <FormField
            label="Custom Copyright Text"
            name="copyrightText"
            register={register}
            errors={errors}
            placeholder="© 2024 Your Store Name. All rights reserved."
            description="Leave empty to use default format with store name and current year"
          />
          <Text variant="caption" color="default2" marginTop={2}>
            Default: © {new Date().getFullYear()} {config?.store.name || "Store Name"}. All rights reserved.
          </Text>
        </SectionCard>

        <Box display="flex" justifyContent="flex-end" gap={2} marginTop={4}>
          <Button 
            type="button" 
            variant="secondary" 
            onClick={() => reset(config?.footer)} 
            disabled={!isDirty}
          >
            Reset
          </Button>
          <Button 
            type="submit" 
            variant="primary" 
            disabled={!isDirty || updateMutation.isLoading}
          >
            {updateMutation.isLoading ? "Saving..." : "Save Changes"}
          </Button>
        </Box>

        {saveStatus === "success" && (
          <Text color="success1" marginTop={2}>✓ Changes saved successfully</Text>
        )}
        {saveStatus === "error" && (
          <Text color="critical1" marginTop={2}>Error saving changes. Please try again.</Text>
        )}
      </form>
    </AppLayout>
  );
};

export default FooterPage;
