"""
Fix both sample config JSON files for Pawzen storefront.

Fixes:
1. English: Remove invalid component override properties not in Zod schema
2. English: Fix enum values (fontFamily, fontSize, fontWeight, borderRadius)
3. English: Fix cardOverrides: null → proper object
4. Hebrew: Copy componentOverrides from English (cleaned)
5. Hebrew: Sync branding (typography, logo, style) from English
6. Hebrew: Remove empty parent override objects
7. Hebrew: Sync missing structural sections from English
"""
import json
import copy
import os

# Valid ComponentStyleOverrideSchema properties (from component-overrides.ts)
VALID_OVERRIDE_PROPS = {
    # Visual
    "backgroundColor", "textColor", "borderColor", "borderWidth",
    "borderRadius", "shadow", "opacity",
    # Gradient
    "backgroundStyle", "backgroundSecondaryColor", "gradientDirection",
    # Typography
    "fontFamily", "fontSize", "fontWeight", "textTransform",
    # Layout
    "padding", "margin", "gap",
    # Hover
    "hoverBackgroundColor", "hoverTextColor", "hoverShadow",
    # Custom
    "customClasses",
}

# Enum value mappings: CSS values → valid Zod enum values
FONT_FAMILY_MAP = {
    "Playfair Display": "heading",
    "Inter": "body",
    "JetBrains Mono": "mono",
}

FONT_SIZE_MAP = {
    "9px": "xs",
    "10px": "xs",
    "11px": "xs",
    "12px": "xs",
    "13px": "xs",
    "14px": "sm",
    "15px": "sm",
    "16px": "base",
    "18px": "lg",
    "20px": "xl",
    "24px": "2xl",
    "28px": "2xl",
    "30px": "3xl",
    "32px": "3xl",
    "36px": "4xl",
    "40px": "4xl",
    "48px": "5xl",
    "56px": "6xl",
    "64px": "7xl",
    "72px": "8xl",
    "80px": "9xl",
}

FONT_WEIGHT_MAP = {
    "400": "normal",
    "500": "medium",
    "600": "semibold",
    "700": "bold",
    "800": "extrabold",
}

BORDER_RADIUS_MAP = {
    "0": "none",
    "0px": "none",
    "2px": "sm",
    "4px": "sm",
    "6px": "md",
    "8px": "md",
    "12px": "lg",
    "16px": "lg",
    "24px": "full",
    "9999px": "full",
}

VALID_FONT_FAMILIES = {"heading", "body", "mono"}
VALID_FONT_SIZES = {"xs", "sm", "base", "lg", "xl", "2xl", "3xl", "4xl", "5xl", "6xl", "7xl", "8xl", "9xl"}
VALID_FONT_WEIGHTS = {"normal", "medium", "semibold", "bold", "extrabold"}
VALID_BORDER_RADII = {"none", "sm", "md", "lg", "full"}

BASE = os.path.dirname(os.path.abspath(__file__))
PLATFORM = os.path.dirname(BASE)
EN_PATH = os.path.join(PLATFORM, "apps", "apps", "storefront-control", "sample-config-import-en.json")
HE_PATH = os.path.join(PLATFORM, "apps", "apps", "storefront-control", "sample-config-import.json")


def fix_enum_value(prop: str, value) -> any:
    """Fix enum values to match Zod schema constraints."""
    if not isinstance(value, str):
        return value

    if prop == "fontFamily":
        if value in VALID_FONT_FAMILIES:
            return value
        return FONT_FAMILY_MAP.get(value, "body")

    if prop == "fontSize":
        if value in VALID_FONT_SIZES:
            return value
        return FONT_SIZE_MAP.get(value, "base")

    if prop == "fontWeight":
        if value in VALID_FONT_WEIGHTS:
            return value
        return FONT_WEIGHT_MAP.get(value, "normal")

    if prop == "borderRadius":
        if value in VALID_BORDER_RADII:
            return value
        return BORDER_RADIUS_MAP.get(value, "md")

    return value


def clean_component_overrides(overrides: dict) -> dict:
    """Remove invalid properties, fix enum values, remove empty parent objects."""
    cleaned = {}
    for key, value in overrides.items():
        if not isinstance(value, dict):
            continue
        # Only keep dot-notation keys (page.component format)
        if "." not in key:
            continue
        # Filter to valid properties and fix enum values
        valid_props = {}
        for k, v in value.items():
            if k in VALID_OVERRIDE_PROPS:
                fixed_v = fix_enum_value(k, v)
                # Skip empty strings and None
                if fixed_v is not None and fixed_v != "":
                    valid_props[k] = fixed_v
        if valid_props:
            cleaned[key] = valid_props
    return cleaned


def get_default_card_overrides() -> dict:
    """Default cardOverrides structure."""
    return {
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
            "titleMaxLines": 1,
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
            "titleMaxLines": 1,
        },
    }


def fix_english_config(en: dict) -> dict:
    """Fix English config issues."""
    c = en["config"]

    # 1. Clean component overrides (invalid props + bad enum values)
    if "componentOverrides" in c:
        c["componentOverrides"] = clean_component_overrides(c["componentOverrides"])

    # 2. Fix null cardOverrides
    if c.get("cardOverrides") is None:
        c["cardOverrides"] = get_default_card_overrides()

    return en


