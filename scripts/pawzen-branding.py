"""
Pawzen Brand Transformation — Complete storefront branding overhaul.

Design Philosophy:
- Navy + Gold = premium pet brand identity
- Warm backgrounds create a cozy, trustworthy feel
- Alternating section backgrounds create visual rhythm
- Subtle gradients and glass effects for modern luxury
- Consistent hover states and micro-interactions
- Typography hierarchy: elegant headings, readable body

Color Psychology:
- Deep Navy (#1B2838): Trust, stability, professionalism
- Forest Green (#1E4D3A): Natural, safe, wellness
- Antique Gold (#C9A962): Premium quality, warmth
- Warm Off-White (#F8F7F5): Clean, subtle warmth
- Warm Sand (#EDEAE5): Cozy, approachable
"""
import json
import copy
import os

BASE = os.path.dirname(os.path.abspath(__file__))
PLATFORM = os.path.dirname(BASE)
EN_PATH = os.path.join(PLATFORM, "apps", "apps", "storefront-control", "sample-config-import-en.json")
HE_PATH = os.path.join(PLATFORM, "apps", "apps", "storefront-control", "sample-config-import.json")

# ═══════════════════════════════════════
# PAWZEN BRAND TOKENS
# ═══════════════════════════════════════

COLORS = {
    "primary": "#1B2838",
    "secondary": "#1E4D3A",
    "accent": "#C9A962",
    "background": "#F8F7F5",
    "surface": "#EDEAE5",
    "text": "#0F1419",
    "textMuted": "#7A756E",
    "success": "#1E4D3A",
    "warning": "#C9A962",
    "error": "#8B3A3A",
}

# Derived colors for component overrides
NAVY_LIGHT = "#243447"  # Slightly lighter navy for hover
NAVY_DARK = "#111D2B"   # Darker navy for depth
GOLD_LIGHT = "#D4B978"  # Lighter gold for hover
GOLD_DARK = "#B89545"   # Darker gold for depth
GREEN_LIGHT = "#2A6B51" # Lighter forest green
CREAM = "#FBF9F6"       # Lightest warm white
SAND_LIGHT = "#F3F0EB"  # Light sand
CHARCOAL = "#2C2C2C"    # Dark text alternative


