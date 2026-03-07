import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { z } from "zod";
import { ShoppingCart, FileText, Sparkles, Truck } from "lucide-react";

import { AppShell } from "@/components/layout/AppShell";
import { SaveBar } from "@/components/layout/SaveBar";
import { FormField } from "@/components/forms/FormField";
import { FormSwitch } from "@/components/forms/FormSwitch";
import { FormSelect } from "@/components/forms/FormSelect";
import { FormTextarea } from "@/components/forms/FormTextarea";
import { FormSection } from "@/components/forms/FormSection";
import { FieldGroup } from "@/components/shared/FieldGroup";
import { LoadingState } from "@/components/shared/LoadingState";
import { ComponentBlock } from "@/components/shared/ComponentBlock";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useConfigPage } from "@/hooks/useConfigPage";
import {
  EcommerceSchema,
  PromoPopupSchema,
  ContentSchema,
} from "@/modules/config/schema";

// ---------------------------------------------------------------------------
// Schema & types
// ---------------------------------------------------------------------------

const CartFormSchema = z.object({
  ecommerce: EcommerceSchema,
  promoPopup: PromoPopupSchema,
  content: ContentSchema,
});

type CartFormData = z.infer<typeof CartFormSchema>;

// ---------------------------------------------------------------------------
// Tab definitions
// ---------------------------------------------------------------------------

const TABS = [
  { id: "shipping", label: "Shipping & Cart", icon: Truck },
  { id: "promo", label: "Promo & Marketing", icon: Sparkles },
  { id: "content", label: "Cart Text", icon: FileText },
] as const;

type TabId = (typeof TABS)[number]["id"];