def fix_hebrew_config(he: dict, en: dict) -> dict:
    """Fix Hebrew config by syncing structural/visual settings from English."""
    hc = he["config"]
    ec = en["config"]

    # 1. Component overrides — copy cleaned version from English
    hc["componentOverrides"] = copy.deepcopy(ec["componentOverrides"])

    # 2. Branding — sync typography (Playfair Display), logo, style
    hc["branding"]["typography"] = copy.deepcopy(ec["branding"]["typography"])
    hc["branding"]["style"] = copy.deepcopy(ec["branding"]["style"])
    if ec["branding"].get("logo"):
        hc["branding"]["logo"] = ec["branding"]["logo"]

    # 3. Section order — use English's professional order
    hc["homepage"]["sectionOrder"] = copy.deepcopy(ec["homepage"]["sectionOrder"])

    # 4. Card overrides — sync from English
    hc["cardOverrides"] = copy.deepcopy(ec.get("cardOverrides") or get_default_card_overrides())

    # 5. Design — sync from English (animations, spacing, grid, statusColors)
    if "design" in ec:
        hc["design"] = copy.deepcopy(ec["design"])

    # 6. Dark mode — sync from English
    if "darkMode" in ec:
        hc["darkMode"] = copy.deepcopy(ec["darkMode"])

    # 7. Checkout UI — sync from English (visual settings are language-agnostic)
    if "checkoutUi" in ec:
        hc["checkoutUi"] = copy.deepcopy(ec["checkoutUi"])

    # 8. Store info — ensure Pawzen branding
    hc["store"]["name"] = "Pawzen"
    hc["store"]["email"] = "support@pawzen.co"

    # 9. Footer — ensure Pawzen social links
    hc.setdefault("footer", {})
    hc["footer"]["copyrightText"] = "© 2026 Pawzen. כל הזכויות שמורות."
    hc["footer"]["instagram"] = "https://instagram.com/pawzen"
    hc["footer"]["facebook"] = "https://facebook.com/pawzen"
    hc["footer"]["tiktok"] = "https://tiktok.com/@pawzen"

    # 10. SEO — Pawzen branding
    hc["seo"]["titleTemplate"] = "%s | Pawzen"
    hc["seo"]["defaultTitle"] = "Pawzen - אביזרים מודרניים לכלבים וחתולים"
    hc["seo"]["defaultDescription"] = "גלו אביזרים מעוצבים ומאושרי וטרינר לכלבים וחתולים. מיטות, צעצועים, נרתיקים ועוד. משלוח חינם מעל ₪200."

    # 11. Localization
    hc["localization"]["defaultLocale"] = "he-IL"
    hc["localization"]["direction"] = "auto"

    return he


def main():
    # Read both files
    with open(EN_PATH, "r", encoding="utf-8") as f:
        en = json.load(f)
    with open(HE_PATH, "r", encoding="utf-8") as f:
        he = json.load(f)

    # Fix English
    en = fix_english_config(en)

    # Fix Hebrew (using cleaned English as reference)
    he = fix_hebrew_config(he, en)

    # Write both files
    with open(EN_PATH, "w", encoding="utf-8") as f:
        json.dump(en, f, indent=2, ensure_ascii=False)
        f.write("\n")

    with open(HE_PATH, "w", encoding="utf-8") as f:
        json.dump(he, f, indent=2, ensure_ascii=False)
        f.write("\n")

    # Verify
    with open(EN_PATH, "r", encoding="utf-8") as f:
        en_v = json.load(f)["config"]
    with open(HE_PATH, "r", encoding="utf-8") as f:
        he_v = json.load(f)["config"]

    en_co = en_v.get("componentOverrides", {})
    he_co = he_v.get("componentOverrides", {})

    print(f"English config: {os.path.getsize(EN_PATH):,} bytes")
    print(f"  Component overrides: {len(en_co)} components")
    print(f"  Card overrides: {type(en_v.get('cardOverrides')).__name__}")
    print(f"  Heading font: {en_v.get('branding',{}).get('typography',{}).get('fontHeading','?')}")
    print()
    print(f"Hebrew config: {os.path.getsize(HE_PATH):,} bytes")
    print(f"  Component overrides: {len(he_co)} components")
    print(f"  Card overrides: {type(he_v.get('cardOverrides')).__name__}")
    print(f"  Heading font: {he_v.get('branding',{}).get('typography',{}).get('fontHeading','?')}")
    print(f"  Section order: {he_v.get('homepage',{}).get('sectionOrder','?')}")
    print()

    # Verify enum values are valid
    errors = []
    for name, co in [("EN", en_co), ("HE", he_co)]:
        for key, val in co.items():
            for prop, v in val.items():
                if prop not in VALID_OVERRIDE_PROPS:
                    errors.append(f"{name} {key}.{prop}: invalid property")
                if prop == "fontFamily" and v not in VALID_FONT_FAMILIES:
                    errors.append(f"{name} {key}.fontFamily: '{v}' not in {VALID_FONT_FAMILIES}")
                if prop == "fontSize" and isinstance(v, str) and v not in VALID_FONT_SIZES:
                    errors.append(f"{name} {key}.fontSize: '{v}' not in {VALID_FONT_SIZES}")
                if prop == "fontWeight" and isinstance(v, str) and v not in VALID_FONT_WEIGHTS:
                    errors.append(f"{name} {key}.fontWeight: '{v}' not in {VALID_FONT_WEIGHTS}")
                if prop == "borderRadius" and isinstance(v, str) and v not in VALID_BORDER_RADII:
                    errors.append(f"{name} {key}.borderRadius: '{v}' not in {VALID_BORDER_RADII}")

    if errors:
        print("VALIDATION ERRORS:")
        for e in errors:
            print(f"  ❌ {e}")
    else:
        print("✓ All component override values are schema-valid!")

    # Show sample override
    print()
    sample_key = "homepage.hero"
    print(f"Sample override ({sample_key}):")
    print(json.dumps(en_co.get(sample_key, {}), indent=2))

    print()
    print("Done! Both configs fixed.")


if __name__ == "__main__":
    main()
