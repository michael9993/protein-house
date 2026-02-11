import { FormField } from "@/components/forms/FormField";
import { FormSection } from "@/components/forms/FormSection";
import { FieldGroup } from "@/components/shared/FieldGroup";
import type { CatalogFormData, CatalogTabProps } from "./types";

export function CatalogContentTab({ register, errors }: CatalogTabProps) {
  return (
    <>
      {/* ── content.product — Product Card & Quick View Text ──────────── */}
      <FormSection title="Product Card & Quick View" description="Buttons, badges, and quick-view text used on product cards">
        <FieldGroup columns={2}>
          <FormField<CatalogFormData>
            label="Add to Cart Button"
            name="content.product.addToCartButton"
            register={register}
            errors={errors}
            placeholder="Add to Cart"
          />
          <FormField<CatalogFormData>
            label="Buy Now Button"
            name="content.product.buyNowButton"
            register={register}
            errors={errors}
            placeholder="Buy Now"
          />
          <FormField<CatalogFormData>
            label="Out of Stock Text"
            name="content.product.outOfStockText"
            register={register}
            errors={errors}
            placeholder="Out of Stock"
          />
          <FormField<CatalogFormData>
            label="Low Stock Text"
            name="content.product.lowStockText"
            register={register}
            errors={errors}
            placeholder="Only {count} left in stock"
          />
          <FormField<CatalogFormData>
            label="In Stock Text"
            name="content.product.inStockText"
            register={register}
            errors={errors}
            placeholder="In Stock"
          />
          <FormField<CatalogFormData>
            label="Sale Badge Text"
            name="content.product.saleBadgeText"
            register={register}
            errors={errors}
            placeholder="Sale"
          />
          <FormField<CatalogFormData>
            label="New Badge Text"
            name="content.product.newBadgeText"
            register={register}
            errors={errors}
            placeholder="New"
          />
          <FormField<CatalogFormData>
            label="Reviews Title"
            name="content.product.reviewsTitle"
            register={register}
            errors={errors}
            placeholder="Customer Reviews"
          />
          <FormField<CatalogFormData>
            label="Write Review Button"
            name="content.product.writeReviewButton"
            register={register}
            errors={errors}
            placeholder="Write a Review"
          />
          <FormField<CatalogFormData>
            label="No Reviews Text"
            name="content.product.noReviewsText"
            register={register}
            errors={errors}
            placeholder="No reviews yet. Be the first!"
          />
          <FormField<CatalogFormData>
            label="Adding Button"
            name="content.product.addingButton"
            register={register}
            errors={errors}
            placeholder="Adding..."
          />
          <FormField<CatalogFormData>
            label="Added To Cart Button"
            name="content.product.addedToCartButton"
            register={register}
            errors={errors}
            placeholder="Added to Cart!"
          />
          <FormField<CatalogFormData>
            label="Select Options Button"
            name="content.product.selectOptionsButton"
            register={register}
            errors={errors}
            placeholder="Select Options"
          />
          <FormField<CatalogFormData>
            label="View Cart Link"
            name="content.product.viewCartLink"
            register={register}
            errors={errors}
            placeholder="View Cart →"
          />
          <FormField<CatalogFormData>
            label="Quick Add Button"
            name="content.product.quickAddButton"
            register={register}
            errors={errors}
            placeholder="Quick add"
          />
          <FormField<CatalogFormData>
            label="View Full Page Link"
            name="content.product.viewFullPageLink"
            register={register}
            errors={errors}
            placeholder="View full page"
          />
          <FormField<CatalogFormData>
            label="Loading Product (Quick View)"
            name="content.product.loadingProductText"
            register={register}
            errors={errors}
            placeholder="Loading product..."
          />
          <FormField<CatalogFormData>
            label="Product Details (Quick View title)"
            name="content.product.productDetailsTitle"
            register={register}
            errors={errors}
            placeholder="Product Details"
          />
          <FormField<CatalogFormData>
            label="Close Button (Quick View)"
            name="content.product.closeButton"
            register={register}
            errors={errors}
            placeholder="Close"
          />
          <FormField<CatalogFormData>
            label="Product Not Found (Quick View)"
            name="content.product.productNotFoundText"
            register={register}
            errors={errors}
            placeholder="Product not found"
          />
          <FormField<CatalogFormData>
            label="Error Loading Product (Quick View)"
            name="content.product.errorLoadingProductText"
            register={register}
            errors={errors}
            placeholder="Failed to load product"
          />
        </FieldGroup>
      </FormSection>

      {/* ── content.filters — Filters & Product List Text ─────────────── */}
      <FormSection
        title="Filters & Product List"
        description="Text for filters, sorting, and product list pages"
        collapsible
        defaultExpanded={false}
      >
        {/* Section Titles */}
        <p className="text-sm font-medium text-muted-foreground mb-2">Section Titles</p>
        <FieldGroup columns={3}>
          <FormField<CatalogFormData>
            label="Filters Title"
            name="content.filters.sectionTitle"
            register={register}
            errors={errors}
            placeholder="Filters"
          />
          <FormField<CatalogFormData>
            label="Clear All Button"
            name="content.filters.clearAllButton"
            register={register}
            errors={errors}
            placeholder="Clear All Filters"
          />
          <FormField<CatalogFormData>
            label="Show Results Button"
            name="content.filters.showResultsButton"
            register={register}
            errors={errors}
            placeholder="Show Results"
          />
        </FieldGroup>

        {/* Filter Headings */}
        <p className="text-sm font-medium text-muted-foreground mb-2 mt-4">Filter Headings</p>
        <FieldGroup columns={4}>
          <FormField<CatalogFormData>
            label="Category"
            name="content.filters.categoryTitle"
            register={register}
            errors={errors}
            placeholder="Category"
          />
          <FormField<CatalogFormData>
            label="Collection"
            name="content.filters.collectionTitle"
            register={register}
            errors={errors}
            placeholder="Collection"
          />
          <FormField<CatalogFormData>
            label="Brand"
            name="content.filters.brandTitle"
            register={register}
            errors={errors}
            placeholder="Brand"
          />
          <FormField<CatalogFormData>
            label="Size"
            name="content.filters.sizeTitle"
            register={register}
            errors={errors}
            placeholder="Size"
          />
          <FormField<CatalogFormData>
            label="Color"
            name="content.filters.colorTitle"
            register={register}
            errors={errors}
            placeholder="Color"
          />
          <FormField<CatalogFormData>
            label="Price"
            name="content.filters.priceTitle"
            register={register}
            errors={errors}
            placeholder="Price"
          />
          <FormField<CatalogFormData>
            label="Rating"
            name="content.filters.ratingTitle"
            register={register}
            errors={errors}
            placeholder="Rating"
          />
          <FormField<CatalogFormData>
            label="Availability"
            name="content.filters.availabilityTitle"
            register={register}
            errors={errors}
            placeholder="Availability"
          />
        </FieldGroup>

        {/* Availability Options */}
        <p className="text-sm font-medium text-muted-foreground mb-2 mt-4">Availability Options</p>
        <FieldGroup columns={2}>
          <FormField<CatalogFormData>
            label="In Stock Only"
            name="content.filters.inStockOnly"
            register={register}
            errors={errors}
            placeholder="In Stock Only"
          />
          <FormField<CatalogFormData>
            label="On Sale"
            name="content.filters.onSale"
            register={register}
            errors={errors}
            placeholder="On Sale"
          />
        </FieldGroup>

        {/* Active Filters Labels */}
        <p className="text-sm font-medium text-muted-foreground mb-2 mt-4">Active Filters Labels</p>
        <FieldGroup columns={3}>
          <FormField<CatalogFormData>
            label="Active Filters Label"
            name="content.filters.activeFiltersLabel"
            register={register}
            errors={errors}
            placeholder="Active Filters:"
          />
          <FormField<CatalogFormData>
            label="Category (singular)"
            name="content.filters.categorySingular"
            register={register}
            errors={errors}
            placeholder="category"
          />
          <FormField<CatalogFormData>
            label="Categories (plural)"
            name="content.filters.categoryPlural"
            register={register}
            errors={errors}
            placeholder="categories"
          />
          <FormField<CatalogFormData>
            label="Collection (singular)"
            name="content.filters.collectionSingular"
            register={register}
            errors={errors}
            placeholder="collection"
          />
          <FormField<CatalogFormData>
            label="Collections (plural)"
            name="content.filters.collectionPlural"
            register={register}
            errors={errors}
            placeholder="collections"
          />
          <FormField<CatalogFormData>
            label="Brand (singular)"
            name="content.filters.brandSingular"
            register={register}
            errors={errors}
            placeholder="brand"
          />
          <FormField<CatalogFormData>
            label="Brands (plural)"
            name="content.filters.brandPlural"
            register={register}
            errors={errors}
            placeholder="brands"
          />
          <FormField<CatalogFormData>
            label="Color (singular)"
            name="content.filters.colorSingular"
            register={register}
            errors={errors}
            placeholder="color"
          />
          <FormField<CatalogFormData>
            label="Colors (plural)"
            name="content.filters.colorPlural"
            register={register}
            errors={errors}
            placeholder="colors"
          />
          <FormField<CatalogFormData>
            label="Size (singular)"
            name="content.filters.sizeSingular"
            register={register}
            errors={errors}
            placeholder="size"
          />
          <FormField<CatalogFormData>
            label="Sizes (plural)"
            name="content.filters.sizePlural"
            register={register}
            errors={errors}
            placeholder="sizes"
          />
        </FieldGroup>

        {/* Sort Options */}
        <p className="text-sm font-medium text-muted-foreground mb-2 mt-4">Sort Options</p>
        <FieldGroup columns={3}>
          <FormField<CatalogFormData>
            label="A to Z"
            name="content.filters.sortAtoZ"
            register={register}
            errors={errors}
            placeholder="A to Z"
          />
          <FormField<CatalogFormData>
            label="Z to A"
            name="content.filters.sortZtoA"
            register={register}
            errors={errors}
            placeholder="Z to A"
          />
          <FormField<CatalogFormData>
            label="Price: Low to High"
            name="content.filters.sortPriceLowHigh"
            register={register}
            errors={errors}
            placeholder="Price: Low to High"
          />
          <FormField<CatalogFormData>
            label="Price: High to Low"
            name="content.filters.sortPriceHighLow"
            register={register}
            errors={errors}
            placeholder="Price: High to Low"
          />
          <FormField<CatalogFormData>
            label="Newest"
            name="content.filters.sortNewest"
            register={register}
            errors={errors}
            placeholder="Newest"
          />
          <FormField<CatalogFormData>
            label="Sale"
            name="content.filters.sortSale"
            register={register}
            errors={errors}
            placeholder="Sale"
          />
        </FieldGroup>

        {/* Empty & Loading States */}
        <p className="text-sm font-medium text-muted-foreground mb-2 mt-4">Empty & Loading States</p>
        <FieldGroup columns={2}>
          <FormField<CatalogFormData>
            label="No Products Title"
            name="content.filters.noProductsTitle"
            register={register}
            errors={errors}
            placeholder="No products found"
          />
          <FormField<CatalogFormData>
            label="No Products (with filters)"
            name="content.filters.noProductsWithFilters"
            register={register}
            errors={errors}
            placeholder="Try adjusting your filters"
          />
          <FormField<CatalogFormData>
            label="No Products (empty)"
            name="content.filters.noProductsEmpty"
            register={register}
            errors={errors}
            placeholder="Check back later for new products"
          />
          <FormField<CatalogFormData>
            label="Filtering Products"
            name="content.filters.filteringProducts"
            register={register}
            errors={errors}
            placeholder="Filtering products..."
          />
          <FormField<CatalogFormData>
            label="Loading More"
            name="content.filters.loadingMore"
            register={register}
            errors={errors}
            placeholder="Loading more products..."
          />
          <FormField<CatalogFormData>
            label="Seen All Products"
            name="content.filters.seenAllProducts"
            register={register}
            errors={errors}
            placeholder="You've seen all {count} products"
          />
          <FormField<CatalogFormData>
            label="Try Adjusting Filters"
            name="content.filters.tryAdjustingFilters"
            register={register}
            errors={errors}
            placeholder="Try adjusting your filters to see more"
          />
        </FieldGroup>

        {/* Search & Results */}
        <p className="text-sm font-medium text-muted-foreground mb-2 mt-4">Search & Results</p>
        <FieldGroup columns={3}>
          <FormField<CatalogFormData>
            label="Search Placeholder"
            name="content.filters.searchPlaceholder"
            register={register}
            errors={errors}
            placeholder="Search Products"
            description="Placeholder text for the products page search bar and nav search"
          />
          <FormField<CatalogFormData>
            label="Search Clear Aria Label"
            name="content.filters.searchClearAriaLabel"
            register={register}
            errors={errors}
            placeholder="Clear search"
            description="Accessibility label for the clear-search button"
          />
          <FormField<CatalogFormData>
            label="Search Input Aria Label"
            name="content.filters.searchInputAriaLabel"
            register={register}
            errors={errors}
            placeholder="Search products"
            description="Accessibility label for the search input"
          />
          <FormField<CatalogFormData>
            label="Search Products Title"
            name="content.filters.searchProductsTitle"
            register={register}
            errors={errors}
            placeholder="Search Products"
          />
          <FormField<CatalogFormData>
            label="Search Results Title"
            name="content.filters.searchResultsTitle"
            register={register}
            errors={errors}
            placeholder="Search Results"
          />
          <FormField<CatalogFormData>
            label="Results Count Text"
            name="content.filters.resultsCountText"
            register={register}
            errors={errors}
            placeholder="Found {count} result(s)"
          />
          <FormField<CatalogFormData>
            label="No Results Message"
            name="content.filters.noResultsMessage"
            register={register}
            errors={errors}
            placeholder='No results found for "{query}"'
          />
          <FormField<CatalogFormData>
            label="Sort By Label"
            name="content.filters.sortByLabel"
            register={register}
            errors={errors}
            placeholder="Sort by:"
          />
          <FormField<CatalogFormData>
            label="Filters Button Text"
            name="content.filters.filtersButtonText"
            register={register}
            errors={errors}
            placeholder="Filters"
          />
          <FormField<CatalogFormData>
            label="Search For Text"
            name="content.filters.searchForText"
            register={register}
            errors={errors}
            placeholder="for"
            description="Text between count and search query (e.g., '10 for shoes')"
          />
          <FormField<CatalogFormData>
            label="Results Text"
            name="content.filters.resultsText"
            register={register}
            errors={errors}
            placeholder="results"
          />
          <FormField<CatalogFormData>
            label="Items Available"
            name="content.filters.itemsAvailable"
            register={register}
            errors={errors}
            placeholder="items available"
          />
          <FormField<CatalogFormData>
            label="Products Page Title"
            name="content.filters.productsPageTitle"
            register={register}
            errors={errors}
            placeholder="All Products"
          />
        </FieldGroup>

        {/* Quick Filters */}
        <p className="text-sm font-medium text-muted-foreground mb-2 mt-4">Quick Filters</p>
        <FieldGroup columns={4}>
          <FormField<CatalogFormData>
            label="Shop All Button"
            name="content.filters.shopAllButton"
            register={register}
            errors={errors}
            placeholder="Shop All"
          />
          <FormField<CatalogFormData>
            label="Quick Add Button"
            name="content.filters.quickAddButton"
            register={register}
            errors={errors}
            placeholder="Quick Add"
          />
          <FormField<CatalogFormData>
            label="Scroll Left (aria)"
            name="content.filters.scrollLeftAriaLabel"
            register={register}
            errors={errors}
            placeholder="Scroll left"
          />
          <FormField<CatalogFormData>
            label="Scroll Right (aria)"
            name="content.filters.scrollRightAriaLabel"
            register={register}
            errors={errors}
            placeholder="Scroll right"
          />
        </FieldGroup>

        {/* Rating Filter */}
        <p className="text-sm font-medium text-muted-foreground mb-2 mt-4">Rating Filter</p>
        <FieldGroup columns={4}>
          <FormField<CatalogFormData>
            label="Minimum Rating"
            name="content.filters.minimumRating"
            register={register}
            errors={errors}
            placeholder="Minimum Rating"
          />
          <FormField<CatalogFormData>
            label="Stars & Up"
            name="content.filters.starsAndUp"
            register={register}
            errors={errors}
            placeholder="{count} stars & up"
          />
          <FormField<CatalogFormData>
            label="Star & Up (singular)"
            name="content.filters.starAndUp"
            register={register}
            errors={errors}
            placeholder="1 star & up"
          />
          <FormField<CatalogFormData>
            label="Clear Rating Filter"
            name="content.filters.clearRatingFilter"
            register={register}
            errors={errors}
            placeholder="Clear"
          />
        </FieldGroup>

        {/* Price Filter */}
        <p className="text-sm font-medium text-muted-foreground mb-2 mt-4">Price Filter</p>
        <FieldGroup columns={4}>
          <FormField<CatalogFormData>
            label="Min Price Label"
            name="content.filters.minPriceLabel"
            register={register}
            errors={errors}
            placeholder="Min Price"
          />
          <FormField<CatalogFormData>
            label="Max Price Label"
            name="content.filters.maxPriceLabel"
            register={register}
            errors={errors}
            placeholder="Max Price"
          />
          <FormField<CatalogFormData>
            label="Quick Min Label"
            name="content.filters.quickMinLabel"
            register={register}
            errors={errors}
            placeholder="Quick Min"
          />
          <FormField<CatalogFormData>
            label="Quick Max Label"
            name="content.filters.quickMaxLabel"
            register={register}
            errors={errors}
            placeholder="Quick Max"
          />
          <FormField<CatalogFormData>
            label="Clear Price Filter"
            name="content.filters.clearPriceFilter"
            register={register}
            errors={errors}
            placeholder="Clear"
          />
          <FormField<CatalogFormData>
            label="Discover Products"
            name="content.filters.discoverProducts"
            register={register}
            errors={errors}
            placeholder="Discover Products"
          />
          <FormField<CatalogFormData>
            label="Check Out Our Products"
            name="content.filters.checkOutOurProducts"
            register={register}
            errors={errors}
            placeholder="Check Out Our Products"
          />
        </FieldGroup>
      </FormSection>

      {/* ── content.productDetail — Product Detail Page Text ───────────── */}
      <FormSection
        title="Product Detail Page"
        description="Trust badges, tabs, reviews, stock, and size guide text"
        collapsible
        defaultExpanded={false}
      >
        {/* Trust Badges */}
        <p className="text-sm font-medium text-muted-foreground mb-2">Trust Badges</p>
        <FieldGroup columns={3}>
          <FormField<CatalogFormData>
            label="Free Shipping"
            name="content.productDetail.freeShipping"
            register={register}
            errors={errors}
            placeholder="Free Shipping"
          />
          <FormField<CatalogFormData>
            label="Secure Payment"
            name="content.productDetail.securePayment"
            register={register}
            errors={errors}
            placeholder="Secure Payment"
          />
          <FormField<CatalogFormData>
            label="Easy Returns"
            name="content.productDetail.easyReturns"
            register={register}
            errors={errors}
            placeholder="Easy Returns"
          />
        </FieldGroup>

        {/* Tab Labels */}
        <p className="text-sm font-medium text-muted-foreground mb-2 mt-4">Tab Labels</p>
        <FieldGroup columns={4}>
          <FormField<CatalogFormData>
            label="Description Tab"
            name="content.productDetail.descriptionTab"
            register={register}
            errors={errors}
            placeholder="Description"
          />
          <FormField<CatalogFormData>
            label="Shipping Tab"
            name="content.productDetail.shippingTab"
            register={register}
            errors={errors}
            placeholder="Shipping"
          />
          <FormField<CatalogFormData>
            label="Reviews Tab"
            name="content.productDetail.reviewsTab"
            register={register}
            errors={errors}
            placeholder="Reviews"
          />
          <FormField<CatalogFormData>
            label="No Description Available"
            name="content.productDetail.noDescriptionAvailable"
            register={register}
            errors={errors}
            placeholder="No description available for this product."
          />
          <FormField<CatalogFormData>
            label="Qty Label"
            name="content.productDetail.qtyLabel"
            register={register}
            errors={errors}
            placeholder="Qty"
          />
          <FormField<CatalogFormData>
            label="Qty Label With Colon"
            name="content.productDetail.qtyLabelWithColon"
            register={register}
            errors={errors}
            placeholder="Qty:"
          />
          <FormField<CatalogFormData>
            label="Share Button"
            name="content.productDetail.shareButton"
            register={register}
            errors={errors}
            placeholder="Share"
          />
        </FieldGroup>

        {/* Variant Selection */}
        <p className="text-sm font-medium text-muted-foreground mb-2 mt-4">Variant Selection</p>
        <FieldGroup columns={2}>
          <FormField<CatalogFormData>
            label="Color Label"
            name="content.productDetail.colorLabel"
            register={register}
            errors={errors}
            placeholder="Color"
          />
          <FormField<CatalogFormData>
            label="Size Label"
            name="content.productDetail.sizeLabel"
            register={register}
            errors={errors}
            placeholder="Size"
          />
          <FormField<CatalogFormData>
            label="Select Option Label"
            name="content.productDetail.selectOptionLabel"
            register={register}
            errors={errors}
            placeholder="Select Option"
          />
          <FormField<CatalogFormData>
            label="Please Select Size"
            name="content.productDetail.pleaseSelectSize"
            register={register}
            errors={errors}
            placeholder="Please select a size"
          />
          <FormField<CatalogFormData>
            label="Please Select Option"
            name="content.productDetail.pleaseSelectOption"
            register={register}
            errors={errors}
            placeholder="Please select an option"
          />
        </FieldGroup>

        {/* Specifications & Attributes */}
        <p className="text-sm font-medium text-muted-foreground mb-2 mt-4">Specifications & Attributes</p>
        <FieldGroup columns={2}>
          <FormField<CatalogFormData>
            label="Specifications Tab Label"
            name="content.productDetail.specificationsTab"
            register={register}
            errors={errors}
            placeholder="Specifications"
          />
          <FormField<CatalogFormData>
            label="No Specifications Message"
            name="content.productDetail.noSpecifications"
            register={register}
            errors={errors}
            placeholder="No specifications available."
          />
          <FormField<CatalogFormData>
            label="Select Attribute Label"
            name="content.productDetail.selectAttributeLabel"
            register={register}
            errors={errors}
            placeholder="Select {attribute}"
          />
          <FormField<CatalogFormData>
            label="Please Select Attribute"
            name="content.productDetail.pleaseSelectAttribute"
            register={register}
            errors={errors}
            placeholder="Please select {attribute}"
          />
        </FieldGroup>

        {/* Stock Messages */}
        <p className="text-sm font-medium text-muted-foreground mb-2 mt-4">Stock Messages</p>
        <FieldGroup columns={2}>
          <FormField<CatalogFormData>
            label="Only X Left"
            name="content.productDetail.onlyXLeft"
            register={register}
            errors={errors}
            placeholder="Only {count} left!"
          />
          <FormField<CatalogFormData>
            label="In Stock With Count"
            name="content.productDetail.inStockWithCount"
            register={register}
            errors={errors}
            placeholder="In Stock ({count} available)"
          />
          <FormField<CatalogFormData>
            label="Selling Fast"
            name="content.productDetail.sellingFast"
            register={register}
            errors={errors}
            placeholder="Selling fast!"
          />
          <FormField<CatalogFormData>
            label="Save Percent"
            name="content.productDetail.savePercent"
            register={register}
            errors={errors}
            placeholder="Save {percent}%"
          />
          <FormField<CatalogFormData>
            label="Unlimited Stock Label"
            name="content.productDetail.unlimitedStock"
            register={register}
            errors={errors}
            placeholder="In Stock"
          />
          <FormField<CatalogFormData>
            label="Select Options for Stock"
            name="content.productDetail.selectOptionsForStock"
            register={register}
            errors={errors}
            placeholder="Select options to see availability"
          />
          <FormField<CatalogFormData>
            label="Max Per Customer"
            name="content.productDetail.maxPerCustomer"
            register={register}
            errors={errors}
            placeholder="Limit {count} per customer"
          />
          <FormField<CatalogFormData>
            label="Unavailable for Selection"
            name="content.productDetail.unavailableForSelection"
            register={register}
            errors={errors}
            placeholder="Unavailable for current selection"
          />
        </FieldGroup>

        {/* Stock Alerts / Notify Me */}
        <p className="text-sm font-medium text-muted-foreground mb-2 mt-4">Stock Alerts / Notify Me</p>
        <FieldGroup columns={2}>
          <FormField<CatalogFormData>
            label="Button Text"
            name="content.productDetail.notifyMeButton"
            register={register}
            errors={errors}
            placeholder="Notify me when back in stock"
          />
          <FormField<CatalogFormData>
            label="Form Title"
            name="content.productDetail.notifyMeTitle"
            register={register}
            errors={errors}
            placeholder="Notify me when back in stock"
          />
          <FormField<CatalogFormData>
            label="Description (with variant)"
            name="content.productDetail.notifyMeDescription"
            register={register}
            errors={errors}
            placeholder="Get notified when {variant} is available"
          />
          <FormField<CatalogFormData>
            label="Description (generic)"
            name="content.productDetail.notifyMeDescriptionGeneric"
            register={register}
            errors={errors}
            placeholder="Get notified when this item is available"
          />
          <FormField<CatalogFormData>
            label="Email Placeholder"
            name="content.productDetail.notifyMeEmailPlaceholder"
            register={register}
            errors={errors}
            placeholder="Enter your email"
          />
          <FormField<CatalogFormData>
            label="Submit Button"
            name="content.productDetail.notifyMeSubmitButton"
            register={register}
            errors={errors}
            placeholder="Notify Me"
          />
          <FormField<CatalogFormData>
            label="Submitting Text"
            name="content.productDetail.notifyMeSubmitting"
            register={register}
            errors={errors}
            placeholder="Subscribing..."
          />
          <FormField<CatalogFormData>
            label="Success Message"
            name="content.productDetail.notifyMeSuccess"
            register={register}
            errors={errors}
            placeholder="You'll be notified when this item is back in stock"
          />
          <FormField<CatalogFormData>
            label="Already Subscribed"
            name="content.productDetail.notifyMeAlreadySubscribed"
            register={register}
            errors={errors}
            placeholder="You're already subscribed for this item"
          />
          <FormField<CatalogFormData>
            label="Unsubscribe Button"
            name="content.productDetail.notifyMeUnsubscribe"
            register={register}
            errors={errors}
            placeholder="Unsubscribe"
          />
          <FormField<CatalogFormData>
            label="Invalid Email Error"
            name="content.productDetail.notifyMeInvalidEmail"
            register={register}
            errors={errors}
            placeholder="Please enter a valid email address"
          />
          <FormField<CatalogFormData>
            label="Generic Error"
            name="content.productDetail.notifyMeError"
            register={register}
            errors={errors}
            placeholder="Failed to subscribe. Please try again."
          />
          <FormField<CatalogFormData>
            label="Cancel Button"
            name="content.productDetail.notifyMeCancel"
            register={register}
            errors={errors}
            placeholder="Cancel"
          />
        </FieldGroup>

        {/* Review Pluralization */}
        <p className="text-sm font-medium text-muted-foreground mb-2 mt-4">Review Pluralization</p>
        <FieldGroup columns={2}>
          <FormField<CatalogFormData>
            label="Review Singular"
            name="content.productDetail.reviewSingular"
            register={register}
            errors={errors}
            placeholder="review"
          />
          <FormField<CatalogFormData>
            label="Review Plural"
            name="content.productDetail.reviewPlural"
            register={register}
            errors={errors}
            placeholder="reviews"
          />
        </FieldGroup>

        {/* Image Gallery Labels */}
        <p className="text-sm font-medium text-muted-foreground mb-2 mt-4">Image Gallery Labels</p>
        <FieldGroup columns={2}>
          <FormField<CatalogFormData>
            label="Zoom In Label"
            name="content.productDetail.zoomInLabel"
            register={register}
            errors={errors}
            placeholder="Zoom in"
          />
          <FormField<CatalogFormData>
            label="Zoom Out Label"
            name="content.productDetail.zoomOutLabel"
            register={register}
            errors={errors}
            placeholder="Zoom out"
          />
          <FormField<CatalogFormData>
            label="Previous Image Label"
            name="content.productDetail.previousImageLabel"
            register={register}
            errors={errors}
            placeholder="Previous image"
          />
          <FormField<CatalogFormData>
            label="Next Image Label"
            name="content.productDetail.nextImageLabel"
            register={register}
            errors={errors}
            placeholder="Next image"
          />
        </FieldGroup>

        {/* Review Form */}
        <p className="text-sm font-medium text-muted-foreground mb-2 mt-4">Review Form</p>
        <FieldGroup columns={2}>
          <FormField<CatalogFormData>
            label="No Reviews Yet"
            name="content.productDetail.noReviewsYet"
            register={register}
            errors={errors}
            placeholder="No reviews yet. Be the first!"
          />
          <FormField<CatalogFormData>
            label="Write Review Title"
            name="content.productDetail.writeReviewTitle"
            register={register}
            errors={errors}
            placeholder="Write a Review"
          />
          <FormField<CatalogFormData>
            label="Rating Required"
            name="content.productDetail.ratingRequired"
            register={register}
            errors={errors}
            placeholder="Rating *"
          />
          <FormField<CatalogFormData>
            label="Review Title Required"
            name="content.productDetail.reviewTitleRequired"
            register={register}
            errors={errors}
            placeholder="Review Title *"
          />
          <FormField<CatalogFormData>
            label="Review Title Placeholder"
            name="content.productDetail.reviewTitlePlaceholder"
            register={register}
            errors={errors}
            placeholder="Summarize your review"
          />
          <FormField<CatalogFormData>
            label="Review Required"
            name="content.productDetail.reviewRequired"
            register={register}
            errors={errors}
            placeholder="Review *"
          />
          <FormField<CatalogFormData>
            label="Review Placeholder"
            name="content.productDetail.reviewPlaceholder"
            register={register}
            errors={errors}
            placeholder="Share your experience..."
          />
          <FormField<CatalogFormData>
            label="Character Count"
            name="content.productDetail.characterCount"
            register={register}
            errors={errors}
            placeholder="{count} / 2000 characters"
          />
          <FormField<CatalogFormData>
            label="Images Optional"
            name="content.productDetail.imagesOptional"
            register={register}
            errors={errors}
            placeholder="Images (Optional)"
          />
          <FormField<CatalogFormData>
            label="Upload Images Hint"
            name="content.productDetail.uploadImagesHint"
            register={register}
            errors={errors}
            placeholder="Upload up to 5 images"
          />
          <FormField<CatalogFormData>
            label="Submit Review Button"
            name="content.productDetail.submitReviewButton"
            register={register}
            errors={errors}
            placeholder="Submit Review"
          />
          <FormField<CatalogFormData>
            label="Helpful Button"
            name="content.productDetail.helpfulButton"
            register={register}
            errors={errors}
            placeholder="Helpful"
          />
          <FormField<CatalogFormData>
            label="Verified Purchase"
            name="content.productDetail.verifiedPurchase"
            register={register}
            errors={errors}
            placeholder="Verified Purchase"
          />
          <FormField<CatalogFormData>
            label="Helpful Button With Count"
            name="content.productDetail.helpfulButtonWithCount"
            register={register}
            errors={errors}
            placeholder="Helpful ({count})"
          />
        </FieldGroup>

        {/* Review Filters */}
        <p className="text-sm font-medium text-muted-foreground mb-2 mt-4">Review Filters</p>
        <FieldGroup columns={2}>
          <FormField<CatalogFormData>
            label="All Ratings"
            name="content.productDetail.allRatings"
            register={register}
            errors={errors}
            placeholder="All Ratings"
          />
          <FormField<CatalogFormData>
            label="Verified Only"
            name="content.productDetail.verifiedOnly"
            register={register}
            errors={errors}
            placeholder="Verified Only"
          />
        </FieldGroup>

        {/* Review Delete Modal */}
        <p className="text-sm font-medium text-muted-foreground mb-2 mt-4">Review Delete Modal</p>
        <FieldGroup columns={2}>
          <FormField<CatalogFormData>
            label="Delete Review Title"
            name="content.productDetail.deleteReviewTitle"
            register={register}
            errors={errors}
            placeholder="Delete Review"
          />
          <FormField<CatalogFormData>
            label="Delete Review Message"
            name="content.productDetail.deleteReviewMessage"
            register={register}
            errors={errors}
            placeholder="Are you sure you want to delete this review? This action cannot be undone."
          />
          <FormField<CatalogFormData>
            label="Cancel Button"
            name="content.productDetail.cancelButton"
            register={register}
            errors={errors}
            placeholder="Cancel"
          />
          <FormField<CatalogFormData>
            label="Deleting Button"
            name="content.productDetail.deletingButton"
            register={register}
            errors={errors}
            placeholder="Deleting..."
          />
        </FieldGroup>

        {/* Review Time Formatting */}
        <p className="text-sm font-medium text-muted-foreground mb-2 mt-4">Review Time Formatting</p>
        <FieldGroup columns={2}>
          <FormField<CatalogFormData>
            label="Just Now"
            name="content.productDetail.justNow"
            register={register}
            errors={errors}
            placeholder="just now"
          />
          <FormField<CatalogFormData>
            label="Minutes Ago"
            name="content.productDetail.minutesAgo"
            register={register}
            errors={errors}
            placeholder="{count} minutes ago"
          />
          <FormField<CatalogFormData>
            label="Hours Ago"
            name="content.productDetail.hoursAgo"
            register={register}
            errors={errors}
            placeholder="{count} hours ago"
          />
          <FormField<CatalogFormData>
            label="Days Ago"
            name="content.productDetail.daysAgo"
            register={register}
            errors={errors}
            placeholder="{count} days ago"
          />
        </FieldGroup>

        {/* Shipping Information */}
        <p className="text-sm font-medium text-muted-foreground mb-2 mt-4">Shipping Information</p>
        <FieldGroup columns={2}>
          <FormField<CatalogFormData>
            label="Free Standard Shipping Title"
            name="content.productDetail.freeStandardShippingTitle"
            register={register}
            errors={errors}
            placeholder="Free Standard Shipping"
          />
          <FormField<CatalogFormData>
            label="Free Standard Shipping Description"
            name="content.productDetail.freeStandardShippingDescription"
            register={register}
            errors={errors}
            placeholder="On orders over $75. Delivery in 5-7 business days."
          />
          <FormField<CatalogFormData>
            label="Express Shipping Title"
            name="content.productDetail.expressShippingTitle"
            register={register}
            errors={errors}
            placeholder="Express Shipping"
          />
          <FormField<CatalogFormData>
            label="Express Shipping Description"
            name="content.productDetail.expressShippingDescription"
            register={register}
            errors={errors}
            placeholder="{price}. Delivery in 2-3 business days."
          />
        </FieldGroup>

        {/* Size Guide */}
        <p className="text-sm font-medium text-muted-foreground mb-2 mt-4">Size Guide</p>
        <FieldGroup columns={2}>
          <FormField<CatalogFormData>
            label="Size Guide Button"
            name="content.productDetail.sizeGuideButton"
            register={register}
            errors={errors}
            placeholder="Size Guide"
          />
          <FormField<CatalogFormData>
            label="Size Guide Title"
            name="content.productDetail.sizeGuideTitle"
            register={register}
            errors={errors}
            placeholder="Size Guide"
          />
          <FormField<CatalogFormData>
            label="Size Guide Subtitle"
            name="content.productDetail.sizeGuideSubtitle"
            register={register}
            errors={errors}
            placeholder="Find your perfect fit"
          />
          <FormField<CatalogFormData>
            label="Men's Tab"
            name="content.productDetail.sizeGuideMensTab"
            register={register}
            errors={errors}
            placeholder="Men's"
          />
          <FormField<CatalogFormData>
            label="Women's Tab"
            name="content.productDetail.sizeGuideWomensTab"
            register={register}
            errors={errors}
            placeholder="Women's"
          />
          <FormField<CatalogFormData>
            label="Kids' Tab"
            name="content.productDetail.sizeGuideKidsTab"
            register={register}
            errors={errors}
            placeholder="Kids'"
          />
          <FormField<CatalogFormData>
            label="Shoes Category Label"
            name="content.productDetail.sizeGuideShoesCategory"
            register={register}
            errors={errors}
            placeholder="Shoes"
          />
          <FormField<CatalogFormData>
            label="Clothing Category Label"
            name="content.productDetail.sizeGuideClothingCategory"
            register={register}
            errors={errors}
            placeholder="Clothing"
          />
          <FormField<CatalogFormData>
            label="How to Measure Title"
            name="content.productDetail.sizeGuideHowToMeasure"
            register={register}
            errors={errors}
            placeholder="How to Measure"
          />
          <FormField<CatalogFormData>
            label="Measure Tip (Shoes)"
            name="content.productDetail.sizeGuideMeasureTip"
            register={register}
            errors={errors}
            placeholder="Stand on a piece of paper..."
          />
          <FormField<CatalogFormData>
            label="Pro Tip (Shoes)"
            name="content.productDetail.sizeGuideProTip"
            register={register}
            errors={errors}
            placeholder="Pro Tip: Measure your feet in the evening..."
          />
          <FormField<CatalogFormData>
            label="Measure Tip (Clothing)"
            name="content.productDetail.sizeGuideClothingMeasureTip"
            register={register}
            errors={errors}
            placeholder="Use a soft measuring tape..."
          />
          <FormField<CatalogFormData>
            label="Pro Tip (Clothing)"
            name="content.productDetail.sizeGuideClothingProTip"
            register={register}
            errors={errors}
            placeholder="Pro Tip: If you're between sizes..."
          />
        </FieldGroup>

        {/* Review List and Loading States */}
        <p className="text-sm font-medium text-muted-foreground mb-2 mt-4">Review List and Loading States</p>
        <FieldGroup columns={2}>
          <FormField<CatalogFormData>
            label="Loading Reviews"
            name="content.productDetail.loadingReviews"
            register={register}
            errors={errors}
            placeholder="Loading reviews..."
          />
          <FormField<CatalogFormData>
            label="No Reviews Match Filters"
            name="content.productDetail.noReviewsMatchFilters"
            register={register}
            errors={errors}
            placeholder="No reviews match your filters."
          />
          <FormField<CatalogFormData>
            label="Clear Filters"
            name="content.productDetail.clearFilters"
            register={register}
            errors={errors}
            placeholder="Clear Filters"
          />
          <FormField<CatalogFormData>
            label="Clear Filters (Lowercase)"
            name="content.productDetail.clearFiltersLowercase"
            register={register}
            errors={errors}
            placeholder="Clear filters"
          />
          <FormField<CatalogFormData>
            label="Try Again"
            name="content.productDetail.tryAgain"
            register={register}
            errors={errors}
            placeholder="Try again"
          />
          <FormField<CatalogFormData>
            label="Failed To Load Reviews"
            name="content.productDetail.failedToLoadReviews"
            register={register}
            errors={errors}
            placeholder="Failed to load reviews. Please try again."
          />
          <FormField<CatalogFormData>
            label="Load More Reviews"
            name="content.productDetail.loadMoreReviews"
            register={register}
            errors={errors}
            placeholder="Load More Reviews"
          />
        </FieldGroup>

        {/* Review Form Labels (Edit Form) */}
        <p className="text-sm font-medium text-muted-foreground mb-2 mt-4">Review Form Labels (Edit Form)</p>
        <FieldGroup columns={2}>
          <FormField<CatalogFormData>
            label="Rating Label"
            name="content.productDetail.ratingLabel"
            register={register}
            errors={errors}
            placeholder="Rating"
          />
          <FormField<CatalogFormData>
            label="Title Label"
            name="content.productDetail.titleLabel"
            register={register}
            errors={errors}
            placeholder="Title"
          />
          <FormField<CatalogFormData>
            label="Review Label"
            name="content.productDetail.reviewLabel"
            register={register}
            errors={errors}
            placeholder="Review"
          />
        </FieldGroup>

        {/* Review Form States and Messages */}
        <p className="text-sm font-medium text-muted-foreground mb-2 mt-4">Review Form States and Messages</p>
        <FieldGroup columns={2}>
          <FormField<CatalogFormData>
            label="Uploading Images"
            name="content.productDetail.uploadingImages"
            register={register}
            errors={errors}
            placeholder="Uploading and compressing images..."
          />
          <FormField<CatalogFormData>
            label="Saving Button"
            name="content.productDetail.savingButton"
            register={register}
            errors={errors}
            placeholder="Saving..."
          />
          <FormField<CatalogFormData>
            label="Save Button"
            name="content.productDetail.saveButton"
            register={register}
            errors={errors}
            placeholder="Save"
          />
          <FormField<CatalogFormData>
            label="Submitting Button"
            name="content.productDetail.submittingButton"
            register={register}
            errors={errors}
            placeholder="Submitting..."
          />
          <FormField<CatalogFormData>
            label="Thank You Message"
            name="content.productDetail.thankYouMessage"
            register={register}
            errors={errors}
            placeholder="Thank you for your review!"
          />
          <FormField<CatalogFormData>
            label="Review Submitted Message"
            name="content.productDetail.reviewSubmittedMessage"
            register={register}
            errors={errors}
            placeholder="Your review has been submitted and will be visible after moderation."
          />
        </FieldGroup>

        {/* Review Form Validation Messages */}
        <p className="text-sm font-medium text-muted-foreground mb-2 mt-4">Review Form Validation Messages</p>
        <FieldGroup columns={2}>
          <FormField<CatalogFormData>
            label="Please Select Rating"
            name="content.productDetail.pleaseSelectRating"
            register={register}
            errors={errors}
            placeholder="Please select a rating"
          />
          <FormField<CatalogFormData>
            label="Please Enter Review Title"
            name="content.productDetail.pleaseEnterReviewTitle"
            register={register}
            errors={errors}
            placeholder="Please enter a review title"
          />
          <FormField<CatalogFormData>
            label="Please Enter Review Body"
            name="content.productDetail.pleaseEnterReviewBody"
            register={register}
            errors={errors}
            placeholder="Please enter a review body"
          />
          <FormField<CatalogFormData>
            label="Max Images Error"
            name="content.productDetail.maxImagesError"
            register={register}
            errors={errors}
            placeholder="Maximum 5 images allowed per review"
          />
          <FormField<CatalogFormData>
            label="Only X More Images Error"
            name="content.productDetail.onlyXMoreImagesError"
            register={register}
            errors={errors}
            placeholder="Only {count} more image(s) can be uploaded (max 5 total)"
          />
          <FormField<CatalogFormData>
            label="Failed To Submit Review"
            name="content.productDetail.failedToSubmitReview"
            register={register}
            errors={errors}
            placeholder="Failed to submit review"
          />
          <FormField<CatalogFormData>
            label="Failed To Submit Review Retry"
            name="content.productDetail.failedToSubmitReviewRetry"
            register={register}
            errors={errors}
            placeholder="Failed to submit review. Please try again."
          />
          <FormField<CatalogFormData>
            label="Must Be Logged In To Review"
            name="content.productDetail.mustBeLoggedInToReview"
            register={register}
            errors={errors}
            placeholder="You must be logged in to submit a review. Please log in and try again."
          />
          <FormField<CatalogFormData>
            label="Failed To Update Review"
            name="content.productDetail.failedToUpdateReview"
            register={register}
            errors={errors}
            placeholder="Failed to update review"
          />
          <FormField<CatalogFormData>
            label="Failed To Delete Review"
            name="content.productDetail.failedToDeleteReview"
            register={register}
            errors={errors}
            placeholder="Failed to delete review"
          />
          <FormField<CatalogFormData>
            label="Failed To Upload Images"
            name="content.productDetail.failedToUploadImages"
            register={register}
            errors={errors}
            placeholder="Failed to upload images"
          />
        </FieldGroup>
      </FormSection>
    </>
  );
}
