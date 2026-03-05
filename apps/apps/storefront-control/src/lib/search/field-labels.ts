/**
 * Converts camelCase field names to human-readable Title Case labels.
 * e.g. "freeShippingThreshold" → "Free Shipping Threshold"
 */
export function camelCaseToTitleCase(str: string): string {
  // Handle common abbreviations
  const withSpaces = str
    .replace(/([A-Z]{2,})/g, " $1") // consecutive caps like "URL" → " URL"
    .replace(/([a-z])([A-Z])/g, "$1 $2") // camelCase boundary
    .replace(/([A-Z])([A-Z][a-z])/g, "$1 $2") // ABc → A Bc
    .replace(/^./, (c) => c.toUpperCase()) // capitalize first
    .trim();

  // Capitalize each word
  return withSpaces
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/**
 * Returns the last segment of a dot-path as a Title Case label.
 * e.g. "content.cart.cartTitle" → "Cart Title"
 */
export function pathToLabel(fieldPath: string): string {
  const segments = fieldPath.split(".");
  const lastSegment = segments[segments.length - 1];
  if (!lastSegment) return fieldPath;

  // Check override first
  const override = FIELD_LABELS[fieldPath];
  if (override) return override;

  return camelCaseToTitleCase(lastSegment);
}

/**
 * Manual label overrides for fields where camelCase conversion produces poor results.
 * Key: full config path, Value: human-readable label
 */
const FIELD_LABELS: Record<string, string> = {
  // Store
  "store.name": "Store Name",
  "store.email": "Support Email",
  "store.phone": "Support Phone",

  // Branding
  "branding.logo": "Logo URL",
  "branding.logoAlt": "Logo Alt Text",
  "branding.favicon": "Favicon URL",
  "branding.colors.textMuted": "Muted Text Color",
  "branding.typography.fontHeading": "Heading Font Family",
  "branding.typography.fontBody": "Body Font Family",
  "branding.typography.fontMono": "Monospace Font Family",
  "branding.style.borderRadius": "Global Border Radius",
  "branding.style.buttonStyle": "Default Button Style",
  "branding.style.cardShadow": "Default Card Shadow",

  // Features
  "features.compareProducts": "Compare Products",
  "features.productReviews": "Product Reviews",
  "features.recentlyViewed": "Recently Viewed Products",
  "features.scrollToTop": "Scroll to Top Button",
  "features.guestCheckout": "Guest Checkout",
  "features.expressCheckout": "Express Checkout",
  "features.savePaymentMethods": "Save Payment Methods",
  "features.digitalDownloads": "Digital Downloads",
  "features.productBundles": "Product Bundles",
  "features.giftCards": "Gift Cards",
  "features.promotionalBanners": "Promotional Banners",
  "features.abandonedCartEmails": "Abandoned Cart Emails",
  "features.socialLogin": "Social Login",
  "features.shareButtons": "Share Buttons",
  "features.instagramFeed": "Instagram Feed",
  "features.relatedProducts": "Related Products",

  // Ecommerce
  "ecommerce.shipping.freeShippingThreshold": "Free Shipping Threshold",
  "ecommerce.shipping.showEstimatedDelivery": "Show Estimated Delivery",
  "ecommerce.shipping.defaultEstimatedMinDays": "Default Estimated Min Days",
  "ecommerce.shipping.defaultEstimatedMaxDays": "Default Estimated Max Days",
  "ecommerce.shipping.estimatedDeliveryFormat": "Estimated Delivery Format",
  "ecommerce.shipping.freeShippingRule.enabled": "Enable Free Shipping Rule",
  "ecommerce.shipping.freeShippingRule.cartMinimum": "Free Rule Cart Minimum",
  "ecommerce.shipping.freeShippingRule.maxMethodPrice": "Free Rule Max Method Price",
  "ecommerce.shipping.freeShippingRule.methodNameFilter": "Free Rule Method Name Filter",
  "ecommerce.shipping.discountRule.enabled": "Enable Shipping Discount Rule",
  "ecommerce.shipping.discountRule.cartMinimum": "Discount Rule Cart Minimum",
  "ecommerce.shipping.discountRule.type": "Shipping Discount Type",
  "ecommerce.shipping.discountRule.value": "Shipping Discount Value",
  "ecommerce.shipping.discountRule.maxMethodPrice": "Discount Rule Max Method Price",
  "ecommerce.shipping.discountRule.minPrice": "Shipping Discount Floor Price",
  "ecommerce.shipping.discountRule.methodNameFilter": "Discount Rule Method Name Filter",
  "ecommerce.shipping.showOriginalPrice": "Show Original Shipping Price",
  "ecommerce.shipping.dropship.marginProtectionEnabled": "Enable Dropship Margin Protection",
  "ecommerce.shipping.dropship.marginThreshold": "Minimum Profit Margin (%)",
  "ecommerce.shipping.dropship.trackOriginalPrices": "Track Original Shipping Prices",
  "ecommerce.tax.showPricesWithTax": "Show Prices With Tax",
  "ecommerce.tax.taxIncludedInPrice": "Tax Included In Price",
  "ecommerce.inventory.showStockLevel": "Show Stock Level",
  "ecommerce.inventory.lowStockThreshold": "Low Stock Threshold",
  "ecommerce.inventory.allowBackorders": "Allow Backorders",
  "ecommerce.checkout.minOrderAmount": "Minimum Order Amount",
  "ecommerce.checkout.maxOrderAmount": "Maximum Order Amount",
  "ecommerce.checkout.termsRequired": "Terms Required at Checkout",

  // SEO
  "seo.titleTemplate": "SEO Title Template",
  "seo.defaultTitle": "Default Page Title",
  "seo.defaultDescription": "Default Meta Description",
  "seo.defaultImage": "Default OG Image URL",
  "seo.twitterHandle": "Twitter Handle",

  // Localization
  "localization.defaultLocale": "Default Locale",
  "localization.supportedLocales": "Supported Locales",
  "localization.dateFormat": "Date Format",
  "localization.timeFormat": "Time Format",
  "localization.direction": "Text Direction (LTR/RTL)",
  "localization.rtlLocales": "RTL Locale Codes",
  "localization.drawerSideOverride": "Drawer Side Override",

  // Dark Mode
  "darkMode.enabled": "Enable Dark Mode",
  "darkMode.auto": "Auto Dark Mode (System)",

  // Homepage sections
  "homepage.sections.hero.ctaText": "Hero CTA Button Text",
  "homepage.sections.hero.ctaLink": "Hero CTA Button Link",
  "homepage.sections.hero.overlayOpacity": "Hero Overlay Opacity",
  "homepage.sections.hero.autoRotateSeconds": "Hero Auto Rotate Interval",
  "homepage.sections.hero.showProgressBar": "Show Hero Progress Bar",
  "homepage.sections.hero.showNavDots": "Show Hero Navigation Dots",

  // UI Components
  "ui.buttons.borderRadius": "Button Border Radius",
  "ui.badges.sale.borderRadius": "Sale Badge Border Radius",
  "ui.inputs.borderRadius": "Input Border Radius",
  "ui.inputs.focusBorderColor": "Input Focus Border Color",
  "ui.inputs.focusRingColor": "Input Focus Ring Color",
  "ui.productCard.showQuickView": "Show Quick View Button",
  "ui.productCard.showWishlistButton": "Show Wishlist Button on Card",
  "ui.productCard.showAddToCart": "Show Add to Cart on Card",
  "ui.productCard.imageAspectRatio": "Product Card Image Aspect Ratio",
  "ui.productCard.hoverEffect": "Product Card Hover Effect",
  "ui.productCard.badgePosition": "Product Card Badge Position",
  "ui.productCard.imageFit": "Product Card Image Fit",
  "ui.productCard.textStyles.name.fontSize": "Product Name Font Size",
  "ui.productCard.textStyles.name.fontWeight": "Product Name Font Weight",
  "ui.productCard.textStyles.name.color": "Product Name Color",
  "ui.productCard.textStyles.price.fontSize": "Price Font Size",
  "ui.productCard.textStyles.price.fontWeight": "Price Font Weight",
  "ui.productCard.textStyles.price.color": "Price Color",
  "ui.productCard.textStyles.originalPrice.fontSize": "Original Price Font Size",
  "ui.productCard.textStyles.originalPrice.fontWeight": "Original Price Font Weight",
  "ui.productCard.textStyles.originalPrice.color": "Original Price Color",
  "ui.productCard.textStyles.reviewCount.fontSize": "Review Count Font Size",
  "ui.productCard.textStyles.reviewCount.fontWeight": "Review Count Font Weight",
  "ui.productCard.textStyles.reviewCount.color": "Review Count Color",
  "ui.toasts.position": "Toast Notification Position",
  "ui.icons.style": "Icon Style",
  "ui.icons.defaultColor": "Default Icon Color",
  "ui.icons.activeColor": "Active Icon Color",
  "ui.cart.displayMode": "Cart Display Mode",
  "ui.cart.drawerSide": "Cart Drawer Side",
  "ui.cart.showDeleteText": "Show Delete Text on Cart Items",
  "ui.cart.showSaveForLater": "Show Save For Later",

  // Promo Popup
  "promoPopup.enabled": "Enable Promo Popup",
  "promoPopup.delaySeconds": "Popup Delay (Seconds)",
  "promoPopup.showOncePerSession": "Show Once Per Session",
  "promoPopup.excludeCheckout": "Exclude From Checkout",
  "promoPopup.excludeCart": "Exclude From Cart",
  "promoPopup.autoDetectSales": "Auto Detect Sales",
  "promoPopup.ttlHours": "Popup TTL (Hours)",
  "promoPopup.ctaText": "Popup CTA Button Text",
  "promoPopup.ctaLink": "Popup CTA Button Link",
  "promoPopup.imageUrl": "Popup Image URL",
  "promoPopup.backgroundImageUrl": "Popup Background Image URL",

  // Integrations
  "integrations.analytics.googleAnalyticsId": "Google Analytics ID",
  "integrations.analytics.googleTagManagerId": "Google Tag Manager ID",
  "integrations.analytics.facebookPixelId": "Facebook Pixel ID",
  "integrations.analytics.hotjarId": "Hotjar ID",
  "integrations.marketing.mailchimpListId": "Mailchimp List ID",
  "integrations.marketing.klaviyoApiKey": "Klaviyo API Key",
  "integrations.support.intercomAppId": "Intercom App ID",
  "integrations.support.zendeskKey": "Zendesk Key",
  "integrations.support.crispWebsiteId": "Crisp Website ID",

  // Related Products
  "relatedProducts.enabled": "Enable Related Products",
  "relatedProducts.strategy": "Related Products Strategy",
  "relatedProducts.maxItems": "Max Related Products",
  "relatedProducts.showOnMobile": "Show Related on Mobile",
  "relatedProducts.title": "Related Products Title",
  "relatedProducts.subtitle": "Related Products Subtitle",

  // Filters
  "filters.enabled": "Enable Filters",
  "filters.priceFilter.enabled": "Enable Price Filter",
  "filters.priceFilter.showQuickButtons": "Show Price Quick Buttons",
  "quickFilters.enabled": "Enable Quick Filters",
  "quickFilters.showCategories": "Show Category Quick Filters",
  "quickFilters.showCollections": "Show Collection Quick Filters",
  "quickFilters.showBrands": "Show Brand Quick Filters",
  "quickFilters.categoryLimit": "Quick Filter Category Limit",
  "quickFilters.collectionLimit": "Quick Filter Collection Limit",
  "quickFilters.brandLimit": "Quick Filter Brand Limit",

  // Content - common prefixes for better labels
  "content.cart.emptyCartTitle": "Empty Cart Title",
  "content.cart.emptyCartMessage": "Empty Cart Message",
  "content.cart.checkoutButton": "Checkout Button Text",
  "content.cart.continueShoppingButton": "Continue Shopping Button",
  "content.cart.freeShippingMessage": "Free Shipping Message",
  "content.product.addToCartButton": "Add to Cart Button Text",
  "content.product.buyNowButton": "Buy Now Button Text",
  "content.product.outOfStockText": "Out of Stock Text",
  "content.account.signInTitle": "Sign In Title",
  "content.account.signUpTitle": "Sign Up Title",
  "content.account.signInButton": "Sign In Button Text",
  "content.account.signUpButton": "Sign Up Button Text",
  "content.account.signOutButton": "Sign Out Button Text",
  "content.checkout.checkoutTitle": "Checkout Page Title",
  "content.checkout.placeOrderButton": "Place Order Button Text",
  "content.checkout.countryPlaceholder": "Country Search Placeholder",
  "content.checkout.noCountryFound": "Country Not Found Text",
  "content.checkout.deliveryMethodsSubtitle": "Delivery Methods Subtitle",
  "content.checkout.noShippingMethodsAvailable": "No Shipping Methods Text",
  "content.checkout.fetchingShippingRates": "Fetching Rates Text",
  "content.checkout.updatingShippingRates": "Updating Rates Text",
  "content.checkout.paymentTimeoutError": "Payment Timeout Error",
  "content.checkout.freeShippingBadge": "Free Shipping Badge",
  "content.checkout.easyReturnsBadge": "Easy Returns Badge",
  "content.checkout.securePaymentBadge": "Secure Payment Badge",
  "content.checkout.calculateShippingButton": "Calculate Shipping Button Text",
  "content.checkout.calculatingShippingText": "Calculating Shipping Text",
  "content.checkout.recalculateRatesButton": "Recalculate Rates Button Text",
  "content.checkout.addressChangedNotice": "Address Changed Notice Text",
  "content.checkout.shippingFetchErrorText": "Shipping Fetch Error Text",
  "content.checkout.shippingFetchErrorHint": "Shipping Fetch Error Hint Text",
  "content.checkout.noShippingMethodsHint": "No Shipping Methods Hint Text",
  "content.checkout.tryAgainButton": "Try Again Button Text",
  "content.checkout.shippingAddressDetected": "Shipping Address Detected Text",
  "content.checkout.savingAddressText": "Saving Address Text",
  "content.checkout.calculateShippingHint": "Calculate Shipping Hint Text",

  // Dropship Shipping Text (Product Detail)
  "content.productDetail.shippingEstimatedDelivery": "Dropship Estimated Delivery Text",
  "content.productDetail.shippingFreeLabel": "Dropship Free Shipping Label",
  "content.productDetail.shippingProcessingTime": "Dropship Processing Time Text",
  "content.productDetail.shippingTrackingNotice": "Dropship Tracking Notice Text",
  "content.productDetail.shippingWarehouseNotice": "Dropship Warehouse Notice Text",
  "content.productDetail.shippingReturnPolicyNote": "Dropship Return Policy Note",
  "content.productDetail.shippingCarrierLabel": "Dropship Carrier Label Text",
  "content.productDetail.shippingExtendedReturnNote": "Dropship Extended Return Note",
};
