import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import type { Control, FieldErrors, UseFormRegister, UseFormWatch } from "react-hook-form";
import { z } from "zod";
import {
  CreditCard,
  FileText,
  Gift,
  ShoppingCart,
  Sparkles,
  Truck,
  UserX,
  Zap,
} from "lucide-react";

import { AppShell } from "@/components/layout/AppShell";
import { SaveBar } from "@/components/layout/SaveBar";
import { FormField } from "@/components/forms/FormField";
import { FormSwitch } from "@/components/forms/FormSwitch";
import { FormSelect } from "@/components/forms/FormSelect";
import { FormTextarea } from "@/components/forms/FormTextarea";
import { FormSection } from "@/components/forms/FormSection";
import { FeatureCard } from "@/components/shared/FeatureCard";
import { FieldGroup } from "@/components/shared/FieldGroup";
import { LoadingState } from "@/components/shared/LoadingState";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useConfigPage } from "@/hooks/useConfigPage";
import {
  FeaturesSchema,
  EcommerceSchema,
  PromoPopupSchema,
  ContentSchema,
} from "@/modules/config/schema";

// ---------------------------------------------------------------------------
// Schema & types
// ---------------------------------------------------------------------------

const CartCheckoutFormSchema = z.object({
  features: FeaturesSchema,
  ecommerce: EcommerceSchema,
  promoPopup: PromoPopupSchema,
  content: ContentSchema,
});

type CartCheckoutFormData = z.infer<typeof CartCheckoutFormSchema>;

interface TabProps {
  register: UseFormRegister<CartCheckoutFormData>;
  control: Control<CartCheckoutFormData>;
  errors: FieldErrors<CartCheckoutFormData>;
  watch: UseFormWatch<CartCheckoutFormData>;
}

// ---------------------------------------------------------------------------
// Tab definitions
// ---------------------------------------------------------------------------

const TABS = [
  { id: "cart-shipping", label: "Cart & Shipping", icon: Truck },
  { id: "features", label: "Checkout Features", icon: Zap },
  { id: "promo", label: "Promo & Marketing", icon: Sparkles },
  { id: "content", label: "Content", icon: FileText },
] as const;

type TabId = (typeof TABS)[number]["id"];

