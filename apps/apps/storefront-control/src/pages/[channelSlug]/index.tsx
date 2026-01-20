import React from "react";
import { useAppBridge } from "@saleor/app-sdk/app-bridge";
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
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <span>Loading...</span>
      </div>
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
    <AppLayout channelSlug={channelSlug} channelName={config?.store.name} activeTab="overview" enablePageSearch={false}>
      <div>
        {/* Hero Section */}
        <div 
          style={{ 
            backgroundColor: "#fff", 
            borderRadius: "6px", 
            padding: "32px", 
            border: "1px solid #ddd",
            marginBottom: "32px"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "32px" }}>
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "16px", margin: "0 0 16px 0" }}>
                Configuration Overview
              </h2>
              <p style={{ fontSize: "15px", color: "#666", marginBottom: "24px", margin: "0 0 24px 0", lineHeight: 1.6 }}>
                Review storefront sections, check status, and jump into edits. All changes sync in real-time to your storefront.
              </p>
              <div style={{ display: "flex", gap: "8px" }}>
                <button 
                  onClick={() => setShowImportModal(true)}
                  style={{
                    padding: "8px 16px",
                    border: "none",
                    backgroundColor: "#000",
                    color: "#fff",
                    cursor: "pointer",
                    fontSize: "14px"
                  }}
                >
                  📥 Import Configuration
                </button>
                <button 
                  onClick={handleExport} 
                  disabled={!config}
                  style={{
                    padding: "8px 16px",
                    border: "1px solid #ddd",
                    backgroundColor: "#fff",
                    color: "#000",
                    cursor: !config ? "not-allowed" : "pointer",
                    opacity: !config ? 0.5 : 1,
                    fontSize: "14px"
                  }}
                >
                  📤 Export JSON
                </button>
              </div>
            </div>
            <div 
              style={{ 
                backgroundColor: "#fff", 
                borderRadius: "6px", 
                padding: "20px",
                minWidth: "280px",
                border: "1px solid #ddd"
              }}
            >
              <p style={{ fontSize: "14px", fontWeight: "bold", marginBottom: "16px", margin: "0 0 16px 0", color: "#000" }}>
                Channel Snapshot
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div>
                  <p style={{ fontSize: "11px", fontWeight: "bold", marginBottom: "4px", margin: "0 0 4px 0", color: "#666", opacity: 0.8 }}>
                    Store Name
                  </p>
                  <p style={{ fontSize: "14px", fontWeight: "500", margin: 0, color: "#000" }}>
                    {config?.store.name || "Not set"}
                  </p>
                </div>
                <div>
                  <p style={{ fontSize: "11px", fontWeight: "bold", marginBottom: "4px", margin: "0 0 4px 0", color: "#666", opacity: 0.8 }}>
                    Primary Color
                  </p>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div 
                      style={{ 
                        width: "24px", 
                        height: "24px", 
                        borderRadius: "4px", 
                        border: "2px solid #ddd",
                        backgroundColor: config?.branding.colors.primary 
                      }}
                    />
                    <p style={{ fontSize: "13px", fontWeight: "500", margin: 0, color: "#000" }}>
                      {config?.branding.colors.primary}
                    </p>
                  </div>
                </div>
                <div>
                  <p style={{ fontSize: "11px", fontWeight: "bold", marginBottom: "4px", margin: "0 0 4px 0", color: "#666", opacity: 0.8 }}>
                    Homepage Hero
                  </p>
                  <p style={{ fontSize: "14px", fontWeight: "500", margin: 0, color: "#000" }}>
                    {config?.homepage.sections.hero.enabled ? "✓ Enabled" : "✗ Disabled"}
                  </p>
                </div>
                <div>
                  <p style={{ fontSize: "11px", fontWeight: "bold", marginBottom: "4px", margin: "0 0 4px 0", color: "#666", opacity: 0.8 }}>
                    Features Enabled
                  </p>
                  <p style={{ fontSize: "14px", fontWeight: "500", margin: 0, color: "#000" }}>
                    {Object.values(config?.features ?? {}).filter(Boolean).length} / {Object.keys(config?.features ?? {}).length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div 
          style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "16px"
          }}
        >
          <ConfigCard
            title="Store Info"
            href={`/${channelSlug}/store`}
            summary="Core store identity"
            status={config?.store?.name ? "ready" : "attention"}
            icon="🏪"
            items={[
              { label: "Name", value: config?.store.name || "Not set" },
              { label: "Email", value: config?.store.email || "Not set" },
              { label: "Type", value: config?.store.type || "physical" },
            ]}
          />

          <ConfigCard
            title="Branding"
            href={`/${channelSlug}/branding`}
            summary="Logo, colors, and typography"
            status={config?.branding?.logo ? "ready" : "attention"}
            icon="🎨"
            items={[
              { label: "Primary Color", value: config?.branding.colors.primary, isColor: true },
              { label: "Border Radius", value: config?.branding.style.borderRadius },
              { label: "Button Style", value: config?.branding.style.buttonStyle },
            ]}
          />

          <ConfigCard
            title="Localization"
            href={`/${channelSlug}/store`}
            summary="Locale and regional settings"
            status={config?.localization?.defaultLocale ? "ready" : "attention"}
            icon="🌍"
            items={[
              { label: "Locale", value: config?.localization.defaultLocale || "en-US" },
              { label: "Direction", value: config?.localization.direction || "auto" },
              { label: "Time Format", value: config?.localization.timeFormat || "12h" },
            ]}
          />

          <ConfigCard
            title="Dark Mode"
            href={`/${channelSlug}/store`}
            summary="Theme behavior"
            status={config?.darkMode?.enabled ? "ready" : "attention"}
            icon="🌙"
            items={[
              { label: "Enabled", value: config?.darkMode?.enabled ? "Yes" : "No" },
              { label: "Auto (System)", value: config?.darkMode?.auto ? "Yes" : "No" },
              { label: "Dark BG", value: config?.darkMode?.colors?.background || "#0f172a", isColor: true },
            ]}
          />

          <ConfigCard
            title="Features"
            href={`/${channelSlug}/features`}
            summary="Customer experience switches"
            status={config?.features ? "ready" : "attention"}
            icon="⚡"
            items={[
              { label: "Wishlist", value: config?.features.wishlist ? "Enabled" : "Disabled" },
              { label: "Reviews", value: config?.features.productReviews ? "Enabled" : "Disabled" },
              { label: "Newsletter", value: config?.features.newsletter ? "Enabled" : "Disabled" },
            ]}
          />

          <ConfigCard
            title="Homepage"
            href={`/${channelSlug}/homepage`}
            summary="Sections and layout"
            status={config?.homepage ? "ready" : "attention"}
            icon="🏠"
            items={[
              { label: "Hero", value: config?.homepage.sections.hero.enabled ? "Enabled" : "Disabled" },
              { label: "New Arrivals", value: config?.homepage.sections.newArrivals.enabled ? "Enabled" : "Disabled" },
              { label: "Best Sellers", value: config?.homepage.sections.bestSellers.enabled ? "Enabled" : "Disabled" },
            ]}
          />

          <ConfigCard
            title="Filters"
            href={`/${channelSlug}/filters`}
            summary="Product discovery"
            status={config?.filters ? "ready" : "attention"}
            icon="🔍"
            items={[
              { label: "Price Filter", value: config?.filters.priceFilter.enabled ? "Enabled" : "Disabled" },
              { label: "Quick Filters", value: config?.quickFilters.enabled ? "Enabled" : "Disabled" },
              { label: "Category Limit", value: String(config?.quickFilters.categoryLimit || 8) },
            ]}
          />

          <ConfigCard
            title="UI Components"
            href={`/${channelSlug}/ui-components`}
            summary="Buttons, cards, and inputs"
            status={config?.ui ? "ready" : "attention"}
            icon="🎨"
            items={[
              { label: "Button Radius", value: config?.ui?.buttons?.borderRadius || "md" },
              { label: "Sale Badge Radius", value: config?.ui?.badges?.sale?.borderRadius || "sm" },
              { label: "Toast Position", value: config?.ui?.toasts?.position || "bottom-right" },
            ]}
          />

          <ConfigCard
            title="Content"
            href={`/${channelSlug}/content`}
            summary="Storefront copy"
            status={config?.content ? "ready" : "attention"}
            icon="📝"
            items={[
              { label: "Cart Button", value: config?.content?.cart?.checkoutButton || "Checkout" },
              { label: "Sign In", value: config?.content?.account?.signInTitle || "Sign In" },
              { label: "Add to Cart", value: config?.content?.product?.addToCartButton || "Add to Cart" },
            ]}
          />

          <ConfigCard
            title="Pages"
            href={`/${channelSlug}/pages`}
            summary="Static pages"
            status={config?.pages ? "ready" : "attention"}
            icon="📄"
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
            icon="🔗"
            items={[
              { label: "Google Analytics", value: config?.integrations.analytics.googleAnalyticsId ? "Configured" : "Not set" },
              { label: "Facebook", value: config?.integrations.social.facebook ? "Set" : "Not set" },
              { label: "Instagram", value: config?.integrations.social.instagram ? "Set" : "Not set" },
            ]}
          />

          <ConfigCard
            title="SEO"
            href={`/${channelSlug}/seo`}
            summary="Search and sharing"
            status={config?.seo ? "ready" : "attention"}
            icon="🔎"
            items={[
              { label: "Title Template", value: config?.seo.titleTemplate ? "Set" : "Not set" },
              { label: "Default Title", value: config?.seo.defaultTitle ? "Set" : "Not set" },
              { label: "OG Image", value: config?.seo.defaultImage ? "Set" : "Not set" },
            ]}
          />
        </div>
      </div>
    </AppLayout>
  );

};

