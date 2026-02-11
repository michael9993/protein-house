import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useFieldArray } from "react-hook-form";
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
  Plus,
  Trash2,
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
import { PagesSchema, ContentSchema } from "@/modules/config/schema";

// ---------------------------------------------------------------------------
// Form schema & types
// ---------------------------------------------------------------------------

const OtherPagesFormSchema = z.object({
  pages: PagesSchema,
  content: ContentSchema,
});

type OtherPagesFormData = z.infer<typeof OtherPagesFormSchema>;

interface TabProps {
  control: Control<OtherPagesFormData>;
  register: UseFormRegister<OtherPagesFormData>;
  errors: FieldErrors<OtherPagesFormData>;
  watch: UseFormWatch<OtherPagesFormData>;
}

// ---------------------------------------------------------------------------
// Tab definitions
// ---------------------------------------------------------------------------

const OTHER_PAGES_TABS = [
  { id: "toggles", label: "Page Toggles", icon: ToggleLeft },
  { id: "contact", label: "Contact & FAQ", icon: MessageSquare },
  { id: "errors", label: "Error Pages", icon: AlertTriangle },
] as const;

type OtherPagesTabId = (typeof OTHER_PAGES_TABS)[number]["id"];

function isValidTab(value: string | undefined): value is OtherPagesTabId {
  return OTHER_PAGES_TABS.some((t) => t.id === value);
}

// ---------------------------------------------------------------------------
// Page Toggles Tab
// ---------------------------------------------------------------------------

