import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import type {
  Control,
  FieldErrors,
  UseFormRegister,
  UseFormWatch,
} from "react-hook-form";
import { z } from "zod";
import {
  FileText,
  Scale,
  Lock,
  ToggleLeft,
  MessageSquare,
  AlertTriangle,
  Accessibility,
} from "lucide-react";

import { AppShell } from "@/components/layout/AppShell";
import { SaveBar } from "@/components/layout/SaveBar";
import { FormField } from "@/components/forms/FormField";
import { FormSection } from "@/components/forms/FormSection";
import { FieldGroup } from "@/components/shared/FieldGroup";
import { FeatureCard } from "@/components/shared/FeatureCard";
import { LoadingState } from "@/components/shared/LoadingState";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useConfigPage } from "@/hooks/useConfigPage";
import { PagesSchema, ContentSchema, FooterSchema } from "@/modules/config/schema";

// ---------------------------------------------------------------------------
// Form schema & types
// ---------------------------------------------------------------------------

const StaticPagesFormSchema = z.object({
  pages: PagesSchema,
  content: ContentSchema,
  footer: FooterSchema,
});

type StaticPagesFormData = z.infer<typeof StaticPagesFormSchema>;

interface TabProps {
  control: Control<StaticPagesFormData>;
  register: UseFormRegister<StaticPagesFormData>;
  errors: FieldErrors<StaticPagesFormData>;
  watch: UseFormWatch<StaticPagesFormData>;
}

// ---------------------------------------------------------------------------
// Tab definitions
// ---------------------------------------------------------------------------

const TABS = [
  { id: "toggles", label: "Page Toggles", icon: ToggleLeft },
  { id: "legal", label: "Legal Content", icon: Scale },
  { id: "contact", label: "Contact & FAQ", icon: MessageSquare },
  { id: "errors", label: "Error Pages", icon: AlertTriangle },
] as const;

type TabId = (typeof TABS)[number]["id"];

function isValidTab(v: string | undefined): v is TabId {
  return TABS.some((t) => t.id === v);
}

// ---------------------------------------------------------------------------
// Page Toggles Tab
// ---------------------------------------------------------------------------

