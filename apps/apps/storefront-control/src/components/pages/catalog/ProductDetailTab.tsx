import {
  Bell,
  Clock,
  Columns2,
  Heart,
  LayoutGrid,
  Share2,
  Star,
} from "lucide-react";

import { FormField } from "@/components/forms/FormField";
import { FormSwitch } from "@/components/forms/FormSwitch";
import { FormSection } from "@/components/forms/FormSection";
import { FeatureCard } from "@/components/shared/FeatureCard";
import type { CatalogFormData, CatalogTabProps } from "./types";

export function ProductDetailTab({ control, register, errors }: CatalogTabProps) {
  return (
    <>
      {/* Catalog Feature Flags */}
      <FormSection title="Catalog Features" description="Feature toggles for product catalog and detail pages">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <FeatureCard
            name="features.productReviews"
            control={control}
            title="Product Reviews"
            description="Customer product reviews"
            icon={<Star className="h-5 w-5" />}
          />
          <FeatureCard
            name="features.wishlist"
            control={control}
            title="Wishlist"
            description="Allow customers to save products"
            icon={<Heart className="h-5 w-5" />}
          />
          <FeatureCard
            name="features.compareProducts"
            control={control}
            title="Compare Products"
            description="Side-by-side product comparison"
            icon={<Columns2 className="h-5 w-5" />}
            comingSoon
          />
          <FeatureCard
            name="features.recentlyViewed"
            control={control}
            title="Recently Viewed"
            description="Show recently viewed products"
            icon={<Clock className="h-5 w-5" />}
          />
          <FeatureCard
            name="features.relatedProducts"
            control={control}
            title="Related Products"
            description="Show related product suggestions"
            icon={<LayoutGrid className="h-5 w-5" />}
          />
          <FeatureCard
            name="features.shareButtons"
            control={control}
            title="Share Buttons"
            description="Social sharing buttons"
            icon={<Share2 className="h-5 w-5" />}
          />
          <FeatureCard
            name="features.stockAlerts"
            control={control}
            title="Stock Alerts"
            description="Notify Me when back in stock"
            icon={<Bell className="h-5 w-5" />}
          />
        </div>
      </FormSection>

      {/* Related Products Config */}
      <FormSection title="Related Products" description="Configure related product suggestions on product pages">
        <FormSwitch<CatalogFormData>
          label="Enable Related Products"
          name="relatedProducts.enabled"
          control={control}
        />
        <FormField<CatalogFormData>
          label="Max Items"
          name="relatedProducts.maxItems"
          register={register}
          errors={errors}
          type="number"
        />
        <FormField<CatalogFormData>
          label="Title"
          name="relatedProducts.title"
          register={register}
          errors={errors}
          placeholder="Related Products"
        />
        <FormField<CatalogFormData>
          label="Subtitle"
          name="relatedProducts.subtitle"
          register={register}
          errors={errors}
          placeholder="You may also like"
        />
      </FormSection>
    </>
  );
}
