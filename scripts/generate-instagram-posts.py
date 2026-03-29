#!/usr/bin/env python3
"""
Instagram Post Content Generator for Pawzen Pets
==================================================
Pulls products from Saleor GraphQL API and generates Instagram-ready
captions, hashtags, and image URLs — exported as CSV for Meta Business Suite
bulk scheduling.

Usage:
    python scripts/generate-instagram-posts.py
    python scripts/generate-instagram-posts.py --all          # All products
    python scripts/generate-instagram-posts.py --per-cat 3    # 3 per category

Output:
    scripts/instagram-posts.csv  (ready for Meta Business Suite)

Requirements:
    Python 3.10+ (stdlib only, no pip installs needed)
"""

import argparse
import csv
import json
import os
import re
import sys
import urllib.request
import urllib.error
from html import unescape
from datetime import datetime, timedelta
import random

# ─── Configuration ───────────────────────────────────────────────────────────

DEFAULT_API_URL = "http://localhost:8000/graphql/"
DEFAULT_CHANNEL = "usd"
DEFAULT_LANG = "EN"
STOREFRONT_BASE_URL = "https://pawzenpets.shop"
BRAND_NAME = "Pawzen Pets"
BRAND_HANDLE = "@pawzenpets.shop"
DEFAULT_PER_CATEGORY = 2  # Pick best 2 per category

# ─── Curated Selection ───────────────────────────────────────────────────────
# Products hand-picked for Instagram appeal (photogenic, popular, story-worthy)
# Maps product title substring → priority boost (higher = more likely selected)

HERO_PRODUCTS = [
    # Cat toys — visually engaging, fun content
    "Auto-Rotating Laser Cat Toy",
    "Smart LED Cat Laser Toy",
    "Donut Cat Tunnel Bed",
    # Cat furniture — lifestyle content
    "Cat Hanging Window Bed",
    "Window Sill Cat Hammock",
    "Cozy Cat Cave Bed",
    # Dog outdoors — action shots
    "Custom Reflective No-Pull Dog Harness",
    "Retractable Dog Leash",
    "Dog Carrier Backpack",
    "Bicycle Dog Leash",
    "Dog Running Harness",
    # Dog comfort — emotional content
    "Pet Anxiety Relief Vest",
    "Plush Round Pet Bed",
    "Pet Dog Bed",
    # Feeding — practical value
    "Smart Pet Water Fountain",
    "Elevated Double Dog Bowl",
    "3-Layer Puzzle Slow Feeder",
    "Cat Water Fountain",
    "Automatic Pet Feeder",
    # Grooming — before/after content
    "Pet Hair Dryer & Slicker Brush",
    "Pet Deshedding Glove",
    "Pet Bath Brush with Shampoo",
    # Travel — adventure content
    "Portable Foldable Dog Water Bottle",
    "Foldable Silicone Travel Dog Bowl",
    "Pet Carrier Shoulder Bag",
    # Apparel — cute factor
    "Pet sweater",
    "Waterproof Reflective Dog Raincoat",
    "Pet Dog Comforter Headband Scarf",
    # Unique/viral potential
    "No-Spill Floating Pet Bowl",
    "Enclosed Cat Tent Bed",
    "Cat Self-Grooming Wall Brush",
    "Interactive Dog Puzzle",
]

# ─── Hashtag Sets ────────────────────────────────────────────────────────────

BRAND_HASHTAGS = ["#PawzenPets", "#PawzenLife", "#HappyPetHappyLife"]

