import { useAppBridge } from "@saleor/app-sdk/app-bridge";
import { NextPage } from "next";
import { useRouter } from "next/router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";

import { AppLayout } from "@/modules/ui/app-layout";
import { SectionCard } from "@/modules/ui/section-card";
import { FormField } from "@/modules/ui/form-field";
import { StickySaveBar } from "@/modules/ui/sticky-save-bar";
import { SimpleCheckbox } from "@/modules/ui/simple-checkbox";
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
      // Ensure legalLinks are initialized with defaults if missing (text comes from content.footer, not here)
      const footerData = {
        ...config.footer,
        legalLinks: config.footer.legalLinks || {
          trackOrder: { enabled: true, url: "/track-order" },
          privacyPolicy: { enabled: true, url: "/pages/privacy-policy" },
          termsOfService: { enabled: true, url: "/pages/terms-of-service" },
          shippingPolicy: { enabled: true, url: "/pages/shipping-policy" },
          returnPolicy: { enabled: true, url: "/pages/return-policy" },
        },
      };
      reset(footerData);
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
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <span>Loading...</span>
      </div>
    );
  }

  return (
    <AppLayout channelSlug={channelSlug} channelName={config?.store.name} activeTab="footer">
      <form onSubmit={handleSubmit(onSubmit)}>
        <SectionCard 
          id="footer-content"
          title="Footer Sections" 
          description="Choose which sections to display in your footer"
          keywords={["footer", "newsletter", "social", "contact"]}
          icon="📋"
        >

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <SimpleCheckbox
              name="showBrand"
              control={control}
              label="Brand/Logo Section"
              description="Show store logo and name in the footer"
            />

            <SimpleCheckbox
              name="showMenu"
              control={control}
              label="Menu Links Section"
              description="Show navigation menu links (managed in Dashboard → Navigation → Menus)"
            />

            <SimpleCheckbox
              name="showContactInfo"
              control={control}
              label="Contact Information"
              description="Show email, phone, and address in the footer"
            />

            <SimpleCheckbox
              name="showNewsletter"
              control={control}
              label="Newsletter Signup"
              description="Show newsletter subscription form in the footer"
            />

            <SimpleCheckbox
              name="showSocialLinks"
              control={control}
              label="Social Media Links"
              description="Display social media icons (configured in Integrations)"
            />
          </div>
        </SectionCard>

        <SectionCard
          id="footer-legal-links"
          title="Legal Links (Bottom Bar)"
          description="Configure the legal links displayed in the footer bottom bar"
          keywords={["footer", "legal", "links", "privacy", "terms"]}
          icon="⚖️"
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {["trackOrder", "privacyPolicy", "termsOfService", "shippingPolicy", "returnPolicy"].map((linkKey) => {
              const linkLabel = linkKey
                .replace(/([A-Z])/g, " $1")
                .replace(/^./, (str) => str.toUpperCase())
                .trim();
              
              return (
                <div key={linkKey} style={{ 
                  padding: "16px", 
                  border: "1px solid #e0e0e0", 
                  borderRadius: "8px",
                  backgroundColor: "#fafafa"
                }}>
                  <SimpleCheckbox
                    name={`legalLinks.${linkKey}.enabled` as any}
                    control={control}
                    label={`Show ${linkLabel}`}
                    description={`Display "${linkLabel}" link in footer bottom bar`}
                  />
                  <div style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "12px" }}>
                    <div style={{ 
                      padding: "8px 12px", 
                      backgroundColor: "#e3f2fd", 
                      borderRadius: "4px",
                      fontSize: "13px",
                      color: "#1976d2"
                    }}>
                      ℹ️ Link text is configured in the <strong>Content → Footer Text</strong> section
                    </div>
                    <FormField
                      label={`${linkLabel} URL`}
                      name={`legalLinks.${linkKey}.url` as any}
                      register={register}
                      errors={errors}
                      type="text"
                      placeholder={linkKey === "trackOrder" ? "/track-order" : `/pages/${linkKey.toLowerCase().replace(/([A-Z])/g, "-$1").toLowerCase()}`}
                      description="URL path (e.g., /track-order, /pages/privacy-policy)"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </SectionCard>

        <SectionCard
          id="footer-legal"
          title="Copyright"
          description="Customize the copyright text in your footer"
          keywords={["footer", "copyright", "legal"]}
          icon="©️"
        >
          <FormField
            label="Custom Copyright Text"
            name="copyrightText"
            register={register}
            errors={errors}
            placeholder="© 2024 Your Store Name. All rights reserved."
            description="Leave empty to use default format with store name and current year"
          />
          <p style={{ fontSize: "12px", color: "#666", marginTop: "16px", margin: "16px 0 0 0" }}>
            Default: © {new Date().getFullYear()} {config?.store.name || "Store Name"}. All rights reserved.
          </p>
        </SectionCard>

        <SectionCard
          id="footer-policy-content"
          title="Policy Page Content"
          description="Configure title, header, main content, default content (when main is empty), and footer for each policy page. Nothing is hardcoded—all text comes from here."
          keywords={["footer", "policy", "return", "shipping", "privacy", "terms", "header", "footer"]}
          icon="📄"
        >
          <FormField
            label="Empty state message"
            name="policyPageEmptyMessage"
            register={register}
            errors={errors}
            type="text"
            placeholder="Content for this page can be configured in Storefront Control → Footer → Policy Page Content."
            description="Shown when a policy page has no content and no default content set."
          />
          {[
            {
              prefix: "returnPolicy",
              label: "Return / Exchange Policy",
              contentPlaceholder: "Paste return & exchange policy text here (e.g. מדיניות החלפות/החזרות...)",
            },
            { prefix: "shippingPolicy", label: "Shipping Policy", contentPlaceholder: "Paste shipping policy text here" },
            { prefix: "privacyPolicy", label: "Privacy Policy", contentPlaceholder: "Paste privacy policy text here" },
            { prefix: "termsOfService", label: "Terms of Service", contentPlaceholder: "Paste terms of service text here" },
          ].map(({ prefix, label, contentPlaceholder }) => (
            <div
              key={prefix}
              style={{
                padding: "20px",
                border: "1px solid #e0e0e0",
                borderRadius: "8px",
                backgroundColor: "#fafafa",
                marginBottom: "20px",
              }}
            >
              <div style={{ fontSize: "16px", fontWeight: 600, marginBottom: "16px" }}>{label}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <FormField
                  label="Page title"
                  name={`${prefix}PageTitle` as any}
                  register={register}
                  errors={errors}
                  placeholder={`Override the page heading (e.g. "${label}")`}
                  description="Leave empty to use the footer link label."
                />
                <FormField
                  label="Header (above main content)"
                  name={`${prefix}Header` as any}
                  register={register}
                  errors={errors}
                  type="textarea"
                  placeholder="Optional intro or summary"
                  description="Shown at the top of the page, above the main content."
                />
                <FormField
                  label="Main content"
                  name={`${prefix}Content` as any}
                  register={register}
                  errors={errors}
                  type="textarea"
                  placeholder={contentPlaceholder}
                  description="Primary content. Line breaks are preserved."
                />
                <FormField
                  label="Default content (when main is empty)"
                  name={`${prefix}DefaultContent` as any}
                  register={register}
                  errors={errors}
                  type="textarea"
                  placeholder="Optional default text when main content is not set"
                  description="Shown when main content is empty. Leave empty to show the empty state message."
                />
                <FormField
                  label="Footer (below main content)"
                  name={`${prefix}Footer` as any}
                  register={register}
                  errors={errors}
                  type="textarea"
                  placeholder="Optional footer (e.g. last updated, contact)"
                  description="Shown at the bottom of the page."
                />
              </div>
            </div>
          ))}
        </SectionCard>

        <StickySaveBar
          isDirty={isDirty}
          isLoading={updateMutation.isLoading}
          isSuccess={saveStatus === "success"}
          isError={saveStatus === "error"}
          onReset={() => reset(config?.footer)}
          onSubmit={handleSubmit(onSubmit)}
        />
      </form>
    </AppLayout>
  );
};

export async function getServerSideProps() {
  return { props: {} };
}

export default FooterPage;
