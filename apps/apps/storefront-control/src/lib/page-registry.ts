import type { LucideIcon } from "lucide-react";
import {
  CreditCard,
  FileText,
  Globe,
  Home,
  KeyRound,
  LayoutDashboard,
  Package,
  Paintbrush,
  PanelTop,
  Palette,
  ShoppingBag,
  ShoppingCart,
  User,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface BlockDefinition {
  id: string;
  title: string;
  description: string;
  /** Config section paths this block reads/writes */
  configPaths: string[];
  /** Optional feature toggle path (e.g., "features.wishlist") */
  togglePath?: string;
  /** Icon for the block card */
  icon: LucideIcon;
}

export interface PageDefinition {
  id: string;
  label: string;
  icon: LucideIcon;
  href: (channelSlug: string) => string;
  /** Group for sidebar rendering */
  group: "pages" | "global";
  /** Blocks that appear on this page */
  blocks: BlockDefinition[];
  /** Short description for dashboard cards */
  summary: string;
}

// ---------------------------------------------------------------------------
// Page Definitions
// ---------------------------------------------------------------------------

export const PAGE_REGISTRY: PageDefinition[] = [
  // ---- Pages Group ----
  {
    id: "homepage",
    label: "Homepage",
    icon: Home,
    href: (s) => `/${s}/homepage`,
    group: "pages",
    summary: "Sections, layout, and ordering",
    blocks: [
      { id: "hero", title: "Hero", description: "Main hero banner with CTA", configPaths: ["homepage.sections.hero"], togglePath: "homepage.sections.hero.enabled", icon: Home },
      { id: "trustStrip", title: "Trust Strip", description: "Trust badges and guarantees", configPaths: ["homepage.sections.trustStrip"], togglePath: "homepage.sections.trustStrip.enabled", icon: Home },
      { id: "marquee", title: "Marquee", description: "Scrolling announcement text", configPaths: ["homepage.sections.marquee"], togglePath: "homepage.sections.marquee.enabled", icon: Home },
      { id: "brandGrid", title: "Brand Grid", description: "Partner brand logos", configPaths: ["homepage.sections.brandGrid"], togglePath: "homepage.sections.brandGrid.enabled", icon: Home },
      { id: "categories", title: "Categories", description: "Category showcase section", configPaths: ["homepage.sections.categories"], togglePath: "homepage.sections.categories.enabled", icon: Home },
      { id: "trending", title: "Trending Products", description: "Popular and trending items", configPaths: ["homepage.sections.trending"], togglePath: "homepage.sections.trending.enabled", icon: Home },
      { id: "promotionBanner", title: "Promo Banner", description: "Promotional banner", configPaths: ["homepage.sections.promotionBanner"], togglePath: "homepage.sections.promotionBanner.enabled", icon: Home },
      { id: "flashDeals", title: "Flash Deals", description: "Time-limited deals", configPaths: ["homepage.sections.flashDeals"], togglePath: "homepage.sections.flashDeals.enabled", icon: Home },
      { id: "collectionMosaic", title: "Collection Mosaic", description: "Featured collection grid", configPaths: ["homepage.sections.collectionMosaic"], togglePath: "homepage.sections.collectionMosaic.enabled", icon: Home },
      { id: "bestSellers", title: "Best Sellers", description: "Top-selling products", configPaths: ["homepage.sections.bestSellers"], togglePath: "homepage.sections.bestSellers.enabled", icon: Home },
      { id: "customerFeedback", title: "Customer Feedback", description: "Testimonials and reviews", configPaths: ["homepage.sections.customerFeedback"], togglePath: "homepage.sections.customerFeedback.enabled", icon: Home },
      { id: "newsletter", title: "Newsletter", description: "Email signup section", configPaths: ["homepage.sections.newsletter"], togglePath: "homepage.sections.newsletter.enabled", icon: Home },
    ],
  },
  {
    id: "product-listing",
    label: "Product Listing",
    icon: Package,
    href: (s) => `/${s}/product-listing`,
    group: "pages",
    summary: "Filters, grid, and listing text",
    blocks: [
      { id: "filters", title: "Sidebar Filters", description: "Filter panel configuration", configPaths: ["filters"], togglePath: "filters.enabled", icon: Package },
      { id: "quickFilters", title: "Quick Filters", description: "Quick filter chips above grid", configPaths: ["quickFilters"], togglePath: "quickFilters.enabled", icon: Package },
      { id: "productGrid", title: "Product Grid", description: "Grid layout and card settings", configPaths: ["design", "ui.productCard", "cardOverrides.plp"], icon: Package },
      { id: "listingText", title: "Listing Text", description: "Labels and copy for product listings", configPaths: ["content.productListing"], icon: FileText },
    ],
  },
  {
    id: "product-detail",
    label: "Product Detail",
    icon: ShoppingBag,
    href: (s) => `/${s}/product-detail`,
    group: "pages",
    summary: "Gallery, reviews, related products",
    blocks: [
      { id: "gallery", title: "Image Gallery", description: "Product image display settings", configPaths: ["features"], icon: ShoppingBag },
      { id: "attributes", title: "Attributes & Variants", description: "Variant selector and attributes display", configPaths: ["features"], icon: ShoppingBag },
      { id: "productTabs", title: "Product Tabs", description: "Description, specs, and reviews tabs", configPaths: ["features"], icon: ShoppingBag },
      { id: "reviews", title: "Reviews", description: "Product reviews configuration", configPaths: ["features"], togglePath: "features.productReviews", icon: ShoppingBag },
      { id: "relatedProducts", title: "Related Products", description: "Related products carousel", configPaths: ["relatedProducts", "cardOverrides.relatedProducts"], icon: ShoppingBag },
      { id: "stockAlerts", title: "Stock Alerts", description: "Back-in-stock notifications", configPaths: ["features"], togglePath: "features.stockAlerts", icon: ShoppingBag },
      { id: "trustBadges", title: "Trust Badges", description: "Product page trust signals", configPaths: ["features"], icon: ShoppingBag },
      { id: "pdpText", title: "Product Detail Text", description: "Labels and copy for product pages", configPaths: ["content.productDetail"], icon: FileText },
    ],
  },
  {
    id: "cart",
    label: "Cart",
    icon: ShoppingCart,
    href: (s) => `/${s}/cart`,
    group: "pages",
    summary: "Cart behavior, shipping bar, promos",
    blocks: [
      { id: "cartBehavior", title: "Cart Behavior", description: "Drawer vs page, display options", configPaths: ["ui.cart"], icon: ShoppingCart },
      { id: "freeShipping", title: "Free Shipping Bar", description: "Shipping threshold progress bar", configPaths: ["ecommerce.shipping"], icon: ShoppingCart },
      { id: "promoCodes", title: "Promo Codes", description: "Promo code input and popup", configPaths: ["promoPopup"], togglePath: "promoPopup.enabled", icon: ShoppingCart },
      { id: "cartText", title: "Cart Text", description: "Labels and copy for cart page", configPaths: ["content.cart"], icon: FileText },
    ],
  },
  {
    id: "checkout",
    label: "Checkout",
    icon: CreditCard,
    href: (s) => `/${s}/checkout`,
    group: "pages",
    summary: "Steps, payment, confirmation",
    blocks: [
      { id: "checkoutUi", title: "Checkout UI", description: "Accordion layout and theming", configPaths: ["checkoutUi"], icon: CreditCard },
      { id: "guestCheckout", title: "Guest Checkout", description: "Allow checkout without account", configPaths: ["features"], togglePath: "features.guestCheckout", icon: CreditCard },
      { id: "expressCheckout", title: "Express Checkout", description: "Quick checkout options", configPaths: ["features"], togglePath: "features.expressCheckout", icon: CreditCard },
      { id: "checkoutText", title: "Checkout Text", description: "Labels and copy for checkout", configPaths: ["content.checkout"], icon: FileText },
      { id: "confirmation", title: "Order Confirmation", description: "Post-purchase confirmation page", configPaths: ["content.checkout"], icon: CreditCard },
    ],
  },
  {
    id: "account",
    label: "Account",
    icon: User,
    href: (s) => `/${s}/account`,
    group: "pages",
    summary: "Dashboard, orders, addresses, settings",
    blocks: [
      { id: "accountDashboard", title: "Dashboard Text", description: "Account overview text", configPaths: ["content.account"], icon: User },
      { id: "ordersText", title: "Orders Text", description: "Order list and detail labels", configPaths: ["content.orders"], icon: User },
      { id: "orderTracking", title: "Order Tracking", description: "Track order feature", configPaths: ["features", "content.orderTracking"], togglePath: "features.orderTracking", icon: User },
      { id: "addressesText", title: "Addresses Text", description: "Address management labels", configPaths: ["content.addresses"], icon: User },
      { id: "wishlistText", title: "Wishlist Text", description: "Wishlist labels and messages", configPaths: ["content.wishlist"], togglePath: "features.wishlist", icon: User },
      { id: "settingsText", title: "Settings Text", description: "Account settings labels", configPaths: ["content.settings"], icon: User },
      { id: "accountFeatures", title: "Account Features", description: "Feature toggles for account", configPaths: ["features"], icon: User },
    ],
  },
  {
    id: "auth-pages",
    label: "Auth Pages",
    icon: KeyRound,
    href: (s) => `/${s}/auth-pages`,
    group: "pages",
    summary: "Sign in, sign up, password reset",
    blocks: [
      { id: "signInText", title: "Sign In Text", description: "Sign-in page labels and messages", configPaths: ["content.account"], icon: KeyRound },
      { id: "signUpText", title: "Sign Up Text", description: "Registration page labels", configPaths: ["content.account"], icon: KeyRound },
      { id: "forgotPasswordText", title: "Forgot Password", description: "Password reset page text", configPaths: ["content.account"], icon: KeyRound },
      { id: "authFeatures", title: "Auth Features", description: "Social login, guest checkout", configPaths: ["features"], icon: KeyRound },
    ],
  },
  {
    id: "layout-config",
    label: "Layout",
    icon: PanelTop,
    href: (s) => `/${s}/layout-config`,
    group: "pages",
    summary: "Header, footer, navigation",
    blocks: [
      { id: "headerBanner", title: "Header Banner", description: "Top announcement banner", configPaths: ["header.banner"], togglePath: "header.banner.enabled", icon: PanelTop },
      { id: "headerNav", title: "Logo & Navigation", description: "Logo position, nav layout", configPaths: ["header"], icon: PanelTop },
      { id: "footer", title: "Footer", description: "Footer sections and links", configPaths: ["footer"], icon: PanelTop },
      { id: "footerText", title: "Footer Text", description: "Footer labels and copy", configPaths: ["content.footer"], icon: FileText },
      { id: "navbarText", title: "Navbar Text", description: "Navigation labels", configPaths: ["content.navbar"], icon: FileText },
      { id: "cookieConsent", title: "Cookie Consent", description: "Cookie banner configuration", configPaths: ["content.cookieConsent"], icon: PanelTop },
    ],
  },
  {
    id: "static-pages",
    label: "Static Pages",
    icon: FileText,
    href: (s) => `/${s}/static-pages`,
    group: "pages",
    summary: "Contact, FAQ, error pages",
    blocks: [
      { id: "pageToggles", title: "Page Toggles", description: "Enable/disable static pages", configPaths: ["pages"], icon: FileText },
      { id: "contactContent", title: "Contact Page", description: "Contact form and info", configPaths: ["content.contact", "pages.contact"], icon: FileText },
      { id: "faqContent", title: "FAQ Page", description: "FAQ content and layout", configPaths: ["content.faq", "pages.faq"], icon: FileText },
      { id: "errorText", title: "Error Pages", description: "404 and error page text", configPaths: ["content.error"], icon: FileText },
    ],
  },

  // ---- Global Group ----
  {
    id: "global",
    label: "Global Design",
    icon: Palette,
    href: (s) => `/${s}/global`,
    group: "global",
    summary: "Branding, typography, design tokens",
    blocks: [
      { id: "storeIdentity", title: "Store Identity", description: "Name, description, logo", configPaths: ["store"], icon: Globe },
      { id: "branding", title: "Branding", description: "Colors, typography, logos", configPaths: ["branding"], icon: Palette },
      { id: "uiComponents", title: "UI Components", description: "Buttons, badges, inputs, cards", configPaths: ["ui"], icon: Palette },
      { id: "designTokens", title: "Design Tokens", description: "Animations, spacing, grid", configPaths: ["design"], icon: Palette },
      { id: "darkMode", title: "Dark Mode", description: "Dark theme configuration", configPaths: ["darkMode"], icon: Palette },
      { id: "seo", title: "SEO", description: "Meta tags, open graph, sitemap", configPaths: ["seo"], icon: Globe },
      { id: "localization", title: "Localization", description: "Language, RTL, locale", configPaths: ["localization"], icon: Globe },
      { id: "integrations", title: "Integrations", description: "Analytics, tracking, third-party", configPaths: ["integrations"], icon: Globe },
      { id: "features", title: "Features", description: "Feature toggle switches", configPaths: ["features"], icon: Globe },
    ],
  },
  {
    id: "component-designer",
    label: "Component Designer",
    icon: Paintbrush,
    href: (s) => `/${s}/component-designer`,
    group: "global",
    summary: "Visual style overrides per component",
    blocks: [
      { id: "componentOverrides", title: "Component Overrides", description: "Per-component visual overrides (colors, typography, spacing)", configPaths: ["componentOverrides"], icon: Paintbrush },
    ],
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function getPageById(id: string): PageDefinition | undefined {
  return PAGE_REGISTRY.find((p) => p.id === id);
}

export interface NavItem {
  label: string;
  icon: LucideIcon;
  href: string;
  page: string;
}

export function getNavItems(channelSlug: string): {
  dashboard: NavItem;
  pages: NavItem[];
  global: NavItem[];
} {
  const pages: NavItem[] = [];
  const global: NavItem[] = [];

  for (const page of PAGE_REGISTRY) {
    const item: NavItem = {
      label: page.label,
      icon: page.icon,
      href: page.href(channelSlug),
      page: page.id,
    };

    if (page.group === "pages") {
      pages.push(item);
    } else {
      global.push(item);
    }
  }

  return {
    dashboard: {
      label: "Dashboard",
      icon: LayoutDashboard,
      href: `/${channelSlug}`,
      page: "dashboard",
    },
    pages,
    global,
  };
}
