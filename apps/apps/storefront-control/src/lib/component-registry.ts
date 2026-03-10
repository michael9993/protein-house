import type { LucideIcon } from "lucide-react";
import {
  Home,
  Image,
  ShoppingBag,
  Package,
  ShoppingCart,
  CreditCard,
  PanelTop,
  Star,
  Megaphone,
  Zap,
  LayoutGrid,
  Award,
  MessageSquare,
  Mail,
  Sparkles,
  Filter,
  Tags,
  SlidersHorizontal,
  GalleryHorizontal,
  Smartphone,
  Search,
  Bell,
  Grid3X3,
  Layers,
  ClipboardList,
  MapPin,
  Heart,
  Settings,
  KeyRound,
  Lock,
  CheckCircle,
  Receipt,
  FileText,
  ListOrdered,
  ArrowDownUp,
  Clock,
  Cookie,
  Navigation,
  Megaphone as MegaphoneAlt,
} from "lucide-react";
import type { ComponentStyleOverride } from "@saleor/apps-storefront-config";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ComponentRegistryEntry {
  /** Unique component ID used as key in componentOverrides record */
  id: string;
  /** Human-readable label */
  label: string;
  /** Lucide icon */
  icon: LucideIcon;
  /** PAGE_REGISTRY page ID this component belongs to */
  page: string;
  /** Optional sub-group within the page */
  group?: string;
  /** Which style properties this component supports */
  supportedProperties: (keyof ComponentStyleOverride)[];
  /** Key used in the componentOverrides config record */
  configKey: string;
}

// ---------------------------------------------------------------------------
// Shared property sets (avoid repeating long arrays)
// ---------------------------------------------------------------------------

const VISUAL_PROPS: (keyof ComponentStyleOverride)[] = [
  "backgroundColor", "backgroundStyle", "backgroundSecondaryColor", "gradientDirection",
  "textColor", "borderColor", "borderWidth",
  "borderRadius", "shadow", "opacity",
];

const TYPOGRAPHY_PROPS: (keyof ComponentStyleOverride)[] = [
  "fontFamily", "fontSize", "fontWeight", "textTransform",
];

const LAYOUT_PROPS: (keyof ComponentStyleOverride)[] = [
  "padding", "margin", "gap",
];

const HOVER_PROPS: (keyof ComponentStyleOverride)[] = [
  "hoverBackgroundColor", "hoverTextColor", "hoverShadow",
];

const ALL_PROPS: (keyof ComponentStyleOverride)[] = [
  ...VISUAL_PROPS, ...TYPOGRAPHY_PROPS, ...LAYOUT_PROPS, ...HOVER_PROPS, "customClasses",
];

const SECTION_PROPS: (keyof ComponentStyleOverride)[] = [
  ...VISUAL_PROPS, ...TYPOGRAPHY_PROPS, ...LAYOUT_PROPS, "customClasses",
];

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

