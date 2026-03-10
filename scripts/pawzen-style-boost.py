"""
Pawzen Style Boost — Enhanced styling pass.
Fixes: recentlyViewed above newsletter, richer component overrides,
more distinctive hover states, better visual depth.
"""
import json
import copy
import os

BASE = os.path.dirname(os.path.abspath(__file__))
PLATFORM = os.path.dirname(BASE)
EN_PATH = os.path.join(PLATFORM, "apps", "apps", "storefront-control", "sample-config-import-en.json")
HE_PATH = os.path.join(PLATFORM, "apps", "apps", "storefront-control", "sample-config-import.json")

# Brand tokens
PRIMARY = "#1B2838"
SECONDARY = "#1E4D3A"
ACCENT = "#C9A962"
BACKGROUND = "#F8F7F5"
SURFACE = "#EDEAE5"
TEXT = "#0F1419"
TEXT_MUTED = "#7A756E"
ERROR = "#8B3A3A"

NAVY_LIGHT = "#243447"
NAVY_DARK = "#111D2B"
GOLD_LIGHT = "#D4B978"
GOLD_DARK = "#B89545"
GREEN_LIGHT = "#2A6B51"
CREAM = "#FBF9F6"
SAND_LIGHT = "#F3F0EB"


def enhance_config(cfg: dict) -> dict:
    c = cfg["config"]

    # ═══════════════════════════════════════
    # FIX: Section order — recentlyViewed
    # above newsletter (newsletter = last CTA)
    # ═══════════════════════════════════════
    c["homepage"]["sectionOrder"] = [
        "hero",
        "trustStrip",
        "marquee",
        "categories",
        "trending",
        "brandGrid",
        "promotionBanner",
        "flashDeals",
        "collectionMosaic",
        "bestSellers",
        "customerFeedback",
        "recentlyViewed",      # ← moved up
        "newsletter",          # ← last (strong CTA to close)
    ]

    # ═══════════════════════════════════════
    # BRANDING — Tighten the style system
    # ═══════════════════════════════════════
    c["branding"]["style"]["borderRadius"] = "lg"
    c["branding"]["style"]["buttonStyle"] = "solid"
    c["branding"]["style"]["cardShadow"] = "md"  # Bump from sm → md for more depth

    # ═══════════════════════════════════════
    # UI — Richer button hover states
    # ═══════════════════════════════════════
    c["ui"]["buttons"]["borderRadius"] = "lg"
    c["ui"]["buttons"]["primary"] = {
        "backgroundColor": PRIMARY,
        "textColor": "#FFFFFF",
        "hoverBackgroundColor": SECONDARY,  # Navy → Green on hover (more alive)
        "borderColor": None,
    }
    c["ui"]["buttons"]["secondary"] = {
        "backgroundColor": ACCENT,
        "textColor": PRIMARY,
        "hoverBackgroundColor": GOLD_LIGHT,  # Gold brightens on hover
        "borderColor": None,
    }
    c["ui"]["buttons"]["outline"] = {
        "backgroundColor": "transparent",
        "textColor": PRIMARY,
        "hoverBackgroundColor": PRIMARY,     # Fill on hover — more dramatic
        "borderColor": PRIMARY,
    }

    # ═══════════════════════════════════════
    # UI — Product card refinements
    # ═══════════════════════════════════════
    c["ui"]["productCard"]["shadow"] = "md"
    c["ui"]["productCard"]["hoverShadow"] = "lg"
    c["ui"]["productCard"]["textStyles"]["price"]["color"] = PRIMARY
    c["ui"]["productCard"]["textStyles"]["name"]["color"] = TEXT

    # ═══════════════════════════════════════
    # UI — Badges: more personality
    # ═══════════════════════════════════════
    c["ui"]["badges"]["sale"]["backgroundColor"] = ERROR
    c["ui"]["badges"]["sale"]["borderRadius"] = "sm"
    c["ui"]["badges"]["new"]["backgroundColor"] = SECONDARY
    c["ui"]["badges"]["new"]["borderRadius"] = "sm"
    c["ui"]["badges"]["featured"]["backgroundColor"] = ACCENT
    c["ui"]["badges"]["featured"]["textColor"] = PRIMARY
    c["ui"]["badges"]["lowStock"]["backgroundColor"] = "#D4A017"  # Warmer amber
    c["ui"]["badges"]["lowStock"]["textColor"] = "#FFFFFF"
    c["ui"]["badges"]["discount"]["backgroundColor"] = ERROR
    c["ui"]["badges"]["discount"]["borderRadius"] = "full"

    # ═══════════════════════════════════════
    # UI — Input fields: warmer, more polished
    # ═══════════════════════════════════════
    c["ui"]["inputs"] = {
        "borderRadius": "lg",
        "borderColor": SURFACE,
        "focusBorderColor": PRIMARY,
        "focusRingColor": f"{ACCENT}40",  # Gold with 25% opacity
        "backgroundColor": "#FFFFFF",
        "placeholderColor": TEXT_MUTED,
    }

    # ═══════════════════════════════════════
    # UI — Toasts with border accent
    # ═══════════════════════════════════════
    c["ui"]["toasts"] = {
        "position": "bottom-right",
        "borderRadius": "lg",
        "success": {
            "backgroundColor": "#F0FDF4",
            "textColor": SECONDARY,
            "iconColor": SECONDARY,
        },
        "error": {
            "backgroundColor": "#FEF2F2",
            "textColor": ERROR,
            "iconColor": ERROR,
        },
        "warning": {
            "backgroundColor": "#FFFBEB",
            "textColor": "#92400E",
            "iconColor": ACCENT,
        },
        "info": {
            "backgroundColor": "#EFF6FF",
            "textColor": PRIMARY,
            "iconColor": PRIMARY,
        },
    }

    # ═══════════════════════════════════════
    # SECTION BACKGROUNDS — More variety
    # ═══════════════════════════════════════
    sections = c["homepage"]["sections"]

    # Hero: richer gradient with diagonal sweep
    sections["hero"]["background"] = {
        "style": "gradient",
        "color": NAVY_DARK,
        "secondaryColor": SECONDARY,
        "gradientDirection": "to-bottom-right",
    }
    sections["hero"]["overlayOpacity"] = 50

    # Trust strip: very subtle green tint
    sections["trustStrip"]["background"] = {
        "style": "color-mix",
        "color": SECONDARY,
        "secondaryColor": BACKGROUND,
        "mixPercentage": 5,
    }

    # Categories: subtle warm pattern
    sections["categories"]["background"] = {
        "style": "pattern",
        "color": None,
        "secondaryColor": None,
        "patternType": "dots",
        "patternOpacity": 2,
    }

    # Trending: warm gold tint
    sections["trending"]["background"] = {
        "style": "color-mix",
        "color": ACCENT,
        "secondaryColor": BACKGROUND,
        "mixPercentage": 3,
    }

    # Brand grid: animated gradient (subtle)
    sections["brandGrid"]["background"] = {
        "style": "animated-gradient",
        "color": SURFACE,
        "secondaryColor": BACKGROUND,
        "animationSpeed": "slow",
    }

    # Promotion banner: radial gradient for drama
    sections["promotionBanner"]["background"] = {
        "style": "radial-gradient",
        "color": PRIMARY,
        "secondaryColor": NAVY_DARK,
    }

    # Flash deals: glass over warm tint
    sections["flashDeals"]["background"] = {
        "style": "glass",
        "color": ERROR,
        "secondaryColor": None,
        "glassBlur": 10,
        "glassOpacity": 3,
    }

    # Collection mosaic: cool mesh
    sections["collectionMosaic"]["background"] = {
        "style": "mesh",
        "color": None,
        "secondaryColor": None,
        "meshOpacity": 8,
        "meshGrade": "cool",
    }

    # Best sellers: subtle navy tint
    sections["bestSellers"]["background"] = {
        "style": "color-mix",
        "color": PRIMARY,
        "secondaryColor": BACKGROUND,
        "mixPercentage": 4,
    }

    # Customer feedback: warm pattern with dots
    sections["customerFeedback"]["background"] = {
        "style": "pattern",
        "color": None,
        "secondaryColor": None,
        "patternType": "dots",
        "patternOpacity": 3,
    }

    # Recently viewed: clean
    sections["recentlyViewed"]["background"] = {
        "style": "none",
        "color": None,
        "secondaryColor": None,
    }

    # Newsletter: rich diagonal gradient (strong CTA closing)
    sections["newsletter"]["background"] = {
        "style": "gradient",
        "color": PRIMARY,
        "secondaryColor": SECONDARY,
        "gradientDirection": "to-bottom-right",
    }

    # ═══════════════════════════════════════
    # COMPONENT OVERRIDES — Richer, more
    # distinctive with better hover states
    # ═══════════════════════════════════════
    co = c["componentOverrides"]

    # ── Homepage ──────────────────────────
    co["homepage.hero"] = {
        "backgroundColor": NAVY_DARK,
        "textColor": "#FFFFFF",
        "fontFamily": "heading",
        "fontSize": "5xl",
        "fontWeight": "bold",
        "padding": "6rem 2rem",
    }
    co["homepage.trustStrip"] = {
        "backgroundColor": CREAM,
        "textColor": SECONDARY,
        "fontSize": "sm",
        "fontWeight": "semibold",
        "padding": "1rem 0",
    }
    co["homepage.marquee"] = {
        "backgroundColor": PRIMARY,
        "textColor": GOLD_LIGHT,
        "fontSize": "sm",
        "fontWeight": "semibold",
    }
    co["homepage.categories"] = {
        "textColor": TEXT,
        "fontFamily": "heading",
        "fontSize": "3xl",
        "fontWeight": "bold",
    }
    co["homepage.trending"] = {
        "textColor": TEXT,
        "fontFamily": "heading",
        "fontSize": "2xl",
        "fontWeight": "bold",
    }
    co["homepage.promotionBanner"] = {
        "backgroundColor": PRIMARY,
        "textColor": "#FFFFFF",
        "fontFamily": "heading",
        "fontSize": "3xl",
        "fontWeight": "bold",
        "borderRadius": "lg",
        "padding": "4rem 2rem",
    }
    co["homepage.flashDeals"] = {
        "textColor": TEXT,
        "fontFamily": "heading",
        "fontSize": "2xl",
        "fontWeight": "bold",
    }
    co["homepage.collectionMosaic"] = {
        "textColor": TEXT,
        "fontFamily": "heading",
        "fontSize": "2xl",
        "fontWeight": "bold",
    }
    co["homepage.bestSellers"] = {
        "textColor": TEXT,
        "fontFamily": "heading",
        "fontSize": "2xl",
        "fontWeight": "bold",
    }
    co["homepage.customerFeedback"] = {
        "textColor": TEXT,
        "fontFamily": "heading",
        "fontSize": "2xl",
        "fontWeight": "bold",
    }
    co["homepage.newsletter"] = {
        "backgroundColor": PRIMARY,
        "textColor": "#FFFFFF",
        "fontFamily": "heading",
        "fontSize": "2xl",
        "fontWeight": "bold",
        "borderRadius": "lg",
        "padding": "4rem 2rem",
    }
    co["homepage.brandGrid"] = {
        "textColor": TEXT,
        "fontFamily": "heading",
        "fontSize": "2xl",
        "fontWeight": "bold",
    }
    co["homepage.productCard"] = {
        "borderRadius": "lg",
        "shadow": "md",
        "hoverShadow": "lg",
        "fontSize": "sm",
        "fontWeight": "semibold",
        "hoverBackgroundColor": CREAM,
    }

    # ── Layout ────────────────────────────
    co["layout.header"] = {
        "backgroundColor": "#FFFFFF",
        "textColor": TEXT,
        "borderColor": SURFACE,
        "shadow": "sm",
        "fontSize": "sm",
        "fontWeight": "medium",
    }
    co["layout.headerBanner"] = {
        "backgroundColor": PRIMARY,
        "textColor": GOLD_LIGHT,
        "fontSize": "xs",
        "fontWeight": "medium",
    }
    co["layout.footer"] = {
        "backgroundColor": PRIMARY,
        "textColor": SURFACE,
        "borderColor": NAVY_LIGHT,
        "fontSize": "sm",
        "padding": "4rem 2rem",
    }
    co["layout.mobileBottomNav"] = {
        "backgroundColor": "#FFFFFF",
        "textColor": TEXT_MUTED,
        "borderColor": SURFACE,
        "shadow": "lg",
        "fontSize": "xs",
    }
    co["layout.searchDialog"] = {
        "backgroundColor": "#FFFFFF",
        "textColor": TEXT,
        "borderRadius": "lg",
        "shadow": "lg",
        "borderColor": SURFACE,
    }

    # ── PLP ───────────────────────────────
    co["plp.productCard"] = {
        "borderRadius": "lg",
        "shadow": "md",
        "hoverShadow": "lg",
        "fontSize": "sm",
        "fontWeight": "semibold",
        "hoverBackgroundColor": CREAM,
    }
    co["plp.productGrid"] = {
        "gap": "1.5rem",
    }
    co["plp.activeFiltersTags"] = {
        "backgroundColor": CREAM,
        "borderColor": SURFACE,
        "borderRadius": "lg",
        "shadow": "sm",
        "fontSize": "xs",
    }
    co["plp.stickyQuickFilters"] = {
        "backgroundColor": "#FFFFFF",
        "borderColor": SURFACE,
        "shadow": "sm",
        "fontSize": "xs",
        "fontWeight": "semibold",
    }
    co["plp.sortBy"] = {
        "textColor": TEXT,
        "fontSize": "sm",
        "fontWeight": "medium",
    }

    # ── PDP ───────────────────────────────
    co["pdp.productGallery"] = {
        "borderRadius": "lg",
        "shadow": "sm",
    }
    co["pdp.addToCart"] = {
        "backgroundColor": PRIMARY,
        "textColor": "#FFFFFF",
        "borderRadius": "lg",
        "fontWeight": "bold",
        "fontSize": "base",
        "hoverBackgroundColor": SECONDARY,  # Navy → Green hover
        "padding": "0.875rem 2rem",
    }
    co["pdp.stickyMobileAddToCart"] = {
        "backgroundColor": "#FFFFFF",
        "shadow": "lg",
        "borderColor": SURFACE,
        "padding": "0.75rem 1rem",
    }
    co["pdp.variantSelector"] = {
        "borderRadius": "lg",
        "borderColor": SURFACE,
        "fontSize": "sm",
        "fontWeight": "medium",
    }
    co["pdp.quantitySelector"] = {
        "borderRadius": "lg",
        "borderColor": SURFACE,
        "fontWeight": "semibold",
    }
    co["pdp.productTabs"] = {
        "textColor": TEXT,
        "borderColor": SURFACE,
        "fontSize": "sm",
        "fontWeight": "semibold",
    }
    co["pdp.relatedProducts"] = {
        "textColor": TEXT,
        "fontFamily": "heading",
        "fontSize": "xl",
        "fontWeight": "bold",
        "padding": "3rem 0",
    }

    # ── Cart ──────────────────────────────
    co["cart.cartPage"] = {
        "backgroundColor": BACKGROUND,
        "textColor": TEXT,
        "padding": "2rem 0",
    }
    co["cart.cartDrawer"] = {
        "backgroundColor": "#FFFFFF",
        "textColor": TEXT,
        "shadow": "lg",
        "borderColor": SURFACE,
    }

    # ── Checkout ──────────────────────────
    co["checkout.checkoutPage"] = {
        "backgroundColor": BACKGROUND,
        "textColor": TEXT,
    }
    co["checkout.summary"] = {
        "backgroundColor": "#FFFFFF",
        "borderRadius": "lg",
        "shadow": "md",
        "borderColor": SURFACE,
        "padding": "1.5rem",
    }
    co["checkout.placeOrder"] = {
        "backgroundColor": SECONDARY,  # Green = "go" for place order
        "textColor": "#FFFFFF",
        "borderRadius": "lg",
        "fontWeight": "bold",
        "fontSize": "base",
        "hoverBackgroundColor": GREEN_LIGHT,
        "padding": "1rem 2rem",
    }
    co["checkout.contactStep"] = {
        "backgroundColor": "#FFFFFF",
        "borderRadius": "lg",
        "borderColor": SURFACE,
        "shadow": "sm",
    }
    co["checkout.shippingStep"] = {
        "backgroundColor": "#FFFFFF",
        "borderRadius": "lg",
        "borderColor": SURFACE,
        "shadow": "sm",
    }
    co["checkout.deliveryStep"] = {
        "backgroundColor": "#FFFFFF",
        "borderRadius": "lg",
        "borderColor": SURFACE,
        "shadow": "sm",
    }
    co["checkout.paymentStep"] = {
        "backgroundColor": "#FFFFFF",
        "borderRadius": "lg",
        "borderColor": SURFACE,
        "shadow": "sm",
    }
    co["checkout.orderConfirmation"] = {
        "backgroundColor": BACKGROUND,
        "textColor": TEXT,
        "borderRadius": "lg",
    }

    # ── Account ───────────────────────────
    co["account.dashboard"] = {
        "backgroundColor": BACKGROUND,
        "textColor": TEXT,
    }
    co["account.orders"] = {
        "backgroundColor": "#FFFFFF",
        "borderRadius": "lg",
        "shadow": "sm",
        "borderColor": SURFACE,
    }
    co["account.addresses"] = {
        "backgroundColor": "#FFFFFF",
        "borderRadius": "lg",
        "shadow": "sm",
        "borderColor": SURFACE,
    }
    co["account.wishlist"] = {
        "backgroundColor": "#FFFFFF",
        "borderRadius": "lg",
        "shadow": "sm",
        "borderColor": SURFACE,
    }
    co["account.settings"] = {
        "backgroundColor": "#FFFFFF",
        "borderRadius": "lg",
        "shadow": "sm",
        "borderColor": SURFACE,
    }

    # ── Auth ──────────────────────────────
    co["auth.login"] = {
        "backgroundColor": "#FFFFFF",
        "borderRadius": "lg",
        "shadow": "lg",
        "textColor": TEXT,
        "borderColor": SURFACE,
        "padding": "2.5rem",
    }
    co["auth.forgotPassword"] = {
        "backgroundColor": "#FFFFFF",
        "borderRadius": "lg",
        "shadow": "lg",
        "textColor": TEXT,
        "borderColor": SURFACE,
        "padding": "2.5rem",
    }

    # ═══════════════════════════════════════
    # CHECKOUT UI — More distinctive
    # ═══════════════════════════════════════
    c["checkoutUi"] = {
        "accordion": {
            "completedStepColor": SECONDARY,
            "activeStepColor": PRIMARY,
        },
        "confirmation": {
            "showTimeline": True,
            "showPrintReceipt": True,
        },
        "progressBar": {
            "completedColor": SECONDARY,
            "activeColor": ACCENT,  # Gold for active (eye-catching)
        },
    }

    # ═══════════════════════════════════════
    # FILTER TAGS — More polished
    # ═══════════════════════════════════════
    c["ui"]["activeFiltersTags"]["tagBackgroundColor"] = PRIMARY
    c["ui"]["activeFiltersTags"]["tagBorderColor"] = PRIMARY
    c["ui"]["activeFiltersTags"]["tagTextColor"] = "#FFFFFF"
    c["ui"]["activeFiltersTags"]["tagHoverBackgroundColor"] = SECONDARY
    c["ui"]["activeFiltersTags"]["tagHoverBorderColor"] = SECONDARY
    c["ui"]["activeFiltersTags"]["clearAllButtonColor"] = ERROR
    c["ui"]["activeFiltersTags"]["clearAllButtonHoverColor"] = "#6B2A2A"

    # ═══════════════════════════════════════
    # FILTER SIDEBAR — Active state polish
    # ═══════════════════════════════════════
    c["ui"]["filterSidebar"]["sizeChipSelectedBg"] = PRIMARY
    c["ui"]["filterSidebar"]["sizeChipSelectedText"] = "#FFFFFF"
    c["ui"]["filterSidebar"]["sizeChipSelectedBorder"] = PRIMARY
    c["ui"]["filterSidebar"]["priceQuickButtonActiveBg"] = PRIMARY
    c["ui"]["filterSidebar"]["priceQuickButtonActiveText"] = "#FFFFFF"
    c["ui"]["filterSidebar"]["priceInputFocusRingColor"] = ACCENT
    c["ui"]["filterSidebar"]["mobileShowResultsBg"] = PRIMARY
    c["ui"]["filterSidebar"]["mobileShowResultsText"] = "#FFFFFF"
    c["ui"]["filterSidebar"]["checkboxAccentColor"] = PRIMARY
    c["ui"]["filterSidebar"]["sectionTitleFontWeight"] = "bold"

    return cfg


