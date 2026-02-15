import { Moon, Paintbrush, Palette } from "lucide-react";

import { FormField } from "@/components/forms/FormField";
import { FormSelect } from "@/components/forms/FormSelect";
import { FormSwitch } from "@/components/forms/FormSwitch";
import { FormSlider } from "@/components/forms/FormSlider";
import { FormRadioCards } from "@/components/forms/FormRadioCards";
import { FormColorPicker } from "@/components/forms/FormColorPicker";
import { FormSection } from "@/components/forms/FormSection";
import { FieldGroup } from "@/components/shared/FieldGroup";
import type { GlobalFormData, GlobalTabWithWatchProps } from "./types";
import {
  FONT_SIZE_OPTIONS,
  BORDER_RADIUS_OPTIONS,
  BORDER_RADIUS_NO_FULL_OPTIONS,
  SHADOW_OPTIONS,
  PRODUCT_CARD_RADIUS_OPTIONS,
  HOVER_SHADOW_OPTIONS,
  TOAST_POSITION_OPTIONS,
  ICON_STYLE_OPTIONS,
  BUTTON_STYLE_OPTIONS,
  CART_DISPLAY_OPTIONS,
  CART_SIDE_OPTIONS,
  ANIMATION_PRESET_OPTIONS,
  SECTION_PADDING_OPTIONS,
  CONTAINER_PX_OPTIONS,
  CARD_GAP_OPTIONS,
  EASING_OPTIONS,
  HOVER_EFFECT_OPTIONS,
  BADGE_POSITION_OPTIONS,
  IMAGE_FIT_OPTIONS,
} from "./options";

