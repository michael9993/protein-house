import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import type {
  Control,
  FieldErrors,
  UseFormRegister,
  UseFormSetValue,
  UseFormWatch,
} from "react-hook-form";
import { z } from "zod";
import {
  Home,
  PanelTop,
  ToggleLeft,
  FileText,
  Scale,
  Lock,
  Megaphone,
  Layout,
  Footprints,
  Link2,
  Copyright,
  Star,
  BarChart3,
  Zap,
  Grid3X3,
  MessageSquare,
  Mail,
  ShieldCheck,
  Rows3,
  Image,
  Type,
  Layers,
} from "lucide-react";

import { AppShell } from "@/components/layout/AppShell";
import { SaveBar } from "@/components/layout/SaveBar";
import { FormField } from "@/components/forms/FormField";
import { FormSelect } from "@/components/forms/FormSelect";
import { FormSwitch } from "@/components/forms/FormSwitch";
import { FormColorPicker } from "@/components/forms/FormColorPicker";
import { FormSlider } from "@/components/forms/FormSlider";
import { FormSection } from "@/components/forms/FormSection";
import { FieldGroup } from "@/components/shared/FieldGroup";
import { FeatureCard } from "@/components/shared/FeatureCard";
import { SectionDivider } from "@/components/shared/SectionDivider";
import { LoadingState } from "@/components/shared/LoadingState";
import { SortableSectionList } from "@/components/homepage-builder/SortableSectionList";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useConfigPage } from "@/hooks/useConfigPage";
import {
  HomepageSchema,
  HeaderSchema,
  FooterSchema,
  PagesSchema,
  DEFAULT_SECTION_ORDER,
} from "@/modules/config/schema";
import type { HomepageSectionId } from "@/modules/config/schema";

// ---------------------------------------------------------------------------
// Schema & types
// ---------------------------------------------------------------------------

const PagesFormSchema = z.object({
  homepage: HomepageSchema,
  header: HeaderSchema,
  footer: FooterSchema,
  pages: PagesSchema,
});

type PagesFormData = z.infer<typeof PagesFormSchema>;

// ---------------------------------------------------------------------------
// Tab definitions
// ---------------------------------------------------------------------------

const PAGES_TABS = [
  { id: "homepage", label: "Homepage", icon: Home },
  { id: "header-footer", label: "Header & Footer", icon: PanelTop },
  { id: "page-toggles", label: "Page Toggles", icon: ToggleLeft },
] as const;

type PagesTabId = (typeof PAGES_TABS)[number]["id"];