def main():
    import sys
    sys.stdout.reconfigure(encoding='utf-8')

    # Read both
    with open(EN_PATH, "r", encoding="utf-8") as f:
        en = json.load(f)
    with open(HE_PATH, "r", encoding="utf-8") as f:
        he = json.load(f)

    # Enhance both
    en = enhance_config(en)
    he = enhance_config(he)

    # Write both
    for path, data in [(EN_PATH, en), (HE_PATH, he)]:
        with open(path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
            f.write("\n")

    # Verify
    for label, path in [("EN", EN_PATH), ("HE", HE_PATH)]:
        cfg = json.load(open(path, "r", encoding="utf-8"))["config"]
        co = cfg.get("componentOverrides", {})
        order = cfg["homepage"]["sectionOrder"]

        # Validate overrides
        VALID = {"backgroundColor", "textColor", "borderColor", "borderWidth",
                 "borderRadius", "shadow", "opacity", "backgroundStyle",
                 "backgroundSecondaryColor", "gradientDirection", "fontFamily",
                 "fontSize", "fontWeight", "textTransform", "padding", "margin",
                 "gap", "hoverBackgroundColor", "hoverTextColor", "hoverShadow",
                 "customClasses"}
        VALID_FF = {"heading", "body", "mono"}
        VALID_FS = {"xs", "sm", "base", "lg", "xl", "2xl", "3xl", "4xl", "5xl", "6xl", "7xl", "8xl", "9xl"}
        VALID_FW = {"normal", "medium", "semibold", "bold", "extrabold"}
        VALID_BR = {"none", "sm", "md", "lg", "full"}
        VALID_SH = {"none", "sm", "md", "lg"}

        errors = []
        for key, val in co.items():
            for prop, v in val.items():
                if prop not in VALID:
                    errors.append(f"{key}.{prop}")
                if prop == "fontFamily" and isinstance(v, str) and v not in VALID_FF:
                    errors.append(f"{key}.fontFamily={v}")
                if prop == "fontSize" and isinstance(v, str) and v not in VALID_FS:
                    errors.append(f"{key}.fontSize={v}")
                if prop == "fontWeight" and isinstance(v, str) and v not in VALID_FW:
                    errors.append(f"{key}.fontWeight={v}")
                if prop == "borderRadius" and isinstance(v, str) and v not in VALID_BR:
                    errors.append(f"{key}.borderRadius={v}")
                if prop in ("shadow", "hoverShadow") and isinstance(v, str) and v not in VALID_SH:
                    errors.append(f"{key}.{prop}={v}")

        # Count backgrounds
        bgs = {}
        for name, sec in cfg["homepage"]["sections"].items():
            if isinstance(sec, dict) and sec.get("enabled") and "background" in sec:
                bgs.setdefault(sec["background"].get("style", "none"), []).append(name)

        newsletter_idx = order.index("newsletter") if "newsletter" in order else -1
        rv_idx = order.index("recentlyViewed") if "recentlyViewed" in order else -1

        print(f"=== {label} ===")
        print(f"  Overrides: {len(co)} | Errors: {len(errors)}")
        print(f"  Section order: ...{order[-4:]}")
        print(f"  recentlyViewed@{rv_idx} newsletter@{newsletter_idx} {'OK' if rv_idx < newsletter_idx else 'WRONG'}")
        print(f"  Card shadow: {cfg['branding']['style']['cardShadow']}")
        print(f"  Backgrounds: {dict((k, len(v)) for k, v in bgs.items())}")
        print(f"  Place Order btn: {co.get('checkout.placeOrder', {}).get('backgroundColor', 'default')}")
        print(f"  Product hover: {co.get('homepage.productCard', {}).get('hoverBackgroundColor', 'none')}")
        if errors:
            for e in errors:
                print(f"  BAD: {e}")
        print()

    print("Style boost complete!")


if __name__ == "__main__":
    main()
