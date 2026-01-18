import { Box, Text, Button } from "@saleor/macaw-ui";
import Link from "next/link";
import { useRouter } from "next/router";
import { ReactNode } from "react";

interface Tab {
  id: string;
  label: string;
  href: string;
}

interface AppLayoutProps {
  channelSlug: string;
  channelName?: string;
  children: ReactNode;
  activeTab?: string;
}

const tabs: Omit<Tab, "href">[] = [
  { id: "store", label: "🏪 Store" },
  { id: "branding", label: "🎨 Branding" },
  { id: "header", label: "📢 Header" },
  { id: "footer", label: "📋 Footer" },
  { id: "features", label: "⚡ Features" },
  { id: "homepage", label: "🏠 Homepage" },
  { id: "promoPopup", label: "🎯 Promo Popup" },
  { id: "filters", label: "🔍 Filters" },
  { id: "ui-components", label: "🎛️ UI Components" },
  { id: "content", label: "📝 Content" },
  { id: "pages", label: "📄 Pages" },
  { id: "integrations", label: "🔗 Integrations" },
  { id: "seo", label: "📈 SEO" },
];

export function AppLayout({ channelSlug, channelName, children, activeTab }: AppLayoutProps) {
  const router = useRouter();

  return (
    <Box>
      {/* Header */}
      <Box marginBottom={6}>
        <Box display="flex" alignItems="center" gap={2} marginBottom={2}>
          <Link href="/" passHref legacyBehavior>
            <Button variant="tertiary" size="small">
              ← Back
            </Button>
          </Link>
        </Box>
        <Text as="h1" variant="hero">
          {channelName || channelSlug}
        </Text>
        <Text as="p" color="default2">
          Configure storefront settings for this channel
        </Text>
      </Box>

      {/* Navigation Tabs */}
      <Box 
        display="flex" 
        gap={1} 
        marginBottom={6}
        overflowX="auto"
        paddingBottom={2}
        flexWrap="wrap"
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          // Handle special case for promo-popup (file uses hyphen, id uses camelCase)
          const href = tab.id === "promoPopup" 
            ? `/${channelSlug}/promo-popup`
            : `/${channelSlug}/${tab.id}`;
          return (
            <Link 
              key={tab.id} 
              href={href}
              passHref
              legacyBehavior
            >
              <Button
                variant={isActive ? "primary" : "tertiary"}
                size="small"
              >
                {tab.label}
              </Button>
            </Link>
          );
        })}
      </Box>

      {/* Content */}
      <Box>{children}</Box>
    </Box>
  );
}
