"""Management command to reorganize pet store categories, set images, and create collections."""

import hashlib
import json
import random
from datetime import timedelta
from decimal import Decimal

import requests
from django.core.files.base import ContentFile
from django.core.management.base import BaseCommand
from django.db.models import Q
from django.utils import timezone

from ....channel.models import Channel
from ...models import (
    Category,
    CategoryTranslation,
    Collection,
    CollectionChannelListing,
    CollectionProduct,
    CollectionTranslation,
    Product,
    ProductVariant,
    ProductVariantChannelListing,
)

# IDs of the 3 top-level wrapper categories to delete
WRAPPER_CATEGORY_IDS = [114, 97, 140]

# Curated Unsplash image URLs for the 12 promoted root categories
CATEGORY_IMAGES = {
    "Pet Toys": {
        "url": "https://images.unsplash.com/photo-1576201836106-db1758fd1c97?w=1280&h=720&fit=crop",
        "alt": "Colorful pet toys",
    },
    "Pet Bedding": {
        "url": "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=1280&h=720&fit=crop",
        "alt": "Cozy pet bed",
    },
    "Pet Apparels": {
        "url": "https://images.unsplash.com/photo-1534361960057-19889db9621e?w=1280&h=720&fit=crop",
        "alt": "Dog wearing fashionable clothes",
    },
    "Pet Collars, Harnesses & Accessories": {
        "url": "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=1280&h=720&fit=crop",
        "alt": "Dog collar and leash accessories",
    },
    "Pet Drinking & Feeding": {
        "url": "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=1280&h=720&fit=crop",
        "alt": "Pet food and water bowls",
    },
    "Pet Furnitures": {
        "url": "https://images.unsplash.com/photo-1545249390-6bdfa286032f?w=1280&h=720&fit=crop",
        "alt": "Cat tree and pet furniture",
    },
    "Pet Groomings": {
        "url": "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=1280&h=720&fit=crop",
        "alt": "Dog grooming session",
    },
    "Pet Outdoor Supplies": {
        "url": "https://images.unsplash.com/photo-1530281700549-e82e7bf110d6?w=1280&h=720&fit=crop",
        "alt": "Dog enjoying outdoor adventure",
    },
    "Home Storage": {
        "url": "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1280&h=720&fit=crop",
        "alt": "Organized home storage solutions",
    },
    "Kitchen, Dining & Bar": {
        "url": "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1280&h=720&fit=crop",
        "alt": "Kitchen and dining accessories",
    },
    "Festive & Party Supplies": {
        "url": "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=1280&h=720&fit=crop",
        "alt": "Festive party decorations",
    },
    "Other Sports Equipment": {
        "url": "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=1280&h=720&fit=crop",
        "alt": "Sports and fitness gear",
    },
}

