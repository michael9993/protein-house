import Link from "next/link";
import { useRouter } from "next/router";
import React, { ReactNode, useMemo, useState } from "react";

import { settingsSearchIndex } from "@/modules/ui/settings-index";
import { SettingsSearchProvider } from "@/modules/ui/section-card";

interface NavItem {
  id: string;
  label: string;
  description: string;
  href: (channelSlug: string) => string;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

interface AppLayoutProps {
  channelSlug: string;
  channelName?: string;
  children: ReactNode;
  activeTab?: string;
  enablePageSearch?: boolean;
}

const navGroups: NavGroup[] = [
  {
    title: "Overview",
    items: [
      {
        id: "overview",
        label: "Configuration Overview",
        description: "Summary and quick actions",
        href: (channelSlug) => `/${channelSlug}`,
      },
    ],
  },
  {
    title: "Foundation",
    items: [
      {
        id: "store",
        label: "Store",
        description: "Identity, localization, and dark mode",
        href: (channelSlug) => `/${channelSlug}/store`,
      },
      {
        id: "branding",
        label: "Branding",
        description: "Logo, colors, and typography",
        href: (channelSlug) => `/${channelSlug}/branding`,
      },
      {
        id: "header",
        label: "Header",
        description: "Banner and navigation layout",
        href: (channelSlug) => `/${channelSlug}/header`,
      },
      {
        id: "footer",
        label: "Footer",
        description: "Newsletter and footer content",
        href: (channelSlug) => `/${channelSlug}/footer`,
      },
    ],
  },
  {
    title: "Experience",
    items: [
      {
        id: "features",
        label: "Features",
        description: "Storefront capabilities",
        href: (channelSlug) => `/${channelSlug}/features`,
      },
      {
        id: "homepage",
        label: "Homepage",
        description: "Sections and layout",
        href: (channelSlug) => `/${channelSlug}/homepage`,
      },
      {
        id: "promoPopup",
        label: "Promo Popup",
        description: "Promotional modal",
        href: (channelSlug) => `/${channelSlug}/promo-popup`,
      },
      {
        id: "filters",
        label: "Filters",
        description: "Catalog filters and quick filters",
        href: (channelSlug) => `/${channelSlug}/filters`,
      },
      {
        id: "ui-components",
        label: "UI Components",
        description: "Buttons, cards, and inputs",
        href: (channelSlug) => `/${channelSlug}/ui-components`,
      },
      {
        id: "storefront",
        label: "Storefront",
        description: "Cart display and UX settings",
        href: (channelSlug) => `/${channelSlug}/storefront`,
      },
      {
        id: "shipping",
        label: "Shipping",
        description: "Free shipping threshold for cart indication",
        href: (channelSlug) => `/${channelSlug}/shipping`,
      },
    ],
  },
  {
    title: "Content",
    items: [
      {
        id: "content",
        label: "Content",
        description: "Text and messaging",
        href: (channelSlug) => `/${channelSlug}/content`,
      },
      {
        id: "pages",
        label: "Pages",
        description: "Enable or disable pages",
        href: (channelSlug) => `/${channelSlug}/pages`,
      },
    ],
  },
  {
    title: "Marketing",
    items: [
      {
        id: "integrations",
        label: "Integrations",
        description: "Analytics and marketing tools",
        href: (channelSlug) => `/${channelSlug}/integrations`,
      },
      {
        id: "seo",
        label: "SEO",
        description: "Search and social metadata",
        href: (channelSlug) => `/${channelSlug}/seo`,
      },
    ],
  },
];

function normalizeSearchValue(value: string): string {
  return value.trim().toLowerCase();
}

function matchesQuery(query: string, values: string[]): boolean {
  const normalizedQuery = normalizeSearchValue(query);
  if (!normalizedQuery) return true;
  return values.some((value) => normalizeSearchValue(value).includes(normalizedQuery));
}

function AppLayoutContent({
  channelSlug,
  channelName,
  children,
  activeTab,
  globalQuery,
  setGlobalQuery,
  globalResults,
  pageQuery,
  setPageQuery,
  pageSearchEnabled,
}: {
  channelSlug: string;
  channelName?: string;
  children: ReactNode;
  activeTab?: string;
  globalQuery: string;
  setGlobalQuery: (query: string) => void;
  globalResults: typeof settingsSearchIndex;
  pageQuery: string;
  setPageQuery: (query: string) => void;
  pageSearchEnabled: boolean;
}) {
  return (
    <div style={{ padding: "24px" }}>
      <div style={{ marginBottom: "24px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "24px",
          }}
        >
          <div style={{ flex: 1 }}>
            <Link href="/" passHref legacyBehavior>
              <a
                style={{
                  display: "inline-block",
                  padding: "8px 16px",
                  border: "1px solid #ddd",
                  backgroundColor: "#fff",
                  color: "#000",
                  textDecoration: "none",
                  fontSize: "14px",
                  cursor: "pointer",
                  marginBottom: "16px",
                }}
              >
                ← Channels
              </a>
            </Link>
            <h1 style={{ fontSize: "24px", fontWeight: "bold", margin: "16px 0 8px 0" }}>
              {channelName || channelSlug}
            </h1>
            <p style={{ fontSize: "14px", color: "#666", margin: 0 }}>
              Configure storefront experience, content, and design for this channel
            </p>
          </div>
          <div style={{ maxWidth: "300px", width: "100%" }}>
            <input
              type="text"
              value={globalQuery}
              onChange={(event) => setGlobalQuery(event.target.value)}
              placeholder="Search all settings..."
              style={{
                width: "100%",
                padding: "8px 12px",
                border: "1px solid #ddd",
                fontSize: "14px",
              }}
            />
          </div>
        </div>

        {globalResults.length > 0 && (
          <div
            style={{
              padding: "12px",
              marginBottom: "24px",
              border: "1px solid #ddd",
              backgroundColor: "#fff",
            }}
          >
            <p
              style={{
                fontSize: "14px",
                fontWeight: "bold",
                marginBottom: "8px",
                margin: "0 0 8px 0",
              }}
            >
              Search results
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              {globalResults.slice(0, 8).map((entry) => (
                <Link
                  key={`${entry.page}-${entry.sectionId ?? entry.title}`}
                  href={`/${channelSlug}/${entry.page}${entry.sectionId ? `#${entry.sectionId}` : ""}`}
                  passHref
                  legacyBehavior
                >
                  <a
                    style={{
                      display: "inline-block",
                      padding: "6px 12px",
                      border: "1px solid #ddd",
                      backgroundColor: "#fff",
                      color: "#000",
                      textDecoration: "none",
                      fontSize: "13px",
                      cursor: "pointer",
                      width: "fit-content",
                    }}
                  >
                    {entry.title} · {entry.category}
                  </a>
                </Link>
              ))}
              {globalResults.length > 8 && (
                <p style={{ fontSize: "12px", color: "#666", margin: "8px 0 0 0" }}>
                  Showing first 8 matches. Refine your search for more.
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "200px 1fr",
          gap: "24px",
          alignItems: "start",
        }}
      >
        <div
          style={{
            padding: "12px",
            border: "1px solid #ddd",
            backgroundColor: "#fff",
            position: "sticky",
            top: "16px",
            maxHeight: "calc(100vh - 32px)",
            overflowY: "auto",
          }}
        >
          {navGroups.map((group, groupIndex) => (
            <div
              key={group.title}
              style={{ marginBottom: groupIndex < navGroups.length - 1 ? "20px" : 0 }}
            >
              <p
                style={{
                  fontSize: "11px",
                  fontWeight: "bold",
                  color: "#666",
                  marginBottom: "8px",
                  textTransform: "uppercase",
                  margin: "0 0 8px 0",
                }}
              >
                {group.title}
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                {group.items.map((item) => {
                  const isActive = activeTab === item.id;
                  return (
                    <Link key={item.id} href={item.href(channelSlug)} passHref legacyBehavior>
                      <a
                        style={{
                          display: "block",
                          padding: "8px",
                          textDecoration: "none",
                          cursor: "pointer",
                          backgroundColor: isActive ? "#000" : "transparent",
                          color: isActive ? "#fff" : "#000",
                          border: "1px solid #ddd",
                          marginBottom: "4px",
                          fontSize: "13px",
                          fontWeight: isActive ? "bold" : "normal",
                        }}
                      >
                        {item.label}
                      </a>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div>
          {pageSearchEnabled && (
            <div style={{ marginBottom: "16px" }}>
              <input
                type="text"
                value={pageQuery}
                onChange={(event) => setPageQuery(event.target.value)}
                placeholder="Filter settings on this page..."
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid #ddd",
                  fontSize: "14px",
                }}
              />
            </div>
          )}
          {children}
        </div>
      </div>
    </div>
  );
}

export function AppLayout({
  channelSlug,
  channelName,
  children,
  activeTab,
  enablePageSearch = true,
}: AppLayoutProps) {
  const router = useRouter();
  const [globalQuery, setGlobalQuery] = useState("");
  const [pageQuery, setPageQuery] = useState("");

  const globalResults = useMemo(() => {
    if (!globalQuery.trim()) return [];
    return settingsSearchIndex.filter((entry) =>
      matchesQuery(globalQuery, [entry.title, entry.description ?? "", ...entry.keywords]),
    );
  }, [globalQuery]);

  const pageSearchEnabled = Boolean(enablePageSearch && activeTab && activeTab !== "overview");

  return (
    <SettingsSearchProvider query={pageQuery}>
      <AppLayoutContent
        channelSlug={channelSlug}
        channelName={channelName}
        activeTab={activeTab}
        globalQuery={globalQuery}
        setGlobalQuery={setGlobalQuery}
        globalResults={globalResults}
        pageQuery={pageQuery}
        setPageQuery={setPageQuery}
        pageSearchEnabled={Boolean(pageSearchEnabled)}
      >
        {children}
      </AppLayoutContent>
    </SettingsSearchProvider>
  );
}
