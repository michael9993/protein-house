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
    return json.loads(urllib.request.urlopen(req).read())

# Get sale collection products WITH metadata
query = """{
  collection(channel: "usd", slug: "sale") {
    products(first: 100) {
      edges {
        node {
          id
          name
          category { name }
          metadata { key value }
          privateMetadata { key value }
          pricing {
            onSale
            priceRange {
              start { gross { amount currency } }
              stop { gross { amount } }
            }
            priceRangeUndiscounted {
              start { gross { amount } }
            }
          }
          variants {
            id
            name
            sku
            metadata { key value }
            pricing {
              price { gross { amount } }
            }
            stocks {
              warehouse { name }
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
if result.get("errors"):
    print("GraphQL errors:", json.dumps(result["errors"], indent=2))
    # Retry without privateMetadata
    query = query.replace("privateMetadata { key value }", "")
    result = gql(query)

col = result.get("data", {}).get("collection")
if not col:
    print("Collection 'sale' not found in USD channel. Trying default-channel...")
    query2 = query.replace('"usd"', '"default-channel"')
    result = gql(query2)
    col = result.get("data", {}).get("collection")
    if not col:
        print("Collection 'sale' not found in either channel!")
        sys.exit(1)

products = col["products"]["edges"]

# Analyze each product
items = []
for edge in products:
    p = edge["node"]
    meta = {m["key"]: m["value"] for m in (p.get("metadata") or [])}
    pmeta = {m["key"]: m["value"] for m in (p.get("privateMetadata") or [])}

    supplier = meta.get("dropship.supplier") or pmeta.get("dropship.supplier", "")
    cost_price_str = meta.get("dropship.costPrice") or pmeta.get("dropship.costPrice", "")

    # Parse cost price
    try:
        cost_price = float(cost_price_str) if cost_price_str else None
    except ValueError:
        cost_price = None

    # Legacy JSON format
    if not supplier and "dropship" in meta:
        try:
            ds = json.loads(meta["dropship"])
            supplier = ds.get("supplier", "")
            if not cost_price:
                cost_price = float(ds.get("costPrice", 0)) or None
        except (json.JSONDecodeError, TypeError):
            pass

    # Prices
    pr = p["pricing"]
    price_low = pr["priceRange"]["start"]["gross"]["amount"]
    price_high = pr["priceRange"]["stop"]["gross"]["amount"]

    # Variant cost prices (some may be on variants)
    variant_costs = []
    variant_prices = []
    for v in (p.get("variants") or []):
        vmeta = {m["key"]: m["value"] for m in (v.get("metadata") or [])}
        vc = vmeta.get("dropship.costPrice")
        if vc:
            try:
                variant_costs.append(float(vc))
            except ValueError:
                pass
        vp = v.get("pricing", {}).get("price", {}).get("gross", {}).get("amount")
        if vp:
            variant_prices.append(vp)

    avg_price = sum(variant_prices) / len(variant_prices) if variant_prices else price_low
    avg_cost = sum(variant_costs) / len(variant_costs) if variant_costs else cost_price

    # Calculate margin
    if avg_cost and avg_cost > 0:
        margin_pct = round((1 - avg_cost / avg_price) * 100, 1)
        max_safe_discount = max(0, margin_pct - 5)  # Keep 5% min margin
    else:
        margin_pct = None
        max_safe_discount = None

    items.append({
        "name": p["name"],
        "category": (p.get("category") or {}).get("name", "N/A"),
        "supplier": supplier or "UNKNOWN",
        "avg_price": avg_price,
        "price_low": price_low,
        "price_high": price_high,
        "cost_price": avg_cost,
        "margin_pct": margin_pct,
        "max_safe_discount": max_safe_discount,
        "has_dropship_meta": bool(supplier),
        "all_meta_keys": list(meta.keys()) + [f"(private){k}" for k in pmeta.keys()],
    })

items.sort(key=lambda x: -(x["avg_price"]))

# === REPORT ===
print("=" * 100)
print("DROPSHIP SALE COLLECTION — COST & MARGIN ANALYSIS")
print("=" * 100)

# Check how many have dropship metadata
with_meta = [i for i in items if i["has_dropship_meta"]]
without_meta = [i for i in items if not i["has_dropship_meta"]]
with_cost = [i for i in items if i["cost_price"] is not None]
without_cost = [i for i in items if i["cost_price"] is None]

print(f"\n  Total products: {len(items)}")
print(f"  With dropship.supplier metadata: {len(with_meta)}")
print(f"  WITHOUT dropship metadata: {len(without_meta)}")
print(f"  With cost price data: {len(with_cost)}")
print(f"  Without cost price: {len(without_cost)}")

suppliers = {}
for i in items:
    s = i["supplier"]
    suppliers.setdefault(s, []).append(i)
print(f"\n  Suppliers: {', '.join(f'{k} ({len(v)})' for k, v in suppliers.items())}")

# Products WITH cost data — full analysis
if with_cost:
    print(f"\n{'=' * 100}")
    print("PRODUCTS WITH COST DATA — MARGIN-BASED DISCOUNT RECOMMENDATIONS")
    print(f"{'=' * 100}")
    print(f"  {'Product':<45} {'Supplier':<6} {'Sell$':>7} {'Cost$':>7} {'Margin':>7} {'MaxDisc':>7} {'RecDisc':>8}")
    print(f"  {'-'*45} {'-'*6} {'-'*7} {'-'*7} {'-'*7} {'-'*7} {'-'*8}")

    for p in sorted(with_cost, key=lambda x: -(x["margin_pct"] or 0)):
        # Recommend discount based on margin
        m = p["margin_pct"]
        if m >= 60:
            rec = "30-40%"
        elif m >= 45:
            rec = "20-30%"
        elif m >= 30:
            rec = "15-20%"
        elif m >= 20:
            rec = "10-15%"
        elif m >= 10:
            rec = "5-10%"
        else:
            rec = "SKIP"

        print(f"  {p['name'][:45]:<45} {p['supplier']:<6} ${p['avg_price']:>6.2f} ${p['cost_price']:>6.2f} {p['margin_pct']:>6.1f}% {p['max_safe_discount']:>6.1f}% {rec:>8}")

# Products WITHOUT cost data
if without_cost:
    print(f"\n{'=' * 100}")
    print("PRODUCTS WITHOUT COST DATA — CONSERVATIVE ESTIMATES")
    print(f"{'=' * 100}")
    print("  (No cost price in metadata — using conservative 40% assumed margin)")
    print(f"\n  {'Product':<50} {'Supplier':<10} {'Sell$':>7} {'SafeDisc':>8}")
    print(f"  {'-'*50} {'-'*10} {'-'*7} {'-'*8}")

    for p in sorted(without_cost, key=lambda x: -x["avg_price"]):
        # Conservative: assume 40% margin for dropship, recommend half
        if p["avg_price"] >= 20:
            safe = "10-15%"
        elif p["avg_price"] >= 8:
            safe = "15-20%"
        elif p["avg_price"] >= 3:
            safe = "20-25%"
        else:
            safe = "Bundle"
        print(f"  {p['name'][:50]:<50} {p['supplier']:<10} ${p['avg_price']:>6.2f} {safe:>8}")

# === FINAL RECOMMENDATION TABLE ===
print(f"\n{'=' * 100}")
print("FINAL DISCOUNT TIERS (Margin-Safe)")
print(f"{'=' * 100}")

# Group by recommended discount
tiers = {"30-40%": [], "20-30%": [], "15-20%": [], "10-15%": [], "5-10%": [], "SKIP": [], "Unknown": []}
for p in items:
    m = p["margin_pct"]
    if m is None:
        tiers["Unknown"].append(p)
    elif m >= 60:
        tiers["30-40%"].append(p)
    elif m >= 45:
        tiers["20-30%"].append(p)
    elif m >= 30:
        tiers["15-20%"].append(p)
    elif m >= 20:
        tiers["10-15%"].append(p)
    elif m >= 10:
        tiers["5-10%"].append(p)
    else:
        tiers["SKIP"].append(p)

for tier_name, prods in tiers.items():
    if not prods:
        continue
    print(f"\n  [{tier_name}] — {len(prods)} products")
    for p in prods:
        cost_str = f"${p['cost_price']:.2f}" if p['cost_price'] else "N/A"
        margin_str = f"{p['margin_pct']:.0f}%" if p['margin_pct'] else "N/A"
        print(f"    ${p['avg_price']:>6.2f} sell | {cost_str:>7} cost | {margin_str:>4} margin | {p['name'][:50]}")
