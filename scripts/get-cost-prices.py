"""Query dropship cost prices from private metadata via Django ORM (runs inside API container)."""
import os, sys, django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "saleor.settings")
django.setup()

from saleor.product.models import Product, Collection

# Find sale collection
sale_collections = Collection.objects.filter(slug="sale")
if not sale_collections.exists():
    print("No 'sale' collection found!")
    sys.exit(1)

col = sale_collections.first()
products = col.products.all().prefetch_related("variants", "category", "product_type")

print(f"Sale collection: {col.name} ({products.count()} products)")
print()
print(f"{'Product':<50} {'Sell$':>8} {'Cost$':>8} {'Margin':>8} {'MaxDisc':>8} {'RecDisc':>8}")
print(f"{'-'*50} {'-'*8} {'-'*8} {'-'*8} {'-'*8} {'-'*8}")

results = []
for p in products:
    meta = dict(p.metadata) if p.metadata else {}
    pmeta = dict(p.private_metadata) if p.private_metadata else {}

    supplier = meta.get("dropship.supplier") or pmeta.get("dropship.supplier", "?")
    cost_str = pmeta.get("dropship.costPrice") or meta.get("dropship.costPrice", "")

    try:
        cost = float(cost_str) if cost_str else None
    except (ValueError, TypeError):
        cost = None

    # Get average sell price from variants
    from django.db.models import Avg
    from saleor.product.models import ProductVariantChannelListing
    avg_price_data = ProductVariantChannelListing.objects.filter(
        variant__product=p,
        channel__slug="usd"
    ).aggregate(avg_price=Avg("price_amount"))
    avg_price = float(avg_price_data["avg_price"]) if avg_price_data["avg_price"] else 0

    if cost and cost > 0 and avg_price > 0:
        margin = round((1 - cost / avg_price) * 100, 1)
        max_disc = max(0, round(margin - 5, 1))  # Keep 5% min margin
    else:
        margin = None
        max_disc = None

    # Recommended discount based on margin
    if margin is None:
        rec = "NEED COST"
    elif margin >= 60:
        rec = "30-40%"
    elif margin >= 45:
        rec = "20-30%"
    elif margin >= 30:
        rec = "15-20%"
    elif margin >= 20:
        rec = "10-15%"
    elif margin >= 10:
        rec = "5-10%"
    else:
        rec = "NO DISC"

    results.append({
        "name": p.name[:50],
        "supplier": supplier,
        "sell": avg_price,
        "cost": cost,
        "margin": margin,
        "max_disc": max_disc,
        "rec": rec,
    })

# Sort by margin descending (None at bottom)
results.sort(key=lambda x: -(x["margin"] if x["margin"] is not None else -999))

for r in results:
    cost_s = f"${r['cost']:.2f}" if r['cost'] else "N/A"
    margin_s = f"{r['margin']:.1f}%" if r['margin'] is not None else "N/A"
    max_d = f"{r['max_disc']:.1f}%" if r['max_disc'] is not None else "N/A"
    print(f"{r['name']:<50} ${r['sell']:>7.2f} {cost_s:>8} {margin_s:>8} {max_d:>8} {r['rec']:>8}")

# Summary
with_cost = [r for r in results if r["cost"] is not None]
without_cost = [r for r in results if r["cost"] is None]
print(f"\n--- Summary ---")
print(f"Products with cost data: {len(with_cost)}")
print(f"Products WITHOUT cost data: {len(without_cost)}")
if with_cost:
    avg_margin = sum(r["margin"] for r in with_cost) / len(with_cost)
    print(f"Average margin: {avg_margin:.1f}%")
    print(f"Margin range: {min(r['margin'] for r in with_cost):.1f}% - {max(r['margin'] for r in with_cost):.1f}%")
