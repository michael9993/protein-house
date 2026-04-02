import type { LocationRule } from "./types";

/**
 * Maps config field paths to their admin page locations.
 * Sorted by prefix length descending — longest prefix wins.
 * The `formPrefix` is stripped from fieldPath to derive the form's field name.
 *
 * Page-based organization (10 pages):
 *   Homepage | Product Listing | Product Detail | Cart | Checkout |
 *   Account | Auth Pages | Layout | Static Pages | Global Design
 */
export const LOCATION_RULES: LocationRule[] = [
  // ============================================
  // GLOBAL PAGE (store, branding, ui, design tokens, dark mode, localization, seo, integrations, global features, general content)
  // ============================================

  // Store Identity tab
  { prefix: "store.name", page: "global", tab: "identity", sectionId: "store-basic", category: "Global", sectionLabel: "Basic Information", formPrefix: "" },
  { prefix: "store.tagline", page: "global", tab: "identity", sectionId: "store-basic", category: "Global", sectionLabel: "Basic Information", formPrefix: "" },
  { prefix: "store.type", page: "global", tab: "identity", sectionId: "store-basic", category: "Global", sectionLabel: "Basic Information", formPrefix: "" },
  { prefix: "store.description", page: "global", tab: "identity", sectionId: "store-basic", category: "Global", sectionLabel: "Basic Information", formPrefix: "" },
  { prefix: "store.email", page: "global", tab: "identity", sectionId: "store-contact", category: "Global", sectionLabel: "Contact Information", formPrefix: "" },
  { prefix: "store.phone", page: "global", tab: "identity", sectionId: "store-contact", category: "Global", sectionLabel: "Contact Information", formPrefix: "" },
  { prefix: "store.address", page: "global", tab: "identity", sectionId: "store-address", category: "Global", sectionLabel: "Address", formPrefix: "" },
  { prefix: "store", page: "global", tab: "identity", sectionId: "store-basic", category: "Global", sectionLabel: "Store", formPrefix: "" },

  // Branding & Design tab
  { prefix: "branding.logo", page: "global", tab: "branding", sectionId: "branding-identity", category: "Global", sectionLabel: "Brand Identity", formPrefix: "" },
  { prefix: "branding.favicon", page: "global", tab: "branding", sectionId: "branding-identity", category: "Global", sectionLabel: "Brand Identity", formPrefix: "" },
  { prefix: "branding.colors", page: "global", tab: "branding", sectionId: "branding-colors", category: "Global", sectionLabel: "Colors", formPrefix: "" },
  { prefix: "branding.typography", page: "global", tab: "branding", sectionId: "branding-typography", category: "Global", sectionLabel: "Typography", formPrefix: "" },
  { prefix: "branding.style", page: "global", tab: "branding", sectionId: "branding-style", category: "Global", sectionLabel: "Style", formPrefix: "" },
  { prefix: "branding", page: "global", tab: "branding", sectionId: "branding-identity", category: "Global", sectionLabel: "Branding", formPrefix: "" },

  { prefix: "ui.buttons", page: "global", tab: "branding", sectionId: "ui-buttons", category: "Global", sectionLabel: "Buttons", formPrefix: "" },
  { prefix: "ui.badges", page: "global", tab: "branding", sectionId: "ui-badges", category: "Global", sectionLabel: "Badges", formPrefix: "" },
  { prefix: "ui.inputs", page: "global", tab: "branding", sectionId: "ui-inputs", category: "Global", sectionLabel: "Form Inputs", formPrefix: "" },
  { prefix: "ui.checkbox", page: "global", tab: "branding", sectionId: "ui-inputs", category: "Global", sectionLabel: "Checkbox", formPrefix: "" },
  { prefix: "ui.productCard", page: "global", tab: "branding", sectionId: "ui-product-cards", category: "Global", sectionLabel: "Product Cards", formPrefix: "" },
  { prefix: "ui.toasts", page: "global", tab: "branding", sectionId: "ui-toasts", category: "Global", sectionLabel: "Toast Notifications", formPrefix: "" },
  { prefix: "ui.icons", page: "global", tab: "branding", sectionId: "ui-icons", category: "Global", sectionLabel: "Icons", formPrefix: "" },
  { prefix: "ui.activeFiltersTags", page: "global", tab: "branding", sectionId: "ui-active-filters", category: "Global", sectionLabel: "Active Filters Tags", formPrefix: "" },
  { prefix: "ui.filterSidebar", page: "global", tab: "branding", sectionId: "ui-filter-sidebar", category: "Global", sectionLabel: "Filter Sidebar", formPrefix: "" },
  { prefix: "ui.cart", page: "global", tab: "branding", sectionId: "ui-cart", category: "Global", sectionLabel: "Cart UI", formPrefix: "" },
  { prefix: "ui.sectionViewAllButton", page: "global", tab: "branding", sectionId: "ui-section-buttons", category: "Global", sectionLabel: "Section View All Buttons", formPrefix: "" },
  { prefix: "ui.floatingButtons", page: "global", tab: "features", sectionId: "floating-buttons", category: "Global", sectionLabel: "Floating Action Buttons", formPrefix: "" },
  { prefix: "ui", page: "global", tab: "branding", sectionId: "ui-buttons", category: "Global", sectionLabel: "UI Components", formPrefix: "" },

  { prefix: "design.animations", page: "global", tab: "branding", sectionId: "design-animations", category: "Global", sectionLabel: "Animations", formPrefix: "" },
  { prefix: "design.spacing", page: "global", tab: "branding", sectionId: "design-spacing", category: "Global", sectionLabel: "Spacing", formPrefix: "" },
  { prefix: "design.grid", page: "global", tab: "branding", sectionId: "design-grid", category: "Global", sectionLabel: "Grid", formPrefix: "" },
  { prefix: "design.statusColors", page: "global", tab: "branding", sectionId: "design-status-colors", category: "Global", sectionLabel: "Status Colors", formPrefix: "" },
  { prefix: "design", page: "global", tab: "branding", sectionId: "design-tokens", category: "Global", sectionLabel: "Design Tokens", formPrefix: "" },

  { prefix: "darkMode.colors", page: "global", tab: "branding", sectionId: "dark-mode", category: "Global", sectionLabel: "Dark Mode Colors", formPrefix: "" },
  { prefix: "darkMode", page: "global", tab: "branding", sectionId: "dark-mode", category: "Global", sectionLabel: "Dark Mode", formPrefix: "" },

  // Localization & SEO tab
  { prefix: "localization.defaultLocale", page: "global", tab: "localization", sectionId: "store-localization", category: "Global", sectionLabel: "Language & Direction", formPrefix: "" },
  { prefix: "localization.supportedLocales", page: "global", tab: "localization", sectionId: "store-localization", category: "Global", sectionLabel: "Language & Direction", formPrefix: "" },
  { prefix: "localization.direction", page: "global", tab: "localization", sectionId: "store-localization", category: "Global", sectionLabel: "Language & Direction", formPrefix: "" },
  { prefix: "localization.rtlLocales", page: "global", tab: "localization", sectionId: "store-localization", category: "Global", sectionLabel: "Language & Direction", formPrefix: "" },
  { prefix: "localization.dateFormat", page: "global", tab: "localization", sectionId: "store-localization", category: "Global", sectionLabel: "Format", formPrefix: "" },
  { prefix: "localization.timeFormat", page: "global", tab: "localization", sectionId: "store-localization", category: "Global", sectionLabel: "Format", formPrefix: "" },
  { prefix: "localization.drawerSideOverride", page: "global", tab: "localization", sectionId: "store-localization", category: "Global", sectionLabel: "UI Overrides", formPrefix: "" },
  { prefix: "localization", page: "global", tab: "localization", sectionId: "store-localization", category: "Global", sectionLabel: "Localization", formPrefix: "" },

  { prefix: "seo.titleTemplate", page: "global", tab: "localization", sectionId: "seo-titles", category: "Global", sectionLabel: "Page Titles", formPrefix: "" },
  { prefix: "seo.defaultTitle", page: "global", tab: "localization", sectionId: "seo-titles", category: "Global", sectionLabel: "Page Titles", formPrefix: "" },
  { prefix: "seo.defaultDescription", page: "global", tab: "localization", sectionId: "seo-description", category: "Global", sectionLabel: "Meta Description", formPrefix: "" },
  { prefix: "seo.defaultImage", page: "global", tab: "localization", sectionId: "seo-social", category: "Global", sectionLabel: "Social Sharing", formPrefix: "" },
  { prefix: "seo.twitterHandle", page: "global", tab: "localization", sectionId: "seo-social", category: "Global", sectionLabel: "Social Sharing", formPrefix: "" },
  { prefix: "seo", page: "global", tab: "localization", sectionId: "seo-titles", category: "Global", sectionLabel: "SEO", formPrefix: "" },

  // Integrations tab
  { prefix: "integrations.analytics", page: "global", tab: "integrations", sectionId: "integrations-analytics", category: "Global", sectionLabel: "Analytics", formPrefix: "" },
  { prefix: "integrations.marketing", page: "global", tab: "integrations", sectionId: "integrations-marketing", category: "Global", sectionLabel: "Marketing", formPrefix: "" },
  { prefix: "integrations.support", page: "global", tab: "integrations", sectionId: "integrations-support", category: "Global", sectionLabel: "Customer Support", formPrefix: "" },
  { prefix: "integrations.social", page: "global", tab: "integrations", sectionId: "integrations-social", category: "Global", sectionLabel: "Social Media", formPrefix: "" },
  { prefix: "integrations.cookieConsent", page: "global", tab: "integrations", sectionId: "integrations-cookie-consent", category: "Global", sectionLabel: "Cookie Consent", formPrefix: "" },
  { prefix: "integrations", page: "global", tab: "integrations", sectionId: "integrations-analytics", category: "Global", sectionLabel: "Integrations", formPrefix: "" },

  // Global Features tab
  { prefix: "features.newsletter", page: "global", tab: "features", sectionId: "features-marketing", category: "Global", sectionLabel: "Marketing Features", formPrefix: "" },
  { prefix: "features.promotionalBanners", page: "global", tab: "features", sectionId: "features-marketing", category: "Global", sectionLabel: "Marketing Features", formPrefix: "" },
  { prefix: "features.abandonedCartEmails", page: "global", tab: "features", sectionId: "features-marketing", category: "Global", sectionLabel: "Marketing Features", formPrefix: "" },
  { prefix: "features.instagramFeed", page: "global", tab: "features", sectionId: "features-social", category: "Global", sectionLabel: "Social Features", formPrefix: "" },
  { prefix: "features.digitalDownloads", page: "global", tab: "features", sectionId: "features-product", category: "Global", sectionLabel: "Product Features", formPrefix: "" },
  { prefix: "features.productBundles", page: "global", tab: "features", sectionId: "features-product", category: "Global", sectionLabel: "Product Features", formPrefix: "" },
  { prefix: "features.scrollToTop", page: "global", tab: "features", sectionId: "features-ux", category: "Global", sectionLabel: "UX Features", formPrefix: "" },

  // Global Content tab
  { prefix: "content.general", page: "global", tab: "content", sectionId: "content-general", category: "Global", sectionLabel: "General", formPrefix: "" },

  // ============================================
  // HOMEPAGE PAGE (sections config, homepage content)
  // ============================================

  // Sections & Layout tab
  { prefix: "homepage.sections.hero", page: "homepage", tab: "sections", sectionId: "homepage-hero", category: "Homepage", sectionLabel: "Hero Section", formPrefix: "" },
  { prefix: "homepage.sections.hero.layout", page: "homepage", tab: "sections", sectionId: "homepage-hero", category: "Homepage", sectionLabel: "Hero Layout", formPrefix: "" },
  { prefix: "homepage.sections.hero.secondaryCtaText", page: "homepage", tab: "sections", sectionId: "homepage-hero", category: "Homepage", sectionLabel: "Hero Secondary Button", formPrefix: "" },
  { prefix: "homepage.sections.hero.taglineText", page: "homepage", tab: "sections", sectionId: "homepage-hero", category: "Homepage", sectionLabel: "Hero Tagline", formPrefix: "" },
  { prefix: "homepage.sections.hero.showStats", page: "homepage", tab: "sections", sectionId: "homepage-hero", category: "Homepage", sectionLabel: "Hero Stats", formPrefix: "" },
  { prefix: "homepage.sections.trustStrip", page: "homepage", tab: "sections", sectionId: "homepage-trust", category: "Homepage", sectionLabel: "Trust Strip", formPrefix: "" },
  { prefix: "homepage.sections.marquee", page: "homepage", tab: "sections", sectionId: "homepage-marquee", category: "Homepage", sectionLabel: "Marquee", formPrefix: "" },
  { prefix: "homepage.sections.brandGrid", page: "homepage", tab: "sections", sectionId: "homepage-brands", category: "Homepage", sectionLabel: "Brand Grid", formPrefix: "" },
  { prefix: "homepage.sections.categories", page: "homepage", tab: "sections", sectionId: "homepage-categories", category: "Homepage", sectionLabel: "Categories", formPrefix: "" },
  { prefix: "homepage.sections.trending", page: "homepage", tab: "sections", sectionId: "homepage-trending", category: "Homepage", sectionLabel: "Trending Products", formPrefix: "" },
  { prefix: "homepage.sections.promotionBanner", page: "homepage", tab: "sections", sectionId: "homepage-promo", category: "Homepage", sectionLabel: "Promotion Banner", formPrefix: "" },
  { prefix: "homepage.sections.flashDeals", page: "homepage", tab: "sections", sectionId: "homepage-flash", category: "Homepage", sectionLabel: "Flash Deals", formPrefix: "" },
  { prefix: "homepage.sections.collectionMosaic", page: "homepage", tab: "sections", sectionId: "homepage-mosaic", category: "Homepage", sectionLabel: "Collection Mosaic", formPrefix: "" },
  { prefix: "homepage.sections.bestSellers", page: "homepage", tab: "sections", sectionId: "homepage-bestsellers", category: "Homepage", sectionLabel: "Best Sellers", formPrefix: "" },
  { prefix: "homepage.sections.customerFeedback", page: "homepage", tab: "sections", sectionId: "homepage-feedback", category: "Homepage", sectionLabel: "Customer Feedback", formPrefix: "" },
  { prefix: "homepage.sections.newsletter", page: "homepage", tab: "sections", sectionId: "homepage-newsletter", category: "Homepage", sectionLabel: "Newsletter", formPrefix: "" },
  { prefix: "homepage.sectionOrder", page: "homepage", tab: "sections", sectionId: "homepage-order", category: "Homepage", sectionLabel: "Section Order", formPrefix: "" },
  { prefix: "homepage", page: "homepage", tab: "sections", sectionId: "homepage-hero", category: "Homepage", sectionLabel: "Homepage", formPrefix: "" },

  // Homepage Content tab — Navigation & Buttons
  { prefix: "content.homepage.curatedLabel", page: "homepage", tab: "content", sectionId: "content-homepage-nav", category: "Homepage", sectionLabel: "Navigation & Buttons", formPrefix: "" },
  { prefix: "content.homepage.viewDetailsButton", page: "homepage", tab: "content", sectionId: "content-homepage-nav", category: "Homepage", sectionLabel: "Navigation & Buttons", formPrefix: "" },
  { prefix: "content.homepage.performanceFallback", page: "homepage", tab: "content", sectionId: "content-homepage-nav", category: "Homepage", sectionLabel: "Navigation & Buttons", formPrefix: "" },
  { prefix: "content.homepage.viewAllBrandsButton", page: "homepage", tab: "content", sectionId: "content-homepage-nav", category: "Homepage", sectionLabel: "Navigation & Buttons", formPrefix: "" },
  { prefix: "content.homepage.allCollectionsButton", page: "homepage", tab: "content", sectionId: "content-homepage-nav", category: "Homepage", sectionLabel: "Navigation & Buttons", formPrefix: "" },
  { prefix: "content.homepage.viewAllOffersButton", page: "homepage", tab: "content", sectionId: "content-homepage-nav", category: "Homepage", sectionLabel: "Navigation & Buttons", formPrefix: "" },
  { prefix: "content.homepage.viewCategoryButton", page: "homepage", tab: "content", sectionId: "content-homepage-nav", category: "Homepage", sectionLabel: "Navigation & Buttons", formPrefix: "" },
  { prefix: "content.homepage.exploreBrandsButton", page: "homepage", tab: "content", sectionId: "content-homepage-nav", category: "Homepage", sectionLabel: "Navigation & Buttons", formPrefix: "" },
  { prefix: "content.homepage.shopCollectionButton", page: "homepage", tab: "content", sectionId: "content-homepage-nav", category: "Homepage", sectionLabel: "Navigation & Buttons", formPrefix: "" },

  // Homepage Content tab — Labels & Units
  { prefix: "content.homepage.stylesText", page: "homepage", tab: "content", sectionId: "content-homepage-labels", category: "Homepage", sectionLabel: "Labels & Units", formPrefix: "" },
  { prefix: "content.homepage.subcategoriesLabel", page: "homepage", tab: "content", sectionId: "content-homepage-labels", category: "Homepage", sectionLabel: "Labels & Units", formPrefix: "" },
  { prefix: "content.homepage.itemsText", page: "homepage", tab: "content", sectionId: "content-homepage-labels", category: "Homepage", sectionLabel: "Labels & Units", formPrefix: "" },
  { prefix: "content.homepage.featuredCollectionLabel", page: "homepage", tab: "content", sectionId: "content-homepage-labels", category: "Homepage", sectionLabel: "Labels & Units", formPrefix: "" },

  // Homepage Content tab — Hero Stats
  { prefix: "content.homepage.brandsStatLabel", page: "homepage", tab: "content", sectionId: "content-homepage-stats", category: "Homepage", sectionLabel: "Hero Stats", formPrefix: "" },
  { prefix: "content.homepage.stylesStatLabel", page: "homepage", tab: "content", sectionId: "content-homepage-stats", category: "Homepage", sectionLabel: "Hero Stats", formPrefix: "" },

  // Homepage Content tab — Customer Feedback Labels
  { prefix: "content.homepage.reviewedProductLabel", page: "homepage", tab: "content", sectionId: "content-homepage-feedback", category: "Homepage", sectionLabel: "Customer Feedback Labels", formPrefix: "" },
  { prefix: "content.homepage.verifiedBuyerLabel", page: "homepage", tab: "content", sectionId: "content-homepage-feedback", category: "Homepage", sectionLabel: "Customer Feedback Labels", formPrefix: "" },
  { prefix: "content.homepage.anonymousLabel", page: "homepage", tab: "content", sectionId: "content-homepage-feedback", category: "Homepage", sectionLabel: "Customer Feedback Labels", formPrefix: "" },

  // Homepage Content tab — catch-all
  { prefix: "content.homepage", page: "homepage", tab: "content", sectionId: "content-homepage", category: "Homepage", sectionLabel: "Homepage Sections", formPrefix: "" },

  // ============================================
  // LAYOUT PAGE (header, footer, nav/footer text)
  // ============================================

  // Header tab
  { prefix: "header.banner", page: "layout-config", tab: "header", sectionId: "header-banner", category: "Layout", sectionLabel: "Header Banner", formPrefix: "" },
  { prefix: "header.showStoreName", page: "layout-config", tab: "header", sectionId: "header-layout", category: "Layout", sectionLabel: "Header Layout", formPrefix: "" },
  { prefix: "header.logoPosition", page: "layout-config", tab: "header", sectionId: "header-layout", category: "Layout", sectionLabel: "Header Layout", formPrefix: "" },
  { prefix: "header", page: "layout-config", tab: "header", sectionId: "header-banner", category: "Layout", sectionLabel: "Header", formPrefix: "" },

  // Footer tab
  { prefix: "footer.showNewsletter", page: "layout-config", tab: "footer", sectionId: "footer-content", category: "Layout", sectionLabel: "Footer Content", formPrefix: "" },
  { prefix: "footer.showSocialLinks", page: "layout-config", tab: "footer", sectionId: "footer-content", category: "Layout", sectionLabel: "Footer Content", formPrefix: "" },
  { prefix: "footer.showContactInfo", page: "layout-config", tab: "footer", sectionId: "footer-content", category: "Layout", sectionLabel: "Footer Content", formPrefix: "" },
  { prefix: "footer.showFooterEmail", page: "layout-config", tab: "footer", sectionId: "footer-content", category: "Layout", sectionLabel: "Footer Contact Email", formPrefix: "" },
  { prefix: "footer.showFooterPhone", page: "layout-config", tab: "footer", sectionId: "footer-content", category: "Layout", sectionLabel: "Footer Contact Phone", formPrefix: "" },
  { prefix: "footer.showFooterAddress", page: "layout-config", tab: "footer", sectionId: "footer-content", category: "Layout", sectionLabel: "Footer Contact Address", formPrefix: "" },
  { prefix: "footer.showFooterContactButton", page: "layout-config", tab: "footer", sectionId: "footer-content", category: "Layout", sectionLabel: "Footer Contact Button", formPrefix: "" },
  { prefix: "footer.showMenu", page: "layout-config", tab: "footer", sectionId: "footer-content", category: "Layout", sectionLabel: "Footer Content", formPrefix: "" },
  { prefix: "footer.showBrand", page: "layout-config", tab: "footer", sectionId: "footer-content", category: "Layout", sectionLabel: "Footer Content", formPrefix: "" },
  { prefix: "footer.copyrightText", page: "layout-config", tab: "footer", sectionId: "footer-legal", category: "Layout", sectionLabel: "Footer Legal", formPrefix: "" },
  { prefix: "footer.legalLinks", page: "layout-config", tab: "footer", sectionId: "footer-legal", category: "Layout", sectionLabel: "Footer Legal Links", formPrefix: "" },
  { prefix: "footer.returnPolicy", page: "layout-config", tab: "footer", sectionId: "footer-legal", category: "Layout", sectionLabel: "Return Policy", formPrefix: "" },
  { prefix: "footer.shippingPolicy", page: "layout-config", tab: "footer", sectionId: "footer-legal", category: "Layout", sectionLabel: "Shipping Policy", formPrefix: "" },
  { prefix: "footer.privacyPolicy", page: "layout-config", tab: "footer", sectionId: "footer-legal", category: "Layout", sectionLabel: "Privacy Policy", formPrefix: "" },
  { prefix: "footer.termsOfService", page: "layout-config", tab: "footer", sectionId: "footer-legal", category: "Layout", sectionLabel: "Terms of Service", formPrefix: "" },
  { prefix: "footer", page: "layout-config", tab: "footer", sectionId: "footer-content", category: "Layout", sectionLabel: "Footer", formPrefix: "" },

  // Text tab
  { prefix: "content.navbar", page: "layout-config", tab: "text", sectionId: "content-navbar", category: "Layout", sectionLabel: "Navbar", formPrefix: "" },
  { prefix: "content.footer", page: "layout-config", tab: "text", sectionId: "content-footer", category: "Layout", sectionLabel: "Footer", formPrefix: "" },

  // ============================================
  // PRODUCT LISTING PAGE (filters, quick filters, listing content)
  // ============================================

  { prefix: "filters.priceFilter", page: "product-listing", tab: "listing", sectionId: "filters-main", category: "Product Listing", sectionLabel: "Price Filter", formPrefix: "" },
  { prefix: "filters.ratingFilter", page: "product-listing", tab: "listing", sectionId: "filters-main", category: "Product Listing", sectionLabel: "Rating Filter", formPrefix: "" },
  { prefix: "filters.brandFilter", page: "product-listing", tab: "listing", sectionId: "filters-main", category: "Product Listing", sectionLabel: "Brand Filter", formPrefix: "" },
  { prefix: "filters.sizeFilter", page: "product-listing", tab: "listing", sectionId: "filters-main", category: "Product Listing", sectionLabel: "Size Filter", formPrefix: "" },
  { prefix: "filters.colorFilter", page: "product-listing", tab: "listing", sectionId: "filters-main", category: "Product Listing", sectionLabel: "Color Filter", formPrefix: "" },
  { prefix: "filters.categoryFilter", page: "product-listing", tab: "listing", sectionId: "filters-main", category: "Product Listing", sectionLabel: "Category Filter", formPrefix: "" },
  { prefix: "filters.collectionFilter", page: "product-listing", tab: "listing", sectionId: "filters-main", category: "Product Listing", sectionLabel: "Collection Filter", formPrefix: "" },
  { prefix: "filters.stockFilter", page: "product-listing", tab: "listing", sectionId: "filters-main", category: "Product Listing", sectionLabel: "Stock Filter", formPrefix: "" },
  { prefix: "filters", page: "product-listing", tab: "listing", sectionId: "filters-main", category: "Product Listing", sectionLabel: "Filters", formPrefix: "" },

  { prefix: "quickFilters.style", page: "product-listing", tab: "listing", sectionId: "quick-filters", category: "Product Listing", sectionLabel: "Quick Filter Style", formPrefix: "" },
  { prefix: "quickFilters", page: "product-listing", tab: "listing", sectionId: "quick-filters", category: "Product Listing", sectionLabel: "Quick Filters", formPrefix: "" },

  // Filter Sidebar Styling
  { prefix: "ui.filterSidebar.checkboxAccentColor", page: "product-listing", tab: "filters", sectionId: "filter-sidebar-styling", category: "Product Listing", sectionLabel: "Filter Sidebar Checkbox", formPrefix: "" },
  { prefix: "ui.filterSidebar.sectionTitle", page: "product-listing", tab: "filters", sectionId: "filter-sidebar-styling", category: "Product Listing", sectionLabel: "Filter Section Titles", formPrefix: "" },
  { prefix: "ui.filterSidebar.itemText", page: "product-listing", tab: "filters", sectionId: "filter-sidebar-styling", category: "Product Listing", sectionLabel: "Filter Item Text", formPrefix: "" },
  { prefix: "ui.filterSidebar.chevron", page: "product-listing", tab: "filters", sectionId: "filter-sidebar-styling", category: "Product Listing", sectionLabel: "Filter Chevrons", formPrefix: "" },
  { prefix: "ui.filterSidebar.sizeChip", page: "product-listing", tab: "filters", sectionId: "filter-sidebar-styling", category: "Product Listing", sectionLabel: "Filter Size Chips", formPrefix: "" },
  { prefix: "ui.filterSidebar.clearAllButton", page: "product-listing", tab: "filters", sectionId: "filter-sidebar-styling", category: "Product Listing", sectionLabel: "Filter Clear All Button", formPrefix: "" },
  { prefix: "ui.filterSidebar.price", page: "product-listing", tab: "filters", sectionId: "filter-sidebar-styling", category: "Product Listing", sectionLabel: "Filter Price Input", formPrefix: "" },
  { prefix: "ui.filterSidebar.mobile", page: "product-listing", tab: "filters", sectionId: "filter-sidebar-styling", category: "Product Listing", sectionLabel: "Filter Mobile Button", formPrefix: "" },
  { prefix: "ui.filterSidebar", page: "product-listing", tab: "filters", sectionId: "filter-sidebar-styling", category: "Product Listing", sectionLabel: "Filter Sidebar Styling", formPrefix: "" },
  { prefix: "ui.checkbox", page: "product-listing", tab: "filters", sectionId: "filter-sidebar-styling", category: "Product Listing", sectionLabel: "Checkbox Styling", formPrefix: "" },

  // Listing content
  { prefix: "content.product", page: "product-listing", tab: "content", sectionId: "content-product", category: "Product Listing", sectionLabel: "Product Page", formPrefix: "" },
  { prefix: "content.filters", page: "product-listing", tab: "content", sectionId: "content-filters", category: "Product Listing", sectionLabel: "Filters & Search", formPrefix: "" },

  // Storefront UX (cart display settings)
  { prefix: "storefront.cart", page: "product-listing", tab: "listing", sectionId: "storefront-cart", category: "Product Listing", sectionLabel: "Cart Display", formPrefix: "" },
  { prefix: "storefront", page: "product-listing", tab: "listing", sectionId: "storefront-cart", category: "Product Listing", sectionLabel: "Storefront UX", formPrefix: "" },

  // ============================================
  // PRODUCT DETAIL PAGE (related products, PDP features, PDP content)
  // ============================================

  { prefix: "relatedProducts", page: "product-detail", tab: "detail", sectionId: "related-products", category: "Product Detail", sectionLabel: "Related Products", formPrefix: "" },

  // PDP feature flags
  { prefix: "features.productReviews", page: "product-detail", tab: "detail", sectionId: "features-pdp", category: "Product Detail", sectionLabel: "PDP Features", formPrefix: "" },
  { prefix: "features.wishlist", page: "product-detail", tab: "detail", sectionId: "features-pdp", category: "Product Detail", sectionLabel: "PDP Features", formPrefix: "" },
  { prefix: "features.compareProducts", page: "product-detail", tab: "detail", sectionId: "features-pdp", category: "Product Detail", sectionLabel: "PDP Features", formPrefix: "" },
  { prefix: "features.recentlyViewed", page: "product-detail", tab: "detail", sectionId: "features-pdp", category: "Product Detail", sectionLabel: "PDP Features", formPrefix: "" },
  { prefix: "features.relatedProducts", page: "product-detail", tab: "detail", sectionId: "features-pdp", category: "Product Detail", sectionLabel: "PDP Features", formPrefix: "" },
  { prefix: "features.shareButtons", page: "product-detail", tab: "detail", sectionId: "features-pdp", category: "Product Detail", sectionLabel: "PDP Features", formPrefix: "" },
  { prefix: "features.stockAlerts", page: "product-detail", tab: "detail", sectionId: "features-pdp", category: "Product Detail", sectionLabel: "PDP Features", formPrefix: "" },

  // PDP content
  { prefix: "content.productDetail", page: "product-detail", tab: "content", sectionId: "content-product-detail", category: "Product Detail", sectionLabel: "Product Detail", formPrefix: "" },

  // ============================================
  // CART PAGE (ecommerce, promo popup, cart content)
  // ============================================

  { prefix: "ecommerce", page: "cart", tab: "shipping", sectionId: "cart-shipping", category: "Cart", sectionLabel: "E-commerce Settings", formPrefix: "" },
  { prefix: "promoPopup", page: "cart", tab: "promo", sectionId: "promo-main", category: "Cart", sectionLabel: "Promo Popup", formPrefix: "" },
  { prefix: "content.cart", page: "cart", tab: "content", sectionId: "content-cart", category: "Cart", sectionLabel: "Cart Page", formPrefix: "" },

  // ============================================
  // CHECKOUT PAGE (checkout features, checkout UI, checkout content)
  // ============================================

  { prefix: "checkoutUi", page: "checkout", tab: "ui", sectionId: "checkout-ui", category: "Checkout", sectionLabel: "Checkout UI", formPrefix: "" },
  { prefix: "features.guestCheckout", page: "checkout", tab: "features", sectionId: "features-checkout", category: "Checkout", sectionLabel: "Checkout Features", formPrefix: "" },
  { prefix: "features.expressCheckout", page: "checkout", tab: "features", sectionId: "features-checkout", category: "Checkout", sectionLabel: "Checkout Features", formPrefix: "" },
  { prefix: "features.savePaymentMethods", page: "checkout", tab: "features", sectionId: "features-checkout", category: "Checkout", sectionLabel: "Checkout Features", formPrefix: "" },
  { prefix: "features.giftCards", page: "checkout", tab: "features", sectionId: "features-checkout", category: "Checkout", sectionLabel: "Checkout Features", formPrefix: "" },
  { prefix: "content.checkout", page: "checkout", tab: "content", sectionId: "content-checkout", category: "Checkout", sectionLabel: "Checkout", formPrefix: "" },

  // ============================================
  // ACCOUNT PAGE (account features, account content)
  // ============================================

  { prefix: "features.orderTracking", page: "account", tab: "features", sectionId: "features-account", category: "Account", sectionLabel: "Account Features", formPrefix: "" },
  { prefix: "features.accountDeletion", page: "account", tab: "features", sectionId: "features-account", category: "Account", sectionLabel: "Account Features", formPrefix: "" },

  { prefix: "content.confirmEmail", page: "account", tab: "content", sectionId: "content-confirm-email", category: "Account", sectionLabel: "Confirm Email", formPrefix: "" },
  { prefix: "content.dashboard", page: "account", tab: "content", sectionId: "content-dashboard", category: "Account", sectionLabel: "Dashboard", formPrefix: "" },
  { prefix: "content.orders", page: "account", tab: "content", sectionId: "content-orders", category: "Account", sectionLabel: "Orders", formPrefix: "" },
  { prefix: "content.orderTracking", page: "account", tab: "content", sectionId: "content-order-tracking", category: "Account", sectionLabel: "Order Tracking", formPrefix: "" },
  { prefix: "content.addresses", page: "account", tab: "content", sectionId: "content-addresses", category: "Account", sectionLabel: "Addresses", formPrefix: "" },
  { prefix: "content.settings", page: "account", tab: "content", sectionId: "content-settings", category: "Account", sectionLabel: "Settings", formPrefix: "" },
  { prefix: "content.wishlist", page: "account", tab: "content", sectionId: "content-wishlist", category: "Account", sectionLabel: "Wishlist", formPrefix: "" },

  // ============================================
  // AUTH PAGES (sign in/up text, auth features)
  // ============================================

  { prefix: "features.socialLogin", page: "auth-pages", tab: "", sectionId: "features-auth", category: "Auth Pages", sectionLabel: "Auth Features", formPrefix: "" },
  { prefix: "features.subscriptions", page: "auth-pages", tab: "", sectionId: "features-auth", category: "Auth Pages", sectionLabel: "Auth Features", formPrefix: "" },
  { prefix: "content.account", page: "auth-pages", tab: "", sectionId: "content-account", category: "Auth Pages", sectionLabel: "Auth Text", formPrefix: "" },

  // ============================================
  // STATIC PAGES (page toggles, contact/FAQ, error pages)
  // ============================================

  { prefix: "pages.aboutUs", page: "static-pages", tab: "toggles", sectionId: "pages-info", category: "Static Pages", sectionLabel: "Information Pages", formPrefix: "" },
  { prefix: "pages.contact", page: "static-pages", tab: "toggles", sectionId: "pages-info", category: "Static Pages", sectionLabel: "Information Pages", formPrefix: "" },
  { prefix: "pages.faq", page: "static-pages", tab: "toggles", sectionId: "pages-info", category: "Static Pages", sectionLabel: "Information Pages", formPrefix: "" },
  { prefix: "pages.blog", page: "static-pages", tab: "toggles", sectionId: "pages-info", category: "Static Pages", sectionLabel: "Information Pages", formPrefix: "" },
  { prefix: "pages.privacyPolicy", page: "static-pages", tab: "toggles", sectionId: "pages-legal", category: "Static Pages", sectionLabel: "Legal Pages", formPrefix: "" },
  { prefix: "pages.termsOfService", page: "static-pages", tab: "toggles", sectionId: "pages-legal", category: "Static Pages", sectionLabel: "Legal Pages", formPrefix: "" },
  { prefix: "pages.shippingPolicy", page: "static-pages", tab: "toggles", sectionId: "pages-legal", category: "Static Pages", sectionLabel: "Legal Pages", formPrefix: "" },
  { prefix: "pages.returnPolicy", page: "static-pages", tab: "toggles", sectionId: "pages-legal", category: "Static Pages", sectionLabel: "Legal Pages", formPrefix: "" },
  { prefix: "pages", page: "static-pages", tab: "toggles", sectionId: "pages-info", category: "Static Pages", sectionLabel: "Page Toggles", formPrefix: "" },

  { prefix: "content.contact", page: "static-pages", tab: "contact", sectionId: "content-contact", category: "Static Pages", sectionLabel: "Contact Page", formPrefix: "" },
  { prefix: "content.faq", page: "static-pages", tab: "contact", sectionId: "content-faq", category: "Static Pages", sectionLabel: "FAQ Page", formPrefix: "" },

  { prefix: "content.pagination", page: "product-listing", tab: "content", sectionId: "content-pagination", category: "Product Listing", sectionLabel: "Pagination", formPrefix: "" },

  { prefix: "content.error", page: "static-pages", tab: "errors", sectionId: "content-error", category: "Static Pages", sectionLabel: "Error Page", formPrefix: "" },
  { prefix: "content.notFound", page: "static-pages", tab: "errors", sectionId: "content-404", category: "Static Pages", sectionLabel: "404 Page", formPrefix: "" },

  // Cookie Consent Content (mapped to global integrations)
  { prefix: "content.cookieConsent", page: "global", tab: "integrations", sectionId: "integrations-cookie-consent", category: "Global", sectionLabel: "Cookie Consent Text", formPrefix: "" },

  // ============================================
  // PRODUCT CARD OVERRIDES (distributed across product-listing and product-detail)
  // ============================================
  { prefix: "cardOverrides.plp", page: "product-listing", tab: "listing", sectionId: "card-overrides-plp", category: "Product Listing", sectionLabel: "PLP Card Overrides", formPrefix: "" },
  { prefix: "cardOverrides.relatedProducts", page: "product-detail", tab: "detail", sectionId: "card-overrides-related", category: "Product Detail", sectionLabel: "Related Products Cards", formPrefix: "" },
  { prefix: "cardOverrides.recentlyViewed", page: "product-detail", tab: "detail", sectionId: "card-overrides-recent", category: "Product Detail", sectionLabel: "Recently Viewed Cards", formPrefix: "" },
  { prefix: "cardOverrides.wishlistDrawer", page: "product-listing", tab: "listing", sectionId: "card-overrides-wishlist", category: "Product Listing", sectionLabel: "Wishlist Drawer Cards", formPrefix: "" },
  { prefix: "cardOverrides.productGrid", page: "product-listing", tab: "listing", sectionId: "card-overrides-grid", category: "Product Listing", sectionLabel: "Product Grid Cards", formPrefix: "" },
  { prefix: "cardOverrides", page: "product-listing", tab: "listing", sectionId: "card-overrides-plp", category: "Product Listing", sectionLabel: "Card Overrides", formPrefix: "" },

  // ============================================
  // COMPONENT DESIGNER
  // ============================================
  { prefix: "componentOverrides", page: "component-designer", tab: "", sectionId: "component-overrides", category: "Component Designer", sectionLabel: "Component Overrides", formPrefix: "" },

  // ============================================
  // CATCH-ALL (features and content that didn't match above)
  // ============================================
  { prefix: "features", page: "global", tab: "features", sectionId: "features-marketing", category: "Global", sectionLabel: "Features", formPrefix: "" },
  { prefix: "content", page: "global", tab: "content", sectionId: "content-general", category: "Global", sectionLabel: "Content", formPrefix: "" },
].sort((a, b) => b.prefix.length - a.prefix.length); // Sort by length DESC for longest-prefix match

/**
 * Finds the best matching location rule for a config field path.
 * Uses longest-prefix matching.
 */
export function resolveLocation(fieldPath: string): LocationRule | undefined {
  return LOCATION_RULES.find((rule) => fieldPath.startsWith(rule.prefix));
}
