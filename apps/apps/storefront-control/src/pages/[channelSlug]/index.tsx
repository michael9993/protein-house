import { useAppBridge } from "@saleor/app-sdk/app-bridge";
import { Box, Text, Button } from "@saleor/macaw-ui";
import { NextPage } from "next";
import { useRouter } from "next/router";
import Link from "next/link";
import { useState, useCallback } from "react";

import { AppLayout } from "@/modules/ui/app-layout";
import { trpcClient } from "@/modules/trpc/trpc-client";
import { ConfigImport } from "@/modules/ui/config-import";
import { downloadConfigFile } from "@/modules/config/export";

const ChannelIndexPage: NextPage = () => {
  const router = useRouter();
  const { channelSlug } = router.query as { channelSlug: string };
  const { appBridgeState } = useAppBridge();
  const [showImportModal, setShowImportModal] = useState(false);

  const { data: config, isLoading, refetch } = trpcClient.config.getConfig.useQuery(
    { channelSlug },
    { enabled: !!channelSlug && !!appBridgeState?.ready }
  );

  const handleExport = useCallback(() => {
    if (config) {
      downloadConfigFile(config, channelSlug);
    }
  }, [config, channelSlug]);

  const handleImportSuccess = useCallback(() => {
    setShowImportModal(false);
    refetch();
  }, [refetch]);

  if (!appBridgeState?.ready || isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <Text>Loading...</Text>
      </Box>
    );
  }

  // Show import modal
  if (showImportModal) {
    return (
      <AppLayout channelSlug={channelSlug} channelName={config?.store.name}>
        <ConfigImport 
          channelSlug={channelSlug} 
          onSuccess={handleImportSuccess}
          onCancel={() => setShowImportModal(false)}
        />
      </AppLayout>
    );
  }

  return (
    <AppLayout channelSlug={channelSlug} channelName={config?.store.name}>
      <Box>
        {/* Header with Import/Export buttons */}
        <Box display="flex" justifyContent="space-between" alignItems="center" marginBottom={4}>
          <Text as="h2" variant="heading">
            Configuration Overview
          </Text>
          <Box display="flex" gap={2}>
            <Button variant="tertiary" size="small" onClick={() => setShowImportModal(true)}>
              Import
            </Button>
            <Button variant="tertiary" size="small" onClick={handleExport} disabled={!config}>
              Export
            </Button>
          </Box>
        </Box>
        
        <Box 
          display="grid" 
          __gridTemplateColumns="repeat(auto-fill, minmax(280px, 1fr))"
          gap={4}
        >
          {/* Store Info Card */}
          <ConfigCard
            title="Store Info"
            href={`/${channelSlug}/store`}
            items={[
              { label: "Name", value: config?.store.name || "Not set" },
              { label: "Email", value: config?.store.email || "Not set" },
              { label: "Type", value: config?.store.type || "physical" },
            ]}
          />

          {/* Branding Card */}
          <ConfigCard
            title="Branding"
            href={`/${channelSlug}/branding`}
            items={[
              { label: "Primary Color", value: config?.branding.colors.primary, isColor: true },
              { label: "Border Radius", value: config?.branding.style.borderRadius },
              { label: "Button Style", value: config?.branding.style.buttonStyle },
            ]}
          />

          {/* Localization Card - Now in Store page */}
          <ConfigCard
            title="Localization"
            href={`/${channelSlug}/store`}
            items={[
              { label: "Locale", value: config?.localization.defaultLocale || "en-US" },
              { label: "Direction", value: config?.localization.direction || "auto" },
              { label: "Time Format", value: config?.localization.timeFormat || "12h" },
            ]}
          />

          {/* Dark Mode Card - Now in Store page */}
          <ConfigCard
            title="Dark Mode"
            href={`/${channelSlug}/store`}
            items={[
              { label: "Enabled", value: config?.darkMode?.enabled ? "Yes" : "No" },
              { label: "Auto (System)", value: config?.darkMode?.auto ? "Yes" : "No" },
              { label: "Dark BG", value: config?.darkMode?.colors?.background || "#0f172a", isColor: true },
            ]}
          />

          {/* Features Card */}
          <ConfigCard
            title="Features"
            href={`/${channelSlug}/features`}
            items={[
              { label: "Wishlist", value: config?.features.wishlist ? "Enabled" : "Disabled" },
              { label: "Reviews", value: config?.features.productReviews ? "Enabled" : "Disabled" },
              { label: "Newsletter", value: config?.features.newsletter ? "Enabled" : "Disabled" },
            ]}
          />

          {/* Homepage Card */}
          <ConfigCard
            title="Homepage"
            href={`/${channelSlug}/homepage`}
            items={[
              { label: "Hero", value: config?.homepage.sections.hero.enabled ? "Enabled" : "Disabled" },
              { label: "New Arrivals", value: config?.homepage.sections.newArrivals.enabled ? "Enabled" : "Disabled" },
              { label: "Best Sellers", value: config?.homepage.sections.bestSellers.enabled ? "Enabled" : "Disabled" },
            ]}
          />

          {/* Filters Card */}
          <ConfigCard
            title="Filters"
            href={`/${channelSlug}/filters`}
            items={[
              { label: "Price Filter", value: config?.filters.priceFilter.enabled ? "Enabled" : "Disabled" },
              { label: "Quick Filters", value: config?.quickFilters.enabled ? "Enabled" : "Disabled" },
              { label: "Category Limit", value: String(config?.quickFilters.categoryLimit || 8) },
            ]}
          />

          {/* UI Components Card */}
          <ConfigCard
            title="UI Components"
            href={`/${channelSlug}/ui-components`}
            items={[
              { label: "Button Radius", value: config?.ui?.buttons?.borderRadius || "md" },
              { label: "Sale Badge Radius", value: config?.ui?.badges?.sale?.borderRadius || "sm" },
              { label: "Toast Position", value: config?.ui?.toasts?.position || "bottom-right" },
            ]}
          />

          {/* Content Card */}
          <ConfigCard
            title="Content"
            href={`/${channelSlug}/content`}
            items={[
              { label: "Cart Button", value: config?.content?.cart?.checkoutButton || "Checkout" },
              { label: "Sign In", value: config?.content?.account?.signInTitle || "Sign In" },
              { label: "Add to Cart", value: config?.content?.product?.addToCartButton || "Add to Cart" },
            ]}
          />

          {/* Pages Card */}
          <ConfigCard
            title="Pages"
            href={`/${channelSlug}/pages`}
            items={[
              { label: "About Us", value: config?.pages.aboutUs ? "Enabled" : "Disabled" },
              { label: "FAQ", value: config?.pages.faq ? "Enabled" : "Disabled" },
              { label: "Blog", value: config?.pages.blog ? "Enabled" : "Disabled" },
            ]}
          />

          {/* Integrations Card */}
          <ConfigCard
            title="Integrations"
            href={`/${channelSlug}/integrations`}
            items={[
              { label: "Google Analytics", value: config?.integrations.analytics.googleAnalyticsId ? "Configured" : "Not set" },
              { label: "Facebook", value: config?.integrations.social.facebook ? "Set" : "Not set" },
              { label: "Instagram", value: config?.integrations.social.instagram ? "Set" : "Not set" },
            ]}
          />

          {/* SEO Card */}
          <ConfigCard
            title="SEO"
            href={`/${channelSlug}/seo`}
            items={[
              { label: "Title Template", value: config?.seo.titleTemplate ? "Set" : "Not set" },
              { label: "Default Title", value: config?.seo.defaultTitle ? "Set" : "Not set" },
              { label: "OG Image", value: config?.seo.defaultImage ? "Set" : "Not set" },
            ]}
          />
        </Box>
      </Box>
    </AppLayout>
  );
};