def build_english_config(en: dict) -> dict:
    """Transform English config into a beautiful, creative Pawzen storefront."""
    c = en["config"]

    # ═══════════════════════════════════════
    # STORE INFO
    # ═══════════════════════════════════════
    c["store"] = {
        "name": "Pawzen",
        "tagline": "Calm. Curated. Pet Care.",
        "type": "physical",
        "description": "Modern, curated pet accessories for dogs and cats. Thoughtfully designed products for your furry family.",
        "email": "support@pawzen.co",
        "phone": "+1-555-PAWZEN",
        "address": {
            "street": "123 Main Street",
            "city": "New York",
            "state": "NY",
            "zip": "10001",
            "country": "United States",
        },
    }

    # ═══════════════════════════════════════
    # BRANDING — Premium pet brand identity
    # ═══════════════════════════════════════
    c["branding"] = {
        "logo": "https://media.easy.co.il/images/UserThumbs/10035528_1752326685636_0.jpg",
        "logoAlt": "Pawzen - Modern Pet Accessories",
        "favicon": "/favicon.ico",
        "colors": copy.deepcopy(COLORS),
        "typography": {
            "fontHeading": "Playfair Display",
            "fontBody": "Inter",
            "fontMono": "JetBrains Mono",
            "fontSize": {
                "h1": "5xl",
                "h2": "4xl",
                "h3": "2xl",
                "h4": "xl",
                "body": "base",
                "small": "sm",
                "button": "base",
                "caption": "sm",
            },
        },
        "style": {
            "borderRadius": "lg",
            "buttonStyle": "solid",
            "cardShadow": "sm",
        },
    }

    # ═══════════════════════════════════════
    # FEATURES
    # ═══════════════════════════════════════
    c["features"] = {
        "wishlist": True,
        "compareProducts": False,
        "productReviews": True,
        "recentlyViewed": True,
        "scrollToTop": True,
        "guestCheckout": True,
        "expressCheckout": False,
        "savePaymentMethods": True,
        "digitalDownloads": False,
        "subscriptions": False,
        "giftCards": True,
        "productBundles": False,
        "newsletter": True,
        "promotionalBanners": True,
        "abandonedCartEmails": True,
        "socialLogin": False,
        "shareButtons": True,
        "instagramFeed": False,
        "relatedProducts": True,
        "stockAlerts": True,
    }

    # ═══════════════════════════════════════
    # E-COMMERCE
    # ═══════════════════════════════════════
    c["ecommerce"]["shipping"]["freeShippingThreshold"] = 50
    c["ecommerce"]["shipping"]["defaultEstimatedMinDays"] = 3
    c["ecommerce"]["shipping"]["defaultEstimatedMaxDays"] = 7

    # ═══════════════════════════════════════
    # HEADER — Elegant dark banner
    # ═══════════════════════════════════════
    c["header"] = {
        "banner": {
            "enabled": True,
            "text": "Free shipping on orders over $50 | Premium pet care, delivered",
            "backgroundColor": COLORS["primary"],
            "textColor": GOLD_LIGHT,
            "useSaleorPromotions": False,
            "useSaleorVouchers": False,
            "items": [],
            "manualItems": [],
            "autoScrollIntervalSeconds": 5,
            "useGradient": True,
            "gradientFrom": COLORS["primary"],
            "gradientTo": NAVY_DARK,
            "gradientStops": [
                {"color": NAVY_DARK, "position": 0},
                {"color": COLORS["primary"], "position": 50},
                {"color": NAVY_DARK, "position": 100},
            ],
            "gradientAngle": 90,
            "dismissible": False,
        },
        "showStoreName": True,
        "logoPosition": "left",
    }

    # ═══════════════════════════════════════
    # FOOTER
    # ═══════════════════════════════════════
    c["footer"]["copyrightText"] = "\u00a9 2026 Pawzen. All rights reserved."
    c["footer"]["returnPolicyContent"] = c["footer"].get("returnPolicyContent", "").replace("Mansour", "Pawzen").replace("mansour", "pawzen")
    c["footer"]["shippingPolicyContent"] = c["footer"].get("shippingPolicyContent", "").replace("Mansour", "Pawzen").replace("mansour", "pawzen")
    c["footer"]["termsOfServiceContent"] = c["footer"].get("termsOfServiceContent", "").replace("Mansour", "Pawzen").replace("mansour", "pawzen")

    # ═══════════════════════════════════════
    # HOMEPAGE SECTIONS — Visual rhythm via
    # alternating backgrounds and creative layout
    # ═══════════════════════════════════════
    sections = c["homepage"]["sections"]

    # Hero: Deep navy gradient with gold accents
    sections["hero"] = {
        "enabled": True,
        "type": "image",
        "title": "Welcome to Pawzen",
        "subtitle": "Modern, curated accessories for dogs & cats. Designed with love, delivered with care.",
        "ctaText": "Shop Now",
        "ctaLink": "/products",
        "badgeText": "New Collection",
        "imageUrl": None,
        "videoUrl": None,
        "slides": [],
        "overlayOpacity": 45,
        "textAlignment": "center",
        "autoRotateSeconds": 5,
        "showProgressBar": True,
        "showNavDots": True,
        "background": {
            "style": "gradient",
            "color": COLORS["primary"],
            "secondaryColor": COLORS["secondary"],
            "gradientDirection": "to-bottom-right",
        },
    }

    # Trust Strip: Warm cream with subtle green accent
    sections["trustStrip"] = {
        "enabled": True,
        "freeShippingText": "Pet-Safe Materials",
        "easyReturnsText": "Free Shipping Over $50",
        "secureCheckoutText": "24/7 Support",
        "supportText": "30-Day Returns",
        "background": {
            "style": "color-mix",
            "color": COLORS["secondary"],
            "secondaryColor": COLORS["background"],
            "mixPercentage": 6,
        },
    }

    # Marquee: Bold dark strip with gold text feel
    sections["marquee"] = {
        "enabled": True,
        "text": "\U0001f43e New arrivals weekly \u2022 Free shipping over $50 \u2022 Premium pet accessories \u2022 Vet-approved products \u2022 30-day easy returns \U0001f43e",
        "speedSeconds": 25,
        "textColor": GOLD_LIGHT,
        "background": {
            "style": "solid",
            "color": COLORS["primary"],
            "secondaryColor": None,
        },
    }

    # Brand Grid: Subtle mesh background
    sections["brandGrid"] = {
        "enabled": True,
        "title": "Trusted Brands",
        "subtitle": "Curated from the world's best pet brands",
        "maxBrands": 8,
        "showLogos": True,
        "layout": "grid",
        "background": {
            "style": "mesh",
            "color": None,
            "secondaryColor": None,
            "meshOpacity": 6,
            "meshGrade": "warm",
        },
    }

    # Categories: Clean, no background (let images breathe)
    sections["categories"] = {
        "enabled": True,
        "title": "Shop by Category",
        "subtitle": "Everything your pet needs, beautifully organized",
        "maxCategories": 6,
        "showProductCount": True,
        "showSubcategories": True,
        "layoutStyle": "mosaic",
        "background": {
            "style": "none",
            "color": None,
            "secondaryColor": None,
        },
    }

    # Trending: Subtle warm sand background
    sections["trending"] = {
        "enabled": True,
        "title": "New Arrivals",
        "subtitle": "Fresh finds for your furry friends",
        "collectionSlug": "new-arrivals",
        "fallbackToNewest": True,
        "maxProducts": 8,
        "layout": "grid",
        "background": {
            "style": "color-mix",
            "color": COLORS["accent"],
            "secondaryColor": COLORS["background"],
            "mixPercentage": 4,
        },
    }

    # Promotion Banner: Rich gradient for visual impact
    sections["promotionBanner"] = {
        "enabled": True,
        "badgeText": "Limited Time",
        "title": "Treat Your Pet",
        "highlight": "Up to 25% Off",
        "description": "Premium accessories for dogs and cats. Because they deserve the best.",
        "primaryCta": {"text": "Shop Sale", "link": "/products?collection=sale"},
        "secondaryCta": {"text": "All Products", "link": "/products"},
        "autoDetectDiscount": True,
        "background": {
            "style": "gradient",
            "color": COLORS["primary"],
            "secondaryColor": COLORS["secondary"],
            "gradientDirection": "to-bottom-right",
        },
    }

    # Flash Deals: Warm glass effect
    sections["flashDeals"] = {
        "enabled": True,
        "title": "Flash Deals",
        "subtitle": "Limited time offers on popular items",
        "badgeTemplate": "Save {discount}%",
        "collectionSlug": "sale",
        "maxProducts": 8,
        "background": {
            "style": "glass",
            "color": COLORS["error"],
            "secondaryColor": None,
            "glassBlur": 8,
            "glassOpacity": 4,
        },
    }

    # Collection Mosaic: Elegant mesh
    sections["collectionMosaic"] = {
        "enabled": True,
        "title": "Curated Collections",
        "subtitle": "Hand-picked selections for every pet parent",
        "maxCollections": 5,
        "excludeSlugs": ["hero-banner", "testimonials", "brands"],
        "layoutStyle": "mosaic",
        "background": {
            "style": "mesh",
            "color": None,
            "secondaryColor": None,
            "meshOpacity": 8,
            "meshGrade": "cool",
        },
    }

    # Best Sellers: Warm color mix
    sections["bestSellers"] = {
        "enabled": True,
        "title": "Best Sellers",
        "subtitle": "Loved by pet parents everywhere",
        "collectionSlug": "best-sellers",
        "fallbackToTopRated": True,
        "maxProducts": 8,
        "layout": "horizontal-scroll",
        "background": {
            "style": "color-mix",
            "color": COLORS["primary"],
            "secondaryColor": COLORS["background"],
            "mixPercentage": 5,
        },
    }

    # Customer Feedback: Clean with gold stars
    sections["customerFeedback"] = {
        "enabled": True,
        "title": "Happy Pet Parents",
        "subtitle": "Real stories from our community",
        "maxReviews": 3,
        "minRating": 4,
        "showProductName": True,
        "background": {
            "style": "pattern",
            "color": None,
            "secondaryColor": None,
            "patternType": "dots",
            "patternOpacity": 3,
        },
        "starColor": COLORS["accent"],
        "starEmptyColor": COLORS["surface"],
    }

    # Newsletter: Deep gradient for strong CTA
    sections["newsletter"] = {
        "enabled": True,
        "title": "Join the Pack",
        "subtitle": "Get tips, tricks & exclusive offers for your pets",
        "buttonText": "Subscribe",
        "placeholder": "your@email.com",
        "layout": "stacked",
        "background": {
            "style": "gradient",
            "color": COLORS["primary"],
            "secondaryColor": COLORS["secondary"],
            "gradientDirection": "to-bottom",
        },
    }

    # Recently Viewed
    sections["recentlyViewed"] = {
        "enabled": True,
        "background": {"style": "none", "color": None, "secondaryColor": None},
    }

    # Section order — visual rhythm: dark/light alternation
    c["homepage"]["sectionOrder"] = [
        "hero",           # dark gradient
        "trustStrip",     # light cream
        "marquee",        # dark solid
        "categories",     # clean white
        "trending",       # warm tint
        "brandGrid",      # mesh warm
        "promotionBanner",# dark gradient
        "flashDeals",     # glass effect
        "collectionMosaic",# mesh cool
        "bestSellers",    # light tint
        "customerFeedback",# dotted pattern
        "newsletter",     # dark gradient
        "recentlyViewed", # clean white
    ]

    # ═══════════════════════════════════════
    # SEO
    # ═══════════════════════════════════════
    c["seo"] = {
        "titleTemplate": "%s | Pawzen",
        "defaultTitle": "Pawzen \u2014 Modern Pet Accessories for Dogs & Cats",
        "defaultDescription": "Discover thoughtfully designed pet accessories. Premium toys, beds, feeders & more for dogs and cats. Free shipping over $50.",
        "defaultImage": "/og-image.jpg",
        "twitterHandle": "@pawzen",
    }

    # ═══════════════════════════════════════
    # INTEGRATIONS
    # ═══════════════════════════════════════
    c["integrations"]["social"] = {
        "facebook": "https://facebook.com/pawzen",
        "instagram": "https://instagram.com/pawzen.co",
        "twitter": None,
        "youtube": None,
        "tiktok": "https://tiktok.com/@pawzen",
        "pinterest": None,
    }

    # ═══════════════════════════════════════
    # PROMO POPUP
    # ═══════════════════════════════════════
    c["promoPopup"] = {
        "enabled": True,
        "title": "Welcome to Pawzen!",
        "body": "Enjoy up to 30% off on selected pet accessories. Your pet deserves the best.",
        "badge": "Up to 30% Off",
        "imageUrl": None,
        "backgroundImageUrl": None,
        "ctaText": "Shop Deals",
        "ctaLink": "/products?onSale=true",
        "itemsOnSaleText": "{count} {count, plural, =1 {item} other {items}} on sale",
        "maybeLaterText": "Maybe later",
        "delaySeconds": 3,
        "showOncePerSession": False,
        "ttlHours": 24,
        "excludeCheckout": True,
        "excludeCart": True,
        "autoDetectSales": True,
    }

    # ═══════════════════════════════════════
    # UI COMPONENTS — Cohesive premium styling
    # ═══════════════════════════════════════
    c["ui"]["buttons"] = {
        "borderRadius": "lg",
        "primary": {
            "backgroundColor": COLORS["primary"],
            "textColor": "#FFFFFF",
            "hoverBackgroundColor": NAVY_LIGHT,
            "borderColor": None,
        },
        "secondary": {
            "backgroundColor": COLORS["accent"],
            "textColor": COLORS["primary"],
            "hoverBackgroundColor": GOLD_DARK,
            "borderColor": None,
        },
        "outline": {
            "backgroundColor": "transparent",
            "textColor": COLORS["primary"],
            "hoverBackgroundColor": SAND_LIGHT,
            "borderColor": COLORS["primary"],
        },
        "danger": {
            "backgroundColor": COLORS["error"],
            "textColor": "#FFFFFF",
            "hoverBackgroundColor": "#7A3030",
            "borderColor": None,
        },
    }

    c["ui"]["badges"] = {
        "sale": {
            "backgroundColor": COLORS["error"],
            "textColor": "#FFFFFF",
            "borderRadius": "sm",
        },
        "new": {
            "backgroundColor": COLORS["secondary"],
            "textColor": "#FFFFFF",
            "borderRadius": "sm",
        },
        "outOfStock": {
            "backgroundColor": COLORS["textMuted"],
            "textColor": "#FFFFFF",
            "borderRadius": "sm",
        },
        "lowStock": {
            "backgroundColor": COLORS["accent"],
            "textColor": COLORS["primary"],
            "borderRadius": "sm",
        },
        "discount": {
            "backgroundColor": COLORS["error"],
            "textColor": "#FFFFFF",
            "borderRadius": "full",
        },
        "featured": {
            "backgroundColor": COLORS["accent"],
            "textColor": COLORS["primary"],
            "borderRadius": "sm",
        },
    }

    c["ui"]["inputs"] = {
        "borderRadius": "lg",
        "borderColor": COLORS["surface"],
        "focusBorderColor": COLORS["primary"],
        "focusRingColor": COLORS["accent"],
        "backgroundColor": "#FFFFFF",
        "placeholderColor": COLORS["textMuted"],
    }

    c["ui"]["checkbox"] = {
        "checkedBackgroundColor": COLORS["primary"],
        "borderRadius": "sm",
    }

    c["ui"]["productCard"] = {
        "borderRadius": "lg",
        "shadow": "sm",
        "hoverShadow": "lg",
        "showQuickView": True,
        "showWishlistButton": True,
        "showAddToCart": True,
        "imageAspectRatio": "square",
        "hoverEffect": "lift",
        "badgePosition": "top-start",
        "showBrandLabel": True,
        "showRating": True,
        "imageFit": "cover",
        "textStyles": {
            "name": {"fontSize": "sm", "fontWeight": "semibold", "color": None},
            "price": {"fontSize": "base", "fontWeight": "bold", "color": COLORS["primary"]},
            "originalPrice": {"fontSize": "sm", "fontWeight": "normal", "color": COLORS["textMuted"]},
            "reviewCount": {"fontSize": "xs", "fontWeight": "normal", "color": COLORS["textMuted"]},
        },
        "showPrice": True,
        "showOriginalPrice": True,
        "showCategory": True,
        "showDeliveryEstimate": True,
        "showShareButton": True,
        "showDiscountBadge": True,
        "showOutOfStockBadge": True,
        "showLowStockBadge": True,
        "showNewBadge": True,
        "titleMaxLines": 2,
        "contentAlignment": "start",
    }

    c["ui"]["toasts"] = {
        "position": "bottom-right",
        "borderRadius": "lg",
        "success": {
            "backgroundColor": COLORS["secondary"],
            "textColor": "#FFFFFF",
            "iconColor": "#FFFFFF",
        },
        "error": {
            "backgroundColor": COLORS["error"],
            "textColor": "#FFFFFF",
            "iconColor": "#FFFFFF",
        },
        "warning": {
            "backgroundColor": COLORS["accent"],
            "textColor": COLORS["primary"],
            "iconColor": COLORS["primary"],
        },
        "info": {
            "backgroundColor": COLORS["primary"],
            "textColor": "#FFFFFF",
            "iconColor": "#FFFFFF",
        },
    }

    c["ui"]["activeFiltersTags"] = {
        "containerBackgroundColor": CREAM,
        "containerBorderColor": COLORS["surface"],
        "containerBorderRadius": "lg",
        "containerPadding": 16,
        "containerShadow": "sm",
        "titleFontSize": "sm",
        "titleFontWeight": "semibold",
        "titleColor": COLORS["text"],
        "clearAllButtonFontSize": "xs",
        "clearAllButtonFontWeight": "medium",
        "clearAllButtonColor": COLORS["error"],
        "clearAllButtonHoverColor": "#7A3030",
        "tagBackgroundColor": COLORS["primary"],
        "tagBorderColor": COLORS["primary"],
        "tagTextColor": "#FFFFFF",
        "tagHoverBackgroundColor": NAVY_LIGHT,
        "tagHoverBorderColor": NAVY_LIGHT,
        "tagBorderRadius": "full",
        "tagPaddingX": 14,
        "tagPaddingY": 6,
        "tagFontSize": "xs",
        "tagFontWeight": "medium",
        "tagGap": 8,
        "removeButtonSize": 16,
        "removeButtonColor": "#FFFFFF",
        "removeButtonHoverBackgroundColor": NAVY_DARK,
        "removeButtonHoverColor": "#FFFFFF",
        "removeButtonBorderRadius": "full",
    }

    c["ui"]["filterSidebar"] = {
        "checkboxAccentColor": COLORS["primary"],
        "sectionTitleFontSize": "xs",
        "sectionTitleFontWeight": "bold",
        "sectionTitleColor": COLORS["text"],
        "sectionTitleHoverColor": COLORS["primary"],
        "chevronColor": COLORS["textMuted"],
        "chevronHoverColor": COLORS["primary"],
        "itemTextFontSize": "xs",
        "itemTextColor": COLORS["text"],
        "itemCountColor": COLORS["textMuted"],
        "sizeChipSelectedBg": COLORS["primary"],
        "sizeChipSelectedText": "#FFFFFF",
        "sizeChipSelectedBorder": COLORS["primary"],
        "clearAllButtonBg": "transparent",
        "clearAllButtonText": COLORS["error"],
        "clearAllButtonBorder": COLORS["error"],
        "clearAllButtonHoverBg": COLORS["error"],
        "clearAllButtonHoverText": "#FFFFFF",
        "priceInputFocusRingColor": COLORS["accent"],
        "priceQuickButtonActiveBg": COLORS["primary"],
        "priceQuickButtonActiveText": "#FFFFFF",
        "mobileShowResultsBg": COLORS["primary"],
        "mobileShowResultsText": "#FFFFFF",
    }

    c["ui"]["cart"] = {
        "displayMode": "drawer",
        "drawerSide": "right",
        "showDeleteText": False,
        "showSaveForLater": False,
    }

    c["ui"]["sectionViewAllButton"] = {
        "style": "pill",
        "icon": "chevron",
    }

    c["ui"]["icons"] = {
        "style": "outline",
        "defaultColor": COLORS["textMuted"],
        "activeColor": COLORS["primary"],
    }

    # ═══════════════════════════════════════
    # QUICK FILTERS — Navy pill style
    # ═══════════════════════════════════════
    c["quickFilters"]["style"]["navbarMode"] = {
        "buttonPaddingX": 16,
        "buttonPaddingY": 8,
        "buttonFontSize": "xs",
        "buttonFontWeight": "semibold",
        "buttonBorderRadius": "full",
        "buttonGap": 8,
        "groupLabelFontSize": "xs",
        "groupLabelPaddingX": 8,
        "groupLabelPaddingY": 4,
        "separatorWidth": 1,
        "separatorHeight": 24,
        "containerPaddingY": 10,
        "backgroundColor": None,
        "borderTopColor": COLORS["surface"],
        "borderBottomColor": COLORS["surface"],
        "shadowColor": None,
    }

    # ═══════════════════════════════════════
    # DARK MODE — Deep, rich, premium
    # ═══════════════════════════════════════
    c["darkMode"] = {
        "enabled": False,
        "auto": True,
        "colors": {
            "background": "#0D1117",
            "surface": "#161B22",
            "text": "#F0F0F0",
            "textMuted": "#8B949E",
            "border": "#30363D",
            "primary": COLORS["accent"],
            "secondary": GREEN_LIGHT,
            "accent": GOLD_LIGHT,
        },
    }

    # ═══════════════════════════════════════
    # DESIGN TOKENS
    # ═══════════════════════════════════════
    c["design"] = {
        "animations": {
            "preset": "moderate",
            "carouselCycleSeconds": 5,
            "toastDurationMs": 4000,
        },
        "spacing": {"sectionPaddingY": "relaxed"},
        "grid": {
            "productColumns": {"sm": 2, "md": 3, "lg": 4, "xl": 4},
            "productGap": "normal",
        },
        "statusColors": {
            "success": COLORS["secondary"],
            "warning": COLORS["accent"],
            "error": COLORS["error"],
            "info": COLORS["primary"],
        },
    }

    # ═══════════════════════════════════════
    # CHECKOUT UI
    # ═══════════════════════════════════════
    c["checkoutUi"] = {
        "accordion": {
            "completedStepColor": COLORS["secondary"],
            "activeStepColor": COLORS["primary"],
        },
        "confirmation": {
            "showTimeline": True,
            "showPrintReceipt": True,
        },
        "progressBar": {
            "completedColor": COLORS["secondary"],
            "activeColor": COLORS["primary"],
        },
    }

    # ═══════════════════════════════════════
    # RELATED PRODUCTS
    # ═══════════════════════════════════════
    c["relatedProducts"] = {
        "enabled": True,
        "strategy": "category",
        "maxItems": 8,
        "showOnMobile": True,
        "title": "You May Also Like",
        "subtitle": "Customers also loved these products",
    }

    # ═══════════════════════════════════════
    # CARD OVERRIDES
    # ═══════════════════════════════════════
    c["cardOverrides"] = {
        "plp": {
            "showWishlistButton": True,
            "showAddToCart": True,
            "showBrandLabel": True,
            "showRating": True,
            "showPrice": True,
            "showOriginalPrice": True,
            "showShareButton": True,
            "showDiscountBadge": True,
            "showOutOfStockBadge": True,
            "showLowStockBadge": True,
            "showNewBadge": True,
            "titleMaxLines": 2,
        },
        "relatedProducts": {},
        "recentlyViewed": {},
        "wishlistDrawer": {},
        "productGrid": {
            "showWishlistButton": True,
            "showAddToCart": True,
            "showBrandLabel": True,
            "showRating": True,
            "showPrice": True,
            "showOriginalPrice": True,
            "showShareButton": True,
            "titleMaxLines": 2,
        },
    }

    # ═══════════════════════════════════════
    # COMPONENT OVERRIDES — Per-component
    # visual refinements using CSS custom props
    # ═══════════════════════════════════════
    c["componentOverrides"] = {
        # ── Homepage ──────────────────────
        "homepage.hero": {
            "backgroundColor": COLORS["primary"],
            "textColor": "#FFFFFF",
            "fontFamily": "heading",
            "fontSize": "5xl",
            "fontWeight": "bold",
        },
        "homepage.trustStrip": {
            "backgroundColor": CREAM,
            "textColor": COLORS["text"],
            "fontSize": "sm",
            "fontWeight": "medium",
        },
        "homepage.marquee": {
            "backgroundColor": COLORS["primary"],
            "textColor": GOLD_LIGHT,
            "fontSize": "sm",
            "fontWeight": "semibold",
        },
        "homepage.categories": {
            "textColor": COLORS["text"],
            "fontFamily": "heading",
            "fontSize": "2xl",
            "fontWeight": "bold",
        },
        "homepage.trending": {
            "textColor": COLORS["text"],
            "fontFamily": "heading",
            "fontSize": "2xl",
            "fontWeight": "bold",
        },
        "homepage.promotionBanner": {
            "backgroundColor": COLORS["primary"],
            "textColor": "#FFFFFF",
            "fontFamily": "heading",
            "fontSize": "3xl",
            "fontWeight": "bold",
        },
        "homepage.flashDeals": {
            "textColor": COLORS["text"],
            "fontFamily": "heading",
            "fontSize": "2xl",
            "fontWeight": "bold",
        },
        "homepage.collectionMosaic": {
            "textColor": COLORS["text"],
            "fontFamily": "heading",
            "fontSize": "2xl",
            "fontWeight": "bold",
        },
        "homepage.bestSellers": {
            "textColor": COLORS["text"],
            "fontFamily": "heading",
            "fontSize": "2xl",
            "fontWeight": "bold",
        },
        "homepage.customerFeedback": {
            "textColor": COLORS["text"],
            "fontFamily": "heading",
            "fontSize": "2xl",
            "fontWeight": "bold",
        },
        "homepage.newsletter": {
            "backgroundColor": COLORS["primary"],
            "textColor": "#FFFFFF",
            "fontFamily": "heading",
            "fontSize": "2xl",
            "fontWeight": "bold",
        },
        "homepage.brandGrid": {
            "textColor": COLORS["text"],
            "fontFamily": "heading",
            "fontSize": "2xl",
            "fontWeight": "bold",
        },
        "homepage.productCard": {
            "borderRadius": "lg",
            "shadow": "sm",
            "hoverShadow": "lg",
            "fontSize": "sm",
            "fontWeight": "semibold",
        },

        # ── Layout ────────────────────────
        "layout.header": {
            "backgroundColor": "#FFFFFF",
            "textColor": COLORS["text"],
            "borderColor": COLORS["surface"],
            "shadow": "sm",
        },
        "layout.headerBanner": {
            "backgroundColor": COLORS["primary"],
            "textColor": GOLD_LIGHT,
            "fontSize": "xs",
            "fontWeight": "medium",
        },
        "layout.footer": {
            "backgroundColor": COLORS["primary"],
            "textColor": "#FFFFFF",
            "fontSize": "sm",
        },
        "layout.mobileBottomNav": {
            "backgroundColor": "#FFFFFF",
            "textColor": COLORS["textMuted"],
            "borderColor": COLORS["surface"],
            "shadow": "lg",
        },
        "layout.searchDialog": {
            "backgroundColor": "#FFFFFF",
            "textColor": COLORS["text"],
            "borderRadius": "lg",
            "shadow": "lg",
        },

        # ── PLP ───────────────────────────
        "plp.productCard": {
            "borderRadius": "lg",
            "shadow": "sm",
            "hoverShadow": "lg",
            "fontSize": "sm",
        },
        "plp.productGrid": {
            "gap": "1.25rem",
        },
        "plp.activeFiltersTags": {
            "backgroundColor": CREAM,
            "borderRadius": "lg",
            "shadow": "sm",
        },
        "plp.stickyQuickFilters": {
            "backgroundColor": "#FFFFFF",
            "borderColor": COLORS["surface"],
            "shadow": "sm",
            "fontSize": "xs",
        },
        "plp.sortBy": {
            "textColor": COLORS["text"],
            "fontSize": "sm",
            "fontWeight": "medium",
        },

        # ── PDP ───────────────────────────
        "pdp.productGallery": {
            "borderRadius": "lg",
        },
        "pdp.addToCart": {
            "backgroundColor": COLORS["primary"],
            "textColor": "#FFFFFF",
            "borderRadius": "lg",
            "fontWeight": "bold",
            "fontSize": "base",
            "hoverBackgroundColor": NAVY_LIGHT,
        },
        "pdp.stickyMobileAddToCart": {
            "backgroundColor": "#FFFFFF",
            "shadow": "lg",
            "borderColor": COLORS["surface"],
        },
        "pdp.variantSelector": {
            "borderRadius": "md",
            "borderColor": COLORS["surface"],
            "fontSize": "sm",
        },
        "pdp.quantitySelector": {
            "borderRadius": "md",
            "borderColor": COLORS["surface"],
        },
        "pdp.productTabs": {
            "textColor": COLORS["text"],
            "borderColor": COLORS["surface"],
            "fontSize": "sm",
            "fontWeight": "medium",
        },
        "pdp.relatedProducts": {
            "textColor": COLORS["text"],
            "fontFamily": "heading",
            "fontSize": "xl",
            "fontWeight": "bold",
        },

        # ── Cart ──────────────────────────
        "cart.cartPage": {
            "backgroundColor": COLORS["background"],
            "textColor": COLORS["text"],
        },
        "cart.cartDrawer": {
            "backgroundColor": "#FFFFFF",
            "textColor": COLORS["text"],
            "shadow": "lg",
        },

        # ── Checkout ──────────────────────
        "checkout.checkoutPage": {
            "backgroundColor": COLORS["background"],
            "textColor": COLORS["text"],
        },
        "checkout.summary": {
            "backgroundColor": "#FFFFFF",
            "borderRadius": "lg",
            "shadow": "sm",
            "borderColor": COLORS["surface"],
        },
        "checkout.placeOrder": {
            "backgroundColor": COLORS["primary"],
            "textColor": "#FFFFFF",
            "borderRadius": "lg",
            "fontWeight": "bold",
            "hoverBackgroundColor": NAVY_LIGHT,
        },
        "checkout.contactStep": {
            "backgroundColor": "#FFFFFF",
            "borderRadius": "lg",
            "borderColor": COLORS["surface"],
        },
        "checkout.shippingStep": {
            "backgroundColor": "#FFFFFF",
            "borderRadius": "lg",
            "borderColor": COLORS["surface"],
        },
        "checkout.deliveryStep": {
            "backgroundColor": "#FFFFFF",
            "borderRadius": "lg",
            "borderColor": COLORS["surface"],
        },
        "checkout.paymentStep": {
            "backgroundColor": "#FFFFFF",
            "borderRadius": "lg",
            "borderColor": COLORS["surface"],
        },
        "checkout.orderConfirmation": {
            "backgroundColor": COLORS["background"],
            "textColor": COLORS["text"],
        },

        # ── Account ──────────────────────
        "account.dashboard": {
            "backgroundColor": COLORS["background"],
            "textColor": COLORS["text"],
        },
        "account.orders": {
            "backgroundColor": "#FFFFFF",
            "borderRadius": "lg",
            "shadow": "sm",
        },
        "account.addresses": {
            "backgroundColor": "#FFFFFF",
            "borderRadius": "lg",
            "shadow": "sm",
        },
        "account.wishlist": {
            "backgroundColor": "#FFFFFF",
            "borderRadius": "lg",
        },
        "account.settings": {
            "backgroundColor": "#FFFFFF",
            "borderRadius": "lg",
            "shadow": "sm",
        },

        # ── Auth ──────────────────────────
        "auth.login": {
            "backgroundColor": "#FFFFFF",
            "borderRadius": "lg",
            "shadow": "md",
            "textColor": COLORS["text"],
        },
        "auth.forgotPassword": {
            "backgroundColor": "#FFFFFF",
            "borderRadius": "lg",
            "shadow": "md",
            "textColor": COLORS["text"],
        },
    }

    # ═══════════════════════════════════════
    # CONTENT — Update pet-specific text
    # ═══════════════════════════════════════
    content = c["content"]

    content["homepage"]["heroDefaultTitle"] = "Welcome to Pawzen"
    content["homepage"]["heroDefaultSubtitle"] = "Modern, curated accessories for dogs & cats. Designed with love, delivered with care."
    content["homepage"]["promoDescriptionFallback"] = "Premium pet accessories for your furry family. Limited time collection."
    content["homepage"]["brandsTitle"] = "Trusted Brands"
    content["homepage"]["brandsSubtitle"] = "Shop from the world's best pet brands"
    content["homepage"]["categoriTitle"] = "Shop by Category"

    content["general"]["newsletterTitle"] = "Join the Pack"
    content["general"]["newsletterDescription"] = "Get pet care tips, exclusive offers & new product alerts"

    content["navbar"]["popularSearchTerms"] = ["Dog Toys", "Cat Toys", "Beds & Blankets", "Sale"]

    content["contact"]["faqs"] = [
        {
            "question": "What are your shipping times?",
            "answer": "Standard shipping takes 3-7 business days. Express shipping is available for 1-3 business day delivery. International orders typically take 7-15 business days.",
        },
        {
            "question": "Are your products safe for pets?",
            "answer": "Absolutely! All our products are made from pet-safe, non-toxic materials. We work with veterinarians to ensure every item meets safety standards.",
        },
        {
            "question": "What is your return policy?",
            "answer": "We offer a 30-day return policy on all unused items in their original packaging. If your pet doesn't love it, we'll make it right.",
        },
    ]

    content["faq"]["categories"] = [
        {
            "name": "Orders & Shipping",
            "icon": "\U0001f4e6",
            "items": [
                {"question": "How long does shipping take?", "answer": "Standard shipping takes 3-7 business days. Express shipping is available for 1-3 business day delivery. International orders typically arrive within 7-15 business days."},
                {"question": "Do you offer free shipping?", "answer": "Yes! We offer free standard shipping on all orders over $50."},
                {"question": "Can I track my order?", "answer": "Once your order ships, you'll receive an email with tracking information. You can also track your order in your account dashboard."},
                {"question": "Do you ship internationally?", "answer": "Yes, we ship to most countries worldwide. Shipping rates and delivery times vary by location."},
                {"question": "Can I change or cancel my order?", "answer": "You can modify or cancel your order within 1 hour of placing it. After that, orders enter processing and cannot be changed."},
            ],
        },
        {
            "name": "Returns & Exchanges",
            "icon": "\U0001f504",
            "items": [
                {"question": "What is your return policy?", "answer": "We offer a 30-day return policy on all unused items in their original packaging. If your pet doesn't love it, we'll make it right."},
                {"question": "How do I return an item?", "answer": "Contact support@pawzen.co to initiate a return. We'll send you a prepaid shipping label via email."},
                {"question": "Are returns free?", "answer": "Returns within the US are free. For international returns, customers are responsible for return shipping costs."},
                {"question": "How long do refunds take?", "answer": "Once we receive your return, please allow 3-5 business days for inspection. Refunds may take an additional 5-10 business days to appear."},
            ],
        },
        {
            "name": "Products & Safety",
            "icon": "\U0001f43e",
            "items": [
                {"question": "Are your products safe for pets?", "answer": "Absolutely! All our products are made from pet-safe, non-toxic materials. We work with veterinarians to ensure every item meets safety standards."},
                {"question": "How do I choose the right size?", "answer": "Each product page includes a detailed size guide. Measure your pet and compare with our size charts for the best fit."},
                {"question": "Do you offer product warranties?", "answer": "Yes! Most products come with a manufacturer warranty against defects. Details are on individual product pages."},
                {"question": "Can I get notified when an item is back in stock?", "answer": "Yes! On any sold-out product page, you'll find a 'Notify Me' button."},
            ],
        },
        {
            "name": "Payment & Security",
            "icon": "\U0001f512",
            "items": [
                {"question": "What payment methods do you accept?", "answer": "We accept all major credit cards, PayPal, Apple Pay, Google Pay, and gift cards."},
                {"question": "Is my payment information secure?", "answer": "We use industry-standard SSL encryption. All payments are processed through secure, PCI-compliant processors."},
                {"question": "Do you offer gift cards?", "answer": "Yes! Gift cards are available in various amounts and make perfect gifts for pet parents."},
            ],
        },
        {
            "name": "Account",
            "icon": "\U0001f464",
            "items": [
                {"question": "Do I need an account to order?", "answer": "No, you can checkout as a guest. However, creating an account lets you track orders, save addresses, and manage your wishlist."},
                {"question": "How do I reset my password?", "answer": "Click 'Sign In' then 'Forgot Password'. Enter your email and we'll send you a reset link."},
            ],
        },
    ]

    return en


