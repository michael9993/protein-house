"""
Social Publisher — Content Generation
=======================================
Generates captions, hashtags, and selects products for social media posts.
"""

import random
from .config import (
    BRAND_NAME, BRAND_HANDLE, STOREFRONT_BASE_URL,
    HERO_PRODUCTS, BRAND_HASHTAGS, CATEGORY_HASHTAGS,
    ENGAGEMENT_HASHTAGS, CAPTION_TEMPLATES, CATEGORY_CONTEXT,
    CATEGORY_SLUG_MAP, CATEGORY_PARENT_MAP, HASHTAG_KEY_MAP,
)


def get_category_key(product):
    """Map product category to content context key."""
    cat = product.get("category") or {}
    slug = cat.get("slug", "")
    parent = (cat.get("parent") or {}).get("slug", "")

    if slug in CATEGORY_SLUG_MAP:
        return CATEGORY_SLUG_MAP[slug]
    if parent in CATEGORY_PARENT_MAP:
        return CATEGORY_PARENT_MAP[parent]
    return "default"


def get_hashtag_key(cat_key):
    """Map category key to hashtag set."""
    return HASHTAG_KEY_MAP.get(cat_key, "default")


def is_hero(product):
    """Check if product is in curated hero list."""
    name = product.get("name", "")
    return any(hero.lower() in name.lower() for hero in HERO_PRODUCTS)


def get_pet_type(product):
    """Determine pet type from category."""
    cat = product.get("category") or {}
    slug = cat.get("slug", "")
    parent_slug = (cat.get("parent") or {}).get("slug", "")
    if "cat" in slug or "cat" in parent_slug:
        return "cat"
    if "dog" in slug or "dog" in parent_slug:
        return "dog"
    return "pet"


def build_caption(product, cat_key, channel="usd"):
    """Generate a social media caption for a product."""
    name = product.get("name", "")
    trans = product.get("translation")
    if trans and trans.get("name"):
        name = trans["name"]
    name = name.replace("Pet Supplies Bowl ", "").replace("Pet Dog Supplies ", "")

    ctx = CATEGORY_CONTEXT.get(cat_key, CATEGORY_CONTEXT["default"])

    # Pricing
    pricing = product.get("pricing", {})
    price_range = pricing.get("priceRange", {}).get("start", {}).get("gross", {})
    undiscounted = pricing.get("priceRangeUndiscounted", {}).get("start", {}).get("gross", {})
    amount = price_range.get("amount", 0)
    currency = price_range.get("currency", "USD")
    original_amount = undiscounted.get("amount", amount)
    is_on_sale = original_amount > amount and amount > 0

    symbol = "$" if currency == "USD" else "₪"
    price_line = f"💰 {symbol}{amount:.2f}"
    if is_on_sale:
        discount_pct = int(round((1 - amount / original_amount) * 100))
        price_line = f"💰 {symbol}{amount:.2f} (was {symbol}{original_amount:.2f} — {discount_pct}% OFF!)"

    pet_type = get_pet_type(product)
    pet_plural = {"cat": "cats", "dog": "dogs", "pet": "pets"}[pet_type]

    # Choose template
    if is_on_sale:
        template = random.choice(CAPTION_TEMPLATES["sale"])
    else:
        style = random.choice(["product_showcase", "lifestyle", "question"])
        template = random.choice(CAPTION_TEMPLATES[style])

    # Hashtags (12-15 total)
    ht_key = get_hashtag_key(cat_key)
    hashtags_list = list(BRAND_HASHTAGS)
    hashtags_list += CATEGORY_HASHTAGS.get(ht_key, CATEGORY_HASHTAGS["default"])
    remaining = 15 - len(hashtags_list)
    hashtags_list += random.sample(ENGAGEMENT_HASHTAGS, min(remaining, len(ENGAGEMENT_HASHTAGS)))
    hashtags = " ".join(hashtags_list[:15])

    caption = template.format(
        name=name,
        emoji=ctx["emoji"],
        fire="🔥",
        benefit=ctx["benefit_tpl"],
        price_line=price_line,
        original=f"{symbol}{original_amount:.2f}" if is_on_sale else "",
        sale_price=f"{symbol}{amount:.2f}" if is_on_sale else "",
        discount=str(int(round((1 - amount / original_amount) * 100))) if is_on_sale else "",
        cta=f"🛒 Shop: {STOREFRONT_BASE_URL}/{channel}/products/{product.get('slug', '')}\n🔗 All products: {STOREFRONT_BASE_URL} | {BRAND_HANDLE}",
        pet_type=pet_type,
        pet_type_plural=pet_plural,
        need=ctx["need"],
        problem=ctx["problem"],
        hashtags=hashtags,
    )
    return caption


def select_products(products, per_category, select_all=False):
    """Select best products per category (hero products get priority)."""
    if select_all:
        return products

    by_category = {}
    for p in products:
        cat_key = get_category_key(p)
        if cat_key not in by_category:
            by_category[cat_key] = []
        by_category[cat_key].append(p)

    selected = []
    for cat_key, prods in sorted(by_category.items()):
        prods.sort(key=lambda p: (
            -int(is_hero(p)),
            -int(sum(v.get("quantityAvailable", 0) or 0 for v in p.get("variants", [])) > 0),
            -(p.get("pricing", {}).get("priceRange", {}).get("start", {}).get("gross", {}).get("amount", 0)),
        ))
        count = max(per_category, 1)
        selected.extend(prods[:count])

    return selected
