import { type Control, type UseFormSetValue, type UseFormWatch } from "react-hook-form";
import { RotateCcw } from "lucide-react";

import { FormSelect } from "@/components/forms/FormSelect";
import { FormSwitch } from "@/components/forms/FormSwitch";
import { FormSection } from "@/components/forms/FormSection";
import { FieldGroup } from "@/components/shared/FieldGroup";
import type { ProductCardsFormData } from "./types";
import {
  PRODUCT_CARD_RADIUS_OPTIONS,
  SHADOW_OPTIONS,
  HOVER_SHADOW_OPTIONS,
  HOVER_EFFECT_OPTIONS,
  BADGE_POSITION_OPTIONS,
  IMAGE_FIT_OPTIONS,
  IMAGE_ASPECT_RATIO_OPTIONS,
  TITLE_MAX_LINES_OPTIONS,
  CONTENT_ALIGNMENT_OPTIONS,
} from "@/components/pages/global/options";

type LocationKey = "plp" | "relatedProducts" | "recentlyViewed" | "wishlistDrawer" | "productGrid";

interface LocationCardOverrideTabProps {
  location: LocationKey;
  control: Control<ProductCardsFormData>;
  watch: UseFormWatch<ProductCardsFormData>;
  setValue: UseFormSetValue<ProductCardsFormData>;
}

const LOCATION_INFO: Record<LocationKey, { title: string; description: string }> = {
  plp: {
    title: "Product Listing Page",
    description: "Cards shown on category pages, search results, and collection pages",
  },
  relatedProducts: {
    title: "Related Products",
    description: "Cards shown in the 'You May Also Like' section on product detail pages",
  },
  recentlyViewed: {
    title: "Recently Viewed",
    description: "Cards in the recently viewed products carousel and drawer",
  },
  wishlistDrawer: {
    title: "Wishlist Drawer",
    description: "Cards shown in the wishlist floating drawer",
  },
  productGrid: {
    title: "Product Grid",
    description: "Cards used in generic product grid components",
  },
};

