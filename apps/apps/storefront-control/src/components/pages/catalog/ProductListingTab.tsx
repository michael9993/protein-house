import { FormField } from "@/components/forms/FormField";
import { FormSwitch } from "@/components/forms/FormSwitch";
import { FormColorPicker } from "@/components/forms/FormColorPicker";
import { FormSelect } from "@/components/forms/FormSelect";
import { FormSection } from "@/components/forms/FormSection";
import { FieldGroup } from "@/components/shared/FieldGroup";
import type { CatalogFormData, CatalogTabProps } from "./types";

const FONT_SIZE_OPTIONS = [
  { value: "xs", label: "Extra Small" },
  { value: "sm", label: "Small" },
  { value: "base", label: "Base" },
];

const FONT_WEIGHT_OPTIONS = [
  { value: "normal", label: "Normal" },
  { value: "medium", label: "Medium" },
  { value: "semibold", label: "Semibold" },
  { value: "bold", label: "Bold" },
];

const BORDER_RADIUS_OPTIONS = [
  { value: "none", label: "None" },
  { value: "sm", label: "Small" },
  { value: "md", label: "Medium" },
  { value: "full", label: "Full (Circle)" },
];

const CARD_BORDER_RADIUS_OPTIONS = [
  { value: "none", label: "None" },
  { value: "sm", label: "Small" },
  { value: "md", label: "Medium" },
  { value: "lg", label: "Large" },
  { value: "xl", label: "XL" },
  { value: "2xl", label: "2XL" },
  { value: "full", label: "Full" },
];

const SHADOW_OPTIONS = [
  { value: "none", label: "None" },
  { value: "sm", label: "Small" },
  { value: "md", label: "Medium" },
  { value: "lg", label: "Large" },
];

