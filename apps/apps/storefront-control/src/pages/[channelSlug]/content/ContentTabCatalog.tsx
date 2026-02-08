import { Box, Text } from "@saleor/macaw-ui";
import { SectionCard } from "@/modules/ui/section-card";
import { FormField } from "@/modules/ui/form-field";
import type { ContentTabProps } from "./types";

export function ContentTabCatalog({ register, errors, control }: ContentTabProps) {
  return (
    <>
      <SectionCard
        id="content-filters"
        title="Filters & Product List"
        description="Text for filters, sorting, and product list pages"
        keywords={["filters", "sorting", "search"]}
        icon="🔍"
      >
        <Text marginBottom={3}>Section Titles</Text>
        <Box display="grid" __gridTemplateColumns="1fr 1fr 1fr" gap={4} marginBottom={6}>
          <FormField
            label="Filters Title"
            name="filters.sectionTitle"
            register={register}
            errors={errors}
            placeholder="Filters"
          />
          <FormField
            label="Clear All Button"
            name="filters.clearAllButton"
            register={register}
            errors={errors}
            placeholder="Clear All Filters"
          />
          <FormField
            label="Show Results Button"
            name="filters.showResultsButton"
            register={register}
            errors={errors}
            placeholder="Show Results"
          />
        </Box>

        <Text marginBottom={3}>Filter Headings</Text>
        <Box display="grid" __gridTemplateColumns="1fr 1fr 1fr 1fr" gap={4} marginBottom={6}>
          <FormField
            label="Category"
            name="filters.categoryTitle"
            register={register}
            errors={errors}
            placeholder="Category"
          />
          <FormField
            label="Collection"
            name="filters.collectionTitle"
            register={register}
            errors={errors}
            placeholder="Collection"
          />
          <FormField
            label="Brand"
            name="filters.brandTitle"
            register={register}
            errors={errors}
            placeholder="Brand"
          />
          <FormField
            label="Size"
            name="filters.sizeTitle"
            register={register}
            errors={errors}
            placeholder="Size"
          />
          <FormField
            label="Color"
            name="filters.colorTitle"
            register={register}
            errors={errors}
            placeholder="Color"
          />
          <FormField
            label="Price"
            name="filters.priceTitle"
            register={register}
            errors={errors}
            placeholder="Price"
          />
          <FormField
            label="Rating"
            name="filters.ratingTitle"
            register={register}
            errors={errors}
            placeholder="Rating"
          />
          <FormField
            label="Availability"
            name="filters.availabilityTitle"
            register={register}
            errors={errors}
            placeholder="Availability"
          />
        </Box>

        <Text marginBottom={3}>Availability Options</Text>
        <Box display="grid" __gridTemplateColumns="1fr 1fr" gap={4} marginBottom={6}>
          <FormField
            label="In Stock Only"
            name="filters.inStockOnly"
            register={register}
            errors={errors}
            placeholder="In Stock Only"
          />
          <FormField
            label="On Sale"
            name="filters.onSale"
            register={register}
            errors={errors}
            placeholder="On Sale"
          />
        </Box>

        <Text marginBottom={3}>Active Filters Labels</Text>
        <Box display="grid" __gridTemplateColumns="1fr 1fr 1fr" gap={4} marginBottom={6}>
          <FormField
            label="Active Filters Label"
            name="filters.activeFiltersLabel"
            register={register}
            errors={errors}
            placeholder="Active Filters:"
          />
          <FormField
            label="Category (singular)"
            name="filters.categorySingular"
            register={register}
            errors={errors}
            placeholder="category"
          />
          <FormField
            label="Categories (plural)"
            name="filters.categoryPlural"
            register={register}
            errors={errors}
            placeholder="categories"
          />
          <FormField
            label="Collection (singular)"
            name="filters.collectionSingular"
            register={register}
            errors={errors}
            placeholder="collection"
          />
          <FormField
            label="Collections (plural)"
            name="filters.collectionPlural"
            register={register}
            errors={errors}
            placeholder="collections"
          />
          <FormField
            label="Brand (singular)"
            name="filters.brandSingular"
            register={register}
            errors={errors}
            placeholder="brand"
          />
          <FormField
            label="Brands (plural)"
            name="filters.brandPlural"
            register={register}
            errors={errors}
            placeholder="brands"
          />
          <FormField
            label="Color (singular)"
            name="filters.colorSingular"
            register={register}
            errors={errors}
            placeholder="color"
          />
          <FormField
            label="Colors (plural)"
            name="filters.colorPlural"
            register={register}
            errors={errors}
            placeholder="colors"
          />
          <FormField
            label="Size (singular)"
            name="filters.sizeSingular"
            register={register}
            errors={errors}
            placeholder="size"
          />
          <FormField
            label="Sizes (plural)"
            name="filters.sizePlural"
            register={register}
            errors={errors}
            placeholder="sizes"
          />
        </Box>

        <Text marginBottom={3}>Sort Options</Text>
        <Box display="grid" __gridTemplateColumns="1fr 1fr 1fr" gap={4} marginBottom={6}>
          <FormField
            label="A to Z"
            name="filters.sortAtoZ"
            register={register}
            errors={errors}
            placeholder="A to Z"
          />
          <FormField
            label="Z to A"
            name="filters.sortZtoA"
            register={register}
            errors={errors}
            placeholder="Z to A"
          />
          <FormField
            label="Price: Low to High"
            name="filters.sortPriceLowHigh"
            register={register}
            errors={errors}
            placeholder="Price: Low to High"
          />
          <FormField
            label="Price: High to Low"
            name="filters.sortPriceHighLow"
            register={register}
            errors={errors}
            placeholder="Price: High to Low"
          />
          <FormField
            label="Newest"
            name="filters.sortNewest"
            register={register}
            errors={errors}
            placeholder="Newest"
          />
          <FormField
            label="Sale"
            name="filters.sortSale"
            register={register}
            errors={errors}
            placeholder="Sale"
          />
        </Box>

        <Text marginBottom={3}>Empty & Loading States</Text>
        <Box display="grid" __gridTemplateColumns="1fr 1fr" gap={4} marginBottom={6}>
          <FormField
            label="No Products Title"
            name="filters.noProductsTitle"
            register={register}
            errors={errors}
            placeholder="No products found"
          />
          <FormField
            label="No Products (with filters)"
            name="filters.noProductsWithFilters"
            register={register}
            errors={errors}
            placeholder="Try adjusting your filters"
          />
          <FormField
            label="No Products (empty)"
            name="filters.noProductsEmpty"
            register={register}
            errors={errors}
            placeholder="Check back later for new products"
          />
          <FormField
            label="Filtering Products"
            name="filters.filteringProducts"
            register={register}
            errors={errors}
            placeholder="Filtering products..."
          />
          <FormField
            label="Loading More"
            name="filters.loadingMore"
            register={register}
            errors={errors}
            placeholder="Loading more products..."
          />
          <FormField
            label="Seen All Products"
            name="filters.seenAllProducts"
            register={register}
            errors={errors}
            placeholder="You've seen all {count} products"
          />
          <FormField
            label="Try Adjusting Filters"
            name="filters.tryAdjustingFilters"
            register={register}
            errors={errors}
            placeholder="Try adjusting your filters to see more"
          />
        </Box>

        <Text marginBottom={3}>Search & Results</Text>
        <Box display="grid" __gridTemplateColumns="1fr 1fr 1fr" gap={4} marginBottom={6}>
          <FormField
            label="Search Placeholder"
            name="filters.searchPlaceholder"
            register={register}
            errors={errors}
            placeholder="Search Products"
            description="Placeholder text for the products page search bar and nav search"
          />
          <FormField
            label="Search Clear Aria Label"
            name="filters.searchClearAriaLabel"
            register={register}
            errors={errors}
            placeholder="Clear search"
            description="Accessibility label for the clear-search button"
          />
          <FormField
            label="Search Input Aria Label"
            name="filters.searchInputAriaLabel"
            register={register}
            errors={errors}
            placeholder="Search products"
            description="Accessibility label for the search input"
          />
          <FormField
            label="Search Products Title"
            name="filters.searchProductsTitle"
            register={register}
            errors={errors}
            placeholder="Search Products"
          />
          <FormField
            label="Search Results Title"
            name="filters.searchResultsTitle"
            register={register}
            errors={errors}
            placeholder="Search Results"
          />
          <FormField
            label="Results Count Text"
            name="filters.resultsCountText"
            register={register}
            errors={errors}
            placeholder="Found {count} result(s)"
          />
          <FormField
            label="No Results Message"
            name="filters.noResultsMessage"
            register={register}
            errors={errors}
            placeholder='No results found for "{query}"'
          />
          <FormField
            label="Sort By Label"
            name="filters.sortByLabel"
            register={register}
            errors={errors}
            placeholder="Sort by:"
          />
          <FormField
            label="Filters Button Text"
            name="filters.filtersButtonText"
            register={register}
            errors={errors}
            placeholder="Filters"
          />
          <FormField
            label="Search For Text"
            name="filters.searchForText"
            register={register}
            errors={errors}
            placeholder="for"
            description="Text between count and search query (e.g., '10 for shoes')"
          />
          <FormField
            label="Results Text"
            name="filters.resultsText"
            register={register}
            errors={errors}
            placeholder="results"
          />
          <FormField
            label="Items Available"
            name="filters.itemsAvailable"
            register={register}
            errors={errors}
            placeholder="items available"
          />
          <FormField
            label="Products Page Title"
            name="filters.productsPageTitle"
            register={register}
            errors={errors}
            placeholder="All Products"
          />
        </Box>

        <Text marginBottom={3}>Quick Filters</Text>
        <Box display="grid" __gridTemplateColumns="1fr 1fr 1fr 1fr" gap={4} marginBottom={6}>
          <FormField
            label="Shop All Button"
            name="filters.shopAllButton"
            register={register}
            errors={errors}
            placeholder="Shop All"
          />
          <FormField
            label="Quick Add Button"
            name="filters.quickAddButton"
            register={register}
            errors={errors}
            placeholder="Quick Add"
          />
          <FormField
            label="Scroll Left (aria)"
            name="filters.scrollLeftAriaLabel"
            register={register}
            errors={errors}
            placeholder="Scroll left"
          />
          <FormField
            label="Scroll Right (aria)"
            name="filters.scrollRightAriaLabel"
            register={register}
            errors={errors}
            placeholder="Scroll right"
          />
        </Box>

        <Text marginBottom={3}>Rating Filter</Text>
        <Box display="grid" __gridTemplateColumns="1fr 1fr 1fr 1fr" gap={4} marginBottom={6}>
          <FormField
            label="Minimum Rating"
            name="filters.minimumRating"
            register={register}
            errors={errors}
            placeholder="Minimum Rating"
          />
          <FormField
            label="Stars & Up"
            name="filters.starsAndUp"
            register={register}
            errors={errors}
            placeholder="{count} stars & up"
          />
          <FormField
            label="Star & Up (singular)"
            name="filters.starAndUp"
            register={register}
            errors={errors}
            placeholder="1 star & up"
          />
          <FormField
            label="Clear Rating Filter"
            name="filters.clearRatingFilter"
            register={register}
            errors={errors}
            placeholder="Clear"
          />
        </Box>

        <Text marginBottom={3}>Price Filter</Text>
        <Box display="grid" __gridTemplateColumns="1fr 1fr 1fr 1fr" gap={4} marginBottom={6}>
          <FormField
            label="Min Price Label"
            name="filters.minPriceLabel"
            register={register}
            errors={errors}
            placeholder="Min Price"
          />
          <FormField
            label="Max Price Label"
            name="filters.maxPriceLabel"
            register={register}
            errors={errors}
            placeholder="Max Price"
          />
          <FormField
            label="Quick Min Label"
            name="filters.quickMinLabel"
            register={register}
            errors={errors}
            placeholder="Quick Min"
          />
          <FormField
            label="Quick Max Label"
            name="filters.quickMaxLabel"
            register={register}
            errors={errors}
            placeholder="Quick Max"
          />
          <FormField
            label="Clear Price Filter"
            name="filters.clearPriceFilter"
            register={register}
            errors={errors}
            placeholder="Clear"
          />
          <FormField
            label="Discover Products"
            name="filters.discoverProducts"
            register={register}
            errors={errors}
            placeholder="Discover Products"
          />
          <FormField
            label="Check Out Our Products"
            name="filters.checkOutOurProducts"
            register={register}
            errors={errors}
            placeholder="Check Out Our Products"
          />
        </Box>
      </SectionCard>

      <SectionCard
        id="content-product-detail"
        title="Product Detail Page"
        description="Trust badges, tabs, and review form text"
        keywords={["product detail", "reviews", "tabs"]}
      >
        <Text marginBottom={3}>Trust Badges</Text>
        <Box display="grid" __gridTemplateColumns="1fr 1fr 1fr" gap={4} marginBottom={6}>
          <FormField
            label="Free Shipping"
            name="productDetail.freeShipping"
            register={register}
            errors={errors}
            placeholder="Free Shipping"
          />
          <FormField
            label="Secure Payment"
            name="productDetail.securePayment"
            register={register}
            errors={errors}
            placeholder="Secure Payment"
          />
          <FormField
            label="Easy Returns"
            name="productDetail.easyReturns"
            register={register}
            errors={errors}
            placeholder="Easy Returns"
          />
        </Box>

        <Text marginBottom={3}>Tab Labels</Text>
        <Box display="grid" __gridTemplateColumns="1fr 1fr 1fr 1fr" gap={4} marginBottom={6}>
          <FormField
            label="Description Tab"
            name="productDetail.descriptionTab"
            register={register}
            errors={errors}
            placeholder="Description"
          />
          <FormField
            label="Shipping Tab"
            name="productDetail.shippingTab"
            register={register}
            errors={errors}
            placeholder="Shipping"
          />
          <FormField
            label="Reviews Tab"
            name="productDetail.reviewsTab"
            register={register}
            errors={errors}
            placeholder="Reviews"
          />
          <FormField
            label="No Description Available"
            name="productDetail.noDescriptionAvailable"
            register={register}
            errors={errors}
            placeholder="No description available for this product."
          />
          <FormField
            label="Qty Label"
            name="productDetail.qtyLabel"
            register={register}
            errors={errors}
            placeholder="Qty"
          />
          <FormField
            label="Qty Label With Colon"
            name="productDetail.qtyLabelWithColon"
            register={register}
            errors={errors}
            placeholder="Qty:"
          />
          <FormField
            label="Share Button"
            name="productDetail.shareButton"
            register={register}
            errors={errors}
            placeholder="Share"
          />
        </Box>

        <Text marginBottom={3}>Variant Selection</Text>
        <Box display="grid" __gridTemplateColumns="1fr 1fr" gap={4} marginBottom={6}>
          <FormField
            label="Color Label"
            name="productDetail.colorLabel"
            register={register}
            errors={errors}
            placeholder="Color"
          />
          <FormField
            label="Size Label"
            name="productDetail.sizeLabel"
            register={register}
            errors={errors}
            placeholder="Size"
          />
          <FormField
            label="Select Option Label"
            name="productDetail.selectOptionLabel"
            register={register}
            errors={errors}
            placeholder="Select Option"
          />
          <FormField
            label="Please Select Size"
            name="productDetail.pleaseSelectSize"
            register={register}
            errors={errors}
            placeholder="Please select a size"
          />
          <FormField
            label="Please Select Option"
            name="productDetail.pleaseSelectOption"
            register={register}
            errors={errors}
            placeholder="Please select an option"
          />
        </Box>

        <Text marginBottom={3}>Stock Messages</Text>
        <Box display="grid" __gridTemplateColumns="1fr 1fr" gap={4} marginBottom={6}>
          <FormField
            label="Only X Left"
            name="productDetail.onlyXLeft"
            register={register}
            errors={errors}
            placeholder="Only {count} left!"
          />
          <FormField
            label="In Stock With Count"
            name="productDetail.inStockWithCount"
            register={register}
            errors={errors}
            placeholder="In Stock ({count} available)"
          />
          <FormField
            label="Selling Fast"
            name="productDetail.sellingFast"
            register={register}
            errors={errors}
            placeholder="Selling fast!"
          />
          <FormField
            label="Save Percent"
            name="productDetail.savePercent"
            register={register}
            errors={errors}
            placeholder="Save {percent}%"
          />
        </Box>

        <Text marginBottom={3}>Review Pluralization</Text>
        <Box display="grid" __gridTemplateColumns="1fr 1fr" gap={4} marginBottom={6}>
          <FormField
            label="Review Singular"
            name="productDetail.reviewSingular"
            register={register}
            errors={errors}
            placeholder="review"
          />
          <FormField
            label="Review Plural"
            name="productDetail.reviewPlural"
            register={register}
            errors={errors}
            placeholder="reviews"
          />
        </Box>

        <Text marginBottom={3}>Image Gallery Labels</Text>
        <Box display="grid" __gridTemplateColumns="1fr 1fr" gap={4} marginBottom={6}>
          <FormField
            label="Zoom In Label"
            name="productDetail.zoomInLabel"
            register={register}
            errors={errors}
            placeholder="Zoom in"
          />
          <FormField
            label="Zoom Out Label"
            name="productDetail.zoomOutLabel"
            register={register}
            errors={errors}
            placeholder="Zoom out"
          />
          <FormField
            label="Previous Image Label"
            name="productDetail.previousImageLabel"
            register={register}
            errors={errors}
            placeholder="Previous image"
          />
          <FormField
            label="Next Image Label"
            name="productDetail.nextImageLabel"
            register={register}
            errors={errors}
            placeholder="Next image"
          />
        </Box>

        <Text marginBottom={3}>Review Form</Text>
        <Box display="grid" __gridTemplateColumns="1fr 1fr" gap={4} marginBottom={6}>
          <FormField
            label="No Reviews Yet"
            name="productDetail.noReviewsYet"
            register={register}
            errors={errors}
            placeholder="No reviews yet. Be the first!"
          />
          <FormField
            label="Write Review Title"
            name="productDetail.writeReviewTitle"
            register={register}
            errors={errors}
            placeholder="Write a Review"
          />
          <FormField
            label="Rating Required"
            name="productDetail.ratingRequired"
            register={register}
            errors={errors}
            placeholder="Rating *"
          />
          <FormField
            label="Review Title Required"
            name="productDetail.reviewTitleRequired"
            register={register}
            errors={errors}
            placeholder="Review Title *"
          />
          <FormField
            label="Review Title Placeholder"
            name="productDetail.reviewTitlePlaceholder"
            register={register}
            errors={errors}
            placeholder="Summarize your review"
          />
          <FormField
            label="Review Required"
            name="productDetail.reviewRequired"
            register={register}
            errors={errors}
            placeholder="Review *"
          />
          <FormField
            label="Review Placeholder"
            name="productDetail.reviewPlaceholder"
            register={register}
            errors={errors}
            placeholder="Share your experience..."
          />
          <FormField
            label="Character Count"
            name="productDetail.characterCount"
            register={register}
            errors={errors}
            placeholder="{count} / 2000 characters"
          />
          <FormField
            label="Images Optional"
            name="productDetail.imagesOptional"
            register={register}
            errors={errors}
            placeholder="Images (Optional)"
          />
          <FormField
            label="Upload Images Hint"
            name="productDetail.uploadImagesHint"
            register={register}
            errors={errors}
            placeholder="Upload up to 5 images"
          />
          <FormField
            label="Submit Review Button"
            name="productDetail.submitReviewButton"
            register={register}
            errors={errors}
            placeholder="Submit Review"
          />
          <FormField
            label="Helpful Button"
            name="productDetail.helpfulButton"
            register={register}
            errors={errors}
            placeholder="Helpful"
          />
          <FormField
            label="Verified Purchase"
            name="productDetail.verifiedPurchase"
            register={register}
            errors={errors}
            placeholder="Verified Purchase"
          />
          <FormField
            label="Helpful Button With Count"
            name="productDetail.helpfulButtonWithCount"
            register={register}
            errors={errors}
            placeholder="Helpful ({count})"
          />
        </Box>

        <Text marginBottom={3}>Review Filters</Text>
        <Box display="grid" __gridTemplateColumns="1fr 1fr" gap={4} marginBottom={6}>
          <FormField
            label="All Ratings"
            name="productDetail.allRatings"
            register={register}
            errors={errors}
            placeholder="All Ratings"
          />
          <FormField
            label="Verified Only"
            name="productDetail.verifiedOnly"
            register={register}
            errors={errors}
            placeholder="Verified Only"
          />
        </Box>

        <Text marginBottom={3}>Review Delete Modal</Text>
        <Box display="grid" __gridTemplateColumns="1fr 1fr" gap={4} marginBottom={6}>
          <FormField
            label="Delete Review Title"
            name="productDetail.deleteReviewTitle"
            register={register}
            errors={errors}
            placeholder="Delete Review"
          />
          <FormField
            label="Delete Review Message"
            name="productDetail.deleteReviewMessage"
            register={register}
            errors={errors}
            placeholder="Are you sure you want to delete this review? This action cannot be undone."
          />
          <FormField
            label="Cancel Button"
            name="productDetail.cancelButton"
            register={register}
            errors={errors}
            placeholder="Cancel"
          />
          <FormField
            label="Deleting Button"
            name="productDetail.deletingButton"
            register={register}
            errors={errors}
            placeholder="Deleting..."
          />
        </Box>

        <Text marginBottom={3}>Review Time Formatting</Text>
        <Box display="grid" __gridTemplateColumns="1fr 1fr" gap={4} marginBottom={6}>
          <FormField
            label="Just Now"
            name="productDetail.justNow"
            register={register}
            errors={errors}
            placeholder="just now"
          />
          <FormField
            label="Minutes Ago"
            name="productDetail.minutesAgo"
            register={register}
            errors={errors}
            placeholder="{count} minutes ago"
          />
          <FormField
            label="Hours Ago"
            name="productDetail.hoursAgo"
            register={register}
            errors={errors}
            placeholder="{count} hours ago"
          />
          <FormField
            label="Days Ago"
            name="productDetail.daysAgo"
            register={register}
            errors={errors}
            placeholder="{count} days ago"
          />
        </Box>

        <Text marginBottom={3}>Shipping Information</Text>
        <Box display="grid" __gridTemplateColumns="1fr 1fr" gap={4} marginBottom={6}>
          <FormField
            label="Free Standard Shipping Title"
            name="productDetail.freeStandardShippingTitle"
            register={register}
            errors={errors}
            placeholder="Free Standard Shipping"
          />
          <FormField
            label="Free Standard Shipping Description"
            name="productDetail.freeStandardShippingDescription"
            register={register}
            errors={errors}
            placeholder="On orders over $75. Delivery in 5-7 business days."
          />
          <FormField
            label="Express Shipping Title"
            name="productDetail.expressShippingTitle"
            register={register}
            errors={errors}
            placeholder="Express Shipping"
          />
          <FormField
            label="Express Shipping Description"
            name="productDetail.expressShippingDescription"
            register={register}
            errors={errors}
            placeholder="{price}. Delivery in 2-3 business days."
          />
        </Box>

        <Text marginBottom={3}>Review List and Loading States</Text>
        <Box display="grid" __gridTemplateColumns="1fr 1fr" gap={4} marginBottom={6}>
          <FormField
            label="Loading Reviews"
            name="productDetail.loadingReviews"
            register={register}
            errors={errors}
            placeholder="Loading reviews..."
          />
          <FormField
            label="No Reviews Match Filters"
            name="productDetail.noReviewsMatchFilters"
            register={register}
            errors={errors}
            placeholder="No reviews match your filters."
          />
          <FormField
            label="Clear Filters"
            name="productDetail.clearFilters"
            register={register}
            errors={errors}
            placeholder="Clear Filters"
          />
          <FormField
            label="Clear Filters (Lowercase)"
            name="productDetail.clearFiltersLowercase"
            register={register}
            errors={errors}
            placeholder="Clear filters"
          />
          <FormField
            label="Try Again"
            name="productDetail.tryAgain"
            register={register}
            errors={errors}
            placeholder="Try again"
          />
          <FormField
            label="Failed To Load Reviews"
            name="productDetail.failedToLoadReviews"
            register={register}
            errors={errors}
            placeholder="Failed to load reviews. Please try again."
          />
          <FormField
            label="Load More Reviews"
            name="productDetail.loadMoreReviews"
            register={register}
            errors={errors}
            placeholder="Load More Reviews"
          />
        </Box>

        <Text marginBottom={3}>Review Form Labels (Edit Form)</Text>
        <Box display="grid" __gridTemplateColumns="1fr 1fr" gap={4} marginBottom={6}>
          <FormField
            label="Rating Label"
            name="productDetail.ratingLabel"
            register={register}
            errors={errors}
            placeholder="Rating"
          />
          <FormField
            label="Title Label"
            name="productDetail.titleLabel"
            register={register}
            errors={errors}
            placeholder="Title"
          />
          <FormField
            label="Review Label"
            name="productDetail.reviewLabel"
            register={register}
            errors={errors}
            placeholder="Review"
          />
        </Box>

        <Text marginBottom={3}>Review Form States and Messages</Text>
        <Box display="grid" __gridTemplateColumns="1fr 1fr" gap={4} marginBottom={6}>
          <FormField
            label="Uploading Images"
            name="productDetail.uploadingImages"
            register={register}
            errors={errors}
            placeholder="Uploading and compressing images..."
          />
          <FormField
            label="Saving Button"
            name="productDetail.savingButton"
            register={register}
            errors={errors}
            placeholder="Saving..."
          />
          <FormField
            label="Save Button"
            name="productDetail.saveButton"
            register={register}
            errors={errors}
            placeholder="Save"
          />
          <FormField
            label="Submitting Button"
            name="productDetail.submittingButton"
            register={register}
            errors={errors}
            placeholder="Submitting..."
          />
          <FormField
            label="Thank You Message"
            name="productDetail.thankYouMessage"
            register={register}
            errors={errors}
            placeholder="Thank you for your review!"
          />
          <FormField
            label="Review Submitted Message"
            name="productDetail.reviewSubmittedMessage"
            register={register}
            errors={errors}
            placeholder="Your review has been submitted and will be visible after moderation."
          />
        </Box>

        <Text marginBottom={3}>Review Form Validation Messages</Text>
        <Box display="grid" __gridTemplateColumns="1fr 1fr" gap={4} marginBottom={6}>
          <FormField
            label="Please Select Rating"
            name="productDetail.pleaseSelectRating"
            register={register}
            errors={errors}
            placeholder="Please select a rating"
          />
          <FormField
            label="Please Enter Review Title"
            name="productDetail.pleaseEnterReviewTitle"
            register={register}
            errors={errors}
            placeholder="Please enter a review title"
          />
          <FormField
            label="Please Enter Review Body"
            name="productDetail.pleaseEnterReviewBody"
            register={register}
            errors={errors}
            placeholder="Please enter a review body"
          />
          <FormField
            label="Max Images Error"
            name="productDetail.maxImagesError"
            register={register}
            errors={errors}
            placeholder="Maximum 5 images allowed per review"
          />
          <FormField
            label="Only X More Images Error"
            name="productDetail.onlyXMoreImagesError"
            register={register}
            errors={errors}
            placeholder="Only {count} more image(s) can be uploaded (max 5 total)"
          />
          <FormField
            label="Failed To Submit Review"
            name="productDetail.failedToSubmitReview"
            register={register}
            errors={errors}
            placeholder="Failed to submit review"
          />
          <FormField
            label="Failed To Submit Review Retry"
            name="productDetail.failedToSubmitReviewRetry"
            register={register}
            errors={errors}
            placeholder="Failed to submit review. Please try again."
          />
          <FormField
            label="Must Be Logged In To Review"
            name="productDetail.mustBeLoggedInToReview"
            register={register}
            errors={errors}
            placeholder="You must be logged in to submit a review. Please log in and try again."
          />
          <FormField
            label="Failed To Update Review"
            name="productDetail.failedToUpdateReview"
            register={register}
            errors={errors}
            placeholder="Failed to update review"
          />
          <FormField
            label="Failed To Delete Review"
            name="productDetail.failedToDeleteReview"
            register={register}
            errors={errors}
            placeholder="Failed to delete review"
          />
          <FormField
            label="Failed To Upload Images"
            name="productDetail.failedToUploadImages"
            register={register}
            errors={errors}
            placeholder="Failed to upload images"
          />
        </Box>
      </SectionCard>

    </>
  );
}