function isValidTab(value: string | undefined): value is TabId {
  return TABS.some((t) => t.id === value);
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

function CartCheckoutPage() {
  const router = useRouter();
  const tabParam = router.query.tab as string | undefined;
  const initialTab = isValidTab(tabParam) ? tabParam : "cart-shipping";
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
    schema: CartCheckoutFormSchema,
    sections: ["features", "ecommerce", "promoPopup", "content"],
    extractFormData: (c) => ({
      features: c.features,
      ecommerce: c.ecommerce,
      promoPopup: c.promoPopup,
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
      <AppShell channelSlug="" activePage="cart-checkout" title="Cart & Checkout">
        <LoadingState />
      </AppShell>
    );
  }

  return (
    <AppShell
      channelSlug={router.query.channelSlug as string}
      channelName={config?.store.name}
      activePage="cart-checkout"
      title="Cart & Checkout"
      description="Cart, shipping, checkout settings, promo popups, and related text"
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
            value="cart-shipping"
            forceMount
            className={activeTab !== "cart-shipping" ? "hidden" : "space-y-6"}
          >
            <CartShippingTab control={control} register={register} errors={errors} watch={watch} />
          </TabsContent>

          <TabsContent
            value="features"
            forceMount
            className={activeTab !== "features" ? "hidden" : "space-y-6"}
          >
            <CheckoutFeaturesTab control={control} register={register} errors={errors} watch={watch} />
          </TabsContent>

          <TabsContent
            value="promo"
            forceMount
            className={activeTab !== "promo" ? "hidden" : "space-y-6"}
          >
            <PromoMarketingTab control={control} register={register} errors={errors} watch={watch} />
          </TabsContent>

          <TabsContent
            value="content"
            forceMount
            className={activeTab !== "content" ? "hidden" : "space-y-6"}
          >
            <CartCheckoutContentTab control={control} register={register} errors={errors} watch={watch} />
          </TabsContent>
        </Tabs>

        <SaveBar
          isDirty={isDirty}
          saveStatus={saveStatus}
          onReset={() => {
            if (config) {
              form.reset({
                features: config.features,
                ecommerce: config.ecommerce,
                promoPopup: config.promoPopup,
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
// Cart & Shipping Tab
// ---------------------------------------------------------------------------

function CartShippingTab({ control, register, errors }: TabProps) {
  return (
    <>
      <FormSection title="Shipping" description="Shipping display and free shipping threshold">
        <FormField<CartCheckoutFormData>
          label="Free Shipping Threshold"
          name="ecommerce.shipping.freeShippingThreshold"
          register={register}
          errors={errors}
          type="number"
          description="Order amount for free shipping (leave empty for no free shipping)"
        />
        <FormSwitch<CartCheckoutFormData>
          label="Show Estimated Delivery"
          name="ecommerce.shipping.showEstimatedDelivery"
          control={control}
        />
        <FieldGroup columns={2}>
          <FormField<CartCheckoutFormData>
            label="Default Min Delivery Days"
            name="ecommerce.shipping.defaultEstimatedMinDays"
            register={register}
            errors={errors}
            type="number"
            description="Fallback minimum days when product has no metadata"
          />
          <FormField<CartCheckoutFormData>
            label="Default Max Delivery Days"
            name="ecommerce.shipping.defaultEstimatedMaxDays"
            register={register}
            errors={errors}
            type="number"
            description="Fallback maximum days when product has no metadata"
          />
        </FieldGroup>
        <FormSelect<CartCheckoutFormData>
          label="Delivery Estimate Format"
          name="ecommerce.shipping.estimatedDeliveryFormat"
          control={control}
          options={[
            { value: "range", label: "Range (2-5 days)" },
            { value: "max", label: "Maximum (5 days)" },
          ]}
          description="How delivery estimates are displayed to customers"
        />
      </FormSection>

      <FormSection title="Shipping Price Adjustment" description="Transform shipping method prices before display (display-only — does not affect actual Saleor prices)">
        <FormSwitch<CartCheckoutFormData>
          label="Enable Price Adjustment"
          name="ecommerce.shipping.priceAdjustment.enabled"
          control={control}
        />
        <FieldGroup columns={2}>
          <FormSelect<CartCheckoutFormData>
            label="Adjustment Type"
            name="ecommerce.shipping.priceAdjustment.type"
            control={control}
            options={[
              { value: "round_down", label: "Round Down" },
              { value: "round_up", label: "Round Up" },
              { value: "flat_discount", label: "Flat Discount" },
              { value: "flat_markup", label: "Flat Markup" },
              { value: "percentage_discount", label: "Percentage Discount" },
              { value: "percentage_markup", label: "Percentage Markup" },
            ]}
          />
          <FormField<CartCheckoutFormData>
            label="Value"
            name="ecommerce.shipping.priceAdjustment.value"
            register={register}
            errors={errors}
            type="number"
            description="Rounding interval, flat amount, or percentage"
          />
          <FormField<CartCheckoutFormData>
            label="Minimum Price"
            name="ecommerce.shipping.priceAdjustment.minPrice"
            register={register}
            errors={errors}
            type="number"
            description="Floor: adjusted price won't go below this"
          />
        </FieldGroup>
      </FormSection>

      <FormSection title="Tax" description="Tax display preferences" comingSoon>
        <FormSwitch<CartCheckoutFormData>
          label="Show Prices With Tax"
          name="ecommerce.tax.showPricesWithTax"
          control={control}
        />
        <FormSwitch<CartCheckoutFormData>
          label="Tax Included in Price"
          name="ecommerce.tax.taxIncludedInPrice"
          control={control}
        />
      </FormSection>

      <FormSection title="Inventory" description="Stock display and backorder settings" comingSoon>
        <FormSwitch<CartCheckoutFormData>
          label="Show Stock Level"
          name="ecommerce.inventory.showStockLevel"
          control={control}
        />
        <FormField<CartCheckoutFormData>
          label="Low Stock Threshold"
          name="ecommerce.inventory.lowStockThreshold"
          register={register}
          errors={errors}
          type="number"
        />
        <FormSwitch<CartCheckoutFormData>
          label="Allow Backorders"
          name="ecommerce.inventory.allowBackorders"
          control={control}
        />
      </FormSection>

      <FormSection title="Checkout Limits" description="Order amount restrictions and terms" comingSoon>
        <FieldGroup columns={2}>
          <FormField<CartCheckoutFormData>
            label="Min Order Amount"
            name="ecommerce.checkout.minOrderAmount"
            register={register}
            errors={errors}
            type="number"
          />
          <FormField<CartCheckoutFormData>
            label="Max Order Amount"
            name="ecommerce.checkout.maxOrderAmount"
            register={register}
            errors={errors}
            type="number"
          />
        </FieldGroup>
        <FormSwitch<CartCheckoutFormData>
          label="Terms Required"
          name="ecommerce.checkout.termsRequired"
          control={control}
          description="Require terms acceptance before checkout"
        />
      </FormSection>
    </>
  );
}

// ---------------------------------------------------------------------------
// Checkout Features Tab
// ---------------------------------------------------------------------------

function CheckoutFeaturesTab({ control }: TabProps) {
  return (
    <FormSection title="Checkout Features" description="Feature toggles for the checkout process">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <FeatureCard
          name="features.guestCheckout"
          control={control}
          title="Guest Checkout"
          description="Purchase without account"
          icon={<UserX className="h-5 w-5" />}
        />
        <FeatureCard
          name="features.expressCheckout"
          control={control}
          title="Express Checkout"
          description="One-click checkout"
          icon={<Zap className="h-5 w-5" />}
          comingSoon
        />
        <FeatureCard
          name="features.savePaymentMethods"
          control={control}
          title="Save Payment Methods"
          description="Remember payment details"
          icon={<CreditCard className="h-5 w-5" />}
          comingSoon
        />
        <FeatureCard
          name="features.giftCards"
          control={control}
          title="Gift Cards"
          description="Gift card purchases"
          icon={<Gift className="h-5 w-5" />}
        />
      </div>
    </FormSection>
  );
}

// ---------------------------------------------------------------------------
// Promo & Marketing Tab
// ---------------------------------------------------------------------------

function PromoMarketingTab({ register, control, errors, watch }: TabProps) {
  const popupEnabled = watch("promoPopup.enabled");
  const autoDetectSales = watch("promoPopup.autoDetectSales");

  return (
    <>
      <FormSection title="Popup Settings" description="Enable and configure promotional popups">
        <FormSwitch<CartCheckoutFormData>
          label="Enable Popup"
          name="promoPopup.enabled"
          control={control}
          description="Show a promotional popup to visitors"
        />
        {popupEnabled && (
          <FormSwitch<CartCheckoutFormData>
            label="Auto-detect from Sales"
            name="promoPopup.autoDetectSales"
            control={control}
            description="Automatically detect items from Sale collection"
          />
        )}
      </FormSection>

      {popupEnabled && !autoDetectSales && (
        <FormSection title="Popup Content" description="Customize the text and messaging of your popup">
          <FormField<CartCheckoutFormData>
            label="Title"
            name="promoPopup.title"
            register={register}
            errors={errors}
            placeholder="Special Offer"
          />
          <FormField<CartCheckoutFormData>
            label="Badge Text"
            name="promoPopup.badge"
            register={register}
            errors={errors}
            placeholder="Up to 25% Off"
          />
          <FormTextarea<CartCheckoutFormData>
            label="Body Text"
            name="promoPopup.body"
            register={register}
            errors={errors}
            placeholder="Don't miss out on our biggest sale..."
          />
          <FieldGroup columns={2}>
            <FormField<CartCheckoutFormData>
              label="CTA Button Text"
              name="promoPopup.ctaText"
              register={register}
              errors={errors}
              placeholder="Shop Sale Items"
            />
            <FormField<CartCheckoutFormData>
              label="CTA Button Link"
              name="promoPopup.ctaLink"
              register={register}
              errors={errors}
              placeholder="/products?onSale=true"
            />
          </FieldGroup>
        </FormSection>
      )}

      {popupEnabled && (
        <FormSection title="Text Labels" description="Customize button and label text">
          {autoDetectSales && (
            <FormField<CartCheckoutFormData>
              label="Items on Sale Text"
              name="promoPopup.itemsOnSaleText"
              register={register}
              errors={errors}
              placeholder="{count} items on sale"
            />
          )}
          <FormField<CartCheckoutFormData>
            label="Maybe Later Text"
            name="promoPopup.maybeLaterText"
            register={register}
            errors={errors}
            placeholder="Maybe later"
          />
        </FormSection>
      )}

      {popupEnabled && !autoDetectSales && (
        <FormSection title="Popup Media" description="Add images to make your popup more engaging">
          <FormField<CartCheckoutFormData>
            label="Background Image URL"
            name="promoPopup.backgroundImageUrl"
            register={register}
            errors={errors}
            placeholder="https://..."
          />
          <FormField<CartCheckoutFormData>
            label="Featured Image URL"
            name="promoPopup.imageUrl"
            register={register}
            errors={errors}
            placeholder="https://..."
          />
        </FormSection>
      )}

      {popupEnabled && (
        <FormSection title="Popup Behavior" description="Control when and how the popup appears">
          <FieldGroup columns={2}>
            <FormField<CartCheckoutFormData>
              label="Delay (seconds)"
              name="promoPopup.delaySeconds"
              register={register}
              errors={errors}
              type="number"
            />
            <FormField<CartCheckoutFormData>
              label="Show Again After (hours)"
              name="promoPopup.ttlHours"
              register={register}
              errors={errors}
              type="number"
            />
          </FieldGroup>
          <FormSwitch<CartCheckoutFormData>
            label="Show Once Per Session"
            name="promoPopup.showOncePerSession"
            control={control}
          />
          <FormSwitch<CartCheckoutFormData>
            label="Exclude Checkout Pages"
            name="promoPopup.excludeCheckout"
            control={control}
          />
          <FormSwitch<CartCheckoutFormData>
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
// Content Tab — content.cart + content.checkout
// ---------------------------------------------------------------------------

function CartCheckoutContentTab({ register, errors }: TabProps) {
  return (
    <>
      {/* ── content.cart ──────────────────────────────────────────────── */}
      <FormSection title="Cart Page" description="Text shown on the cart page">
        <FieldGroup columns={2}>
          <FormField<CartCheckoutFormData> label="Cart Title" name="content.cart.cartTitle" register={register} errors={errors} placeholder="Shopping Cart" />
          <FormField<CartCheckoutFormData> label="Empty Cart Title" name="content.cart.emptyCartTitle" register={register} errors={errors} placeholder="Your cart is empty" />
          <FormField<CartCheckoutFormData> label="Empty Cart Message" name="content.cart.emptyCartMessage" register={register} errors={errors} placeholder="Looks like you haven't added anything yet" />
          <FormField<CartCheckoutFormData> label="Continue Shopping Button" name="content.cart.continueShoppingButton" register={register} errors={errors} placeholder="Continue Shopping" />
          <FormField<CartCheckoutFormData> label="Checkout Button" name="content.cart.checkoutButton" register={register} errors={errors} placeholder="Proceed to Checkout" />
          <FormField<CartCheckoutFormData> label="View Cart Button" name="content.cart.viewCartButton" register={register} errors={errors} placeholder="View Full Cart" />
          <FormField<CartCheckoutFormData> label="Shipping Note" name="content.cart.shippingNote" register={register} errors={errors} placeholder="Shipping and taxes calculated at checkout" />
          <FormField<CartCheckoutFormData> label="Select All Button" name="content.cart.selectAllButton" register={register} errors={errors} placeholder="Select All" />
          <FormField<CartCheckoutFormData> label="Deselect All Button" name="content.cart.deselectAllButton" register={register} errors={errors} placeholder="Deselect All" />
          <FormField<CartCheckoutFormData> label="Free Shipping Message" name="content.cart.freeShippingMessage" register={register} errors={errors} placeholder="Add {amount} more for free shipping" />
          <FormField<CartCheckoutFormData> label="Free Shipping Threshold Reached" name="content.cart.freeShippingThresholdReached" register={register} errors={errors} placeholder="You've qualified for free shipping!" />
          <FormField<CartCheckoutFormData> label="Add X More For Free Shipping" name="content.cart.addXMoreForFreeShipping" register={register} errors={errors} placeholder="Add {amount} more for FREE shipping!" />
          <FormField<CartCheckoutFormData> label="Unlocked Free Shipping" name="content.cart.unlockedFreeShipping" register={register} errors={errors} placeholder="You've unlocked FREE shipping!" />
          <FormField<CartCheckoutFormData> label="Select All Items Button" name="content.cart.selectAllItemsButton" register={register} errors={errors} placeholder="Select all items" />
          <FormField<CartCheckoutFormData> label="Select Items To Checkout" name="content.cart.selectItemsToCheckout" register={register} errors={errors} placeholder="Select items to proceed to checkout" />
          <FormField<CartCheckoutFormData> label="Save For Later Button" name="content.cart.saveForLaterButton" register={register} errors={errors} placeholder="Save for Later" />
          <FormField<CartCheckoutFormData> label="Move To Cart Button" name="content.cart.moveToCartButton" register={register} errors={errors} placeholder="Move to Cart" />
          <FormField<CartCheckoutFormData> label="Delete Button" name="content.cart.deleteButton" register={register} errors={errors} placeholder="Delete" />
          <FormField<CartCheckoutFormData> label="Item Singular" name="content.cart.itemSingular" register={register} errors={errors} placeholder="item" />
          <FormField<CartCheckoutFormData> label="Item Plural" name="content.cart.itemPlural" register={register} errors={errors} placeholder="items" />
          <FormField<CartCheckoutFormData> label="Order Summary Title" name="content.cart.orderSummaryTitle" register={register} errors={errors} placeholder="Order Summary" />
          <FormField<CartCheckoutFormData> label="Items Selected Text" name="content.cart.itemsSelectedText" register={register} errors={errors} placeholder="{count} {singular|plural} selected" />
          <FormField<CartCheckoutFormData> label="Each Label" name="content.cart.eachLabel" register={register} errors={errors} placeholder="each" />
          <FormField<CartCheckoutFormData> label="Available Label" name="content.cart.availableLabel" register={register} errors={errors} placeholder="available" />
          <FormField<CartCheckoutFormData> label="Out Of Stock Label" name="content.cart.outOfStockLabel" register={register} errors={errors} placeholder="Out of stock" />
          <FormField<CartCheckoutFormData> label="Loading Checkout Title" name="content.cart.loadingCheckoutTitle" register={register} errors={errors} placeholder="Loading Checkout..." />
          <FormField<CartCheckoutFormData> label="Loading Checkout Message" name="content.cart.loadingCheckoutMessage" register={register} errors={errors} placeholder="Please wait while we prepare your checkout" />
          <FormField<CartCheckoutFormData> label="Quantity Min Error" name="content.cart.quantityMinError" register={register} errors={errors} placeholder="Quantity must be at least 1" />
          <FormField<CartCheckoutFormData> label="Only X Items Available" name="content.cart.onlyXItemsAvailable" register={register} errors={errors} placeholder="Only {count} items available in stock" />
          <FormField<CartCheckoutFormData> label="Use Delete Button Message" name="content.cart.useDeleteButtonMessage" register={register} errors={errors} placeholder="Use the Delete button to remove items from cart" />
          <FormField<CartCheckoutFormData> label="Failed To Update Quantity" name="content.cart.failedToUpdateQuantity" register={register} errors={errors} placeholder="Failed to update quantity" />
          <FormField<CartCheckoutFormData> label="Only X Available" name="content.cart.onlyXAvailable" register={register} errors={errors} placeholder="Only {count} available" />
          <FormField<CartCheckoutFormData> label="Quantity Updated Success" name="content.cart.quantityUpdatedSuccess" register={register} errors={errors} placeholder="Quantity updated!" />
        </FieldGroup>

        <p className="text-sm font-medium text-muted-foreground mb-2 mt-4">Promo Code Section</p>
        <FieldGroup columns={2}>
          <FormField<CartCheckoutFormData> label="Promo Code Label" name="content.cart.promoCodeLabel" register={register} errors={errors} placeholder="Promo Code" />
          <FormField<CartCheckoutFormData> label="Promo Code Placeholder" name="content.cart.promoCodePlaceholder" register={register} errors={errors} placeholder="Enter code" />
          <FormField<CartCheckoutFormData> label="Promo Code Apply Button" name="content.cart.promoCodeApplyButton" register={register} errors={errors} placeholder="Apply" />
          <FormField<CartCheckoutFormData> label="Eligible For Free Shipping" name="content.cart.eligibleForFreeShipping" register={register} errors={errors} placeholder="Eligible for free shipping" />
          <FormField<CartCheckoutFormData> label="Gift Label" name="content.cart.giftLabel" register={register} errors={errors} placeholder="Gift" />
          <FormField<CartCheckoutFormData> label="Gift Added Message" name="content.cart.giftAddedMessage" register={register} errors={errors} placeholder="A free gift has been added to your cart." />
          <FormField<CartCheckoutFormData> label="Gift Remove Hint" name="content.cart.giftRemoveHint" register={register} errors={errors} placeholder="(You can remove it)" description="Shown next to gift badge; leave empty to hide" />
        </FieldGroup>

        <p className="text-sm font-medium text-muted-foreground mb-2 mt-4">Order Summary</p>
        <FieldGroup columns={2}>
          <FormField<CartCheckoutFormData> label="Subtotal Label" name="content.cart.subtotalLabel" register={register} errors={errors} placeholder="Subtotal" />
          <FormField<CartCheckoutFormData> label="Original Subtotal Label" name="content.cart.originalSubtotalLabel" register={register} errors={errors} placeholder="Subtotal (before discount)" />
          <FormField<CartCheckoutFormData> label="You Save Label" name="content.cart.youSaveLabel" register={register} errors={errors} placeholder="You save" />
          <FormField<CartCheckoutFormData> label="Discounted Subtotal Label" name="content.cart.discountedSubtotalLabel" register={register} errors={errors} placeholder="Your price" />
          <FormField<CartCheckoutFormData> label="Subtotal Label With Count" name="content.cart.subtotalLabelWithCount" register={register} errors={errors} placeholder="Subtotal ({count} items)" />
          <FormField<CartCheckoutFormData> label="Shipping Label" name="content.cart.shippingLabel" register={register} errors={errors} placeholder="Shipping" />
          <FormField<CartCheckoutFormData> label="Shipping Free" name="content.cart.shippingFree" register={register} errors={errors} placeholder="FREE" />
          <FormField<CartCheckoutFormData> label="Shipping Calculated At Checkout" name="content.cart.shippingCalculatedAtCheckout" register={register} errors={errors} placeholder="Calculated at checkout" />
          <FormField<CartCheckoutFormData> label="Total Label" name="content.cart.totalLabel" register={register} errors={errors} placeholder="Total" />
        </FieldGroup>

        <p className="text-sm font-medium text-muted-foreground mb-2 mt-4">Checkout Button States</p>
        <FieldGroup columns={2}>
          <FormField<CartCheckoutFormData> label="Select Items Button" name="content.cart.selectItemsButton" register={register} errors={errors} placeholder="Select Items" />
          <FormField<CartCheckoutFormData> label="Preparing Checkout" name="content.cart.preparingCheckout" register={register} errors={errors} placeholder="Preparing..." />
          <FormField<CartCheckoutFormData> label="Loading Checkout" name="content.cart.loadingCheckout" register={register} errors={errors} placeholder="Loading..." />
        </FieldGroup>

        <p className="text-sm font-medium text-muted-foreground mb-2 mt-4">Trust Badges</p>
        <FieldGroup columns={2}>
          <FormField<CartCheckoutFormData> label="Secure Checkout Text" name="content.cart.secureCheckoutText" register={register} errors={errors} placeholder="Secure Checkout" />
          <FormField<CartCheckoutFormData> label="SSL Encrypted Text" name="content.cart.sslEncryptedText" register={register} errors={errors} placeholder="SSL Encrypted" />
        </FieldGroup>

        <p className="text-sm font-medium text-muted-foreground mb-2 mt-4">Payment Methods</p>
        <FieldGroup columns={2}>
          <FormField<CartCheckoutFormData> label="Accepted Payment Methods" name="content.cart.acceptedPaymentMethods" register={register} errors={errors} placeholder="Accepted Payment Methods" />
          <FormField<CartCheckoutFormData> label="Provided By Stripe" name="content.cart.providedByStripe" register={register} errors={errors} placeholder="Provided by Stripe" />
        </FieldGroup>

        <p className="text-sm font-medium text-muted-foreground mb-2 mt-4">Saved For Later</p>
        <FieldGroup columns={2}>
          <FormField<CartCheckoutFormData> label="Items Saved For Later" name="content.cart.itemsSavedForLater" register={register} errors={errors} placeholder="{count} item(s) saved for later" />
        </FieldGroup>
      </FormSection>

      {/* ── content.checkout ──────────────────────────────────────────── */}
      <FormSection
        title="Checkout"
        description="Text for all checkout phases: contact, shipping, billing, delivery, payment, and order confirmation"
        collapsible
        defaultExpanded={false}
      >
        <p className="text-sm font-medium text-muted-foreground mb-2">Page Header & Progress</p>
        <FieldGroup columns={2}>
          <FormField<CartCheckoutFormData> label="Checkout Title" name="content.checkout.checkoutTitle" register={register} errors={errors} placeholder="Checkout" description="Page title shown in browser tab" />
          <FormField<CartCheckoutFormData> label="Secure Checkout Badge" name="content.checkout.secureCheckout" register={register} errors={errors} placeholder="Secure Checkout" description="Text shown next to lock icon in header" />
          <FormField<CartCheckoutFormData> label="Shipping Step" name="content.checkout.shippingStep" register={register} errors={errors} placeholder="Shipping" />
          <FormField<CartCheckoutFormData> label="Payment Step" name="content.checkout.paymentStep" register={register} errors={errors} placeholder="Payment" />
          <FormField<CartCheckoutFormData> label="Confirmation Step" name="content.checkout.confirmationStep" register={register} errors={errors} placeholder="Confirmation" />
          <FormField<CartCheckoutFormData> label="Continue Button" name="content.checkout.continueButtonText" register={register} errors={errors} placeholder="Continue" description="Shared continue button text across all checkout steps" />
        </FieldGroup>

        <p className="text-sm font-medium text-muted-foreground mb-2 mt-4">Empty Cart Confirmation</p>
        <FieldGroup columns={2}>
          <FormField<CartCheckoutFormData> label="Confirm Title" name="content.checkout.emptyCartConfirmTitle" register={register} errors={errors} placeholder="Remove last item?" />
          <FormField<CartCheckoutFormData> label="Confirm Message" name="content.checkout.emptyCartConfirmMessage" register={register} errors={errors} placeholder="This will empty your cart and take you back to the store." />
          <FormField<CartCheckoutFormData> label="Confirm Button" name="content.checkout.emptyCartConfirmButton" register={register} errors={errors} placeholder="Empty cart" />
          <FormField<CartCheckoutFormData> label="Cancel Button" name="content.checkout.emptyCartCancelButton" register={register} errors={errors} placeholder="Keep shopping" />
        </FieldGroup>

        <p className="text-sm font-medium text-muted-foreground mb-2 mt-4">No Checkout Found & Error Pages</p>
        <FieldGroup columns={2}>
          <FormField<CartCheckoutFormData> label="No Checkout Found Title" name="content.checkout.noCheckoutFoundTitle" register={register} errors={errors} placeholder="No checkout found" />
          <FormField<CartCheckoutFormData> label="No Checkout Found Message" name="content.checkout.noCheckoutFoundMessage" register={register} errors={errors} placeholder="It looks like you haven't started a checkout yet. Add some items to your cart first." />
          <FormField<CartCheckoutFormData> label="Return to Cart Button" name="content.checkout.returnToCartButton" register={register} errors={errors} placeholder="Return to Cart" />
          <FormField<CartCheckoutFormData> label="Continue Shopping Button" name="content.checkout.continueShoppingButton" register={register} errors={errors} placeholder="Continue Shopping" />
          <FormField<CartCheckoutFormData> label="Checkout Expired Title" name="content.checkout.checkoutExpiredTitle" register={register} errors={errors} placeholder="Checkout expired or invalid" />
          <FormField<CartCheckoutFormData> label="Checkout Expired Message" name="content.checkout.checkoutExpiredMessage" register={register} errors={errors} placeholder="This checkout session has expired or is no longer valid." />
          <FormField<CartCheckoutFormData> label="Something Went Wrong Title" name="content.checkout.somethingWentWrongTitle" register={register} errors={errors} placeholder="Something went wrong" />
          <FormField<CartCheckoutFormData> label="Something Went Wrong Message" name="content.checkout.somethingWentWrongMessage" register={register} errors={errors} placeholder="We couldn't load your checkout." />
        </FieldGroup>

        <p className="text-sm font-medium text-muted-foreground mb-2 mt-4">1. Contact Information</p>
        <FieldGroup columns={2}>
          <FormField<CartCheckoutFormData> label="Section Title" name="content.checkout.contactInfoTitle" register={register} errors={errors} placeholder="Contact Information" />
          <FormField<CartCheckoutFormData> label="Section Subtitle" name="content.checkout.contactInfoSubtitle" register={register} errors={errors} placeholder="We'll use this to send order updates" />
          <FormField<CartCheckoutFormData> label="Account Label" name="content.checkout.accountLabel" register={register} errors={errors} placeholder="Account" />
          <FormField<CartCheckoutFormData> label="Sign Out Button" name="content.checkout.signOutButton" register={register} errors={errors} placeholder="Sign out" />
          <FormField<CartCheckoutFormData> label="Guest Email Label" name="content.checkout.guestEmailLabel" register={register} errors={errors} placeholder="Email" />
          <FormField<CartCheckoutFormData> label="Guest Email Placeholder" name="content.checkout.guestEmailPlaceholder" register={register} errors={errors} placeholder="Enter your email" />
          <FormField<CartCheckoutFormData> label="Create Account Checkbox" name="content.checkout.createAccountCheckbox" register={register} errors={errors} placeholder="Create account for faster checkout" />
          <FormField<CartCheckoutFormData> label="Password Label" name="content.checkout.passwordLabel" register={register} errors={errors} placeholder="Password" />
        </FieldGroup>

        <p className="text-sm font-medium text-muted-foreground mb-2 mt-4">2. Shipping Address</p>
        <FieldGroup columns={2}>
          <FormField<CartCheckoutFormData> label="Section Title" name="content.checkout.shippingAddressTitle" register={register} errors={errors} placeholder="Shipping Address" />
          <FormField<CartCheckoutFormData> label="Section Subtitle" name="content.checkout.shippingAddressSubtitle" register={register} errors={errors} placeholder="Where should we deliver?" />
          <FormField<CartCheckoutFormData> label="Add Address Button" name="content.checkout.addAddressButton" register={register} errors={errors} placeholder="Add address" />
          <FormField<CartCheckoutFormData> label="Edit Button" name="content.checkout.editAddressButton" register={register} errors={errors} placeholder="Edit" />
          <FormField<CartCheckoutFormData> label="Change Button" name="content.checkout.changeAddressButton" register={register} errors={errors} placeholder="Change" />
          <FormField<CartCheckoutFormData> label="Create Address Title" name="content.checkout.createAddressTitle" register={register} errors={errors} placeholder="Create address" />
          <FormField<CartCheckoutFormData> label="Edit Address Title" name="content.checkout.editAddressTitle" register={register} errors={errors} placeholder="Edit address" />
        </FieldGroup>

        <p className="text-sm font-medium text-muted-foreground mb-2 mt-4">Address Form Labels</p>
        <FieldGroup columns={2}>
          <FormField<CartCheckoutFormData> label="First Name" name="content.checkout.firstNameLabel" register={register} errors={errors} placeholder="First name" />
          <FormField<CartCheckoutFormData> label="Last Name" name="content.checkout.lastNameLabel" register={register} errors={errors} placeholder="Last name" />
          <FormField<CartCheckoutFormData> label="Company" name="content.checkout.companyLabel" register={register} errors={errors} placeholder="Company (optional)" />
          <FormField<CartCheckoutFormData> label="Address Line 1" name="content.checkout.addressLine1Label" register={register} errors={errors} placeholder="Address" />
          <FormField<CartCheckoutFormData> label="Address Line 2" name="content.checkout.addressLine2Label" register={register} errors={errors} placeholder="Apartment, suite, etc. (optional)" />
          <FormField<CartCheckoutFormData> label="City" name="content.checkout.cityLabel" register={register} errors={errors} placeholder="City" />
          <FormField<CartCheckoutFormData> label="Country" name="content.checkout.countryLabel" register={register} errors={errors} placeholder="Country" />
          <FormField<CartCheckoutFormData> label="State/Province" name="content.checkout.stateLabel" register={register} errors={errors} placeholder="State/Province" />
          <FormField<CartCheckoutFormData> label="Postal Code" name="content.checkout.postalCodeLabel" register={register} errors={errors} placeholder="Postal code" />
          <FormField<CartCheckoutFormData> label="Phone" name="content.checkout.phoneLabel" register={register} errors={errors} placeholder="Phone" />
          <FormField<CartCheckoutFormData> label="Save Address Button" name="content.checkout.saveAddressButton" register={register} errors={errors} placeholder="Save address" />
          <FormField<CartCheckoutFormData> label="Cancel Button" name="content.checkout.cancelButton" register={register} errors={errors} placeholder="Cancel" />
        </FieldGroup>

        <p className="text-sm font-medium text-muted-foreground mb-2 mt-4">3. Billing Address</p>
        <FieldGroup columns={2}>
          <FormField<CartCheckoutFormData> label="Section Title" name="content.checkout.billingAddressTitle" register={register} errors={errors} placeholder="Billing Address" />
          <FormField<CartCheckoutFormData> label="Section Subtitle" name="content.checkout.billingAddressSubtitle" register={register} errors={errors} placeholder="For your invoice" />
          <FormField<CartCheckoutFormData> label="Use Same as Shipping" name="content.checkout.useSameAsShipping" register={register} errors={errors} placeholder="Use shipping address as billing address" />
        </FieldGroup>

        <p className="text-sm font-medium text-muted-foreground mb-2 mt-4">4. Delivery Methods</p>
        <FieldGroup columns={2}>
          <FormField<CartCheckoutFormData> label="Section Title" name="content.checkout.deliveryMethodsTitle" register={register} errors={errors} placeholder="Delivery methods" />
          <FormField<CartCheckoutFormData> label="Business Days Text" name="content.checkout.businessDaysText" register={register} errors={errors} placeholder="{min}-{max} business days" description="Use {min} and {max} as placeholders" />
          <FormField<CartCheckoutFormData> label="Free Shipping Label" name="content.checkout.freeShippingLabel" register={register} errors={errors} placeholder="Free" />
          <FormField<CartCheckoutFormData> label="No Methods Available" name="content.checkout.noDeliveryMethodsText" register={register} errors={errors} placeholder="No delivery methods available" />
          <FormField<CartCheckoutFormData> label="Free Shipping Voucher Not Applicable" name="content.checkout.freeShippingVoucherNotApplicable" register={register} errors={errors} placeholder="Free shipping voucher is not applicable with this delivery method." />
          <FormField<CartCheckoutFormData> label="Free Shipping Applied With Method" name="content.checkout.freeShippingAppliedWithMethod" register={register} errors={errors} placeholder="Free shipping applied with this method." />
          <FormField<CartCheckoutFormData> label="Free Shipping Unlocked" name="content.checkout.deliveryFreeShippingUnlocked" register={register} errors={errors} placeholder="Free shipping applied!" description="Shown when free shipping method is selected" />
          <FormField<CartCheckoutFormData> label="Free Shipping Nudge" name="content.checkout.deliveryFreeShippingNudge" register={register} errors={errors} placeholder="You've unlocked free shipping! Select {methodName} to save {amount}" description="Use {methodName} and {amount} as placeholders. Shown when free method available but not selected. In the order summary, a 'go back' variant is shown automatically." />
          <FormField<CartCheckoutFormData> label="Add More for Free Shipping" name="content.checkout.deliveryAddMoreForFreeShipping" register={register} errors={errors} placeholder="Add {amount} more for free shipping" description="Use {amount} as placeholder. Shows progress bar toward free shipping threshold" />
        </FieldGroup>

        <p className="text-sm font-medium text-muted-foreground mb-2 mt-4">5. Payment</p>
        <FieldGroup columns={2}>
          <FormField<CartCheckoutFormData> label="Section Title" name="content.checkout.paymentTitle" register={register} errors={errors} placeholder="Payment" />
          <FormField<CartCheckoutFormData> label="Section Subtitle" name="content.checkout.paymentSubtitle" register={register} errors={errors} placeholder="Select your payment method" />
          <FormField<CartCheckoutFormData> label="Payment Method Label" name="content.checkout.paymentMethodLabel" register={register} errors={errors} placeholder="Payment method" />
          <FormField<CartCheckoutFormData> label="Pay Now Button" name="content.checkout.payNowButton" register={register} errors={errors} placeholder="Pay now" />
          <FormField<CartCheckoutFormData> label="Initializing Payment Text" name="content.checkout.initializingPaymentText" register={register} errors={errors} placeholder="Initializing payment system..." />
        </FieldGroup>

        <p className="text-sm font-medium text-muted-foreground mb-2 mt-4">Payment Error Messages</p>
        <FieldGroup columns={2}>
          <FormField<CartCheckoutFormData> label="Payment System Unavailable" name="content.checkout.paymentSystemUnavailableError" register={register} errors={errors} placeholder="Payment system is not available..." />
          <FormField<CartCheckoutFormData> label="Checkout Info Missing" name="content.checkout.checkoutInfoMissingError" register={register} errors={errors} placeholder="Checkout information is missing..." />
          <FormField<CartCheckoutFormData> label="Payment Form Not Ready" name="content.checkout.paymentFormNotReadyError" register={register} errors={errors} placeholder="Payment form is not ready..." />
          <FormField<CartCheckoutFormData> label="Payment Validation Failed" name="content.checkout.paymentValidationFailedError" register={register} errors={errors} placeholder="Payment validation failed" />
          <FormField<CartCheckoutFormData> label="Transaction Creation Failed" name="content.checkout.transactionCreationFailedError" register={register} errors={errors} placeholder="Transaction could not be created..." />
          <FormField<CartCheckoutFormData> label="Invalid Payment Data" name="content.checkout.invalidPaymentDataError" register={register} errors={errors} placeholder="Invalid payment data received..." />
          <FormField<CartCheckoutFormData> label="Payment Init Incomplete" name="content.checkout.paymentInitIncompleteError" register={register} errors={errors} placeholder="Payment initialization incomplete..." />
          <FormField<CartCheckoutFormData> label="Payment Confirmation Failed" name="content.checkout.paymentConfirmationFailedError" register={register} errors={errors} placeholder="Payment confirmation failed..." />
          <FormField<CartCheckoutFormData> label="Payment Failed" name="content.checkout.paymentFailedError" register={register} errors={errors} placeholder="Payment failed" />
          <FormField<CartCheckoutFormData> label="Unexpected Payment Error" name="content.checkout.unexpectedPaymentError" register={register} errors={errors} placeholder="An unexpected error occurred..." />
          <FormField<CartCheckoutFormData> label="Payment Success Order Failed" name="content.checkout.paymentSuccessOrderFailedError" register={register} errors={errors} placeholder="Payment was successful but order processing failed..." />
        </FieldGroup>

        <p className="text-sm font-medium text-muted-foreground mb-2 mt-4">Order Summary</p>
        <FieldGroup columns={2}>
          <FormField<CartCheckoutFormData> label="Section Title" name="content.checkout.orderSummaryTitle" register={register} errors={errors} placeholder="Order Summary" />
          <FormField<CartCheckoutFormData> label="Items Count (Singular)" name="content.checkout.itemsCountSingular" register={register} errors={errors} placeholder="1 item" />
          <FormField<CartCheckoutFormData> label="Items Count (Plural)" name="content.checkout.itemsCountPlural" register={register} errors={errors} placeholder="{count} items" description="Use {count} as placeholder" />
          <FormField<CartCheckoutFormData> label="Products Label" name="content.checkout.productsLabel" register={register} errors={errors} placeholder="Products" />
          <FormField<CartCheckoutFormData> label="Quantity Label" name="content.checkout.quantityLabel" register={register} errors={errors} placeholder="Quantity" />
          <FormField<CartCheckoutFormData> label="Add Promo Code Text" name="content.checkout.addPromoCodeText" register={register} errors={errors} placeholder="Add promo code or gift card" />
          <FormField<CartCheckoutFormData> label="Promo Code Label" name="content.checkout.promoCodeLabel" register={register} errors={errors} placeholder="Promo code" />
          <FormField<CartCheckoutFormData> label="Promo Code Placeholder" name="content.checkout.promoCodePlaceholder" register={register} errors={errors} placeholder="Enter code" />
          <FormField<CartCheckoutFormData> label="Apply Button" name="content.checkout.applyPromoButton" register={register} errors={errors} placeholder="Apply" />
          <FormField<CartCheckoutFormData> label="Remove Button" name="content.checkout.removePromoButton" register={register} errors={errors} placeholder="Remove" />
          <FormField<CartCheckoutFormData> label="One Voucher Per Order Hint" name="content.checkout.oneVoucherPerOrderHint" register={register} errors={errors} placeholder="One voucher per order. Gift cards can be combined." />
          <FormField<CartCheckoutFormData> label="Replace Voucher Confirm" name="content.checkout.replaceVoucherConfirm" register={register} errors={errors} placeholder="Only one voucher can be used per order." />
          <FormField<CartCheckoutFormData> label="Eligible For Free Shipping" name="content.checkout.eligibleForFreeShipping" register={register} errors={errors} placeholder="Eligible for free shipping" />
          <FormField<CartCheckoutFormData> label="Gift Card Label" name="content.checkout.giftCardLabel" register={register} errors={errors} placeholder="Gift card" />
          <FormField<CartCheckoutFormData> label="Subtotal Label" name="content.checkout.subtotalLabel" register={register} errors={errors} placeholder="Subtotal" />
          <FormField<CartCheckoutFormData> label="Shipping Label" name="content.checkout.shippingLabel" register={register} errors={errors} placeholder="Shipping" />
          <FormField<CartCheckoutFormData> label="Tax Label" name="content.checkout.taxLabel" register={register} errors={errors} placeholder="Tax" />
          <FormField<CartCheckoutFormData> label="Includes Tax Text" name="content.checkout.includesTaxText" register={register} errors={errors} placeholder="Includes {amount} tax" description="Use {amount} as placeholder" />
          <FormField<CartCheckoutFormData> label="Total Label" name="content.checkout.totalLabel" register={register} errors={errors} placeholder="Total" />
        </FieldGroup>

        <p className="text-sm font-medium text-muted-foreground mb-2 mt-4">Place Order</p>
        <FieldGroup columns={2}>
          <FormField<CartCheckoutFormData> label="Place Order Button" name="content.checkout.placeOrderButton" register={register} errors={errors} placeholder="Place Order" />
          <FormField<CartCheckoutFormData> label="Processing Text" name="content.checkout.processingOrderText" register={register} errors={errors} placeholder="Processing your order..." />
          <FormField<CartCheckoutFormData> label="Don't Close Page Text" name="content.checkout.doNotClosePageText" register={register} errors={errors} placeholder="Please do not close this page" />
          <FormField<CartCheckoutFormData> label="Agreement Text" name="content.checkout.agreementText" register={register} errors={errors} placeholder="By placing this order, you agree to our" />
        </FieldGroup>

        <p className="text-sm font-medium text-muted-foreground mb-2 mt-4">Processing & Order Confirmation</p>
        <FieldGroup columns={2}>
          <FormField<CartCheckoutFormData> label="Almost Done Text" name="content.checkout.almostDoneText" register={register} errors={errors} placeholder="Almost done..." />
          <FormField<CartCheckoutFormData> label="Order Receipt Title" name="content.checkout.orderReceiptTitle" register={register} errors={errors} placeholder="Order Receipt" />
          <FormField<CartCheckoutFormData> label="Order Number Prefix" name="content.checkout.orderNumberPrefix" register={register} errors={errors} placeholder="Order #" />
          <FormField<CartCheckoutFormData> label="Order Confirmed Title" name="content.checkout.orderConfirmedTitle" register={register} errors={errors} placeholder="Order Confirmed" />
          <FormField<CartCheckoutFormData> label="Order Confirmed Message" name="content.checkout.orderConfirmedMessage" register={register} errors={errors} placeholder="Thank you for your order!" />
          <FormField<CartCheckoutFormData> label="Confirmation Sent To" name="content.checkout.confirmationSentTo" register={register} errors={errors} placeholder="Confirmation sent to:" />
          <FormField<CartCheckoutFormData> label="Customer Label" name="content.checkout.customerLabel" register={register} errors={errors} placeholder="Customer:" />
          <FormField<CartCheckoutFormData> label="Order Date Label" name="content.checkout.orderDateLabel" register={register} errors={errors} placeholder="Order Date:" />
          <FormField<CartCheckoutFormData> label="What's Next Title" name="content.checkout.whatsNextTitle" register={register} errors={errors} placeholder="What's Next?" />
          <FormField<CartCheckoutFormData> label="Order Processing Step" name="content.checkout.orderProcessingStep" register={register} errors={errors} placeholder="Order Processing" />
          <FormField<CartCheckoutFormData> label="Order Processing Message" name="content.checkout.orderProcessingMessage" register={register} errors={errors} placeholder="We're preparing your order for shipment." />
          <FormField<CartCheckoutFormData> label="Shipping Notification Step" name="content.checkout.shippingNotificationStep" register={register} errors={errors} placeholder="Shipping Notification" />
          <FormField<CartCheckoutFormData> label="Shipping Notification Message" name="content.checkout.shippingNotificationMessage" register={register} errors={errors} placeholder="You'll receive tracking info when shipped." />
          <FormField<CartCheckoutFormData> label="Delivery Step" name="content.checkout.deliveryStep" register={register} errors={errors} placeholder="Delivery" />
          <FormField<CartCheckoutFormData> label="Delivery Message" name="content.checkout.deliveryMessage" register={register} errors={errors} placeholder="Your order will arrive at your doorstep!" />
          <FormField<CartCheckoutFormData> label="Print Receipt Button" name="content.checkout.printReceiptButton" register={register} errors={errors} placeholder="Print Receipt" />
          <FormField<CartCheckoutFormData> label="Thank You Purchase Message" name="content.checkout.thankYouPurchaseMessage" register={register} errors={errors} placeholder="Thank you for your purchase!" />
          <FormField<CartCheckoutFormData> label="Order Details Title" name="content.checkout.orderDetailsTitle" register={register} errors={errors} placeholder="Order Details" />
          <FormField<CartCheckoutFormData> label="Contact Label" name="content.checkout.contactLabel" register={register} errors={errors} placeholder="Contact" />
          <FormField<CartCheckoutFormData> label="Authorized Status" name="content.checkout.authorizedStatus" register={register} errors={errors} placeholder="Authorized" />
          <FormField<CartCheckoutFormData> label="Authorized Message" name="content.checkout.authorizedMessage" register={register} errors={errors} placeholder="We've received your payment authorization" />
          <FormField<CartCheckoutFormData> label="Paid Status" name="content.checkout.paidStatus" register={register} errors={errors} placeholder="Paid" />
          <FormField<CartCheckoutFormData> label="Paid Message" name="content.checkout.paidMessage" register={register} errors={errors} placeholder="We've received your payment" />
          <FormField<CartCheckoutFormData> label="Overpaid Status" name="content.checkout.overpaidStatus" register={register} errors={errors} placeholder="Overpaid" />
          <FormField<CartCheckoutFormData> label="Overpaid Message" name="content.checkout.overpaidMessage" register={register} errors={errors} placeholder="Contact support for refund assistance" />
          <FormField<CartCheckoutFormData> label="Processing Status" name="content.checkout.processingStatus" register={register} errors={errors} placeholder="Processing" />
          <FormField<CartCheckoutFormData> label="Processing Message" name="content.checkout.processingMessage" register={register} errors={errors} placeholder="Payment is being processed" />
          <FormField<CartCheckoutFormData> label="Confirmation Title (Legacy)" name="content.checkout.orderConfirmation" register={register} errors={errors} placeholder="Order Confirmed!" />
          <FormField<CartCheckoutFormData> label="Thank You Title (Legacy)" name="content.checkout.thankYouTitle" register={register} errors={errors} placeholder="Thank you for your order!" />
          <FormField<CartCheckoutFormData> label="Thank You Message (Legacy)" name="content.checkout.thankYouMessage" register={register} errors={errors} placeholder="We've received your order and will send you a confirmation email shortly." />
          <FormField<CartCheckoutFormData> label="Order Number Label" name="content.checkout.orderNumberLabel" register={register} errors={errors} placeholder="Order number" />
          <FormField<CartCheckoutFormData> label="Continue Shopping Button" name="content.checkout.continueShoppingButton" register={register} errors={errors} placeholder="Continue Shopping" />
          <FormField<CartCheckoutFormData> label="View Order Button" name="content.checkout.viewOrderButton" register={register} errors={errors} placeholder="View Order" />
        </FieldGroup>

        <p className="text-sm font-medium text-muted-foreground mb-2 mt-4">Error Messages</p>
        <FieldGroup columns={2}>
          <FormField<CartCheckoutFormData> label="Required Field Error" name="content.checkout.requiredFieldError" register={register} errors={errors} placeholder="This field is required" />
          <FormField<CartCheckoutFormData> label="Invalid Email Error" name="content.checkout.invalidEmailError" register={register} errors={errors} placeholder="Please enter a valid email" />
          <FormField<CartCheckoutFormData> label="Invalid Phone Error" name="content.checkout.invalidPhoneError" register={register} errors={errors} placeholder="Please enter a valid phone number" />
          <FormField<CartCheckoutFormData> label="Select Delivery Method Error" name="content.checkout.selectDeliveryMethodError" register={register} errors={errors} placeholder="Please select a delivery method" />
          <FormField<CartCheckoutFormData> label="Delivery Method Unavailable" name="content.checkout.deliveryMethodUnavailable" register={register} errors={errors} placeholder="Your selected shipping method is no longer available..." />
          <FormField<CartCheckoutFormData> label="Select Payment Method Error" name="content.checkout.selectPaymentMethodError" register={register} errors={errors} placeholder="Please select a payment method" />
        </FieldGroup>

        <p className="text-sm font-medium text-muted-foreground mb-2 mt-4">Footer</p>
        <FieldGroup columns={2}>
          <FormField<CartCheckoutFormData> label="Privacy Policy" name="content.checkout.privacyPolicy" register={register} errors={errors} placeholder="Privacy Policy" />
          <FormField<CartCheckoutFormData> label="Terms of Service" name="content.checkout.termsOfService" register={register} errors={errors} placeholder="Terms of Service" />
          <FormField<CartCheckoutFormData> label="Security Note" name="content.checkout.securityNote" register={register} errors={errors} placeholder="Protected by SSL encryption" />
        </FieldGroup>
      </FormSection>
    </>
  );
}

// ---------------------------------------------------------------------------
// Next.js page export
// ---------------------------------------------------------------------------

export default CartCheckoutPage;
