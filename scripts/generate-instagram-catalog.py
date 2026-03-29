#!/usr/bin/env python3
"""
Facebook/Instagram Product Catalog Generator for Pawzen Pets
=============================================================
Queries the Saleor GraphQL API and generates a CSV file compatible with
Facebook Commerce Manager / Instagram Shopping catalog upload.

Usage:
    python scripts/generate-instagram-catalog.py
    python scripts/generate-instagram-catalog.py --channel usd --lang EN
    python scripts/generate-instagram-catalog.py --channel default-channel --lang HE
    python scripts/generate-instagram-catalog.py --api-url https://api.pawzenpets.shop/graphql/

Output:
    scripts/facebook-product-catalog.csv  (ready to upload to Commerce Manager)

Requirements:
    Python 3.10+ (stdlib only, no pip installs needed)
"""

import argparse
import csv
import json
import os
import sys
import urllib.request
import urllib.error
from html import unescape
from datetime import datetime

# ─── Configuration ───────────────────────────────────────────────────────────

DEFAULT_API_URL = "http://localhost:8000/graphql/"
DEFAULT_CHANNEL = "usd"
DEFAULT_LANG = "EN"
STOREFRONT_BASE_URL = "https://pawzenpets.shop"
BRAND_NAME = "Pawzen Pets"
PRODUCTS_PER_PAGE = 200

# ─── GraphQL Query ───────────────────────────────────────────────────────────

PRODUCTS_QUERY = """
query FacebookCatalog($channel: String!, $after: String, $lang: LanguageCodeEnum!) {
  products(
    first: 100
    after: $after
    channel: $channel
    filter: { isPublished: true }
  ) {
    pageInfo {
      hasNextPage
      endCursor
    }
    edges {
      node {
        id
        name
        slug
        description
        created
        translation(languageCode: $lang) {
          name
          description
        }
        category {
          name
          slug
          translation(languageCode: $lang) {
            name
          }
          parent {
            name
            translation(languageCode: $lang) {
              name
            }
          }
        }
        collections {
          name
          slug
        }
        media {
          url(size: 1024, format: WEBP)
          alt
          type
        }
        pricing {
          priceRange {
            start {
              gross {
                amount
                currency
              }
            }
            stop {
              gross {
                amount
                currency
              }
            }
          }
          priceRangeUndiscounted {
            start {
              gross {
                amount
                currency
              }
            }
          }
        }
        variants {
          id
          name
          sku
          quantityAvailable
          pricing {
            price {
              gross {
                amount
                currency
              }
            }
            priceUndiscounted {
              gross {
                amount
                currency
              }
            }
          }
          attributes {
            attribute {
              name
              slug
            }
            values {
              name
              slug
              translation(languageCode: $lang) {
                name
              }
            }
          }
          media {
            url(size: 1024, format: WEBP)
            alt
          }
        }
        attributes {
          attribute {
            name
            slug
          }
          values {
            name
            slug
            translation(languageCode: $lang) {
              name
            }
          }
        }
        productType {
          name
          hasVariants
        }
      }
    }
  }
}
"""


# ─── GraphQL Client ─────────────────────────────────────────────────────────

