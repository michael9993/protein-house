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
    </>
  );
}
