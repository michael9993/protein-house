import json, urllib.request

def gql(query, variables=None):
    payload = {"query": query}
    if variables:
        payload["variables"] = variables
    req = urllib.request.Request(
        "http://localhost:8000/graphql/",
        data=json.dumps(payload).encode(),
        headers={"Content-Type": "application/json"},
    )
    resp = urllib.request.urlopen(req)
    return json.loads(resp.read())

# Query sale collection products with full pricing data
query = """{
  collection(channel: "default-channel", slug: "sale") {
    id
    name
    products(first: 100) {
      totalCount
      edges {
        node {
          id
          name
          slug
          created
          category { name }
          productType { name }
          pricing {
            onSale
            priceRange {
              start { gross { amount currency } }
              stop { gross { amount currency } }
            }
            priceRangeUndiscounted {
              start { gross { amount currency } }
              stop { gross { amount currency } }
            }
          }
          variants {
            name
            sku
            pricing {
              price { gross { amount currency } }
              priceUndiscounted { gross { amount currency } }
            }
            stocks {
              quantity
              quantityAllocated
            }
          }
        }
      }
    }
  }
}"""

result = gql(query)

# Also try USD channel
result_usd = gql(query.replace("default-channel", "usd"))

for label, data in [("default-channel (ILS)", result), ("usd (USD)", result_usd)]:
    col = data.get("data", {}).get("collection")
    if not col:
        print(f"\n--- {label}: Collection 'sale' not found ---")
        continue

    products = col["products"]["edges"]
    print(f"\n{'='*80}")
    print(f"Channel: {label} | Collection: {col['name']} | Products: {col['products']['totalCount']}")
    print(f"{'='*80}")

    for edge in products:
        p = edge["node"]
        pr = p["pricing"]
        price_start = pr["priceRange"]["start"]["gross"]["amount"]
        price_stop = pr["priceRange"]["stop"]["gross"]["amount"]
        currency = pr["priceRange"]["start"]["gross"]["currency"]

        undiscounted_start = pr["priceRangeUndiscounted"]["start"]["gross"]["amount"]
        undiscounted_stop = pr["priceRangeUndiscounted"]["start"]["gross"]["amount"]

        on_sale = pr["onSale"]

        # Calculate total stock
        total_stock = 0
        for v in p.get("variants", []):
            for s in (v.get("stocks") or []):
                total_stock += s["quantity"] - s["quantityAllocated"]

        # Current discount if any
        if on_sale and undiscounted_start > 0:
            discount_pct = round((1 - price_start / undiscounted_start) * 100, 1)
        else:
            discount_pct = 0

        price_str = f"{currency} {price_start:.2f}"
        if price_start != price_stop:
            price_str += f" - {currency} {price_stop:.2f}"

        undiscounted_str = f"{currency} {undiscounted_start:.2f}"

        print(f"\n  {p['name']}")
        print(f"    Category: {(p.get('category') or {}).get('name', 'N/A')}")
        print(f"    Type: {(p.get('productType') or {}).get('name', 'N/A')}")
        print(f"    Price: {price_str} | Undiscounted: {undiscounted_str} | On Sale: {on_sale} | Discount: {discount_pct}%")
        print(f"    Stock: {total_stock} units")
        print(f"    Variants: {len(p.get('variants', []))}")

        for v in p.get("variants", []):
            vp = v.get("pricing", {})
            v_price = vp.get("price", {}).get("gross", {}).get("amount", 0)
            v_undiscounted = vp.get("priceUndiscounted", {}).get("gross", {}).get("amount", 0)
            v_stock = sum(s["quantity"] - s["quantityAllocated"] for s in (v.get("stocks") or []))
            print(f"      - {v['name']} (SKU: {v.get('sku', 'N/A')}) | Price: {currency} {v_price:.2f} | Undiscounted: {currency} {v_undiscounted:.2f} | Stock: {v_stock}")
