import { FormField } from "@/components/forms/FormField";
import { FormSection } from "@/components/forms/FormSection";
import { FieldGroup } from "@/components/shared/FieldGroup";
import type { HomepageFormData, HomepageTabProps } from "./types";

export function HomepageContentTab({ register, errors }: HomepageTabProps) {
  return (
    <>
      {/* Homepage Section Text */}
      <FormSection
        title="Homepage Sections"
        description="Text for homepage section headings"
      >
        <FieldGroup columns={2}>
          <FormField<HomepageFormData>
            label="New Arrivals Title"
            name="content.homepage.newArrivalsTitle"
            register={register}
            errors={errors}
            placeholder="New Arrivals"
          />
          <FormField<HomepageFormData>
            label="New Arrivals Subtitle"
            name="content.homepage.newArrivalsSubtitle"
            register={register}
            errors={errors}
            placeholder="Check out what's new"
          />
          <FormField<HomepageFormData>
            label="Best Sellers Title"
            name="content.homepage.bestSellersTitle"
            register={register}
            errors={errors}
            placeholder="Best Sellers"
          />
          <FormField<HomepageFormData>
            label="Best Sellers Subtitle"
            name="content.homepage.bestSellersSubtitle"
            register={register}
            errors={errors}
            placeholder="Our most popular products"
          />
          <FormField<HomepageFormData>
            label="On Sale Title"
            name="content.homepage.onSaleTitle"
            register={register}
            errors={errors}
            placeholder="On Sale"
          />
          <FormField<HomepageFormData>
            label="On Sale Subtitle"
            name="content.homepage.onSaleSubtitle"
            register={register}
            errors={errors}
            placeholder="Don't miss these deals"
          />
          <FormField<HomepageFormData>
            label="Featured Title"
            name="content.homepage.featuredTitle"
            register={register}
            errors={errors}
            placeholder="Featured Products"
          />
          <FormField<HomepageFormData>
            label="Featured Subtitle"
            name="content.homepage.featuredSubtitle"
            register={register}
            errors={errors}
            placeholder="Hand-picked for you"
          />
          <FormField<HomepageFormData>
            label="Categories Title"
            name="content.homepage.categoriesTitle"
            register={register}
            errors={errors}
            placeholder="Shop by Category"
          />
          <FormField<HomepageFormData>
            label="Categories Subtitle"
            name="content.homepage.categoriesSubtitle"
            register={register}
            errors={errors}
            placeholder="Browse our collections"
          />
          <FormField<HomepageFormData>
            label="View All Categories Button"
            name="content.homepage.viewAllCategoriesButton"
            register={register}
            errors={errors}
            placeholder="View All Categories"
            description="Text for the button beneath the category grid"
          />
          <FormField<HomepageFormData>
            label="Brands Title"
            name="content.homepage.brandsTitle"
            register={register}
            errors={errors}
            placeholder="Top Brands"
          />
          <FormField<HomepageFormData>
            label="Brands Subtitle"
            name="content.homepage.brandsSubtitle"
            register={register}
            errors={errors}
            placeholder="Shop by brand"
          />
          <FormField<HomepageFormData>
            label="Testimonials Title"
            name="content.homepage.testimonialsTitle"
            register={register}
            errors={errors}
            placeholder="What Our Customers Say"
          />
          <FormField<HomepageFormData>
            label="Testimonials Subtitle"
            name="content.homepage.testimonialsSubtitle"
            register={register}
            errors={errors}
            placeholder="Real reviews from real customers"
          />
          <FormField<HomepageFormData>
            label="Average Rating Label"
            name="content.homepage.averageRatingLabel"
            register={register}
            errors={errors}
            placeholder="Average Rating"
          />
          <FormField<HomepageFormData>
            label="Happy Customers Label"
            name="content.homepage.happyCustomersLabel"
            register={register}
            errors={errors}
            placeholder="Happy Customers"
          />
          <FormField<HomepageFormData>
            label="Satisfaction Rate Label"
            name="content.homepage.satisfactionRateLabel"
            register={register}
            errors={errors}
            placeholder="Satisfaction Rate"
          />
          <FormField<HomepageFormData>
            label="Orders Delivered Label"
            name="content.homepage.ordersDeliveredLabel"
            register={register}
            errors={errors}
            placeholder="Orders Delivered"
          />
          <FormField<HomepageFormData>
            label="Verified Purchase Label"
            name="content.homepage.verifiedPurchaseLabel"
            register={register}
            errors={errors}
            placeholder="Verified Purchase"
          />
          <FormField<HomepageFormData>
            label="Loading Reviews Text"
            name="content.homepage.loadingReviewsText"
            register={register}
            errors={errors}
            placeholder="Loading reviews..."
          />
          <FormField<HomepageFormData>
            label="No Reviews Available Text"
            name="content.homepage.noReviewsAvailableText"
            register={register}
            errors={errors}
            placeholder="No reviews available yet. Be the first to review our products!"
          />
          <FormField<HomepageFormData>
            label="No Reviews Subtext"
            name="content.homepage.noReviewsSubtext"
            register={register}
            errors={errors}
            placeholder="Reviews will appear here once customers start leaving feedback."
          />
          <FormField<HomepageFormData>
            label="No Approved Reviews Text"
            name="content.homepage.noApprovedReviewsText"
            register={register}
            errors={errors}
            placeholder="No approved reviews with 4+ stars yet. {count} review(s) pending approval."
          />
          <FormField<HomepageFormData>
            label="Hero CTA Text"
            name="content.homepage.heroCtaText"
            register={register}
            errors={errors}
            placeholder="Shop Now"
          />
          <FormField<HomepageFormData>
            label="Hero Secondary CTA"
            name="content.homepage.heroSecondaryCtaText"
            register={register}
            errors={errors}
            placeholder="Learn More"
          />
          <FormField<HomepageFormData>
            label="Watch Video Button"
            name="content.homepage.watchVideoButton"
            register={register}
            errors={errors}
            placeholder="Watch Video"
            description="Text for the watch video button in hero video section"
          />
          <FormField<HomepageFormData>
            label="Shop Collection Button"
            name="content.homepage.shopNowButton"
            register={register}
            errors={errors}
            placeholder="Shop Collection"
            description="Text shown on category cards"
          />
          <FormField<HomepageFormData>
            label="Explore Text"
            name="content.homepage.exploreText"
            register={register}
            errors={errors}
            placeholder="Explore"
            description="Text shown on category cards"
          />
          <FormField<HomepageFormData>
            label="Product Count Text"
            name="content.homepage.productCountText"
            register={register}
            errors={errors}
            placeholder="Products"
          />
          <FormField<HomepageFormData>
            label="Newsletter Email Placeholder"
            name="content.homepage.newsletterEmailPlaceholder"
            register={register}
            errors={errors}
            placeholder="Enter your email"
          />
          <FormField<HomepageFormData>
            label="Recently Viewed Sub-label"
            name="content.homepage.recentlyViewedSubLabel"
            register={register}
            errors={errors}
            placeholder="Your History"
            description="Small label above the section title"
          />
          <FormField<HomepageFormData>
            label="Recently Viewed Title"
            name="content.homepage.recentlyViewedTitle"
            register={register}
            errors={errors}
            placeholder="Recently Viewed"
          />
          <FormField<HomepageFormData>
            label="Recently Viewed Subtitle"
            name="content.homepage.recentlyViewedSubtitle"
            register={register}
            errors={errors}
            placeholder="Products you've looked at recently"
          />
        </FieldGroup>
      </FormSection>

      {/* Product Badges */}
      <FormSection
        title="Product Badges"
        description="Badge labels shown on product cards (New, Sale, etc.)"
      >
        <FieldGroup columns={3}>
          <FormField<HomepageFormData>
            label="New Badge"
            name="content.homepage.newBadgeLabel"
            register={register}
            errors={errors}
            placeholder="New"
          />
          <FormField<HomepageFormData>
            label="Sale Badge"
            name="content.homepage.saleBadgeLabel"
            register={register}
            errors={errors}
            placeholder="Sale"
          />
          <FormField<HomepageFormData>
            label="Sale Badge 'OFF' Text"
            name="content.homepage.saleBadgeOffText"
            register={register}
            errors={errors}
            placeholder="OFF"
            description="Used in discount badges like '-20% OFF'"
          />
          <FormField<HomepageFormData>
            label="Featured Badge"
            name="content.homepage.featuredBadgeLabel"
            register={register}
            errors={errors}
            placeholder="Featured"
          />
          <FormField<HomepageFormData>
            label="Low Stock Badge"
            name="content.homepage.lowStockBadgeLabel"
            register={register}
            errors={errors}
            placeholder="Low stock"
          />
          <FormField<HomepageFormData>
            label="Out of Stock Badge"
            name="content.homepage.outOfStockBadgeLabel"
            register={register}
            errors={errors}
            placeholder="Out of stock"
          />
        </FieldGroup>
      </FormSection>

      {/* Navigation & CTA Labels */}
      <FormSection
        title="Navigation & Buttons"
        description="Button and CTA text across homepage sections"
      >
        <FieldGroup columns={2}>
          <FormField<HomepageFormData>
            label="Curated Label"
            name="content.homepage.curatedLabel"
            register={register}
            errors={errors}
            placeholder="Curated"
            description="Section super-heading (e.g. 'Curated', 'New Arrivals')"
          />
          <FormField<HomepageFormData>
            label="View Details Button"
            name="content.homepage.viewDetailsButton"
            register={register}
            errors={errors}
            placeholder="View details"
            description="Product card quick-view CTA"
          />
          <FormField<HomepageFormData>
            label="Performance Fallback"
            name="content.homepage.performanceFallback"
            register={register}
            errors={errors}
            placeholder="Performance"
            description="Category fallback text on product cards"
          />
          <FormField<HomepageFormData>
            label="View All Brands Button"
            name="content.homepage.viewAllBrandsButton"
            register={register}
            errors={errors}
            placeholder="View all brands"
          />
          <FormField<HomepageFormData>
            label="All Collections Button"
            name="content.homepage.allCollectionsButton"
            register={register}
            errors={errors}
            placeholder="All Collections"
          />
          <FormField<HomepageFormData>
            label="View All Offers Button"
            name="content.homepage.viewAllOffersButton"
            register={register}
            errors={errors}
            placeholder="View all offers"
          />
          <FormField<HomepageFormData>
            label="View Category Button"
            name="content.homepage.viewCategoryButton"
            register={register}
            errors={errors}
            placeholder="View All"
            description="Category card drill-down CTA"
          />
          <FormField<HomepageFormData>
            label="Explore Brands Button"
            name="content.homepage.exploreBrandsButton"
            register={register}
            errors={errors}
            placeholder="Explore brands"
            description="Hero secondary CTA text"
          />
          <FormField<HomepageFormData>
            label="Shop Collection Button"
            name="content.homepage.shopCollectionButton"
            register={register}
            errors={errors}
            placeholder="Shop collection"
            description="Collection mosaic card CTA"
          />
        </FieldGroup>
      </FormSection>

      {/* Labels & Units */}
      <FormSection
        title="Labels & Units"
        description="Counting labels and unit text used across sections"
      >
        <FieldGroup columns={2}>
          <FormField<HomepageFormData>
            label="Styles Text"
            name="content.homepage.stylesText"
            register={register}
            errors={errors}
            placeholder="styles"
            description="Product count label (e.g. '45 styles')"
          />
          <FormField<HomepageFormData>
            label="Subcategories Label"
            name="content.homepage.subcategoriesLabel"
            register={register}
            errors={errors}
            placeholder="Subcategories"
          />
          <FormField<HomepageFormData>
            label="Items Text"
            name="content.homepage.itemsText"
            register={register}
            errors={errors}
            placeholder="items"
            description="Product count unit (e.g. '12 items')"
          />
          <FormField<HomepageFormData>
            label="Featured Collection Label"
            name="content.homepage.featuredCollectionLabel"
            register={register}
            errors={errors}
            placeholder="Featured Collection"
            description="Label on collection mosaic hero card"
          />
        </FieldGroup>
      </FormSection>

      {/* Hero Stats */}
      <FormSection
        title="Hero Stats"
        description="Stat labels shown in the hero section"
      >
        <FieldGroup columns={2}>
          <FormField<HomepageFormData>
            label="Brands Stat Label"
            name="content.homepage.brandsStatLabel"
            register={register}
            errors={errors}
            placeholder="Brands"
          />
          <FormField<HomepageFormData>
            label="Styles Stat Label"
            name="content.homepage.stylesStatLabel"
            register={register}
            errors={errors}
            placeholder="Styles"
          />
        </FieldGroup>
      </FormSection>

      {/* Customer Feedback Labels */}
      <FormSection
        title="Customer Feedback Labels"
        description="Text labels used in the customer reviews section"
      >
        <FieldGroup columns={2}>
          <FormField<HomepageFormData>
            label="Reviewed Product Label"
            name="content.homepage.reviewedProductLabel"
            register={register}
            errors={errors}
            placeholder="Reviewed Product"
          />
          <FormField<HomepageFormData>
            label="Verified Buyer Label"
            name="content.homepage.verifiedBuyerLabel"
            register={register}
            errors={errors}
            placeholder="Verified Buyer"
          />
          <FormField<HomepageFormData>
            label="Anonymous Label"
            name="content.homepage.anonymousLabel"
            register={register}
            errors={errors}
            placeholder="Anonymous"
            description="Fallback name when reviewer is anonymous"
          />
        </FieldGroup>
      </FormSection>
    </>
  );
}