def graphql_request(api_url: str, query: str, variables: dict) -> dict:
    """Execute a GraphQL query using stdlib urllib."""
    payload = json.dumps({"query": query, "variables": variables}).encode("utf-8")
    req = urllib.request.Request(
        api_url,
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
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


def fetch_all_products(api_url: str, channel: str, lang: str) -> list:
    """Paginate through all published products."""
    all_products = []
    after = None
    page = 1

    while True:
        print(f"  Fetching page {page}...")
        variables = {"channel": channel, "after": after, "lang": lang}
        data = graphql_request(api_url, PRODUCTS_QUERY, variables)
        products = data["products"]

        for edge in products["edges"]:
            all_products.append(edge["node"])

        if not products["pageInfo"]["hasNextPage"]:
            break

        after = products["pageInfo"]["endCursor"]
        page += 1

    return all_products


# ─── Data Transformation ────────────────────────────────────────────────────

def strip_html(text: str) -> str:
    """Remove HTML tags and decode entities from description."""
    if not text:
        return ""
    import re
    clean = re.sub(r"<[^>]+>", " ", text)
    clean = unescape(clean)
    clean = re.sub(r"\s+", " ", clean).strip()
    return clean[:5000]  # Facebook max description length


def get_attribute_value(product: dict, attr_slug: str) -> str:
    """Extract a specific attribute value from product attributes."""
    for attr in product.get("attributes", []):
        if attr["attribute"]["slug"] == attr_slug:
            values = attr.get("values", [])
            if values:
                # Prefer translation
                trans = values[0].get("translation")
                if trans and trans.get("name"):
                    return trans["name"]
                return values[0].get("name", "")
    return ""


def format_price(amount: float, currency: str) -> str:
    """Format price for Facebook catalog (e.g., '29.99 USD')."""
    return f"{amount:.2f} {currency}"


def get_availability(product: dict) -> str:
    """Determine product availability from variant stock."""
    total_stock = 0
    for variant in product.get("variants", []):
        qty = variant.get("quantityAvailable")
        if qty is not None:
            total_stock += qty

    if total_stock <= 0:
        return "out of stock"
    return "in stock"


def build_category_path(category: dict) -> str:
    """Build category breadcrumb like 'Animals & Pet Supplies > Dog Supplies > Dog Toys'."""
    if not category:
        return "Animals & Pet Supplies"

    parts = []
    # Use Google Product Category taxonomy prefix for pet products
    parts.append("Animals & Pet Supplies")

    parent = category.get("parent")
    if parent:
        parent_name = parent.get("name", "")
        parts.append(parent_name)

    cat_name = category.get("name", "")
    if cat_name:
        parts.append(cat_name)

    return " > ".join(parts)


def product_to_catalog_rows(product: dict, channel: str) -> list[dict]:
    """
    Convert a Saleor product to Facebook catalog row(s).

    If the product has variants, each variant becomes a separate row
    with the product as the item_group_id (for variant grouping).
    """
    rows = []

    # Common fields
    name = product.get("name", "")
    trans = product.get("translation")
    if trans and trans.get("name"):
        name = trans["name"]

    description = strip_html(product.get("description", ""))
    if trans and trans.get("description"):
        description = strip_html(trans["description"])
    if not description:
        description = name

    slug = product.get("slug", "")
    link = f"{STOREFRONT_BASE_URL}/{channel}/products/{slug}"

    # Images
    media = product.get("media", [])
    image_urls = [m["url"] for m in media if m.get("type") == "IMAGE" and m.get("url")]

    image_link = image_urls[0] if image_urls else ""
    additional_images = ",".join(image_urls[1:5]) if len(image_urls) > 1 else ""

    # Category
    category = product.get("category")
    product_type = build_category_path(category)

    # Google product category for pet supplies
    google_category = "Animals & Pet Supplies"

    # Availability
    availability = get_availability(product)

    # Material attribute
    material = get_attribute_value(product, "material")

    # Pricing (product-level)
    pricing = product.get("pricing", {})
    price_range = pricing.get("priceRange", {})
    undiscounted_range = pricing.get("priceRangeUndiscounted", {})

    variants = product.get("variants", [])
    has_variants = len(variants) > 1

    if not variants:
        # No variants — single product row
        start_price = price_range.get("start", {}).get("gross", {})
        amount = start_price.get("amount", 0)
        currency = start_price.get("currency", "USD")

        undiscounted_start = undiscounted_range.get("start", {}).get("gross", {})
        undiscounted_amount = undiscounted_start.get("amount", amount)

        row = {
            "id": product["id"],
            "title": name[:150],
            "description": description,
            "availability": availability,
            "condition": "new",
            "price": format_price(undiscounted_amount, currency),
            "link": link,
            "image_link": image_link,
            "additional_image_link": additional_images,
            "brand": BRAND_NAME,
            "google_product_category": google_category,
            "product_type": product_type,
            "material": material,
        }

        # Add sale price if discounted
        if undiscounted_amount > amount:
            row["sale_price"] = format_price(amount, currency)

        rows.append(row)
    else:
        # Multiple variants — each variant is a row, grouped by item_group_id
        for variant in variants:
            v_pricing = variant.get("pricing", {})
            v_price = v_pricing.get("price", {}).get("gross", {})
            v_amount = v_price.get("amount", 0)
            v_currency = v_price.get("currency", "USD")

            v_undiscounted = v_pricing.get("priceUndiscounted", {}).get("gross", {})
            v_undiscounted_amount = v_undiscounted.get("amount", v_amount)

            # Variant-specific images (fall back to product images)
            v_media = variant.get("media", [])
            v_image_urls = [m["url"] for m in v_media if m.get("url")] if v_media else []
            v_image_link = v_image_urls[0] if v_image_urls else image_link
            v_additional = ",".join(v_image_urls[1:5]) if len(v_image_urls) > 1 else additional_images

            # Variant availability
            v_qty = variant.get("quantityAvailable", 0) or 0
            v_availability = "in stock" if v_qty > 0 else "out of stock"

            # Variant attributes (size, color, etc.)
            v_size = ""
            v_color = ""
            for attr in variant.get("attributes", []):
                attr_slug = attr["attribute"]["slug"]
                values = attr.get("values", [])
                if values:
                    val = values[0]
                    val_name = val.get("name", "")
                    val_trans = val.get("translation")
                    if val_trans and val_trans.get("name"):
                        val_name = val_trans["name"]

                    if attr_slug in ("size", "shoe-size", "bag-size"):
                        v_size = val_name
                    elif attr_slug in ("color", "colour"):
                        v_color = val_name

            # Variant title
            v_name = f"{name} - {variant.get('name', '')}" if variant.get("name") else name

            row = {
                "id": variant.get("sku") or variant["id"],
                "item_group_id": product["id"] if has_variants else "",
                "title": v_name[:150],
                "description": description,
                "availability": v_availability,
                "condition": "new",
                "price": format_price(v_undiscounted_amount, v_currency),
                "link": link,
                "image_link": v_image_link,
                "additional_image_link": v_additional,
                "brand": BRAND_NAME,
                "google_product_category": google_category,
                "product_type": product_type,
                "size": v_size,
                "color": v_color,
                "material": material,
            }

            # Add sale price if discounted
            if v_undiscounted_amount > v_amount:
                row["sale_price"] = format_price(v_amount, v_currency)

            rows.append(row)

    return rows


# ─── CSV Writer ──────────────────────────────────────────────────────────────

CATALOG_COLUMNS = [
    "id",
    "item_group_id",
    "title",
    "description",
    "availability",
    "condition",
    "price",
    "sale_price",
    "link",
    "image_link",
    "additional_image_link",
    "brand",
    "google_product_category",
    "product_type",
    "size",
    "color",
    "material",
]


def write_catalog_csv(rows: list[dict], output_path: str):
    """Write the catalog rows to a CSV file."""
    with open(output_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=CATALOG_COLUMNS, extrasaction="ignore")
        writer.writeheader()
        for row in rows:
            writer.writerow(row)


# ─── Main ────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="Generate Facebook/Instagram product catalog CSV from Saleor"
    )
    parser.add_argument(
        "--api-url",
        default=os.environ.get("SALEOR_API_URL", DEFAULT_API_URL),
        help=f"Saleor GraphQL API URL (default: {DEFAULT_API_URL})",
    )
    parser.add_argument(
        "--channel",
        default=DEFAULT_CHANNEL,
        help=f"Saleor channel slug (default: {DEFAULT_CHANNEL})",
    )
    parser.add_argument(
        "--lang",
        default=DEFAULT_LANG,
        choices=["EN", "HE", "AR"],
        help=f"Language code for translations (default: {DEFAULT_LANG})",
    )
    parser.add_argument(
        "--output",
        default=None,
        help="Output CSV path (default: scripts/facebook-product-catalog.csv)",
    )
    args = parser.parse_args()

    output_path = args.output or os.path.join(
        os.path.dirname(os.path.abspath(__file__)),
        "facebook-product-catalog.csv",
    )

    print(f"╔══════════════════════════════════════════════════════════╗")
    print(f"║  Facebook / Instagram Product Catalog Generator         ║")
    print(f"║  Brand: {BRAND_NAME:<48}║")
    print(f"╚══════════════════════════════════════════════════════════╝")
    print()
    print(f"  API:     {args.api_url}")
    print(f"  Channel: {args.channel}")
    print(f"  Lang:    {args.lang}")
    print(f"  Output:  {output_path}")
    print()

    # Fetch products
    print("Fetching products from Saleor...")
    products = fetch_all_products(args.api_url, args.channel, args.lang)
    print(f"  Found {len(products)} published products")
    print()

    # Transform to catalog rows
    print("Generating catalog rows...")
    all_rows = []
    for product in products:
        rows = product_to_catalog_rows(product, args.channel)
        all_rows.extend(rows)
    print(f"  Generated {len(all_rows)} catalog entries (products + variants)")
    print()

    # Write CSV
    print(f"Writing CSV to {output_path}...")
    write_catalog_csv(all_rows, output_path)
    print(f"  Done!")
    print()

    # Summary
    in_stock = sum(1 for r in all_rows if r.get("availability") == "in stock")
    on_sale = sum(1 for r in all_rows if r.get("sale_price"))
    print(f"╔══════════════════════════════════════════════════════════╗")
    print(f"║  Catalog Summary                                        ║")
    print(f"╠══════════════════════════════════════════════════════════╣")
    print(f"║  Total entries:    {len(all_rows):<38}║")
    print(f"║  In stock:         {in_stock:<38}║")
    print(f"║  Out of stock:     {len(all_rows) - in_stock:<38}║")
    print(f"║  On sale:          {on_sale:<38}║")
    print(f"╠══════════════════════════════════════════════════════════╣")
    print(f"║  Next steps:                                            ║")
    print(f"║  1. Go to commerce.facebook.com                         ║")
    print(f"║  2. Catalog → Data Sources → Data Feed                  ║")
    print(f"║  3. Upload: {os.path.basename(output_path):<44}║")
    print(f"║  4. Enable Instagram Shopping in IG settings             ║")
    print(f"╚══════════════════════════════════════════════════════════╝")


if __name__ == "__main__":
    main()