# 16 collections with their definitions
COLLECTIONS = [
    # --- By Pet Type (2) ---
    {
        "name": "Dog Products",
        "name_he": "מוצרים לכלבים",
        "slug": "dog-products",
        "description": "Everything your dog needs — toys, beds, collars, grooming supplies and more.",
        "type": "pet_type",
        "filter": "dog",
        "image_url": "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=1280&h=720&fit=crop",
        "image_alt": "Happy dog with toys",
    },
    {
        "name": "Cat Products",
        "name_he": "מוצרים לחתולים",
        "slug": "cat-products",
        "description": "Everything for your feline friend — toys, beds, trees, grooming and accessories.",
        "type": "pet_type",
        "filter": "cat",
        "image_url": "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=1280&h=720&fit=crop",
        "image_alt": "Beautiful cat portrait",
    },
    # --- By Function (5) ---
    {
        "name": "Toys",
        "name_he": "צעצועים",
        "slug": "toys-collection",
        "description": "Fun toys to keep your pets entertained and active.",
        "type": "category_slug",
        "patterns": ["pet-toy", "pet-chase", "pet-chew", "pet-tunnel", "pet-training"],
        "image_url": "https://images.unsplash.com/photo-1576201836106-db1758fd1c97?w=1280&h=720&fit=crop",
        "image_alt": "Playful pet toys collection",
    },
    {
        "name": "Feeding & Hydration",
        "name_he": "האכלה ושתייה",
        "slug": "feeding-collection",
        "description": "Bowls, feeders, and drinking solutions for your pets.",
        "type": "category_slug",
        "patterns": ["pet-bowl", "pet-drinking", "pet-feeding"],
        "image_url": "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=1280&h=720&fit=crop",
        "image_alt": "Pet feeding bowls and accessories",
    },
    {
        "name": "Comfort & Bedding",
        "name_he": "נוחות ומצעים",
        "slug": "comfort-collection",
        "description": "Cozy beds, mats, and nests for your pet's comfort.",
        "type": "category_slug",
        "patterns": ["pet-mat", "pet-nest", "pet-bed", "pet-hammock", "pet-tent"],
        "image_url": "https://images.unsplash.com/photo-1560807707-8cc77767d783?w=1280&h=720&fit=crop",
        "image_alt": "Comfortable pet bedding",
    },
    {
        "name": "Care & Grooming",
        "name_he": "טיפוח וגרומינג",
        "slug": "care-grooming-collection",
        "description": "Grooming tools and care products to keep your pet looking their best.",
        "type": "category_slug",
        "patterns": ["pet-hair", "pet-nail", "pet-shower", "pet-grooming"],
        "image_url": "https://images.unsplash.com/photo-1581888227599-779811939961?w=1280&h=720&fit=crop",
        "image_alt": "Pet grooming supplies",
    },
    {
        "name": "Collars, Harnesses & Leashes",
        "name_he": "קולרים, רתמות ורצועות",
        "slug": "collars-harnesses-collection",
        "description": "Walking essentials — collars, harnesses, and leashes for every size.",
        "type": "category_slug",
        "patterns": ["pet-collar", "pet-harness", "pet-leash", "custom-pet"],
        "image_url": "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=1280&h=720&fit=crop",
        "image_alt": "Pet collars and harnesses",
    },
    # --- Curated (4) ---
    {
        "name": "New Arrivals",
        "name_he": "מוצרים חדשים",
        "slug": "new-arrivals",
        "description": "The latest additions to our store.",
        "type": "new_arrivals",
        "image_url": "https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=1280&h=720&fit=crop",
        "image_alt": "New pet products",
    },
    {
        "name": "Best Sellers",
        "name_he": "רבי מכר",
        "slug": "best-sellers",
        "description": "Our most popular products loved by pet owners.",
        "type": "best_sellers",
        "image_url": "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=1280&h=720&fit=crop",
        "image_alt": "Best selling pet products",
    },
    {
        "name": "Featured Products",
        "name_he": "מוצרים מומלצים",
        "slug": "featured-products",
        "description": "Hand-picked products we recommend.",
        "type": "featured",
        "image_url": "https://images.unsplash.com/photo-1592194996308-7b43878e84a6?w=1280&h=720&fit=crop",
        "image_alt": "Featured pet products",
    },
    {
        "name": "Sale",
        "name_he": "מבצעים",
        "slug": "sale",
        "description": "Great deals and discounted products.",
        "type": "sale",
        "image_url": "https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?w=1280&h=720&fit=crop",
        "image_alt": "Products on sale",
    },
    # --- Price Tiers (3) ---
    {
        "name": "Budget Friendly",
        "name_he": "מחירים נוחים",
        "slug": "budget-friendly",
        "description": "Quality products that won't break the bank — all under $25.",
        "type": "price_tier",
        "min_price": Decimal("0"),
        "max_price": Decimal("25"),
        "image_url": "https://images.unsplash.com/photo-1583511655826-05700d52f4d9?w=1280&h=720&fit=crop",
        "image_alt": "Affordable pet products",
    },
    {
        "name": "Mid Range",
        "name_he": "טווח ביניים",
        "slug": "mid-range",
        "description": "The sweet spot — premium quality at reasonable prices ($25–$65).",
        "type": "price_tier",
        "min_price": Decimal("25"),
        "max_price": Decimal("65"),
        "image_url": "https://images.unsplash.com/photo-1588943211346-0908a1fb0b01?w=1280&h=720&fit=crop",
        "image_alt": "Mid-range pet products",
    },
    {
        "name": "Premium Selection",
        "name_he": "פרימיום",
        "slug": "premium-selection",
        "description": "Top-tier products for discerning pet owners ($65+).",
        "type": "price_tier",
        "min_price": Decimal("65"),
        "max_price": None,
        "image_url": "https://images.unsplash.com/photo-1596492784531-6e6eb5ea9993?w=1280&h=720&fit=crop",
        "image_alt": "Premium pet products",
    },
    # --- Special (2) ---
    {
        "name": "Outdoor & Travel",
        "name_he": "חיצוני ונסיעות",
        "slug": "outdoor-travel",
        "description": "Gear up for adventures — outdoor supplies, car accessories, and travel essentials.",
        "type": "special_category",
        "keywords": ["outdoor", "car", "bag", "seat-belt"],
        "image_url": "https://images.unsplash.com/photo-1601758124510-52d02ddb7cbd?w=1280&h=720&fit=crop",
        "image_alt": "Outdoor pet travel gear",
    },
    {
        "name": "Pet Apparel & Fashion",
        "name_he": "אופנה לחיות מחמד",
        "slug": "pet-fashion",
        "description": "Stylish clothing and accessories for your fashionable pet.",
        "type": "special_category",
        "keywords": ["apparel", "clothing", "coat", "shoe", "pajama"],
        "image_url": "https://images.unsplash.com/photo-1596854407944-bf87f6fdd49e?w=1280&h=720&fit=crop",
        "image_alt": "Fashionable pet apparel",
    },
]