CATEGORY_HASHTAGS = {
    "toys": ["#PetToys", "#PlayTime", "#HappyPet", "#CatToys", "#DogToys", "#PetPlay"],
    "chase": ["#CatPlay", "#LaserCat", "#CatLife", "#CatMom", "#CatDad", "#FunnyCat"],
    "tunnel": ["#CatTunnel", "#CatFurniture", "#CatLife", "#CatLovers"],
    "feeding": ["#PetFeeding", "#DogBowl", "#CatBowl", "#PetHealth", "#HealthyPet"],
    "drinking": ["#PetHydration", "#WaterFountain", "#DogWater", "#HealthyPet"],
    "beds": ["#PetBed", "#CozyPet", "#DogBed", "#CatBed", "#NapTime", "#PetComfort"],
    "hammock": ["#CatHammock", "#WindowCat", "#CatNap", "#CatLife", "#SunBathing"],
    "grooming": ["#PetGrooming", "#DogGrooming", "#CatGrooming", "#PetCare", "#FurBaby"],
    "shower": ["#PetBath", "#BathTime", "#CleanPet", "#PetCare", "#DogBath"],
    "hair": ["#PetHairRemoval", "#FurFree", "#PetGrooming", "#CleanHome"],
    "harness": ["#DogHarness", "#DogWalk", "#WalkTime", "#DogLife", "#NoPull"],
    "leash": ["#DogLeash", "#DogWalk", "#AdventureDog", "#OutdoorDog"],
    "apparel": ["#DogClothes", "#PetFashion", "#DogStyle", "#CuteDog", "#PetOutfit"],
    "coats": ["#DogCoat", "#DogJacket", "#WinterDog", "#DogFashion", "#PetComfort"],
    "outdoor": ["#PetTravel", "#DogTravel", "#AdventureDog", "#TravelWithPets"],
    "bags": ["#PetCarrier", "#DogBackpack", "#TravelWithPets", "#PetTravel"],
    "furniture": ["#CatFurniture", "#PetFurniture", "#CatLife", "#HomeWithPets"],
    "car": ["#DogCar", "#PetTravel", "#RoadTrip", "#DogLife"],
    "smart": ["#SmartPet", "#PetTech", "#AutomaticFeeder", "#PetGadgets"],
    "default": ["#PetSupplies", "#PetLovers", "#PetParent", "#FurBaby", "#PetShop"],
}

ENGAGEMENT_HASHTAGS = [
    "#DogsOfInstagram", "#CatsOfInstagram", "#PetsOfInstagram",
    "#Instadog", "#Instacat", "#PetLover",
    "#DogMom", "#CatMom", "#DogDad", "#CatDad",
    "#PetParent", "#FurBaby", "#AdoptDontShop",
]

# ─── Caption Templates ──────────────────────────────────────────────────────

CAPTION_TEMPLATES = {
    "product_showcase": [
        "Meet the {name}! {benefit}\n\n{price_line}\n\n{cta}\n\n{hashtags}",
        "{emoji} {name}\n\n{benefit}\n\n{price_line}\n\n{cta}\n\n{hashtags}",
        "Your pet deserves the best. Introducing the {name}.\n\n{benefit}\n\n{price_line}\n\n{cta}\n\n{hashtags}",
    ],
    "sale": [
        "{fire} SALE ALERT! {name} — was {original}, now just {sale_price}!\n\n{benefit}\n\nDon't miss out — limited time only!\n\n{cta}\n\n{hashtags}",
        "Treat your fur baby without breaking the bank! {emoji}\n\n{name} — {sale_price} (save {discount}%!)\n\n{benefit}\n\n{cta}\n\n{hashtags}",
    ],
    "lifestyle": [
        "Every {pet_type} deserves a little luxury. {emoji}\n\nThe {name} is designed with love for your furry friend.\n\n{price_line}\n\n{cta}\n\n{hashtags}",
        "Making life better, one paw at a time. {emoji}\n\n{name} — because {pet_type_plural} deserve the best.\n\n{price_line}\n\n{cta}\n\n{hashtags}",
    ],
    "question": [
        "Does your {pet_type} need a {need}? {emoji}\n\nThe {name} is the perfect solution!\n\n{benefit}\n\n{price_line}\n\n{cta}\n\n{hashtags}",
        "Struggling with {problem}? We've got you covered! {emoji}\n\n{name} — {benefit}\n\n{price_line}\n\n{cta}\n\n{hashtags}",
    ],
}