export function BrandingDesignTab({ register, control, errors, watch }: GlobalTabWithWatchProps) {
  const darkModeEnabled = watch("darkMode.enabled");

  return (
    <>
      {/* ================================================================
       * BRANDING
       * ================================================================ */}

      {/* Logo & Assets */}
      <FormSection title="Logo & Assets" description="Your brand identity assets">
        <FieldGroup columns={2}>
          <FormField<GlobalFormData>
            label="Logo URL"
            name="branding.logo"
            register={register}
            errors={errors}
            placeholder="/logo.svg"
          />
          <FormField<GlobalFormData>
            label="Logo Alt Text"
            name="branding.logoAlt"
            register={register}
            errors={errors}
            placeholder="My Store Logo"
          />
        </FieldGroup>
        <FormField<GlobalFormData>
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
          <FormColorPicker<GlobalFormData>
            label="Primary"
            name="branding.colors.primary"
            control={control}
          />
          <FormColorPicker<GlobalFormData>
            label="Secondary"
            name="branding.colors.secondary"
            control={control}
          />
          <FormColorPicker<GlobalFormData>
            label="Accent"
            name="branding.colors.accent"
            control={control}
          />
          <FormColorPicker<GlobalFormData>
            label="Background"
            name="branding.colors.background"
            control={control}
          />
          <FormColorPicker<GlobalFormData>
            label="Surface"
            name="branding.colors.surface"
            control={control}
          />
          <FormColorPicker<GlobalFormData>
            label="Text"
            name="branding.colors.text"
            control={control}
          />
          <FormColorPicker<GlobalFormData>
            label="Text Muted"
            name="branding.colors.textMuted"
            control={control}
          />
          <FormColorPicker<GlobalFormData>
            label="Success"
            name="branding.colors.success"
            control={control}
          />
          <FormColorPicker<GlobalFormData>
            label="Warning"
            name="branding.colors.warning"
            control={control}
          />
          <FormColorPicker<GlobalFormData>
            label="Error"
            name="branding.colors.error"
            control={control}
          />
        </FieldGroup>
      </FormSection>

      {/* Typography */}
      <FormSection title="Typography" description="Font families for your store">
        <FieldGroup columns={3}>
          <FormField<GlobalFormData>
            label="Heading Font"
            name="branding.typography.fontHeading"
            register={register}
            errors={errors}
            placeholder="Inter"
          />
          <FormField<GlobalFormData>
            label="Body Font"
            name="branding.typography.fontBody"
            register={register}
            errors={errors}
            placeholder="Inter"
          />
          <FormField<GlobalFormData>
            label="Mono Font"
            name="branding.typography.fontMono"
            register={register}
            errors={errors}
            placeholder="JetBrains Mono"
          />
        </FieldGroup>
      </FormSection>

      {/* Font Sizes */}
      <FormSection title="Font Sizes" description="Size scale for text elements" collapsible defaultExpanded={false}>
        <FieldGroup columns={2}>
          <FormSelect<GlobalFormData>
            label="H1"
            name="branding.typography.fontSize.h1"
            control={control}
            options={FONT_SIZE_OPTIONS}
          />
          <FormSelect<GlobalFormData>
            label="H2"
            name="branding.typography.fontSize.h2"
            control={control}
            options={FONT_SIZE_OPTIONS}
          />
          <FormSelect<GlobalFormData>
            label="H3"
            name="branding.typography.fontSize.h3"
            control={control}
            options={FONT_SIZE_OPTIONS}
          />
          <FormSelect<GlobalFormData>
            label="H4"
            name="branding.typography.fontSize.h4"
            control={control}
            options={FONT_SIZE_OPTIONS}
          />
          <FormSelect<GlobalFormData>
            label="Body"
            name="branding.typography.fontSize.body"
            control={control}
            options={FONT_SIZE_OPTIONS}
          />
          <FormSelect<GlobalFormData>
            label="Small"
            name="branding.typography.fontSize.small"
            control={control}
            options={FONT_SIZE_OPTIONS}
          />
          <FormSelect<GlobalFormData>
            label="Button"
            name="branding.typography.fontSize.button"
            control={control}
            options={FONT_SIZE_OPTIONS}
          />
          <FormSelect<GlobalFormData>
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
          <FormSelect<GlobalFormData>
            label="Border Radius"
            name="branding.style.borderRadius"
            control={control}
            options={BORDER_RADIUS_OPTIONS}
          />
          <FormSelect<GlobalFormData>
            label="Button Style"
            name="branding.style.buttonStyle"
            control={control}
            options={BUTTON_STYLE_OPTIONS}
          />
          <FormSelect<GlobalFormData>
            label="Card Shadow"
            name="branding.style.cardShadow"
            control={control}
            options={SHADOW_OPTIONS}
          />
        </FieldGroup>
      </FormSection>

      {/* ================================================================
       * COMPONENTS
       * ================================================================ */}

      {/* Buttons */}
      <FormSection title="Buttons" description="Customize button appearance across your store" collapsible defaultExpanded={false}>
        <FormSelect<GlobalFormData>
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
              <FormColorPicker<GlobalFormData>
                label="Background"
                name="ui.buttons.primary.backgroundColor"
                control={control}
              />
              <FormColorPicker<GlobalFormData>
                label="Text Color"
                name="ui.buttons.primary.textColor"
                control={control}
              />
              <FormColorPicker<GlobalFormData>
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
              <FormColorPicker<GlobalFormData>
                label="Background"
                name="ui.buttons.secondary.backgroundColor"
                control={control}
              />
              <FormColorPicker<GlobalFormData>
                label="Text Color"
                name="ui.buttons.secondary.textColor"
                control={control}
              />
              <FormColorPicker<GlobalFormData>
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
              <FormColorPicker<GlobalFormData>
                label="Text Color"
                name="ui.buttons.outline.textColor"
                control={control}
              />
              <FormColorPicker<GlobalFormData>
                label="Border Color"
                name="ui.buttons.outline.borderColor"
                control={control}
              />
            </FieldGroup>
          </div>
        </div>
      </FormSection>

      {/* Section "View All" Buttons */}
      <FormSection title="Section View All Buttons" description="Style of 'View All' links in homepage sections (Categories, Trending, Best Sellers, etc.)" collapsible defaultExpanded={false}>
        <FieldGroup columns={2}>
          <FormSelect<GlobalFormData>
            label="Button Style"
            name="ui.sectionViewAllButton.style"
            control={control}
            options={[
              { value: "pill", label: "Pill (bordered)" },
              { value: "text", label: "Text link" },
              { value: "minimal", label: "Minimal" },
            ]}
            description="Pill: bordered pill with hover fill. Text: plain link with icon. Minimal: text only."
          />
          <FormSelect<GlobalFormData>
            label="Icon"
            name="ui.sectionViewAllButton.icon"
            control={control}
            options={[
              { value: "chevron", label: "Chevron ›" },
              { value: "arrow", label: "Arrow →" },
              { value: "none", label: "No icon" },
            ]}
            description="Icon shown next to button text (ignored in Minimal style)"
          />
        </FieldGroup>
      </FormSection>

      {/* Badges */}
      <FormSection title="Badges" description="Product badge styling" collapsible defaultExpanded={false}>
        <FormSelect<GlobalFormData>
          label="Badge Border Radius"
          name="ui.badges.sale.borderRadius"
          control={control}
          options={BORDER_RADIUS_OPTIONS}
        />

        <div className="space-y-6 pt-4">
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Sale Badge</h4>
            <FieldGroup columns={2}>
              <FormColorPicker<GlobalFormData>
                label="Background"
                name="ui.badges.sale.backgroundColor"
                control={control}
              />
              <FormColorPicker<GlobalFormData>
                label="Text Color"
                name="ui.badges.sale.textColor"
                control={control}
              />
            </FieldGroup>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold">New Badge</h4>
            <FieldGroup columns={2}>
              <FormColorPicker<GlobalFormData>
                label="Background"
                name="ui.badges.new.backgroundColor"
                control={control}
              />
              <FormColorPicker<GlobalFormData>
                label="Text Color"
                name="ui.badges.new.textColor"
                control={control}
              />
            </FieldGroup>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Out of Stock Badge</h4>
            <FieldGroup columns={2}>
              <FormColorPicker<GlobalFormData>
                label="Background"
                name="ui.badges.outOfStock.backgroundColor"
                control={control}
              />
              <FormColorPicker<GlobalFormData>
                label="Text Color"
                name="ui.badges.outOfStock.textColor"
                control={control}
              />
            </FieldGroup>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Low Stock Badge</h4>
            <FieldGroup columns={2}>
              <FormColorPicker<GlobalFormData>
                label="Background"
                name="ui.badges.lowStock.backgroundColor"
                control={control}
              />
              <FormColorPicker<GlobalFormData>
                label="Text Color"
                name="ui.badges.lowStock.textColor"
                control={control}
              />
            </FieldGroup>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Featured Badge</h4>
            <FieldGroup columns={2}>
              <FormColorPicker<GlobalFormData>
                label="Background"
                name="ui.badges.featured.backgroundColor"
                control={control}
              />
              <FormColorPicker<GlobalFormData>
                label="Text Color"
                name="ui.badges.featured.textColor"
                control={control}
              />
            </FieldGroup>
          </div>
        </div>
      </FormSection>

      {/* Form Inputs */}
      <FormSection title="Form Inputs" description="Input field styling" collapsible defaultExpanded={false}>
        <FieldGroup columns={2}>
          <FormSelect<GlobalFormData>
            label="Border Radius"
            name="ui.inputs.borderRadius"
            control={control}
            options={BORDER_RADIUS_NO_FULL_OPTIONS}
          />
          <FormColorPicker<GlobalFormData>
            label="Border Color"
            name="ui.inputs.borderColor"
            control={control}
          />
          <FormColorPicker<GlobalFormData>
            label="Focus Border Color"
            name="ui.inputs.focusBorderColor"
            control={control}
            description="Border color when focused"
          />
          <FormColorPicker<GlobalFormData>
            label="Focus Ring Color"
            name="ui.inputs.focusRingColor"
            control={control}
            description="Ring/glow color when focused"
          />
        </FieldGroup>
      </FormSection>

      {/* Product Cards */}
      <FormSection title="Product Cards" description="Product card appearance" collapsible defaultExpanded={false}>
        <FieldGroup columns={2}>
          <FormSelect<GlobalFormData>
            label="Border Radius"
            name="ui.productCard.borderRadius"
            control={control}
            options={PRODUCT_CARD_RADIUS_OPTIONS}
          />
          <FormSelect<GlobalFormData>
            label="Shadow"
            name="ui.productCard.shadow"
            control={control}
            options={SHADOW_OPTIONS}
          />
          <FormSelect<GlobalFormData>
            label="Hover Shadow"
            name="ui.productCard.hoverShadow"
            control={control}
            options={HOVER_SHADOW_OPTIONS}
          />
          <FormSwitch<GlobalFormData>
            label="Show Quick View"
            name="ui.productCard.showQuickView"
            control={control}
            description="Show quick-add button on product cards"
          />
          <FormSelect<GlobalFormData>
            label="Hover Effect"
            name="ui.productCard.hoverEffect"
            control={control}
            options={HOVER_EFFECT_OPTIONS}
          />
          <FormSelect<GlobalFormData>
            label="Badge Position"
            name="ui.productCard.badgePosition"
            control={control}
            options={BADGE_POSITION_OPTIONS}
          />
          <FormSwitch<GlobalFormData>
            label="Show Brand Label"
            name="ui.productCard.showBrandLabel"
            control={control}
            description="Display brand name on product cards"
          />
          <FormSwitch<GlobalFormData>
            label="Show Rating"
            name="ui.productCard.showRating"
            control={control}
            description="Display star rating on product cards"
          />
          <FormSelect<GlobalFormData>
            label="Image Fit"
            name="ui.productCard.imageFit"
            control={control}
            options={IMAGE_FIT_OPTIONS}
          />
        </FieldGroup>
      </FormSection>

      {/* Cart */}
      <FormSection title="Cart" description="Cart drawer appearance and behavior" collapsible defaultExpanded={false}>
        <FieldGroup columns={2}>
          <FormSelect<GlobalFormData>
            label="Display Mode"
            name="ui.cart.displayMode"
            control={control}
            options={CART_DISPLAY_OPTIONS}
            description="How the cart opens when clicking the cart icon"
          />
          <FormSelect<GlobalFormData>
            label="Drawer Side"
            name="ui.cart.drawerSide"
            control={control}
            options={CART_SIDE_OPTIONS}
            description="Side of the screen where the drawer appears"
          />
        </FieldGroup>
        <FieldGroup columns={2}>
          <FormSwitch<GlobalFormData>
            label="Show Delete Text"
            name="ui.cart.showDeleteText"
            control={control}
            description="Show 'Delete' label next to trash icon"
          />
          <FormSwitch<GlobalFormData>
            label="Show Save For Later"
            name="ui.cart.showSaveForLater"
            control={control}
            description="Show 'Save for later' / 'Move to cart' per line item"
          />
        </FieldGroup>
      </FormSection>

      {/* Toast Notifications */}
      <FormSection title="Toast Notifications" description="Notification styling and placement" collapsible defaultExpanded={false}>
        <FieldGroup columns={2}>
          <FormSelect<GlobalFormData>
            label="Position"
            name="ui.toasts.position"
            control={control}
            options={TOAST_POSITION_OPTIONS}
          />
          <FormSelect<GlobalFormData>
            label="Border Radius"
            name="ui.toasts.borderRadius"
            control={control}
            options={BORDER_RADIUS_NO_FULL_OPTIONS}
          />
        </FieldGroup>

        <div className="space-y-6 pt-4">
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Success Toast</h4>
            <FormColorPicker<GlobalFormData>
              label="Background"
              name="ui.toasts.success.backgroundColor"
              control={control}
            />
          </div>
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Error Toast</h4>
            <FormColorPicker<GlobalFormData>
              label="Background"
              name="ui.toasts.error.backgroundColor"
              control={control}
            />
          </div>
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Warning Toast</h4>
            <FormColorPicker<GlobalFormData>
              label="Background"
              name="ui.toasts.warning.backgroundColor"
              control={control}
            />
          </div>
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Info Toast</h4>
            <FormColorPicker<GlobalFormData>
              label="Background"
              name="ui.toasts.info.backgroundColor"
              control={control}
            />
          </div>
        </div>
      </FormSection>

      {/* Icons */}
      <FormSection title="Icons" description="Icon styling preferences" collapsible defaultExpanded={false}>
        <FieldGroup columns={2}>
          <FormSelect<GlobalFormData>
            label="Style"
            name="ui.icons.style"
            control={control}
            options={ICON_STYLE_OPTIONS}
          />
          <FormColorPicker<GlobalFormData>
            label="Default Color"
            name="ui.icons.defaultColor"
            control={control}
            description="Default icon color"
          />
        </FieldGroup>
      </FormSection>

      {/* ================================================================
       * DESIGN TOKENS
       * ================================================================ */}

      {/* Animation Style */}
      <FormSection
        title="Animation Style"
        description="Control the overall animation intensity of your storefront"
        icon={<Paintbrush className="h-4 w-4" />}
        collapsible
        defaultExpanded={false}
      >
        <FormRadioCards<GlobalFormData>
          label="Animation Preset"
          name="design.animations.preset"
          control={control}
          options={ANIMATION_PRESET_OPTIONS}
          columns={4}
        />

        <FormSection
          title="Custom Overrides"
          description="Fine-tune individual animation values (overrides the preset)"
          collapsible
          defaultExpanded={false}
        >
          <FieldGroup columns={2}>
            <FormSlider<GlobalFormData>
              label="Card Hover Duration"
              name="design.animations.cardHoverDuration"
              control={control}
              min={0} max={1000} step={50}
              unit="ms"
            />
            <FormSlider<GlobalFormData>
              label="Card Hover Lift"
              name="design.animations.cardHoverLift"
              control={control}
              min={0} max={8} step={1}
              unit="px"
            />
            <FormSlider<GlobalFormData>
              label="Image Zoom Scale"
              name="design.animations.imageZoomScale"
              control={control}
              min={1} max={1.2} step={0.01}
              unit="x"
            />
            <FormSlider<GlobalFormData>
              label="Image Zoom Duration"
              name="design.animations.imageZoomDuration"
              control={control}
              min={0} max={1500} step={100}
              unit="ms"
            />
            <FormSlider<GlobalFormData>
              label="Button Hover Scale"
              name="design.animations.buttonHoverScale"
              control={control}
              min={0.95} max={1.1} step={0.01}
              unit="x"
            />
            <FormSelect<GlobalFormData>
              label="Transition Easing"
              name="design.animations.transitionEasing"
              control={control}
              options={EASING_OPTIONS}
            />
            <FormSlider<GlobalFormData>
              label="Section Reveal Duration"
              name="design.animations.sectionRevealDuration"
              control={control}
              min={0} max={1500} step={100}
              unit="ms"
            />
            <FormSlider<GlobalFormData>
              label="Marquee Speed"
              name="design.animations.marqueeSpeed"
              control={control}
              min={10} max={60} step={2}
              unit="s"
            />
            <FormSlider<GlobalFormData>
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
      <FormSection title="Spacing" description="Control whitespace and layout density" collapsible defaultExpanded={false}>
        <FieldGroup columns={2}>
          <FormSelect<GlobalFormData>
            label="Section Padding"
            name="design.spacing.sectionPaddingY"
            control={control}
            options={SECTION_PADDING_OPTIONS}
          />
          <FormSlider<GlobalFormData>
            label="Container Max Width"
            name="design.spacing.containerMaxWidth"
            control={control}
            min={1200} max={1920} step={20}
            unit="px"
          />
          <FormSelect<GlobalFormData>
            label="Container Side Padding"
            name="design.spacing.containerPaddingX"
            control={control}
            options={CONTAINER_PX_OPTIONS}
          />
          <FormSelect<GlobalFormData>
            label="Card Gap"
            name="design.spacing.cardGap"
            control={control}
            options={CARD_GAP_OPTIONS}
          />
        </FieldGroup>
      </FormSection>

      {/* Grid Layout */}
      <FormSection title="Grid Layout" description="Control product grid columns per breakpoint" collapsible defaultExpanded={false}>
        <FieldGroup columns={3}>
          <FormSlider<GlobalFormData>
            label="Mobile Columns"
            name="design.grid.productColumns.sm"
            control={control}
            min={1} max={3} step={1}
          />
          <FormSlider<GlobalFormData>
            label="Tablet Columns"
            name="design.grid.productColumns.md"
            control={control}
            min={2} max={4} step={1}
          />
          <FormSlider<GlobalFormData>
            label="Desktop Columns"
            name="design.grid.productColumns.lg"
            control={control}
            min={3} max={6} step={1}
          />
        </FieldGroup>
      </FormSection>

      {/* ================================================================
       * DARK MODE
       * ================================================================ */}

      <FormSection title="Dark Mode Settings" description="Control dark mode behavior">
        <FormSwitch<GlobalFormData>
          label="Enable Dark Mode"
          name="darkMode.enabled"
          control={control}
          description="Allow users to switch to dark theme"
        />
        <FormSwitch<GlobalFormData>
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
            <FormColorPicker<GlobalFormData>
              label="Background"
              name="darkMode.colors.background"
              control={control}
            />
            <FormColorPicker<GlobalFormData>
              label="Surface"
              name="darkMode.colors.surface"
              control={control}
            />
            <FormColorPicker<GlobalFormData>
              label="Text"
              name="darkMode.colors.text"
              control={control}
            />
            <FormColorPicker<GlobalFormData>
              label="Text Muted"
              name="darkMode.colors.textMuted"
              control={control}
            />
            <FormColorPicker<GlobalFormData>
              label="Border"
              name="darkMode.colors.border"
              control={control}
            />
            <FormColorPicker<GlobalFormData>
              label="Primary"
              name="darkMode.colors.primary"
              control={control}
            />
            <FormColorPicker<GlobalFormData>
              label="Secondary"
              name="darkMode.colors.secondary"
              control={control}
            />
            <FormColorPicker<GlobalFormData>
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