function isValidTab(v: string | undefined): v is TabId {
  return TABS.some((t) => t.id === v);
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

function CartPage() {
  const router = useRouter();
  const tabParam = router.query.tab as string | undefined;
  const initialTab = isValidTab(tabParam) ? tabParam : "shipping";
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
    schema: CartFormSchema,
    sections: ["ecommerce", "promoPopup", "content"],
    extractFormData: (c) => ({
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
      <AppShell channelSlug="" activePage="cart" title="Cart">
        <LoadingState />
      </AppShell>
    );
  }

  const popupEnabled = watch("promoPopup.enabled");
  const autoDetectSales = watch("promoPopup.autoDetectSales");

  return (
    <AppShell
      channelSlug={router.query.channelSlug as string}
      channelName={config?.store.name}
      activePage="cart"
      title="Cart"
      description="Cart behavior, shipping settings, promo popups, and cart text"
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

          {/* Shipping & Cart Settings */}
          <TabsContent
            value="shipping"
            forceMount
            className={activeTab !== "shipping" ? "hidden" : "space-y-6"}
          >
            <ComponentBlock
              icon={Truck}
              title="Shipping Settings"
              description="Free shipping threshold, delivery estimates, and shipping rules"
              defaultExpanded
            >
              <div className="space-y-6">
                <FormSection title="Shipping" description="Shipping display and free shipping threshold">
                  <FormField<CartFormData>
                    label="Free Shipping Threshold"
                    name="ecommerce.shipping.freeShippingThreshold"
                    register={register}
                    errors={errors}
                    type="number"
                    description="Order amount for free shipping (leave empty for no free shipping)"
                  />
                  <FormSwitch<CartFormData>
                    label="Show Estimated Delivery"
                    name="ecommerce.shipping.showEstimatedDelivery"
                    control={control}
                  />
                  <FieldGroup columns={2}>
                    <FormField<CartFormData>
                      label="Default Min Delivery Days"
                      name="ecommerce.shipping.defaultEstimatedMinDays"
                      register={register}
                      errors={errors}
                      type="number"
                    />
                    <FormField<CartFormData>
                      label="Default Max Delivery Days"
                      name="ecommerce.shipping.defaultEstimatedMaxDays"
                      register={register}
                      errors={errors}
                      type="number"
                    />
                  </FieldGroup>
                  <FormSelect<CartFormData>
                    label="Delivery Estimate Format"
                    name="ecommerce.shipping.estimatedDeliveryFormat"
                    control={control}
                    options={[
                      { value: "range", label: "Range (2-5 days)" },
                      { value: "max", label: "Maximum (5 days)" },
                    ]}
                  />
                </FormSection>

                <FormSection title="Shipping Price Adjustment" description="Transform shipping method prices before display">
                  <FormSwitch<CartFormData>
                    label="Enable Price Adjustment"
                    name="ecommerce.shipping.priceAdjustment.enabled"
                    control={control}
                  />
                  <FieldGroup columns={2}>
                    <FormSelect<CartFormData>
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
                    <FormField<CartFormData>
                      label="Value"
                      name="ecommerce.shipping.priceAdjustment.value"
                      register={register}
                      errors={errors}
                      type="number"
                    />
                    <FormField<CartFormData>
                      label="Minimum Price"
                      name="ecommerce.shipping.priceAdjustment.minPrice"
                      register={register}
                      errors={errors}
                      type="number"
                    />
                  </FieldGroup>
                </FormSection>

                <FormSection title="Free Shipping Rule" description="Auto-free shipping when cart exceeds threshold">
                  <FormSwitch<CartFormData>
                    label="Enable Free Shipping Rule"
                    name="ecommerce.shipping.freeShippingRule.enabled"
                    control={control}
                  />
                  <FieldGroup columns={2}>
                    <FormField<CartFormData>
                      label="Cart Minimum"
                      name="ecommerce.shipping.freeShippingRule.cartMinimum"
                      register={register}
                      errors={errors}
                      type="number"
                    />
                    <FormField<CartFormData>
                      label="Max Method Price"
                      name="ecommerce.shipping.freeShippingRule.maxMethodPrice"
                      register={register}
                      errors={errors}
                      type="number"
                    />
                  </FieldGroup>
                  <FormField<CartFormData>
                    label="Method Name Filter"
                    name="ecommerce.shipping.freeShippingRule.methodNameFilter"
                    register={register}
                    errors={errors}
                    description='Comma-separated, e.g. "CJ,DHL"'
                  />
                </FormSection>

                <FormSection title="Shipping Display" description="Control adjusted price display">
                  <FormSwitch<CartFormData>
                    label="Show Original Price"
                    name="ecommerce.shipping.showOriginalPrice"
                    control={control}
                    description="Show strikethrough original price when a rule changes the price"
                  />
                </FormSection>
              </div>
            </ComponentBlock>

            <ComponentBlock
              icon={ShoppingCart}
              title="Tax & Inventory"
              description="Tax display and stock settings"
              defaultExpanded={false}
            >
              <div className="space-y-6">
                <FormSection title="Tax" description="Tax display preferences">
                  <FormSwitch<CartFormData>
                    label="Show Prices With Tax"
                    name="ecommerce.tax.showPricesWithTax"
                    control={control}
                  />
                  <FormSwitch<CartFormData>
                    label="Tax Included in Price"
                    name="ecommerce.tax.taxIncludedInPrice"
                    control={control}
                  />
                </FormSection>

                <FormSection title="Inventory" description="Stock display">
                  <FormSwitch<CartFormData>
                    label="Show Stock Level"
                    name="ecommerce.inventory.showStockLevel"
                    control={control}
                  />
                  <FormField<CartFormData>
                    label="Low Stock Threshold"
                    name="ecommerce.inventory.lowStockThreshold"
                    register={register}
                    errors={errors}
                    type="number"
                  />
                  <FormSwitch<CartFormData>
                    label="Allow Backorders"
                    name="ecommerce.inventory.allowBackorders"
                    control={control}
                  />
                </FormSection>
              </div>
            </ComponentBlock>
          </TabsContent>

          {/* Promo & Marketing */}
          <TabsContent
            value="promo"
            forceMount
            className={activeTab !== "promo" ? "hidden" : "space-y-6"}
          >
            <ComponentBlock
              icon={Sparkles}
              title="Promotional Popup"
              description="Configure promotional popup for visitors"
              enabled={popupEnabled}
              onToggle={(v) => form.setValue("promoPopup.enabled", v, { shouldDirty: true })}
              showToggle
              defaultExpanded
            >
              <div className="space-y-6">
                {popupEnabled && (
                  <>
                    <FormSwitch<CartFormData>
                      label="Auto-detect from Sales"
                      name="promoPopup.autoDetectSales"
                      control={control}
                      description="Automatically detect items from Sale collection"
                    />

                    {!autoDetectSales && (
                      <FormSection title="Popup Content" description="Customize popup text">
                        <FormField<CartFormData> label="Title" name="promoPopup.title" register={register} errors={errors} placeholder="Special Offer" />
                        <FormField<CartFormData> label="Badge Text" name="promoPopup.badge" register={register} errors={errors} placeholder="Up to 25% Off" />
                        <FormTextarea<CartFormData> label="Body Text" name="promoPopup.body" register={register} errors={errors} />
                        <FieldGroup columns={2}>
                          <FormField<CartFormData> label="CTA Text" name="promoPopup.ctaText" register={register} errors={errors} placeholder="Shop Sale Items" />
                          <FormField<CartFormData> label="CTA Link" name="promoPopup.ctaLink" register={register} errors={errors} placeholder="/products?onSale=true" />
                        </FieldGroup>
                      </FormSection>
                    )}

                    <FormSection title="Popup Behavior" description="When and how the popup appears">
                      <FieldGroup columns={2}>
                        <FormField<CartFormData> label="Delay (seconds)" name="promoPopup.delaySeconds" register={register} errors={errors} type="number" />
                        <FormField<CartFormData> label="Show Again After (hours)" name="promoPopup.ttlHours" register={register} errors={errors} type="number" />
                      </FieldGroup>
                      <FormSwitch<CartFormData> label="Show Once Per Session" name="promoPopup.showOncePerSession" control={control} />
                      <FormSwitch<CartFormData> label="Exclude Checkout Pages" name="promoPopup.excludeCheckout" control={control} />
                      <FormSwitch<CartFormData> label="Exclude Cart Page" name="promoPopup.excludeCart" control={control} />
                    </FormSection>
                  </>
                )}
              </div>
            </ComponentBlock>
          </TabsContent>

          {/* Cart Text */}
          <TabsContent
            value="content"
            forceMount
            className={activeTab !== "content" ? "hidden" : "space-y-6"}
          >
            <ComponentBlock
              icon={FileText}
              title="Cart Page Text"
              description="All labels and copy for the cart page"
              defaultExpanded
            >
              <div className="space-y-4">
                <FormSection title="Main Cart Text" description="Core cart page labels">
                  <FieldGroup columns={2}>
                    <FormField<CartFormData> label="Cart Title" name="content.cart.cartTitle" register={register} errors={errors} placeholder="Shopping Cart" />
                    <FormField<CartFormData> label="Empty Cart Title" name="content.cart.emptyCartTitle" register={register} errors={errors} placeholder="Your cart is empty" />
                    <FormField<CartFormData> label="Empty Cart Message" name="content.cart.emptyCartMessage" register={register} errors={errors} />
                    <FormField<CartFormData> label="Continue Shopping Button" name="content.cart.continueShoppingButton" register={register} errors={errors} placeholder="Continue Shopping" />
                    <FormField<CartFormData> label="Checkout Button" name="content.cart.checkoutButton" register={register} errors={errors} placeholder="Proceed to Checkout" />
                    <FormField<CartFormData> label="View Cart Button" name="content.cart.viewCartButton" register={register} errors={errors} placeholder="View Full Cart" />
                    <FormField<CartFormData> label="Shipping Note" name="content.cart.shippingNote" register={register} errors={errors} />
                    <FormField<CartFormData> label="Order Summary Title" name="content.cart.orderSummaryTitle" register={register} errors={errors} placeholder="Order Summary" />
                  </FieldGroup>
                </FormSection>

                <FormSection title="Free Shipping Messages" description="Shipping threshold text" collapsible defaultExpanded={false}>
                  <FieldGroup columns={2}>
                    <FormField<CartFormData> label="Free Shipping Message" name="content.cart.freeShippingMessage" register={register} errors={errors} />
                    <FormField<CartFormData> label="Threshold Reached" name="content.cart.freeShippingThresholdReached" register={register} errors={errors} />
                    <FormField<CartFormData> label="Add X More" name="content.cart.addXMoreForFreeShipping" register={register} errors={errors} />
                    <FormField<CartFormData> label="Unlocked" name="content.cart.unlockedFreeShipping" register={register} errors={errors} />
                  </FieldGroup>
                </FormSection>

                <FormSection title="Order Summary Labels" description="Pricing breakdown labels" collapsible defaultExpanded={false}>
                  <FieldGroup columns={2}>
                    <FormField<CartFormData> label="Subtotal" name="content.cart.subtotalLabel" register={register} errors={errors} placeholder="Subtotal" />
                    <FormField<CartFormData> label="Shipping" name="content.cart.shippingLabel" register={register} errors={errors} placeholder="Shipping" />
                    <FormField<CartFormData> label="Shipping Free" name="content.cart.shippingFree" register={register} errors={errors} placeholder="FREE" />
                    <FormField<CartFormData> label="Total" name="content.cart.totalLabel" register={register} errors={errors} placeholder="Total" />
                    <FormField<CartFormData> label="You Save" name="content.cart.youSaveLabel" register={register} errors={errors} placeholder="You save" />
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

export default CartPage;
