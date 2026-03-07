import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { z } from "zod";
import {
  CreditCard,
  FileText,
  Gift,
  Settings2,
  UserX,
  Zap,
} from "lucide-react";

import { AppShell } from "@/components/layout/AppShell";
import { SaveBar } from "@/components/layout/SaveBar";
import { FormField } from "@/components/forms/FormField";
import { FormSwitch } from "@/components/forms/FormSwitch";
import { FormSection } from "@/components/forms/FormSection";
import { FeatureCard } from "@/components/shared/FeatureCard";
import { FieldGroup } from "@/components/shared/FieldGroup";
import { ComponentBlock } from "@/components/shared/ComponentBlock";
import { LoadingState } from "@/components/shared/LoadingState";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useConfigPage } from "@/hooks/useConfigPage";
import {
  FeaturesSchema,
  ContentSchema,
  CheckoutUiSchema,
} from "@/modules/config/schema";

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const CheckoutFormSchema = z.object({
  features: FeaturesSchema,
  content: ContentSchema,
  checkoutUi: CheckoutUiSchema,
});

type CheckoutFormData = z.infer<typeof CheckoutFormSchema>;

// ---------------------------------------------------------------------------
// Tab definitions
// ---------------------------------------------------------------------------

const TABS = [
  { id: "features", label: "Checkout Features", icon: Zap },
  { id: "ui", label: "Checkout UI", icon: Settings2 },
  { id: "content", label: "Checkout Text", icon: FileText },
] as const;

type TabId = (typeof TABS)[number]["id"];

