import {
  ArrowUp,
  Clock,
  Heart,
  Instagram,
  Mail,
  Megaphone,
  MessageCircle,
  Package,
  ShoppingCart,
  Smartphone,
} from "lucide-react";

import { FormSection } from "@/components/forms/FormSection";
import { FormSelect } from "@/components/forms/FormSelect";
import { FormSlider } from "@/components/forms/FormSlider";
import { FormSwitch } from "@/components/forms/FormSwitch";
import { FeatureCard } from "@/components/shared/FeatureCard";
import { ComponentBlock } from "@/components/shared/ComponentBlock";
import { FieldGroup } from "@/components/shared/FieldGroup";
import type { GlobalFormData, GlobalTabProps } from "./types";

const FAB_ITEMS = [
  { id: "whatsapp" as const, label: "WhatsApp", icon: MessageCircle },
  { id: "recentlyViewed" as const, label: "Recently Viewed", icon: Clock },
  { id: "wishlist" as const, label: "Wishlist", icon: Heart },
] as const;

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

      {/* Floating Action Buttons */}
      <FormSection
        title="Floating Buttons"
        description="Configure floating action buttons (FABs) — visibility, side, order, and spacing"
      >
        {/* Per-FAB controls */}
        {FAB_ITEMS.map((fab) => {
          const Icon = fab.icon;
          return (
            <ComponentBlock
              key={fab.id}
              icon={Icon}
              title={fab.label}
              description={`${fab.label} floating button`}
              defaultExpanded
            >
              <FieldGroup columns={3}>
                <FormSwitch<GlobalFormData>
                  label="Enabled"
                  name={`ui.floatingButtons.${fab.id}.enabled`}
                  control={control}
                  description={`Show ${fab.label} FAB`}
                />
                <FormSelect<GlobalFormData>
                  label="Side"
                  name={`ui.floatingButtons.${fab.id}.side`}
                  control={control}
                  options={[
                    { value: "start", label: "Start (left in LTR)" },
                    { value: "end", label: "End (right in LTR)" },
                  ]}
                />
                <FormSlider<GlobalFormData>
                  label="Order"
                  name={`ui.floatingButtons.${fab.id}.order`}
                  control={control}
                  min={1}
                  max={10}
                  step={1}
                  description="Lower = closer to bottom"
                />
              </FieldGroup>
            </ComponentBlock>
          );
        })}

        {/* Global spacing controls */}
        <ComponentBlock
          icon={Smartphone}
          title="Spacing"
          description="Gap between buttons and base offset from the bottom edge"
          defaultExpanded
        >
          <FieldGroup columns={2}>
            <FormSlider<GlobalFormData>
              label="Gap Between Buttons"
              name="ui.floatingButtons.gap"
              control={control}
              min={0.5}
              max={5}
              step={0.25}
              unit="rem"
            />
            <FormSlider<GlobalFormData>
              label="Base Offset from Bottom"
              name="ui.floatingButtons.baseOffset"
              control={control}
              min={1}
              max={20}
              step={0.5}
              unit="rem"
            />
          </FieldGroup>
        </ComponentBlock>
      </FormSection>
    </>
  );
}
