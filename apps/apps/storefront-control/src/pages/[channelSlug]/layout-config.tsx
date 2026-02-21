import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import type { Control, FieldErrors, UseFormRegister, UseFormWatch } from "react-hook-form";
import { useFieldArray } from "react-hook-form";
import { z } from "zod";
import {
  Copyright,
  Footprints,
  Layout,
  Link2,
  Megaphone,
  PanelTop,
  Plus,
  Trash2,
  Type,
} from "lucide-react";

import { AppShell } from "@/components/layout/AppShell";
import { SaveBar } from "@/components/layout/SaveBar";
import { FormField } from "@/components/forms/FormField";
import { FormSelect } from "@/components/forms/FormSelect";
import { FormSwitch } from "@/components/forms/FormSwitch";
import { FormSlider } from "@/components/forms/FormSlider";
import { FormColorPicker } from "@/components/forms/FormColorPicker";
import { FormSection } from "@/components/forms/FormSection";
import { FieldGroup } from "@/components/shared/FieldGroup";
import { SectionDivider } from "@/components/shared/SectionDivider";
import { LoadingState } from "@/components/shared/LoadingState";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useConfigPage } from "@/hooks/useConfigPage";
import { HeaderSchema, FooterSchema, ContentSchema } from "@/modules/config/schema";

// ---------------------------------------------------------------------------
// Schema & types
// ---------------------------------------------------------------------------

const LayoutFormSchema = z.object({
  header: HeaderSchema,
  footer: FooterSchema,
  content: ContentSchema,
});

type LayoutFormData = z.infer<typeof LayoutFormSchema>;

// ---------------------------------------------------------------------------
// Tab definitions
// ---------------------------------------------------------------------------

const LAYOUT_TABS = [
  { id: "header", label: "Header", icon: PanelTop },
  { id: "footer", label: "Footer", icon: Footprints },
  { id: "text", label: "Text", icon: Type },
] as const;

type LayoutTabId = (typeof LAYOUT_TABS)[number]["id"];

