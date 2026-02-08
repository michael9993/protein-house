import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import type { Control, FieldErrors, UseFormRegister, UseFormWatch } from "react-hook-form";
import { z } from "zod";
import {
  ArrowUp,
  Clock,
  Columns2,
  CreditCard,
  Download,
  Filter,
  Gift,
  Heart,
  Instagram,
  LayoutGrid,
  Mail,
  Megaphone,
  Package,
  RefreshCw,
  Share2,
  ShoppingCart,
  Star,
  Truck,
  UserX,
  Users,
  Zap,
} from "lucide-react";

import { AppShell } from "@/components/layout/AppShell";
import { SaveBar } from "@/components/layout/SaveBar";
import { FormField } from "@/components/forms/FormField";
import { FormSwitch } from "@/components/forms/FormSwitch";
import { FormColorPicker } from "@/components/forms/FormColorPicker";
import { FormSection } from "@/components/forms/FormSection";
import { FeatureCard } from "@/components/shared/FeatureCard";
import { FieldGroup } from "@/components/shared/FieldGroup";
import { LoadingState } from "@/components/shared/LoadingState";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useConfigPage } from "@/hooks/useConfigPage";
import {
  FeaturesSchema,
  FiltersSchema,
  QuickFiltersSchema,
  EcommerceSchema,
  RelatedProductsSchema,
} from "@/modules/config/schema";

// ---------------------------------------------------------------------------
// Schema & types
// ---------------------------------------------------------------------------

const CommerceFormSchema = z.object({
  features: FeaturesSchema,
  filters: FiltersSchema,
  quickFilters: QuickFiltersSchema,
  ecommerce: EcommerceSchema,
  relatedProducts: RelatedProductsSchema,
});

type CommerceFormData = z.infer<typeof CommerceFormSchema>;

// ---------------------------------------------------------------------------
// Option arrays
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Tab definitions
// ---------------------------------------------------------------------------

const COMMERCE_TABS = [
  { id: "features", label: "Features", icon: Zap },
  { id: "catalog", label: "Catalog & Filters", icon: Filter },
  { id: "cart-shipping", label: "Cart & Shipping", icon: Truck },
] as const;

type CommerceTabId = (typeof COMMERCE_TABS)[number]["id"];

