import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import type { Control, FieldErrors, UseFormRegister, UseFormWatch } from "react-hook-form";
import { z } from "zod";
import { Palette, Component, Moon, Paintbrush } from "lucide-react";

import { AppShell } from "@/components/layout/AppShell";
import { SaveBar } from "@/components/layout/SaveBar";
import { FormField } from "@/components/forms/FormField";
import { FormSelect } from "@/components/forms/FormSelect";
import { FormSwitch } from "@/components/forms/FormSwitch";
import { FormSlider } from "@/components/forms/FormSlider";
import { FormRadioCards } from "@/components/forms/FormRadioCards";
import { FormColorPicker } from "@/components/forms/FormColorPicker";
import { FormSection } from "@/components/forms/FormSection";
import { FieldGroup } from "@/components/shared/FieldGroup";
import { LoadingState } from "@/components/shared/LoadingState";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useConfigPage } from "@/hooks/useConfigPage";
import { BrandingSchema, UiSchema, DarkModeSchema, DesignTokensSchema } from "@/modules/config/schema";

// ---------------------------------------------------------------------------
// Schema & types
// ---------------------------------------------------------------------------

const DesignFormSchema = z.object({
  branding: BrandingSchema,
  ui: UiSchema,
  darkMode: DarkModeSchema,
  design: DesignTokensSchema,
});

type DesignFormData = z.infer<typeof DesignFormSchema>;

// ---------------------------------------------------------------------------
// Reusable option arrays
// ---------------------------------------------------------------------------

const FONT_SIZE_OPTIONS = [
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
];

const BORDER_RADIUS_OPTIONS = [
  { value: "none", label: "None (0px)" },
  { value: "sm", label: "Small (4px)" },
  { value: "md", label: "Medium (8px)" },
  { value: "lg", label: "Large (16px)" },
  { value: "full", label: "Full (9999px)" },
];

const BORDER_RADIUS_NO_FULL_OPTIONS = [
  { value: "none", label: "None" },
  { value: "sm", label: "Small" },
  { value: "md", label: "Medium" },
  { value: "lg", label: "Large" },
];

const SHADOW_OPTIONS = [
  { value: "none", label: "None" },
  { value: "sm", label: "Small" },
  { value: "md", label: "Medium" },
  { value: "lg", label: "Large" },
];

const PRODUCT_CARD_RADIUS_OPTIONS = [
  { value: "none", label: "None" },
  { value: "sm", label: "Small" },
  { value: "md", label: "Medium" },
  { value: "lg", label: "Large" },
  { value: "xl", label: "Extra Large" },
];

const HOVER_SHADOW_OPTIONS = [
  { value: "none", label: "None" },
  { value: "sm", label: "Small" },
  { value: "md", label: "Medium" },
  { value: "lg", label: "Large" },
  { value: "xl", label: "Extra Large" },
];

const TOAST_POSITION_OPTIONS = [
  { value: "top-right", label: "Top Right" },
  { value: "top-left", label: "Top Left" },
  { value: "top-center", label: "Top Center" },
  { value: "bottom-right", label: "Bottom Right" },
  { value: "bottom-left", label: "Bottom Left" },
  { value: "bottom-center", label: "Bottom Center" },
];

const ICON_STYLE_OPTIONS = [
  { value: "outline", label: "Outline" },
  { value: "solid", label: "Solid" },
  { value: "duotone", label: "Duotone" },
];

const BUTTON_STYLE_OPTIONS = [
  { value: "solid", label: "Solid" },
  { value: "outline", label: "Outline" },
  { value: "ghost", label: "Ghost" },
];

const CART_DISPLAY_OPTIONS = [
  { value: "drawer", label: "Drawer (Slide-in)" },
  { value: "page", label: "Page (Full Cart Page)" },
];

const CART_SIDE_OPTIONS = [
  { value: "left", label: "Left" },
  { value: "right", label: "Right" },
];

// ---------------------------------------------------------------------------
// Tab definitions
// ---------------------------------------------------------------------------