function isValidTab(value: string | undefined): value is LayoutTabId {
  return LAYOUT_TABS.some((t) => t.id === value);
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

function LayoutConfigPage() {
  const router = useRouter();
  const tabParam = router.query.tab as string | undefined;
  const initialTab = isValidTab(tabParam) ? tabParam : "header";
  const [activeTab, setActiveTab] = useState<LayoutTabId>(initialTab);

  useEffect(() => {
    if (isValidTab(tabParam) && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [tabParam]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleTabChange(value: string) {
    const tab = value as LayoutTabId;
    setActiveTab(tab);
    router.replace(
      { pathname: router.pathname, query: { ...router.query, tab } },
      undefined,
      { shallow: true },
    );
  }

  const { config, isNotReady, form, onSubmit, saveStatus } = useConfigPage({
    schema: LayoutFormSchema,
    sections: ["header", "footer", "content"],
    extractFormData: (c) => ({
      header: c.header,
      footer: c.footer,
      content: c.content,
    }),
  });

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors, isDirty },
  } = form;

  if (isNotReady) {
    return (
      <AppShell channelSlug="" activePage="layout-config" title="Layout">
        <LoadingState />
      </AppShell>
    );
  }

  return (
    <AppShell
      channelSlug={router.query.channelSlug as string}
      channelName={config?.store.name}
      activePage="layout-config"
      title="Layout"
      description="Header, footer, and navigation text"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 p-6">
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="mb-6">
            {LAYOUT_TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <TabsTrigger key={tab.id} value={tab.id} className="gap-2">
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {/* Header Tab */}
          <TabsContent
            value="header"
            forceMount
            className={activeTab !== "header" ? "hidden" : "space-y-6"}
          >
            <HeaderTab register={register} control={control} errors={errors} watch={watch} />
          </TabsContent>

          {/* Footer Tab */}
          <TabsContent
            value="footer"
            forceMount
            className={activeTab !== "footer" ? "hidden" : "space-y-6"}
          >
            <FooterTab register={register} control={control} errors={errors} />
          </TabsContent>

          {/* Text Tab */}
          <TabsContent
            value="text"
            forceMount
            className={activeTab !== "text" ? "hidden" : "space-y-6"}
          >
            <LayoutTextTab register={register} control={control} errors={errors} />
          </TabsContent>
        </Tabs>

        <SaveBar
          isDirty={isDirty}
          saveStatus={saveStatus}
          onReset={() => {
            if (config) {
              form.reset({
                header: config.header,
                footer: config.footer,
                content: config.content,
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
// Header Tab
// ---------------------------------------------------------------------------

interface HeaderTabProps {
  register: UseFormRegister<LayoutFormData>;
  control: Control<LayoutFormData>;
  errors: FieldErrors<LayoutFormData>;
  watch: UseFormWatch<LayoutFormData>;
}

function HeaderTab({ register, control, errors, watch }: HeaderTabProps) {
  const bannerEnabled = watch("header.banner.enabled");
  const useGradient = watch("header.banner.useGradient");
  const gradientStops = watch("header.banner.gradientStops") ?? [];
  const gradientAngle = watch("header.banner.gradientAngle") ?? 90;
  const { fields: manualItemFields, append: addManualItem, remove: removeManualItem } = useFieldArray({
    control,
    name: "header.banner.manualItems",
  });
  const { fields: stopFields, append: addStop, remove: removeStop } = useFieldArray({
    control,
    name: "header.banner.gradientStops",
  });

  return (
    <>
      {/* Promotional Banner */}
      <FormSection
        title="Promotional Banner"
        description="Announcement bar above the header"
        icon={<Megaphone className="h-4 w-4" />}
      >
        <FormSwitch<LayoutFormData>
          label="Show Banner"
          name="header.banner.enabled"
          control={control}
          description="Display the promotional banner above the header"
        />

        {bannerEnabled && (
          <div className="space-y-4 pt-2">
            <FieldGroup columns={2}>
              <FormSwitch<LayoutFormData>
                label="Dismissible"
                name="header.banner.dismissible"
                control={control}
                description="Allow visitors to close the banner"
              />
              <FormSwitch<LayoutFormData>
                label="Use Saleor Promotions"
                name="header.banner.useSaleorPromotions"
                control={control}
                description="Pull active promotions from Saleor"
              />
            </FieldGroup>

            <FormSwitch<LayoutFormData>
              label="Use Saleor Vouchers"
              name="header.banner.useSaleorVouchers"
              control={control}
              description="Pull active vouchers from Saleor"
            />

            <FormField<LayoutFormData>
              label="Fallback Text"
              name="header.banner.text"
              register={register}
              errors={errors}
              placeholder="Free shipping on orders over $50"
              description="Shown when no promotions or manual items are active"
            />

            <FormSlider<LayoutFormData>
              label="Auto-scroll Interval"
              name="header.banner.autoScrollIntervalSeconds"
              control={control}
              min={4}
              max={30}
              unit="s"
              description="Seconds between banner slide rotations"
            />

            <FormSwitch<LayoutFormData>
              label="Use Gradient"
              name="header.banner.useGradient"
              control={control}
              description="Use a multi-color gradient instead of solid background"
            />

            {useGradient && (
              <div className="space-y-4">
                {/* Gradient preview */}
                {gradientStops.length >= 2 && (
                  <div
                    className="h-8 w-full rounded-md border border-neutral-200"
                    style={{
                      background: `linear-gradient(${gradientAngle}deg, ${gradientStops
                        .slice()
                        .sort((a, b) => a.position - b.position)
                        .map((s) => `${s.color} ${s.position}%`)
                        .join(", ")})`,
                    }}
                  />
                )}

                <FormSlider<LayoutFormData>
                  label="Gradient Angle"
                  name="header.banner.gradientAngle"
                  control={control}
                  min={0}
                  max={360}
                  unit="°"
                  description="Direction of the gradient (90° = left to right)"
                />

                {/* Gradient Stops */}
                <div className="space-y-3">
                  <div>
                    <h4 className="text-sm font-medium">Gradient Color Stops</h4>
                    <p className="text-xs text-neutral-500">
                      Add colors with position percentages (0% = start, 100% = end)
                    </p>
                  </div>
                  {stopFields.map((field, index) => (
                    <div
                      key={field.id}
                      className="flex items-end gap-3 rounded-lg border border-neutral-200 bg-neutral-50 p-3"
                    >
                      <div className="flex-1">
                        <FormColorPicker<LayoutFormData>
                          label={`Color #${index + 1}`}
                          name={`header.banner.gradientStops.${index}.color`}
                          control={control}
                        />
                      </div>
                      <div className="w-28">
                        <FormSlider<LayoutFormData>
                          label="Position"
                          name={`header.banner.gradientStops.${index}.position`}
                          control={control}
                          min={0}
                          max={100}
                          unit="%"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeStop(index)}
                        className="mb-1 inline-flex items-center gap-1 rounded p-1.5 text-red-600 hover:bg-red-50 hover:text-red-700"
                        aria-label={`Remove color stop ${index + 1}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() =>
                      addStop({
                        color: "#000000",
                        position: stopFields.length === 0 ? 0 : 100,
                      })
                    }
                    className="inline-flex items-center gap-2 rounded-md border border-dashed border-neutral-300 px-4 py-2 text-sm text-neutral-600 hover:border-neutral-400 hover:text-neutral-700"
                  >
                    <Plus className="h-4 w-4" />
                    Add Color Stop
                  </button>
                </div>

                {/* Legacy from/to fallback */}
                <details className="rounded-lg border border-neutral-200 p-3">
                  <summary className="cursor-pointer text-xs text-neutral-500">
                    Legacy two-color fallback (used if no stops defined)
                  </summary>
                  <FieldGroup columns={2} className="mt-3">
                    <FormColorPicker<LayoutFormData>
                      label="Gradient From"
                      name="header.banner.gradientFrom"
                      control={control}
                    />
                    <FormColorPicker<LayoutFormData>
                      label="Gradient To"
                      name="header.banner.gradientTo"
                      control={control}
                    />
                  </FieldGroup>
                </details>
              </div>
            )}

            <FieldGroup columns={2}>
              <FormColorPicker<LayoutFormData>
                label="Background Color"
                name="header.banner.backgroundColor"
                control={control}
                description="Used when gradient is off"
              />
              <FormColorPicker<LayoutFormData>
                label="Text Color"
                name="header.banner.textColor"
                control={control}
              />
            </FieldGroup>

            {/* Manual Banner Items */}
            <div className="mt-6 space-y-4">
              <div>
                <h4 className="text-sm font-medium">Custom Banner Items</h4>
                <p className="text-xs text-neutral-500">
                  Add custom text items to rotate in the banner alongside Saleor promotions
                </p>
              </div>
              {manualItemFields.map((field, index) => (
                <div
                  key={field.id}
                  className="rounded-lg border border-neutral-200 bg-neutral-50 p-4"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm font-medium">Item #{index + 1}</span>
                    <button
                      type="button"
                      onClick={() => removeManualItem(index)}
                      className="inline-flex items-center gap-1 text-sm text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Remove
                    </button>
                  </div>
                  <div className="space-y-3">
                    <FormField<LayoutFormData>
                      label="Text"
                      name={`header.banner.manualItems.${index}.text`}
                      register={register}
                      errors={errors}
                      placeholder="Free shipping on orders over $50!"
                    />
                    <FieldGroup columns={2}>
                      <FormField<LayoutFormData>
                        label="Link (optional)"
                        name={`header.banner.manualItems.${index}.link`}
                        register={register}
                        errors={errors}
                        placeholder="/products or https://..."
                      />
                      <FormField<LayoutFormData>
                        label="Icon / Emoji (optional)"
                        name={`header.banner.manualItems.${index}.icon`}
                        register={register}
                        errors={errors}
                        placeholder="🎉"
                      />
                    </FieldGroup>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() =>
                  addManualItem({
                    id: `manual-${Date.now()}`,
                    text: "",
                    link: null,
                    icon: null,
                  })
                }
                className="inline-flex items-center gap-2 rounded-md border border-dashed border-neutral-300 px-4 py-2 text-sm text-neutral-600 hover:border-neutral-400 hover:text-neutral-700"
              >
                <Plus className="h-4 w-4" />
                Add Banner Item
              </button>
            </div>
          </div>
        )}
      </FormSection>

      {/* Header Layout */}
      <FormSection
        title="Header Layout"
        description="Configure how the header appears"
        icon={<Layout className="h-4 w-4" />}
      >
        <FormSwitch<LayoutFormData>
          label="Show Store Name"
          name="header.showStoreName"
          control={control}
          description="Display the store name next to the logo"
        />
        <FormSelect<LayoutFormData>
          label="Logo Position"
          name="header.logoPosition"
          control={control}
          options={[
            { value: "left", label: "Left" },
            { value: "center", label: "Center" },
          ]}
        />
      </FormSection>
    </>
  );
}

// ---------------------------------------------------------------------------
// Footer Tab
// ---------------------------------------------------------------------------

interface FooterTabProps {
  register: UseFormRegister<LayoutFormData>;
  control: Control<LayoutFormData>;
  errors: FieldErrors<LayoutFormData>;
}

function FooterTab({ register, control, errors }: FooterTabProps) {
  return (
    <>
      {/* Footer Sections */}
      <FormSection
        title="Footer Sections"
        description="Choose which sections to display in the footer"
        icon={<Footprints className="h-4 w-4" />}
      >
        <FormSwitch<LayoutFormData>
          label="Show Brand"
          name="footer.showBrand"
          control={control}
          description="Show store logo and name"
        />
        <FormSwitch<LayoutFormData>
          label="Show Menu"
          name="footer.showMenu"
          control={control}
          description="Show navigation menu links"
        />
        <FormSwitch<LayoutFormData>
          label="Show Contact Info"
          name="footer.showContactInfo"
          control={control}
          description="Show email, phone, and address"
        />
        <FormSwitch<LayoutFormData>
          label="Show Newsletter"
          name="footer.showNewsletter"
          control={control}
          description="Show newsletter subscription form"
        />
        <FormSwitch<LayoutFormData>
          label="Show Social Links"
          name="footer.showSocialLinks"
          control={control}
          description="Display social media icons"
        />
      </FormSection>

      {/* Legal Links */}
      <FormSection
        title="Legal Links"
        description="Footer bottom bar links"
        icon={<Link2 className="h-4 w-4" />}
      >
        {([
          { key: "trackOrder", label: "Track Order" },
          { key: "privacyPolicy", label: "Privacy Policy" },
          { key: "termsOfService", label: "Terms of Service" },
          { key: "shippingPolicy", label: "Shipping Policy" },
          { key: "returnPolicy", label: "Return Policy" },
        ] as const).map(({ key, label }) => (
          <div key={key} className="space-y-3 rounded-lg border p-4">
            <FormSwitch<LayoutFormData>
              label={`Show ${label}`}
              name={`footer.legalLinks.${key}.enabled`}
              control={control}
            />
            <FormField<LayoutFormData>
              label={`${label} URL`}
              name={`footer.legalLinks.${key}.url`}
              register={register}
              errors={errors}
              placeholder={key === "trackOrder" ? "/track-order" : `/pages/${key.replace(/([A-Z])/g, "-$1").toLowerCase()}`}
              description="URL path for this link"
            />
          </div>
        ))}
      </FormSection>

      {/* Copyright */}
      <FormSection
        title="Copyright"
        description="Footer copyright text"
        icon={<Copyright className="h-4 w-4" />}
      >
        <FormField<LayoutFormData>
          label="Copyright Text"
          name="footer.copyrightText"
          register={register}
          errors={errors}
          placeholder={`\u00A9 ${new Date().getFullYear()} Your Store Name. All rights reserved.`}
          description="Leave empty to auto-generate from store name and year"
        />
      </FormSection>
    </>
  );
}

// ---------------------------------------------------------------------------
// Layout Text Tab (content.navbar + content.footer)
// ---------------------------------------------------------------------------

function LayoutTextTab({ register, control, errors }: FooterTabProps) {
  return (
    <>
      {/* Navbar Text */}
      <FormSection title="Navbar Text" description="Navigation bar labels and search">
        <FieldGroup columns={3}>
          <FormField<LayoutFormData>
            label="Select Channel"
            name="content.navbar.selectChannel"
            register={register}
            errors={errors}
            placeholder="Select channel/currency"
          />
          <FormField<LayoutFormData>
            label="Search Placeholder"
            name="content.navbar.searchPlaceholder"
            register={register}
            errors={errors}
            placeholder="Search..."
          />
          <FormField<LayoutFormData>
            label="Search Clear (Aria)"
            name="content.navbar.searchClearAriaLabel"
            register={register}
            errors={errors}
            placeholder="Clear search"
          />
          <FormField<LayoutFormData>
            label="Search Input (Aria)"
            name="content.navbar.searchInputAriaLabel"
            register={register}
            errors={errors}
            placeholder="Search products"
          />
          <FormField<LayoutFormData>
            label="View All Results For"
            name="content.navbar.viewAllResultsFor"
            register={register}
            errors={errors}
            placeholder="View all results for"
          />
          <FormField<LayoutFormData>
            label="Recently Searched"
            name="content.navbar.recentlySearchedLabel"
            register={register}
            errors={errors}
            placeholder="Recent Searches"
          />
          <FormField<LayoutFormData>
            label="Clear Recent"
            name="content.navbar.recentSearchesClearLabel"
            register={register}
            errors={errors}
            placeholder="Clear"
          />
          <FormField<LayoutFormData>
            label="Cart Label"
            name="content.navbar.cartLabel"
            register={register}
            errors={errors}
            placeholder="Cart"
          />
          <FormField<LayoutFormData>
            label="Account Label"
            name="content.navbar.accountLabel"
            register={register}
            errors={errors}
            placeholder="Account"
          />
          <FormField<LayoutFormData>
            label="Menu Label"
            name="content.navbar.menuLabel"
            register={register}
            errors={errors}
            placeholder="Menu"
          />
          <FormField<LayoutFormData>
            label="Home Label"
            name="content.navbar.homeLabel"
            register={register}
            errors={errors}
            placeholder="Home"
          />
          <FormField<LayoutFormData>
            label="Shop Label"
            name="content.navbar.shopLabel"
            register={register}
            errors={errors}
            placeholder="Shop"
          />
          <FormField<LayoutFormData>
            label="Sign In Text"
            name="content.navbar.signInText"
            register={register}
            errors={errors}
            placeholder="Sign In"
          />
          <FormField<LayoutFormData>
            label="Shop All Button"
            name="content.navbar.shopAllButton"
            register={register}
            errors={errors}
            placeholder="Shop All"
          />
          <FormField<LayoutFormData>
            label="Sale Button"
            name="content.navbar.saleButton"
            register={register}
            errors={errors}
            placeholder="Sale"
          />
          <FormField<LayoutFormData>
            label="Collections Label"
            name="content.navbar.collectionsLabel"
            register={register}
            errors={errors}
            placeholder="Collections"
          />
          <FormField<LayoutFormData>
            label="Brands Label"
            name="content.navbar.brandsLabel"
            register={register}
            errors={errors}
            placeholder="Brands"
          />
          <FormField<LayoutFormData>
            label="Categories Label"
            name="content.navbar.categoriesLabel"
            register={register}
            errors={errors}
            placeholder="Categories"
          />
          <FormField<LayoutFormData>
            label="View All Products"
            name="content.navbar.viewAllProducts"
            register={register}
            errors={errors}
            placeholder="View All Products"
          />
        </FieldGroup>

        <FieldGroup columns={4}>
          <FormSelect<LayoutFormData>
            label="Subcategories Side"
            name="content.navbar.subcategoriesSide"
            control={control}
            options={[
              { value: "auto", label: "Auto (based on RTL/LTR)" },
              { value: "left", label: "Left" },
              { value: "right", label: "Right" },
            ]}
          />
          <FormSelect<LayoutFormData>
            label="Mobile Nav Position"
            name="content.navbar.mobileNavPosition"
            control={control}
            options={[
              { value: "right", label: "Right" },
              { value: "left", label: "Left" },
            ]}
          />
          <FormSelect<LayoutFormData>
            label="Mobile Menu Style"
            name="content.navbar.mobileMenuStyle"
            control={control}
            options={[
              { value: "visual", label: "Visual (Image Cards)" },
              { value: "compact", label: "Compact (Text List)" },
            ]}
          />
          <FormSelect<LayoutFormData>
            label="Dropdown Arrow Direction"
            name="content.navbar.dropdownArrowDirection"
            control={control}
            options={[
              { value: "auto", label: "Auto (based on RTL/LTR)" },
              { value: "up", label: "Point up" },
              { value: "down", label: "Point down" },
              { value: "left", label: "Point left" },
              { value: "right", label: "Point right" },
            ]}
          />
        </FieldGroup>
      </FormSection>

      <SectionDivider label="Footer Text" className="my-4" />

      {/* Footer Text - Legal Links */}
      <FormSection title="Footer Legal Links Text" description="Display text for legal links">
        <FieldGroup columns={4}>
          <FormField<LayoutFormData>
            label="Privacy Policy"
            name="content.footer.privacyPolicyLink"
            register={register}
            errors={errors}
            placeholder="Privacy Policy"
          />
          <FormField<LayoutFormData>
            label="Terms of Service"
            name="content.footer.termsOfServiceLink"
            register={register}
            errors={errors}
            placeholder="Terms of Service"
          />
          <FormField<LayoutFormData>
            label="Shipping"
            name="content.footer.shippingLink"
            register={register}
            errors={errors}
            placeholder="Shipping"
          />
          <FormField<LayoutFormData>
            label="Return Policy"
            name="content.footer.returnPolicyLink"
            register={register}
            errors={errors}
            placeholder="Return Policy"
          />
        </FieldGroup>
      </FormSection>

      {/* Footer Text */}
      <FormSection title="Footer Labels" description="General footer text">
        <FieldGroup columns={3}>
          <FormField<LayoutFormData>
            label="All Rights Reserved"
            name="content.footer.allRightsReserved"
            register={register}
            errors={errors}
            placeholder="All rights reserved"
          />
          <FormField<LayoutFormData>
            label="Contact Us"
            name="content.footer.contactUs"
            register={register}
            errors={errors}
            placeholder="Contact Us"
          />
          <FormField<LayoutFormData>
            label="Customer Service"
            name="content.footer.customerService"
            register={register}
            errors={errors}
            placeholder="Customer Service"
          />
        </FieldGroup>
      </FormSection>

      {/* Footer Section Titles */}
      <FormSection title="Footer Section Titles" description="Column header labels">
        <FieldGroup columns={4}>
          <FormField<LayoutFormData>
            label="Shop Title"
            name="content.footer.shopTitle"
            register={register}
            errors={errors}
            placeholder="Shop"
          />
          <FormField<LayoutFormData>
            label="Company Title"
            name="content.footer.companyTitle"
            register={register}
            errors={errors}
            placeholder="Company"
          />
          <FormField<LayoutFormData>
            label="Support Title"
            name="content.footer.supportTitle"
            register={register}
            errors={errors}
            placeholder="Support"
          />
          <FormField<LayoutFormData>
            label="Follow Us Title"
            name="content.footer.followUsTitle"
            register={register}
            errors={errors}
            placeholder="Follow Us"
          />
          <FormField<LayoutFormData>
            label="Track Order"
            name="content.footer.trackOrderLink"
            register={register}
            errors={errors}
            placeholder="Track Order"
          />
        </FieldGroup>
      </FormSection>
    </>
  );
}

// ---------------------------------------------------------------------------
// Next.js page export
// ---------------------------------------------------------------------------

export default LayoutConfigPage;
