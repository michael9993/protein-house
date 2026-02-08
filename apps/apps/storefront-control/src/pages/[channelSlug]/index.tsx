import { useState, useCallback } from "react";
import { useAppBridge } from "@saleor/app-sdk/app-bridge";
import { type NextPage } from "next";
import { useRouter } from "next/router";
import {
  Check,
  Download,
  FileText,
  Layout,
  Loader2,
  Palette,
  Plug,
  Save,
  Search,
  ShoppingCart,
  Store,
  Upload,
  type LucideIcon,
} from "lucide-react";

import { AppShell } from "@/components/layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpcClient } from "@/modules/trpc/trpc-client";
import { ConfigImport } from "@/modules/ui/config-import";
import { downloadConfigFile } from "@/modules/config/export";

// ---------------------------------------------------------------------------
// ConfigCard
// ---------------------------------------------------------------------------

interface ConfigCardItem {
  label: string;
  value: string;
  isColor?: boolean;
}

interface ConfigCardProps {
  title: string;
  href: string;
  summary?: string;
  status?: "ready" | "attention";
  items: ConfigCardItem[];
  icon: LucideIcon;
  onNavigate: (href: string) => void;
}

function ConfigCard({ title, href, summary, status = "ready", items, icon: Icon, onNavigate }: ConfigCardProps) {
  return (
    <button type="button" onClick={() => onNavigate(href)} className="block text-left w-full">
      <Card className="cursor-pointer hover:shadow-md hover:border-primary/50 transition-all h-full">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">{title}</CardTitle>
                {summary && (
                  <p className="text-xs text-muted-foreground mt-0.5">{summary}</p>
                )}
              </div>
            </div>
            <Badge
              variant={status === "attention" ? "outline" : "default"}
              className={
                status === "attention"
                  ? "border-yellow-400 bg-yellow-50 text-yellow-700"
                  : undefined
              }
            >
              {status === "attention" ? "Review" : "Ready"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-3 border-t">
          <div className="flex flex-col gap-2.5">
            {items.map((item) => (
              <div key={item.label} className="flex items-center justify-between py-0.5">
                <span className="text-[13px] text-muted-foreground">{item.label}</span>
                {item.isColor ? (
                  <div className="flex items-center gap-2">
                    <div
                      className="w-5 h-5 rounded border border-border"
                      style={{ backgroundColor: item.value }}
                    />
                    <span className="text-xs font-medium">{item.value}</span>
                  </div>
                ) : (
                  <span className="text-[13px] font-medium">{item.value}</span>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </button>
  );
}

// ---------------------------------------------------------------------------
// SnapshotRow
// ---------------------------------------------------------------------------

interface SnapshotRowProps {
  label: string;
  children: React.ReactNode;
}

function SnapshotRow({ label, children }: SnapshotRowProps) {
  return (
    <div>
      <p className="text-[11px] font-bold text-muted-foreground/80 mb-1">{label}</p>
      <div className="text-sm font-medium">{children}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

const ChannelIndexPage: NextPage = () => {
  const router = useRouter();
  const { channelSlug } = router.query as { channelSlug: string };
  const { appBridgeState } = useAppBridge();
  const [showImportModal, setShowImportModal] = useState(false);

  const {
    data: config,
    isLoading,
    refetch,
  } = trpcClient.config.getConfig.useQuery(
    { channelSlug },
    { enabled: !!channelSlug && !!appBridgeState?.ready },
  );

  const updateSampleMutation = trpcClient.config.updateSampleConfig.useMutation({
    onSuccess: (data) => {
      alert(data.message);
      refetch();
    },
    onError: (error) => {
      alert(`Failed to update sample config: ${error.message}`);
    },
  });

  const handleExport = useCallback(() => {
    if (config) {
      downloadConfigFile(config, channelSlug);
    }
  }, [config, channelSlug]);

  const handleUpdateSample = useCallback(() => {
    if (
      config &&
      window.confirm(
        `Update the sample config file for "${channelSlug}"? This will overwrite the current sample file with your current configuration.`,
      )
    ) {
      updateSampleMutation.mutate({ channelSlug });
    }
  }, [config, channelSlug, updateSampleMutation]);

  const handleImportSuccess = useCallback(() => {
    setShowImportModal(false);
    refetch();
  }, [refetch]);

  if (!appBridgeState?.ready || isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Loading...</span>
      </div>
    );
  }

  if (showImportModal) {
    return (
      <AppShell
        channelSlug={channelSlug}
        channelName={config?.store.name}
        activePage="dashboard"
        title="Dashboard"
        description="Configuration overview and quick actions"
      >
        <div className="p-6">
          <ConfigImport
            channelSlug={channelSlug}
            onSuccess={handleImportSuccess}
            onCancel={() => setShowImportModal(false)}
          />
        </div>
      </AppShell>
    );
  }

  const enabledFeaturesCount = Object.values(config?.features ?? {}).filter(Boolean).length;
  const totalFeaturesCount = Object.keys(config?.features ?? {}).length;

  return (
    <AppShell
      channelSlug={channelSlug}
      channelName={config?.store.name}
      activePage="dashboard"
      title="Dashboard"
      description="Configuration overview and quick actions"
    >
      <div className="p-6 space-y-8">
        {/* Hero Section */}
        <Card>
          <CardContent className="p-8">
            <div className="flex justify-between items-start gap-8">
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-4">Configuration Overview</h2>
                <p className="text-[15px] text-muted-foreground mb-6 leading-relaxed">
                  Review storefront sections, check status, and jump into edits. All changes
                  sync in real-time to your storefront.
                </p>
                <div className="flex gap-2">
                  <Button onClick={() => setShowImportModal(true)}>
                    <Upload className="h-4 w-4 mr-2" />
                    Import Configuration
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleExport}
                    disabled={!config}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export JSON
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleUpdateSample}
                    disabled={!config || updateSampleMutation.isLoading}
                    title="Update the sample config file (sample-config-import.json or sample-config-import-en.json) with current configuration"
                  >
                    {updateSampleMutation.isLoading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    {updateSampleMutation.isLoading
                      ? "Updating..."
                      : "Update Sample Config"}
                  </Button>
                </div>
              </div>

              {/* Channel Snapshot */}
              <Card className="min-w-[280px]">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Channel Snapshot</CardTitle>
                </CardHeader>
                <CardContent className="pt-3 border-t">
                  <div className="flex flex-col gap-3">
                    <SnapshotRow label="Store Name">
                      {config?.store.name || "Not set"}
                    </SnapshotRow>
                    <SnapshotRow label="Primary Color">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-6 h-6 rounded border-2 border-border"
                          style={{ backgroundColor: config?.branding.colors.primary }}
                        />
                        <span className="text-[13px]">
                          {config?.branding.colors.primary}
                        </span>
                      </div>
                    </SnapshotRow>
                    <SnapshotRow label="Homepage Hero">
                      <span className="flex items-center gap-1.5">
                        {config?.homepage.sections.hero.enabled ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-green-600" />
                            Enabled
                          </>
                        ) : (
                          "Disabled"
                        )}
                      </span>
                    </SnapshotRow>
                    <SnapshotRow label="Features Enabled">
                      {enabledFeaturesCount} / {totalFeaturesCount}
                    </SnapshotRow>
                  </div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        {/* Config Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <ConfigCard
            title="Store Info"
            href={`/${channelSlug}/store`}
            summary="Core store identity"
            status={config?.store?.name ? "ready" : "attention"}
            icon={Store}
            onNavigate={(h) => router.push(h)}
            items={[
              { label: "Name", value: config?.store.name || "Not set" },
              { label: "Email", value: config?.store.email || "Not set" },
              { label: "Type", value: config?.store.type || "physical" },
            ]}
          />

          <ConfigCard
            title="Branding"
            href={`/${channelSlug}/design?tab=branding`}
            summary="Logo, colors, and typography"
            status={config?.branding?.logo ? "ready" : "attention"}
            icon={Palette}
            onNavigate={(h) => router.push(h)}
            items={[
              {
                label: "Primary Color",
                value: config?.branding?.colors?.primary ?? "",
                isColor: true,
              },
              { label: "Border Radius", value: config?.branding?.style?.borderRadius ?? "" },
              { label: "Button Style", value: config?.branding?.style?.buttonStyle ?? "" },
            ]}
          />

          <ConfigCard
            title="Localization"
            href={`/${channelSlug}/store?tab=localization`}
            summary="Locale and regional settings"
            status={config?.localization?.defaultLocale ? "ready" : "attention"}
            icon={Store}
            onNavigate={(h) => router.push(h)}
            items={[
              { label: "Locale", value: config?.localization?.defaultLocale ?? "en-US" },
              { label: "Direction", value: config?.localization?.direction ?? "auto" },
              { label: "Time Format", value: config?.localization?.timeFormat ?? "12h" },
            ]}
          />

          <ConfigCard
            title="Dark Mode"
            href={`/${channelSlug}/design?tab=dark-mode`}
            summary="Theme behavior"
            status={config?.darkMode?.enabled ? "ready" : "attention"}
            icon={Palette}
            onNavigate={(h) => router.push(h)}
            items={[
              { label: "Enabled", value: config?.darkMode?.enabled ? "Yes" : "No" },
              { label: "Auto (System)", value: config?.darkMode?.auto ? "Yes" : "No" },
              {
                label: "Dark BG",
                value: config?.darkMode?.colors?.background || "#0f172a",
                isColor: true,
              },
            ]}
          />

          <ConfigCard
            title="Features"
            href={`/${channelSlug}/commerce?tab=features`}
            summary="Customer experience switches"
            status={config?.features ? "ready" : "attention"}
            icon={ShoppingCart}
            onNavigate={(h) => router.push(h)}
            items={[
              { label: "Wishlist", value: config?.features.wishlist ? "Enabled" : "Disabled" },
              {
                label: "Reviews",
                value: config?.features.productReviews ? "Enabled" : "Disabled",
              },
              {
                label: "Newsletter",
                value: config?.features.newsletter ? "Enabled" : "Disabled",
              },
            ]}
          />

          <ConfigCard
            title="Homepage"
            href={`/${channelSlug}/pages-config?tab=homepage`}
            summary="Sections and layout"
            status={config?.homepage ? "ready" : "attention"}
            icon={Layout}
            onNavigate={(h) => router.push(h)}
            items={[
              {
                label: "Hero",
                value: config?.homepage.sections.hero.enabled ? "Enabled" : "Disabled",
              },
              {
                label: "Trending/New",
                value: config?.homepage.sections.trending?.enabled ? "Enabled" : "Disabled",
              },
              {
                label: "Best Sellers",
                value: config?.homepage.sections.bestSellers?.enabled ? "Enabled" : "Disabled",
              },
            ]}
          />

          <ConfigCard
            title="Filters"
            href={`/${channelSlug}/commerce?tab=catalog`}
            summary="Product discovery"
            status={config?.filters ? "ready" : "attention"}
            icon={Search}
            onNavigate={(h) => router.push(h)}
            items={[
              {
                label: "Price Filter",
                value: config?.filters.priceFilter.enabled ? "Enabled" : "Disabled",
              },
              {
                label: "Quick Filters",
                value: config?.quickFilters.enabled ? "Enabled" : "Disabled",
              },
              { label: "Category Limit", value: String(config?.quickFilters.categoryLimit || 8) },
            ]}
          />

          <ConfigCard
            title="UI Components"
            href={`/${channelSlug}/design?tab=components`}
            summary="Buttons, cards, and inputs"
            status={config?.ui ? "ready" : "attention"}
            icon={Palette}
            onNavigate={(h) => router.push(h)}
            items={[
              { label: "Button Radius", value: config?.ui?.buttons?.borderRadius || "md" },
              {
                label: "Sale Badge Radius",
                value: config?.ui?.badges?.sale?.borderRadius || "sm",
              },
              { label: "Toast Position", value: config?.ui?.toasts?.position || "bottom-right" },
            ]}
          />

          <ConfigCard
            title="Content"
            href={`/${channelSlug}/content`}
            summary="Storefront copy"
            status={config?.content ? "ready" : "attention"}
            icon={FileText}
            onNavigate={(h) => router.push(h)}
            items={[
              {
                label: "Cart Button",
                value: config?.content?.cart?.checkoutButton || "Checkout",
              },
              { label: "Sign In", value: config?.content?.account?.signInTitle || "Sign In" },
              {
                label: "Add to Cart",
                value: config?.content?.product?.addToCartButton || "Add to Cart",
              },
            ]}
          />

          <ConfigCard
            title="Pages"
            href={`/${channelSlug}/pages-config?tab=page-toggles`}
            summary="Static pages"
            status={config?.pages ? "ready" : "attention"}
            icon={Layout}
            onNavigate={(h) => router.push(h)}
            items={[
              { label: "About Us", value: config?.pages.aboutUs ? "Enabled" : "Disabled" },
              { label: "FAQ", value: config?.pages.faq ? "Enabled" : "Disabled" },
              { label: "Blog", value: config?.pages.blog ? "Enabled" : "Disabled" },
            ]}
          />

          <ConfigCard
            title="Integrations"
            href={`/${channelSlug}/integrations`}
            summary="Analytics and marketing"
            status={config?.integrations ? "ready" : "attention"}
            icon={Plug}
            onNavigate={(h) => router.push(h)}
            items={[
              {
                label: "Google Analytics",
                value: config?.integrations.analytics.googleAnalyticsId
                  ? "Configured"
                  : "Not set",
              },
              {
                label: "Facebook",
                value: config?.integrations.social.facebook ? "Set" : "Not set",
              },
              {
                label: "Instagram",
                value: config?.integrations.social.instagram ? "Set" : "Not set",
              },
            ]}
          />

          <ConfigCard
            title="SEO"
            href={`/${channelSlug}/store?tab=seo`}
            summary="Search and sharing"
            status={config?.seo ? "ready" : "attention"}
            icon={Search}
            onNavigate={(h) => router.push(h)}
            items={[
              {
                label: "Title Template",
                value: config?.seo.titleTemplate ? "Set" : "Not set",
              },
              { label: "Default Title", value: config?.seo.defaultTitle ? "Set" : "Not set" },
              { label: "OG Image", value: config?.seo.defaultImage ? "Set" : "Not set" },
            ]}
          />
        </div>
      </div>
    </AppShell>
  );
};

export default ChannelIndexPage;
