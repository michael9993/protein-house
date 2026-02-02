import React from "react";
import { useAppBridge } from "@saleor/app-sdk/app-bridge";
import { NextPage } from "next";
import { useRouter } from "next/router";
import { useForm, type Path } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";

import { AppLayout } from "@/modules/ui/app-layout";
import { SectionCard } from "@/modules/ui/section-card";
import { FormField, SelectField, CheckboxField } from "@/modules/ui/form-field";
import { StickySaveBar } from "@/modules/ui/sticky-save-bar";
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
      <div
        style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}
      >
        <span>Loading...</span>
      </div>
    );
  }

  return (
    <AppLayout channelSlug={channelSlug} channelName={config?.store.name} activeTab="ui-components">
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Buttons Section */}
        <SectionCard
          id="ui-buttons"
          title="Buttons"
          description="Customize button appearance across your store"
          keywords={["buttons", "primary", "secondary", "outline"]}
        >
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <SelectField
              label="Border Radius"
              name="buttons.borderRadius"
              register={register}
              options={borderRadiusOptions}
              description="Roundness of button corners"
            />
          </div>

          <div style={{ marginTop: "48px" }}>
            <h4
              style={{
                fontSize: "16px",
                fontWeight: "bold",
                marginBottom: "24px",
                margin: "0 0 24px 0",
              }}
            >
              Primary Button
            </h4>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
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
            </div>
          </div>

          <div style={{ marginTop: "48px" }}>
            <h4
              style={{
                fontSize: "16px",
                fontWeight: "bold",
                marginBottom: "24px",
                margin: "0 0 24px 0",
              }}
            >
              Secondary Button
            </h4>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
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
            </div>
          </div>

          <div style={{ marginTop: "48px" }}>
            <h4
              style={{
                fontSize: "16px",
                fontWeight: "bold",
                marginBottom: "24px",
                margin: "0 0 24px 0",
              }}
            >
              Outline Button
            </h4>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
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
            </div>
          </div>
        </SectionCard>

        {/* Badges Section */}
        <SectionCard
          id="ui-badges"
          title="Badges"
          description="Product badges and tags styling"
          keywords={["badges", "sale", "new", "discount"]}
          icon="🏷️"
        >
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <SelectField
              label="Border Radius"
              name={"badges.new.borderRadius" as Path<UiFormData>}
              register={register}
              options={borderRadiusOptions}
            />
          </div>

          <div style={{ marginTop: "48px" }}>
            <h4
              style={{
                fontSize: "16px",
                fontWeight: "bold",
                marginBottom: "24px",
                margin: "0 0 24px 0",
              }}
            >
              Sale Badge
            </h4>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
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
            </div>
          </div>

          <div style={{ marginTop: "48px" }}>
            <h4
              style={{
                fontSize: "16px",
                fontWeight: "bold",
                marginBottom: "24px",
                margin: "0 0 24px 0",
              }}
            >
              New Badge
            </h4>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
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
            </div>
          </div>

          <div style={{ marginTop: "48px" }}>
            <h4
              style={{
                fontSize: "16px",
                fontWeight: "bold",
                marginBottom: "24px",
                margin: "0 0 24px 0",
              }}
            >
              Out of Stock Badge
            </h4>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
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
            </div>
          </div>
        </SectionCard>

        {/* Inputs Section */}
        <SectionCard
          id="ui-inputs"
          title="Form Inputs"
          description="Input field styling"
          keywords={["inputs", "fields", "focus"]}
        >
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <SelectField
              label="Border Radius"
              name="inputs.borderRadius"
              register={register}
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
          </div>
        </SectionCard>

        {/* Product Cards Section */}
        <SectionCard
          id="ui-product-cards"
          title="Product Cards"
          description="Product card appearance"
          keywords={["product cards", "quick view", "wishlist"]}
          icon="🃏"
        >
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <SelectField
              label="Border Radius"
              name="productCard.borderRadius"
              register={register}
              options={borderRadiusOptions}
            />
            <SelectField
              label="Shadow"
              name="productCard.shadow"
              register={register}
              options={[
                { value: "none", label: "None" },
                { value: "sm", label: "Small" },
                { value: "md", label: "Medium" },
                { value: "lg", label: "Large" },
              ]}
            />
            <SelectField
              label="Hover Effect"
              name={"productCard.hoverEffect" as Path<UiFormData>}
              register={register}
              options={[
                { value: "none", label: "None" },
                { value: "lift", label: "Lift up" },
                { value: "scale", label: "Scale up" },
                { value: "shadow", label: "Shadow increase" },
              ]}
            />
            <CheckboxField
              label="Show Quick add button"
              name="productCard.showQuickView"
              register={register}
              description="Show Quick add button on product cards (opens product in modal)"
            />
          </div>
        </SectionCard>

        {/* Cart Drawer Section */}
        <SectionCard
          id="ui-cart"
          title="Cart Drawer"
          description="Customize the cart drawer appearance and behavior"
          keywords={["cart", "drawer", "position", "display"]}
          icon="🛒"
        >
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <SelectField
              label="Display Mode"
              name="cart.displayMode"
              register={register}
              options={[
                { value: "drawer", label: "Drawer (Slide-in)" },
                { value: "page", label: "Page (Full Cart Page)" },
              ]}
              description="How the cart is displayed when clicking cart icon"
            />
            <SelectField
              label="Drawer Position"
              name="cart.drawerSide"
              register={register}
              options={[
                { value: "right", label: "Right" },
                { value: "left", label: "Left" },
              ]}
              description="Side of the screen where the drawer appears"
            />
            <CheckboxField
              label="Show delete text"
              name={"cart.showDeleteText" as Path<UiFormData>}
              register={register}
              description="Show 'Delete' label next to trash icon (off = icon only)"
            />
            <CheckboxField
              label="Show Save for later"
              name={"cart.showSaveForLater" as Path<UiFormData>}
              register={register}
              description="Show 'Save for later' / 'Move to cart' per line item"
            />
          </div>
        </SectionCard>

        {/* Toasts Section */}
        <SectionCard
          id="ui-toasts"
          title="Toast Notifications"
          description="Notification styling"
          keywords={["toast", "notifications", "alerts"]}
        >
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <SelectField
              label="Position"
              name="toasts.position"
              register={register}
              options={toastPositionOptions}
            />
            <FormField
              label="Duration (ms)"
              name={"toasts.duration" as Path<UiFormData>}
              register={register}
              errors={errors}
              type="number"
              description="How long toasts stay visible"
            />
            <SelectField
              label="Border Radius"
              name="toasts.borderRadius"
              register={register}
              options={borderRadiusOptions}
            />
          </div>

          <div style={{ marginTop: "48px" }}>
            <h4
              style={{
                fontSize: "16px",
                fontWeight: "bold",
                marginBottom: "24px",
                margin: "0 0 24px 0",
              }}
            >
              Toast Colors
            </h4>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
              <FormField
                label="Success Background"
                name="toasts.success"
                register={register}
                errors={errors}
                type="color"
              />
              <FormField
                label="Error Background"
                name="toasts.error"
                register={register}
                type="color"
              />
              <FormField
                label="Info Background"
                name="toasts.info"
                register={register}
                type="color"
              />
            </div>
          </div>
        </SectionCard>

        {/* Icons Section */}
        <SectionCard
          id="ui-icons"
          title="Icons"
          description="Icon styling preferences"
          keywords={["icons", "outline", "solid"]}
          icon="🎨"
        >
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <SelectField
              label="Icon Style"
              name="icons.style"
              register={register}
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
          </div>
        </SectionCard>

        <StickySaveBar
          isDirty={isDirty}
          isLoading={updateMutation.isLoading}
          isSuccess={updateMutation.isSuccess}
          isError={updateMutation.isError}
          onReset={() => reset(config?.ui)}
          onSubmit={handleSubmit(onSubmit)}
        />
      </form>
    </AppLayout>
  );
};

export async function getServerSideProps() {
  return { props: {} };
}

export default UiComponentsPage;
