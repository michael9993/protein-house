import json, urllib.request, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

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

query = """{
  collection(channel: "usd", slug: "sale") {
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
col = result["data"]["collection"]
products = col["products"]["edges"]

# Build product list with key metrics
items = []
for edge in products:
    p = edge["node"]
    pr = p["pricing"]

    # Use the lowest variant price as the "base" price
    price_low = pr["priceRange"]["start"]["gross"]["amount"]
    price_high = pr["priceRange"]["stop"]["gross"]["amount"]
    undiscounted_low = pr["priceRangeUndiscounted"]["start"]["gross"]["amount"]
    undiscounted_high = pr["priceRangeUndiscounted"]["stop"]["gross"]["amount"]
    currency = pr["priceRange"]["start"]["gross"]["currency"]
    on_sale = pr["onSale"]

    # Current discount
    if on_sale and undiscounted_low > 0:
        current_discount = round((1 - price_low / undiscounted_low) * 100, 1)
    else:
        current_discount = 0

    # Total stock
    total_stock = 0
    variant_count = len(p.get("variants") or [])
    for v in (p.get("variants") or []):
        for s in (v.get("stocks") or []):
            total_stock += s["quantity"] - s["quantityAllocated"]

    # Average variant price
    variant_prices = []
    for v in (p.get("variants") or []):
        vp = v.get("pricing")
        if vp and vp.get("price"):
            variant_prices.append(vp["price"]["gross"]["amount"])
    avg_price = sum(variant_prices) / len(variant_prices) if variant_prices else price_low

    items.append({
        "name": p["name"],
        "id": p["id"],
        "category": (p.get("category") or {}).get("name", "N/A"),
        "type": (p.get("productType") or {}).get("name", "N/A"),
        "price_low": price_low,
        "price_high": price_high,
        "avg_price": avg_price,
        "undiscounted_low": undiscounted_low,
        "on_sale": on_sale,
        "current_discount": current_discount,
        "stock": total_stock,
        "variants": variant_count,
        "currency": currency,
    })

# Sort by average price descending
items.sort(key=lambda x: -x["avg_price"])

# === CATEGORIZE BY VALUE TIER ===
premium = [i for i in items if i["avg_price"] >= 20]
mid_range = [i for i in items if 8 <= i["avg_price"] < 20]
budget = [i for i in items if 3 <= i["avg_price"] < 8]
low_cost = [i for i in items if i["avg_price"] < 3]

print("=" * 90)
print(f"SALE COLLECTION ANALYSIS — {col['name']} ({len(items)} products)")
print("=" * 90)

def print_tier(name, products, rec_discount, rationale):
    print(f"\n{'─' * 90}")
    print(f"  {name} ({len(products)} products)")
    print(f"  Recommended Discount: {rec_discount}")
    print(f"  Rationale: {rationale}")
    print(f"{'─' * 90}")
    for p in products:
        sale_flag = " [ALREADY ON SALE]" if p["on_sale"] else ""
        disc_flag = f" (current: {p['current_discount']}%)" if p["current_discount"] > 0 else ""
        stock_flag = " [OUT OF STOCK]" if p["stock"] == 0 else f" [{p['stock']} in stock]"
        print(f"  ${p['avg_price']:>7.2f} avg | ${p['price_low']:.2f}-${p['price_high']:.2f} range | {p['name'][:50]:<50}{sale_flag}{disc_flag}{stock_flag}")
        print(f"           | Category: {p['category'][:40]} | Variants: {p['variants']}")

print_tier(
    "TIER 1 — PREMIUM ($20+)",
    premium,
    "10-15% off",
    "High-value items. Modest discounts preserve margin and perceived quality. "
    "These are your profit drivers — use discounts sparingly to create urgency, not devalue."
)

print_tier(
    "TIER 2 — MID-RANGE ($8-$20)",
    mid_range,
    "15-25% off",
    "Sweet spot for conversion. Customers expect decent deals here. "
    "A 20% discount feels significant without destroying margins. Good for volume driving."
)

print_tier(
    "TIER 3 — BUDGET ($3-$8)",
    budget,
    "20-30% off",
    "Lower absolute margin means higher % discount still works economically. "
    "Aggressive discounts here drive cart value when bundled with premium items."
)

print_tier(
    "TIER 4 — LOW-COST (Under $3)",
    low_cost,
    "25-40% off OR Bundle Deals",
    "Individual margins are thin. Better as loss-leaders, add-ons, or bundle incentives. "
    "Consider 'Buy 2 Get 1 Free' or 'Add for $0.99 with any purchase' strategies."
)

# === STOCK-BASED RECOMMENDATIONS ===
print(f"\n{'=' * 90}")
print("STOCK-BASED RECOMMENDATIONS")
print(f"{'=' * 90}")

out_of_stock = [i for i in items if i["stock"] == 0]
in_stock = [i for i in items if i["stock"] > 0]
low_stock = [i for i in items if 0 < i["stock"] <= 10]

print(f"\n  Out of Stock: {len(out_of_stock)} products — Consider removing from sale or marking 'Coming Soon'")
print(f"  In Stock: {len(in_stock)} products — Active candidates for discounts")
print(f"  Low Stock (1-10): {len(low_stock)} products — Use scarcity messaging ('Only X left!')")

if out_of_stock:
    print(f"\n  OUT OF STOCK products in sale collection (should review):")
    for p in out_of_stock:
        print(f"    - {p['name'][:60]} (${p['avg_price']:.2f})")

# === ALREADY DISCOUNTED ===
already_sale = [i for i in items if i["on_sale"]]
not_sale = [i for i in items if not i["on_sale"]]

print(f"\n{'=' * 90}")
print("DISCOUNT STATUS")
print(f"{'=' * 90}")
print(f"\n  Already discounted: {len(already_sale)} products")
print(f"  NOT yet discounted: {len(not_sale)} products (in 'sale' collection but no price reduction!)")

if not_sale:
    print(f"\n  PRODUCTS WITH NO ACTUAL DISCOUNT (need attention):")
    for p in not_sale:
        tier = "Premium" if p["avg_price"] >= 20 else "Mid" if p["avg_price"] >= 8 else "Budget" if p["avg_price"] >= 3 else "Low-cost"
        print(f"    - [{tier:>8}] ${p['avg_price']:>7.2f} | {p['name'][:55]} | {p['category'][:30]}")

# === SUMMARY ===
print(f"\n{'=' * 90}")
print("RECOMMENDED DISCOUNT MATRIX")
print(f"{'=' * 90}")
print("""
  ┌─────────────────┬────────────┬───────────────┬────────────────────────────────────┐
  │ Tier            │ Price Range│ Discount      │ Strategy                           │
  ├─────────────────┼────────────┼───────────────┼────────────────────────────────────┤
  │ Premium         │ $20+       │ 10-15%        │ Limited-time, preserve brand value │
  │ Mid-Range       │ $8-$20     │ 15-25%        │ Volume driver, best conversion ROI │
  │ Budget          │ $3-$8      │ 20-30%        │ Impulse buys, cart fillers         │
  │ Low-Cost        │ Under $3   │ 25-40%/Bundle │ Loss leaders, bundle incentives    │
  │ Out of Stock    │ Any        │ REMOVE        │ Remove from sale or waitlist       │
  │ Low Stock       │ Any        │ +5% extra     │ Scarcity urgency, 'almost gone'    │
  └─────────────────┴────────────┴───────────────┴────────────────────────────────────┘
""")

total_value = sum(i["avg_price"] * max(i["stock"], 0) for i in items)
print(f"  Total inventory value (at current prices): ${total_value:,.2f}")
print(f"  Total products: {len(items)} | In stock: {len(in_stock)} | Out of stock: {len(out_of_stock)}")