interface ConfigCardProps {
  title: string;
  href: string;
  summary?: string;
  status?: "ready" | "attention";
  items: { label: string; value: string; isColor?: boolean }[];
  icon?: string;
}

function ConfigCard({ title, href, summary, status = "ready", items, icon }: ConfigCardProps) {
  return (
    <Link href={href} passHref legacyBehavior>
      <a
        style={{ 
          backgroundColor: "#fff",
          borderRadius: "6px",
          padding: "20px",
          border: "1px solid #ddd",
          cursor: "pointer",
          textDecoration: "none",
          display: "block",
          transition: "all 0.2s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = "#2563EB";
          e.currentTarget.style.transform = "translateY(-2px)";
          e.currentTarget.style.boxShadow = "0 4px 8px rgba(0,0,0,0.1)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "#ddd";
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "none";
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", flex: 1 }}>
            {icon && (
              <div
                style={{
                  padding: "8px",
                  borderRadius: "4px",
                  backgroundColor: "#E3F2FD",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minWidth: "36px",
                  height: "36px"
                }}
              >
                <span style={{ fontSize: "18px" }}>
                  {icon}
                </span>
              </div>
            )}
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: "16px", fontWeight: "bold", marginBottom: "8px", margin: "0 0 8px 0", color: "#000" }}>
                {title}
              </h3>
              {summary && (
                <p style={{ fontSize: "13px", color: "#666", margin: 0 }}>
                  {summary}
                </p>
              )}
            </div>
          </div>
          <div
            style={{
              padding: "4px 10px",
              borderRadius: "4px",
              backgroundColor: status === "attention" ? "#FFF3CD" : "#D1E7DD",
              marginLeft: "8px"
            }}
          >
            <span 
              style={{ 
                fontSize: "11px", 
                fontWeight: "bold",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                color: status === "attention" ? "#856404" : "#0F5132"
              }}
            >
              {status === "attention" ? "⚠ Review" : "✓ Ready"}
            </span>
          </div>
        </div>
        <div 
          style={{ 
            display: "flex", 
            flexDirection: "column", 
            gap: "10px",
            paddingTop: "16px",
            borderTop: "1px solid #ddd"
          }}
        >
          {items.map((item) => (
            <div 
              key={item.label} 
              style={{ 
                display: "flex", 
                justifyContent: "space-between", 
                alignItems: "center",
                padding: "4px 0"
              }}
            >
              <span style={{ fontSize: "13px", color: "#666" }}>{item.label}</span>
              {item.isColor ? (
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div
                    style={{
                      width: "20px",
                      height: "20px",
                      borderRadius: "4px",
                      backgroundColor: item.value,
                      border: "1px solid #ddd"
                    }}
                  />
                  <span style={{ fontSize: "12px", fontWeight: "500", color: "#000" }}>{item.value}</span>
                </div>
              ) : (
                <span style={{ fontSize: "13px", fontWeight: "500", color: "#000" }}>{item.value}</span>
              )}
            </div>
          ))}
        </div>
      </a>
    </Link>
  );
}


export default ChannelIndexPage;
