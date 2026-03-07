import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import type { Control, FieldErrors, UseFormRegister } from "react-hook-form";
import { z } from "zod";
import { FileText, Zap, User } from "lucide-react";

import { AppShell } from "@/components/layout/AppShell";
import { SaveBar } from "@/components/layout/SaveBar";
import { FormField } from "@/components/forms/FormField";
import { FormSection } from "@/components/forms/FormSection";
import { FeatureCard } from "@/components/shared/FeatureCard";
import { FieldGroup } from "@/components/shared/FieldGroup";
import { ComponentBlock } from "@/components/shared/ComponentBlock";
import { LoadingState } from "@/components/shared/LoadingState";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useConfigPage } from "@/hooks/useConfigPage";
import { FeaturesSchema, ContentSchema } from "@/modules/config/schema";

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const AccountFormSchema = z.object({
  features: FeaturesSchema,
  content: ContentSchema,
});

type AccountFormData = z.infer<typeof AccountFormSchema>;

// ---------------------------------------------------------------------------
// Tab definitions
// ---------------------------------------------------------------------------

const TABS = [
  { id: "features", label: "Features", icon: Zap },
  { id: "content", label: "Account Text", icon: FileText },
] as const;

type TabId = (typeof TABS)[number]["id"];

function isValidTab(v: string | undefined): v is TabId {
  return TABS.some((t) => t.id === v);
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

function AccountPage() {
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
    schema: AccountFormSchema,
    sections: ["features", "content"],
    extractFormData: (c) => ({
      features: c.features,
      content: c.content,
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
      <AppShell channelSlug="" activePage="account" title="Account">
        <LoadingState />
      </AppShell>
    );
  }

  return (
    <AppShell
      channelSlug={router.query.channelSlug as string}
      channelName={config?.store.name}
      activePage="account"
      title="Account"
      description="Account features, dashboard, orders, addresses, and settings text"
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

          {/* Features */}
          <TabsContent
            value="features"
            forceMount
            className={activeTab !== "features" ? "hidden" : "space-y-6"}
          >
            <ComponentBlock
              icon={Zap}
              title="Account Features"
              description="Feature toggles for account pages"
              defaultExpanded
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <FeatureCard name="features.wishlist" control={control} title="Wishlist" description="Save favorite products" icon={<User className="h-5 w-5" />} />
                <FeatureCard name="features.orderTracking" control={control} title="Order Tracking" description="Track order status" icon={<User className="h-5 w-5" />} />
                <FeatureCard name="features.socialLogin" control={control} title="Social Login" description="Sign in with Google/Facebook" icon={<User className="h-5 w-5" />} />
                <FeatureCard name="features.accountDeletion" control={control} title="Account Deletion" description="Allow users to delete accounts" icon={<User className="h-5 w-5" />} />
              </div>
            </ComponentBlock>
          </TabsContent>

          {/* Content */}
          <TabsContent
            value="content"
            forceMount
            className={activeTab !== "content" ? "hidden" : "space-y-6"}
          >
            <ComponentBlock icon={User} title="Dashboard Text" description="Account overview page labels" defaultExpanded>
              <FormSection title="Dashboard" description="Account dashboard text">
                <FieldGroup columns={2}>
                  <FormField<AccountFormData> label="Dashboard Title" name="content.account.dashboardTitle" register={register} errors={errors} placeholder="My Account" />
                  <FormField<AccountFormData> label="My Account Title" name="content.account.myAccountTitle" register={register} errors={errors} placeholder="My Account" />
                  <FormField<AccountFormData> label="Need Help Title" name="content.account.needHelpTitle" register={register} errors={errors} />
                </FieldGroup>
              </FormSection>
            </ComponentBlock>

            <ComponentBlock icon={FileText} title="Orders Text" description="Order list and detail labels" defaultExpanded={false}>
              <FormSection title="Orders" description="Order history page text">
                <FieldGroup columns={2}>
                  <FormField<AccountFormData> label="My Orders Title" name="content.orders.myOrdersTitle" register={register} errors={errors} placeholder="My Orders" />
                  <FormField<AccountFormData> label="No Orders" name="content.orders.noOrders" register={register} errors={errors} placeholder="No orders yet" />
                  <FormField<AccountFormData> label="No Orders Message" name="content.orders.noOrdersMessage" register={register} errors={errors} />
                  <FormField<AccountFormData> label="Order Number" name="content.orders.orderNumber" register={register} errors={errors} placeholder="Order #" />
                  <FormField<AccountFormData> label="Date Placed" name="content.orders.datePlaced" register={register} errors={errors} placeholder="Date" />
                  <FormField<AccountFormData> label="Total Label" name="content.orders.totalLabel" register={register} errors={errors} placeholder="Total" />
                  <FormField<AccountFormData> label="Status Label" name="content.orders.statusLabel" register={register} errors={errors} placeholder="Status" />
                  <FormField<AccountFormData> label="View Details" name="content.orders.viewDetails" register={register} errors={errors} placeholder="View Details" />
                </FieldGroup>
              </FormSection>
            </ComponentBlock>

            <ComponentBlock icon={FileText} title="Addresses Text" description="Address management labels" defaultExpanded={false}>
              <FormSection title="Addresses" description="Address page text">
                <FieldGroup columns={2}>
                  <FormField<AccountFormData> label="My Addresses" name="content.addresses.myAddresses" register={register} errors={errors} placeholder="My Addresses" />
                  <FormField<AccountFormData> label="Add Address" name="content.addresses.addAddressButton" register={register} errors={errors} placeholder="Add Address" />
                  <FormField<AccountFormData> label="Edit Button" name="content.addresses.editButton" register={register} errors={errors} placeholder="Edit" />
                  <FormField<AccountFormData> label="Delete Button" name="content.addresses.deleteButton" register={register} errors={errors} placeholder="Delete" />
                  <FormField<AccountFormData> label="Set as Default" name="content.addresses.setAsDefault" register={register} errors={errors} placeholder="Set as Default" />
                </FieldGroup>
              </FormSection>
            </ComponentBlock>

            <ComponentBlock icon={FileText} title="Settings Text" description="Account settings labels" defaultExpanded={false}>
              <FormSection title="Settings" description="Account settings page text">
                <FieldGroup columns={2}>
                  <FormField<AccountFormData> label="Account Settings" name="content.settings.accountSettings" register={register} errors={errors} placeholder="Account Settings" />
                  <FormField<AccountFormData> label="Change Password" name="content.settings.changePassword" register={register} errors={errors} placeholder="Change Password" />
                  <FormField<AccountFormData> label="Save Changes" name="content.settings.saveChangesButton" register={register} errors={errors} placeholder="Save Changes" />
                </FieldGroup>
              </FormSection>
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
              });
            }
          }}
          onSubmit={handleSubmit(onSubmit)}
        />
      </form>
    </AppShell>
  );
}

export default AccountPage;