def make_editorjs_description(text):
    """Wrap plain text in EditorJS JSON dict (not string — SanitizedJSONField expects dict)."""
    return {
        "time": int(timezone.now().timestamp() * 1000),
        "blocks": [{"type": "paragraph", "data": {"text": text}}],
        "version": "2.22.2",
    }


def download_image(url, timeout=30):
    """Download an image from URL and return (content_bytes, filename) or None."""
    try:
        resp = requests.get(url, timeout=timeout)
        resp.raise_for_status()
        # Generate a stable filename from URL hash
        url_hash = hashlib.md5(url.encode()).hexdigest()[:12]
        ext = "jpg"
        filename = f"{url_hash}.{ext}"
        return resp.content, filename
    except requests.RequestException as e:
        return None, str(e)


class Command(BaseCommand):
    help = "Reorganize pet store: flatten categories, set images, create collections."

    def add_arguments(self, parser):
        parser.add_argument(
            "--flatten-only",
            action="store_true",
            help="Only flatten categories (Phase 1)",
        )
        parser.add_argument(
            "--images-only",
            action="store_true",
            help="Only set category images (Phase 2)",
        )
        parser.add_argument(
            "--collections-only",
            action="store_true",
            help="Only create collections with images (Phase 3+4)",
        )

    def handle(self, *args, **options):
        flatten_only = options["flatten_only"]
        images_only = options["images_only"]
        collections_only = options["collections_only"]
        run_all = not (flatten_only or images_only or collections_only)

        if run_all or flatten_only:
            self._phase1_flatten()
        if run_all or images_only:
            self._phase2_category_images()
        if run_all or collections_only:
            self._phase3_create_collections()

        self.stdout.write(self.style.SUCCESS("\nAll done!"))

    # ── Phase 1: Flatten Categories ──────────────────────────────────────

    def _phase1_flatten(self):
        self.stdout.write(self.style.MIGRATE_HEADING("\n── Phase 1: Flatten Categories ──"))

        wrappers = Category.objects.filter(id__in=WRAPPER_CATEGORY_IDS)
        if not wrappers.exists():
            self.stdout.write("  Wrapper categories already deleted. Skipping.")
            return

        # Promote level-1 children to root
        children = Category.objects.filter(parent_id__in=WRAPPER_CATEGORY_IDS)
        count = children.count()
        self.stdout.write(f"  Promoting {count} categories to root level...")

        for cat in children:
            cat.parent = None
            cat.save()
            self.stdout.write(f"    ✓ {cat.name} (id={cat.id})")

        Category.tree.rebuild()

        # Verify wrappers are empty
        for wrapper in wrappers:
            child_count = wrapper.get_children().count()
            product_count = Product.objects.filter(category=wrapper).count()
            if child_count > 0 or product_count > 0:
                self.stdout.write(
                    self.style.ERROR(
                        f"  WARNING: {wrapper.name} still has {child_count} children, "
                        f"{product_count} products — skipping delete!"
                    )
                )
                return

        # Delete wrapper categories (plain Django delete, NOT delete_categories)
        deleted_count, _ = Category.objects.filter(id__in=WRAPPER_CATEGORY_IDS).delete()
        self.stdout.write(f"  Deleted {deleted_count} wrapper categories.")

        Category.tree.rebuild()

        root_count = Category.objects.filter(level=0).count()
        self.stdout.write(self.style.SUCCESS(f"  Root categories after flatten: {root_count}"))

    # ── Phase 2: Category Images ─────────────────────────────────────────

    def _phase2_category_images(self):
        self.stdout.write(self.style.MIGRATE_HEADING("\n── Phase 2: Category Images ──"))

        roots = Category.objects.filter(level=0)
        for cat in roots:
            if cat.name not in CATEGORY_IMAGES:
                self.stdout.write(f"  ? No image mapping for '{cat.name}' — skipping")
                continue

            if cat.background_image:
                self.stdout.write(f"  ✓ {cat.name} already has image — skipping")
                continue

            img_info = CATEGORY_IMAGES[cat.name]
            image_data, filename = download_image(img_info["url"])
            if image_data is None:
                self.stdout.write(
                    self.style.ERROR(f"  ✗ Failed to download image for {cat.name}: {filename}")
                )
                continue

            cat.background_image.save(filename, ContentFile(image_data))
            cat.background_image_alt = img_info["alt"]
            cat.save()
            self.stdout.write(f"  ✓ {cat.name} — image set ({len(image_data)} bytes)")

    # ── Phase 3+4: Collections + Images ──────────────────────────────────

    def _phase3_create_collections(self):
        self.stdout.write(self.style.MIGRATE_HEADING("\n── Phase 3: Create Collections ──"))

        channels = {ch.slug: ch for ch in Channel.objects.all()}
        if "ils" not in channels or "usd" not in channels:
            self.stdout.write(self.style.ERROR("  Missing ils or usd channel!"))
            return

        all_products = list(Product.objects.all().select_related("category"))
        now = timezone.now()

        for coll_def in COLLECTIONS:
            collection, created = Collection.objects.get_or_create(
                slug=coll_def["slug"],
                defaults={
                    "name": coll_def["name"],
                    "description": make_editorjs_description(coll_def["description"]),
                },
            )
            status = "CREATED" if created else "EXISTS"

            # Find matching products
            products = self._find_products_for_collection(
                coll_def, all_products, now
            )

            # Assign products
            added = 0
            for product in products:
                _, was_created = CollectionProduct.objects.get_or_create(
                    collection=collection, product=product
                )
                if was_created:
                    added += 1

            # Publish in both channels
            for ch_slug in ["ils", "usd"]:
                CollectionChannelListing.objects.get_or_create(
                    collection=collection,
                    channel=channels[ch_slug],
                    defaults={"is_published": True, "published_at": now},
                )

            # Hebrew translation
            CollectionTranslation.objects.get_or_create(
                collection=collection,
                language_code="he",
                defaults={"name": coll_def["name_he"]},
            )

            # Set collection image (Phase 4)
            img_status = ""
            if not collection.background_image and coll_def.get("image_url"):
                image_data, filename = download_image(coll_def["image_url"])
                if image_data:
                    collection.background_image.save(
                        filename, ContentFile(image_data)
                    )
                    collection.background_image_alt = coll_def.get("image_alt", "")
                    collection.save()
                    img_status = " +image"
                else:
                    img_status = " (image failed)"

            self.stdout.write(
                f"  {status}: {collection.name} — "
                f"{len(products)} matched, {added} added{img_status}"
            )

        self.stdout.write(self.style.SUCCESS(f"  Total collections: {Collection.objects.count()}"))

    def _find_products_for_collection(self, coll_def, all_products, now):
        coll_type = coll_def["type"]

        if coll_type == "pet_type":
            keyword = coll_def["filter"].lower()
            return [
                p
                for p in all_products
                if keyword in p.name.lower()
                or (p.category and keyword in p.category.name.lower())
                or (p.category and keyword in p.category.slug.lower())
            ]

        elif coll_type == "category_slug":
            patterns = coll_def["patterns"]
            return [
                p
                for p in all_products
                if p.category
                and any(p.category.slug.startswith(pat) for pat in patterns)
            ]

        elif coll_type == "new_arrivals":
            cutoff = now - timedelta(days=90)
            return [p for p in all_products if p.created_at >= cutoff]

        elif coll_type == "best_sellers":
            rng = random.Random(42)  # Deterministic seed
            shuffled = list(all_products)
            rng.shuffle(shuffled)
            return shuffled[:25]

        elif coll_type == "featured":
            rng = random.Random(99)  # Different seed
            shuffled = list(all_products)
            rng.shuffle(shuffled)
            return shuffled[:20]

        elif coll_type == "sale":
            # Products where discounted_price < price in USD channel
            sale_product_ids = set(
                ProductVariantChannelListing.objects.filter(
                    channel__slug="usd",
                    discounted_price_amount__isnull=False,
                    price_amount__isnull=False,
                )
                .extra(where=["discounted_price_amount < price_amount"])
                .values_list("variant__product_id", flat=True)
            )
            return [p for p in all_products if p.id in sale_product_ids]

        elif coll_type == "price_tier":
            min_p = coll_def["min_price"]
            max_p = coll_def["max_price"]
            # Use USD channel price_amount on variants
            q_filter = Q(
                channel_listings__channel__slug="usd",
                channel_listings__price_amount__gte=min_p,
            )
            if max_p is not None:
                q_filter &= Q(channel_listings__price_amount__lt=max_p)

            tier_product_ids = set(
                ProductVariant.objects.filter(q_filter).values_list(
                    "product_id", flat=True
                )
            )
            return [p for p in all_products if p.id in tier_product_ids]

        elif coll_type == "special_category":
            keywords = coll_def["keywords"]
            return [
                p
                for p in all_products
                if p.category
                and any(kw in p.category.slug for kw in keywords)
            ]

        return []
