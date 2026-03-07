import {
  ArrowUp,
  Instagram,
  Mail,
  Megaphone,
  Package,
  ShoppingCart,
} from "lucide-react";

import { FormSection } from "@/components/forms/FormSection";
import { FeatureCard } from "@/components/shared/FeatureCard";
import type { GlobalTabProps } from "./types";

export function GlobalFeaturesTab({ control }: GlobalTabProps) {
  return (
    <>
      {/* Marketing Features */}
      <FormSection title="Marketing" description="Marketing and promotional feature toggles">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <FeatureCard
            name="features.newsletter"
            control={control}
            title="Newsletter"
            description="Email newsletter signup"
            icon={<Mail className="h-5 w-5" />}
          />
          <FeatureCard
            name="features.promotionalBanners"
            control={control}
            title="Promotional Banners"
            description="Display promotional banners"
            icon={<Megaphone className="h-5 w-5" />}
          />
          <FeatureCard
            name="features.abandonedCartEmails"
            control={control}
            title="Abandoned Cart Emails"
            description="Recovery email campaigns"
            icon={<ShoppingCart className="h-5 w-5" />}
          />
          <FeatureCard
            name="features.instagramFeed"
            control={control}
            title="Instagram Feed"
            description="Display Instagram feed"
            icon={<Instagram className="h-5 w-5" />}
          />
        </div>
      </FormSection>

      {/* Product Features */}
      <FormSection title="Products" description="Global product feature toggles">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <FeatureCard
            name="features.productBundles"
            control={control}
            title="Product Bundles"
            description="Bundle products together"
            icon={<Package className="h-5 w-5" />}
            comingSoon
          />
        </div>
      </FormSection>

      {/* UI Features */}
      <FormSection title="UI" description="Global UI feature toggles">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <FeatureCard
            name="features.scrollToTop"
            control={control}
            title="Scroll to Top"
            description="Floating scroll button"
            icon={<ArrowUp className="h-5 w-5" />}
          />
        </div>
      </FormSection>
    </>
  );
}