export const COMPONENT_REGISTRY: ComponentRegistryEntry[] = [
  // ---- Homepage ----
  {
    id: "homepage.hero",
    label: "Hero Banner",
    icon: Home,
    page: "homepage",
    group: "Sections",
    supportedProperties: ALL_PROPS,
    configKey: "homepage.hero",
  },
  {
    id: "homepage.trustStrip",
    label: "Trust Strip",
    icon: Award,
    page: "homepage",
    group: "Sections",
    supportedProperties: SECTION_PROPS,
    configKey: "homepage.trustStrip",
  },
  {
    id: "homepage.marquee",
    label: "Marquee",
    icon: Megaphone,
    page: "homepage",
    group: "Sections",
    supportedProperties: SECTION_PROPS,
    configKey: "homepage.marquee",
  },
  {
    id: "homepage.categories",
    label: "Categories",
    icon: LayoutGrid,
    page: "homepage",
    group: "Sections",
    supportedProperties: SECTION_PROPS,
    configKey: "homepage.categories",
  },
  {
    id: "homepage.trending",
    label: "Trending Products",
    icon: Sparkles,
    page: "homepage",
    group: "Sections",
    supportedProperties: SECTION_PROPS,
    configKey: "homepage.trending",
  },
  {
    id: "homepage.promotionBanner",
    label: "Promo Banner",
    icon: Megaphone,
    page: "homepage",
    group: "Sections",
    supportedProperties: ALL_PROPS,
    configKey: "homepage.promotionBanner",
  },
  {
    id: "homepage.flashDeals",
    label: "Flash Deals",
    icon: Zap,
    page: "homepage",
    group: "Sections",
    supportedProperties: SECTION_PROPS,
    configKey: "homepage.flashDeals",
  },
  {
    id: "homepage.collectionMosaic",
    label: "Collection Mosaic",
    icon: LayoutGrid,
    page: "homepage",
    group: "Sections",
    supportedProperties: SECTION_PROPS,
    configKey: "homepage.collectionMosaic",
  },
  {
    id: "homepage.bestSellers",
    label: "Best Sellers",
    icon: Star,
    page: "homepage",
    group: "Sections",
    supportedProperties: SECTION_PROPS,
    configKey: "homepage.bestSellers",
  },
  {
    id: "homepage.customerFeedback",
    label: "Customer Feedback",
    icon: MessageSquare,
    page: "homepage",
    group: "Sections",
    supportedProperties: SECTION_PROPS,
    configKey: "homepage.customerFeedback",
  },
  {
    id: "homepage.newsletter",
    label: "Newsletter",
    icon: Mail,
    page: "homepage",
    group: "Sections",
    supportedProperties: SECTION_PROPS,
    configKey: "homepage.newsletter",
  },
  {
    id: "homepage.brandGrid",
    label: "Brand Grid",
    icon: Grid3X3,
    page: "homepage",
    group: "Sections",
    supportedProperties: SECTION_PROPS,
    configKey: "homepage.brandGrid",
  },
  {
    id: "homepage.productCard",
    label: "Homepage Product Card",
    icon: ShoppingBag,
    page: "homepage",
    group: "Cards",
    supportedProperties: ALL_PROPS,
    configKey: "homepage.productCard",
  },

  // ---- Product Listing ----
  {
    id: "plp.filterSidebar",
    label: "Filter Sidebar",
    icon: Filter,
    page: "product-listing",
    group: "Filters",
    supportedProperties: [...VISUAL_PROPS, ...LAYOUT_PROPS, "customClasses"],
    configKey: "plp.filterSidebar",
  },
  {
    id: "plp.activeFiltersTags",
    label: "Active Filters Tags",
    icon: Tags,
    page: "product-listing",
    group: "Filters",
    supportedProperties: [...VISUAL_PROPS, ...HOVER_PROPS, "customClasses"],
    configKey: "plp.activeFiltersTags",
  },
  {
    id: "plp.quickFilters",
    label: "Quick Filters",
    icon: SlidersHorizontal,
    page: "product-listing",
    group: "Filters",
    supportedProperties: [...VISUAL_PROPS, ...HOVER_PROPS, "customClasses"],
    configKey: "plp.quickFilters",
  },
  {
    id: "plp.productGrid",
    label: "Product Grid",
    icon: LayoutGrid,
    page: "product-listing",
    group: "Grid",
    supportedProperties: [...VISUAL_PROPS, ...LAYOUT_PROPS, "customClasses"],
    configKey: "plp.productGrid",
  },
  {
    id: "plp.productCard",
    label: "PLP Product Card",
    icon: ShoppingBag,
    page: "product-listing",
    group: "Grid",
    supportedProperties: ALL_PROPS,
    configKey: "plp.productCard",
  },
  {
    id: "plp.sortBy",
    label: "Sort Dropdown",
    icon: ArrowDownUp,
    page: "product-listing",
    group: "Controls",
    supportedProperties: [...VISUAL_PROPS, ...TYPOGRAPHY_PROPS, "customClasses"],
    configKey: "plp.sortBy",
  },

  // ---- Product Detail ----
  {
    id: "pdp.gallery",
    label: "Product Gallery",
    icon: GalleryHorizontal,
    page: "product-detail",
    group: "Product",
    supportedProperties: [...VISUAL_PROPS, ...LAYOUT_PROPS, "customClasses"],
    configKey: "pdp.gallery",
  },
  {
    id: "pdp.addToCart",
    label: "Add to Cart Button",
    icon: ShoppingCart,
    page: "product-detail",
    group: "Product",
    supportedProperties: ALL_PROPS,
    configKey: "pdp.addToCart",
  },
  {
    id: "pdp.stickyAddToCart",
    label: "Sticky Mobile Add to Cart",
    icon: Smartphone,
    page: "product-detail",
    group: "Product",
    supportedProperties: [...VISUAL_PROPS, ...LAYOUT_PROPS, "customClasses"],
    configKey: "pdp.stickyAddToCart",
  },
  {
    id: "pdp.variantSelector",
    label: "Variant Selector",
    icon: SlidersHorizontal,
    page: "product-detail",
    group: "Product",
    supportedProperties: [...VISUAL_PROPS, ...LAYOUT_PROPS, "customClasses"],
    configKey: "pdp.variantSelector",
  },
  {
    id: "pdp.quantitySelector",
    label: "Quantity Selector",
    icon: SlidersHorizontal,
    page: "product-detail",
    group: "Product",
    supportedProperties: [...VISUAL_PROPS, ...LAYOUT_PROPS, "customClasses"],
    configKey: "pdp.quantitySelector",
  },
  {
    id: "pdp.tabs",
    label: "Product Tabs",
    icon: Layers,
    page: "product-detail",
    group: "Product",
    supportedProperties: SECTION_PROPS,
    configKey: "pdp.tabs",
  },
  {
    id: "pdp.relatedProducts",
    label: "Related Products",
    icon: Package,
    page: "product-detail",
    group: "Product",
    supportedProperties: SECTION_PROPS,
    configKey: "pdp.relatedProducts",
  },

  // ---- Layout ----
  {
    id: "layout.header",
    label: "Header",
    icon: PanelTop,
    page: "layout-config",
    group: "Layout",
    supportedProperties: [...VISUAL_PROPS, ...LAYOUT_PROPS, "customClasses"],
    configKey: "layout.header",
  },
  {
    id: "layout.footer",
    label: "Footer",
    icon: PanelTop,
    page: "layout-config",
    group: "Layout",
    supportedProperties: [...VISUAL_PROPS, ...LAYOUT_PROPS, "customClasses"],
    configKey: "layout.footer",
  },
  {
    id: "layout.headerBanner",
    label: "Header Banner",
    icon: Bell,
    page: "layout-config",
    group: "Layout",
    supportedProperties: [...VISUAL_PROPS, ...TYPOGRAPHY_PROPS, "customClasses"],
    configKey: "layout.headerBanner",
  },
  {
    id: "layout.mobileBottomNav",
    label: "Mobile Bottom Nav",
    icon: Smartphone,
    page: "layout-config",
    group: "Layout",
    supportedProperties: [...VISUAL_PROPS, ...LAYOUT_PROPS, "customClasses"],
    configKey: "layout.mobileBottomNav",
  },
  {
    id: "layout.searchDialog",
    label: "Search Dialog",
    icon: Search,
    page: "layout-config",
    group: "Layout",
    supportedProperties: [...VISUAL_PROPS, ...LAYOUT_PROPS, "customClasses"],
    configKey: "layout.searchDialog",
  },

  // ---- Cart ----
  {
    id: "cart.drawer",
    label: "Cart Drawer",
    icon: ShoppingCart,
    page: "cart",
    group: "Cart",
    supportedProperties: [...VISUAL_PROPS, ...LAYOUT_PROPS, "customClasses"],
    configKey: "cart.drawer",
  },
  {
    id: "cart.page",
    label: "Cart Page",
    icon: ShoppingCart,
    page: "cart",
    group: "Cart",
    supportedProperties: SECTION_PROPS,
    configKey: "cart.page",
  },

  // ---- Checkout ----
  {
    id: "checkout.page",
    label: "Checkout Page",
    icon: CreditCard,
    page: "checkout",
    group: "Checkout",
    supportedProperties: [...VISUAL_PROPS, ...LAYOUT_PROPS, "customClasses"],
    configKey: "checkout.page",
  },
  {
    id: "checkout.summary",
    label: "Checkout Summary",
    icon: Receipt,
    page: "checkout",
    group: "Checkout",
    supportedProperties: [...VISUAL_PROPS, ...LAYOUT_PROPS, "customClasses"],
    configKey: "checkout.summary",
  },
  {
    id: "checkout.placeOrder",
    label: "Place Order Button",
    icon: CheckCircle,
    page: "checkout",
    group: "Checkout",
    supportedProperties: ALL_PROPS,
    configKey: "checkout.placeOrder",
  },
  {
    id: "checkout.contactStep",
    label: "Contact Step",
    icon: Mail,
    page: "checkout",
    group: "Steps",
    supportedProperties: SECTION_PROPS,
    configKey: "checkout.contactStep",
  },
  {
    id: "checkout.shippingStep",
    label: "Shipping Step",
    icon: MapPin,
    page: "checkout",
    group: "Steps",
    supportedProperties: SECTION_PROPS,
    configKey: "checkout.shippingStep",
  },
  {
    id: "checkout.deliveryStep",
    label: "Delivery Step",
    icon: Package,
    page: "checkout",
    group: "Steps",
    supportedProperties: SECTION_PROPS,
    configKey: "checkout.deliveryStep",
  },
  {
    id: "checkout.paymentStep",
    label: "Payment Step",
    icon: CreditCard,
    page: "checkout",
    group: "Steps",
    supportedProperties: SECTION_PROPS,
    configKey: "checkout.paymentStep",
  },
  {
    id: "checkout.confirmation",
    label: "Order Confirmation",
    icon: CheckCircle,
    page: "checkout",
    group: "Confirmation",
    supportedProperties: SECTION_PROPS,
    configKey: "checkout.confirmation",
  },

  // ---- Account ----
  {
    id: "account.dashboard",
    label: "Account Dashboard",
    icon: Layers,
    page: "account",
    group: "Account",
    supportedProperties: SECTION_PROPS,
    configKey: "account.dashboard",
  },
  {
    id: "account.orders",
    label: "Orders List",
    icon: ListOrdered,
    page: "account",
    group: "Account",
    supportedProperties: SECTION_PROPS,
    configKey: "account.orders",
  },
  {
    id: "account.addresses",
    label: "Addresses",
    icon: MapPin,
    page: "account",
    group: "Account",
    supportedProperties: SECTION_PROPS,
    configKey: "account.addresses",
  },
  {
    id: "account.wishlist",
    label: "Wishlist",
    icon: Heart,
    page: "account",
    group: "Account",
    supportedProperties: SECTION_PROPS,
    configKey: "account.wishlist",
  },
  {
    id: "account.settings",
    label: "Account Settings",
    icon: Settings,
    page: "account",
    group: "Account",
    supportedProperties: SECTION_PROPS,
    configKey: "account.settings",
  },

  // ---- Auth ----
  {
    id: "auth.login",
    label: "Login Page",
    icon: KeyRound,
    page: "auth-pages",
    group: "Auth",
    supportedProperties: SECTION_PROPS,
    configKey: "auth.login",
  },
  {
    id: "auth.forgotPassword",
    label: "Forgot Password",
    icon: Lock,
    page: "auth-pages",
    group: "Auth",
    supportedProperties: SECTION_PROPS,
    configKey: "auth.forgotPassword",
  },

  // ---- UI Components (Global) ----
  {
    id: "ui.productCard",
    label: "Product Card",
    icon: ShoppingBag,
    page: "global",
    group: "Components",
    supportedProperties: ALL_PROPS,
    configKey: "ui.productCard",
  },
  {
    id: "ui.badges",
    label: "Badges",
    icon: Star,
    page: "global",
    group: "Components",
    supportedProperties: [...VISUAL_PROPS, ...TYPOGRAPHY_PROPS, "customClasses"],
    configKey: "ui.badges",
  },
  {
    id: "ui.imageOverlay",
    label: "Image Overlay",
    icon: Image,
    page: "global",
    group: "Components",
    supportedProperties: [...VISUAL_PROPS, "opacity", "customClasses"],
    configKey: "ui.imageOverlay",
  },
  {
    id: "ui.breadcrumbs",
    label: "Breadcrumbs",
    icon: Navigation,
    page: "global",
    group: "Components",
    supportedProperties: [...VISUAL_PROPS, ...TYPOGRAPHY_PROPS, "customClasses"],
    configKey: "ui.breadcrumbs",
  },
  {
    id: "ui.cookieConsent",
    label: "Cookie Consent Banner",
    icon: Cookie,
    page: "global",
    group: "Components",
    supportedProperties: [...VISUAL_PROPS, ...TYPOGRAPHY_PROPS, ...LAYOUT_PROPS, "customClasses"],
    configKey: "ui.cookieConsent",
  },
  {
    id: "ui.promoPopup",
    label: "Promo Popup",
    icon: MegaphoneAlt,
    page: "global",
    group: "Components",
    supportedProperties: ALL_PROPS,
    configKey: "ui.promoPopup",
  },

  // ---- PDP (additional) ----
  {
    id: "pdp.recentlyViewed",
    label: "Recently Viewed Products",
    icon: Clock,
    page: "product-detail",
    group: "Product",
    supportedProperties: SECTION_PROPS,
    configKey: "pdp.recentlyViewed",
  },

  // ---- Side Drawers ----
  {
    id: "cart.wishlistDrawer",
    label: "Wishlist Drawer",
    icon: Heart,
    page: "cart",
    group: "Drawers",
    supportedProperties: [...VISUAL_PROPS, ...LAYOUT_PROPS, "customClasses"],
    configKey: "cart.wishlistDrawer",
  },
  {
    id: "cart.recentlyViewedDrawer",
    label: "Recently Viewed Drawer",
    icon: Clock,
    page: "cart",
    group: "Drawers",
    supportedProperties: [...VISUAL_PROPS, ...LAYOUT_PROPS, "customClasses"],
    configKey: "cart.recentlyViewedDrawer",
  },
];

