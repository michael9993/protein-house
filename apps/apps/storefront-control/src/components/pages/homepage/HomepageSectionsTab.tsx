import {
  BarChart3,
  Clock,
  Grid3X3,
  Image,
  Layout,
  Layers,
  Mail,
  Megaphone,
  MessageSquare,
  Rows3,
  ShieldCheck,
  Star,
  Type,
  Zap,
} from "lucide-react";

import { FormField } from "@/components/forms/FormField";
import { FormSelect } from "@/components/forms/FormSelect";
import { FormSwitch } from "@/components/forms/FormSwitch";
import { FormSlider } from "@/components/forms/FormSlider";
import { FormColorPicker } from "@/components/forms/FormColorPicker";
import { FormSection } from "@/components/forms/FormSection";
import { FieldGroup } from "@/components/shared/FieldGroup";
import { SectionDivider } from "@/components/shared/SectionDivider";
import { SortableSectionList } from "@/components/homepage-builder/SortableSectionList";
import { DEFAULT_SECTION_ORDER } from "@/modules/config/schema";
import type { HomepageFormData, HomepageSectionsTabProps } from "./types";

/**
 * Reusable background editor for homepage sections.
 * Renders style selector + color pickers based on selected style.
 */
function SectionBackgroundFields({
  sectionKey,
  register,
  control,
  watch,
  errors,
}: {
  sectionKey: string;
  register: HomepageSectionsTabProps["register"];
  control: HomepageSectionsTabProps["control"];
  watch: HomepageSectionsTabProps["watch"];
  errors: HomepageSectionsTabProps["errors"];
}) {
  const basePath = `homepage.sections.${sectionKey}.background` as const;
  const style = watch(`${basePath}.style` as keyof HomepageFormData) as unknown as string | undefined;

  return (
    <FormSection
      title="Background"
      description="Section background style and colors"
      collapsible
      defaultExpanded={false}
    >
      <FormSelect<HomepageFormData>
        label="Style"
        name={`${basePath}.style` as keyof HomepageFormData}
        control={control}
        options={[
          { value: "none", label: "None (transparent)" },
          { value: "solid", label: "Solid Color" },
          { value: "gradient", label: "Gradient" },
          { value: "color-mix", label: "Color Mix (brand tint)" },
        ]}
      />
      {style && style !== "none" && (
        <FieldGroup columns={2}>
          <FormColorPicker<HomepageFormData>
            label="Color"
            name={`${basePath}.color` as keyof HomepageFormData}
            control={control}
          />
          {style === "gradient" && (
            <FormColorPicker<HomepageFormData>
              label="Secondary Color"
              name={`${basePath}.secondaryColor` as keyof HomepageFormData}
              control={control}
            />
          )}
          {style === "color-mix" && (
            <FormSlider<HomepageFormData>
              label="Mix %"
              name={`${basePath}.mixPercentage` as keyof HomepageFormData}
              control={control}
              min={1}
              max={20}
              unit="%"
              description="How much brand color to mix in"
            />
          )}
        </FieldGroup>
      )}
    </FormSection>
  );
}