def build_hebrew_config(he: dict, en: dict) -> dict:
    """Build Hebrew config by syncing structure from English + translating content."""
    hc = he["config"]
    ec = en["config"]

    # ═══════════════════════════════════════
    # STORE INFO — Pawzen Hebrew
    # ═══════════════════════════════════════
    hc["store"] = {
        "name": "Pawzen",
        "tagline": "\u05e9\u05dc\u05d5\u05d5\u05d4 \u05d5\u05d0\u05d9\u05db\u05d5\u05ea \u05dc\u05d7\u05d9\u05d9\u05ea \u05d4\u05de\u05d7\u05de\u05d3",
        "type": "physical",
        "description": "\u05d7\u05e0\u05d5\u05ea \u05d0\u05d5\u05e0\u05dc\u05d9\u05d9\u05df \u05dc\u05d0\u05d1\u05d9\u05d6\u05e8\u05d9 \u05d7\u05d9\u05d5\u05ea \u05de\u05d7\u05de\u05d3 \u05d0\u05d9\u05db\u05d5\u05ea\u05d9\u05d9\u05dd \u05dc\u05db\u05dc\u05d1\u05d9\u05dd \u05d5\u05d7\u05ea\u05d5\u05dc\u05d9\u05dd. \u05de\u05d5\u05e6\u05e8\u05d9\u05dd \u05de\u05d5\u05d3\u05e8\u05e0\u05d9\u05d9\u05dd \u05d5\u05de\u05e2\u05d5\u05e6\u05d1\u05d9\u05dd \u05dc\u05de\u05d7\u05de\u05d3 \u05e9\u05dc\u05db\u05dd.",
        "email": "support@pawzen.co",
        "phone": "04-9502222",
        "address": {
            "street": "\u05db\u05de\u05d0\u05dc \u05d2\u05d5\u05e0\u05d1\u05dc\u05d0\u05d8 2",
            "city": "\u05e9\u05e4\u05e8\u05e2\u05dd",
            "state": "Northern District",
            "zip": "16000",
            "country": "Israel",
        },
    }

    # ═══════════════════════════════════════
    # SYNC VISUAL SETTINGS FROM ENGLISH
    # ═══════════════════════════════════════
    hc["branding"] = copy.deepcopy(ec["branding"])
    hc["branding"]["logoAlt"] = "Pawzen - \u05d0\u05d1\u05d9\u05d6\u05e8\u05d9\u05dd \u05dc\u05d7\u05d9\u05d5\u05ea \u05de\u05d7\u05de\u05d3"

    hc["features"] = copy.deepcopy(ec["features"])

    # Ecommerce — keep ILS-specific values
    hc["ecommerce"]["shipping"]["freeShippingThreshold"] = 200
    hc["ecommerce"]["shipping"]["defaultEstimatedMinDays"] = 5
    hc["ecommerce"]["shipping"]["defaultEstimatedMaxDays"] = 15

    hc["header"] = copy.deepcopy(ec["header"])
    hc["header"]["banner"]["text"] = "\u05de\u05e9\u05dc\u05d5\u05d7 \u05d7\u05d9\u05e0\u05dd \u05de\u05e2\u05dc \u2aa1200 | \u05d0\u05d1\u05d9\u05d6\u05e8\u05d9\u05dd \u05d0\u05d9\u05db\u05d5\u05ea\u05d9\u05d9\u05dd \u05dc\u05de\u05d7\u05de\u05d3 \u05e9\u05dc\u05da"

    # Footer
    hc["footer"]["copyrightText"] = "\u00a9 2026 Pawzen. \u05db\u05dc \u05d4\u05d6\u05db\u05d5\u05d9\u05d5\u05ea \u05e9\u05de\u05d5\u05e8\u05d5\u05ea."

    # Sync homepage structure (visual settings)
    hc["homepage"]["sectionOrder"] = copy.deepcopy(ec["homepage"]["sectionOrder"])

    # Copy section backgrounds and layouts from English
    for key in ec["homepage"]["sections"]:
        if key not in hc["homepage"]["sections"]:
            hc["homepage"]["sections"][key] = copy.deepcopy(ec["homepage"]["sections"][key])
        else:
            # Sync background and layout fields
            en_section = ec["homepage"]["sections"][key]
            he_section = hc["homepage"]["sections"][key]
            if "background" in en_section:
                he_section["background"] = copy.deepcopy(en_section["background"])
            if "enabled" in en_section:
                he_section["enabled"] = en_section["enabled"]
            if "layout" in en_section:
                he_section["layout"] = en_section["layout"]
            if "layoutStyle" in en_section:
                he_section["layoutStyle"] = en_section["layoutStyle"]

    # Hebrew section text
    hs = hc["homepage"]["sections"]
    hs["hero"]["title"] = "\u05d1\u05e8\u05d5\u05db\u05d9\u05dd \u05d4\u05d1\u05d0\u05d9\u05dd \u05dc-Pawzen"
    hs["hero"]["subtitle"] = "\u05d0\u05d1\u05d9\u05d6\u05e8\u05d9\u05dd \u05de\u05d5\u05d3\u05e8\u05e0\u05d9\u05d9\u05dd \u05d5\u05de\u05e2\u05d5\u05e6\u05d1\u05d9\u05dd \u05dc\u05db\u05dc\u05d1\u05d9\u05dd \u05d5\u05d7\u05ea\u05d5\u05dc\u05d9\u05dd. \u05de\u05e2\u05d5\u05e6\u05d1\u05d9\u05dd \u05d1\u05d0\u05d4\u05d1\u05d4, \u05e0\u05e9\u05dc\u05d7\u05d9\u05dd \u05d1\u05d0\u05db\u05e4\u05ea."
    hs["hero"]["ctaText"] = "\u05dc\u05e7\u05e0\u05d9\u05d5\u05ea"
    hs["hero"]["badgeText"] = "\u05e7\u05d5\u05dc\u05e7\u05e6\u05d9\u05d4 \u05d7\u05d3\u05e9\u05d4"

    hs["trustStrip"]["freeShippingText"] = "\u05d7\u05d5\u05de\u05e8\u05d9\u05dd \u05d1\u05d8\u05d5\u05d7\u05d9\u05dd \u05dc\u05d7\u05d9\u05d5\u05ea \u05de\u05d7\u05de\u05d3"
    hs["trustStrip"]["easyReturnsText"] = "\u05de\u05e9\u05dc\u05d5\u05d7 \u05d7\u05d9\u05e0\u05dd \u05de\u05e2\u05dc \u2aa1200"
    hs["trustStrip"]["secureCheckoutText"] = "\u05ea\u05de\u05d9\u05db\u05d4 24/7"
    hs["trustStrip"]["supportText"] = "\u05d4\u05d7\u05d6\u05e8\u05d5\u05ea \u05ea\u05d5\u05da 30 \u05d9\u05d5\u05dd"

    hs["marquee"]["text"] = "\U0001f43e \u05de\u05d5\u05e6\u05e8\u05d9\u05dd \u05d7\u05d3\u05e9\u05d9\u05dd \u05db\u05dc \u05e9\u05d1\u05d5\u05e2 \u2022 \u05de\u05e9\u05dc\u05d5\u05d7 \u05d7\u05d9\u05e0\u05dd \u05de\u05e2\u05dc \u2aa1200 \u2022 \u05d0\u05d1\u05d9\u05d6\u05e8\u05d9\u05dd \u05d0\u05d9\u05db\u05d5\u05ea\u05d9\u05d9\u05dd \u05dc\u05de\u05d7\u05de\u05d3 \u2022 \u05de\u05d0\u05d5\u05e9\u05e8\u05d9 \u05d5\u05d8\u05e8\u05d9\u05e0\u05e8 \u2022 \u05d4\u05d7\u05d6\u05e8\u05d5\u05ea \u05ea\u05d5\u05da 30 \u05d9\u05d5\u05dd \U0001f43e"

    hs["brandGrid"]["title"] = "\u05de\u05d5\u05ea\u05d2\u05d9\u05dd \u05de\u05d5\u05d1\u05d9\u05dc\u05d9\u05dd"
    hs["brandGrid"]["subtitle"] = "\u05d0\u05d5\u05e1\u05e3 \u05de\u05d4\u05de\u05d5\u05ea\u05d2\u05d9\u05dd \u05d4\u05d8\u05d5\u05d1\u05d9\u05dd \u05d1\u05e2\u05d5\u05dc\u05dd"

    hs["categories"]["title"] = "\u05e7\u05e0\u05d9\u05d5\u05ea \u05dc\u05e4\u05d9 \u05e7\u05d8\u05d2\u05d5\u05e8\u05d9\u05d4"
    hs["categories"]["subtitle"] = "\u05db\u05dc \u05de\u05d4 \u05e9\u05d4\u05de\u05d7\u05de\u05d3 \u05e9\u05dc\u05da \u05e6\u05e8\u05d9\u05da, \u05de\u05e1\u05d5\u05d3\u05e8 \u05d1\u05e7\u05e4\u05d9\u05d3\u05d4"

    hs["trending"]["title"] = "\u05de\u05d5\u05e6\u05e8\u05d9\u05dd \u05d7\u05d3\u05e9\u05d9\u05dd"
    hs["trending"]["subtitle"] = "\u05d7\u05d3\u05e9 \u05d1\u05d7\u05e0\u05d5\u05ea \u05dc\u05d7\u05d1\u05e8\u05d9\u05dd \u05d4\u05e4\u05e8\u05d5\u05d5\u05ea\u05d9\u05d9\u05dd"

    hs["promotionBanner"]["badgeText"] = "\u05de\u05d1\u05e6\u05e2 \u05de\u05d5\u05d2\u05d1\u05dc"
    hs["promotionBanner"]["title"] = "\u05e4\u05e0\u05e7\u05d5 \u05d0\u05ea \u05d4\u05de\u05d7\u05de\u05d3"
    hs["promotionBanner"]["highlight"] = "\u05e2\u05d3 25% \u05d4\u05e0\u05d7\u05d4"
    hs["promotionBanner"]["description"] = "\u05d0\u05d1\u05d9\u05d6\u05e8\u05d9\u05dd \u05d0\u05d9\u05db\u05d5\u05ea\u05d9\u05d9\u05dd \u05dc\u05db\u05dc\u05d1\u05d9\u05dd \u05d5\u05d7\u05ea\u05d5\u05dc\u05d9\u05dd. \u05db\u05d9 \u05d4\u05dd \u05e8\u05d0\u05d5\u05d9\u05d9\u05dd \u05dc\u05d4\u05db\u05d9 \u05d8\u05d5\u05d1."
    hs["promotionBanner"]["primaryCta"] = {"text": "\u05dc\u05de\u05d1\u05e6\u05e2\u05d9\u05dd", "link": "/products?collection=sale"}
    hs["promotionBanner"]["secondaryCta"] = {"text": "\u05db\u05dc \u05d4\u05de\u05d5\u05e6\u05e8\u05d9\u05dd", "link": "/products"}

    hs["flashDeals"]["title"] = "\u05de\u05d1\u05e6\u05e2\u05d9 \u05d1\u05d6\u05e7"
    hs["flashDeals"]["subtitle"] = "\u05d4\u05e6\u05e2\u05d5\u05ea \u05d1\u05d6\u05de\u05df \u05de\u05d5\u05d2\u05d1\u05dc"
    hs["flashDeals"]["badgeTemplate"] = "\u05d7\u05d9\u05e1\u05db\u05d5\u05df {discount}%"

    hs["collectionMosaic"]["title"] = "\u05e7\u05d5\u05dc\u05e7\u05e6\u05d9\u05d5\u05ea \u05e0\u05d1\u05d7\u05e8\u05d5\u05ea"
    hs["collectionMosaic"]["subtitle"] = "\u05d0\u05d5\u05e1\u05e4\u05d9\u05dd \u05e9\u05e0\u05d1\u05d7\u05e8\u05d5 \u05d1\u05e7\u05e4\u05d9\u05d3\u05d4 \u05dc\u05db\u05dc \u05d4\u05d5\u05e8\u05d4 \u05dc\u05de\u05d7\u05de\u05d3"

    hs["bestSellers"]["title"] = "\u05d4\u05e0\u05de\u05db\u05e8\u05d9\u05dd \u05d1\u05d9\u05d5\u05ea\u05e8"
    hs["bestSellers"]["subtitle"] = "\u05d0\u05d4\u05d5\u05d1\u05d9\u05dd \u05e2\u05dc \u05d9\u05d3\u05d9 \u05d4\u05d5\u05e8\u05d9\u05dd \u05dc\u05de\u05d7\u05de\u05d3 \u05d1\u05db\u05dc \u05de\u05e7\u05d5\u05dd"

    hs["customerFeedback"]["title"] = "\u05d4\u05d5\u05e8\u05d9\u05dd \u05de\u05e8\u05d5\u05e6\u05d9\u05dd"
    hs["customerFeedback"]["subtitle"] = "\u05e1\u05d9\u05e4\u05d5\u05e8\u05d9\u05dd \u05d0\u05de\u05d9\u05ea\u05d9\u05d9\u05dd \u05de\u05d4\u05e7\u05d4\u05d9\u05dc\u05d4 \u05e9\u05dc\u05e0\u05d5"

    hs["newsletter"]["title"] = "\u05d4\u05e6\u05d8\u05e8\u05e4\u05d5 \u05dc\u05dc\u05d4\u05e7\u05d4"
    hs["newsletter"]["subtitle"] = "\u05d8\u05d9\u05e4\u05d9\u05dd, \u05d8\u05e8\u05d9\u05e7\u05d9\u05dd \u05d5\u05d4\u05e6\u05e2\u05d5\u05ea \u05d1\u05dc\u05e2\u05d3\u05d9\u05d5\u05ea \u05dc\u05de\u05d7\u05de\u05d3 \u05e9\u05dc\u05db\u05dd"
    hs["newsletter"]["buttonText"] = "\u05d4\u05e8\u05e9\u05de\u05d4"
    hs["newsletter"]["placeholder"] = "you@email.com"

    # Sync all non-text homepage section fields
    for key in ["starColor", "starEmptyColor"]:
        if key in ec["homepage"]["sections"].get("customerFeedback", {}):
            hs["customerFeedback"][key] = ec["homepage"]["sections"]["customerFeedback"][key]

    # ═══════════════════════════════════════
    # SYNC VISUAL CONFIGS (no text)
    # ═══════════════════════════════════════
    hc["ui"] = copy.deepcopy(ec["ui"])
    hc["darkMode"] = copy.deepcopy(ec["darkMode"])
    hc["design"] = copy.deepcopy(ec["design"])
    hc["checkoutUi"] = copy.deepcopy(ec["checkoutUi"])
    hc["cardOverrides"] = copy.deepcopy(ec["cardOverrides"])
    hc["componentOverrides"] = copy.deepcopy(ec["componentOverrides"])
    hc["quickFilters"] = copy.deepcopy(ec["quickFilters"])
    hc["relatedProducts"] = copy.deepcopy(ec["relatedProducts"])
    hc["relatedProducts"]["title"] = "\u05d0\u05d5\u05dc\u05d9 \u05d2\u05dd \u05ea\u05d0\u05d4\u05d1\u05d5"
    hc["relatedProducts"]["subtitle"] = "\u05dc\u05e7\u05d5\u05d7\u05d5\u05ea \u05e6\u05e4\u05d5 \u05d2\u05dd \u05d1\u05de\u05d5\u05e6\u05e8\u05d9\u05dd \u05d4\u05d0\u05dc\u05d4"

    # ═══════════════════════════════════════
    # SEO — Hebrew
    # ═══════════════════════════════════════
    hc["seo"] = {
        "titleTemplate": "%s | Pawzen",
        "defaultTitle": "Pawzen \u2014 \u05d0\u05d1\u05d9\u05d6\u05e8\u05d9\u05dd \u05de\u05d5\u05d3\u05e8\u05e0\u05d9\u05d9\u05dd \u05dc\u05db\u05dc\u05d1\u05d9\u05dd \u05d5\u05d7\u05ea\u05d5\u05dc\u05d9\u05dd",
        "defaultDescription": "\u05d2\u05dc\u05d5 \u05d0\u05d1\u05d9\u05d6\u05e8\u05d9\u05dd \u05de\u05e2\u05d5\u05e6\u05d1\u05d9\u05dd \u05dc\u05d7\u05d9\u05d5\u05ea \u05de\u05d7\u05de\u05d3. \u05e6\u05e2\u05e6\u05d5\u05e2\u05d9\u05dd, \u05de\u05d9\u05d8\u05d5\u05ea, \u05de\u05d6\u05d9\u05e0\u05d9\u05dd \u05d5\u05e2\u05d5\u05d3 \u05dc\u05db\u05dc\u05d1\u05d9\u05dd \u05d5\u05d7\u05ea\u05d5\u05dc\u05d9\u05dd. \u05de\u05e9\u05dc\u05d5\u05d7 \u05d7\u05d9\u05e0\u05dd \u05de\u05e2\u05dc \u2aa1200.",
        "defaultImage": "/og-image.jpg",
        "twitterHandle": "@pawzen",
    }

    # ═══════════════════════════════════════
    # LOCALIZATION — Hebrew RTL
    # ═══════════════════════════════════════
    hc["localization"]["defaultLocale"] = "he-IL"
    hc["localization"]["direction"] = "auto"

    # ═══════════════════════════════════════
    # SOCIAL & INTEGRATIONS
    # ═══════════════════════════════════════
    hc["integrations"]["social"] = copy.deepcopy(ec["integrations"]["social"])

    # ═══════════════════════════════════════
    # PROMO POPUP — Hebrew
    # ═══════════════════════════════════════
    hc["promoPopup"] = copy.deepcopy(ec["promoPopup"])
    hc["promoPopup"]["title"] = "\u05d1\u05e8\u05d5\u05db\u05d9\u05dd \u05d4\u05d1\u05d0\u05d9\u05dd \u05dc-Pawzen!"
    hc["promoPopup"]["body"] = "\u05e2\u05d3 30% \u05d4\u05e0\u05d7\u05d4 \u05e2\u05dc \u05d0\u05d1\u05d9\u05d6\u05e8\u05d9\u05dd \u05e0\u05d1\u05d7\u05e8\u05d9\u05dd. \u05d4\u05de\u05d7\u05de\u05d3 \u05e9\u05dc\u05db\u05dd \u05e8\u05d0\u05d5\u05d9 \u05dc\u05d4\u05db\u05d9 \u05d8\u05d5\u05d1."
    hc["promoPopup"]["badge"] = "\u05e2\u05d3 30% \u05d4\u05e0\u05d7\u05d4"
    hc["promoPopup"]["ctaText"] = "\u05dc\u05de\u05d1\u05e6\u05e2\u05d9\u05dd"
    hc["promoPopup"]["maybeLaterText"] = "\u05d0\u05d5\u05dc\u05d9 \u05de\u05d0\u05d5\u05d7\u05e8 \u05d9\u05d5\u05ea\u05e8"

    # ═══════════════════════════════════════
    # HEBREW CONTENT — Key translated sections
    # (content block is massive, only update
    #  sections that have brand references)
    # ═══════════════════════════════════════
    content = hc["content"]

    # Homepage text
    if "homepage" in content:
        content["homepage"]["heroDefaultTitle"] = "\u05d1\u05e8\u05d5\u05db\u05d9\u05dd \u05d4\u05d1\u05d0\u05d9\u05dd \u05dc-Pawzen"
        content["homepage"]["heroDefaultSubtitle"] = "\u05d0\u05d1\u05d9\u05d6\u05e8\u05d9\u05dd \u05de\u05d5\u05d3\u05e8\u05e0\u05d9\u05d9\u05dd \u05d5\u05de\u05e2\u05d5\u05e6\u05d1\u05d9\u05dd \u05dc\u05db\u05dc\u05d1\u05d9\u05dd \u05d5\u05d7\u05ea\u05d5\u05dc\u05d9\u05dd"
        content["homepage"]["promoDescriptionFallback"] = "\u05d0\u05d1\u05d9\u05d6\u05e8\u05d9\u05dd \u05d0\u05d9\u05db\u05d5\u05ea\u05d9\u05d9\u05dd \u05dc\u05de\u05e9\u05e4\u05d7\u05ea \u05d4\u05e4\u05e8\u05d5\u05d5\u05ea\u05d9\u05ea. \u05e7\u05d5\u05dc\u05e7\u05e6\u05d9\u05d4 \u05d1\u05d6\u05de\u05df \u05de\u05d5\u05d2\u05d1\u05dc."
        content["homepage"]["brandsTitle"] = "\u05de\u05d5\u05ea\u05d2\u05d9\u05dd \u05de\u05d5\u05d1\u05d9\u05dc\u05d9\u05dd"
        content["homepage"]["brandsSubtitle"] = "\u05de\u05d4\u05de\u05d5\u05ea\u05d2\u05d9\u05dd \u05d4\u05d8\u05d5\u05d1\u05d9\u05dd \u05d1\u05e2\u05d5\u05dc\u05dd"

    if "general" in content:
        content["general"]["newsletterTitle"] = "\u05d4\u05e6\u05d8\u05e8\u05e4\u05d5 \u05dc\u05dc\u05d4\u05e7\u05d4"
        content["general"]["newsletterDescription"] = "\u05d8\u05d9\u05e4\u05d9\u05dd \u05dc\u05d8\u05d9\u05e4\u05d5\u05dc \u05d1\u05de\u05d7\u05de\u05d3, \u05d4\u05e6\u05e2\u05d5\u05ea \u05d1\u05dc\u05e2\u05d3\u05d9\u05d5\u05ea \u05d5\u05de\u05d5\u05e6\u05e8\u05d9\u05dd \u05d7\u05d3\u05e9\u05d9\u05dd"

    if "navbar" in content:
        content["navbar"]["popularSearchTerms"] = ["\u05e6\u05e2\u05e6\u05d5\u05e2\u05d9\u05dd \u05dc\u05db\u05dc\u05d1\u05d9\u05dd", "\u05e6\u05e2\u05e6\u05d5\u05e2\u05d9\u05dd \u05dc\u05d7\u05ea\u05d5\u05dc\u05d9\u05dd", "\u05de\u05d9\u05d8\u05d5\u05ea \u05d5\u05e9\u05de\u05d9\u05db\u05d5\u05ea", "\u05de\u05d1\u05e6\u05e2\u05d9\u05dd"]

    return he