function isValidTab(value: string | undefined): value is PagesTabId {
  return PAGES_TABS.some((t) => t.id === value);
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

function PagesConfigPage() {
  const router = useRouter();
  const tabParam = router.query.tab as string | undefined;
  const initialTab = isValidTab(tabParam) ? tabParam : "homepage";
  const [activeTab, setActiveTab] = useState<PagesTabId>(initialTab);

  useEffect(() => {
    if (isValidTab(tabParam) && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [tabParam]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleTabChange(value: string) {
    const tab = value as PagesTabId;
    setActiveTab(tab);
    router.replace(
      { pathname: router.pathname, query: { ...router.query, tab } },
      undefined,
      { shallow: true },
    );
  }

  const { config, isNotReady, form, onSubmit, saveStatus } = useConfigPage({
    schema: PagesFormSchema,
    sections: ["homepage", "header", "footer", "pages"],
    extractFormData: (c) => ({
      homepage: c.homepage,
      header: c.header,
      footer: c.footer,
      pages: c.pages,
    }),
  });

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = form;

  if (isNotReady) {
    return (
      <AppShell
        channelSlug=""
        activePage="pages-config"
        title="Pages"
      >
        <LoadingState />
      </AppShell>
    );
  }

  return (
    <AppShell
      channelSlug={router.query.channelSlug as string}
      channelName={config?.store.name}
      activePage="pages-config"
      title="Pages"
      description="Homepage layout, header, footer, and page visibility"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 p-6">
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="mb-6">
            {PAGES_TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <TabsTrigger key={tab.id} value={tab.id} className="gap-2">
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {/* Tab 1: Homepage */}
          <TabsContent
            value="homepage"
            forceMount
            className={activeTab !== "homepage" ? "hidden" : "space-y-6"}
          >
            <HomepageTab
              register={register}
              control={control}
              errors={errors}
              watch={watch}
              setValue={setValue}
            />
          </TabsContent>

          {/* Tab 2: Header & Footer */}
          <TabsContent
            value="header-footer"
            forceMount
            className={activeTab !== "header-footer" ? "hidden" : "space-y-6"}
          >
            <HeaderFooterTab
              register={register}
              control={control}
              errors={errors}
              watch={watch}
            />
          </TabsContent>

          {/* Tab 3: Page Toggles */}
          <TabsContent
            value="page-toggles"
            forceMount
            className={activeTab !== "page-toggles" ? "hidden" : "space-y-6"}
          >
            <PageTogglesTab control={control} />
          </TabsContent>
        </Tabs>

        <SaveBar
          isDirty={isDirty}
          saveStatus={saveStatus}
          onReset={() => {
            if (config) {
              form.reset({
                homepage: config.homepage,
                header: config.header,
                footer: config.footer,
                pages: config.pages,
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
// Tab 1: Homepage
// ---------------------------------------------------------------------------

interface HomepageTabProps {
  register: UseFormRegister<PagesFormData>;
  control: Control<PagesFormData>;
  errors: FieldErrors<PagesFormData>;
  watch: UseFormWatch<PagesFormData>;
  setValue: UseFormSetValue<PagesFormData>;
}

function HomepageTab({ register, control, errors, watch, setValue }: HomepageTabProps) {
  const heroEnabled = watch("homepage.sections.hero.enabled");
  const heroType = watch("homepage.sections.hero.type");
  const marqueeEnabled = watch("homepage.sections.marquee.enabled");
  const trustStripEnabled = watch("homepage.sections.trustStrip.enabled");
  const brandGridEnabled = watch("homepage.sections.brandGrid.enabled");
  const categoriesEnabled = watch("homepage.sections.categories.enabled");
  const trendingEnabled = watch("homepage.sections.trending.enabled");
  const promoBannerEnabled = watch("homepage.sections.promotionBanner.enabled");
  const flashDealsEnabled = watch("homepage.sections.flashDeals.enabled");
  const mosaicEnabled = watch("homepage.sections.collectionMosaic.enabled");
  const bestSellersEnabled = watch("homepage.sections.bestSellers.enabled");
  const feedbackEnabled = watch("homepage.sections.customerFeedback.enabled");
  const newsletterEnabled = watch("homepage.sections.newsletter.enabled");
  const sectionOrder = watch("homepage.sectionOrder") ?? DEFAULT_SECTION_ORDER;

  return (
    <>
      {/* Section Order — Drag & Drop */}
      <FormSection
        title="Section Order"
        description="Drag to reorder homepage sections. Toggle sections on or off."
        icon={<Rows3 className="h-4 w-4" />}
      >
        <SortableSectionList
          sectionOrder={sectionOrder}
          control={control}
          setValue={setValue}
          watch={watch}
        />
      </FormSection>

      <SectionDivider label="Section Settings" className="my-4" />

      {/* Hero Banner */}
      <FormSection
        title="Hero Banner"
        description="Product card deck with auto-rotate carousel"
        icon={<Image className="h-4 w-4" />}
        collapsible
        defaultExpanded={false}
      >
        <FormSwitch<PagesFormData>
          label="Enable Hero Section"
          name="homepage.sections.hero.enabled"
          control={control}
          description="Show the hero product deck on the homepage"
        />

        {heroEnabled && (
          <div className="space-y-4 pt-2">
            {/* Active fields — these are consumed by the storefront */}
            <FieldGroup columns={2}>
              <FormField<PagesFormData>
                label="Title"
                name="homepage.sections.hero.title"
                register={register}
                errors={errors}
                placeholder="Welcome to Our Store"
              />
              <FormField<PagesFormData>
                label="Subtitle"
                name="homepage.sections.hero.subtitle"
                register={register}
                errors={errors}
                placeholder="Discover amazing products"
              />
            </FieldGroup>

            <FieldGroup columns={2}>
              <FormField<PagesFormData>
                label="CTA Text"
                name="homepage.sections.hero.ctaText"
                register={register}
                errors={errors}
                placeholder="Shop Now"
              />
              <FormField<PagesFormData>
                label="CTA Link"
                name="homepage.sections.hero.ctaLink"
                register={register}
                errors={errors}
                placeholder="/products"
              />
            </FieldGroup>

            {/* Background Media — Coming Soon */}
            <FormSection
              title="Background Media"
              description="Custom background image, video, or image slider for the hero"
              comingSoon
              collapsible
              defaultExpanded={false}
            >
              <FormSelect<PagesFormData>
                label="Type"
                name="homepage.sections.hero.type"
                control={control}
                options={[
                  { value: "image", label: "Static Image" },
                  { value: "video", label: "Video" },
                  { value: "slider", label: "Image Slider" },
                ]}
              />

              <FormField<PagesFormData>
                label="Badge Text"
                name="homepage.sections.hero.badgeText"
                register={register}
                errors={errors}
                placeholder="New Season Collection"
                description="Shown above the title (leave empty to hide)"
              />

              <FieldGroup columns={2}>
                <FormSelect<PagesFormData>
                  label="Text Alignment"
                  name="homepage.sections.hero.textAlignment"
                  control={control}
                  options={[
                    { value: "left", label: "Left" },
                    { value: "center", label: "Center" },
                    { value: "right", label: "Right" },
                    { value: "start", label: "Start (RTL-aware)" },
                    { value: "end", label: "End (RTL-aware)" },
                  ]}
                />
                <FormSlider<PagesFormData>
                  label="Overlay Opacity"
                  name="homepage.sections.hero.overlayOpacity"
                  control={control}
                  min={0}
                  max={100}
                  unit="%"
                  description="0 = transparent, 100 = solid"
                />
              </FieldGroup>

              {(heroType === "image" || heroType === "video") && (
                <FormField<PagesFormData>
                  label="Image URL"
                  name="homepage.sections.hero.imageUrl"
                  register={register}
                  errors={errors}
                  type="url"
                  placeholder="https://example.com/hero.jpg"
                  description="Recommended: 1920x800px"
                />
              )}

              {heroType === "video" && (
                <FormField<PagesFormData>
                  label="Video URL"
                  name="homepage.sections.hero.videoUrl"
                  register={register}
                  errors={errors}
                  type="url"
                  placeholder="https://example.com/hero.mp4"
                  description="Direct link to video file (MP4 recommended)"
                />
              )}
            </FormSection>
          </div>
        )}
      </FormSection>

      {/* Trust Strip */}
      <FormSection
        title="Trust Strip"
        description="Trust indicators below the hero — shipping, returns, security"
        icon={<ShieldCheck className="h-4 w-4" />}
        collapsible
        defaultExpanded={false}
      >
        <FormSwitch<PagesFormData>
          label="Enable Trust Strip"
          name="homepage.sections.trustStrip.enabled"
          control={control}
        />

        {trustStripEnabled && (
          <div className="space-y-4 pt-2">
            <FieldGroup columns={2}>
              <FormField<PagesFormData>
                label="Free Shipping Text"
                name="homepage.sections.trustStrip.freeShippingText"
                register={register}
                errors={errors}
                placeholder="Free Shipping"
              />
              <FormField<PagesFormData>
                label="Easy Returns Text"
                name="homepage.sections.trustStrip.easyReturnsText"
                register={register}
                errors={errors}
                placeholder="Easy Returns"
              />
            </FieldGroup>
            <FieldGroup columns={2}>
              <FormField<PagesFormData>
                label="Secure Checkout Text"
                name="homepage.sections.trustStrip.secureCheckoutText"
                register={register}
                errors={errors}
                placeholder="Secure Checkout"
              />
              <FormField<PagesFormData>
                label="Support Text"
                name="homepage.sections.trustStrip.supportText"
                register={register}
                errors={errors}
                placeholder="24/7 Support"
              />
            </FieldGroup>
          </div>
        )}
      </FormSection>

      {/* Marquee */}
      <FormSection
        title="Marquee"
        description="Scrolling text announcement banner"
        icon={<Type className="h-4 w-4" />}
        collapsible
        defaultExpanded={false}
      >
        <FormSwitch<PagesFormData>
          label="Enable Marquee"
          name="homepage.sections.marquee.enabled"
          control={control}
          description="Show scrolling text banner"
        />

        {marqueeEnabled && (
          <div className="space-y-4 pt-2">
            <FormField<PagesFormData>
              label="Text"
              name="homepage.sections.marquee.text"
              register={register}
              errors={errors}
              placeholder="Free shipping on all orders"
            />
            <FieldGroup columns={2}>
              <FormSlider<PagesFormData>
                label="Speed"
                name="homepage.sections.marquee.speedSeconds"
                control={control}
                min={2}
                max={120}
                unit="s"
                description="Seconds for one full scroll cycle"
              />
              <FormColorPicker<PagesFormData>
                label="Text Color"
                name="homepage.sections.marquee.textColor"
                control={control}
              />
            </FieldGroup>
          </div>
        )}
      </FormSection>

      {/* Brand Grid */}
      <FormSection
        title="Brand Partners"
        description="Brand logo grid or scrolling marquee"
        icon={<Grid3X3 className="h-4 w-4" />}
        collapsible
        defaultExpanded={false}
      >
        <FormSwitch<PagesFormData>
          label="Enable Brand Grid"
          name="homepage.sections.brandGrid.enabled"
          control={control}
        />

        {brandGridEnabled && (
          <div className="space-y-4 pt-2">
            <FieldGroup columns={2}>
              <FormField<PagesFormData>
                label="Title"
                name="homepage.sections.brandGrid.title"
                register={register}
                errors={errors}
                placeholder="Our Brands"
              />
              <FormField<PagesFormData>
                label="Subtitle"
                name="homepage.sections.brandGrid.subtitle"
                register={register}
                errors={errors}
                placeholder="Trusted by the best"
              />
            </FieldGroup>
            <FieldGroup columns={2}>
              <FormSelect<PagesFormData>
                label="Layout"
                name="homepage.sections.brandGrid.layout"
                control={control}
                options={[
                  { value: "grid", label: "Grid" },
                  { value: "marquee", label: "Scrolling Marquee" },
                ]}
              />
              <FormSlider<PagesFormData>
                label="Max Brands"
                name="homepage.sections.brandGrid.maxBrands"
                control={control}
                min={4}
                max={20}
                description="Maximum number of brand logos"
              />
            </FieldGroup>
            <FormSwitch<PagesFormData>
              label="Show Logos"
              name="homepage.sections.brandGrid.showLogos"
              control={control}
              description="Display brand logo images"
            />
          </div>
        )}
      </FormSection>

      {/* Categories */}
      <FormSection
        title="Categories"
        description="Shop by category section"
        icon={<Layout className="h-4 w-4" />}
        collapsible
        defaultExpanded={false}
      >
        <FormSwitch<PagesFormData>
          label="Enable Categories"
          name="homepage.sections.categories.enabled"
          control={control}
        />

        {categoriesEnabled && (
          <div className="space-y-4 pt-2">
            <FieldGroup columns={2}>
              <FormField<PagesFormData>
                label="Title"
                name="homepage.sections.categories.title"
                register={register}
                errors={errors}
                placeholder="Shop by Category"
              />
              <FormField<PagesFormData>
                label="Subtitle"
                name="homepage.sections.categories.subtitle"
                register={register}
                errors={errors}
                placeholder="Browse our collections"
              />
            </FieldGroup>
            <FieldGroup columns={2}>
              <FormSelect<PagesFormData>
                label="Layout Style"
                name="homepage.sections.categories.layoutStyle"
                control={control}
                options={[
                  { value: "mosaic", label: "Mosaic" },
                  { value: "grid", label: "Grid" },
                  { value: "carousel", label: "Carousel" },
                ]}
              />
              <FormSlider<PagesFormData>
                label="Max Categories"
                name="homepage.sections.categories.maxCategories"
                control={control}
                min={4}
                max={12}
              />
            </FieldGroup>
            <FormSwitch<PagesFormData>
              label="Show Product Count"
              name="homepage.sections.categories.showProductCount"
              control={control}
              description="Display product count in each category card"
            />
          </div>
        )}
      </FormSection>

      {/* Trending / New Arrivals */}
      <FormSection
        title="Trending / New Arrivals"
        description="Trending or newest products section"
        icon={<Star className="h-4 w-4" />}
        collapsible
        defaultExpanded={false}
      >
        <FormSwitch<PagesFormData>
          label="Enable Trending"
          name="homepage.sections.trending.enabled"
          control={control}
        />

        {trendingEnabled && (
          <div className="space-y-4 pt-2">
            <FieldGroup columns={2}>
              <FormField<PagesFormData>
                label="Title"
                name="homepage.sections.trending.title"
                register={register}
                errors={errors}
                placeholder="Trending Now"
              />
              <FormField<PagesFormData>
                label="Subtitle"
                name="homepage.sections.trending.subtitle"
                register={register}
                errors={errors}
                placeholder="See what's popular"
              />
            </FieldGroup>
            <FormField<PagesFormData>
              label="Collection Slug"
              name="homepage.sections.trending.collectionSlug"
              register={register}
              errors={errors}
              placeholder="new-arrivals"
              description="Saleor collection slug to pull products from"
            />
            <FieldGroup columns={2}>
              <FormSelect<PagesFormData>
                label="Layout"
                name="homepage.sections.trending.layout"
                control={control}
                options={[
                  { value: "grid", label: "Grid" },
                  { value: "carousel", label: "Carousel" },
                ]}
              />
              <FormSlider<PagesFormData>
                label="Max Products"
                name="homepage.sections.trending.maxProducts"
                control={control}
                min={4}
                max={12}
              />
            </FieldGroup>
            <FormSwitch<PagesFormData>
              label="Fallback to Newest"
              name="homepage.sections.trending.fallbackToNewest"
              control={control}
              description="If collection is empty, show newest products instead"
            />
          </div>
        )}
      </FormSection>

      {/* Promotion Banner */}
      <FormSection
        title="Promotion Banner"
        description="Mid-page promotional banner with CTA"
        icon={<Megaphone className="h-4 w-4" />}
        collapsible
        defaultExpanded={false}
      >
        <FormSwitch<PagesFormData>
          label="Enable Promotion Banner"
          name="homepage.sections.promotionBanner.enabled"
          control={control}
        />

        {promoBannerEnabled && (
          <div className="space-y-4 pt-2">
            <FormField<PagesFormData>
              label="Badge Text"
              name="homepage.sections.promotionBanner.badgeText"
              register={register}
              errors={errors}
              placeholder="Limited Time"
            />
            <FieldGroup columns={2}>
              <FormField<PagesFormData>
                label="Title"
                name="homepage.sections.promotionBanner.title"
                register={register}
                errors={errors}
                placeholder="Summer Sale"
              />
              <FormField<PagesFormData>
                label="Highlight"
                name="homepage.sections.promotionBanner.highlight"
                register={register}
                errors={errors}
                placeholder="Up to 50% off"
                description="Emphasized text (shown larger)"
              />
            </FieldGroup>
            <FormField<PagesFormData>
              label="Description"
              name="homepage.sections.promotionBanner.description"
              register={register}
              errors={errors}
              placeholder="Shop our biggest sale of the year"
            />
            <SectionDivider label="Primary CTA" className="my-2" />
            <FieldGroup columns={2}>
              <FormField<PagesFormData>
                label="Button Text"
                name="homepage.sections.promotionBanner.primaryCta.text"
                register={register}
                errors={errors}
                placeholder="Shop Now"
              />
              <FormField<PagesFormData>
                label="Button Link"
                name="homepage.sections.promotionBanner.primaryCta.link"
                register={register}
                errors={errors}
                placeholder="/products"
              />
            </FieldGroup>
            <FormSwitch<PagesFormData>
              label="Auto-detect Discount"
              name="homepage.sections.promotionBanner.autoDetectDiscount"
              control={control}
              description="Automatically show active Saleor discounts"
            />
          </div>
        )}
      </FormSection>

      {/* Flash Deals */}
      <FormSection
        title="Flash Deals"
        description="Time-limited sale products"
        icon={<Zap className="h-4 w-4" />}
        collapsible
        defaultExpanded={false}
      >
        <FormSwitch<PagesFormData>
          label="Enable Flash Deals"
          name="homepage.sections.flashDeals.enabled"
          control={control}
        />

        {flashDealsEnabled && (
          <div className="space-y-4 pt-2">
            <FieldGroup columns={2}>
              <FormField<PagesFormData>
                label="Title"
                name="homepage.sections.flashDeals.title"
                register={register}
                errors={errors}
                placeholder="Flash Deals"
              />
              <FormField<PagesFormData>
                label="Subtitle"
                name="homepage.sections.flashDeals.subtitle"
                register={register}
                errors={errors}
                placeholder="Limited time offers"
              />
            </FieldGroup>
            <FormField<PagesFormData>
              label="Badge Template"
              name="homepage.sections.flashDeals.badgeTemplate"
              register={register}
              errors={errors}
              placeholder="SAVE {discount}%"
              description="Use {discount} as placeholder for discount percentage"
            />
            <FormField<PagesFormData>
              label="Collection Slug"
              name="homepage.sections.flashDeals.collectionSlug"
              register={register}
              errors={errors}
              placeholder="sale"
              description="Saleor collection slug for flash deal products"
            />
            <FormSlider<PagesFormData>
              label="Max Products"
              name="homepage.sections.flashDeals.maxProducts"
              control={control}
              min={4}
              max={12}
            />
          </div>
        )}
      </FormSection>

      {/* Collection Mosaic */}
      <FormSection
        title="Collection Mosaic"
        description="Featured collections displayed in a visual grid"
        icon={<Layers className="h-4 w-4" />}
        collapsible
        defaultExpanded={false}
      >
        <FormSwitch<PagesFormData>
          label="Enable Collection Mosaic"
          name="homepage.sections.collectionMosaic.enabled"
          control={control}
        />

        {mosaicEnabled && (
          <div className="space-y-4 pt-2">
            <FieldGroup columns={2}>
              <FormField<PagesFormData>
                label="Title"
                name="homepage.sections.collectionMosaic.title"
                register={register}
                errors={errors}
                placeholder="Shop Collections"
              />
              <FormField<PagesFormData>
                label="Subtitle"
                name="homepage.sections.collectionMosaic.subtitle"
                register={register}
                errors={errors}
                placeholder="Explore curated collections"
              />
            </FieldGroup>
            <FieldGroup columns={2}>
              <FormSelect<PagesFormData>
                label="Layout Style"
                name="homepage.sections.collectionMosaic.layoutStyle"
                control={control}
                options={[
                  { value: "mosaic", label: "Mosaic" },
                  { value: "grid", label: "Grid" },
                ]}
              />
              <FormSlider<PagesFormData>
                label="Max Collections"
                name="homepage.sections.collectionMosaic.maxCollections"
                control={control}
                min={3}
                max={8}
              />
            </FieldGroup>
          </div>
        )}
      </FormSection>

      {/* Best Sellers */}
      <FormSection
        title="Best Sellers"
        description="Top-selling products section"
        icon={<BarChart3 className="h-4 w-4" />}
        collapsible
        defaultExpanded={false}
      >
        <FormSwitch<PagesFormData>
          label="Enable Best Sellers"
          name="homepage.sections.bestSellers.enabled"
          control={control}
        />

        {bestSellersEnabled && (
          <div className="space-y-4 pt-2">
            <FieldGroup columns={2}>
              <FormField<PagesFormData>
                label="Title"
                name="homepage.sections.bestSellers.title"
                register={register}
                errors={errors}
                placeholder="Best Sellers"
              />
              <FormField<PagesFormData>
                label="Subtitle"
                name="homepage.sections.bestSellers.subtitle"
                register={register}
                errors={errors}
                placeholder="Our most popular products"
              />
            </FieldGroup>
            <FormField<PagesFormData>
              label="Collection Slug"
              name="homepage.sections.bestSellers.collectionSlug"
              register={register}
              errors={errors}
              placeholder="best-sellers"
              description="Saleor collection slug for best-selling products"
            />
            <FieldGroup columns={2}>
              <FormSelect<PagesFormData>
                label="Layout"
                name="homepage.sections.bestSellers.layout"
                control={control}
                options={[
                  { value: "grid", label: "Grid" },
                  { value: "carousel", label: "Carousel" },
                  { value: "horizontal-scroll", label: "Horizontal Scroll" },
                ]}
              />
              <FormSlider<PagesFormData>
                label="Max Products"
                name="homepage.sections.bestSellers.maxProducts"
                control={control}
                min={4}
                max={12}
              />
            </FieldGroup>
            <FormSwitch<PagesFormData>
              label="Fallback to Top Rated"
              name="homepage.sections.bestSellers.fallbackToTopRated"
              control={control}
              description="If collection is empty, show highest-rated products"
            />
          </div>
        )}
      </FormSection>

      {/* Customer Feedback */}
      <FormSection
        title="Customer Feedback"
        description="Customer reviews and ratings section"
        icon={<MessageSquare className="h-4 w-4" />}
        collapsible
        defaultExpanded={false}
      >
        <FormSwitch<PagesFormData>
          label="Enable Customer Feedback"
          name="homepage.sections.customerFeedback.enabled"
          control={control}
        />

        {feedbackEnabled && (
          <div className="space-y-4 pt-2">
            <FieldGroup columns={2}>
              <FormField<PagesFormData>
                label="Title"
                name="homepage.sections.customerFeedback.title"
                register={register}
                errors={errors}
                placeholder="What Our Customers Say"
              />
              <FormField<PagesFormData>
                label="Subtitle"
                name="homepage.sections.customerFeedback.subtitle"
                register={register}
                errors={errors}
                placeholder="Real reviews from real customers"
              />
            </FieldGroup>
            <FieldGroup columns={2}>
              <FormSlider<PagesFormData>
                label="Max Reviews"
                name="homepage.sections.customerFeedback.maxReviews"
                control={control}
                min={1}
                max={6}
              />
              <FormSlider<PagesFormData>
                label="Minimum Rating"
                name="homepage.sections.customerFeedback.minRating"
                control={control}
                min={1}
                max={5}
                description="Only show reviews at or above this star rating"
              />
            </FieldGroup>
            <FormSwitch<PagesFormData>
              label="Show Product Name"
              name="homepage.sections.customerFeedback.showProductName"
              control={control}
              description="Display which product the review is for"
            />
          </div>
        )}
      </FormSection>

      {/* Newsletter */}
      <FormSection
        title="Newsletter"
        description="Email subscription section"
        icon={<Mail className="h-4 w-4" />}
        collapsible
        defaultExpanded={false}
      >
        <FormSwitch<PagesFormData>
          label="Enable Newsletter"
          name="homepage.sections.newsletter.enabled"
          control={control}
        />

        {newsletterEnabled && (
          <div className="space-y-4 pt-2">
            <FieldGroup columns={2}>
              <FormField<PagesFormData>
                label="Title"
                name="homepage.sections.newsletter.title"
                register={register}
                errors={errors}
                placeholder="Stay in the Loop"
              />
              <FormField<PagesFormData>
                label="Subtitle"
                name="homepage.sections.newsletter.subtitle"
                register={register}
                errors={errors}
                placeholder="Get the latest news and deals"
              />
            </FieldGroup>
            <FieldGroup columns={2}>
              <FormField<PagesFormData>
                label="Button Text"
                name="homepage.sections.newsletter.buttonText"
                register={register}
                errors={errors}
                placeholder="Subscribe"
              />
              <FormField<PagesFormData>
                label="Placeholder Text"
                name="homepage.sections.newsletter.placeholder"
                register={register}
                errors={errors}
                placeholder="Enter your email"
              />
            </FieldGroup>
            <FormSelect<PagesFormData>
              label="Layout"
              name="homepage.sections.newsletter.layout"
              control={control}
              options={[
                { value: "inline", label: "Inline (side by side)" },
                { value: "stacked", label: "Stacked (vertical)" },
                { value: "split", label: "Split (two-column)" },
              ]}
            />
          </div>
        )}
      </FormSection>

      {/* Legacy Feature section */}
      <FormSection
        title="Feature Section (Legacy)"
        description="Highlighted collection or product with image"
        collapsible
        defaultExpanded={false}
      >
        <FormSwitch<PagesFormData>
          label="Enable Feature Section"
          name="homepage.sections.feature.enabled"
          control={control}
        />
      </FormSection>
    </>
  );
}

// ---------------------------------------------------------------------------
// Tab 2: Header & Footer
// ---------------------------------------------------------------------------

interface HeaderFooterTabProps {
  register: UseFormRegister<PagesFormData>;
  control: Control<PagesFormData>;
  errors: FieldErrors<PagesFormData>;
  watch: UseFormWatch<PagesFormData>;
}

function HeaderFooterTab({ register, control, errors, watch }: HeaderFooterTabProps) {
  const bannerEnabled = watch("header.banner.enabled");
  const useGradient = watch("header.banner.useGradient");

  return (
    <>
      {/* ---- HEADER ---- */}

      {/* Promotional Banner */}
      <FormSection
        title="Promotional Banner"
        description="Announcement bar above the header"
        icon={<Megaphone className="h-4 w-4" />}
      >
        <FormSwitch<PagesFormData>
          label="Show Banner"
          name="header.banner.enabled"
          control={control}
          description="Display the promotional banner above the header"
        />

        {bannerEnabled && (
          <div className="space-y-4 pt-2">
            <FieldGroup columns={2}>
              <FormSwitch<PagesFormData>
                label="Dismissible"
                name="header.banner.dismissible"
                control={control}
                description="Allow visitors to close the banner"
              />
              <FormSwitch<PagesFormData>
                label="Use Saleor Promotions"
                name="header.banner.useSaleorPromotions"
                control={control}
                description="Pull active promotions from Saleor"
              />
            </FieldGroup>

            <FormSwitch<PagesFormData>
              label="Use Saleor Vouchers"
              name="header.banner.useSaleorVouchers"
              control={control}
              description="Pull active vouchers from Saleor"
            />

            <FormField<PagesFormData>
              label="Fallback Text"
              name="header.banner.text"
              register={register}
              errors={errors}
              placeholder="Free shipping on orders over $50"
              description="Shown when no promotions or manual items are active"
            />

            <FormSlider<PagesFormData>
              label="Auto-scroll Interval"
              name="header.banner.autoScrollIntervalSeconds"
              control={control}
              min={4}
              max={30}
              unit="s"
              description="Seconds between banner slide rotations"
            />

            <FormSwitch<PagesFormData>
              label="Use Gradient"
              name="header.banner.useGradient"
              control={control}
              description="Use a two-color gradient instead of solid background"
            />

            {useGradient && (
              <FieldGroup columns={2}>
                <FormColorPicker<PagesFormData>
                  label="Gradient From"
                  name="header.banner.gradientFrom"
                  control={control}
                />
                <FormColorPicker<PagesFormData>
                  label="Gradient To"
                  name="header.banner.gradientTo"
                  control={control}
                />
              </FieldGroup>
            )}

            <FieldGroup columns={2}>
              <FormColorPicker<PagesFormData>
                label="Background Color"
                name="header.banner.backgroundColor"
                control={control}
                description="Used when gradient is off"
              />
              <FormColorPicker<PagesFormData>
                label="Text Color"
                name="header.banner.textColor"
                control={control}
              />
            </FieldGroup>
          </div>
        )}
      </FormSection>

      {/* Header Layout */}
      <FormSection
        title="Header Layout"
        description="Configure how the header appears"
        icon={<Layout className="h-4 w-4" />}
      >
        <FormSwitch<PagesFormData>
          label="Show Store Name"
          name="header.showStoreName"
          control={control}
          description="Display the store name next to the logo"
        />
        <FormSelect<PagesFormData>
          label="Logo Position"
          name="header.logoPosition"
          control={control}
          options={[
            { value: "left", label: "Left" },
            { value: "center", label: "Center" },
          ]}
        />
      </FormSection>

      {/* ---- DIVIDER ---- */}
      <SectionDivider label="Footer" className="my-8" />

      {/* Footer Sections */}
      <FormSection
        title="Footer Sections"
        description="Choose which sections to display in the footer"
        icon={<Footprints className="h-4 w-4" />}
      >
        <FormSwitch<PagesFormData>
          label="Show Brand"
          name="footer.showBrand"
          control={control}
          description="Show store logo and name"
        />
        <FormSwitch<PagesFormData>
          label="Show Menu"
          name="footer.showMenu"
          control={control}
          description="Show navigation menu links"
        />
        <FormSwitch<PagesFormData>
          label="Show Contact Info"
          name="footer.showContactInfo"
          control={control}
          description="Show email, phone, and address"
        />
        <FormSwitch<PagesFormData>
          label="Show Newsletter"
          name="footer.showNewsletter"
          control={control}
          description="Show newsletter subscription form"
        />
        <FormSwitch<PagesFormData>
          label="Show Social Links"
          name="footer.showSocialLinks"
          control={control}
          description="Display social media icons"
        />
      </FormSection>

      {/* Legal Links */}
      <FormSection
        title="Legal Links"
        description="Footer bottom bar links"
        icon={<Link2 className="h-4 w-4" />}
      >
        {([
          { key: "trackOrder", label: "Track Order" },
          { key: "privacyPolicy", label: "Privacy Policy" },
          { key: "termsOfService", label: "Terms of Service" },
          { key: "shippingPolicy", label: "Shipping Policy" },
          { key: "returnPolicy", label: "Return Policy" },
        ] as const).map(({ key, label }) => (
          <div key={key} className="space-y-3 rounded-lg border p-4">
            <FormSwitch<PagesFormData>
              label={`Show ${label}`}
              name={`footer.legalLinks.${key}.enabled`}
              control={control}
            />
            <FormField<PagesFormData>
              label={`${label} URL`}
              name={`footer.legalLinks.${key}.url`}
              register={register}
              errors={errors}
              placeholder={key === "trackOrder" ? "/track-order" : `/pages/${key.replace(/([A-Z])/g, "-$1").toLowerCase()}`}
              description="URL path for this link"
            />
          </div>
        ))}
      </FormSection>

      {/* Copyright */}
      <FormSection
        title="Copyright"
        description="Footer copyright text"
        icon={<Copyright className="h-4 w-4" />}
      >
        <FormField<PagesFormData>
          label="Copyright Text"
          name="footer.copyrightText"
          register={register}
          errors={errors}
          placeholder={`\u00A9 ${new Date().getFullYear()} Your Store Name. All rights reserved.`}
          description="Leave empty to auto-generate from store name and year"
        />
      </FormSection>
    </>
  );
}

// ---------------------------------------------------------------------------
// Tab 3: Page Toggles
// ---------------------------------------------------------------------------

interface PageTogglesTabProps {
  control: Control<PagesFormData>;
}

function PageTogglesTab({ control }: PageTogglesTabProps) {
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
// Next.js page export
// ---------------------------------------------------------------------------

export default PagesConfigPage;
