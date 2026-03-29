"""
Social Publisher — Saleor GraphQL Client
==========================================
Fetches products from Saleor for social media content generation.
"""

import json
import re
import sys
import urllib.request
import urllib.error
from html import unescape


PRODUCTS_QUERY = """
query SocialPosts($channel: String!, $after: String, $lang: LanguageCodeEnum!) {
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
            stop { gross { amount currency } }
          }
          priceRangeUndiscounted {
            start { gross { amount currency } }
          }
        }
        variants {
          id
          name
          sku
          quantityAvailable
          pricing {
            price { gross { amount currency } }
            priceUndiscounted { gross { amount currency } }
          }
          attributes {
            attribute { name slug }
            values {
              name slug
              translation(languageCode: $lang) { name }
            }
          }
          media { url(size: 1024, format: ORIGINAL) alt }
        }
        attributes {
          attribute { name slug }
          values {
            name slug
            translation(languageCode: $lang) { name }
          }
        }
        productType { name hasVariants }
      }
    }
  }
}
"""


def graphql_request(api_url, query, variables):
    """Execute a GraphQL query using stdlib urllib."""
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
    """Paginate through all published products."""
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


def strip_html(text):
    """Remove HTML tags and decode entities."""
    if not text:
        return ""
    clean = re.sub(r"<[^>]+>", " ", text)
    clean = unescape(clean)
    clean = re.sub(r"\s+", " ", clean).strip()
    return clean[:5000]


def get_attribute_value(product, attr_slug):
    """Extract a specific attribute value from product attributes."""
    for attr in product.get("attributes", []):
        if attr["attribute"]["slug"] == attr_slug:
            values = attr.get("values", [])
            if values:
                trans = values[0].get("translation")
                if trans and trans.get("name"):
                    return trans["name"]
                return values[0].get("name", "")
    return ""