def main():
    # Read both files
    with open(EN_PATH, "r", encoding="utf-8") as f:
        en = json.load(f)
    with open(HE_PATH, "r", encoding="utf-8") as f:
        he = json.load(f)

    # Transform English
    en = build_english_config(en)

    # Transform Hebrew (using English as reference)
    he = build_hebrew_config(he, en)

    # Write both files
    with open(EN_PATH, "w", encoding="utf-8") as f:
        json.dump(en, f, indent=2, ensure_ascii=False)
        f.write("\n")

    with open(HE_PATH, "w", encoding="utf-8") as f:
        json.dump(he, f, indent=2, ensure_ascii=False)
        f.write("\n")

    # ═══════════════════════════════════════
    # VERIFICATION
    # ═══════════════════════════════════════
    VALID_OVERRIDE_PROPS = {
        "backgroundColor", "textColor", "borderColor", "borderWidth",
        "borderRadius", "shadow", "opacity",
        "backgroundStyle", "backgroundSecondaryColor", "gradientDirection",
        "fontFamily", "fontSize", "fontWeight", "textTransform",
        "padding", "margin", "gap",
        "hoverBackgroundColor", "hoverTextColor", "hoverShadow",
        "customClasses",
    }
    VALID_FONT_FAMILIES = {"heading", "body", "mono"}
    VALID_FONT_SIZES = {"xs", "sm", "base", "lg", "xl", "2xl", "3xl", "4xl", "5xl", "6xl", "7xl", "8xl", "9xl"}
    VALID_FONT_WEIGHTS = {"normal", "medium", "semibold", "bold", "extrabold"}
    VALID_BORDER_RADII = {"none", "sm", "md", "lg", "full"}
    VALID_SHADOWS = {"none", "sm", "md", "lg"}

    with open(EN_PATH, "r", encoding="utf-8") as f:
        en_v = json.load(f)["config"]
    with open(HE_PATH, "r", encoding="utf-8") as f:
        he_v = json.load(f)["config"]

    errors = []
    for name, cfg in [("EN", en_v), ("HE", he_v)]:
        co = cfg.get("componentOverrides", {})
        for key, val in co.items():
            for prop, v in val.items():
                if prop not in VALID_OVERRIDE_PROPS:
                    errors.append(f"{name} {key}.{prop}: invalid property")
                if prop == "fontFamily" and isinstance(v, str) and v not in VALID_FONT_FAMILIES:
                    errors.append(f"{name} {key}.fontFamily='{v}' invalid")
                if prop == "fontSize" and isinstance(v, str) and v not in VALID_FONT_SIZES:
                    errors.append(f"{name} {key}.fontSize='{v}' invalid")
                if prop == "fontWeight" and isinstance(v, str) and v not in VALID_FONT_WEIGHTS:
                    errors.append(f"{name} {key}.fontWeight='{v}' invalid")
                if prop == "borderRadius" and isinstance(v, str) and v not in VALID_BORDER_RADII:
                    errors.append(f"{name} {key}.borderRadius='{v}' invalid")
                if prop == "shadow" and isinstance(v, str) and v not in VALID_SHADOWS:
                    errors.append(f"{name} {key}.shadow='{v}' invalid")
                if prop == "hoverShadow" and isinstance(v, str) and v not in VALID_SHADOWS:
                    errors.append(f"{name} {key}.hoverShadow='{v}' invalid")

    en_co = en_v.get("componentOverrides", {})
    he_co = he_v.get("componentOverrides", {})

    print(f"English config: {os.path.getsize(EN_PATH):,} bytes")
    print(f"  Store: {en_v['store']['name']}")
    print(f"  Heading font: {en_v['branding']['typography']['fontHeading']}")
    print(f"  Primary color: {en_v['branding']['colors']['primary']}")
    print(f"  Component overrides: {len(en_co)} components")
    print(f"  Section order: {len(en_v['homepage']['sectionOrder'])} sections")
    print()

    print(f"Hebrew config: {os.path.getsize(HE_PATH):,} bytes")
    print(f"  Store: {he_v['store']['name']}")
    print(f"  Heading font: {he_v['branding']['typography']['fontHeading']}")
    print(f"  Primary color: {he_v['branding']['colors']['primary']}")
    print(f"  Component overrides: {len(he_co)} components")
    print(f"  SEO title: {he_v['seo']['defaultTitle']}")
    print()

    if errors:
        print("VALIDATION ERRORS:")
        for e in errors:
            print(f"  X {e}")
        return 1
    else:
        print(f"All {len(en_co)} component overrides are schema-valid!")
        print()

    # Show component coverage
    print("Component override coverage:")
    pages = {}
    for key in en_co:
        page = key.split(".")[0]
        pages.setdefault(page, []).append(key)
    for page, keys in sorted(pages.items()):
        print(f"  {page}: {len(keys)} components ({', '.join(k.split('.')[1] for k in keys)})")

    # Verify no Mansour references in Hebrew
    he_str = json.dumps(he_v, ensure_ascii=False).lower()
    if "mansour" in he_str:
        print()
        print("WARNING: Hebrew config still contains 'mansour' references!")
    else:
        print()
        print("No 'Mansour' references found in Hebrew config.")

    print()
    print("Done! Both configs transformed for Pawzen.")
    return 0


if __name__ == "__main__":
    exit(main())
