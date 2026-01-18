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
import { UiSchema } from "@/modules/config/schema";
import type { StorefrontConfig } from "@/modules/config/schema";

type UiFormData = StorefrontConfig["ui"];

const borderRadiusOptions = [
  { value: "none", label: "None (0px)" },
  { value: "sm", label: "Small (4px)" },
  { value: "md", label: "Medium (8px)" },
  { value: "lg", label: "Large (16px)" },
  { value: "full", label: "Full (9999px)" },
];

const toastPositionOptions = [
  { value: "top-right", label: "Top Right" },
  { value: "top-left", label: "Top Left" },
  { value: "top-center", label: "Top Center" },
  { value: "bottom-right", label: "Bottom Right" },
  { value: "bottom-left", label: "Bottom Left" },
  { value: "bottom-center", label: "Bottom Center" },
];

const iconStyleOptions = [
  { value: "outline", label: "Outline" },
  { value: "solid", label: "Solid" },
  { value: "mini", label: "Mini" },
];

const UiComponentsPage: NextPage = () => {
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
  } = useForm<UiFormData>({
    resolver: zodResolver(UiSchema),
  });

  useEffect(() => {
    if (config?.ui) {
      reset(config.ui);
    }
  }, [config, reset]);

  const onSubmit = async (data: UiFormData) => {
    await updateMutation.mutateAsync({
      channelSlug,
      section: "ui",
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
    <AppLayout channelSlug={channelSlug} channelName={config?.store.name} activeTab="ui-components">
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Buttons Section */}
        <SectionCard title="Buttons" description="Customize button appearance across your store">
          <Box display="grid" __gridTemplateColumns="1fr 1fr" gap={4}>
            <SelectField
              label="Border Radius"
              name="buttons.borderRadius"
              register={register}
              errors={errors}
              options={borderRadiusOptions}
              description="Roundness of button corners"
            />
          </Box>

          <Box marginTop={6}>
            <Text variant="heading" as="h4" marginBottom={4}>Primary Button</Text>
            <Box display="grid" __gridTemplateColumns="1fr 1fr" gap={4}>
              <FormField
                label="Background Color"
                name="buttons.primary.backgroundColor"
                register={register}
                errors={errors}
                type="color"
                description="Leave empty to use primary brand color"
              />
              <FormField
                label="Text Color"
                name="buttons.primary.textColor"
                register={register}
                errors={errors}
                type="color"
                description="Button text color"
              />
              <FormField
                label="Hover Background"
                name="buttons.primary.hoverBackgroundColor"
                register={register}
                errors={errors}
                type="color"
                description="Background on hover"
              />
            </Box>
          </Box>

          <Box marginTop={6}>
            <Text variant="heading" as="h4" marginBottom={4}>Secondary Button</Text>
            <Box display="grid" __gridTemplateColumns="1fr 1fr" gap={4}>
              <FormField
                label="Background Color"
                name="buttons.secondary.backgroundColor"
                register={register}
                errors={errors}
                type="color"
                description="Usually transparent"
              />
              <FormField
                label="Text Color"
                name="buttons.secondary.textColor"
                register={register}
                errors={errors}
                type="color"
              />
              <FormField
                label="Border Color"
                name="buttons.secondary.borderColor"
                register={register}
                errors={errors}
                type="color"
              />
            </Box>
          </Box>

          <Box marginTop={6}>
            <Text variant="heading" as="h4" marginBottom={4}>Outline Button</Text>
            <Box display="grid" __gridTemplateColumns="1fr 1fr" gap={4}>
              <FormField
                label="Text Color"
                name="buttons.outline.textColor"
                register={register}
                errors={errors}
                type="color"
                description="Usually matches primary color"
              />
              <FormField
                label="Border Color"
                name="buttons.outline.borderColor"
                register={register}
                errors={errors}
                type="color"
              />
            </Box>
          </Box>
        </SectionCard>

        {/* Badges Section */}
        <SectionCard title="Badges" description="Product badges and tags styling">
          <Box display="grid" __gridTemplateColumns="1fr 1fr" gap={4}>
            <SelectField
              label="Border Radius"
              name="badges.borderRadius"
              register={register}
              errors={errors}
              options={borderRadiusOptions}
            />
          </Box>

          <Box marginTop={6}>
            <Text variant="heading" as="h4" marginBottom={4}>Sale Badge</Text>
            <Box display="grid" __gridTemplateColumns="1fr 1fr" gap={4}>
              <FormField
                label="Background Color"
                name="badges.sale.backgroundColor"
                register={register}
                errors={errors}
                type="color"
              />
              <FormField
                label="Text Color"
                name="badges.sale.textColor"
                register={register}
                errors={errors}
                type="color"
              />
            </Box>
          </Box>

          <Box marginTop={6}>
            <Text variant="heading" as="h4" marginBottom={4}>New Badge</Text>
            <Box display="grid" __gridTemplateColumns="1fr 1fr" gap={4}>
              <FormField
                label="Background Color"
                name="badges.new.backgroundColor"
                register={register}
                errors={errors}
                type="color"
              />
              <FormField
                label="Text Color"
                name="badges.new.textColor"
                register={register}
                errors={errors}
                type="color"
              />
            </Box>
          </Box>

          <Box marginTop={6}>
            <Text variant="heading" as="h4" marginBottom={4}>Out of Stock Badge</Text>
            <Box display="grid" __gridTemplateColumns="1fr 1fr" gap={4}>
              <FormField
                label="Background Color"
                name="badges.outOfStock.backgroundColor"
                register={register}
                errors={errors}
                type="color"
              />
              <FormField
                label="Text Color"
                name="badges.outOfStock.textColor"
                register={register}
                errors={errors}
                type="color"
              />
            </Box>
          </Box>
        </SectionCard>

        {/* Inputs Section */}
        <SectionCard title="Form Inputs" description="Input field styling">
          <Box display="grid" __gridTemplateColumns="1fr 1fr" gap={4}>
            <SelectField
              label="Border Radius"
              name="inputs.borderRadius"
              register={register}
              errors={errors}
              options={borderRadiusOptions}
            />
            <FormField
              label="Border Color"
              name="inputs.borderColor"
              register={register}
              errors={errors}
              type="color"
            />
            <FormField
              label="Focus Border Color"
              name="inputs.focusBorderColor"
              register={register}
              errors={errors}
              type="color"
              description="Border color when focused"
            />
            <FormField
              label="Focus Ring Color"
              name="inputs.focusRingColor"
              register={register}
              errors={errors}
              type="color"
              description="Ring/glow color when focused"
            />
          </Box>
        </SectionCard>

        {/* Product Cards Section */}
        <SectionCard title="Product Cards" description="Product card appearance">
          <Box display="grid" __gridTemplateColumns="1fr 1fr" gap={4}>
            <SelectField
              label="Border Radius"
              name="productCard.borderRadius"
              register={register}
              errors={errors}
              options={borderRadiusOptions}
            />
            <SelectField
              label="Shadow"
              name="productCard.shadow"
              register={register}
              errors={errors}
              options={[
                { value: "none", label: "None" },
                { value: "sm", label: "Small" },
                { value: "md", label: "Medium" },
                { value: "lg", label: "Large" },
              ]}
            />
            <SelectField
              label="Hover Effect"
              name="productCard.hoverEffect"
              register={register}
              errors={errors}
              options={[
                { value: "none", label: "None" },
                { value: "lift", label: "Lift up" },
                { value: "scale", label: "Scale up" },
                { value: "shadow", label: "Shadow increase" },
              ]}
            />
          </Box>
        </SectionCard>

        {/* Toasts Section */}
        <SectionCard title="Toast Notifications" description="Notification styling">
          <Box display="grid" __gridTemplateColumns="1fr 1fr" gap={4}>
            <SelectField
              label="Position"
              name="toasts.position"
              register={register}
              errors={errors}
              options={toastPositionOptions}
            />
            <FormField
              label="Duration (ms)"
              name="toasts.duration"
              register={register}
              errors={errors}
              type="number"
              description="How long toasts stay visible"
            />
            <SelectField
              label="Border Radius"
              name="toasts.borderRadius"
              register={register}
              errors={errors}
              options={borderRadiusOptions}
            />
          </Box>

          <Box marginTop={6}>
            <Text variant="heading" as="h4" marginBottom={4}>Toast Colors</Text>
            <Box display="grid" __gridTemplateColumns="1fr 1fr 1fr" gap={4}>
              <FormField
                label="Success Background"
                name="toasts.successColor"
                register={register}
                errors={errors}
                type="color"
              />
              <FormField
                label="Error Background"
                name="toasts.errorColor"
                register={register}
                errors={errors}
                type="color"
              />
              <FormField
                label="Info Background"
                name="toasts.infoColor"
                register={register}
                errors={errors}
                type="color"
              />
            </Box>
          </Box>
        </SectionCard>

        {/* Icons Section */}
        <SectionCard title="Icons" description="Icon styling preferences">
          <Box display="grid" __gridTemplateColumns="1fr 1fr" gap={4}>
            <SelectField
              label="Icon Style"
              name="icons.style"
              register={register}
              errors={errors}
              options={iconStyleOptions}
            />
            <FormField
              label="Default Color"
              name="icons.defaultColor"
              register={register}
              errors={errors}
              type="color"
              description="Default icon color"
            />
          </Box>
        </SectionCard>

        {/* Submit */}
        <Box display="flex" justifyContent="flex-end" gap={4} marginTop={6}>
          <Button
            type="button"
            variant="tertiary"
            onClick={() => reset(config?.ui)}
            disabled={!isDirty}
          >
            Reset
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={!isDirty || updateMutation.isPending}
          >
            {updateMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </Box>

        {/* Status Messages */}
        {updateMutation.isSuccess && (
          <Text color="success1" marginTop={2}>
            Changes saved successfully
          </Text>
        )}
        {updateMutation.isError && (
          <Text color="critical1" marginTop={2}>
            Error saving changes. Please try again.
          </Text>
        )}
      </form>
    </AppLayout>
  );
};

export default UiComponentsPage;
