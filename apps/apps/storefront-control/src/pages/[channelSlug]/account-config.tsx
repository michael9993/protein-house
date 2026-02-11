import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import type { Control, FieldErrors, UseFormRegister } from "react-hook-form";
import { z } from "zod";
import { FileText, RefreshCw, Users, Zap } from "lucide-react";

import { AppShell } from "@/components/layout/AppShell";
import { SaveBar } from "@/components/layout/SaveBar";
import { FormField } from "@/components/forms/FormField";
import { FormSection } from "@/components/forms/FormSection";
import { FeatureCard } from "@/components/shared/FeatureCard";
import { FieldGroup } from "@/components/shared/FieldGroup";
import { LoadingState } from "@/components/shared/LoadingState";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useConfigPage } from "@/hooks/useConfigPage";
import { FeaturesSchema, ContentSchema } from "@/modules/config/schema";

// ---------------------------------------------------------------------------
// Schema & types
// ---------------------------------------------------------------------------

const AccountFormSchema = z.object({
  features: FeaturesSchema,
  content: ContentSchema,
});

type AccountFormData = z.infer<typeof AccountFormSchema>;

interface TabProps {
  register: UseFormRegister<AccountFormData>;
  control: Control<AccountFormData>;
  errors: FieldErrors<AccountFormData>;
}

// ---------------------------------------------------------------------------
// Tab definitions
// ---------------------------------------------------------------------------

const TABS = [
  { id: "features", label: "Features", icon: Zap },
  { id: "content", label: "Content", icon: FileText },
] as const;

type TabId = (typeof TABS)[number]["id"];