export function HomepageSectionsTab({
  register,
  control,
  errors,
  watch,
  setValue,
}: HomepageSectionsTabProps) {
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
        <FormSwitch<HomepageFormData>
          label="Enable Hero Section"
          name="homepage.sections.hero.enabled"
          control={control}
          description="Show the hero product deck on the homepage"
        />

        {heroEnabled && (
          <div className="space-y-4 pt-2">
            <FieldGroup columns={2}>
              <FormField<HomepageFormData>
                label="Title"
                name="homepage.sections.hero.title"
                register={register}
                errors={errors}
                placeholder="Welcome to Our Store"
              />
              <FormField<HomepageFormData>
                label="Subtitle"
                name="homepage.sections.hero.subtitle"
                register={register}
                errors={errors}
                placeholder="Discover amazing products"
              />
            </FieldGroup>

            <FieldGroup columns={2}>
              <FormField<HomepageFormData>
                label="CTA Text"
                name="homepage.sections.hero.ctaText"
                register={register}
                errors={errors}
                placeholder="Shop Now"
              />
              <FormField<HomepageFormData>
                label="CTA Link"
                name="homepage.sections.hero.ctaLink"
                register={register}
                errors={errors}
                placeholder="/products"
              />
            </FieldGroup>

            <SectionBackgroundFields sectionKey="hero" register={register} control={control} watch={watch} errors={errors} />

            {/* Background Media — Coming Soon */}
            <FormSection
              title="Background Media"
              description="Custom background image, video, or image slider for the hero"
              comingSoon
              collapsible
              defaultExpanded={false}
            >
              <FormSelect<HomepageFormData>
                label="Type"
                name="homepage.sections.hero.type"
                control={control}
                options={[
                  { value: "image", label: "Static Image" },
                  { value: "video", label: "Video" },
                  { value: "slider", label: "Image Slider" },
                ]}
              />

              <FormField<HomepageFormData>
                label="Badge Text"
                name="homepage.sections.hero.badgeText"
                register={register}
                errors={errors}
                placeholder="New Season Collection"
                description="Shown above the title (leave empty to hide)"
              />

              <FieldGroup columns={2}>
                <FormSelect<HomepageFormData>
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
                <FormSlider<HomepageFormData>
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
                <FormField<HomepageFormData>
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
                <FormField<HomepageFormData>
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
        <FormSwitch<HomepageFormData>
          label="Enable Trust Strip"
          name="homepage.sections.trustStrip.enabled"
          control={control}
        />

        {trustStripEnabled && (
          <div className="space-y-4 pt-2">
            <FieldGroup columns={2}>
              <FormField<HomepageFormData>
                label="Free Shipping Text"
                name="homepage.sections.trustStrip.freeShippingText"
                register={register}
                errors={errors}
                placeholder="Free Shipping"
              />
              <FormField<HomepageFormData>
                label="Easy Returns Text"
                name="homepage.sections.trustStrip.easyReturnsText"
                register={register}
                errors={errors}
                placeholder="Easy Returns"
              />
            </FieldGroup>
            <FieldGroup columns={2}>
              <FormField<HomepageFormData>
                label="Secure Checkout Text"
                name="homepage.sections.trustStrip.secureCheckoutText"
                register={register}
                errors={errors}
                placeholder="Secure Checkout"
              />
              <FormField<HomepageFormData>
                label="Support Text"
                name="homepage.sections.trustStrip.supportText"
                register={register}
                errors={errors}
                placeholder="24/7 Support"
              />
            </FieldGroup>
            <SectionBackgroundFields sectionKey="trustStrip" register={register} control={control} watch={watch} errors={errors} />
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
        <FormSwitch<HomepageFormData>
          label="Enable Marquee"
          name="homepage.sections.marquee.enabled"
          control={control}
          description="Show scrolling text banner"
        />

        {marqueeEnabled && (
          <div className="space-y-4 pt-2">
            <FormField<HomepageFormData>
              label="Text"
              name="homepage.sections.marquee.text"
              register={register}
              errors={errors}
              placeholder="Free shipping on all orders"
            />
            <FieldGroup columns={2}>
              <FormSlider<HomepageFormData>
                label="Speed"
                name="homepage.sections.marquee.speedSeconds"
                control={control}
                min={2}
                max={120}
                unit="s"
                description="Seconds for one full scroll cycle"
              />
              <FormColorPicker<HomepageFormData>
                label="Text Color"
                name="homepage.sections.marquee.textColor"
                control={control}
              />
            </FieldGroup>
            <SectionBackgroundFields sectionKey="marquee" register={register} control={control} watch={watch} errors={errors} />
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
        <FormSwitch<HomepageFormData>
          label="Enable Brand Grid"
          name="homepage.sections.brandGrid.enabled"
          control={control}
        />

        {brandGridEnabled && (
          <div className="space-y-4 pt-2">
            <FieldGroup columns={2}>
              <FormField<HomepageFormData>
                label="Title"
                name="homepage.sections.brandGrid.title"
                register={register}
                errors={errors}
                placeholder="Our Brands"
              />
              <FormField<HomepageFormData>
                label="Subtitle"
                name="homepage.sections.brandGrid.subtitle"
                register={register}
                errors={errors}
                placeholder="Trusted by the best"
              />
            </FieldGroup>
            <FieldGroup columns={2}>
              <FormSelect<HomepageFormData>
                label="Layout"
                name="homepage.sections.brandGrid.layout"
                control={control}
                options={[
                  { value: "grid", label: "Grid" },
                  { value: "marquee", label: "Scrolling Marquee" },
                ]}
              />
              <FormSlider<HomepageFormData>
                label="Max Brands"
                name="homepage.sections.brandGrid.maxBrands"
                control={control}
                min={4}
                max={20}
                description="Maximum number of brand logos"
              />
            </FieldGroup>
            <FormSwitch<HomepageFormData>
              label="Show Logos"
              name="homepage.sections.brandGrid.showLogos"
              control={control}
              description="Display brand logo images"
            />
            <SectionBackgroundFields sectionKey="brandGrid" register={register} control={control} watch={watch} errors={errors} />
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
        <FormSwitch<HomepageFormData>
          label="Enable Categories"
          name="homepage.sections.categories.enabled"
          control={control}
        />

        {categoriesEnabled && (
          <div className="space-y-4 pt-2">
            <FieldGroup columns={2}>
              <FormField<HomepageFormData>
                label="Title"
                name="homepage.sections.categories.title"
                register={register}
                errors={errors}
                placeholder="Shop by Category"
              />
              <FormField<HomepageFormData>
                label="Subtitle"
                name="homepage.sections.categories.subtitle"
                register={register}
                errors={errors}
                placeholder="Browse our collections"
              />
            </FieldGroup>
            <FieldGroup columns={2}>
              <FormSelect<HomepageFormData>
                label="Layout Style"
                name="homepage.sections.categories.layoutStyle"
                control={control}
                options={[
                  { value: "mosaic", label: "Mosaic" },
                  { value: "grid", label: "Grid" },
                  { value: "carousel", label: "Carousel" },
                ]}
              />
              <FormSlider<HomepageFormData>
                label="Max Categories"
                name="homepage.sections.categories.maxCategories"
                control={control}
                min={4}
                max={12}
              />
            </FieldGroup>
            <FormSwitch<HomepageFormData>
              label="Show Product Count"
              name="homepage.sections.categories.showProductCount"
              control={control}
              description="Display product count in each category card"
            />
            <FormSwitch<HomepageFormData>
              label="Show Subcategories"
              name="homepage.sections.categories.showSubcategories"
              control={control}
              description="Display subcategory chips on category card hover/tap"
            />
            <SectionBackgroundFields sectionKey="categories" register={register} control={control} watch={watch} errors={errors} />
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
        <FormSwitch<HomepageFormData>
          label="Enable Trending"
          name="homepage.sections.trending.enabled"
          control={control}
        />

        {trendingEnabled && (
          <div className="space-y-4 pt-2">
            <FieldGroup columns={2}>
              <FormField<HomepageFormData>
                label="Title"
                name="homepage.sections.trending.title"
                register={register}
                errors={errors}
                placeholder="Trending Now"
              />
              <FormField<HomepageFormData>
                label="Subtitle"
                name="homepage.sections.trending.subtitle"
                register={register}
                errors={errors}
                placeholder="See what's popular"
              />
            </FieldGroup>
            <FormField<HomepageFormData>
              label="Collection Slug"
              name="homepage.sections.trending.collectionSlug"
              register={register}
              errors={errors}
              placeholder="new-arrivals"
              description="Saleor collection slug to pull products from"
            />
            <FieldGroup columns={2}>
              <FormSelect<HomepageFormData>
                label="Layout"
                name="homepage.sections.trending.layout"
                control={control}
                options={[
                  { value: "grid", label: "Grid" },
                  { value: "carousel", label: "Carousel" },
                ]}
              />
              <FormSlider<HomepageFormData>
                label="Max Products"
                name="homepage.sections.trending.maxProducts"
                control={control}
                min={4}
                max={12}
              />
            </FieldGroup>
            <FormSwitch<HomepageFormData>
              label="Fallback to Newest"
              name="homepage.sections.trending.fallbackToNewest"
              control={control}
              description="If collection is empty, show newest products instead"
            />
            <SectionBackgroundFields sectionKey="trending" register={register} control={control} watch={watch} errors={errors} />
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
        <FormSwitch<HomepageFormData>
          label="Enable Promotion Banner"
          name="homepage.sections.promotionBanner.enabled"
          control={control}
        />

        {promoBannerEnabled && (
          <div className="space-y-4 pt-2">
            <FormField<HomepageFormData>
              label="Badge Text"
              name="homepage.sections.promotionBanner.badgeText"
              register={register}
              errors={errors}
              placeholder="Limited Time"
            />
            <FieldGroup columns={2}>
              <FormField<HomepageFormData>
                label="Title"
                name="homepage.sections.promotionBanner.title"
                register={register}
                errors={errors}
                placeholder="Summer Sale"
              />
              <FormField<HomepageFormData>
                label="Highlight"
                name="homepage.sections.promotionBanner.highlight"
                register={register}
                errors={errors}
                placeholder="Up to 50% off"
                description="Emphasized text (shown larger)"
              />
            </FieldGroup>
            <FormField<HomepageFormData>
              label="Description"
              name="homepage.sections.promotionBanner.description"
              register={register}
              errors={errors}
              placeholder="Shop our biggest sale of the year"
            />
            <SectionDivider label="Primary CTA" className="my-2" />
            <FieldGroup columns={2}>
              <FormField<HomepageFormData>
                label="Button Text"
                name="homepage.sections.promotionBanner.primaryCta.text"
                register={register}
                errors={errors}
                placeholder="Shop Now"
              />
              <FormField<HomepageFormData>
                label="Button Link"
                name="homepage.sections.promotionBanner.primaryCta.link"
                register={register}
                errors={errors}
                placeholder="/products"
              />
            </FieldGroup>
            <FormSwitch<HomepageFormData>
              label="Auto-detect Discount"
              name="homepage.sections.promotionBanner.autoDetectDiscount"
              control={control}
              description="Automatically show active Saleor discounts"
            />
            <SectionBackgroundFields sectionKey="promotionBanner" register={register} control={control} watch={watch} errors={errors} />
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
        <FormSwitch<HomepageFormData>
          label="Enable Flash Deals"
          name="homepage.sections.flashDeals.enabled"
          control={control}
        />

        {flashDealsEnabled && (
          <div className="space-y-4 pt-2">
            <FieldGroup columns={2}>
              <FormField<HomepageFormData>
                label="Title"
                name="homepage.sections.flashDeals.title"
                register={register}
                errors={errors}
                placeholder="Flash Deals"
              />
              <FormField<HomepageFormData>
                label="Subtitle"
                name="homepage.sections.flashDeals.subtitle"
                register={register}
                errors={errors}
                placeholder="Limited time offers"
              />
            </FieldGroup>
            <FormField<HomepageFormData>
              label="Badge Template"
              name="homepage.sections.flashDeals.badgeTemplate"
              register={register}
              errors={errors}
              placeholder="SAVE {discount}%"
              description="Use {discount} as placeholder for discount percentage"
            />
            <FormField<HomepageFormData>
              label="Collection Slug"
              name="homepage.sections.flashDeals.collectionSlug"
              register={register}
              errors={errors}
              placeholder="sale"
              description="Saleor collection slug for flash deal products"
            />
            <FormSlider<HomepageFormData>
              label="Max Products"
              name="homepage.sections.flashDeals.maxProducts"
              control={control}
              min={4}
              max={12}
            />
            <SectionBackgroundFields sectionKey="flashDeals" register={register} control={control} watch={watch} errors={errors} />
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
        <FormSwitch<HomepageFormData>
          label="Enable Collection Mosaic"
          name="homepage.sections.collectionMosaic.enabled"
          control={control}
        />

        {mosaicEnabled && (
          <div className="space-y-4 pt-2">
            <FieldGroup columns={2}>
              <FormField<HomepageFormData>
                label="Title"
                name="homepage.sections.collectionMosaic.title"
                register={register}
                errors={errors}
                placeholder="Shop Collections"
              />
              <FormField<HomepageFormData>
                label="Subtitle"
                name="homepage.sections.collectionMosaic.subtitle"
                register={register}
                errors={errors}
                placeholder="Explore curated collections"
              />
            </FieldGroup>
            <FieldGroup columns={2}>
              <FormSelect<HomepageFormData>
                label="Layout Style"
                name="homepage.sections.collectionMosaic.layoutStyle"
                control={control}
                options={[
                  { value: "mosaic", label: "Mosaic" },
                  { value: "grid", label: "Grid" },
                ]}
              />
              <FormSlider<HomepageFormData>
                label="Max Collections"
                name="homepage.sections.collectionMosaic.maxCollections"
                control={control}
                min={3}
                max={8}
              />
            </FieldGroup>
            <SectionBackgroundFields sectionKey="collectionMosaic" register={register} control={control} watch={watch} errors={errors} />
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
        <FormSwitch<HomepageFormData>
          label="Enable Best Sellers"
          name="homepage.sections.bestSellers.enabled"
          control={control}
        />

        {bestSellersEnabled && (
          <div className="space-y-4 pt-2">
            <FieldGroup columns={2}>
              <FormField<HomepageFormData>
                label="Title"
                name="homepage.sections.bestSellers.title"
                register={register}
                errors={errors}
                placeholder="Best Sellers"
              />
              <FormField<HomepageFormData>
                label="Subtitle"
                name="homepage.sections.bestSellers.subtitle"
                register={register}
                errors={errors}
                placeholder="Our most popular products"
              />
            </FieldGroup>
            <FormField<HomepageFormData>
              label="Collection Slug"
              name="homepage.sections.bestSellers.collectionSlug"
              register={register}
              errors={errors}
              placeholder="best-sellers"
              description="Saleor collection slug for best-selling products"
            />
            <FieldGroup columns={2}>
              <FormSelect<HomepageFormData>
                label="Layout"
                name="homepage.sections.bestSellers.layout"
                control={control}
                options={[
                  { value: "grid", label: "Grid" },
                  { value: "carousel", label: "Carousel" },
                  { value: "horizontal-scroll", label: "Horizontal Scroll" },
                ]}
              />
              <FormSlider<HomepageFormData>
                label="Max Products"
                name="homepage.sections.bestSellers.maxProducts"
                control={control}
                min={4}
                max={12}
              />
            </FieldGroup>
            <FormSwitch<HomepageFormData>
              label="Fallback to Top Rated"
              name="homepage.sections.bestSellers.fallbackToTopRated"
              control={control}
              description="If collection is empty, show highest-rated products"
            />
            <SectionBackgroundFields sectionKey="bestSellers" register={register} control={control} watch={watch} errors={errors} />
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
        <FormSwitch<HomepageFormData>
          label="Enable Customer Feedback"
          name="homepage.sections.customerFeedback.enabled"
          control={control}
        />

        {feedbackEnabled && (
          <div className="space-y-4 pt-2">
            <FieldGroup columns={2}>
              <FormField<HomepageFormData>
                label="Title"
                name="homepage.sections.customerFeedback.title"
                register={register}
                errors={errors}
                placeholder="What Our Customers Say"
              />
              <FormField<HomepageFormData>
                label="Subtitle"
                name="homepage.sections.customerFeedback.subtitle"
                register={register}
                errors={errors}
                placeholder="Real reviews from real customers"
              />
            </FieldGroup>
            <FieldGroup columns={2}>
              <FormSlider<HomepageFormData>
                label="Max Reviews"
                name="homepage.sections.customerFeedback.maxReviews"
                control={control}
                min={1}
                max={6}
              />
              <FormSlider<HomepageFormData>
                label="Minimum Rating"
                name="homepage.sections.customerFeedback.minRating"
                control={control}
                min={1}
                max={5}
                description="Only show reviews at or above this star rating"
              />
            </FieldGroup>
            <FormSwitch<HomepageFormData>
              label="Show Product Name"
              name="homepage.sections.customerFeedback.showProductName"
              control={control}
              description="Display which product the review is for"
            />
            <SectionBackgroundFields sectionKey="customerFeedback" register={register} control={control} watch={watch} errors={errors} />
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
        <FormSwitch<HomepageFormData>
          label="Enable Newsletter"
          name="homepage.sections.newsletter.enabled"
          control={control}
        />

        {newsletterEnabled && (
          <div className="space-y-4 pt-2">
            <FieldGroup columns={2}>
              <FormField<HomepageFormData>
                label="Title"
                name="homepage.sections.newsletter.title"
                register={register}
                errors={errors}
                placeholder="Stay in the Loop"
              />
              <FormField<HomepageFormData>
                label="Subtitle"
                name="homepage.sections.newsletter.subtitle"
                register={register}
                errors={errors}
                placeholder="Get the latest news and deals"
              />
            </FieldGroup>
            <FieldGroup columns={2}>
              <FormField<HomepageFormData>
                label="Button Text"
                name="homepage.sections.newsletter.buttonText"
                register={register}
                errors={errors}
                placeholder="Subscribe"
              />
              <FormField<HomepageFormData>
                label="Placeholder Text"
                name="homepage.sections.newsletter.placeholder"
                register={register}
                errors={errors}
                placeholder="Enter your email"
              />
            </FieldGroup>
            <FormSelect<HomepageFormData>
              label="Layout"
              name="homepage.sections.newsletter.layout"
              control={control}
              options={[
                { value: "inline", label: "Inline (side by side)" },
                { value: "stacked", label: "Stacked (vertical)" },
                { value: "split", label: "Split (two-column)" },
              ]}
            />
            <SectionBackgroundFields sectionKey="newsletter" register={register} control={control} watch={watch} errors={errors} />
          </div>
        )}
      </FormSection>

      {/* Recently Viewed */}
      <FormSection
        title="Recently Viewed"
        description="Products the customer has viewed recently"
        icon={<Clock className="h-4 w-4" />}
        collapsible
        defaultExpanded={false}
      >
        <FormSwitch<HomepageFormData>
          label="Enable Recently Viewed"
          name="homepage.sections.recentlyViewed.enabled"
          control={control}
          description="Shows recently viewed products on the homepage (stored in browser)"
        />
      </FormSection>

      {/* Legacy Feature section */}
      <FormSection
        title="Feature Section (Legacy)"
        description="Highlighted collection or product with image"
        collapsible
        defaultExpanded={false}
      >
        <FormSwitch<HomepageFormData>
          label="Enable Feature Section"
          name="homepage.sections.feature.enabled"
          control={control}
        />
      </FormSection>
    </>
  );
}