function PageTogglesTab({ control }: TabProps) {
  return (
    <>
      {/* Information Pages */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Information Pages
          </h3>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FeatureCard
            icon={<FileText className="h-5 w-5" />}
            title="About Us"
            description="Company information and story"
            name="pages.aboutUs"
            control={control}
          />
          <FeatureCard
            icon={<FileText className="h-5 w-5" />}
            title="Contact"
            description="Contact form and information"
            name="pages.contact"
            control={control}
          />
          <FeatureCard
            icon={<FileText className="h-5 w-5" />}
            title="FAQ"
            description="Frequently asked questions"
            name="pages.faq"
            control={control}
          />
          <FeatureCard
            icon={<FileText className="h-5 w-5" />}
            title="Blog"
            description="News and articles section"
            name="pages.blog"
            control={control}
            comingSoon
          />
        </div>
      </div>

      {/* Legal Pages */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Scale className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Legal Pages
          </h3>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FeatureCard
            icon={<Scale className="h-5 w-5" />}
            title="Privacy Policy"
            description="Data privacy information"
            name="pages.privacyPolicy"
            control={control}
            comingSoon
          />
          <FeatureCard
            icon={<Scale className="h-5 w-5" />}
            title="Terms of Service"
            description="Terms and conditions"
            name="pages.termsOfService"
            control={control}
            comingSoon
          />
          <FeatureCard
            icon={<Scale className="h-5 w-5" />}
            title="Shipping Policy"
            description="Shipping information"
            name="pages.shippingPolicy"
            control={control}
            comingSoon
          />
          <FeatureCard
            icon={<Scale className="h-5 w-5" />}
            title="Return Policy"
            description="Returns and refunds"
            name="pages.returnPolicy"
            control={control}
            comingSoon
          />
        </div>
      </div>

      {/* Authentication Pages */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Lock className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Authentication Pages
          </h3>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FeatureCard
            icon={<Lock className="h-5 w-5" />}
            title="Forgot Password"
            description="Request password reset link via email"
            name="pages.forgotPassword"
            control={control}
            comingSoon
          />
          <FeatureCard
            icon={<Lock className="h-5 w-5" />}
            title="Reset Password"
            description="Password reset and recovery page"
            name="pages.resetPassword"
            control={control}
            comingSoon
          />
          <FeatureCard
            icon={<Lock className="h-5 w-5" />}
            title="Verify Email"
            description="Request a new confirmation email"
            name="pages.verifyEmail"
            control={control}
            comingSoon
          />
          <FeatureCard
            icon={<Lock className="h-5 w-5" />}
            title="Confirm Email"
            description="Landing page for confirmation link"
            name="pages.confirmEmail"
            control={control}
            comingSoon
          />
        </div>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Contact & FAQ Tab
// ---------------------------------------------------------------------------

function ContactFaqTab({ control, register, errors }: TabProps) {
  const { fields: faqFields, append: addFaq, remove: removeFaq } = useFieldArray({
    control,
    name: "content.contact.faqs",
  });

  return (
    <>
      {/* Hero Section */}
      <FormSection title="Contact Hero" description="Hero section at the top of the contact page">
        <FieldGroup columns={2}>
          <FormField<OtherPagesFormData>
            label="Hero Title"
            name="content.contact.heroTitle"
            register={register}
            errors={errors}
            placeholder="Get in Touch"
          />
          <FormField<OtherPagesFormData>
            label="Hero Description"
            name="content.contact.heroDescription"
            register={register}
            errors={errors}
            placeholder="Have a question or need help? We're here for you."
          />
        </FieldGroup>
      </FormSection>

      {/* Contact Methods */}
      <FormSection title="Contact Method Labels" description="Labels for phone, email, and address contact methods">
        <FieldGroup columns={3}>
          <FormField<OtherPagesFormData>
            label="Email Label"
            name="content.contact.emailLabel"
            register={register}
            errors={errors}
            placeholder="Email"
          />
          <FormField<OtherPagesFormData>
            label="Phone Label"
            name="content.contact.phoneLabel"
            register={register}
            errors={errors}
            placeholder="Phone"
          />
          <FormField<OtherPagesFormData>
            label="Address Label"
            name="content.contact.addressLabel"
            register={register}
            errors={errors}
            placeholder="Address"
          />
        </FieldGroup>
      </FormSection>

      {/* Contact Form */}
      <FormSection title="Contact Form" description="Form labels, placeholders, and button text">
        <FieldGroup columns={2}>
          <FormField<OtherPagesFormData>
            label="Form Title"
            name="content.contact.formTitle"
            register={register}
            errors={errors}
            placeholder="Send Us a Message"
          />
          <FormField<OtherPagesFormData>
            label="Form Description"
            name="content.contact.formDescription"
            register={register}
            errors={errors}
            placeholder="We'll get back to you within 24 hours."
          />
          <FormField<OtherPagesFormData>
            label="Name Label"
            name="content.contact.nameLabel"
            register={register}
            errors={errors}
            placeholder="Your Name"
          />
          <FormField<OtherPagesFormData>
            label="Name Placeholder"
            name="content.contact.namePlaceholder"
            register={register}
            errors={errors}
            placeholder="John Doe"
          />
          <FormField<OtherPagesFormData>
            label="Email Label (Form)"
            name="content.contact.emailLabelForm"
            register={register}
            errors={errors}
            placeholder="Email Address"
          />
          <FormField<OtherPagesFormData>
            label="Email Placeholder"
            name="content.contact.emailPlaceholder"
            register={register}
            errors={errors}
            placeholder="john@example.com"
          />
          <FormField<OtherPagesFormData>
            label="Subject Label"
            name="content.contact.subjectLabel"
            register={register}
            errors={errors}
            placeholder="Subject"
          />
          <FormField<OtherPagesFormData>
            label="Subject Placeholder"
            name="content.contact.subjectPlaceholder"
            register={register}
            errors={errors}
            placeholder="How can we help?"
          />
          <FormField<OtherPagesFormData>
            label="Message Label"
            name="content.contact.messageLabel"
            register={register}
            errors={errors}
            placeholder="Message"
          />
          <FormField<OtherPagesFormData>
            label="Message Placeholder"
            name="content.contact.messagePlaceholder"
            register={register}
            errors={errors}
            placeholder="Tell us more about your inquiry..."
          />
          <FormField<OtherPagesFormData>
            label="Send Button"
            name="content.contact.sendButton"
            register={register}
            errors={errors}
            placeholder="Send Message"
          />
          <FormField<OtherPagesFormData>
            label="Sending Button (Loading)"
            name="content.contact.sendingButton"
            register={register}
            errors={errors}
            placeholder="Sending..."
          />
        </FieldGroup>
      </FormSection>

      {/* Success Message */}
      <FormSection title="Success Message" description="Shown after contact form is submitted successfully">
        <FieldGroup columns={2}>
          <FormField<OtherPagesFormData>
            label="Success Title"
            name="content.contact.successTitle"
            register={register}
            errors={errors}
            placeholder="Message Sent!"
          />
          <FormField<OtherPagesFormData>
            label="Success Description"
            name="content.contact.successDescription"
            register={register}
            errors={errors}
            placeholder="Thank you for reaching out. We'll be in touch soon."
          />
          <FormField<OtherPagesFormData>
            label="Send Another Message Link"
            name="content.contact.sendAnotherMessage"
            register={register}
            errors={errors}
            placeholder="Send another message"
          />
        </FieldGroup>
      </FormSection>

      {/* FAQ Section */}
      <FormSection title="FAQs Section" description="FAQ titles, descriptions, and dynamic FAQ items">
        <FieldGroup columns={2}>
          <FormField<OtherPagesFormData>
            label="FAQs Title"
            name="content.contact.faqsTitle"
            register={register}
            errors={errors}
            placeholder="Frequently Asked Questions"
          />
          <FormField<OtherPagesFormData>
            label="FAQs Description"
            name="content.contact.faqsDescription"
            register={register}
            errors={errors}
            placeholder="Find quick answers to common questions."
          />
          <FormField<OtherPagesFormData>
            label="View All FAQs Link"
            name="content.contact.viewAllFaqs"
            register={register}
            errors={errors}
            placeholder="View All FAQs"
          />
        </FieldGroup>

        {/* Dynamic FAQ Items */}
        <div className="mt-6 space-y-4">
          <h4 className="text-sm font-medium">FAQ Items</h4>
          {faqFields.map((field, index) => (
            <div
              key={field.id}
              className="rounded-lg border border-neutral-200 bg-neutral-50 p-4"
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-medium">FAQ #{index + 1}</span>
                <button
                  type="button"
                  onClick={() => removeFaq(index)}
                  className="inline-flex items-center gap-1 text-sm text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Remove
                </button>
              </div>
              <div className="space-y-3">
                <FormField<OtherPagesFormData>
                  label="Question"
                  name={`content.contact.faqs.${index}.question`}
                  register={register}
                  errors={errors}
                  placeholder="What are your shipping times?"
                />
                <FormField<OtherPagesFormData>
                  label="Answer"
                  name={`content.contact.faqs.${index}.answer`}
                  register={register}
                  errors={errors}
                  placeholder="Most orders ship within 24 hours. Standard delivery takes 3-5 business days..."
                />
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={() => addFaq({ question: "", answer: "" })}
            className="inline-flex items-center gap-2 rounded-md border border-dashed border-neutral-300 px-4 py-2 text-sm text-neutral-600 hover:border-neutral-400 hover:text-neutral-700"
          >
            <Plus className="h-4 w-4" />
            Add FAQ
          </button>
        </div>
      </FormSection>

      {/* Social Section */}
      <FormSection title="Social Section" description="Follow us section on the contact page">
        <FieldGroup columns={2}>
          <FormField<OtherPagesFormData>
            label="Follow Us Title"
            name="content.contact.followUsTitle"
            register={register}
            errors={errors}
            placeholder="Follow Us"
          />
          <FormField<OtherPagesFormData>
            label="Follow Us Description"
            name="content.contact.followUsDescription"
            register={register}
            errors={errors}
            placeholder="Stay connected for updates, tips, and exclusive offers."
          />
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
      {/* Error Page */}
      <FormSection title="Error Page" description="Text shown when something goes wrong (500 error)">
        <FieldGroup columns={2}>
          <FormField<OtherPagesFormData>
            label="Title"
            name="content.error.title"
            register={register}
            errors={errors}
            placeholder="Something went wrong"
          />
          <FormField<OtherPagesFormData>
            label="Description"
            name="content.error.description"
            register={register}
            errors={errors}
            placeholder="We're sorry, but something unexpected happened."
          />
          <FormField<OtherPagesFormData>
            label="Error Details Label"
            name="content.error.errorDetails"
            register={register}
            errors={errors}
            placeholder="Error details"
          />
          <FormField<OtherPagesFormData>
            label="Try Again Button"
            name="content.error.tryAgainButton"
            register={register}
            errors={errors}
            placeholder="Try Again"
          />
          <FormField<OtherPagesFormData>
            label="Back to Home Button"
            name="content.error.backToHomeButton"
            register={register}
            errors={errors}
            placeholder="Back to Home"
          />
          <FormField<OtherPagesFormData>
            label="Need Help Text"
            name="content.error.needHelpText"
            register={register}
            errors={errors}
            placeholder="Need help?"
          />
          <FormField<OtherPagesFormData>
            label="Contact Support Link"
            name="content.error.contactSupportLink"
            register={register}
            errors={errors}
            placeholder="Contact our support team"
          />
        </FieldGroup>
      </FormSection>

      {/* 404 Not Found Page */}
      <FormSection title="404 Not Found Page" description="Text shown when a page is not found">
        <FieldGroup columns={2}>
          <FormField<OtherPagesFormData>
            label="Title"
            name="content.notFound.title"
            register={register}
            errors={errors}
            placeholder="Page Not Found"
          />
          <FormField<OtherPagesFormData>
            label="Description"
            name="content.notFound.description"
            register={register}
            errors={errors}
            placeholder="Sorry, we couldn't find the page you're looking for."
          />
          <FormField<OtherPagesFormData>
            label="Back to Home Button"
            name="content.notFound.backToHomeButton"
            register={register}
            errors={errors}
            placeholder="Back to Home"
          />
          <FormField<OtherPagesFormData>
            label="Browse Products Button"
            name="content.notFound.browseProductsButton"
            register={register}
            errors={errors}
            placeholder="Browse Products"
          />
          <FormField<OtherPagesFormData>
            label="Helpful Links Text"
            name="content.notFound.helpfulLinksText"
            register={register}
            errors={errors}
            placeholder="Or check out these pages:"
          />
        </FieldGroup>
      </FormSection>
    </>
  );
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

function OtherPagesPage() {
  const router = useRouter();
  const tabParam = router.query.tab as string | undefined;
  const initialTab = isValidTab(tabParam) ? tabParam : "toggles";
  const [activeTab, setActiveTab] = useState<OtherPagesTabId>(initialTab);

  useEffect(() => {
    if (isValidTab(tabParam) && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [tabParam]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleTabChange(value: string) {
    const tab = value as OtherPagesTabId;
    setActiveTab(tab);
    router.replace(
      { pathname: router.pathname, query: { ...router.query, tab } },
      undefined,
      { shallow: true },
    );
  }

  const { config, isNotReady, form, onSubmit, saveStatus } = useConfigPage({
    schema: OtherPagesFormSchema,
    sections: ["pages", "content"],
    extractFormData: (c) => ({
      pages: c.pages,
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
      <AppShell channelSlug="" activePage="other-pages" title="Other Pages">
        <LoadingState />
      </AppShell>
    );
  }

  return (
    <AppShell
      channelSlug={router.query.channelSlug as string}
      channelName={config?.store.name}
      activePage="other-pages"
      title="Other Pages"
      description="Page toggles, contact page, FAQ, and error page text"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 p-6">
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="mb-6">
            {OTHER_PAGES_TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <TabsTrigger key={tab.id} value={tab.id} className="gap-2">
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </TabsTrigger>
              );
            })}
          </TabsList>

          <TabsContent
            value="toggles"
            forceMount
            className={activeTab !== "toggles" ? "hidden" : "space-y-6"}
          >
            <PageTogglesTab
              control={control}
              register={register}
              errors={errors}
              watch={watch}
            />
          </TabsContent>

          <TabsContent
            value="contact"
            forceMount
            className={activeTab !== "contact" ? "hidden" : "space-y-6"}
          >
            <ContactFaqTab
              control={control}
              register={register}
              errors={errors}
              watch={watch}
            />
          </TabsContent>

          <TabsContent
            value="errors"
            forceMount
            className={activeTab !== "errors" ? "hidden" : "space-y-6"}
          >
            <ErrorPagesTab
              control={control}
              register={register}
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
                pages: config.pages,
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

export default OtherPagesPage;