function isValidTab(v: string | undefined): v is TabId {
  return TABS.some((t) => t.id === v);
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

function CheckoutPage() {
  const router = useRouter();
  const tabParam = router.query.tab as string | undefined;
  const initialTab = isValidTab(tabParam) ? tabParam : "features";
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
    schema: CheckoutFormSchema,
    sections: ["features", "content", "checkoutUi"],
    extractFormData: (c) => ({
      features: c.features,
      content: c.content,
      checkoutUi: c.checkoutUi,
    }),
  });

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isDirty },
  } = form;

  if (isNotReady) {
    return (
      <AppShell channelSlug="" activePage="checkout" title="Checkout">
        <LoadingState />
      </AppShell>
    );
  }

  return (
    <AppShell
      channelSlug={router.query.channelSlug as string}
      channelName={config?.store.name}
      activePage="checkout"
      title="Checkout"
      description="Checkout features, UI theming, and text"
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

          {/* Checkout Features */}
          <TabsContent
            value="features"
            forceMount
            className={activeTab !== "features" ? "hidden" : "space-y-6"}
          >
            <ComponentBlock
              icon={Zap}
              title="Checkout Features"
              description="Feature toggles for checkout process"
              defaultExpanded
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <FeatureCard
                  name="features.guestCheckout"
                  control={control}
                  title="Guest Checkout"
                  description="Purchase without account"
                  icon={<UserX className="h-5 w-5" />}
                />
                <FeatureCard
                  name="features.giftCards"
                  control={control}
                  title="Gift Cards"
                  description="Gift card purchases"
                  icon={<Gift className="h-5 w-5" />}
                />
              </div>
            </ComponentBlock>

            <ComponentBlock
              icon={CreditCard}
              title="Checkout Limits"
              description="Order amount restrictions"
              defaultExpanded={false}
            >
              <FormSection title="Checkout Limits" description="Order amount restrictions">
                <FieldGroup columns={2}>
                  <FormField<CheckoutFormData>
                    label="Min Order Amount"
                    name="content.checkout.checkoutTitle"
                    register={register}
                    errors={errors}
                    type="number"
                  />
                </FieldGroup>
              </FormSection>
            </ComponentBlock>
          </TabsContent>

          {/* Checkout UI */}
          <TabsContent
            value="ui"
            forceMount
            className={activeTab !== "ui" ? "hidden" : "space-y-6"}
          >
            <ComponentBlock
              icon={Settings2}
              title="Checkout UI Theming"
              description="Visual theming for checkout components"
              defaultExpanded
            >
              <div className="space-y-6">
                <FormSection title="Accordion Style" description="Checkout step accordion appearance">
                  <FieldGroup columns={2}>
                    <FormField<CheckoutFormData>
                      label="Active Step Color"
                      name="checkoutUi.accordion.activeStepColor"
                      register={register}
                      errors={errors}
                      placeholder="#000000"
                    />
                    <FormField<CheckoutFormData>
                      label="Completed Step Color"
                      name="checkoutUi.accordion.completedStepColor"
                      register={register}
                      errors={errors}
                    />
                  </FieldGroup>
                </FormSection>

                <FormSection title="Progress Bar" description="Checkout progress bar colors">
                  <FieldGroup columns={2}>
                    <FormField<CheckoutFormData>
                      label="Active Color"
                      name="checkoutUi.progressBar.activeColor"
                      register={register}
                      errors={errors}
                    />
                    <FormField<CheckoutFormData>
                      label="Completed Color"
                      name="checkoutUi.progressBar.completedColor"
                      register={register}
                      errors={errors}
                    />
                  </FieldGroup>
                </FormSection>

                <FormSection title="Confirmation" description="Order confirmation page settings">
                  <FormSwitch<CheckoutFormData>
                    label="Show Timeline"
                    name="checkoutUi.confirmation.showTimeline"
                    control={control}
                  />
                  <FormSwitch<CheckoutFormData>
                    label="Show Print Receipt"
                    name="checkoutUi.confirmation.showPrintReceipt"
                    control={control}
                  />
                </FormSection>
              </div>
            </ComponentBlock>
          </TabsContent>

          {/* Checkout Text */}
          <TabsContent
            value="content"
            forceMount
            className={activeTab !== "content" ? "hidden" : "space-y-6"}
          >
            <ComponentBlock
              icon={FileText}
              title="Checkout Page Text"
              description="Labels and messages for all checkout steps"
              defaultExpanded
            >
              <div className="space-y-4">
                <FormSection title="Page Header" description="Checkout header text">
                  <FieldGroup columns={2}>
                    <FormField<CheckoutFormData> label="Checkout Title" name="content.checkout.checkoutTitle" register={register} errors={errors} placeholder="Checkout" />
                    <FormField<CheckoutFormData> label="Secure Checkout Badge" name="content.checkout.secureCheckout" register={register} errors={errors} placeholder="Secure Checkout" />
                    <FormField<CheckoutFormData> label="Continue Button" name="content.checkout.continueButtonText" register={register} errors={errors} placeholder="Continue" />
                  </FieldGroup>
                </FormSection>

                <FormSection title="Contact Information" description="Step 1 labels" collapsible defaultExpanded={false}>
                  <FieldGroup columns={2}>
                    <FormField<CheckoutFormData> label="Section Title" name="content.checkout.contactInfoTitle" register={register} errors={errors} placeholder="Contact Information" />
                    <FormField<CheckoutFormData> label="Subtitle" name="content.checkout.contactInfoSubtitle" register={register} errors={errors} />
                    <FormField<CheckoutFormData> label="Guest Email Label" name="content.checkout.guestEmailLabel" register={register} errors={errors} placeholder="Email" />
                    <FormField<CheckoutFormData> label="Create Account Checkbox" name="content.checkout.createAccountCheckbox" register={register} errors={errors} />
                  </FieldGroup>
                </FormSection>

                <FormSection title="Shipping Address" description="Step 2 labels" collapsible defaultExpanded={false}>
                  <FieldGroup columns={2}>
                    <FormField<CheckoutFormData> label="Section Title" name="content.checkout.shippingAddressTitle" register={register} errors={errors} placeholder="Shipping Address" />
                    <FormField<CheckoutFormData> label="Subtitle" name="content.checkout.shippingAddressSubtitle" register={register} errors={errors} />
                    <FormField<CheckoutFormData> label="Add Address" name="content.checkout.addAddressButton" register={register} errors={errors} />
                    <FormField<CheckoutFormData> label="Save Address" name="content.checkout.saveAddressButton" register={register} errors={errors} />
                  </FieldGroup>
                </FormSection>

                <FormSection title="Delivery Methods" description="Step 3 labels" collapsible defaultExpanded={false}>
                  <FieldGroup columns={2}>
                    <FormField<CheckoutFormData> label="Section Title" name="content.checkout.deliveryMethodsTitle" register={register} errors={errors} placeholder="Delivery methods" />
                    <FormField<CheckoutFormData> label="Business Days" name="content.checkout.businessDaysText" register={register} errors={errors} />
                    <FormField<CheckoutFormData> label="Free Shipping Label" name="content.checkout.freeShippingLabel" register={register} errors={errors} placeholder="Free" />
                    <FormField<CheckoutFormData> label="No Methods Available" name="content.checkout.noDeliveryMethodsText" register={register} errors={errors} />
                  </FieldGroup>
                </FormSection>

                <FormSection title="Payment" description="Step 4 labels" collapsible defaultExpanded={false}>
                  <FieldGroup columns={2}>
                    <FormField<CheckoutFormData> label="Section Title" name="content.checkout.paymentTitle" register={register} errors={errors} placeholder="Payment" />
                    <FormField<CheckoutFormData> label="Subtitle" name="content.checkout.paymentSubtitle" register={register} errors={errors} />
                    <FormField<CheckoutFormData> label="Pay Now Button" name="content.checkout.payNowButton" register={register} errors={errors} placeholder="Pay now" />
                  </FieldGroup>
                </FormSection>

                <FormSection title="Order Confirmation" description="Post-purchase page" collapsible defaultExpanded={false}>
                  <FieldGroup columns={2}>
                    <FormField<CheckoutFormData> label="Confirmation Section" name="content.checkout.orderConfirmation" register={register} errors={errors} placeholder="Order Confirmation" />
                    <FormField<CheckoutFormData> label="Continue Shopping" name="content.checkout.continueShoppingButton" register={register} errors={errors} />
                  </FieldGroup>
                </FormSection>
              </div>
            </ComponentBlock>
          </TabsContent>
        </Tabs>

        <SaveBar
          isDirty={isDirty}
          saveStatus={saveStatus}
          onReset={() => {
            if (config) {
              form.reset({
                features: config.features,
                content: config.content,
                checkoutUi: config.checkoutUi,
              });
            }
          }}
          onSubmit={handleSubmit(onSubmit)}
        />
      </form>
    </AppShell>
  );
}

export default CheckoutPage;