# ─── Product → Caption Mapping ──────────────────────────────────────────────
# Maps category slugs to content context for smarter caption generation

CATEGORY_CONTEXT = {
    "chase": {"emoji": "🐱✨", "pet_type": "cat", "need": "mental stimulation", "problem": "a bored kitty", "benefit_tpl": "Keep your cat entertained for hours with this interactive laser toy!"},
    "tunnel": {"emoji": "🐱🏠", "pet_type": "cat", "need": "cozy hideaway", "problem": "finding the perfect cat bed", "benefit_tpl": "A tunnel AND a bed — your cat will never want to leave!"},
    "hammock": {"emoji": "🐱☀️", "pet_type": "cat", "need": "window perch", "problem": "your cat hogging your chair", "benefit_tpl": "Let your cat sunbathe in style with this window-mounted hammock!"},
    "beds": {"emoji": "😴🐾", "pet_type": "pet", "need": "comfy bed", "problem": "a pet that steals your spot on the couch", "benefit_tpl": "Ultra-soft, warm, and cozy — the perfect sleep spot for your fur baby."},
    "bowls": {"emoji": "🍽️🐾", "pet_type": "pet", "need": "better feeding setup", "problem": "messy mealtimes", "benefit_tpl": "Designed for healthy eating habits and easy cleanup."},
    "drinking": {"emoji": "💧🐾", "pet_type": "pet", "need": "hydration solution", "problem": "keeping your pet hydrated on the go", "benefit_tpl": "Fresh, clean water wherever your adventures take you!"},
    "feeding": {"emoji": "🧩🐶", "pet_type": "dog", "need": "mental challenge", "problem": "a dog that eats too fast", "benefit_tpl": "Slow feeding + brain training = one happy pup!"},
    "harness": {"emoji": "🐕‍🦺💪", "pet_type": "dog", "need": "comfortable harness", "problem": "your dog pulling on walks", "benefit_tpl": "No-pull design for comfortable, safe walks together."},
    "leash": {"emoji": "🐕🚶", "pet_type": "dog", "need": "reliable leash", "problem": "walks being a tug-of-war", "benefit_tpl": "Built for adventure — safe, durable, and comfortable."},
    "coats": {"emoji": "🧥🐶", "pet_type": "dog", "need": "weather protection", "problem": "anxious pets or rainy walks", "benefit_tpl": "Keep your pup warm, dry, and calm in any weather."},
    "scarves": {"emoji": "🧣🐶", "pet_type": "dog", "need": "comfort accessory", "problem": "an anxious pup", "benefit_tpl": "Style meets comfort — soothes and looks adorable!"},
    "sweatshirts": {"emoji": "👕🐶", "pet_type": "dog", "need": "warm layer", "problem": "keeping your pup cozy in winter", "benefit_tpl": "Soft, stretchy, and oh-so-cute winter wear!"},
    "shower": {"emoji": "🛁🐾", "pet_type": "pet", "need": "bath time upgrade", "problem": "messy bath times", "benefit_tpl": "Makes bath time quick, easy, and (dare we say) fun!"},
    "hair": {"emoji": "✨🏠", "pet_type": "pet", "need": "fur solution", "problem": "pet hair EVERYWHERE", "benefit_tpl": "Say goodbye to fur on your clothes, couch, and bed!"},
    "grooming": {"emoji": "✂️🐾", "pet_type": "pet", "need": "grooming tool", "problem": "tangled fur and shedding", "benefit_tpl": "Professional grooming results from the comfort of home."},
    "bags": {"emoji": "🎒🐾", "pet_type": "pet", "need": "travel carrier", "problem": "traveling with your pet", "benefit_tpl": "Take your best friend everywhere — comfortable and secure!"},
    "car": {"emoji": "🚗🐶", "pet_type": "dog", "need": "car protection", "problem": "muddy paws in the car", "benefit_tpl": "Protect your car while your dog rides in comfort!"},
    "pads": {"emoji": "🐕📋", "pet_type": "dog", "need": "training supplies", "problem": "house training your puppy", "benefit_tpl": "Super-absorbent, leak-proof pads for stress-free training."},
    "default": {"emoji": "🐾❤️", "pet_type": "pet", "need": "quality supplies", "problem": "finding quality pet products", "benefit_tpl": "Premium quality at an affordable price — your pet will love it!"},
}