function PageTogglesTab({ control }: TabProps) {
  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Information Pages
          </h3>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FeatureCard icon={<FileText className="h-5 w-5" />} title="About Us" description="Company information" name="pages.aboutUs" control={control} />
          <FeatureCard icon={<FileText className="h-5 w-5" />} title="Contact" description="Contact form" name="pages.contact" control={control} />
          <FeatureCard icon={<FileText className="h-5 w-5" />} title="FAQ" description="Frequently asked questions" name="pages.faq" control={control} />
          <FeatureCard icon={<FileText className="h-5 w-5" />} title="Blog" description="News and articles" name="pages.blog" control={control} comingSoon />
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Scale className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Legal Pages
          </h3>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FeatureCard icon={<Scale className="h-5 w-5" />} title="Privacy Policy" description="Data privacy" name="pages.privacyPolicy" control={control} />
          <FeatureCard icon={<Scale className="h-5 w-5" />} title="Terms of Service" description="Terms and conditions" name="pages.termsOfService" control={control} />
          <FeatureCard icon={<Scale className="h-5 w-5" />} title="Shipping Policy" description="Shipping information" name="pages.shippingPolicy" control={control} />
          <FeatureCard icon={<Scale className="h-5 w-5" />} title="Return Policy" description="Returns and refunds" name="pages.returnPolicy" control={control} />
          <FeatureCard icon={<Accessibility className="h-5 w-5" />} title="Accessibility" description="Accessibility statement" name="pages.accessibility" control={control} />
        </div>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Legal Content Tab
// ---------------------------------------------------------------------------

function LegalContentTab({ register, errors }: TabProps) {
  return (
    <>
      <FormSection title="Privacy Policy" description="Edit your privacy policy content (supports markdown: ## headings, * bullets, **bold**)">
        <FormField<StaticPagesFormData> label="Page Title" name="footer.privacyPolicyPageTitle" register={register} errors={errors} placeholder="Privacy Policy" />
        <FormField<StaticPagesFormData> label="Header" name="footer.privacyPolicyHeader" register={register} errors={errors} placeholder="Optional header text" />
        <FormField<StaticPagesFormData> label="Content" name="footer.privacyPolicyContent" register={register} errors={errors} as="textarea" rows={12} placeholder="Your privacy policy content..." />
      </FormSection>

      <FormSection title="Terms of Service" description="Edit your terms of service content">
        <FormField<StaticPagesFormData> label="Page Title" name="footer.termsOfServicePageTitle" register={register} errors={errors} placeholder="Terms of Service" />
        <FormField<StaticPagesFormData> label="Header" name="footer.termsOfServiceHeader" register={register} errors={errors} placeholder="Optional header text" />
        <FormField<StaticPagesFormData> label="Content" name="footer.termsOfServiceContent" register={register} errors={errors} as="textarea" rows={12} placeholder="Your terms of service content..." />
      </FormSection>

      <FormSection title="Shipping Policy" description="Edit your shipping policy content">
        <FormField<StaticPagesFormData> label="Page Title" name="footer.shippingPolicyPageTitle" register={register} errors={errors} placeholder="Shipping Policy" />
        <FormField<StaticPagesFormData> label="Header" name="footer.shippingPolicyHeader" register={register} errors={errors} placeholder="Optional header text" />
        <FormField<StaticPagesFormData> label="Content" name="footer.shippingPolicyContent" register={register} errors={errors} as="textarea" rows={12} placeholder="Your shipping policy content..." />
      </FormSection>

      <FormSection title="Return Policy" description="Edit your return and refund policy content">
        <FormField<StaticPagesFormData> label="Page Title" name="footer.returnPolicyPageTitle" register={register} errors={errors} placeholder="Return Policy" />
        <FormField<StaticPagesFormData> label="Header" name="footer.returnPolicyHeader" register={register} errors={errors} placeholder="Optional header text" />
        <FormField<StaticPagesFormData> label="Content" name="footer.returnPolicyContent" register={register} errors={errors} as="textarea" rows={12} placeholder="Your return policy content..." />
      </FormSection>

      <FormSection title="Accessibility Statement" description="Edit your accessibility statement (required by Israeli law)">
        <FormField<StaticPagesFormData> label="Page Title" name="footer.accessibilityPageTitle" register={register} errors={errors} placeholder="Accessibility Statement" />
        <FormField<StaticPagesFormData> label="Header" name="footer.accessibilityHeader" register={register} errors={errors} placeholder="Optional header text" />
        <FormField<StaticPagesFormData> label="Content" name="footer.accessibilityContent" register={register} errors={errors} as="textarea" rows={12} placeholder="Your accessibility statement content..." />
      </FormSection>

      <FormSection title="Footer Legal" description="VAT statement and empty policy fallback">
        <FormField<StaticPagesFormData> label="VAT Statement" name="footer.vatStatement" register={register} errors={errors} placeholder="All prices include 18% VAT" />
        <FormField<StaticPagesFormData> label="Empty Policy Message" name="footer.policyPageEmptyMessage" register={register} errors={errors} placeholder="This policy has not been configured yet." />
      </FormSection>
    </>
  );
}

// ---------------------------------------------------------------------------
// Contact & FAQ Tab
// ---------------------------------------------------------------------------

function ContactFaqTab({ register, errors, control, watch }: TabProps) {
  return (
    <>
      <FormSection title="Contact Page" description="Contact page content">
        <FieldGroup columns={2}>
          <FormField<StaticPagesFormData> label="Hero Title" name="content.contact.heroTitle" register={register} errors={errors} placeholder="Contact Us" />
          <FormField<StaticPagesFormData> label="Hero Description" name="content.contact.heroDescription" register={register} errors={errors} />
          <FormField<StaticPagesFormData> label="Email Label" name="content.contact.emailLabel" register={register} errors={errors} placeholder="Email" />
          <FormField<StaticPagesFormData> label="Phone Label" name="content.contact.phoneLabel" register={register} errors={errors} placeholder="Phone" />
          <FormField<StaticPagesFormData> label="Address Label" name="content.contact.addressLabel" register={register} errors={errors} placeholder="Address" />
          <FormField<StaticPagesFormData> label="Send Button" name="content.contact.sendButton" register={register} errors={errors} placeholder="Send Message" />
          <FormField<StaticPagesFormData> label="Form Title" name="content.contact.formTitle" register={register} errors={errors} placeholder="Send us a message" />
          <FormField<StaticPagesFormData> label="FAQs Title" name="content.contact.faqsTitle" register={register} errors={errors} placeholder="Frequently Asked Questions" />
        </FieldGroup>
      </FormSection>

      <FormSection title="FAQ Page" description="FAQ page text and labels">
        <FieldGroup columns={2}>
          <FormField<StaticPagesFormData> label="Hero Title" name="content.faq.heroTitle" register={register} errors={errors} placeholder="How Can We Help?" />
          <FormField<StaticPagesFormData> label="Hero Description" name="content.faq.heroDescription" register={register} errors={errors} placeholder="Find answers to frequently asked questions..." />
          <FormField<StaticPagesFormData> label="Search Placeholder" name="content.faq.searchPlaceholder" register={register} errors={errors} placeholder="Search for answers..." />
          <FormField<StaticPagesFormData> label="Categories Label" name="content.faq.categoriesLabel" register={register} errors={errors} placeholder="Categories" />
          <FormField<StaticPagesFormData> label="Results Label" name="content.faq.resultsLabel" register={register} errors={errors} placeholder='{count} result(s) for "{query}"' />
          <FormField<StaticPagesFormData> label="No Results Text" name="content.faq.noResultsText" register={register} errors={errors} placeholder="No results found. Try a different search term or" />
          <FormField<StaticPagesFormData> label="Contact Us Link" name="content.faq.contactUsLink" register={register} errors={errors} placeholder="contact us" />
          <FormField<StaticPagesFormData> label="Still Questions Title" name="content.faq.stillHaveQuestionsTitle" register={register} errors={errors} placeholder="Still Have Questions?" />
          <FormField<StaticPagesFormData> label="Still Questions Description" name="content.faq.stillHaveQuestionsDescription" register={register} errors={errors} placeholder="Our support team is available 24/7..." />
          <FormField<StaticPagesFormData> label="Contact Us Button" name="content.faq.contactUsButton" register={register} errors={errors} placeholder="Contact Us" />
          <FormField<StaticPagesFormData> label="Call Us Button" name="content.faq.callUsButton" register={register} errors={errors} placeholder="Call Us" />
        </FieldGroup>
      </FormSection>
    </>
  );
}

// ---------------------------------------------------------------------------
// Error Pages Tab
// ---------------------------------------------------------------------------

function ErrorPagesTab({ register, errors }: TabProps) {
  return (
    <>
      <FormSection title="404 Page" description="Page not found text">
        <FieldGroup columns={2}>
          <FormField<StaticPagesFormData> label="Title" name="content.notFound.title" register={register} errors={errors} placeholder="Page Not Found" />
          <FormField<StaticPagesFormData> label="Description" name="content.notFound.description" register={register} errors={errors} />
          <FormField<StaticPagesFormData> label="Back to Home" name="content.notFound.backToHomeButton" register={register} errors={errors} placeholder="Go Home" />
          <FormField<StaticPagesFormData> label="Browse Products" name="content.notFound.browseProductsButton" register={register} errors={errors} placeholder="Browse Products" />
        </FieldGroup>
      </FormSection>

      <FormSection title="Error Page" description="Generic error page text">
        <FieldGroup columns={2}>
          <FormField<StaticPagesFormData> label="Title" name="content.error.title" register={register} errors={errors} placeholder="Something went wrong" />
          <FormField<StaticPagesFormData> label="Description" name="content.error.description" register={register} errors={errors} />
          <FormField<StaticPagesFormData> label="Try Again Button" name="content.error.tryAgainButton" register={register} errors={errors} placeholder="Try Again" />
          <FormField<StaticPagesFormData> label="Back to Home" name="content.error.backToHomeButton" register={register} errors={errors} placeholder="Go Home" />
        </FieldGroup>
      </FormSection>
    </>
  );
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

function StaticPagesPage() {
  const router = useRouter();
  const tabParam = router.query.tab as string | undefined;
  const initialTab = isValidTab(tabParam) ? tabParam : "toggles";
  const [activeTab, setActiveTab] = useState<TabId>(initialTab);

  useEffect(() => {
    if (isValidTab(tabParam) && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [tabParam]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleTabChange(value: string) {
    const tab = value as TabId;
    setActiveTab(tab);
    router.replace(
      { pathname: router.pathname, query: { ...router.query, tab } },
      undefined,
      { shallow: true },
    );
  }

  const { config, isNotReady, form, onSubmit, saveStatus } = useConfigPage({
    schema: StaticPagesFormSchema,
    sections: ["pages", "content", "footer"],
    extractFormData: (c) => ({
      pages: c.pages,
      content: c.content,
      footer: c.footer,
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
      <AppShell channelSlug="" activePage="static-pages" title="Static Pages">
        <LoadingState />
      </AppShell>
    );
  }

  return (
    <AppShell
      channelSlug={router.query.channelSlug as string}
      channelName={config?.store.name}
      activePage="static-pages"
      title="Static Pages"
      description="Contact, FAQ, error pages, and page toggles"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 p-6">
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="mb-6">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <TabsTrigger key={tab.id} value={tab.id} className="gap-2">
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </TabsTrigger>
              );
            })}
          </TabsList>

          <TabsContent value="toggles" forceMount className={activeTab !== "toggles" ? "hidden" : "space-y-6"}>
            <PageTogglesTab control={control} register={register} errors={errors} watch={watch} />
          </TabsContent>

          <TabsContent value="legal" forceMount className={activeTab !== "legal" ? "hidden" : "space-y-6"}>
            <LegalContentTab control={control} register={register} errors={errors} watch={watch} />
          </TabsContent>

          <TabsContent value="contact" forceMount className={activeTab !== "contact" ? "hidden" : "space-y-6"}>
            <ContactFaqTab control={control} register={register} errors={errors} watch={watch} />
          </TabsContent>

          <TabsContent value="errors" forceMount className={activeTab !== "errors" ? "hidden" : "space-y-6"}>
            <ErrorPagesTab control={control} register={register} errors={errors} watch={watch} />
          </TabsContent>
        </Tabs>

        <SaveBar
          isDirty={isDirty}
          saveStatus={saveStatus}
          onReset={() => {
            if (config) {
              form.reset({ pages: config.pages, content: config.content, footer: config.footer });
            }
          }}
          onSubmit={handleSubmit(onSubmit)}
        />
      </form>
    </AppShell>
  );
}

export default StaticPagesPage;
