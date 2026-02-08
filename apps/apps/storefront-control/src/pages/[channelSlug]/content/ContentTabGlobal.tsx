import { Box, Text } from "@saleor/macaw-ui";
import { SectionCard } from "@/modules/ui/section-card";
import { FormField, SelectField } from "@/modules/ui/form-field";
import type { ContentTabProps } from "./types";

export function ContentTabGlobal({ register, errors, control }: ContentTabProps) {
  return (
    <>
      <SectionCard
        id="content-general"
        title="General"
        description="Common text used throughout the store"
        keywords={["buttons", "labels", "newsletter", "search"]}
      >
        <Box display="grid" __gridTemplateColumns="1fr 1fr" gap={4}>
          <FormField
            label="Search Placeholder"
            name="general.searchPlaceholder"
            register={register}
            errors={errors}
            placeholder="Search products..."
          />
          <FormField
            label="Newsletter Title"
            name="general.newsletterTitle"
            register={register}
            errors={errors}
            placeholder="Subscribe to our newsletter"
          />
          <FormField
            label="Newsletter Description"
            name="general.newsletterDescription"
            register={register}
            errors={errors}
            placeholder="Get the latest updates and deals"
          />
          <FormField
            label="Newsletter Button"
            name="general.newsletterButton"
            register={register}
            errors={errors}
            placeholder="Subscribe"
          />
          <FormField
            label="Newsletter Success"
            name="general.newsletterSuccess"
            register={register}
            errors={errors}
            placeholder="Thanks for subscribing!"
          />
          <FormField
            label="Load More Button"
            name="general.loadMoreButton"
            register={register}
            errors={errors}
            placeholder="Load More"
          />
          <FormField
            label="View All Button"
            name="general.viewAllButton"
            register={register}
            errors={errors}
            placeholder="View All"
          />
          <FormField
            label="Back Button"
            name="general.backButton"
            register={register}
            errors={errors}
            placeholder="Back"
          />
          <FormField
            label="Close Button"
            name="general.closeButton"
            register={register}
            errors={errors}
            placeholder="Close"
          />
          <FormField
            label="Save Button"
            name="general.saveButton"
            register={register}
            errors={errors}
            placeholder="Save"
          />
          <FormField
            label="Cancel Button"
            name="general.cancelButton"
            register={register}
            errors={errors}
            placeholder="Cancel"
          />
          <FormField
            label="Confirm Button"
            name="general.confirmButton"
            register={register}
            errors={errors}
            placeholder="Confirm"
          />
          <FormField
            label="Delete Button"
            name="general.deleteButton"
            register={register}
            errors={errors}
            placeholder="Delete"
          />
          <FormField
            label="Edit Button"
            name="general.editButton"
            register={register}
            errors={errors}
            placeholder="Edit"
          />
          <FormField
            label="Home Label"
            name="general.homeLabel"
            register={register}
            errors={errors}
            placeholder="Home"
          />
        </Box>
      </SectionCard>

      <SectionCard
        id="content-homepage"
        title="Homepage Sections"
        description="Text for homepage section headings"
        keywords={["homepage", "sections", "titles"]}
        icon="🏠"
      >
        <Box display="grid" __gridTemplateColumns="1fr 1fr" gap={4}>
          <FormField
            label="New Arrivals Title"
            name="homepage.newArrivalsTitle"
            register={register}
            errors={errors}
            placeholder="New Arrivals"
          />
          <FormField
            label="New Arrivals Subtitle"
            name="homepage.newArrivalsSubtitle"
            register={register}
            errors={errors}
            placeholder="Check out what's new"
          />
          <FormField
            label="Best Sellers Title"
            name="homepage.bestSellersTitle"
            register={register}
            errors={errors}
            placeholder="Best Sellers"
          />
          <FormField
            label="Best Sellers Subtitle"
            name="homepage.bestSellersSubtitle"
            register={register}
            errors={errors}
            placeholder="Our most popular products"
          />
          <FormField
            label="On Sale Title"
            name="homepage.onSaleTitle"
            register={register}
            errors={errors}
            placeholder="On Sale"
          />
          <FormField
            label="On Sale Subtitle"
            name="homepage.onSaleSubtitle"
            register={register}
            errors={errors}
            placeholder="Don't miss these deals"
          />
          <FormField
            label="Featured Title"
            name="homepage.featuredTitle"
            register={register}
            errors={errors}
            placeholder="Featured Products"
          />
          <FormField
            label="Featured Subtitle"
            name="homepage.featuredSubtitle"
            register={register}
            errors={errors}
            placeholder="Hand-picked for you"
          />
          <FormField
            label="Categories Title"
            name="homepage.categoriesTitle"
            register={register}
            errors={errors}
            placeholder="Shop by Category"
          />
          <FormField
            label="Categories Subtitle"
            name="homepage.categoriesSubtitle"
            register={register}
            errors={errors}
            placeholder="Browse our collections"
          />
          <FormField
            label="View All Categories Button"
            name="homepage.viewAllCategoriesButton"
            register={register}
            errors={errors}
            placeholder="View All Categories"
            description="Text for the button beneath the category grid"
          />
          <FormField
            label="Brands Title"
            name="homepage.brandsTitle"
            register={register}
            errors={errors}
            placeholder="Top Brands"
          />
          <FormField
            label="Brands Subtitle"
            name="homepage.brandsSubtitle"
            register={register}
            errors={errors}
            placeholder="Shop by brand"
          />
          <FormField
            label="Testimonials Title"
            name="homepage.testimonialsTitle"
            register={register}
            errors={errors}
            placeholder="What Our Customers Say"
          />
          <FormField
            label="Testimonials Subtitle"
            name="homepage.testimonialsSubtitle"
            register={register}
            errors={errors}
            placeholder="Real reviews from real customers"
          />
          <FormField
            label="Average Rating Label"
            name="homepage.averageRatingLabel"
            register={register}
            errors={errors}
            placeholder="Average Rating"
          />
          <FormField
            label="Happy Customers Label"
            name="homepage.happyCustomersLabel"
            register={register}
            errors={errors}
            placeholder="Happy Customers"
          />
          <FormField
            label="Satisfaction Rate Label"
            name="homepage.satisfactionRateLabel"
            register={register}
            errors={errors}
            placeholder="Satisfaction Rate"
          />
          <FormField
            label="Orders Delivered Label"
            name="homepage.ordersDeliveredLabel"
            register={register}
            errors={errors}
            placeholder="Orders Delivered"
          />
          <FormField
            label="Verified Purchase Label"
            name="homepage.verifiedPurchaseLabel"
            register={register}
            errors={errors}
            placeholder="Verified Purchase"
          />
          <FormField
            label="Loading Reviews Text"
            name="homepage.loadingReviewsText"
            register={register}
            errors={errors}
            placeholder="Loading reviews..."
          />
          <FormField
            label="No Reviews Available Text"
            name="homepage.noReviewsAvailableText"
            register={register}
            errors={errors}
            placeholder="No reviews available yet. Be the first to review our products!"
          />
          <FormField
            label="No Reviews Subtext"
            name="homepage.noReviewsSubtext"
            register={register}
            errors={errors}
            placeholder="Reviews will appear here once customers start leaving feedback."
          />
          <FormField
            label="No Approved Reviews Text"
            name="homepage.noApprovedReviewsText"
            register={register}
            errors={errors}
            placeholder="No approved reviews with 4+ stars yet. {count} review(s) pending approval."
          />
          <FormField
            label="Hero CTA Text"
            name="homepage.heroCtaText"
            register={register}
            errors={errors}
            placeholder="Shop Now"
          />
          <FormField
            label="Hero Secondary CTA"
            name="homepage.heroSecondaryCtaText"
            register={register}
            errors={errors}
            placeholder="Learn More"
          />
          <FormField
            label="Watch Video Button"
            name="homepage.watchVideoButton"
            register={register}
            errors={errors}
            placeholder="Watch Video"
            description="Text for the watch video button in hero video section"
          />
          <FormField
            label="Shop Collection Button"
            name="homepage.shopNowButton"
            register={register}
            errors={errors}
            placeholder="Shop Collection"
            description="Text shown on category cards"
          />
          <FormField
            label="Explore Text"
            name="homepage.exploreText"
            register={register}
            errors={errors}
            placeholder="Explore"
            description="Text shown on category cards"
          />
          <FormField
            label="Product Count Text"
            name="homepage.productCountText"
            register={register}
            errors={errors}
            placeholder="Products"
          />
          <FormField
            label="Newsletter Email Placeholder"
            name="homepage.newsletterEmailPlaceholder"
            register={register}
            errors={errors}
            placeholder="Enter your email"
          />
        </Box>
      </SectionCard>

      <SectionCard
        id="content-footer"
        title="Footer"
        description="Footer text and legal links"
        keywords={["footer", "links", "legal"]}
      >
        <Text marginBottom={3}>Legal Links</Text>
        <Box display="grid" __gridTemplateColumns="1fr 1fr 1fr 1fr" gap={4} marginBottom={6}>
          <FormField
            label="Privacy Policy Link"
            name="footer.privacyPolicyLink"
            register={register}
            errors={errors}
            placeholder="Privacy Policy"
          />
          <FormField
            label="Terms of Service Link"
            name="footer.termsOfServiceLink"
            register={register}
            errors={errors}
            placeholder="Terms of Service"
          />
          <FormField
            label="Shipping Link"
            name="footer.shippingLink"
            register={register}
            errors={errors}
            placeholder="Shipping"
          />
          <FormField
            label="Return Policy Link"
            name="footer.returnPolicyLink"
            register={register}
            errors={errors}
            placeholder="Return Policy"
          />
        </Box>

        <Text marginBottom={3}>Footer Text</Text>
        <Box display="grid" __gridTemplateColumns="1fr 1fr 1fr" gap={4} marginBottom={6}>
          <FormField
            label="All Rights Reserved"
            name="footer.allRightsReserved"
            register={register}
            errors={errors}
            placeholder="All rights reserved"
          />
          <FormField
            label="Contact Us"
            name="footer.contactUs"
            register={register}
            errors={errors}
            placeholder="Contact Us"
          />
          <FormField
            label="Customer Service"
            name="footer.customerService"
            register={register}
            errors={errors}
            placeholder="Customer Service"
          />
        </Box>

        <Text marginBottom={3}>Section Titles</Text>
        <Box display="grid" __gridTemplateColumns="1fr 1fr 1fr 1fr" gap={4}>
          <FormField
            label="Shop Title"
            name="footer.shopTitle"
            register={register}
            errors={errors}
            placeholder="Shop"
          />
          <FormField
            label="Company Title"
            name="footer.companyTitle"
            register={register}
            errors={errors}
            placeholder="Company"
          />
          <FormField
            label="Support Title"
            name="footer.supportTitle"
            register={register}
            errors={errors}
            placeholder="Support"
          />
          <FormField
            label="Follow Us Title"
            name="footer.followUsTitle"
            register={register}
            errors={errors}
            placeholder="Follow Us"
          />
          <FormField
            label="Track Order Link"
            name="footer.trackOrderLink"
            register={register}
            errors={errors}
            placeholder="Track Order"
          />
        </Box>
      </SectionCard>

      <SectionCard
        id="content-navbar"
        title="Navbar"
        description="Navigation bar text"
        keywords={["navbar", "menu", "navigation"]}
        icon="🧭"
      >
        <Box display="grid" __gridTemplateColumns="1fr 1fr 1fr" gap={4}>
          <FormField
            label="Select Channel"
            name="navbar.selectChannel"
            register={register}
            errors={errors}
            placeholder="Select channel/currency"
          />
          <FormField
            label="Search Placeholder"
            name="navbar.searchPlaceholder"
            register={register}
            errors={errors}
            placeholder="Search..."
            description="Placeholder for the navbar search input"
          />
          <FormField
            label="Search Clear Aria Label"
            name="navbar.searchClearAriaLabel"
            register={register}
            errors={errors}
            placeholder="Clear search"
            description="Accessibility label for the navbar search clear button"
          />
          <FormField
            label="Search Input Aria Label"
            name="navbar.searchInputAriaLabel"
            register={register}
            errors={errors}
            placeholder="Search products"
            description="Accessibility label for the navbar search input"
          />
          <FormField
            label="View All Results For"
            name="navbar.viewAllResultsFor"
            register={register}
            errors={errors}
            placeholder="View all results for"
          />
          <FormField
            label="Recently Searched Label"
            name="navbar.recentlySearchedLabel"
            register={register}
            errors={errors}
            placeholder="Recent Searches"
          />
          <FormField
            label="Recent Searches Clear Label"
            name="navbar.recentSearchesClearLabel"
            register={register}
            errors={errors}
            placeholder="Clear"
          />
          <FormField
            label="Cart Label"
            name="navbar.cartLabel"
            register={register}
            errors={errors}
            placeholder="Cart"
          />
          <FormField
            label="Account Label"
            name="navbar.accountLabel"
            register={register}
            errors={errors}
            placeholder="Account"
          />
          <FormField
            label="Menu Label"
            name="navbar.menuLabel"
            register={register}
            errors={errors}
            placeholder="Menu"
          />
          <FormField
            label="Home Label"
            name="navbar.homeLabel"
            register={register}
            errors={errors}
            placeholder="Home"
          />
          <FormField
            label="Shop Label"
            name="navbar.shopLabel"
            register={register}
            errors={errors}
            placeholder="Shop"
          />
          <FormField
            label="Sign In Text"
            name="navbar.signInText"
            register={register}
            errors={errors}
            placeholder="Sign In"
            description="Text for the sign in button in navbar"
          />
          <FormField
            label="Shop All Button"
            name="navbar.shopAllButton"
            register={register}
            errors={errors}
            placeholder="Shop All"
            description="Text for the Shop All dropdown button"
          />
          <FormField
            label="Sale Button"
            name="navbar.saleButton"
            register={register}
            errors={errors}
            placeholder="Sale"
            description="Text for the Sale button"
          />
          <FormField
            label="Collections Label"
            name="navbar.collectionsLabel"
            register={register}
            errors={errors}
            placeholder="Collections"
            description="Label for Collections section in dropdown"
          />
          <FormField
            label="Brands Label"
            name="navbar.brandsLabel"
            register={register}
            errors={errors}
            placeholder="Brands"
            description="Label for Brands section in dropdown"
          />
          <FormField
            label="Categories Label"
            name="navbar.categoriesLabel"
            register={register}
            errors={errors}
            placeholder="Categories"
            description="Label for Categories section in dropdown"
          />
          <FormField
            label="View All Products"
            name="navbar.viewAllProducts"
            register={register}
            errors={errors}
            placeholder="View All Products"
            description="Text for View All Products link in dropdown"
          />
          <SelectField
            label="Subcategories Side"
            name="navbar.subcategoriesSide"
            register={register}
            options={[
              { value: "auto", label: "Auto (based on RTL/LTR)" },
              { value: "left", label: "Left" },
              { value: "right", label: "Right" },
            ]}
            description="Which side subcategories dropdown appears on"
          />
          <SelectField
            label="Mobile Nav Position"
            name="navbar.mobileNavPosition"
            register={register}
            options={[
              { value: "right", label: "Right" },
              { value: "left", label: "Left" },
            ]}
            description="Which side of the screen the mobile menu drawer opens from"
          />
          <SelectField
            label="Dropdown Arrow Direction (when collapsed)"
            name="navbar.dropdownArrowDirection"
            register={register}
            options={[
              { value: "auto", label: "Auto (based on RTL/LTR)" },
              { value: "up", label: "Point up" },
              { value: "down", label: "Point down" },
              { value: "left", label: "Point left" },
              { value: "right", label: "Point right" },
            ]}
            description="Which way arrows point when the dropdown/section is closed"
          />
          <SelectField
            label="Dropdown Arrow Direction (when expanded)"
            name="navbar.dropdownArrowDirectionExpanded"
            register={register}
            options={[
              { value: "auto", label: "Auto (down when expanded)" },
              { value: "up", label: "Point up" },
              { value: "down", label: "Point down" },
              { value: "left", label: "Point left" },
              { value: "right", label: "Point right" },
            ]}
            description="Which way arrows point when the dropdown/section is open"
          />
        </Box>
      </SectionCard>

      <SectionCard
        id="content-error"
        title="Error Page"
        description="Error page text shown when something goes wrong"
        keywords={["error", "empty state"]}
      >
        <Box display="grid" __gridTemplateColumns="1fr 1fr" gap={4}>
          <FormField
            label="Title"
            name="error.title"
            register={register}
            errors={errors}
            placeholder="Something went wrong"
          />
          <FormField
            label="Description"
            name="error.description"
            register={register}
            errors={errors}
            placeholder="We're sorry, but something unexpected happened. Please try again or contact support if the problem persists."
          />
          <FormField
            label="Error Details Label"
            name="error.errorDetails"
            register={register}
            errors={errors}
            placeholder="Error details"
          />
          <FormField
            label="Try Again Button"
            name="error.tryAgainButton"
            register={register}
            errors={errors}
            placeholder="Try Again"
          />
          <FormField
            label="Back to Home Button"
            name="error.backToHomeButton"
            register={register}
            errors={errors}
            placeholder="Back to Home"
          />
          <FormField
            label="Need Help Text"
            name="error.needHelpText"
            register={register}
            errors={errors}
            placeholder="Need help?"
          />
          <FormField
            label="Contact Support Link"
            name="error.contactSupportLink"
            register={register}
            errors={errors}
            placeholder="Contact our support team"
          />
        </Box>
      </SectionCard>

      <SectionCard
        id="content-404"
        title="404 Not Found Page"
        description="404 page text shown when a page is not found"
        keywords={["404", "not found"]}
        icon="🔍"
      >
        <Box display="grid" __gridTemplateColumns="1fr 1fr" gap={4}>
          <FormField
            label="Title"
            name="notFound.title"
            register={register}
            errors={errors}
            placeholder="Page Not Found"
          />
          <FormField
            label="Description"
            name="notFound.description"
            register={register}
            errors={errors}
            placeholder="Sorry, we couldn't find the page you're looking for. It might have been moved or doesn't exist."
          />
          <FormField
            label="Back to Home Button"
            name="notFound.backToHomeButton"
            register={register}
            errors={errors}
            placeholder="Back to Home"
          />
          <FormField
            label="Browse Products Button"
            name="notFound.browseProductsButton"
            register={register}
            errors={errors}
            placeholder="Browse Products"
          />
          <FormField
            label="Helpful Links Text"
            name="notFound.helpfulLinksText"
            register={register}
            errors={errors}
            placeholder="Or check out these pages:"
          />
        </Box>
      </SectionCard>

    </>
  );
}

