"""
Social Publisher — Configuration
=================================
All brand, API, and content configuration in one place.
"""

import os
import json

# ─── Brand ───────────────────────────────────────────────────────────────────

BRAND_NAME = "Pawzen Pets"
BRAND_HANDLE = "@pawzenpets.shop"
STOREFRONT_BASE_URL = "https://pawzenpets.shop"

# ─── Saleor API ──────────────────────────────────────────────────────────────

DEFAULT_API_URL = "http://localhost:8000/graphql/"
DEFAULT_CHANNEL = "usd"
DEFAULT_LANG = "EN"

# ─── Meta API ────────────────────────────────────────────────────────────────

GRAPH_API_BASE = "https://graph.facebook.com/v21.0"
DEFAULT_DELAY = 30  # seconds between posts
MAX_RETRIES = 3
RETRY_DELAY = 10
DEFAULT_PER_CATEGORY = 2

# ─── File Paths ──────────────────────────────────────────────────────────────

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STATUS_FILE = os.path.join(BASE_DIR, ".publish-status.json")
ENV_FILE = os.path.join(BASE_DIR, ".env")
OUTPUT_CSV = os.path.join(BASE_DIR, "posts.csv")
OUTPUT_JSON = os.path.join(BASE_DIR, "posts.json")
CATALOG_CSV = os.path.join(BASE_DIR, "facebook-catalog.csv")

# ─── Curated Products ───────────────────────────────────────────────────────

HERO_PRODUCTS = [
    # Cat toys
    "Auto-Rotating Laser Cat Toy", "Smart LED Cat Laser Toy", "Donut Cat Tunnel Bed",
    # Cat furniture
    "Cat Hanging Window Bed", "Window Sill Cat Hammock", "Cozy Cat Cave Bed",
    # Dog outdoors
    "Custom Reflective No-Pull Dog Harness", "Retractable Dog Leash",
    "Dog Carrier Backpack", "Bicycle Dog Leash", "Dog Running Harness",
    # Dog comfort
    "Pet Anxiety Relief Vest", "Plush Round Pet Bed", "Pet Dog Bed",
    # Feeding
    "Smart Pet Water Fountain", "Elevated Double Dog Bowl",
    "3-Layer Puzzle Slow Feeder", "Cat Water Fountain", "Automatic Pet Feeder",
    # Grooming
    "Pet Hair Dryer & Slicker Brush", "Pet Deshedding Glove", "Pet Bath Brush with Shampoo",
    # Travel
    "Portable Foldable Dog Water Bottle", "Foldable Silicone Travel Dog Bowl",
    "Pet Carrier Shoulder Bag",
    # Apparel
    "Pet sweater", "Waterproof Reflective Dog Raincoat", "Pet Dog Comforter Headband Scarf",
    # Unique/viral
    "No-Spill Floating Pet Bowl", "Enclosed Cat Tent Bed",
    "Cat Self-Grooming Wall Brush", "Interactive Dog Puzzle",
]

# ─── Hashtags ────────────────────────────────────────────────────────────────

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

# ─── Category Context (for caption generation) ──────────────────────────────

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

# ─── Category Slug Mapping ──────────────────────────────────────────────────

CATEGORY_SLUG_MAP = {
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

CATEGORY_PARENT_MAP = {
    "pet-groomings": "grooming",
    "pet-furnitures": "furniture",
    "pet-outdoor-supplies": "outdoor",
}

HASHTAG_KEY_MAP = {
    "chase": "chase", "tunnel": "tunnel", "hammock": "hammock",
    "beds": "beds", "bowls": "feeding", "drinking": "drinking",
    "feeding": "feeding", "harness": "harness", "leash": "leash",
    "coats": "coats", "scarves": "apparel", "sweatshirts": "apparel",
    "shower": "shower", "hair": "hair", "grooming": "grooming",
    "bags": "bags", "car": "car", "pads": "outdoor",
    "furniture": "furniture", "outdoor": "outdoor",
}

# ─── Credentials ─────────────────────────────────────────────────────────────

def load_env():
    """Load variables from .env file."""
    if os.path.exists(ENV_FILE):
        with open(ENV_FILE, "r") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    key, _, value = line.partition("=")
                    os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


def get_credentials():
    """Get Meta API credentials."""
    load_env()
    token = os.environ.get("META_ACCESS_TOKEN", "") or os.environ.get("INSTAGRAM_ACCESS_TOKEN", "")
    fb_token = os.environ.get("FACEBOOK_ACCESS_TOKEN", "") or token
    ig_account = os.environ.get("INSTAGRAM_ACCOUNT_ID", "")
    fb_page = os.environ.get("FACEBOOK_PAGE_ID", "")

    if not token and not fb_token:
        print("ERROR: Missing access token!")
        print(f"\n  Create {ENV_FILE} with:")
        print("    INSTAGRAM_ACCESS_TOKEN=your_token")
        print("    INSTAGRAM_ACCOUNT_ID=your_ig_id")
        print("    FACEBOOK_PAGE_ID=your_page_id  (optional, for Facebook posts)")
        import sys
        sys.exit(1)

    return token, fb_token, ig_account, fb_page


# ─── Status Tracking ────────────────────────────────────────────────────────

def load_status():
    """Load publish status from tracking file."""
    if os.path.exists(STATUS_FILE):
        with open(STATUS_FILE, "r") as f:
            return json.load(f)
    return {
        "instagram": {"published_slugs": {}},
        "facebook": {"published_slugs": {}},
        "failed": {},
        "last_run": None,
    }


def save_status(status):
    """Save publish status."""
    from datetime import datetime
    status["last_run"] = datetime.now().isoformat()
    with open(STATUS_FILE, "w") as f:
        json.dump(status, f, indent=2)


def get_published_slugs(status, platform="instagram"):
    """Get set of published slugs for a platform."""
    return set(status.get(platform, {}).get("published_slugs", {}).keys())


def mark_published(status, platform, slug, post_id, product_name):
    """Mark a product as published on a platform."""
    from datetime import datetime
    if platform not in status:
        status[platform] = {"published_slugs": {}}
    if "published_slugs" not in status[platform]:
        status[platform]["published_slugs"] = {}
    status[platform]["published_slugs"][slug] = {
        "post_id": post_id,
        "product": product_name,
        "published_at": datetime.now().isoformat(),
    }