# ─── GraphQL Query ───────────────────────────────────────────────────────────

PRODUCTS_QUERY = """
query InstagramPosts($channel: String!, $after: String, $lang: LanguageCodeEnum!) {
  products(
    first: 100
    after: $after
    channel: $channel
    filter: { isPublished: true }
  ) {
    pageInfo { hasNextPage endCursor }
    edges {
      node {
        id
        name
        slug
        description
        translation(languageCode: $lang) { name description }
        category {
          name
          slug
          translation(languageCode: $lang) { name }
          parent {
            name
            slug
            translation(languageCode: $lang) { name }
          }
        }
        collections { name slug }
        media {
          url(size: 1024, format: ORIGINAL)
          alt
          type
        }
        pricing {
          priceRange {
            start { gross { amount currency } }
          }
          priceRangeUndiscounted {
            start { gross { amount currency } }
          }
        }
        variants {
          quantityAvailable
        }
      }
    }
  }
}
"""


# ─── GraphQL Client ─────────────────────────────────────────────────────────

def graphql_request(api_url, query, variables):
    payload = json.dumps({"query": query, "variables": variables}).encode("utf-8")
    req = urllib.request.Request(
        api_url, data=payload,
        headers={"Content-Type": "application/json"}, method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = json.loads(resp.read().decode("utf-8"))
    except urllib.error.URLError as e:
        print(f"ERROR: Could not connect to {api_url}: {e}")
        sys.exit(1)
    if "errors" in data:
        print(f"GraphQL errors: {json.dumps(data['errors'], indent=2)}")
        sys.exit(1)
    return data["data"]


def fetch_all_products(api_url, channel, lang):
    all_products = []
    after = None
    page = 1
    while True:
        print(f"  Fetching page {page}...")
        data = graphql_request(api_url, PRODUCTS_QUERY, {"channel": channel, "after": after, "lang": lang})
        products = data["products"]
        for edge in products["edges"]:
            all_products.append(edge["node"])
        if not products["pageInfo"]["hasNextPage"]:
            break
        after = products["pageInfo"]["endCursor"]
        page += 1
    return all_products


# ─── Content Generation ─────────────────────────────────────────────────────

def strip_html(text):
    if not text:
        return ""
    clean = re.sub(r"<[^>]+>", " ", text)
    clean = unescape(clean)
    clean = re.sub(r"\s+", " ", clean).strip()
    return clean


def get_category_key(product):
    """Map product category to our context key."""
    cat = product.get("category") or {}
    slug = cat.get("slug", "")
    parent = (cat.get("parent") or {}).get("slug", "")

    # Map specific slugs
    slug_map = {
        "pet-chase-toys": "chase", "pet-tunnel-toys": "tunnel",
        "pet-hammocks": "hammock", "pet-nests": "beds",
        "pet-bowls": "bowls", "pet-drinking-tools": "drinking",
        "pet-feeding-tools": "feeding",
        "pet-harnesses": "harness", "pet-leashes": "leash",
        "custom-pet-tags-collars-leashes-harnesses": "harness",
        "pet-coats-jackets": "coats", "pet-scarves": "scarves",
        "pet-sweatshirts-hoodies": "sweatshirts",
        "pet-shower-products": "shower",
        "pet-hair-removers-combs": "hair",
        "pet-bags": "bags", "pet-car-mats": "car",
        "dog-training-pads-diapers": "pads",
    }

    if slug in slug_map:
        return slug_map[slug]

    # Fallback by parent
    parent_map = {
        "pet-groomings": "grooming",
        "pet-furnitures": "furniture",
        "pet-outdoor-supplies": "outdoor",
    }
    if parent in parent_map:
        return parent_map[parent]

    return "default"


def get_hashtag_key(cat_key):
    """Map category key to hashtag set."""
    direct = {
        "chase": "chase", "tunnel": "tunnel", "hammock": "hammock",
        "beds": "beds", "bowls": "feeding", "drinking": "drinking",
        "feeding": "feeding", "harness": "harness", "leash": "leash",
        "coats": "coats", "scarves": "apparel", "sweatshirts": "apparel",
        "shower": "shower", "hair": "hair", "grooming": "grooming",
        "bags": "bags", "car": "car", "pads": "outdoor",
        "furniture": "furniture", "outdoor": "outdoor",
    }
    return direct.get(cat_key, "default")


def is_hero(product):
    """Check if product is in our curated hero list."""
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
    """Generate an Instagram caption for a product."""
    name = product.get("name", "")
    trans = product.get("translation")
    if trans and trans.get("name"):
        name = trans["name"]

    # Remove overly long/generic prefixes
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

    # Pet type
    pet_type = get_pet_type(product)
    pet_plural = {"cat": "cats", "dog": "dogs", "pet": "pets"}[pet_type]

    # Choose template
    if is_on_sale:
        template = random.choice(CAPTION_TEMPLATES["sale"])
    else:
        style = random.choice(["product_showcase", "lifestyle", "question"])
        template = random.choice(CAPTION_TEMPLATES[style])

    # Hashtags (12-15 total — Instagram sweet spot)
    ht_key = get_hashtag_key(cat_key)
    hashtags_list = list(BRAND_HASHTAGS)
    hashtags_list += CATEGORY_HASHTAGS.get(ht_key, CATEGORY_HASHTAGS["default"])
    # Add 3-4 engagement hashtags
    remaining = 15 - len(hashtags_list)
    hashtags_list += random.sample(ENGAGEMENT_HASHTAGS, min(remaining, len(ENGAGEMENT_HASHTAGS)))
    hashtags = " ".join(hashtags_list[:15])

    # Build caption
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


def is_valid_image_url(url):
    """Check if URL is a proper image file Instagram will accept."""
    lower = url.lower().rstrip("/")
    return lower.endswith((".jpg", ".jpeg", ".png"))


def has_valid_image(product):
    """Check if product has at least one valid image URL for Instagram."""
    media = product.get("media", [])
    return any(
        m.get("type") == "IMAGE" and m.get("url") and is_valid_image_url(m["url"])
        for m in media
    )


def select_products(products, per_category, select_all=False):
    """Select best products per category (hero products get priority)."""
    if select_all:
        return products

    # Group by category
    by_category = {}
    for p in products:
        cat_key = get_category_key(p)
        if cat_key not in by_category:
            by_category[cat_key] = []
        by_category[cat_key].append(p)

    selected = []
    for cat_key, prods in sorted(by_category.items()):
        # Sort: hero products first, then in-stock first, then by price (descending)
        prods.sort(key=lambda p: (
            -int(is_hero(p)),  # Heroes first
            -int(sum(v.get("quantityAvailable", 0) or 0 for v in p.get("variants", [])) > 0),  # In-stock first
            -(p.get("pricing", {}).get("priceRange", {}).get("start", {}).get("gross", {}).get("amount", 0)),  # Higher price first (more impressive)
        ))

        # Take top N per category
        count = max(per_category, 1)
        selected.extend(prods[:count])

    return selected


# ─── Schedule Generator ─────────────────────────────────────────────────────

def generate_schedule(num_posts, posts_per_day=2):
    """Generate posting schedule: 2 per day, 10am and 3pm."""
    schedule = []
    start = datetime.now() + timedelta(days=1)  # Start tomorrow
    post_times = [10, 15]  # 10 AM and 3 PM

    day = 0
    post_idx = 0
    while post_idx < num_posts:
        date = start + timedelta(days=day)
        for hour in post_times:
            if post_idx >= num_posts:
                break
            dt = date.replace(hour=hour, minute=0, second=0)
            schedule.append(dt.strftime("%Y-%m-%d %H:%M"))
            post_idx += 1
        day += 1

    return schedule


# ─── CSV Writer ──────────────────────────────────────────────────────────────

CSV_COLUMNS = [
    "post_number",
    "scheduled_date",
    "product_name",
    "category",
    "caption",
    "image_url",
    "additional_images",
    "product_link",
    "price",
    "on_sale",
    "post_type",
]


def write_posts_csv(posts, output_path):
    with open(output_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=CSV_COLUMNS, extrasaction="ignore", quoting=csv.QUOTE_ALL)
        writer.writeheader()
        for row in posts:
            writer.writerow(row)

    # Also write a JSON version for reliable parsing by the publisher
    json_path = output_path.replace(".csv", ".json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(posts, f, indent=2, ensure_ascii=False)


# ─── Main ────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Generate Instagram post content from Saleor catalog")
    parser.add_argument("--api-url", default=os.environ.get("SALEOR_API_URL", DEFAULT_API_URL))
    parser.add_argument("--channel", default=DEFAULT_CHANNEL)
    parser.add_argument("--lang", default=DEFAULT_LANG, choices=["EN", "HE", "AR"])
    parser.add_argument("--output", default=None)
    parser.add_argument("--per-cat", type=int, default=DEFAULT_PER_CATEGORY, help="Products per category (default: 2)")
    parser.add_argument("--all", action="store_true", help="Include ALL products")
    parser.add_argument("--posts-per-day", type=int, default=2, help="Posts per day in schedule")
    args = parser.parse_args()

    output_path = args.output or os.path.join(
        os.path.dirname(os.path.abspath(__file__)), "instagram-posts.csv"
    )

    print("╔══════════════════════════════════════════════════════════╗")
    print("║  Instagram Post Content Generator                       ║")
    print(f"║  Brand: {BRAND_NAME:<48}║")
    print("╚══════════════════════════════════════════════════════════╝")
    print()
    print(f"  API:       {args.api_url}")
    print(f"  Channel:   {args.channel}")
    print(f"  Selection: {'ALL products' if args.all else f'{args.per_cat} per category'}")
    print(f"  Output:    {output_path}")
    print()

    # Fetch
    print("Fetching products from Saleor...")
    products = fetch_all_products(args.api_url, args.channel, args.lang)
    print(f"  Found {len(products)} published products")

    # Filter to in-stock only (can't sell out-of-stock on Instagram)
    in_stock = [p for p in products if sum(v.get("quantityAvailable", 0) or 0 for v in p.get("variants", [])) > 0]
    print(f"  In stock: {len(in_stock)}")

    # Exclude products already published to Instagram
    status_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".instagram-publish-status.json")
    published_slugs = set()
    if os.path.exists(status_path):
        with open(status_path, "r") as f:
            status = json.load(f)
        # Collect slugs from published_slugs dict
        published_slugs = set(status.get("published_slugs", {}).keys())
        # Also build slugs from the published dict product names
        for info in status.get("published_slugs", {}).values():
            published_slugs.add(info.get("product", "").lower().replace(" ", "-"))

    if published_slugs:
        before = len(in_stock)
        in_stock = [p for p in in_stock if p.get("slug", "") not in published_slugs]
        excluded = before - len(in_stock)
        print(f"  Excluded: {excluded} already on Instagram")

    print()

    # Select
    selected = select_products(in_stock, args.per_cat, args.all)
    # Shuffle for variety (don't post all from same category back-to-back)
    random.shuffle(selected)
    print(f"Selected {len(selected)} products for Instagram posts")
    print()

    # Generate schedule
    schedule = generate_schedule(len(selected), args.posts_per_day)

    # Generate posts
    print("Generating captions...")
    posts = []
    for i, product in enumerate(selected):
        cat_key = get_category_key(product)
        caption = build_caption(product, cat_key, args.channel)

        media = product.get("media", [])
        images = [m["url"] for m in media if m.get("type") == "IMAGE" and m.get("url")]

        pricing = product.get("pricing", {})
        price = pricing.get("priceRange", {}).get("start", {}).get("gross", {})
        undiscounted = pricing.get("priceRangeUndiscounted", {}).get("start", {}).get("gross", {})
        amount = price.get("amount", 0)
        orig = undiscounted.get("amount", amount)

        cat_name = (product.get("category") or {}).get("name", "Uncategorized")

        post = {
            "post_number": i + 1,
            "scheduled_date": schedule[i] if i < len(schedule) else "",
            "product_name": product.get("name", ""),
            "category": cat_name,
            "caption": caption,
            "image_url": images[0] if images else "",
            "additional_images": " | ".join(images[1:4]) if len(images) > 1 else "",
            "product_link": f"{STOREFRONT_BASE_URL}/{args.channel}/products/{product.get('slug', '')}",
            "price": f"${amount:.2f}" if price.get("currency") == "USD" else f"{amount:.2f} {price.get('currency', '')}",
            "on_sale": "YES" if orig > amount else "NO",
            "post_type": "SALE" if orig > amount else ("HERO" if is_hero(product) else "STANDARD"),
        }
        posts.append(post)

    # Write CSV
    print(f"Writing {len(posts)} posts to {output_path}...")
    write_posts_csv(posts, output_path)
    print()

    # Summary
    sale_posts = sum(1 for p in posts if p["on_sale"] == "YES")
    hero_posts = sum(1 for p in posts if p["post_type"] == "HERO")
    days = len(schedule) // args.posts_per_day if schedule else 0

    # Category breakdown
    cat_counts = {}
    for p in posts:
        c = p["category"]
        cat_counts[c] = cat_counts.get(c, 0) + 1

    print("╔══════════════════════════════════════════════════════════╗")
    print("║  Content Plan Summary                                   ║")
    print("╠══════════════════════════════════════════════════════════╣")
    print(f"║  Total posts:      {len(posts):<38}║")
    print(f"║  Hero products:    {hero_posts:<38}║")
    print(f"║  Sale posts:       {sale_posts:<38}║")
    print(f"║  Schedule:         {args.posts_per_day}/day for ~{days} days{' ' * (28 - len(str(days)))}║")
    if schedule:
        print(f"║  First post:       {schedule[0]:<38}║")
        print(f"║  Last post:        {schedule[-1]:<38}║")
    print("╠══════════════════════════════════════════════════════════╣")
    print("║  Categories covered:                                    ║")
    for cat, count in sorted(cat_counts.items()):
        line = f"    {cat}: {count}"
        print(f"║  {line:<55}║")
    print("╠══════════════════════════════════════════════════════════╣")
    print("║  Next steps:                                            ║")
    print("║  1. Open Meta Business Suite → Content → Planner        ║")
    print("║  2. Download images from image_url column               ║")
    print("║  3. Create posts using captions from the CSV            ║")
    print("║  4. Schedule according to scheduled_date column         ║")
    print("║  5. Review & customize captions to your voice!          ║")
    print("╚══════════════════════════════════════════════════════════╝")
    print()
    print("  💡 TIP: Review each caption and personalize it!")
    print("     The captions are starting points — add your")
    print("     brand personality and specific product details.")
    print()
    print(f"  📄 CSV ready: {output_path}")


if __name__ == "__main__":
    main()