interface ConfigCardProps {
  title: string;
  href: string;
  items: { label: string; value: string; isColor?: boolean }[];
}

function ConfigCard({ title, href, items }: ConfigCardProps) {
  return (
    <Box
      backgroundColor="default1"
      borderRadius={4}
      padding={4}
      boxShadow="defaultFocused"
    >
      <Box display="flex" justifyContent="space-between" alignItems="center" marginBottom={3}>
        <Text as="h3" variant="bodyStrong">{title}</Text>
        <Link href={href} passHref legacyBehavior>
          <Button variant="tertiary" size="small">
            Edit →
          </Button>
        </Link>
      </Box>
      <Box display="flex" flexDirection="column" gap={2}>
        {items.map((item) => (
          <Box key={item.label} display="flex" justifyContent="space-between" alignItems="center">
            <Text variant="caption" color="default2">{item.label}</Text>
            {item.isColor ? (
              <Box display="flex" alignItems="center" gap={2}>
                <Box
                  width={4}
                  height={4}
                  borderRadius={1}
                  style={{ backgroundColor: item.value }}
                />
                <Text variant="caption">{item.value}</Text>
              </Box>
            ) : (
              <Text variant="caption">{item.value}</Text>
            )}
          </Box>
        ))}
      </Box>
    </Box>
  );
}

export default ChannelIndexPage;
