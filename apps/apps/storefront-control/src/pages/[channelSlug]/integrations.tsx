import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import type { Control, FieldErrors, UseFormRegister, UseFormWatch } from "react-hook-form";
import { z } from "zod";
import { BarChart3, Gift, Headphones, Megaphone, Share2, Wrench } from "lucide-react";

import { AppShell } from "@/components/layout/AppShell";
import { SaveBar } from "@/components/layout/SaveBar";
import { FormField } from "@/components/forms/FormField";
import { FormSwitch } from "@/components/forms/FormSwitch";
import { FormTextarea } from "@/components/forms/FormTextarea";
import { FormSection } from "@/components/forms/FormSection";
import { FieldGroup } from "@/components/shared/FieldGroup";
import { LoadingState } from "@/components/shared/LoadingState";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useConfigPage } from "@/hooks/useConfigPage";
import { IntegrationsSchema, PromoPopupSchema } from "@/modules/config/schema";

// ---------------------------------------------------------------------------
// Schema & types
// ---------------------------------------------------------------------------

const IntegrationsFormSchema = z.object({
  integrations: IntegrationsSchema,
  promoPopup: PromoPopupSchema,
});

type IntegrationsFormData = z.infer<typeof IntegrationsFormSchema>;

// ---------------------------------------------------------------------------
// Tab definitions
// ---------------------------------------------------------------------------

const INTEGRATIONS_TABS = [
  { id: "tools", label: "Tools", icon: Wrench },
  { id: "promo", label: "Promo & Marketing", icon: Gift },
] as const;

type IntegrationsTabId = (typeof INTEGRATIONS_TABS)[number]["id"];