function isValidTab(value: string | undefined): value is CommerceTabId {
  return COMMERCE_TABS.some((t) => t.id === value);
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

function CommercePage() {
  const router = useRouter();
  const tabParam = router.query.tab as string | undefined;
  const initialTab = isValidTab(tabParam) ? tabParam : "features";
  const [activeTab, setActiveTab] = useState<CommerceTabId>(initialTab);

  useEffect(() => {
    if (isValidTab(tabParam) && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [tabParam]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleTabChange(value: string) {
    const tab = value as CommerceTabId;
    setActiveTab(tab);
    router.replace(
      { pathname: router.pathname, query: { ...router.query, tab } },
      undefined,
      { shallow: true },
    );
  }

  const { config, isNotReady, form, onSubmit, saveStatus } = useConfigPage({
    schema: CommerceFormSchema,
    sections: ["features", "filters", "quickFilters", "ecommerce", "relatedProducts"],
    extractFormData: (c) => ({
      features: c.features,
      filters: c.filters,
      quickFilters: c.quickFilters,
      ecommerce: c.ecommerce,
      relatedProducts: c.relatedProducts,
    }),
  });

  const { register, control, handleSubmit, watch, formState: { errors, isDirty } } = form;

  if (isNotReady) {
    return (
      <AppShell channelSlug="" activePage="commerce" title="Commerce">
        <LoadingState />
      </AppShell>
    );
  }

  return (
    <AppShell
      channelSlug={router.query.channelSlug as string}
      channelName={config?.store.name}
      activePage="commerce"
      title="Commerce"
      description="Feature toggles, product filters, cart and shipping settings"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 p-6">
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="mb-6">
            {COMMERCE_TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <TabsTrigger key={tab.id} value={tab.id} className="gap-2">
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {/* Tab 1: Features */}
          <TabsContent
            value="features"
            forceMount
            className={activeTab !== "features" ? "hidden" : "space-y-6"}
          >
            <FeaturesTab control={control} />
          </TabsContent>

          {/* Tab 2: Catalog & Filters */}
          <TabsContent
            value="catalog"
            forceMount
            className={activeTab !== "catalog" ? "hidden" : "space-y-6"}
          >
            <CatalogTab
              control={control}
              register={register}
              watch={watch}
            />
          </TabsContent>

          {/* Tab 3: Cart & Shipping */}
          <TabsContent
            value="cart-shipping"
            forceMount
            className={activeTab !== "cart-shipping" ? "hidden" : "space-y-6"}
          >
            <CartShippingTab
              control={control}
              register={register}
              errors={errors}
            />
          </TabsContent>
        </Tabs>

        <SaveBar
          isDirty={isDirty}
          saveStatus={saveStatus}
          onReset={() => {
            if (config) {
              form.reset({
                features: config.features,
                filters: config.filters,
                quickFilters: config.quickFilters,
                ecommerce: config.ecommerce,
                relatedProducts: config.relatedProducts,
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
// Features Tab
// ---------------------------------------------------------------------------

interface FeaturesTabProps {
  control: Control<CommerceFormData>;
}

function FeaturesTab({ control }: FeaturesTabProps) {
  return (
    <>
      {/* Customer Experience */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Customer Experience
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <FeatureCard
            name="features.wishlist"
            control={control}
            title="Wishlist"
            description="Allow customers to save products"
            icon={<Heart className="h-5 w-5" />}
          />
          <FeatureCard
            name="features.compareProducts"
            control={control}
            title="Compare Products"
            description="Side-by-side product comparison"
            icon={<Columns2 className="h-5 w-5" />}
            comingSoon
          />
          <FeatureCard
            name="features.productReviews"
            control={control}
            title="Product Reviews"
            description="Customer product reviews"
            icon={<Star className="h-5 w-5" />}
          />
          <FeatureCard
            name="features.recentlyViewed"
            control={control}
            title="Recently Viewed"
            description="Show recently viewed products"
            icon={<Clock className="h-5 w-5" />}
            comingSoon
          />
          <FeatureCard
            name="features.scrollToTop"
            control={control}
            title="Scroll to Top"
            description="Floating scroll button"
            icon={<ArrowUp className="h-5 w-5" />}
          />
          <FeatureCard
            name="features.relatedProducts"
            control={control}
            title="Related Products"
            description="Show related product suggestions"
            icon={<LayoutGrid className="h-5 w-5" />}
          />
        </div>
      </div>

      {/* Checkout */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Checkout
        </h3>
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
        </div>
      </div>

      {/* Products */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Products
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <FeatureCard
            name="features.digitalDownloads"
            control={control}
            title="Digital Downloads"
            description="Sell digital products"
            icon={<Download className="h-5 w-5" />}
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
          <FeatureCard
            name="features.giftCards"
            control={control}
            title="Gift Cards"
            description="Gift card purchases"
            icon={<Gift className="h-5 w-5" />}
            comingSoon
          />
          <FeatureCard
            name="features.productBundles"
            control={control}
            title="Product Bundles"
            description="Bundle products together"
            icon={<Package className="h-5 w-5" />}
            comingSoon
          />
        </div>
      </div>

      {/* Marketing */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Marketing
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <FeatureCard
            name="features.newsletter"
            control={control}
            title="Newsletter"
            description="Email newsletter signup"
            icon={<Mail className="h-5 w-5" />}
          />
          <FeatureCard
            name="features.promotionalBanners"
            control={control}
            title="Promotional Banners"
            description="Display promotional banners"
            icon={<Megaphone className="h-5 w-5" />}
          />
          <FeatureCard
            name="features.abandonedCartEmails"
            control={control}
            title="Abandoned Cart Emails"
            description="Recovery email campaigns"
            icon={<ShoppingCart className="h-5 w-5" />}
            comingSoon
          />
        </div>
      </div>

      {/* Social */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Social
        </h3>
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
            name="features.shareButtons"
            control={control}
            title="Share Buttons"
            description="Social sharing buttons"
            icon={<Share2 className="h-5 w-5" />}
            comingSoon
          />
          <FeatureCard
            name="features.instagramFeed"
            control={control}
            title="Instagram Feed"
            description="Display Instagram feed"
            icon={<Instagram className="h-5 w-5" />}
            comingSoon
          />
        </div>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Catalog & Filters Tab
// ---------------------------------------------------------------------------

interface CatalogTabProps {
  control: Control<CommerceFormData>;
  register: UseFormRegister<CommerceFormData>;
  watch: UseFormWatch<CommerceFormData>;
}

function CatalogTab({ control, register, watch }: CatalogTabProps) {
  const filtersEnabled = watch("filters.enabled");
  const quickFiltersEnabled = watch("quickFilters.enabled");

  return (
    <>
      {/* Product Filters */}
      <FormSection title="Product Filters" description="Configure which filters appear in product listings">
        <FormSwitch<CommerceFormData>
          label="Enable Product Filters"
          name="filters.enabled"
          control={control}
          description="Enable the filter sidebar on product pages"
        />

        {filtersEnabled && (
          <FieldGroup columns={2}>
            <FormSwitch<CommerceFormData>
              label="Price Filter"
              name="filters.priceFilter.enabled"
              control={control}
            />
            <FormSwitch<CommerceFormData>
              label="Price Quick Buttons"
              name="filters.priceFilter.showQuickButtons"
              control={control}
              description="Show preset price ranges"
            />
            <FormSwitch<CommerceFormData>
              label="Rating Filter"
              name="filters.ratingFilter.enabled"
              control={control}
            />
            <FormSwitch<CommerceFormData>
              label="Brand Filter"
              name="filters.brandFilter.enabled"
              control={control}
            />
            <FormSwitch<CommerceFormData>
              label="Size Filter"
              name="filters.sizeFilter.enabled"
              control={control}
            />
            <FormSwitch<CommerceFormData>
              label="Color Filter"
              name="filters.colorFilter.enabled"
              control={control}
            />
            <FormSwitch<CommerceFormData>
              label="Category Filter"
              name="filters.categoryFilter.enabled"
              control={control}
            />
            <FormSwitch<CommerceFormData>
              label="Collection Filter"
              name="filters.collectionFilter.enabled"
              control={control}
            />
            <FormSwitch<CommerceFormData>
              label="Stock Filter"
              name="filters.stockFilter.enabled"
              control={control}
            />
          </FieldGroup>
        )}
      </FormSection>

      {/* Quick Filters */}
      <FormSection title="Quick Filters" description="Visual filter cards at the top of product listings">
        <FormSwitch<CommerceFormData>
          label="Enable Quick Filters"
          name="quickFilters.enabled"
          control={control}
        />

        {quickFiltersEnabled && (
          <>
            <FieldGroup columns={2}>
              <FormSwitch<CommerceFormData>
                label="Show Categories"
                name="quickFilters.showCategories"
                control={control}
              />
              <FormSwitch<CommerceFormData>
                label="Show Collections"
                name="quickFilters.showCollections"
                control={control}
              />
              <FormSwitch<CommerceFormData>
                label="Show Brands"
                name="quickFilters.showBrands"
                control={control}
              />
            </FieldGroup>

            <FieldGroup columns={3}>
              <FormField<CommerceFormData>
                label="Category Limit"
                name="quickFilters.categoryLimit"
                register={register}
                errors={undefined}
                type="number"
                placeholder="8"
                description="Max categories to show"
              />
              <FormField<CommerceFormData>
                label="Collection Limit"
                name="quickFilters.collectionLimit"
                register={register}
                errors={undefined}
                type="number"
                placeholder="6"
                description="Max collections to show"
              />
              <FormField<CommerceFormData>
                label="Brand Limit"
                name="quickFilters.brandLimit"
                register={register}
                errors={undefined}
                type="number"
                placeholder="6"
                description="Max brands to show"
              />
            </FieldGroup>
          </>
        )}
      </FormSection>

      {/* Quick Filter Styling */}
      <FormSection
        title="Quick Filter Styling"
        description="Customize the appearance of the Shop All button"
        collapsible
        defaultExpanded={false}
      >
        <FieldGroup columns={2}>
          <FormColorPicker<CommerceFormData>
            label="Shop All Button BG"
            name="quickFilters.style.shopAllButtonBackgroundColor"
            control={control}
          />
          <FormColorPicker<CommerceFormData>
            label="Shop All Button Text"
            name="quickFilters.style.shopAllButtonTextColor"
            control={control}
          />
          <FormColorPicker<CommerceFormData>
            label="Shop All Button Hover BG"
            name="quickFilters.style.shopAllButtonHoverBackgroundColor"
            control={control}
          />
          <FormColorPicker<CommerceFormData>
            label="Shop All Button Border"
            name="quickFilters.style.shopAllButtonBorderColor"
            control={control}
          />
        </FieldGroup>
      </FormSection>
    </>
  );
}

// ---------------------------------------------------------------------------
// Cart & Shipping Tab
// ---------------------------------------------------------------------------

interface CartShippingTabProps {
  control: Control<CommerceFormData>;
  register: UseFormRegister<CommerceFormData>;
  errors: FieldErrors<CommerceFormData>;
}

function CartShippingTab({ control, register, errors }: CartShippingTabProps) {
  return (
    <>
      {/* Shipping */}
      <FormSection title="Shipping" description="Shipping display and free shipping threshold">
        <FormField<CommerceFormData>
          label="Free Shipping Threshold"
          name="ecommerce.shipping.freeShippingThreshold"
          register={register}
          errors={errors}
          type="number"
          description="Order amount for free shipping (leave empty for no free shipping)"
        />
        <FormSwitch<CommerceFormData>
          label="Show Estimated Delivery"
          name="ecommerce.shipping.showEstimatedDelivery"
          control={control}
        />
      </FormSection>

      {/* Tax */}
      <FormSection title="Tax" description="Tax display preferences" comingSoon>
        <FormSwitch<CommerceFormData>
          label="Show Prices With Tax"
          name="ecommerce.tax.showPricesWithTax"
          control={control}
        />
        <FormSwitch<CommerceFormData>
          label="Tax Included in Price"
          name="ecommerce.tax.taxIncludedInPrice"
          control={control}
        />
      </FormSection>

      {/* Inventory */}
      <FormSection title="Inventory" description="Stock display and backorder settings" comingSoon>
        <FormSwitch<CommerceFormData>
          label="Show Stock Level"
          name="ecommerce.inventory.showStockLevel"
          control={control}
        />
        <FormField<CommerceFormData>
          label="Low Stock Threshold"
          name="ecommerce.inventory.lowStockThreshold"
          register={register}
          errors={errors}
          type="number"
        />
        <FormSwitch<CommerceFormData>
          label="Allow Backorders"
          name="ecommerce.inventory.allowBackorders"
          control={control}
        />
      </FormSection>

      {/* Checkout Limits */}
      <FormSection title="Checkout Limits" description="Order amount restrictions and terms" comingSoon>
        <FieldGroup columns={2}>
          <FormField<CommerceFormData>
            label="Min Order Amount"
            name="ecommerce.checkout.minOrderAmount"
            register={register}
            errors={errors}
            type="number"
          />
          <FormField<CommerceFormData>
            label="Max Order Amount"
            name="ecommerce.checkout.maxOrderAmount"
            register={register}
            errors={errors}
            type="number"
          />
        </FieldGroup>
        <FormSwitch<CommerceFormData>
          label="Terms Required"
          name="ecommerce.checkout.termsRequired"
          control={control}
          description="Require terms acceptance before checkout"
        />
      </FormSection>

      {/* Related Products */}
      <FormSection title="Related Products" description="Configure related product suggestions on product pages">
        <FormSwitch<CommerceFormData>
          label="Enable Related Products"
          name="relatedProducts.enabled"
          control={control}
        />
        <FormField<CommerceFormData>
          label="Max Items"
          name="relatedProducts.maxItems"
          register={register}
          errors={errors}
          type="number"
        />
        <FormField<CommerceFormData>
          label="Title"
          name="relatedProducts.title"
          register={register}
          errors={errors}
          placeholder="Related Products"
        />
        <FormField<CommerceFormData>
          label="Subtitle"
          name="relatedProducts.subtitle"
          register={register}
          errors={errors}
          placeholder="You may also like"
        />
      </FormSection>
    </>
  );
}

// ---------------------------------------------------------------------------
// Next.js page export
// ---------------------------------------------------------------------------

export default CommercePage;