// ---------------------------------------------------------------------------
// Preview routes
// ---------------------------------------------------------------------------

/** Maps page IDs to storefront routes for preview auto-navigation */
export const PAGE_PREVIEW_ROUTES: Record<string, string> = {
  "homepage": "/{channel}",
  "product-listing": "/{channel}/products",
  "product-detail": "/{channel}/products",
  "cart": "/{channel}/cart",
  "checkout": "/{channel}/checkout",
  "account": "/{channel}/account",
  "auth-pages": "/{channel}/login",
  "layout-config": "/{channel}",
  "global": "/{channel}",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Get all components for a specific page */
export function getComponentsByPage(pageId: string): ComponentRegistryEntry[] {
  return COMPONENT_REGISTRY.filter((c) => c.page === pageId);
}

/** Get a specific component by its config key */
export function getComponentByKey(key: string): ComponentRegistryEntry | undefined {
  return COMPONENT_REGISTRY.find((c) => c.configKey === key);
}

/** Get all unique page IDs that have customizable components */
export function getAllComponentPages(): string[] {
  return [...new Set(COMPONENT_REGISTRY.map((c) => c.page))];
}

/** Get unique groups within a page */
export function getGroupsForPage(pageId: string): string[] {
  const components = getComponentsByPage(pageId);
  return [...new Set(components.map((c) => c.group).filter(Boolean))] as string[];
}

/** Serializable subset of registry for PostMessage to storefront overlay */
export function getSerializableRegistry(): Array<{ configKey: string; label: string; page: string }> {
  return COMPONENT_REGISTRY.map(({ configKey, label, page }) => ({ configKey, label, page }));
}