function isValidTab(value: string | undefined): value is IntegrationsTabId {
  return INTEGRATIONS_TABS.some((t) => t.id === value);
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

function IntegrationsPage() {
  const router = useRouter();
  const tabParam = router.query.tab as string | undefined;
  const initialTab = isValidTab(tabParam) ? tabParam : "tools";
  const [activeTab, setActiveTab] = useState<IntegrationsTabId>(initialTab);

  useEffect(() => {
    if (isValidTab(tabParam) && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [tabParam]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleTabChange(value: string) {
    const tab = value as IntegrationsTabId;
    setActiveTab(tab);
    router.replace(
      { pathname: router.pathname, query: { ...router.query, tab } },
      undefined,
      { shallow: true },
    );
  }

  const { config, isNotReady, form, onSubmit, saveStatus } = useConfigPage({
    schema: IntegrationsFormSchema,
    sections: ["integrations", "promoPopup"],
    extractFormData: (c) => ({
      integrations: c.integrations,
      promoPopup: c.promoPopup,
    }),
  });

  const { register, control, handleSubmit, watch, formState: { errors, isDirty } } = form;

  if (isNotReady) {
    return (
      <AppShell channelSlug="" activePage="integrations" title="Integrations">
        <LoadingState />
      </AppShell>
    );
  }

  return (
    <AppShell
      channelSlug={router.query.channelSlug as string}
      channelName={config?.store.name}
      activePage="integrations"
      title="Integrations"
      description="Third-party tools, analytics, and promotional features"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 p-6">
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="mb-6">
            {INTEGRATIONS_TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <TabsTrigger key={tab.id} value={tab.id} className="gap-2">
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {/* Tab 1: Tools */}
          <TabsContent
            value="tools"
            forceMount
            className={activeTab !== "tools" ? "hidden" : "space-y-6"}
          >
            <ToolsTab register={register} errors={errors} />
          </TabsContent>

          {/* Tab 2: Promo & Marketing */}
          <TabsContent
            value="promo"
            forceMount
            className={activeTab !== "promo" ? "hidden" : "space-y-6"}
          >
            <PromoTab
              register={register}
              control={control}
              errors={errors}
              watch={watch}
            />
          </TabsContent>
        </Tabs>

        <SaveBar
          isDirty={isDirty}
          saveStatus={saveStatus}
          onReset={() => {
            if (config) {
              form.reset({
                integrations: config.integrations,
                promoPopup: config.promoPopup,
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
// Tools Tab
// ---------------------------------------------------------------------------

interface ToolsTabProps {
  register: UseFormRegister<IntegrationsFormData>;
  errors: FieldErrors<IntegrationsFormData>;
}

function ToolsTab({ register, errors }: ToolsTabProps) {
  return (
    <>
      {/* Analytics */}
      <FormSection
        title="Analytics"
        description="Tracking and analytics integrations"
        icon={<BarChart3 className="h-4 w-4" />}
        comingSoon
      >
        <FieldGroup columns={2}>
          <FormField<IntegrationsFormData>
            label="Google Analytics ID"
            name="integrations.analytics.googleAnalyticsId"
            register={register}
            errors={errors}
            placeholder="G-XXXXXXXXXX"
          />
          <FormField<IntegrationsFormData>
            label="Google Tag Manager ID"
            name="integrations.analytics.googleTagManagerId"
            register={register}
            errors={errors}
            placeholder="GTM-XXXXXXX"
          />
          <FormField<IntegrationsFormData>
            label="Facebook Pixel ID"
            name="integrations.analytics.facebookPixelId"
            register={register}
            errors={errors}
            placeholder="XXXXXXXXXXXXXXX"
          />
          <FormField<IntegrationsFormData>
            label="Hotjar ID"
            name="integrations.analytics.hotjarId"
            register={register}
            errors={errors}
            placeholder="XXXXXXX"
          />
        </FieldGroup>
      </FormSection>

      {/* Marketing */}
      <FormSection
        title="Marketing"
        description="Email marketing and automation"
        icon={<Megaphone className="h-4 w-4" />}
        comingSoon
      >
        <FieldGroup columns={2}>
          <FormField<IntegrationsFormData>
            label="Mailchimp List ID"
            name="integrations.marketing.mailchimpListId"
            register={register}
            errors={errors}
            placeholder="abcdef1234"
          />
          <FormField<IntegrationsFormData>
            label="Klaviyo API Key"
            name="integrations.marketing.klaviyoApiKey"
            register={register}
            errors={errors}
            placeholder="pk_xxxx..."
          />
        </FieldGroup>
      </FormSection>

      {/* Customer Support */}
      <FormSection
        title="Customer Support"
        description="Live chat and support tools"
        icon={<Headphones className="h-4 w-4" />}
        comingSoon
      >
        <FieldGroup columns={2}>
          <FormField<IntegrationsFormData>
            label="Intercom App ID"
            name="integrations.support.intercomAppId"
            register={register}
            errors={errors}
            placeholder="xxxxxxxx"
          />
          <FormField<IntegrationsFormData>
            label="Zendesk Key"
            name="integrations.support.zendeskKey"
            register={register}
            errors={errors}
            placeholder="xxxxxxxx-xxxx-..."
          />
          <FormField<IntegrationsFormData>
            label="Crisp Website ID"
            name="integrations.support.crispWebsiteId"
            register={register}
            errors={errors}
            placeholder="xxxxxxxx-xxxx-..."
          />
        </FieldGroup>
      </FormSection>

      {/* Social Media */}
      <FormSection
        title="Social Media"
        description="Your social media profile URLs"
        icon={<Share2 className="h-4 w-4" />}
      >
        <FieldGroup columns={2}>
          <FormField<IntegrationsFormData>
            label="Facebook"
            name="integrations.social.facebook"
            register={register}
            errors={errors}
            placeholder="https://facebook.com/yourstore"
          />
          <FormField<IntegrationsFormData>
            label="Instagram"
            name="integrations.social.instagram"
            register={register}
            errors={errors}
            placeholder="https://instagram.com/yourstore"
          />
          <FormField<IntegrationsFormData>
            label="Twitter / X"
            name="integrations.social.twitter"
            register={register}
            errors={errors}
            placeholder="https://twitter.com/yourstore"
          />
          <FormField<IntegrationsFormData>
            label="YouTube"
            name="integrations.social.youtube"
            register={register}
            errors={errors}
            placeholder="https://youtube.com/c/yourstore"
          />
          <FormField<IntegrationsFormData>
            label="TikTok"
            name="integrations.social.tiktok"
            register={register}
            errors={errors}
            placeholder="https://tiktok.com/@yourstore"
          />
          <FormField<IntegrationsFormData>
            label="Pinterest"
            name="integrations.social.pinterest"
            register={register}
            errors={errors}
            placeholder="https://pinterest.com/yourstore"
          />
        </FieldGroup>
      </FormSection>
    </>
  );
}

// ---------------------------------------------------------------------------
// Promo & Marketing Tab
// ---------------------------------------------------------------------------

interface PromoTabProps {
  register: UseFormRegister<IntegrationsFormData>;
  control: Control<IntegrationsFormData>;
  errors: FieldErrors<IntegrationsFormData>;
  watch: UseFormWatch<IntegrationsFormData>;
}

function PromoTab({ register, control, errors, watch }: PromoTabProps) {
  const popupEnabled = watch("promoPopup.enabled");
  const autoDetectSales = watch("promoPopup.autoDetectSales");

  return (
    <>
      {/* Popup Settings */}
      <FormSection title="Popup Settings" description="Enable and configure promotional popups">
        <FormSwitch<IntegrationsFormData>
          label="Enable Popup"
          name="promoPopup.enabled"
          control={control}
          description="Show a promotional popup to visitors"
        />
        {popupEnabled && (
          <FormSwitch<IntegrationsFormData>
            label="Auto-detect from Sales"
            name="promoPopup.autoDetectSales"
            control={control}
            description="Automatically detect items from Sale collection"
          />
        )}
      </FormSection>

      {/* Popup Content (manual mode only) */}
      {popupEnabled && !autoDetectSales && (
        <FormSection title="Popup Content" description="Customize the text and messaging of your popup">
          <FormField<IntegrationsFormData>
            label="Title"
            name="promoPopup.title"
            register={register}
            errors={errors}
            placeholder="Special Offer"
          />
          <FormField<IntegrationsFormData>
            label="Badge Text"
            name="promoPopup.badge"
            register={register}
            errors={errors}
            placeholder="Up to 25% Off"
          />
          <FormTextarea<IntegrationsFormData>
            label="Body Text"
            name="promoPopup.body"
            register={register}
            errors={errors}
            placeholder="Don't miss out on our biggest sale..."
          />
          <FieldGroup columns={2}>
            <FormField<IntegrationsFormData>
              label="CTA Button Text"
              name="promoPopup.ctaText"
              register={register}
              errors={errors}
              placeholder="Shop Sale Items"
            />
            <FormField<IntegrationsFormData>
              label="CTA Button Link"
              name="promoPopup.ctaLink"
              register={register}
              errors={errors}
              placeholder="/products?onSale=true"
            />
          </FieldGroup>
        </FormSection>
      )}

      {/* Text Labels */}
      {popupEnabled && (
        <FormSection title="Text Labels" description="Customize button and label text">
          {autoDetectSales && (
            <FormField<IntegrationsFormData>
              label="Items on Sale Text"
              name="promoPopup.itemsOnSaleText"
              register={register}
              errors={errors}
              placeholder="{count} items on sale"
            />
          )}
          <FormField<IntegrationsFormData>
            label="Maybe Later Text"
            name="promoPopup.maybeLaterText"
            register={register}
            errors={errors}
            placeholder="Maybe later"
          />
        </FormSection>
      )}

      {/* Popup Media (manual mode only) */}
      {popupEnabled && !autoDetectSales && (
        <FormSection title="Popup Media" description="Add images to make your popup more engaging">
          <FormField<IntegrationsFormData>
            label="Background Image URL"
            name="promoPopup.backgroundImageUrl"
            register={register}
            errors={errors}
            placeholder="https://..."
          />
          <FormField<IntegrationsFormData>
            label="Featured Image URL"
            name="promoPopup.imageUrl"
            register={register}
            errors={errors}
            placeholder="https://..."
          />
        </FormSection>
      )}

      {/* Popup Behavior */}
      {popupEnabled && (
        <FormSection title="Popup Behavior" description="Control when and how the popup appears">
          <FieldGroup columns={2}>
            <FormField<IntegrationsFormData>
              label="Delay (seconds)"
              name="promoPopup.delaySeconds"
              register={register}
              errors={errors}
              type="number"
            />
            <FormField<IntegrationsFormData>
              label="Show Again After (hours)"
              name="promoPopup.ttlHours"
              register={register}
              errors={errors}
              type="number"
            />
          </FieldGroup>
          <FormSwitch<IntegrationsFormData>
            label="Show Once Per Session"
            name="promoPopup.showOncePerSession"
            control={control}
          />
          <FormSwitch<IntegrationsFormData>
            label="Exclude Checkout Pages"
            name="promoPopup.excludeCheckout"
            control={control}
          />
          <FormSwitch<IntegrationsFormData>
            label="Exclude Cart Page"
            name="promoPopup.excludeCart"
            control={control}
          />
        </FormSection>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Next.js page export
// ---------------------------------------------------------------------------

export default IntegrationsPage;