export function ProductListingTab({ control, register, watch }: CatalogTabProps) {
  const filtersEnabled = watch("filters.enabled");
  const quickFiltersEnabled = watch("quickFilters.enabled");

  return (
    <>
      {/* Product Filters */}
      <FormSection title="Product Filters" description="Configure which filters appear in product listings">
        <FormSwitch<CatalogFormData>
          label="Enable Product Filters"
          name="filters.enabled"
          control={control}
          description="Enable the filter sidebar on product pages"
        />

        {filtersEnabled && (
          <FieldGroup columns={2}>
            <FormSwitch<CatalogFormData>
              label="Price Filter"
              name="filters.priceFilter.enabled"
              control={control}
            />
            <FormSwitch<CatalogFormData>
              label="Price Quick Buttons"
              name="filters.priceFilter.showQuickButtons"
              control={control}
              description="Show preset price ranges"
            />
            <FormSwitch<CatalogFormData>
              label="Rating Filter"
              name="filters.ratingFilter.enabled"
              control={control}
            />
            <FormSwitch<CatalogFormData>
              label="Brand Filter"
              name="filters.brandFilter.enabled"
              control={control}
            />
            <FormSwitch<CatalogFormData>
              label="Size Filter"
              name="filters.sizeFilter.enabled"
              control={control}
            />
            <FormSwitch<CatalogFormData>
              label="Color Filter"
              name="filters.colorFilter.enabled"
              control={control}
            />
            <FormSwitch<CatalogFormData>
              label="Category Filter"
              name="filters.categoryFilter.enabled"
              control={control}
            />
            <FormSwitch<CatalogFormData>
              label="Collection Filter"
              name="filters.collectionFilter.enabled"
              control={control}
            />
            <FormSwitch<CatalogFormData>
              label="Stock Filter"
              name="filters.stockFilter.enabled"
              control={control}
            />
          </FieldGroup>
        )}
      </FormSection>

      {/* Quick Filters */}
      <FormSection title="Quick Filters" description="Visual filter cards at the top of product listings">
        <FormSwitch<CatalogFormData>
          label="Enable Quick Filters"
          name="quickFilters.enabled"
          control={control}
        />

        {quickFiltersEnabled && (
          <>
            <FieldGroup columns={2}>
              <FormSwitch<CatalogFormData>
                label="Show Categories"
                name="quickFilters.showCategories"
                control={control}
              />
              <FormSwitch<CatalogFormData>
                label="Show Collections"
                name="quickFilters.showCollections"
                control={control}
              />
              <FormSwitch<CatalogFormData>
                label="Show Brands"
                name="quickFilters.showBrands"
                control={control}
              />
            </FieldGroup>

            <FieldGroup columns={3}>
              <FormField<CatalogFormData>
                label="Category Limit"
                name="quickFilters.categoryLimit"
                register={register}
                errors={undefined}
                type="number"
                placeholder="8"
                description="Max categories to show"
              />
              <FormField<CatalogFormData>
                label="Collection Limit"
                name="quickFilters.collectionLimit"
                register={register}
                errors={undefined}
                type="number"
                placeholder="6"
                description="Max collections to show"
              />
              <FormField<CatalogFormData>
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
        title="Quick Filter Card Styling"
        description="Customize the appearance of quick filter cards, labels, and arrows"
        collapsible
        defaultExpanded={false}
      >
        {/* Card Appearance */}
        <FieldGroup columns={2}>
          <FormColorPicker<CatalogFormData>
            label="Card Background"
            name="quickFilters.style.cardBackgroundColor"
            control={control}
            description="Background when no product image"
          />
          <FormColorPicker<CatalogFormData>
            label="Card Border"
            name="quickFilters.style.cardBorderColor"
            control={control}
            description="Default card border color"
          />
          <FormSelect<CatalogFormData>
            label="Card Border Radius"
            name="quickFilters.style.cardBorderRadius"
            control={control}
            options={CARD_BORDER_RADIUS_OPTIONS}
            description="Corner rounding for cards"
          />
          <FormColorPicker<CatalogFormData>
            label="Card Hover Border"
            name="quickFilters.style.cardHoverBorderColor"
            control={control}
          />
          <FormSelect<CatalogFormData>
            label="Card Hover Shadow"
            name="quickFilters.style.cardHoverShadow"
            control={control}
            options={SHADOW_OPTIONS}
          />
          <FormColorPicker<CatalogFormData>
            label="Card Text Strip BG"
            name="quickFilters.style.cardTextStripBg"
            control={control}
            description="Bottom label strip background"
          />
        </FieldGroup>

        {/* Active State */}
        <FieldGroup columns={3}>
          <FormColorPicker<CatalogFormData>
            label="Active Border"
            name="quickFilters.style.cardActiveBorderColor"
            control={control}
          />
          <FormColorPicker<CatalogFormData>
            label="Active Background"
            name="quickFilters.style.cardActiveBgColor"
            control={control}
          />
          <FormColorPicker<CatalogFormData>
            label="Active Text"
            name="quickFilters.style.cardActiveTextColor"
            control={control}
          />
          <FormColorPicker<CatalogFormData>
            label="Check Badge Color"
            name="quickFilters.style.checkBadgeColor"
            control={control}
            description="Active check icon background"
          />
        </FieldGroup>

        {/* Section & Labels */}
        <FieldGroup columns={2}>
          <FormColorPicker<CatalogFormData>
            label="Section Title Color"
            name="quickFilters.style.sectionTitleColor"
            control={control}
          />
          <FormColorPicker<CatalogFormData>
            label="Group Label Color"
            name="quickFilters.style.groupLabelColor"
            control={control}
            description="Category/collection group label"
          />
        </FieldGroup>

        {/* Scroll Arrows */}
        <FieldGroup columns={2}>
          <FormColorPicker<CatalogFormData>
            label="Arrow Background"
            name="quickFilters.style.arrowBackgroundColor"
            control={control}
          />
          <FormColorPicker<CatalogFormData>
            label="Arrow Icon Color"
            name="quickFilters.style.arrowIconColor"
            control={control}
          />
        </FieldGroup>

        {/* Shop All Button */}
        <FieldGroup columns={2}>
          <FormColorPicker<CatalogFormData>
            label="Shop All Button BG"
            name="quickFilters.style.shopAllButtonBackgroundColor"
            control={control}
          />
          <FormColorPicker<CatalogFormData>
            label="Shop All Button Text"
            name="quickFilters.style.shopAllButtonTextColor"
            control={control}
          />
          <FormColorPicker<CatalogFormData>
            label="Shop All Button Hover BG"
            name="quickFilters.style.shopAllButtonHoverBackgroundColor"
            control={control}
          />
          <FormColorPicker<CatalogFormData>
            label="Shop All Button Border"
            name="quickFilters.style.shopAllButtonBorderColor"
            control={control}
          />
        </FieldGroup>
      </FormSection>

      {/* Filter Sidebar Styling */}
      <FormSection
        title="Filter Sidebar Styling"
        description="Customize colors, typography, and checkbox appearance in the filter sidebar"
        collapsible
        defaultExpanded={false}
      >
        {/* Checkbox */}
        <FieldGroup columns={2}>
          <FormColorPicker<CatalogFormData>
            label="Checkbox Accent Color"
            name="ui.filterSidebar.checkboxAccentColor"
            control={control}
            description="Checked state fill color for filter checkboxes"
          />
          <FormColorPicker<CatalogFormData>
            label="Global Checkbox Color"
            name="ui.checkbox.checkedBackgroundColor"
            control={control}
            description="Default checkbox color (all checkboxes site-wide)"
          />
          <FormSelect<CatalogFormData>
            label="Checkbox Border Radius"
            name="ui.checkbox.borderRadius"
            control={control}
            options={BORDER_RADIUS_OPTIONS}
            description="Corner rounding for all checkboxes"
          />
        </FieldGroup>

        {/* Section Titles */}
        <FieldGroup columns={2}>
          <FormSelect<CatalogFormData>
            label="Section Title Size"
            name="ui.filterSidebar.sectionTitleFontSize"
            control={control}
            options={FONT_SIZE_OPTIONS}
          />
          <FormSelect<CatalogFormData>
            label="Section Title Weight"
            name="ui.filterSidebar.sectionTitleFontWeight"
            control={control}
            options={FONT_WEIGHT_OPTIONS}
          />
          <FormColorPicker<CatalogFormData>
            label="Section Title Color"
            name="ui.filterSidebar.sectionTitleColor"
            control={control}
          />
          <FormColorPicker<CatalogFormData>
            label="Section Title Hover"
            name="ui.filterSidebar.sectionTitleHoverColor"
            control={control}
          />
        </FieldGroup>

        {/* Items & Counts */}
        <FieldGroup columns={2}>
          <FormSelect<CatalogFormData>
            label="Item Text Size"
            name="ui.filterSidebar.itemTextFontSize"
            control={control}
            options={FONT_SIZE_OPTIONS}
          />
          <FormColorPicker<CatalogFormData>
            label="Item Text Color"
            name="ui.filterSidebar.itemTextColor"
            control={control}
          />
          <FormColorPicker<CatalogFormData>
            label="Item Count Color"
            name="ui.filterSidebar.itemCountColor"
            control={control}
            description="Color for (count) numbers next to filter items"
          />
        </FieldGroup>

        {/* Chevrons */}
        <FieldGroup columns={2}>
          <FormColorPicker<CatalogFormData>
            label="Chevron Color"
            name="ui.filterSidebar.chevronColor"
            control={control}
          />
          <FormColorPicker<CatalogFormData>
            label="Chevron Hover Color"
            name="ui.filterSidebar.chevronHoverColor"
            control={control}
          />
        </FieldGroup>

        {/* Size Chips */}
        <FieldGroup columns={3}>
          <FormColorPicker<CatalogFormData>
            label="Size Chip Selected BG"
            name="ui.filterSidebar.sizeChipSelectedBg"
            control={control}
          />
          <FormColorPicker<CatalogFormData>
            label="Size Chip Selected Text"
            name="ui.filterSidebar.sizeChipSelectedText"
            control={control}
          />
          <FormColorPicker<CatalogFormData>
            label="Size Chip Selected Border"
            name="ui.filterSidebar.sizeChipSelectedBorder"
            control={control}
          />
        </FieldGroup>

        {/* Clear All Button */}
        <FieldGroup columns={2}>
          <FormColorPicker<CatalogFormData>
            label="Clear All BG"
            name="ui.filterSidebar.clearAllButtonBg"
            control={control}
          />
          <FormColorPicker<CatalogFormData>
            label="Clear All Text"
            name="ui.filterSidebar.clearAllButtonText"
            control={control}
          />
          <FormColorPicker<CatalogFormData>
            label="Clear All Border"
            name="ui.filterSidebar.clearAllButtonBorder"
            control={control}
          />
          <FormColorPicker<CatalogFormData>
            label="Clear All Hover BG"
            name="ui.filterSidebar.clearAllButtonHoverBg"
            control={control}
          />
          <FormColorPicker<CatalogFormData>
            label="Clear All Hover Text"
            name="ui.filterSidebar.clearAllButtonHoverText"
            control={control}
          />
        </FieldGroup>

        {/* Price Filter */}
        <FieldGroup columns={2}>
          <FormColorPicker<CatalogFormData>
            label="Price Input Focus Ring"
            name="ui.filterSidebar.priceInputFocusRingColor"
            control={control}
          />
          <FormColorPicker<CatalogFormData>
            label="Price Quick Button Active BG"
            name="ui.filterSidebar.priceQuickButtonActiveBg"
            control={control}
          />
          <FormColorPicker<CatalogFormData>
            label="Price Quick Button Active Text"
            name="ui.filterSidebar.priceQuickButtonActiveText"
            control={control}
          />
        </FieldGroup>

        {/* Mobile */}
        <FieldGroup columns={2}>
          <FormColorPicker<CatalogFormData>
            label="Mobile Show Results BG"
            name="ui.filterSidebar.mobileShowResultsBg"
            control={control}
          />
          <FormColorPicker<CatalogFormData>
            label="Mobile Show Results Text"
            name="ui.filterSidebar.mobileShowResultsText"
            control={control}
          />
        </FieldGroup>
      </FormSection>
    </>
  );
}
