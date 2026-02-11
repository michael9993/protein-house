import { FormField } from "@/components/forms/FormField";
import { FormSwitch } from "@/components/forms/FormSwitch";
import { FormColorPicker } from "@/components/forms/FormColorPicker";
import { FormSection } from "@/components/forms/FormSection";
import { FieldGroup } from "@/components/shared/FieldGroup";
import type { CatalogFormData, CatalogTabProps } from "./types";

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
        title="Quick Filter Styling"
        description="Customize the appearance of the Shop All button"
        collapsible
        defaultExpanded={false}
      >
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
    </>
  );
}