export function LocationCardOverrideTab({
  location,
  control,
  watch,
  setValue,
}: LocationCardOverrideTabProps) {
  const info = LOCATION_INFO[location];
  const prefix = `cardOverrides.${location}` as const;

  const currentOverride = watch(`cardOverrides.${location}`);
  const hasOverrides = currentOverride && Object.keys(currentOverride).length > 0;

  function handleReset() {
    setValue(`cardOverrides.${location}`, {} as any, { shouldDirty: true });
  }

  return (
    <div className="space-y-6">
      {/* Location header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold">{info.title}</h3>
          <p className="text-sm text-muted-foreground">{info.description}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {hasOverrides
              ? "Custom overrides are active. Fields not set here use global defaults."
              : "Using global defaults. Set any field below to override for this location."}
          </p>
        </div>
        {hasOverrides && (
          <button
            type="button"
            onClick={handleReset}
            className="flex shrink-0 items-center gap-1.5 rounded-md border border-orange-200 bg-orange-50 px-3 py-1.5 text-xs font-medium text-orange-700 transition-colors hover:bg-orange-100"
          >
            <RotateCcw className="h-3 w-3" />
            Reset to Global
          </button>
        )}
      </div>

      {/* Visibility Controls */}
      <FormSection title="Element Visibility" description="Show or hide card elements for this location" collapsible defaultExpanded>
        <FieldGroup columns={3}>
          <FormSwitch<ProductCardsFormData>
            label="Show Price"
            name={`${prefix}.showPrice`}
            control={control}
            description="Display product price"
          />
          <FormSwitch<ProductCardsFormData>
            label="Show Original Price"
            name={`${prefix}.showOriginalPrice`}
            control={control}
            description="Display strikethrough original price"
          />
          <FormSwitch<ProductCardsFormData>
            label="Show Category"
            name={`${prefix}.showCategory`}
            control={control}
            description="Display category label"
          />
          <FormSwitch<ProductCardsFormData>
            label="Show Delivery Estimate"
            name={`${prefix}.showDeliveryEstimate`}
            control={control}
            description="Display delivery estimate"
          />
          <FormSwitch<ProductCardsFormData>
            label="Show Share Button"
            name={`${prefix}.showShareButton`}
            control={control}
            description="Display share button"
          />
          <FormSwitch<ProductCardsFormData>
            label="Show Quick View"
            name={`${prefix}.showQuickView`}
            control={control}
            description="Show quick-add button"
          />
          <FormSwitch<ProductCardsFormData>
            label="Show Wishlist Button"
            name={`${prefix}.showWishlistButton`}
            control={control}
            description="Display wishlist heart icon"
          />
          <FormSwitch<ProductCardsFormData>
            label="Show Add to Cart"
            name={`${prefix}.showAddToCart`}
            control={control}
            description="Display add-to-cart button"
          />
          <FormSwitch<ProductCardsFormData>
            label="Show Brand Label"
            name={`${prefix}.showBrandLabel`}
            control={control}
            description="Display brand name"
          />
          <FormSwitch<ProductCardsFormData>
            label="Show Rating"
            name={`${prefix}.showRating`}
            control={control}
            description="Display star rating"
          />
        </FieldGroup>
      </FormSection>

      {/* Badge Visibility */}
      <FormSection title="Badge Visibility" description="Control which badges appear on cards" collapsible defaultExpanded={false}>
        <FieldGroup columns={2}>
          <FormSwitch<ProductCardsFormData>
            label="Show Discount Badge"
            name={`${prefix}.showDiscountBadge`}
            control={control}
            description="Display discount percentage badge"
          />
          <FormSwitch<ProductCardsFormData>
            label="Show Out of Stock Badge"
            name={`${prefix}.showOutOfStockBadge`}
            control={control}
            description="Display out-of-stock badge"
          />
          <FormSwitch<ProductCardsFormData>
            label="Show Low Stock Badge"
            name={`${prefix}.showLowStockBadge`}
            control={control}
            description="Display low stock warning badge"
          />
          <FormSwitch<ProductCardsFormData>
            label="Show New Badge"
            name={`${prefix}.showNewBadge`}
            control={control}
            description="Display 'New' badge on recent products"
          />
        </FieldGroup>
      </FormSection>

      {/* Layout & Appearance */}
      <FormSection title="Layout & Appearance" description="Card styling overrides" collapsible defaultExpanded={false}>
        <FieldGroup columns={2}>
          <FormSelect<ProductCardsFormData>
            label="Title Max Lines"
            name={`${prefix}.titleMaxLines`}
            control={control}
            options={TITLE_MAX_LINES_OPTIONS}
          />
          <FormSelect<ProductCardsFormData>
            label="Content Alignment"
            name={`${prefix}.contentAlignment`}
            control={control}
            options={CONTENT_ALIGNMENT_OPTIONS}
          />
          <FormSelect<ProductCardsFormData>
            label="Border Radius"
            name={`${prefix}.borderRadius`}
            control={control}
            options={PRODUCT_CARD_RADIUS_OPTIONS}
          />
          <FormSelect<ProductCardsFormData>
            label="Shadow"
            name={`${prefix}.shadow`}
            control={control}
            options={SHADOW_OPTIONS}
          />
          <FormSelect<ProductCardsFormData>
            label="Hover Shadow"
            name={`${prefix}.hoverShadow`}
            control={control}
            options={HOVER_SHADOW_OPTIONS}
          />
          <FormSelect<ProductCardsFormData>
            label="Hover Effect"
            name={`${prefix}.hoverEffect`}
            control={control}
            options={HOVER_EFFECT_OPTIONS}
          />
          <FormSelect<ProductCardsFormData>
            label="Badge Position"
            name={`${prefix}.badgePosition`}
            control={control}
            options={BADGE_POSITION_OPTIONS}
          />
          <FormSelect<ProductCardsFormData>
            label="Image Fit"
            name={`${prefix}.imageFit`}
            control={control}
            options={IMAGE_FIT_OPTIONS}
          />
          <FormSelect<ProductCardsFormData>
            label="Image Aspect Ratio"
            name={`${prefix}.imageAspectRatio`}
            control={control}
            options={IMAGE_ASPECT_RATIO_OPTIONS}
          />
        </FieldGroup>
      </FormSection>
    </div>
  );
}
