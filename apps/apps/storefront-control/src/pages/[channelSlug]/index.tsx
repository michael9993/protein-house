import { useState, useCallback } from "react";
import { useAppBridge } from "@saleor/app-sdk/app-bridge";
import { type NextPage } from "next";
import { useRouter } from "next/router";
import {
  Check,
  Download,
  FileText,
  Globe,
  Home,
  Loader2,
  Package,
  PanelTop,
  Save,
  Search,
  ShoppingCart,
  Upload,
  User,
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
            title="Global"
            href={`/${channelSlug}/global`}
            summary="Store identity, branding, integrations"
            status={config?.store?.name ? "ready" : "attention"}
            icon={Globe}
            onNavigate={(h) => router.push(h)}
            items={[
              { label: "Name", value: config?.store.name || "Not set" },
              {
                label: "Primary Color",
                value: config?.branding?.colors?.primary ?? "",
                isColor: true,
              },
              { label: "Locale", value: config?.localization?.defaultLocale ?? "en-US" },
            ]}
          />

          <ConfigCard
            title="Homepage"
            href={`/${channelSlug}/homepage`}
            summary="Sections and layout"
            status={config?.homepage ? "ready" : "attention"}
            icon={Home}
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
            title="Layout"
            href={`/${channelSlug}/layout-config`}
            summary="Header, footer, navigation"
            status={config?.header ? "ready" : "attention"}
            icon={PanelTop}
            onNavigate={(h) => router.push(h)}
            items={[
              {
                label: "Banner",
                value: config?.header?.banner?.enabled ? "Enabled" : "Disabled",
              },
              {
                label: "Logo Position",
                value: config?.header?.logoPosition ?? "center",
              },
              {
                label: "Footer Newsletter",
                value: config?.footer?.showNewsletter ? "Enabled" : "Disabled",
              },
            ]}
          />

          <ConfigCard
            title="Catalog"
            href={`/${channelSlug}/catalog`}
            summary="Filters, product detail, reviews"
            status={config?.filters ? "ready" : "attention"}
            icon={Package}
            onNavigate={(h) => router.push(h)}
            items={[
              {
                label: "Filters",
                value: config?.filters.enabled ? "Enabled" : "Disabled",
              },
              {
                label: "Quick Filters",
                value: config?.quickFilters.enabled ? "Enabled" : "Disabled",
              },
              {
                label: "Wishlist",
                value: config?.features.wishlist ? "Enabled" : "Disabled",
              },
            ]}
          />

          <ConfigCard
            title="Cart & Checkout"
            href={`/${channelSlug}/cart-checkout`}
            summary="Shipping, tax, promo popup"
            status={config?.ecommerce ? "ready" : "attention"}
            icon={ShoppingCart}
            onNavigate={(h) => router.push(h)}
            items={[
              {
                label: "Free Shipping",
                value: config?.ecommerce?.shipping?.freeShippingThreshold
                  ? `$${config.ecommerce.shipping.freeShippingThreshold}`
                  : "Not set",
              },
              {
                label: "Guest Checkout",
                value: config?.features.guestCheckout ? "Enabled" : "Disabled",
              },
              {
                label: "Promo Popup",
                value: config?.promoPopup?.enabled ? "Enabled" : "Disabled",
              },
            ]}
          />

          <ConfigCard
            title="Account"
            href={`/${channelSlug}/account-config`}
            summary="Auth, account text"
            status={config?.content?.account ? "ready" : "attention"}
            icon={User}
            onNavigate={(h) => router.push(h)}
            items={[
              {
                label: "Social Login",
                value: config?.features.socialLogin ? "Enabled" : "Disabled",
              },
              { label: "Sign In", value: config?.content?.account?.signInTitle || "Sign In" },
              { label: "Sign Up", value: config?.content?.account?.signUpTitle || "Sign Up" },
            ]}
          />

          <ConfigCard
            title="Other Pages"
            href={`/${channelSlug}/other-pages`}
            summary="Contact, FAQ, error pages"
            status={config?.pages ? "ready" : "attention"}
            icon={FileText}
            onNavigate={(h) => router.push(h)}
            items={[
              { label: "About Us", value: config?.pages.aboutUs ? "Enabled" : "Disabled" },
              { label: "Contact", value: config?.pages.contact ? "Enabled" : "Disabled" },
              { label: "FAQ", value: config?.pages.faq ? "Enabled" : "Disabled" },
            ]}
          />

          <ConfigCard
            title="SEO"
            href={`/${channelSlug}/global?tab=localization`}
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

          <ConfigCard
            title="Features"
            href={`/${channelSlug}/global?tab=features`}
            summary="Customer experience switches"
            status={config?.features ? "ready" : "attention"}
            icon={Globe}
            onNavigate={(h) => router.push(h)}
            items={[
              {
                label: "Features Enabled",
                value: `${enabledFeaturesCount} / ${totalFeaturesCount}`,
              },
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
        </div>
      </div>
    </AppShell>
  );
};

export default ChannelIndexPage;