function isValidTab(value: string | undefined): value is TabId {
  return TABS.some((t) => t.id === value);
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

function AccountConfigPage() {
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
      <AppShell channelSlug="" activePage="account-config" title="Account">
        <LoadingState />
      </AppShell>
    );
  }

  return (
    <AppShell
      channelSlug={router.query.channelSlug as string}
      channelName={config?.store.name}
      activePage="account-config"
      title="Account"
      description="Account feature toggles and all account/auth related text"
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

          <TabsContent
            value="features"
            forceMount
            className={activeTab !== "features" ? "hidden" : "space-y-6"}
          >
            <AccountFeaturesTab control={control} register={register} errors={errors} />
          </TabsContent>

          <TabsContent
            value="content"
            forceMount
            className={activeTab !== "content" ? "hidden" : "space-y-6"}
          >
            <AccountContentTab control={control} register={register} errors={errors} />
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

// ---------------------------------------------------------------------------
// Account Features Tab
// ---------------------------------------------------------------------------

function AccountFeaturesTab({ control }: TabProps) {
  return (
    <FormSection title="Account Features" description="Feature toggles for account and authentication">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <FeatureCard
          name="features.socialLogin"
          control={control}
          title="Social Login"
          description="Login with social accounts"
          icon={<Users className="h-5 w-5" />}
          comingSoon
        />
        <FeatureCard
          name="features.subscriptions"
          control={control}
          title="Subscriptions"
          description="Recurring product subscriptions"
          icon={<RefreshCw className="h-5 w-5" />}
          comingSoon
        />
      </div>
    </FormSection>
  );
}

// ---------------------------------------------------------------------------
// Account Content Tab
// ---------------------------------------------------------------------------

function AccountContentTab({ register, errors }: TabProps) {
  return (
    <>
      {/* ── content.account — Auth & Account Pages ────────────────── */}
      <FormSection title="Auth & Account Pages" description="Sign in, sign up, and account navigation text">
        <FieldGroup columns={2}>
          <FormField<AccountFormData> label="Sign In Title" name="content.account.signInTitle" register={register} errors={errors} placeholder="Sign In" />
          <FormField<AccountFormData> label="Sign Up Title" name="content.account.signUpTitle" register={register} errors={errors} placeholder="Create Account" />
          <FormField<AccountFormData> label="Sign In Button" name="content.account.signInButton" register={register} errors={errors} placeholder="Sign In" />
          <FormField<AccountFormData> label="Sign Up Button" name="content.account.signUpButton" register={register} errors={errors} placeholder="Create Account" />
          <FormField<AccountFormData> label="Sign Out Button" name="content.account.signOutButton" register={register} errors={errors} placeholder="Sign Out" />
          <FormField<AccountFormData> label="Forgot Password Link" name="content.account.forgotPasswordLink" register={register} errors={errors} placeholder="Forgot Password?" />
          <FormField<AccountFormData> label="My Account Title" name="content.account.myAccountTitle" register={register} errors={errors} placeholder="My Account" />
          <FormField<AccountFormData> label="Orders Title" name="content.account.ordersTitle" register={register} errors={errors} placeholder="My Orders" />
          <FormField<AccountFormData> label="Addresses Title" name="content.account.addressesTitle" register={register} errors={errors} placeholder="My Addresses" />
          <FormField<AccountFormData> label="Wishlist Title" name="content.account.wishlistTitle" register={register} errors={errors} placeholder="Wishlist" />
          <FormField<AccountFormData> label="Settings Title" name="content.account.settingsTitle" register={register} errors={errors} placeholder="Settings" />
          <FormField<AccountFormData> label="Dashboard Title" name="content.account.dashboardTitle" register={register} errors={errors} placeholder="Dashboard" />
          <FormField<AccountFormData> label="Need Help Title" name="content.account.needHelpTitle" register={register} errors={errors} placeholder="Need Help?" />
          <FormField<AccountFormData> label="Need Help Description" name="content.account.needHelpDescription" register={register} errors={errors} placeholder="Our support team is here to assist you 24/7" />
          <FormField<AccountFormData> label="Contact Support Button" name="content.account.contactSupportButton" register={register} errors={errors} placeholder="Contact Support" />
        </FieldGroup>
      </FormSection>

      {/* ── content.account — Confirm Email & Auth Errors ─────────── */}
      <FormSection
        title="Confirm Email & Auth Errors"
        description="Email confirmation page and authentication error messages"
        collapsible
        defaultExpanded={false}
      >
        <p className="text-sm font-medium text-muted-foreground mb-2">Confirm Email Page</p>
        <FieldGroup columns={2}>
          <FormField<AccountFormData> label="Page Title" name="content.account.confirmAccountTitle" register={register} errors={errors} placeholder="Confirm Your Email" />
          <FormField<AccountFormData> label="Page Subtitle" name="content.account.confirmAccountSubtitle" register={register} errors={errors} placeholder="Click the link in your email or enter your confirmation details below" />
          <FormField<AccountFormData> label="Email Label" name="content.account.confirmAccountEmailLabel" register={register} errors={errors} placeholder="Email Address" />
          <FormField<AccountFormData> label="Email Placeholder" name="content.account.confirmAccountEmailPlaceholder" register={register} errors={errors} placeholder="you@example.com" />
          <FormField<AccountFormData> label="Token Label" name="content.account.confirmAccountTokenLabel" register={register} errors={errors} placeholder="Confirmation Token" />
          <FormField<AccountFormData> label="Token Placeholder" name="content.account.confirmAccountTokenPlaceholder" register={register} errors={errors} placeholder="Enter token from email" />
          <FormField<AccountFormData> label="Token Hint" name="content.account.confirmAccountTokenHint" register={register} errors={errors} placeholder="The token was sent to your email address" />
          <FormField<AccountFormData> label="Confirm Button" name="content.account.confirmAccountButton" register={register} errors={errors} placeholder="Confirm Account" />
          <FormField<AccountFormData> label="Back to Sign In" name="content.account.confirmAccountBackToSignIn" register={register} errors={errors} placeholder="Back to Sign In" />
          <FormField<AccountFormData> label="Confirming Text" name="content.account.confirmAccountConfirmingText" register={register} errors={errors} placeholder="Confirming..." />
          <FormField<AccountFormData> label="Checking Message" name="content.account.confirmAccountCheckingMessage" register={register} errors={errors} placeholder="Checking your activation link..." />
          <FormField<AccountFormData> label="Auto-login Hint" name="content.account.confirmAccountAutoLoginHint" register={register} errors={errors} placeholder="You'll be logged in automatically when verification succeeds." />
          <FormField<AccountFormData> label="Success Message" name="content.account.confirmAccountSuccessMessage" register={register} errors={errors} placeholder="Account confirmed and logged in! Redirecting..." />
          <FormField<AccountFormData> label="Link Expired Error" name="content.account.confirmAccountLinkExpiredError" register={register} errors={errors} placeholder="This confirmation link is invalid or has expired." />
          <FormField<AccountFormData> label="Request New Link" name="content.account.confirmAccountRequestNewLink" register={register} errors={errors} placeholder="Request a new confirmation email" />
          <FormField<AccountFormData> label="Already Confirmed" name="content.account.confirmAccountAlreadyConfirmed" register={register} errors={errors} placeholder="This account has already been confirmed." />
          <FormField<AccountFormData> label="Unexpected Error" name="content.account.confirmAccountUnexpectedError" register={register} errors={errors} placeholder="An unexpected error occurred." />
        </FieldGroup>

        <p className="text-sm font-medium text-muted-foreground mb-2 mt-4">Auth Error Messages</p>
        <FieldGroup columns={2}>
          <FormField<AccountFormData> label="Login: Invalid Credentials" name="content.account.loginInvalidCredentialsError" register={register} errors={errors} placeholder="Please, enter valid credentials" />
          <FormField<AccountFormData> label="Login: Email/Password Required" name="content.account.loginEmailPasswordRequiredError" register={register} errors={errors} placeholder="Email and password are required" />
          <FormField<AccountFormData> label="Login: Generic Error" name="content.account.loginGenericError" register={register} errors={errors} placeholder="An error occurred during login." />
          <FormField<AccountFormData> label="Register: Email/Password Required" name="content.account.registerEmailPasswordRequiredError" register={register} errors={errors} placeholder="Email and password are required" />
          <FormField<AccountFormData> label="Register: Failed Error" name="content.account.registerFailedError" register={register} errors={errors} placeholder="Registration failed" />
          <FormField<AccountFormData> label="Register: Account Exists" name="content.account.registerAccountExistsError" register={register} errors={errors} placeholder="An account with this email already exists." />
          <FormField<AccountFormData> label="Register: Generic Error" name="content.account.registerGenericError" register={register} errors={errors} placeholder="An error occurred during registration." />
          <FormField<AccountFormData> label="Password Mismatch Error" name="content.account.passwordMismatchError" register={register} errors={errors} placeholder="Passwords do not match." />
          <FormField<AccountFormData> label="Password Too Short Error" name="content.account.passwordTooShortError" register={register} errors={errors} placeholder="Password must be at least 8 characters." />
          <FormField<AccountFormData> label="Password Reset Rate Limit" name="content.account.passwordResetRateLimitError" register={register} errors={errors} placeholder="You've already requested a password reset recently." />
          <FormField<AccountFormData> label="Password Reset Rate Limit Info" name="content.account.passwordResetRateLimitInfo" register={register} errors={errors} placeholder="If you don't receive an email, please check your spam folder..." />
        </FieldGroup>
      </FormSection>

      {/* ── content.dashboard — Account Dashboard ─────────────────── */}
      <FormSection
        title="Account Dashboard"
        description="Dashboard welcome, stats, and recent orders text"
        collapsible
        defaultExpanded={false}
      >
        <FieldGroup columns={2}>
          <FormField<AccountFormData> label="Welcome Back" name="content.dashboard.welcomeBack" register={register} errors={errors} placeholder="Welcome back, {name}" />
          <FormField<AccountFormData> label="Welcome Back Message" name="content.dashboard.welcomeBackMessage" register={register} errors={errors} placeholder="Here's what's happening with your account today." />
          <FormField<AccountFormData> label="Account Summary" name="content.dashboard.accountSummary" register={register} errors={errors} placeholder="here's what's happening..." />
          <FormField<AccountFormData> label="Total Orders" name="content.dashboard.totalOrders" register={register} errors={errors} placeholder="Total Orders" />
          <FormField<AccountFormData> label="Wishlist Items" name="content.dashboard.wishlistItems" register={register} errors={errors} placeholder="Wishlist Items" />
          <FormField<AccountFormData> label="Saved Addresses" name="content.dashboard.savedAddresses" register={register} errors={errors} placeholder="Saved Addresses" />
          <FormField<AccountFormData> label="Member Since" name="content.dashboard.memberSince" register={register} errors={errors} placeholder="Member Since" />
          <FormField<AccountFormData> label="Recent Orders" name="content.dashboard.recentOrders" register={register} errors={errors} placeholder="Recent Orders" />
          <FormField<AccountFormData> label="View All Button" name="content.dashboard.viewAllButton" register={register} errors={errors} placeholder="View All →" />
          <FormField<AccountFormData> label="View Button" name="content.dashboard.viewButton" register={register} errors={errors} placeholder="View" />
          <FormField<AccountFormData> label="Order Number Prefix" name="content.dashboard.orderNumberPrefix" register={register} errors={errors} placeholder="Order #" />
          <FormField<AccountFormData> label="Order Label" name="content.dashboard.orderLabel" register={register} errors={errors} placeholder="Order" />
          <FormField<AccountFormData> label="No Orders Yet" name="content.dashboard.noOrdersYet" register={register} errors={errors} placeholder="No orders yet" />
          <FormField<AccountFormData> label="When You Place Order" name="content.dashboard.whenYouPlaceOrder" register={register} errors={errors} placeholder="When you place an order, it will appear here." />
          <FormField<AccountFormData> label="No Recent Orders" name="content.dashboard.noRecentOrders" register={register} errors={errors} placeholder="No recent orders" />
          <FormField<AccountFormData> label="Start Shopping" name="content.dashboard.startShopping" register={register} errors={errors} placeholder="Start Shopping" />
        </FieldGroup>
      </FormSection>

      {/* ── content.orders — Orders List & Detail ─────────────────── */}
      <FormSection
        title="Orders"
        description="Orders list, detail page, status labels, invoices, and tracking text"
        collapsible
        defaultExpanded={false}
      >
        <p className="text-sm font-medium text-muted-foreground mb-2">Orders List</p>
        <FieldGroup columns={2}>
          <FormField<AccountFormData> label="Order Number" name="content.orders.orderNumber" register={register} errors={errors} placeholder="Order Number" />
          <FormField<AccountFormData> label="Order Label" name="content.orders.orderLabel" register={register} errors={errors} placeholder="Order" />
          <FormField<AccountFormData> label="Order Number Prefix" name="content.orders.orderNumberPrefix" register={register} errors={errors} placeholder="Order #" />
          <FormField<AccountFormData> label="Date Placed" name="content.orders.datePlaced" register={register} errors={errors} placeholder="Date Placed" />
          <FormField<AccountFormData> label="Total Label" name="content.orders.totalLabel" register={register} errors={errors} placeholder="TOTAL" />
          <FormField<AccountFormData> label="Get Invoice" name="content.orders.getInvoice" register={register} errors={errors} placeholder="Get Invoice" />
          <FormField<AccountFormData> label="Download Invoice" name="content.orders.downloadInvoice" register={register} errors={errors} placeholder="Download Invoice" />
          <FormField<AccountFormData> label="View Details" name="content.orders.viewDetails" register={register} errors={errors} placeholder="View Details" />
          <FormField<AccountFormData> label="Track Package" name="content.orders.trackPackage" register={register} errors={errors} placeholder="Track Package" />
          <FormField<AccountFormData> label="Buy Again" name="content.orders.buyAgain" register={register} errors={errors} placeholder="Buy Again" />
          <FormField<AccountFormData> label="Show All Orders" name="content.orders.showAllOrders" register={register} errors={errors} placeholder="Show All Orders ({count})" />
          <FormField<AccountFormData> label="Show Less" name="content.orders.showLess" register={register} errors={errors} placeholder="Show Less" />
          <FormField<AccountFormData> label="Orders Placed" name="content.orders.ordersPlaced" register={register} errors={errors} placeholder="Orders Placed" />
          <FormField<AccountFormData> label="No Orders" name="content.orders.noOrders" register={register} errors={errors} placeholder="No orders yet" />
          <FormField<AccountFormData> label="No Orders Message" name="content.orders.noOrdersMessage" register={register} errors={errors} placeholder="When you place an order..." />
          <FormField<AccountFormData> label="No Orders Yet Message" name="content.orders.noOrdersYetMessage" register={register} errors={errors} placeholder="Looks like you haven't placed any orders yet..." />
          <FormField<AccountFormData> label="Order Status" name="content.orders.orderStatus" register={register} errors={errors} placeholder="Status" />
          <FormField<AccountFormData> label="Track Order" name="content.orders.trackOrder" register={register} errors={errors} placeholder="Track Order" />
          <FormField<AccountFormData> label="Qty Label" name="content.orders.qtyLabel" register={register} errors={errors} placeholder="Qty:" />
          <FormField<AccountFormData> label="Remaining Items" name="content.orders.remainingItems" register={register} errors={errors} placeholder="+{count}" />
        </FieldGroup>

        <p className="text-sm font-medium text-muted-foreground mb-2 mt-4">Invoice Fields</p>
        <FieldGroup columns={2}>
          <FormField<AccountFormData> label="Generating Invoice" name="content.orders.generatingInvoice" register={register} errors={errors} placeholder="Generating Invoice..." />
          <FormField<AccountFormData> label="Generate & Download Invoice" name="content.orders.generateDownloadInvoice" register={register} errors={errors} placeholder="Generate & Download Invoice" />
          <FormField<AccountFormData> label="Invoice Available" name="content.orders.invoiceAvailable" register={register} errors={errors} placeholder="Invoice Available" />
          <FormField<AccountFormData> label="Invoice Available Message" name="content.orders.invoiceAvailableMessage" register={register} errors={errors} placeholder="Click below to generate and download your invoice as a PDF." />
          <FormField<AccountFormData> label="Invoice Pending" name="content.orders.invoicePending" register={register} errors={errors} placeholder="Invoice Pending" />
          <FormField<AccountFormData> label="Invoice Pending Message" name="content.orders.invoicePendingMessage" register={register} errors={errors} placeholder="Invoices are generated once payment is completed..." />
          <FormField<AccountFormData> label="Invoice Will Be Generated" name="content.orders.invoiceWillBeGenerated" register={register} errors={errors} placeholder="Your invoice will be generated instantly and downloaded as a PDF." />
          <FormField<AccountFormData> label="Need Invoice Sooner" name="content.orders.needInvoiceSooner" register={register} errors={errors} placeholder="Need your invoice sooner? Please contact our support team." />
          <FormField<AccountFormData> label="Close" name="content.orders.close" register={register} errors={errors} placeholder="Close" />
          <FormField<AccountFormData> label="Invoice Modal Title" name="content.orders.invoiceModalTitle" register={register} errors={errors} placeholder="Invoice" />
        </FieldGroup>

        <p className="text-sm font-medium text-muted-foreground mb-2 mt-4">Tracking Fields</p>
        <FieldGroup columns={2}>
          <FormField<AccountFormData> label="Tracking Modal Title" name="content.orders.trackingModalTitle" register={register} errors={errors} placeholder="Track Package" />
          <FormField<AccountFormData> label="Tracking Number Label" name="content.orders.trackingNumberLabel" register={register} errors={errors} placeholder="Tracking Number" />
          <FormField<AccountFormData> label="Status Label" name="content.orders.statusLabel" register={register} errors={errors} placeholder="Status:" />
          <FormField<AccountFormData> label="Track Package Description" name="content.orders.trackPackageDescription" register={register} errors={errors} placeholder="Track your package using any of the services below:" />
          <FormField<AccountFormData> label="Universal Trackers" name="content.orders.universalTrackers" register={register} errors={errors} placeholder="Universal Trackers (Recommended)" />
          <FormField<AccountFormData> label="Direct Carrier Links" name="content.orders.directCarrierLinks" register={register} errors={errors} placeholder="Direct Carrier Links" />
          <FormField<AccountFormData> label="Loading" name="content.orders.loading" register={register} errors={errors} placeholder="Loading..." />
        </FieldGroup>

        <p className="text-sm font-medium text-muted-foreground mb-2 mt-4">Order Details Page</p>
        <FieldGroup columns={2}>
          <FormField<AccountFormData> label="Back to Orders" name="content.orders.backToOrders" register={register} errors={errors} placeholder="Back to Orders" />
          <FormField<AccountFormData> label="Placed On" name="content.orders.placedOn" register={register} errors={errors} placeholder="Placed on" />
          <FormField<AccountFormData> label="Order Items Title" name="content.orders.orderItemsTitle" register={register} errors={errors} placeholder="Order Items" />
          <FormField<AccountFormData> label="View Product" name="content.orders.viewProduct" register={register} errors={errors} placeholder="View Product" />
          <FormField<AccountFormData> label="Order Summary Title" name="content.orders.orderSummaryTitle" register={register} errors={errors} placeholder="Order Summary" />
          <FormField<AccountFormData> label="Subtotal Label" name="content.orders.subtotalLabel" register={register} errors={errors} placeholder="Subtotal" />
          <FormField<AccountFormData> label="Shipping Label" name="content.orders.shippingLabel" register={register} errors={errors} placeholder="Shipping" />
          <FormField<AccountFormData> label="Shipping Free" name="content.orders.shippingFree" register={register} errors={errors} placeholder="Free" />
          <FormField<AccountFormData> label="Total Label (Details)" name="content.orders.totalLabelDetails" register={register} errors={errors} placeholder="Total" />
          <FormField<AccountFormData> label="Shipping Address Title" name="content.orders.shippingAddressTitle" register={register} errors={errors} placeholder="Shipping Address" />
          <FormField<AccountFormData> label="Billing Address Title" name="content.orders.billingAddressTitle" register={register} errors={errors} placeholder="Billing Address" />
          <FormField<AccountFormData> label="Shipment Tracking Title" name="content.orders.shipmentTrackingTitle" register={register} errors={errors} placeholder="Shipment Tracking" />
          <FormField<AccountFormData> label="Status Label (Details)" name="content.orders.statusLabelDetails" register={register} errors={errors} placeholder="Status" />
          <FormField<AccountFormData> label="Tracking Number (Details)" name="content.orders.trackingNumberLabelDetails" register={register} errors={errors} placeholder="Tracking #" />
          <FormField<AccountFormData> label="Invoice Title" name="content.orders.invoiceTitle" register={register} errors={errors} placeholder="Invoice" />
          <FormField<AccountFormData> label="Invoice Number Prefix" name="content.orders.invoiceNumberPrefix" register={register} errors={errors} placeholder="Invoice #" />
          <FormField<AccountFormData> label="Download Button" name="content.orders.downloadButton" register={register} errors={errors} placeholder="Download" />
          <FormField<AccountFormData> label="Generating Text" name="content.orders.generatingText" register={register} errors={errors} placeholder="Generating..." />
          <FormField<AccountFormData> label="Unavailable Text" name="content.orders.unavailableText" register={register} errors={errors} placeholder="Unavailable" />
          <FormField<AccountFormData> label="Quick Actions Title" name="content.orders.quickActionsTitle" register={register} errors={errors} placeholder="Quick Actions" />
          <FormField<AccountFormData> label="Need Help Title" name="content.orders.needHelpTitle" register={register} errors={errors} placeholder="Need Help?" />
          <FormField<AccountFormData> label="Contact Support Button" name="content.orders.contactSupportButton" register={register} errors={errors} placeholder="Contact Support" />
          <FormField<AccountFormData> label="View FAQs Button" name="content.orders.viewFaqsButton" register={register} errors={errors} placeholder="View FAQs" />
        </FieldGroup>

        <p className="text-sm font-medium text-muted-foreground mb-2 mt-4">Order Status Labels</p>
        <FieldGroup columns={3}>
          <FormField<AccountFormData> label="Processing" name="content.orders.statusProcessing" register={register} errors={errors} placeholder="Processing" />
          <FormField<AccountFormData> label="Partially Shipped" name="content.orders.statusPartiallyShipped" register={register} errors={errors} placeholder="Partially Shipped" />
          <FormField<AccountFormData> label="Shipped" name="content.orders.statusShipped" register={register} errors={errors} placeholder="Shipped" />
          <FormField<AccountFormData> label="Delivered" name="content.orders.statusDelivered" register={register} errors={errors} placeholder="Delivered" />
          <FormField<AccountFormData> label="Canceled" name="content.orders.statusCanceled" register={register} errors={errors} placeholder="Canceled" />
          <FormField<AccountFormData> label="Returned" name="content.orders.statusReturned" register={register} errors={errors} placeholder="Returned" />
        </FieldGroup>

        <p className="text-sm font-medium text-muted-foreground mb-2 mt-4">Payment Status Labels</p>
        <FieldGroup columns={3}>
          <FormField<AccountFormData> label="Pending" name="content.orders.paymentPending" register={register} errors={errors} placeholder="Pending" />
          <FormField<AccountFormData> label="Partially Paid" name="content.orders.paymentPartiallyPaid" register={register} errors={errors} placeholder="Partially Paid" />
          <FormField<AccountFormData> label="Paid" name="content.orders.paymentPaid" register={register} errors={errors} placeholder="Paid" />
          <FormField<AccountFormData> label="Partially Refunded" name="content.orders.paymentPartiallyRefunded" register={register} errors={errors} placeholder="Partially Refunded" />
          <FormField<AccountFormData> label="Refunded" name="content.orders.paymentRefunded" register={register} errors={errors} placeholder="Refunded" />
          <FormField<AccountFormData> label="Payment Failed" name="content.orders.paymentFailed" register={register} errors={errors} placeholder="Payment Failed" />
          <FormField<AccountFormData> label="Payment Cancelled" name="content.orders.paymentCancelled" register={register} errors={errors} placeholder="Cancelled" />
        </FieldGroup>

        <p className="text-sm font-medium text-muted-foreground mb-2 mt-4">Reorder Button</p>
        <FieldGroup columns={2}>
          <FormField<AccountFormData> label="Reorder Items" name="content.orders.reorderItems" register={register} errors={errors} placeholder="Reorder Items" />
          <FormField<AccountFormData> label="Adding to Cart" name="content.orders.addingToCart" register={register} errors={errors} placeholder="Adding to Cart..." />
          <FormField<AccountFormData> label="Items Added to Cart" name="content.orders.itemsAddedToCart" register={register} errors={errors} placeholder="{count} item(s) added to cart!" />
          <FormField<AccountFormData> label="Redirecting to Cart" name="content.orders.redirectingToCart" register={register} errors={errors} placeholder="Redirecting to cart..." />
          <FormField<AccountFormData> label="Try Again" name="content.orders.tryAgain" register={register} errors={errors} placeholder="Try Again" />
        </FieldGroup>
      </FormSection>

      {/* ── content.orderTracking — Order Tracking Page ────────────── */}
      <FormSection
        title="Order Tracking"
        description="Text for the public order tracking page (non-logged-in users)"
        collapsible
        defaultExpanded={false}
      >
        <FieldGroup columns={2}>
          <FormField<AccountFormData> label="Title" name="content.orderTracking.title" register={register} errors={errors} placeholder="Track Your Order" />
          <FormField<AccountFormData> label="Description" name="content.orderTracking.description" register={register} errors={errors} placeholder="Enter your order number and email address to view your order status." />
          <FormField<AccountFormData> label="Order Number Label" name="content.orderTracking.orderNumberLabel" register={register} errors={errors} placeholder="Order Number" />
          <FormField<AccountFormData> label="Order Number Placeholder" name="content.orderTracking.orderNumberPlaceholder" register={register} errors={errors} placeholder="e.g., 12345" />
          <FormField<AccountFormData> label="Order Number Help Text" name="content.orderTracking.orderNumberHelp" register={register} errors={errors} placeholder="You can find your order number in your confirmation email." />
          <FormField<AccountFormData> label="Email Label" name="content.orderTracking.emailLabel" register={register} errors={errors} placeholder="Email Address" />
          <FormField<AccountFormData> label="Email Placeholder" name="content.orderTracking.emailPlaceholder" register={register} errors={errors} placeholder="your@email.com" />
          <FormField<AccountFormData> label="Email Help Text" name="content.orderTracking.emailHelp" register={register} errors={errors} placeholder="The email address you used when placing the order." />
          <FormField<AccountFormData> label="Track Button" name="content.orderTracking.trackButton" register={register} errors={errors} placeholder="Track Order" />
          <FormField<AccountFormData> label="Tracking Button (Loading)" name="content.orderTracking.trackingButton" register={register} errors={errors} placeholder="Tracking..." />
          <FormField<AccountFormData> label="Back to Tracking" name="content.orderTracking.backToTracking" register={register} errors={errors} placeholder="Track Another Order" />
          <FormField<AccountFormData> label="Error: Order Not Found" name="content.orderTracking.errorNotFound" register={register} errors={errors} placeholder="Order not found." />
          <FormField<AccountFormData> label="Error: Generic" name="content.orderTracking.errorGeneric" register={register} errors={errors} placeholder="An error occurred while tracking your order." />
          <FormField<AccountFormData> label="Order Found Title" name="content.orderTracking.orderFoundTitle" register={register} errors={errors} placeholder="Order Details" />
          <FormField<AccountFormData> label="Create Account Title" name="content.orderTracking.createAccountTitle" register={register} errors={errors} placeholder="Create an Account" />
          <FormField<AccountFormData> label="Create Account Description" name="content.orderTracking.createAccountDescription" register={register} errors={errors} placeholder="Sign up to track all your orders, save your addresses, and enjoy faster checkout." />
          <FormField<AccountFormData> label="Create Account Button" name="content.orderTracking.createAccountButton" register={register} errors={errors} placeholder="Create Account" />
          <FormField<AccountFormData> label="Need Help Text" name="content.orderTracking.needHelpText" register={register} errors={errors} placeholder="Need help?" />
          <FormField<AccountFormData> label="Contact Support Link" name="content.orderTracking.contactSupportLink" register={register} errors={errors} placeholder="Contact Support" />
        </FieldGroup>
      </FormSection>

      {/* ── content.addresses — Addresses Page ─────────────────────── */}
      <FormSection
        title="Addresses"
        description="Address management page text"
        collapsible
        defaultExpanded={false}
      >
        <FieldGroup columns={2}>
          <FormField<AccountFormData> label="My Addresses" name="content.addresses.myAddresses" register={register} errors={errors} placeholder="My Addresses" />
          <FormField<AccountFormData> label="Addresses Count" name="content.addresses.addressesCount" register={register} errors={errors} placeholder="{count} address(es) saved" />
          <FormField<AccountFormData> label="No Addresses Yet" name="content.addresses.noAddressesYet" register={register} errors={errors} placeholder="No addresses saved yet" />
          <FormField<AccountFormData> label="Add Address Button" name="content.addresses.addAddressButton" register={register} errors={errors} placeholder="Add Address" />
          <FormField<AccountFormData> label="Default Shipping" name="content.addresses.defaultShipping" register={register} errors={errors} placeholder="Default Shipping" />
          <FormField<AccountFormData> label="Default Billing" name="content.addresses.defaultBilling" register={register} errors={errors} placeholder="Default Billing" />
          <FormField<AccountFormData> label="Shipping & Billing" name="content.addresses.shippingAndBilling" register={register} errors={errors} placeholder="Shipping & Billing" />
          <FormField<AccountFormData> label="Shipping Address" name="content.addresses.shippingAddress" register={register} errors={errors} placeholder="Shipping Address" />
          <FormField<AccountFormData> label="Billing Address" name="content.addresses.billingAddress" register={register} errors={errors} placeholder="Billing Address" />
          <FormField<AccountFormData> label="Saved Address" name="content.addresses.savedAddress" register={register} errors={errors} placeholder="Saved Address" />
          <FormField<AccountFormData> label="Set as Default" name="content.addresses.setAsDefault" register={register} errors={errors} placeholder="Set as Default" />
          <FormField<AccountFormData> label="No Addresses" name="content.addresses.noAddresses" register={register} errors={errors} placeholder="No addresses saved" />
          <FormField<AccountFormData> label="No Addresses Message" name="content.addresses.noAddressesMessage" register={register} errors={errors} placeholder="Add your first address..." />
          <FormField<AccountFormData> label="Add New Address Title" name="content.addresses.addNewAddressTitle" register={register} errors={errors} placeholder="Add New Address" />
          <FormField<AccountFormData> label="Edit Button" name="content.addresses.editButton" register={register} errors={errors} placeholder="Edit" />
          <FormField<AccountFormData> label="Delete Button" name="content.addresses.deleteButton" register={register} errors={errors} placeholder="Delete" />
          <FormField<AccountFormData> label="Continue Shopping Button" name="content.addresses.continueShoppingButton" register={register} errors={errors} placeholder="Continue Shopping" />
          <FormField<AccountFormData> label="Start Shopping" name="content.addresses.startShopping" register={register} errors={errors} placeholder="Start Shopping" />
        </FieldGroup>
      </FormSection>

      {/* ── content.settings — Account Settings ───────────────────── */}
      <FormSection
        title="Account Settings"
        description="Profile, password, notification, and danger zone text"
        collapsible
        defaultExpanded={false}
      >
        <p className="text-sm font-medium text-muted-foreground mb-2">Page Header</p>
        <FieldGroup columns={2}>
          <FormField<AccountFormData> label="Account Settings" name="content.settings.accountSettings" register={register} errors={errors} placeholder="Account Settings" />
          <FormField<AccountFormData> label="Settings Subtitle" name="content.settings.settingsSubtitle" register={register} errors={errors} placeholder="Manage your profile..." />
        </FieldGroup>

        <p className="text-sm font-medium text-muted-foreground mb-2 mt-4">Profile Section</p>
        <FieldGroup columns={2}>
          <FormField<AccountFormData> label="Profile Information" name="content.settings.profileInformation" register={register} errors={errors} placeholder="Profile Information" />
          <FormField<AccountFormData> label="Update Personal Details" name="content.settings.updatePersonalDetails" register={register} errors={errors} placeholder="Update your personal details" />
          <FormField<AccountFormData> label="Save Changes Button" name="content.settings.saveChangesButton" register={register} errors={errors} placeholder="Save Changes" />
          <FormField<AccountFormData> label="Saving Changes" name="content.settings.savingChanges" register={register} errors={errors} placeholder="Saving..." />
          <FormField<AccountFormData> label="Profile Updated" name="content.settings.profileUpdated" register={register} errors={errors} placeholder="Profile updated successfully" />
          <FormField<AccountFormData> label="Profile Update Failed" name="content.settings.profileUpdateFailed" register={register} errors={errors} placeholder="Failed to update profile." />
          <FormField<AccountFormData> label="Email Change Password Required" name="content.settings.emailChangePasswordRequired" register={register} errors={errors} placeholder="Password is required to change your email." />
          <FormField<AccountFormData> label="Email Change Confirmation Sent" name="content.settings.emailChangeConfirmationSent" register={register} errors={errors} placeholder="A confirmation link has been sent to your new email address." />
          <FormField<AccountFormData> label="Email Change Password Invalid" name="content.settings.emailChangePasswordInvalid" register={register} errors={errors} placeholder="Password is not valid." />
          <FormField<AccountFormData> label="Profile Invalid Email Error" name="content.settings.profileInvalidEmailError" register={register} errors={errors} placeholder="Please enter a valid email address." />
        </FieldGroup>

        <p className="text-sm font-medium text-muted-foreground mb-2 mt-4">Password Section</p>
        <FieldGroup columns={2}>
          <FormField<AccountFormData> label="Change Password" name="content.settings.changePassword" register={register} errors={errors} placeholder="Change Password" />
          <FormField<AccountFormData> label="Password Security Note" name="content.settings.passwordSecurityNote" register={register} errors={errors} placeholder="Update your password..." />
          <FormField<AccountFormData> label="Current Password" name="content.settings.currentPassword" register={register} errors={errors} placeholder="Current Password" />
          <FormField<AccountFormData> label="New Password Label" name="content.settings.newPasswordLabel" register={register} errors={errors} placeholder="New Password" />
          <FormField<AccountFormData> label="Confirm New Password" name="content.settings.confirmNewPassword" register={register} errors={errors} placeholder="Confirm New Password" />
          <FormField<AccountFormData> label="Update Password Button" name="content.settings.updatePasswordButton" register={register} errors={errors} placeholder="Update Password" />
          <FormField<AccountFormData> label="Password Updated" name="content.settings.passwordUpdated" register={register} errors={errors} placeholder="Password updated successfully" />
          <FormField<AccountFormData> label="Password Update Failed" name="content.settings.passwordUpdateFailed" register={register} errors={errors} placeholder="Failed to update password." />
        </FieldGroup>

        <p className="text-sm font-medium text-muted-foreground mb-2 mt-4">Notifications Section</p>
        <FieldGroup columns={2}>
          <FormField<AccountFormData> label="Notification Preferences" name="content.settings.notificationPreferences" register={register} errors={errors} placeholder="Notification Preferences" />
          <FormField<AccountFormData> label="Notification Subtitle" name="content.settings.notificationSubtitle" register={register} errors={errors} placeholder="Choose how you want..." />
          <FormField<AccountFormData> label="Order Updates" name="content.settings.orderUpdates" register={register} errors={errors} placeholder="Order Updates" />
          <FormField<AccountFormData> label="Order Updates Desc" name="content.settings.orderUpdatesDesc" register={register} errors={errors} placeholder="Receive notifications about..." />
          <FormField<AccountFormData> label="Promotions & Offers" name="content.settings.promotionsOffers" register={register} errors={errors} placeholder="Promotions & Offers" />
          <FormField<AccountFormData> label="Promotions Desc" name="content.settings.promotionsDesc" register={register} errors={errors} placeholder="Get notified about sales..." />
          <FormField<AccountFormData> label="Newsletter Setting" name="content.settings.newsletterSetting" register={register} errors={errors} placeholder="Newsletter" />
          <FormField<AccountFormData> label="Newsletter Desc" name="content.settings.newsletterDesc" register={register} errors={errors} placeholder="Weekly updates about..." />
          <FormField<AccountFormData> label="SMS Notifications" name="content.settings.smsNotifications" register={register} errors={errors} placeholder="SMS Notifications" />
          <FormField<AccountFormData> label="SMS Desc" name="content.settings.smsDesc" register={register} errors={errors} placeholder="Receive text messages..." />
        </FieldGroup>

        <p className="text-sm font-medium text-muted-foreground mb-2 mt-4">Danger Zone</p>
        <FieldGroup columns={2}>
          <FormField<AccountFormData> label="Danger Zone" name="content.settings.dangerZone" register={register} errors={errors} placeholder="Danger Zone" />
          <FormField<AccountFormData> label="Delete Account Warning" name="content.settings.deleteAccountWarning" register={register} errors={errors} placeholder="Permanently delete your account..." />
          <FormField<AccountFormData> label="Delete Account Button" name="content.settings.deleteAccountButton" register={register} errors={errors} placeholder="Delete Account" />
        </FieldGroup>
      </FormSection>

      {/* ── content.wishlist — Wishlist Page ───────────────────────── */}
      <FormSection
        title="Wishlist"
        description="Wishlist page text"
        collapsible
        defaultExpanded={false}
      >
        <FieldGroup columns={2}>
          <FormField<AccountFormData> label="My Wishlist Title" name="content.wishlist.myWishlistTitle" register={register} errors={errors} placeholder="My Wishlist" />
          <FormField<AccountFormData> label="Items Count" name="content.wishlist.itemsCount" register={register} errors={errors} placeholder="{count} item(s) saved" />
          <FormField<AccountFormData> label="Loading Wishlist" name="content.wishlist.loadingWishlist" register={register} errors={errors} placeholder="Loading wishlist..." />
          <FormField<AccountFormData> label="Empty Wishlist Title" name="content.wishlist.emptyWishlistTitle" register={register} errors={errors} placeholder="Your wishlist is empty" />
          <FormField<AccountFormData> label="Empty Wishlist Message" name="content.wishlist.emptyWishlistMessage" register={register} errors={errors} placeholder="Save items you love..." />
          <FormField<AccountFormData> label="Discover Products Button" name="content.wishlist.discoverProductsButton" register={register} errors={errors} placeholder="Discover Products" />
          <FormField<AccountFormData> label="Clear All Button" name="content.wishlist.clearAllButton" register={register} errors={errors} placeholder="Clear All" />
          <FormField<AccountFormData> label="Items Saved" name="content.wishlist.itemsSaved" register={register} errors={errors} placeholder="{count} item(s) saved" />
          <FormField<AccountFormData> label="View Product" name="content.wishlist.viewProduct" register={register} errors={errors} placeholder="View Product" />
          <FormField<AccountFormData> label="Out of Stock" name="content.wishlist.outOfStock" register={register} errors={errors} placeholder="Out of Stock" />
          <FormField<AccountFormData> label="Added On" name="content.wishlist.addedOn" register={register} errors={errors} placeholder="Added {date}" />
          <FormField<AccountFormData> label="Remove From Wishlist" name="content.wishlist.removeFromWishlist" register={register} errors={errors} placeholder="Remove" />
          <FormField<AccountFormData> label="Remove From Wishlist Tooltip" name="content.wishlist.removeFromWishlistTooltip" register={register} errors={errors} placeholder="Remove from wishlist" />
          <FormField<AccountFormData> label="Move to Cart" name="content.wishlist.moveToCart" register={register} errors={errors} placeholder="Add to Cart" />
        </FieldGroup>
      </FormSection>
    </>
  );
}

// ---------------------------------------------------------------------------
// Next.js page export
// ---------------------------------------------------------------------------

export default AccountConfigPage;