const DESIGN_TABS = [
  { id: "branding", label: "Branding", icon: Palette },
  { id: "components", label: "Components", icon: Component },
  { id: "tokens", label: "Design Tokens", icon: Paintbrush },
  { id: "dark-mode", label: "Dark Mode", icon: Moon },
] as const;

type DesignTabId = (typeof DESIGN_TABS)[number]["id"];

function isValidTab(value: string | undefined): value is DesignTabId {
  return DESIGN_TABS.some((t) => t.id === value);
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

function DesignPage() {
  const router = useRouter();
  const tabParam = router.query.tab as string | undefined;
  const initialTab = isValidTab(tabParam) ? tabParam : "branding";
  const [activeTab, setActiveTab] = useState<DesignTabId>(initialTab);

  // Sync tab from URL changes (e.g. browser back/forward)
  useEffect(() => {
    if (isValidTab(tabParam) && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [tabParam]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleTabChange(value: string) {
    const tab = value as DesignTabId;
    setActiveTab(tab);
    router.replace(
      { pathname: router.pathname, query: { ...router.query, tab } },
      undefined,
      { shallow: true },
    );
  }

  const { config, isNotReady, form, onSubmit, saveStatus } = useConfigPage({
    schema: DesignFormSchema,
    sections: ["branding", "ui", "darkMode", "design"],
    extractFormData: (c) => ({
      branding: c.branding,
      ui: c.ui,
      darkMode: c.darkMode,
      design: c.design,
    }),
  });

  const { register, control, handleSubmit, watch, formState: { errors, isDirty } } = form;
  const darkModeEnabled = watch("darkMode.enabled");

  if (isNotReady) {
    return (
      <AppShell
        channelSlug=""
        activePage="design"
        title="Design"
      >
        <LoadingState />
      </AppShell>
    );
  }

  return (
    <AppShell
      channelSlug={router.query.channelSlug as string}
      channelName={config?.store.name}
      activePage="design"
      title="Design"
      description="Manage your store's visual identity, component styles, and dark mode"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 p-6">
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="mb-6">
            {DESIGN_TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <TabsTrigger key={tab.id} value={tab.id} className="gap-2">
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {/* ----------------------------------------------------------------
            * Tab 1: Branding
            * -------------------------------------------------------------- */}
          <TabsContent
            value="branding"
            forceMount
            className={activeTab !== "branding" ? "hidden" : "space-y-6"}
          >
            <BrandingTab
              register={register}
              control={control}
              errors={errors}
            />
          </TabsContent>

          {/* ----------------------------------------------------------------
            * Tab 2: Components
            * -------------------------------------------------------------- */}
          <TabsContent
            value="components"
            forceMount
            className={activeTab !== "components" ? "hidden" : "space-y-6"}
          >
            <ComponentsTab
              control={control}
              register={register}
              errors={errors}
            />
          </TabsContent>

          {/* ----------------------------------------------------------------
            * Tab 3: Design Tokens
            * -------------------------------------------------------------- */}
          <TabsContent
            value="tokens"
            forceMount
            className={activeTab !== "tokens" ? "hidden" : "space-y-6"}
          >
            <DesignTokensTab
              control={control}
              register={register}
              errors={errors}
              watch={watch}
            />
          </TabsContent>

          {/* ----------------------------------------------------------------
            * Tab 4: Dark Mode
            * -------------------------------------------------------------- */}
          <TabsContent
            value="dark-mode"
            forceMount
            className={activeTab !== "dark-mode" ? "hidden" : "space-y-6"}
          >
            <DarkModeTab
              control={control}
              darkModeEnabled={darkModeEnabled}
            />
          </TabsContent>
        </Tabs>

        <SaveBar
          isDirty={isDirty}
          saveStatus={saveStatus}
          onReset={() => {
            if (config) {
              form.reset({
                branding: config.branding,
                ui: config.ui,
                darkMode: config.darkMode,
                design: config.design,
              });
            }
          }}
          onSubmit={handleSubmit(onSubmit)}
        />
      </form>
    </AppShell>
  );
}

// ---------------------------------------------------------------------------
// Branding Tab
// ---------------------------------------------------------------------------

interface BrandingTabProps {
  register: UseFormRegister<DesignFormData>;
  control: Control<DesignFormData>;
  errors: FieldErrors<DesignFormData>;
}

function BrandingTab({ register, control, errors }: BrandingTabProps) {
  return (
    <>
      {/* Logo & Assets */}
      <FormSection title="Logo & Assets" description="Your brand identity assets">
        <FieldGroup columns={2}>
          <FormField<DesignFormData>
            label="Logo URL"
            name="branding.logo"
            register={register}
            errors={errors}
            placeholder="/logo.svg"
          />
          <FormField<DesignFormData>
            label="Logo Alt Text"
            name="branding.logoAlt"
            register={register}
            errors={errors}
            placeholder="My Store Logo"
          />
        </FieldGroup>
        <FormField<DesignFormData>
          label="Favicon URL"
          name="branding.favicon"
          register={register}
          errors={errors}
          placeholder="/favicon.ico"
        />
      </FormSection>

      {/* Brand Colors */}
      <FormSection
        title="Brand Colors"
        description="Your store's color palette"
        icon={<Palette className="h-4 w-4" />}
      >
        <FieldGroup columns={2}>
          <FormColorPicker<DesignFormData>
            label="Primary"
            name="branding.colors.primary"
            control={control}
          />
          <FormColorPicker<DesignFormData>
            label="Secondary"
            name="branding.colors.secondary"
            control={control}
          />
          <FormColorPicker<DesignFormData>
            label="Accent"
            name="branding.colors.accent"
            control={control}
          />
          <FormColorPicker<DesignFormData>
            label="Background"
            name="branding.colors.background"
            control={control}
          />
          <FormColorPicker<DesignFormData>
            label="Surface"
            name="branding.colors.surface"
            control={control}
          />
          <FormColorPicker<DesignFormData>
            label="Text"
            name="branding.colors.text"
            control={control}
          />
          <FormColorPicker<DesignFormData>
            label="Text Muted"
            name="branding.colors.textMuted"
            control={control}
          />
          <FormColorPicker<DesignFormData>
            label="Success"
            name="branding.colors.success"
            control={control}
          />
          <FormColorPicker<DesignFormData>
            label="Warning"
            name="branding.colors.warning"
            control={control}
          />
          <FormColorPicker<DesignFormData>
            label="Error"
            name="branding.colors.error"
            control={control}
          />
        </FieldGroup>
      </FormSection>

      {/* Typography */}
      <FormSection title="Typography" description="Font families for your store">
        <FieldGroup columns={3}>
          <FormField<DesignFormData>
            label="Heading Font"
            name="branding.typography.fontHeading"
            register={register}
            errors={errors}
            placeholder="Inter"
          />
          <FormField<DesignFormData>
            label="Body Font"
            name="branding.typography.fontBody"
            register={register}
            errors={errors}
            placeholder="Inter"
          />
          <FormField<DesignFormData>
            label="Mono Font"
            name="branding.typography.fontMono"
            register={register}
            errors={errors}
            placeholder="JetBrains Mono"
          />
        </FieldGroup>
      </FormSection>

      {/* Font Sizes */}
      <FormSection title="Font Sizes" description="Size scale for text elements">
        <FieldGroup columns={2}>
          <FormSelect<DesignFormData>
            label="H1"
            name="branding.typography.fontSize.h1"
            control={control}
            options={FONT_SIZE_OPTIONS}
          />
          <FormSelect<DesignFormData>
            label="H2"
            name="branding.typography.fontSize.h2"
            control={control}
            options={FONT_SIZE_OPTIONS}
          />
          <FormSelect<DesignFormData>
            label="H3"
            name="branding.typography.fontSize.h3"
            control={control}
            options={FONT_SIZE_OPTIONS}
          />
          <FormSelect<DesignFormData>
            label="H4"
            name="branding.typography.fontSize.h4"
            control={control}
            options={FONT_SIZE_OPTIONS}
          />
          <FormSelect<DesignFormData>
            label="Body"
            name="branding.typography.fontSize.body"
            control={control}
            options={FONT_SIZE_OPTIONS}
          />
          <FormSelect<DesignFormData>
            label="Small"
            name="branding.typography.fontSize.small"
            control={control}
            options={FONT_SIZE_OPTIONS}
          />
          <FormSelect<DesignFormData>
            label="Button"
            name="branding.typography.fontSize.button"
            control={control}
            options={FONT_SIZE_OPTIONS}
          />
          <FormSelect<DesignFormData>
            label="Caption"
            name="branding.typography.fontSize.caption"
            control={control}
            options={FONT_SIZE_OPTIONS}
          />
        </FieldGroup>
      </FormSection>

      {/* Style */}
      <FormSection title="Style" description="Global visual style preferences">
        <FieldGroup columns={3}>
          <FormSelect<DesignFormData>
            label="Border Radius"
            name="branding.style.borderRadius"
            control={control}
            options={BORDER_RADIUS_OPTIONS}
          />
          <FormSelect<DesignFormData>
            label="Button Style"
            name="branding.style.buttonStyle"
            control={control}
            options={BUTTON_STYLE_OPTIONS}
          />
          <FormSelect<DesignFormData>
            label="Card Shadow"
            name="branding.style.cardShadow"
            control={control}
            options={SHADOW_OPTIONS}
          />
        </FieldGroup>
      </FormSection>
    </>
  );
}

// ---------------------------------------------------------------------------
// Components Tab
// ---------------------------------------------------------------------------

interface ComponentsTabProps {
  control: BrandingTabProps["control"];
  register: BrandingTabProps["register"];
  errors: BrandingTabProps["errors"];
}

function ComponentsTab({ control, register, errors }: ComponentsTabProps) {
  return (
    <>
      {/* Buttons */}
      <FormSection title="Buttons" description="Customize button appearance across your store">
        <FormSelect<DesignFormData>
          label="Button Border Radius"
          name="ui.buttons.borderRadius"
          control={control}
          options={BORDER_RADIUS_OPTIONS}
          description="Roundness of button corners"
        />

        <div className="space-y-6 pt-4">
          {/* Primary Button */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Primary Button</h4>
            <FieldGroup columns={3}>
              <FormColorPicker<DesignFormData>
                label="Background"
                name="ui.buttons.primary.backgroundColor"
                control={control}
              />
              <FormColorPicker<DesignFormData>
                label="Text Color"
                name="ui.buttons.primary.textColor"
                control={control}
              />
              <FormColorPicker<DesignFormData>
                label="Hover Background"
                name="ui.buttons.primary.hoverBackgroundColor"
                control={control}
              />
            </FieldGroup>
          </div>

          {/* Secondary Button */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Secondary Button</h4>
            <FieldGroup columns={3}>
              <FormColorPicker<DesignFormData>
                label="Background"
                name="ui.buttons.secondary.backgroundColor"
                control={control}
              />
              <FormColorPicker<DesignFormData>
                label="Text Color"
                name="ui.buttons.secondary.textColor"
                control={control}
              />
              <FormColorPicker<DesignFormData>
                label="Border Color"
                name="ui.buttons.secondary.borderColor"
                control={control}
              />
            </FieldGroup>
          </div>

          {/* Outline Button */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Outline Button</h4>
            <FieldGroup columns={2}>
              <FormColorPicker<DesignFormData>
                label="Text Color"
                name="ui.buttons.outline.textColor"
                control={control}
              />
              <FormColorPicker<DesignFormData>
                label="Border Color"
                name="ui.buttons.outline.borderColor"
                control={control}
              />
            </FieldGroup>
          </div>
        </div>
      </FormSection>

      {/* Badges */}
      <FormSection title="Badges" description="Product badge styling">
        <FormSelect<DesignFormData>
          label="Badge Border Radius"
          name="ui.badges.sale.borderRadius"
          control={control}
          options={BORDER_RADIUS_OPTIONS}
        />

        <div className="space-y-6 pt-4">
          {/* Sale Badge */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Sale Badge</h4>
            <FieldGroup columns={2}>
              <FormColorPicker<DesignFormData>
                label="Background"
                name="ui.badges.sale.backgroundColor"
                control={control}
              />
              <FormColorPicker<DesignFormData>
                label="Text Color"
                name="ui.badges.sale.textColor"
                control={control}
              />
            </FieldGroup>
          </div>

          {/* New Badge */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">New Badge</h4>
            <FieldGroup columns={2}>
              <FormColorPicker<DesignFormData>
                label="Background"
                name="ui.badges.new.backgroundColor"
                control={control}
              />
              <FormColorPicker<DesignFormData>
                label="Text Color"
                name="ui.badges.new.textColor"
                control={control}
              />
            </FieldGroup>
          </div>

          {/* Out of Stock Badge */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Out of Stock Badge</h4>
            <FieldGroup columns={2}>
              <FormColorPicker<DesignFormData>
                label="Background"
                name="ui.badges.outOfStock.backgroundColor"
                control={control}
              />
              <FormColorPicker<DesignFormData>
                label="Text Color"
                name="ui.badges.outOfStock.textColor"
                control={control}
              />
            </FieldGroup>
          </div>
        </div>
      </FormSection>

      {/* Form Inputs */}
      <FormSection title="Form Inputs" description="Input field styling">
        <FieldGroup columns={2}>
          <FormSelect<DesignFormData>
            label="Border Radius"
            name="ui.inputs.borderRadius"
            control={control}
            options={BORDER_RADIUS_NO_FULL_OPTIONS}
          />
          <FormColorPicker<DesignFormData>
            label="Border Color"
            name="ui.inputs.borderColor"
            control={control}
          />
          <FormColorPicker<DesignFormData>
            label="Focus Border Color"
            name="ui.inputs.focusBorderColor"
            control={control}
            description="Border color when focused"
          />
          <FormColorPicker<DesignFormData>
            label="Focus Ring Color"
            name="ui.inputs.focusRingColor"
            control={control}
            description="Ring/glow color when focused"
          />
        </FieldGroup>
      </FormSection>

      {/* Product Cards */}
      <FormSection title="Product Cards" description="Product card appearance">
        <FieldGroup columns={2}>
          <FormSelect<DesignFormData>
            label="Border Radius"
            name="ui.productCard.borderRadius"
            control={control}
            options={PRODUCT_CARD_RADIUS_OPTIONS}
          />
          <FormSelect<DesignFormData>
            label="Shadow"
            name="ui.productCard.shadow"
            control={control}
            options={SHADOW_OPTIONS}
          />
          <FormSelect<DesignFormData>
            label="Hover Shadow"
            name="ui.productCard.hoverShadow"
            control={control}
            options={HOVER_SHADOW_OPTIONS}
          />
          <FormSwitch<DesignFormData>
            label="Show Quick View"
            name="ui.productCard.showQuickView"
            control={control}
            description="Show quick-add button on product cards"
          />
        </FieldGroup>
      </FormSection>

      {/* Cart */}
      <FormSection title="Cart" description="Cart drawer appearance and behavior">
        <FieldGroup columns={2}>
          <FormSelect<DesignFormData>
            label="Display Mode"
            name="ui.cart.displayMode"
            control={control}
            options={CART_DISPLAY_OPTIONS}
            description="How the cart opens when clicking the cart icon"
          />
          <FormSelect<DesignFormData>
            label="Drawer Side"
            name="ui.cart.drawerSide"
            control={control}
            options={CART_SIDE_OPTIONS}
            description="Side of the screen where the drawer appears"
          />
        </FieldGroup>
        <FieldGroup columns={2}>
          <FormSwitch<DesignFormData>
            label="Show Delete Text"
            name="ui.cart.showDeleteText"
            control={control}
            description="Show 'Delete' label next to trash icon"
          />
          <FormSwitch<DesignFormData>
            label="Show Save For Later"
            name="ui.cart.showSaveForLater"
            control={control}
            description="Show 'Save for later' / 'Move to cart' per line item"
          />
        </FieldGroup>
      </FormSection>

      {/* Toast Notifications */}
      <FormSection title="Toast Notifications" description="Notification styling and placement">
        <FieldGroup columns={2}>
          <FormSelect<DesignFormData>
            label="Position"
            name="ui.toasts.position"
            control={control}
            options={TOAST_POSITION_OPTIONS}
          />
          <FormSelect<DesignFormData>
            label="Border Radius"
            name="ui.toasts.borderRadius"
            control={control}
            options={BORDER_RADIUS_NO_FULL_OPTIONS}
          />
        </FieldGroup>

        <div className="space-y-6 pt-4">
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Success Toast</h4>
            <FormColorPicker<DesignFormData>
              label="Background"
              name="ui.toasts.success.backgroundColor"
              control={control}
            />
          </div>
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Error Toast</h4>
            <FormColorPicker<DesignFormData>
              label="Background"
              name="ui.toasts.error.backgroundColor"
              control={control}
            />
          </div>
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Warning Toast</h4>
            <FormColorPicker<DesignFormData>
              label="Background"
              name="ui.toasts.warning.backgroundColor"
              control={control}
            />
          </div>
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Info Toast</h4>
            <FormColorPicker<DesignFormData>
              label="Background"
              name="ui.toasts.info.backgroundColor"
              control={control}
            />
          </div>
        </div>
      </FormSection>

      {/* Icons */}
      <FormSection title="Icons" description="Icon styling preferences">
        <FieldGroup columns={2}>
          <FormSelect<DesignFormData>
            label="Style"
            name="ui.icons.style"
            control={control}
            options={ICON_STYLE_OPTIONS}
          />
          <FormColorPicker<DesignFormData>
            label="Default Color"
            name="ui.icons.defaultColor"
            control={control}
            description="Default icon color"
          />
        </FieldGroup>
      </FormSection>
    </>
  );
}

// ---------------------------------------------------------------------------
// Design Tokens Tab
// ---------------------------------------------------------------------------

const ANIMATION_PRESET_OPTIONS = [
  { value: "none", label: "None", description: "No animations or transitions" },
  { value: "subtle", label: "Subtle", description: "Minimal, fast transitions" },
  { value: "moderate", label: "Moderate", description: "Balanced feel (recommended)" },
  { value: "dramatic", label: "Dramatic", description: "Bold, expressive animations" },
];

const SECTION_PADDING_OPTIONS = [
  { value: "compact", label: "Compact (3rem)" },
  { value: "normal", label: "Normal (5rem)" },
  { value: "spacious", label: "Spacious (7rem)" },
];

const CONTAINER_PX_OPTIONS = [
  { value: "tight", label: "Tight (1rem)" },
  { value: "normal", label: "Normal (1.5rem)" },
  { value: "wide", label: "Wide (3rem)" },
];

const CARD_GAP_OPTIONS = [
  { value: "tight", label: "Tight (0.75rem)" },
  { value: "normal", label: "Normal (1.5rem)" },
  { value: "spacious", label: "Spacious (2rem)" },
];

const EASING_OPTIONS = [
  { value: "ease", label: "Ease" },
  { value: "ease-in", label: "Ease In" },
  { value: "ease-out", label: "Ease Out" },
  { value: "ease-in-out", label: "Ease In-Out" },
];

const HOVER_EFFECT_OPTIONS = [
  { value: "lift", label: "Lift (translateY)" },
  { value: "glow", label: "Glow (box-shadow)" },
  { value: "border", label: "Border highlight" },
  { value: "scale", label: "Scale up" },
  { value: "none", label: "None" },
];

const BADGE_POSITION_OPTIONS = [
  { value: "top-start", label: "Top Start" },
  { value: "top-end", label: "Top End" },
  { value: "bottom-start", label: "Bottom Start" },
  { value: "bottom-end", label: "Bottom End" },
];

const IMAGE_FIT_OPTIONS = [
  { value: "cover", label: "Cover (crop to fill)" },
  { value: "contain", label: "Contain (show full image)" },
];

interface DesignTokensTabProps {
  control: Control<DesignFormData>;
  register: UseFormRegister<DesignFormData>;
  errors: FieldErrors<DesignFormData>;
  watch: UseFormWatch<DesignFormData>;
}

function DesignTokensTab({ control, register, errors, watch }: DesignTokensTabProps) {
  return (
    <>
      {/* Animation Style */}
      <FormSection
        title="Animation Style"
        description="Control the overall animation intensity of your storefront"
        icon={<Paintbrush className="h-4 w-4" />}
      >
        <FormRadioCards<DesignFormData>
          label="Animation Preset"
          name="design.animations.preset"
          control={control}
          options={ANIMATION_PRESET_OPTIONS}
          columns={4}
        />

        {/* Custom Overrides (collapsible) */}
        <FormSection
          title="Custom Overrides"
          description="Fine-tune individual animation values (overrides the preset)"
          collapsible
          defaultExpanded={false}
        >
          <FieldGroup columns={2}>
            <FormSlider<DesignFormData>
              label="Card Hover Duration"
              name="design.animations.cardHoverDuration"
              control={control}
              min={0} max={1000} step={50}
              unit="ms"
            />
            <FormSlider<DesignFormData>
              label="Card Hover Lift"
              name="design.animations.cardHoverLift"
              control={control}
              min={0} max={8} step={1}
              unit="px"
            />
            <FormSlider<DesignFormData>
              label="Image Zoom Scale"
              name="design.animations.imageZoomScale"
              control={control}
              min={1} max={1.2} step={0.01}
              unit="x"
            />
            <FormSlider<DesignFormData>
              label="Image Zoom Duration"
              name="design.animations.imageZoomDuration"
              control={control}
              min={0} max={1500} step={100}
              unit="ms"
            />
            <FormSlider<DesignFormData>
              label="Button Hover Scale"
              name="design.animations.buttonHoverScale"
              control={control}
              min={0.95} max={1.1} step={0.01}
              unit="x"
            />
            <FormSelect<DesignFormData>
              label="Transition Easing"
              name="design.animations.transitionEasing"
              control={control}
              options={EASING_OPTIONS}
            />
            <FormSlider<DesignFormData>
              label="Section Reveal Duration"
              name="design.animations.sectionRevealDuration"
              control={control}
              min={0} max={1500} step={100}
              unit="ms"
            />
            <FormSlider<DesignFormData>
              label="Marquee Speed"
              name="design.animations.marqueeSpeed"
              control={control}
              min={10} max={60} step={2}
              unit="s"
            />
            <FormSlider<DesignFormData>
              label="Hero Auto-Rotate"
              name="design.animations.heroAutoRotate"
              control={control}
              min={0} max={15} step={1}
              unit="s"
              description="0 = disabled"
            />
          </FieldGroup>
        </FormSection>
      </FormSection>

      {/* Spacing */}
      <FormSection title="Spacing" description="Control whitespace and layout density">
        <FieldGroup columns={2}>
          <FormSelect<DesignFormData>
            label="Section Padding"
            name="design.spacing.sectionPaddingY"
            control={control}
            options={SECTION_PADDING_OPTIONS}
          />
          <FormSlider<DesignFormData>
            label="Container Max Width"
            name="design.spacing.containerMaxWidth"
            control={control}
            min={1200} max={1920} step={20}
            unit="px"
          />
          <FormSelect<DesignFormData>
            label="Container Side Padding"
            name="design.spacing.containerPaddingX"
            control={control}
            options={CONTAINER_PX_OPTIONS}
          />
          <FormSelect<DesignFormData>
            label="Card Gap"
            name="design.spacing.cardGap"
            control={control}
            options={CARD_GAP_OPTIONS}
          />
        </FieldGroup>
      </FormSection>

      {/* Grid Layout */}
      <FormSection title="Grid Layout" description="Control product grid columns per breakpoint">
        <FieldGroup columns={3}>
          <FormSlider<DesignFormData>
            label="Mobile Columns"
            name="design.grid.productColumns.sm"
            control={control}
            min={1} max={3} step={1}
          />
          <FormSlider<DesignFormData>
            label="Tablet Columns"
            name="design.grid.productColumns.md"
            control={control}
            min={2} max={4} step={1}
          />
          <FormSlider<DesignFormData>
            label="Desktop Columns"
            name="design.grid.productColumns.lg"
            control={control}
            min={3} max={6} step={1}
          />
        </FieldGroup>
      </FormSection>

      {/* Product Card Enhancements */}
      <FormSection title="Product Card Enhancements" description="Advanced product card configurability">
        <FieldGroup columns={2}>
          <FormSelect<DesignFormData>
            label="Hover Effect"
            name="ui.productCard.hoverEffect"
            control={control}
            options={HOVER_EFFECT_OPTIONS}
          />
          <FormSelect<DesignFormData>
            label="Badge Position"
            name="ui.productCard.badgePosition"
            control={control}
            options={BADGE_POSITION_OPTIONS}
          />
          <FormSwitch<DesignFormData>
            label="Show Brand Label"
            name="ui.productCard.showBrandLabel"
            control={control}
            description="Display brand name on product cards"
          />
          <FormSwitch<DesignFormData>
            label="Show Rating"
            name="ui.productCard.showRating"
            control={control}
            description="Display star rating on product cards"
          />
          <FormSelect<DesignFormData>
            label="Image Fit"
            name="ui.productCard.imageFit"
            control={control}
            options={IMAGE_FIT_OPTIONS}
          />
        </FieldGroup>
      </FormSection>
    </>
  );
}

// ---------------------------------------------------------------------------
// Dark Mode Tab
// ---------------------------------------------------------------------------

interface DarkModeTabProps {
  control: BrandingTabProps["control"];
  darkModeEnabled: boolean;
}

function DarkModeTab({ control, darkModeEnabled }: DarkModeTabProps) {
  return (
    <>
      <FormSection title="Dark Mode Settings" description="Control dark mode behavior">
        <FormSwitch<DesignFormData>
          label="Enable Dark Mode"
          name="darkMode.enabled"
          control={control}
          description="Allow users to switch to dark theme"
        />
        <FormSwitch<DesignFormData>
          label="Auto Dark Mode"
          name="darkMode.auto"
          control={control}
          description="Match system preference"
        />
      </FormSection>

      {darkModeEnabled && (
        <FormSection
          title="Dark Mode Colors"
          description="Override colors for dark theme"
          icon={<Moon className="h-4 w-4" />}
          comingSoon
        >
          <FieldGroup columns={2}>
            <FormColorPicker<DesignFormData>
              label="Background"
              name="darkMode.colors.background"
              control={control}
            />
            <FormColorPicker<DesignFormData>
              label="Surface"
              name="darkMode.colors.surface"
              control={control}
            />
            <FormColorPicker<DesignFormData>
              label="Text"
              name="darkMode.colors.text"
              control={control}
            />
            <FormColorPicker<DesignFormData>
              label="Text Muted"
              name="darkMode.colors.textMuted"
              control={control}
            />
            <FormColorPicker<DesignFormData>
              label="Border"
              name="darkMode.colors.border"
              control={control}
            />
            <FormColorPicker<DesignFormData>
              label="Primary"
              name="darkMode.colors.primary"
              control={control}
            />
            <FormColorPicker<DesignFormData>
              label="Secondary"
              name="darkMode.colors.secondary"
              control={control}
            />
            <FormColorPicker<DesignFormData>
              label="Accent"
              name="darkMode.colors.accent"
              control={control}
            />
          </FieldGroup>
        </FormSection>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Next.js page export
// ---------------------------------------------------------------------------

export default DesignPage;
