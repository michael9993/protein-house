import { BarChart3, Headphones, Megaphone, Share2 } from "lucide-react";

import { FormField } from "@/components/forms/FormField";
import { FormSection } from "@/components/forms/FormSection";
import { FieldGroup } from "@/components/shared/FieldGroup";
import type { GlobalFormData, GlobalTabProps } from "./types";

export function IntegrationsToolsTab({ register, errors }: GlobalTabProps) {
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
          <FormField<GlobalFormData>
            label="Google Analytics ID"
            name="integrations.analytics.googleAnalyticsId"
            register={register}
            errors={errors}
            placeholder="G-XXXXXXXXXX"
          />
          <FormField<GlobalFormData>
            label="Google Tag Manager ID"
            name="integrations.analytics.googleTagManagerId"
            register={register}
            errors={errors}
            placeholder="GTM-XXXXXXX"
          />
          <FormField<GlobalFormData>
            label="Facebook Pixel ID"
            name="integrations.analytics.facebookPixelId"
            register={register}
            errors={errors}
            placeholder="XXXXXXXXXXXXXXX"
          />
          <FormField<GlobalFormData>
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
          <FormField<GlobalFormData>
            label="Mailchimp List ID"
            name="integrations.marketing.mailchimpListId"
            register={register}
            errors={errors}
            placeholder="abcdef1234"
          />
          <FormField<GlobalFormData>
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
      >
        <FieldGroup columns={2}>
          <FormField<GlobalFormData>
            label="WhatsApp Business Number"
            name="integrations.support.whatsappBusinessNumber"
            register={register}
            errors={errors}
            placeholder="+972501234567"
            description="Include country code. A floating chat button appears on all pages."
          />
          <FormField<GlobalFormData>
            label="WhatsApp Default Message"
            name="integrations.support.whatsappDefaultMessage"
            register={register}
            errors={errors}
            placeholder="Hi! I'd like more information"
            description="Pre-filled message when customers open the chat"
          />
        </FieldGroup>
        <FieldGroup columns={2}>
          <FormField<GlobalFormData>
            label="Intercom App ID"
            name="integrations.support.intercomAppId"
            register={register}
            errors={errors}
            placeholder="xxxxxxxx"
          />
          <FormField<GlobalFormData>
            label="Zendesk Key"
            name="integrations.support.zendeskKey"
            register={register}
            errors={errors}
            placeholder="xxxxxxxx-xxxx-..."
          />
          <FormField<GlobalFormData>
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
          <FormField<GlobalFormData>
            label="Facebook"
            name="integrations.social.facebook"
            register={register}
            errors={errors}
            placeholder="https://facebook.com/yourstore"
          />
          <FormField<GlobalFormData>
            label="Instagram"
            name="integrations.social.instagram"
            register={register}
            errors={errors}
            placeholder="https://instagram.com/yourstore"
          />
          <FormField<GlobalFormData>
            label="Twitter / X"
            name="integrations.social.twitter"
            register={register}
            errors={errors}
            placeholder="https://twitter.com/yourstore"
          />
          <FormField<GlobalFormData>
            label="YouTube"
            name="integrations.social.youtube"
            register={register}
            errors={errors}
            placeholder="https://youtube.com/c/yourstore"
          />
          <FormField<GlobalFormData>
            label="TikTok"
            name="integrations.social.tiktok"
            register={register}
            errors={errors}
            placeholder="https://tiktok.com/@yourstore"
          />
          <FormField<GlobalFormData>
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
