"""
Refund Email Test Suite — Tests all refund scenarios via Saleor GraphQL API.

Each scenario creates a Stripe checkout, then issues refunds that trigger
the ORDER_REFUNDED webhook → SMTP app → refund confirmation email.

Usage:
  python scripts/test-refund-emails.py              # Interactive menu
  python scripts/test-refund-emails.py --scenario 1  # Run specific scenario
  python scripts/test-refund-emails.py --order 42    # Refund existing order

Prerequisites:
  - Docker containers running (saleor-api, saleor-smtp-app, saleor-stripe-app)
  - At least one published product in USD channel
  - Stripe test mode configured
  - SMTP app configured with valid SMTP credentials

Scenarios:
  1. Single partial refund ($5 of $X)
  2. Full refund (entire order amount)
  3. Two partial refunds (tests cumulative totals)
  4. Refund with reason text
  5. Line-level refund (specific order line)
  6. Manual/dashboard-style refund (grant only, no payment action)
  7. PayPal order + refund (interactive PayPal approval)
"""

import json
import os
import sys
import time
import urllib.request

# ─── Config ───────────────────────────────────────────────────────────────────

API = os.environ.get("AURA_API_URL", "http://localhost:8000/graphql/")
EMAIL = os.environ.get("AURA_ADMIN_EMAIL", "admin@example.com")
PASSWORD = os.environ.get("AURA_ADMIN_PASSWORD", "")
CHANNEL = os.environ.get("AURA_CHANNEL", "usd")
RECIPIENT_EMAIL = os.environ.get("AURA_RECIPIENT_EMAIL", "alarzsite@gmail.com")
if not PASSWORD:
    print("ERROR: Set AURA_ADMIN_PASSWORD environment variable (see infra/.env.self-hosted)")
    sys.exit(1)

TEST_ADDRESS = {
    "firstName": "Test",
    "lastName": "Refund",
    "streetAddress1": "123 Test St",
    "city": "New York",
    "postalCode": "10001",
    "country": "US",
    "countryArea": "NY",
}

# Stripe test token for card payments (bypasses frontend Stripe Elements)
# This is Stripe's test token for a successful card charge
STRIPE_TEST_TOKEN = "tok_visa"


# ─── GraphQL Helper ──────────────────────────────────────────────────────────

def gql(query, token=None, variables=None):
    """Execute a GraphQL query against the Saleor API."""
    payload = {"query": query}
    if variables:
        payload["variables"] = variables
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(API, data=json.dumps(payload).encode(), headers=headers)
    try:
        resp = urllib.request.urlopen(req, timeout=30)
        data = json.loads(resp.read())
    except urllib.error.HTTPError as e:
        body = e.read().decode()[:500]
        print(f"  HTTP {e.code}: {body}")
        return {"data": None, "errors": [{"message": body}]}
    if data.get("errors"):
        print(f"  GQL Error: {data['errors'][0]['message'][:200]}")
    return data


def get_token():
    """Authenticate and return a JWT token."""
    r = gql(
        'mutation { tokenCreate(email: "%s", password: "%s") { token errors { message } } }'
        % (EMAIL, PASSWORD)
    )
    t = r["data"]["tokenCreate"]["token"]
    if not t:
        print(f"  Auth failed: {r['data']['tokenCreate']['errors']}")
        sys.exit(1)
    print(f"  [OK] Authenticated as {EMAIL}")
    return t


# ─── Order Creation Helpers ───────────────────────────────────────────────────

def find_product(token):
    """Find a purchasable product variant. Prefers 'test product' but falls back."""
    for search in ["test product", ""]:
        filter_str = 'filter: { isPublished: true'
        if search:
            filter_str += f', search: "{search}"'
        filter_str += ' }'
        r = gql(
            """query {
              products(channel: "%s", first: 5, %s) {
                edges { node {
                  name
                  variants {
                    id name
                    pricing(address: {country: US}) { price { gross { amount currency } } }
                  }
                } }
              }
            }""" % (CHANNEL, filter_str),
            token,
        )
        products = r["data"]["products"]["edges"]
        if products:
            # Pick the first variant with pricing
            for p in products:
                for v in p["node"]["variants"]:
                    price = v.get("pricing", {}).get("price", {}).get("gross", {})
                    if price.get("amount"):
                        print(f"  [OK] Product: {p['node']['name']}")
                        print(f"       Variant: {v['name']} — {price['currency']} {price['amount']}")
                        return v["id"], price["amount"]

    print("  ERROR: No purchasable products found!")
    sys.exit(1)


def create_checkout(token, variant_id, quantity=1):
    """Create a checkout with the given variant."""
    r = gql(
        """mutation CheckoutCreate($input: CheckoutCreateInput!) {
          checkoutCreate(input: $input) {
            checkout {
              id
              totalPrice { gross { amount currency } }
              availablePaymentGateways { id name }
              shippingMethods { id name price { amount currency } }
              lines { id variant { id name } quantity }
            }
            errors { message code field }
          }
        }""",
        token,
        {
            "input": {
                "channel": CHANNEL,
                "lines": [{"variantId": variant_id, "quantity": quantity}],
                "email": RECIPIENT_EMAIL,
                "shippingAddress": TEST_ADDRESS,
                "billingAddress": TEST_ADDRESS,
            }
        },
    )
    result = r["data"]["checkoutCreate"]
    if result.get("errors") and result["errors"]:
        print(f"  Checkout errors: {result['errors']}")
        return None
    checkout = result["checkout"]
    total = checkout["totalPrice"]["gross"]
    print(f"  [OK] Checkout created — {total['currency']} {total['amount']}")
    return checkout


def select_shipping(token, checkout_id, shipping_methods):
    """Select the first available shipping method."""
    if not shipping_methods:
        print("  No shipping methods — product may not require shipping")
        return True
    method = shipping_methods[0]
    r = gql(
        """mutation ($id: ID!, $deliveryMethodId: ID!) {
          checkoutDeliveryMethodUpdate(id: $id, deliveryMethodId: $deliveryMethodId) {
            checkout { totalPrice { gross { amount currency } } }
            errors { message code }
          }
        }""",
        token,
        {"id": checkout_id, "deliveryMethodId": method["id"]},
    )
    result = r["data"]["checkoutDeliveryMethodUpdate"]
    if result.get("errors") and result["errors"]:
        print(f"  Shipping error: {result['errors']}")
        return False
    total = result["checkout"]["totalPrice"]["gross"]
    print(f"  [OK] Shipping: {method['name']} — New total: {total['currency']} {total['amount']}")
    return True


def pay_with_stripe(token, checkout_id, gateways):
    """Initialize and process a Stripe test payment."""
    stripe_gw = None
    for gw in gateways:
        if "stripe" in gw["name"].lower() or "stripe" in gw["id"].lower():
            stripe_gw = gw
            break

    if not stripe_gw:
        print(f"  Available gateways: {[g['name'] for g in gateways]}")
        print("  ERROR: Stripe gateway not found!")
        return False

    print(f"  Using gateway: {stripe_gw['name']}")

    # Initialize transaction
    r = gql(
        """mutation ($id: ID!, $gw: PaymentGatewayToInitialize!) {
          transactionInitialize(id: $id, paymentGateway: $gw) {
            transaction { id pspReference }
            transactionEvent { message type }
            data
            errors { message code }
          }
        }""",
        token,
        {
            "id": checkout_id,
            "gw": {
                "id": stripe_gw["id"],
                "data": {"paymentMethodId": "pm_card_visa"},
            },
        },
    )
    if not r.get("data") or not r["data"].get("transactionInitialize"):
        print("  Transaction init failed")
        return False
    result = r["data"]["transactionInitialize"]
    if result.get("errors") and result["errors"]:
        print(f"  Init error: {result['errors']}")
        return False

    txn = result["transaction"]
    event = result.get("transactionEvent", {})
    print(f"  [OK] Payment initialized — {event.get('type', '?')}: {event.get('message', '?')}")

    # Process transaction if needed
    data = result.get("data")
    if isinstance(data, str):
        data = json.loads(data)

    if data and data.get("paymentIntent", {}).get("status") == "requires_action":
        print("  Processing payment confirmation...")
        r = gql(
            """mutation ($id: ID!, $data: JSON) {
              transactionProcess(id: $id, data: $data) {
                transaction { id pspReference }
                transactionEvent { message type }
                errors { message code }
              }
            }""",
            token,
            {"id": txn["id"], "data": data},
        )
        if r["data"]["transactionProcess"].get("errors"):
            print(f"  Process error: {r['data']['transactionProcess']['errors']}")
            return False

    print(f"  [OK] Payment successful — Transaction: {txn['id'][:30]}...")
    return True


def complete_checkout(token, checkout_id):
    """Complete the checkout and return the created order."""
    r = gql(
        """mutation ($id: ID!) {
          checkoutComplete(id: $id) {
            order { id number status }
            errors { message code }
          }
        }""",
        token,
        {"id": checkout_id},
    )
    result = r["data"]["checkoutComplete"]
    if result.get("errors") and result["errors"]:
        print(f"  Complete error: {result['errors']}")
        return None
    order = result["order"]
    print(f"  [OK] Order #{order['number']} created (status: {order['status']})")
    return order


def create_paid_order(token):
    """Full flow: find product → checkout → pay → complete. Returns order dict."""
    print("\n--- Finding product ---")
    variant_id, price = find_product(token)

    print("\n--- Creating checkout ---")
    checkout = create_checkout(token, variant_id)
    if not checkout:
        return None

    print("\n--- Selecting shipping ---")
    if not select_shipping(token, checkout["id"], checkout.get("shippingMethods", [])):
        return None

    print("\n--- Processing payment ---")
    if not pay_with_stripe(token, checkout["id"], checkout.get("availablePaymentGateways", [])):
        return None

    print("\n--- Completing checkout ---")
    order = complete_checkout(token, checkout["id"])
    if not order:
        return None

    # Wait for webhooks to process
    print("\n  Waiting 3s for payment webhooks...")
    time.sleep(3)

    return get_order_detail(token, order["number"])


# ─── Order Status ─────────────────────────────────────────────────────────────

def get_order_detail(token, order_number):
    """Fetch full order details including refund info."""
    r = gql(
        """query { orders(filter: { numbers: ["%s"] }, first: 1) {
            edges { node {
                id number status chargeStatus authorizeStatus
                total { gross { amount currency } }
                totalCharged { amount currency }
                totalBalance { amount currency }
                grantedRefunds { id amount { amount currency } status reason createdAt }
                transactions {
                    id pspReference
                    chargedAmount { amount currency }
                    refundedAmount { amount currency }
                    events { type amount { amount currency } pspReference message }
                }
                lines {
                    id productName variantName quantity
                    totalPrice { gross { amount currency } }
                }
            } }
        } }""" % order_number,
        token,
    )
    edges = r["data"]["orders"]["edges"]
    return edges[0]["node"] if edges else None


def print_order_status(order):
    """Pretty-print order status with refund details."""
    total = order["total"]["gross"]
    charged = order["totalCharged"]
    balance = order["totalBalance"]
    grants = order.get("grantedRefunds", [])
    txns = order.get("transactions", [])

    print(f"\n  ┌─ Order #{order['number']} {'─' * 40}")
    print(f"  │ Status:       {order['status']}")
    print(f"  │ Charge:       {order['chargeStatus']}")
    print(f"  │ Total:        {total['currency']} {total['amount']}")
    print(f"  │ Charged:      {charged['currency']} {charged['amount']}")
    print(f"  │ Outstanding:  {balance['currency']} {balance['amount']}")

    if grants:
        total_refunded = sum(g["amount"]["amount"] for g in grants)
        print(f"  │")
        print(f"  │ Granted Refunds ({len(grants)}) — Total: {total['currency']} {total_refunded:.2f}:")
        for i, g in enumerate(grants, 1):
            reason = g.get("reason") or "(no reason)"
            print(f"  │   {i}. {g['status']:10s} {g['amount']['amount']:>8.2f} {g['amount']['currency']}  {reason[:40]}")

    if txns:
        for txn in txns:
            ref_amt = txn["refundedAmount"]["amount"]
            chg_amt = txn["chargedAmount"]["amount"]
            print(f"  │")
            print(f"  │ Transaction: {txn['pspReference'][:30]}")
            print(f"  │   Charged: {chg_amt}  Refunded: {ref_amt}")

    print(f"  └{'─' * 50}")

    # Show what the refund email SHOULD contain
    if grants:
        latest = grants[-1]
        remaining = balance["amount"]
        print(f"\n  📧 Expected Refund Email Content:")
        print(f"     This Refund:     {latest['amount']['currency']} {latest['amount']['amount']}")
        if latest.get("reason"):
            print(f"     Reason:          {latest['reason']}")
        print(f"     Order Total:     {total['currency']} {total['amount']}")
        print(f"     Total Refunded:  {total['currency']} {total_refunded:.2f}")
        if remaining > 0:
            print(f"     Outstanding:     {total['currency']} {remaining}")
            print(f"     Type:            PARTIAL REFUND")
        else:
            print(f"     Type:            FULL REFUND (no outstanding balance shown)")


# ─── Refund Actions ───────────────────────────────────────────────────────────

def grant_refund(token, order_id, amount, reason="", transaction_id=None, lines=None):
    """Create a granted refund on the order."""
    input_data = {"amount": amount}
    if reason:
        input_data["reason"] = reason
    if transaction_id:
        input_data["transactionId"] = transaction_id
    if lines:
        input_data["lines"] = lines

    r = gql(
        """mutation ($id: ID!, $input: OrderGrantRefundCreateInput!) {
          orderGrantRefundCreate(id: $id, input: $input) {
            grantedRefund { id status amount { amount currency } }
            errors { message code field }
          }
        }""",
        token,
        {"id": order_id, "input": input_data},
    )
    result = r["data"]["orderGrantRefundCreate"]
    if result.get("errors") and result["errors"]:
        print(f"  Grant error: {result['errors'][0]['message']}")
        return None
    grant = result["grantedRefund"]
    print(f"  [OK] Refund granted: {grant['amount']['currency']} {grant['amount']['amount']} (status: {grant['status']})")
    return grant


def send_refund(token, transaction_id, amount):
    """Request the payment gateway to process the refund."""
    r = gql(
        """mutation ($id: ID!, $actionType: TransactionActionEnum!, $amount: PositiveDecimal) {
          transactionRequestAction(id: $id, actionType: $actionType, amount: $amount) {
            transaction { id }
            errors { message code }
          }
        }""",
        token,
        {"id": transaction_id, "actionType": "REFUND", "amount": amount},
    )
    result = r["data"]["transactionRequestAction"]
    if result.get("errors") and result["errors"]:
        print(f"  Refund send error: {result['errors'][0]['message']}")
        return False
    print(f"  [OK] Refund of {amount} sent to payment gateway")
    return True


def do_refund(token, order, amount, reason=""):
    """Full refund flow: grant + send to payment gateway."""
    txns = order.get("transactions", [])
    if not txns:
        print("  ERROR: No transactions on this order!")
        return False
    txn_id = txns[0]["id"]

    grant = grant_refund(token, order["id"], amount, reason=reason, transaction_id=txn_id)
    if not grant:
        return False

    success = send_refund(token, txn_id, amount)
    if success:
        print("  Waiting 3s for refund webhook processing...")
        time.sleep(3)
    return success


def do_grant_only(token, order, amount, reason=""):
    """Grant-only refund (no payment action) — simulates manual/dashboard refund note."""
    txns = order.get("transactions", [])
    txn_id = txns[0]["id"] if txns else None
    grant = grant_refund(token, order["id"], amount, reason=reason, transaction_id=txn_id)
    if grant:
        print("  NOTE: This is a grant-only refund — no payment gateway action sent")
        print("        The ORDER_REFUNDED webhook still fires for the email")
        time.sleep(3)
    return grant is not None


def do_line_refund(token, order, reason="Line item refund"):
    """Refund a specific order line."""
    lines = order.get("lines", [])
    if not lines:
        print("  ERROR: No order lines!")
        return False

    print("\n  Order Lines:")
    for i, line in enumerate(lines, 1):
        price = line["totalPrice"]["gross"]
        print(f"    {i}. {line['productName']} ({line['variantName']}) — qty {line['quantity']} — {price['currency']} {price['amount']}")

    choice = input(f"\n  Refund which line? (1-{len(lines)}): ").strip()
    try:
        idx = int(choice) - 1
        line = lines[idx]
    except (ValueError, IndexError):
        print("  Invalid choice!")
        return False

    qty = input(f"  Quantity to refund (max {line['quantity']}): ").strip()
    try:
        qty = int(qty)
    except ValueError:
        qty = line["quantity"]

    amount = line["totalPrice"]["gross"]["amount"]
    if qty < line["quantity"]:
        amount = round(amount * qty / line["quantity"], 2)

    print(f"\n  Refunding line: {line['productName']} x{qty} — {line['totalPrice']['gross']['currency']} {amount}")

    txns = order.get("transactions", [])
    txn_id = txns[0]["id"] if txns else None

    grant = grant_refund(
        token, order["id"], amount,
        reason=reason,
        transaction_id=txn_id,
        lines=[{"id": line["id"], "quantity": qty}],
    )
    if not grant:
        return False

    if txn_id:
        success = send_refund(token, txn_id, amount)
        if success:
            time.sleep(3)
        return success
    return True


# ─── Test Scenarios ───────────────────────────────────────────────────────────

def scenario_partial_refund(token):
    """Scenario 1: Single partial refund ($5)."""
    print("\n" + "=" * 60)
    print("  SCENARIO 1: Single Partial Refund ($5)")
    print("  Expected email: Shows $5 refund, outstanding balance")
    print("=" * 60)

    order = create_paid_order(token)
    if not order:
        return
    print_order_status(order)

    charged = order["totalCharged"]["amount"]
    if charged < 5:
        amount = round(charged / 2, 2)
        print(f"\n  Order total < $5, refunding ${amount} instead")
    else:
        amount = 5.0

    print(f"\n--- Issuing partial refund of ${amount} ---")
    if do_refund(token, order, amount, reason="Partial refund — item damaged"):
        order = get_order_detail(token, order["number"])
        print_order_status(order)


def scenario_full_refund(token):
    """Scenario 2: Full refund (entire order amount)."""
    print("\n" + "=" * 60)
    print("  SCENARIO 2: Full Refund")
    print("  Expected email: Shows full amount, NO outstanding balance")
    print("=" * 60)

    order = create_paid_order(token)
    if not order:
        return
    print_order_status(order)

    amount = order["totalCharged"]["amount"]
    print(f"\n--- Issuing full refund of ${amount} ---")
    if do_refund(token, order, amount, reason="Full refund — order cancelled"):
        order = get_order_detail(token, order["number"])
        print_order_status(order)


def scenario_two_partial_refunds(token):
    """Scenario 3: Two partial refunds (tests cumulative totals)."""
    print("\n" + "=" * 60)
    print("  SCENARIO 3: Two Partial Refunds")
    print("  Expected: 1st email shows partial, 2nd shows full (0 balance)")
    print("=" * 60)

    order = create_paid_order(token)
    if not order:
        return
    print_order_status(order)

    total = order["totalCharged"]["amount"]
    first_amount = round(total / 2, 2)
    second_amount = round(total - first_amount, 2)

    print(f"\n--- Refund 1 of 2: ${first_amount} ---")
    if not do_refund(token, order, first_amount, reason="Partial refund #1 — wrong size"):
        return
    order = get_order_detail(token, order["number"])
    print_order_status(order)

    print(f"\n--- Refund 2 of 2: ${second_amount} (completes full refund) ---")
    if not do_refund(token, order, second_amount, reason="Partial refund #2 — remaining balance"):
        return
    order = get_order_detail(token, order["number"])
    print_order_status(order)


def scenario_refund_with_reason(token):
    """Scenario 4: Refund with detailed reason text."""
    print("\n" + "=" * 60)
    print("  SCENARIO 4: Refund with Reason")
    print("  Expected email: Shows refund reason in the details box")
    print("=" * 60)

    order = create_paid_order(token)
    if not order:
        return
    print_order_status(order)

    amount = 5.0
    charged = order["totalCharged"]["amount"]
    if charged < 5:
        amount = round(charged / 2, 2)

    reason = "Customer received wrong color. Replacement shipped separately."
    print(f"\n--- Issuing refund with reason ---")
    print(f"  Amount: ${amount}")
    print(f"  Reason: {reason}")
    if do_refund(token, order, amount, reason=reason):
        order = get_order_detail(token, order["number"])
        print_order_status(order)


def scenario_line_refund(token):
    """Scenario 5: Line-level refund (specific order line)."""
    print("\n" + "=" * 60)
    print("  SCENARIO 5: Line-Level Refund")
    print("  Expected email: Shows refund for specific line item amount")
    print("=" * 60)

    order = create_paid_order(token)
    if not order:
        return
    print_order_status(order)

    print(f"\n--- Issuing line-level refund ---")
    if do_line_refund(token, order, reason="Defective item in order"):
        order = get_order_detail(token, order["number"])
        print_order_status(order)


def scenario_manual_refund(token):
    """Scenario 6: Manual/dashboard refund (grant only, no payment gateway)."""
    print("\n" + "=" * 60)
    print("  SCENARIO 6: Manual Dashboard Refund (Grant Only)")
    print("  Simulates: Admin grants refund in Dashboard without gateway action")
    print("  Expected email: Shows refund amount (payment refunded manually)")
    print("=" * 60)

    order = create_paid_order(token)
    if not order:
        return
    print_order_status(order)

    amount = 3.50
    charged = order["totalCharged"]["amount"]
    if charged < 3.50:
        amount = round(charged / 3, 2)

    print(f"\n--- Granting manual refund of ${amount} ---")
    if do_grant_only(token, order, amount, reason="Manual refund — cash refunded at store"):
        order = get_order_detail(token, order["number"])
        print_order_status(order)


def scenario_paypal_refund(token):
    """Scenario 7: PayPal order + refund (interactive)."""
    import webbrowser

    print("\n" + "=" * 60)
    print("  SCENARIO 7: PayPal Order + Refund")
    print("  Requires: Manual PayPal approval in browser")
    print("=" * 60)

    print("\n--- Finding product ---")
    variant_id, price = find_product(token)

    print("\n--- Creating checkout ---")
    checkout = create_checkout(token, variant_id)
    if not checkout:
        return

    print("\n--- Selecting shipping ---")
    if not select_shipping(token, checkout["id"], checkout.get("shippingMethods", [])):
        return

    # Find PayPal gateway
    gateways = checkout.get("availablePaymentGateways", [])
    paypal_gw = None
    for gw in gateways:
        if "paypal" in gw["name"].lower() or "paypal" in gw["id"].lower():
            paypal_gw = gw
            break

    if not paypal_gw:
        print(f"  PayPal gateway not found! Available: {[g['name'] for g in gateways]}")
        return

    print(f"\n--- Initializing PayPal payment ---")
    r = gql(
        """mutation ($id: ID!, $gw: PaymentGatewayToInitialize!) {
          transactionInitialize(id: $id, paymentGateway: $gw) {
            transaction { id pspReference }
            data
            errors { message code }
          }
        }""",
        token,
        {"id": checkout["id"], "gw": {"id": paypal_gw["id"], "data": None}},
    )
    result = r["data"]["transactionInitialize"]
    if result.get("errors") and result["errors"]:
        print(f"  Error: {result['errors']}")
        return

    txn = result["transaction"]
    data = result.get("data")
    if isinstance(data, str):
        data = json.loads(data)

    paypal_order_id = data.get("paypalOrderId") if data else txn.get("pspReference")
    env = (data.get("paypalEnvironment") or "SANDBOX").upper()
    base = "www.sandbox.paypal.com" if env == "SANDBOX" else "www.paypal.com"
    url = f"https://{base}/checkoutnow?token={paypal_order_id}"

    print(f"  PayPal Order: {paypal_order_id}")
    print(f"  Opening: {url}")
    webbrowser.open(url)
    print(f"\n  >>> Approve the payment in PayPal, then press ENTER <<<")
    input()

    print("--- Processing PayPal payment ---")
    r = gql(
        """mutation ($id: ID!, $data: JSON) {
          transactionProcess(id: $id, data: $data) {
            transaction { id }
            transactionEvent { message type }
            errors { message code }
          }
        }""",
        token,
        {"id": txn["id"], "data": {"paypalOrderId": paypal_order_id}},
    )
    if r["data"]["transactionProcess"].get("errors"):
        print(f"  Error: {r['data']['transactionProcess']['errors']}")
        return
    print(f"  [OK] PayPal payment processed")

    print("\n--- Completing checkout ---")
    order = complete_checkout(token, checkout["id"])
    if not order:
        return

    time.sleep(3)
    order = get_order_detail(token, order["number"])
    if not order:
        return
    print_order_status(order)

    # Refund menu
    amount = float(input(f"\n  Refund amount (total: {order['totalCharged']['amount']}): ").strip() or "5")
    reason = input("  Reason (or press Enter): ").strip() or "PayPal refund test"
    if do_refund(token, order, amount, reason=reason):
        order = get_order_detail(token, order["number"])
        print_order_status(order)


def scenario_existing_order(token, order_number):
    """Refund an existing order (any payment method)."""
    print(f"\n--- Loading order #{order_number} ---")
    order = get_order_detail(token, order_number)
    if not order:
        print(f"  Order #{order_number} not found!")
        return
    print_order_status(order)

    while True:
        total = order["total"]["gross"]["amount"]
        charged = order["totalCharged"]["amount"]
        balance = order["totalBalance"]["amount"]
        grants = order.get("grantedRefunds", [])
        total_refunded = sum(g["amount"]["amount"] for g in grants)

        print(f"\n  Refund Options for Order #{order_number}:")
        print(f"    1. Partial refund ($5)")
        print(f"    2. Full remaining refund (${balance})")
        print(f"    3. Custom amount")
        print(f"    4. Line-level refund")
        print(f"    5. Grant-only refund (no payment action)")
        print(f"    6. Refresh status")
        print(f"    q. Back to menu")

        choice = input("\n  > ").strip().lower()

        if choice == "q":
            return
        elif choice == "1":
            amt = min(5.0, balance) if balance > 0 else 5.0
            do_refund(token, order, amt, reason="Partial refund test")
        elif choice == "2":
            do_refund(token, order, balance, reason="Full remaining balance refund")
        elif choice == "3":
            amt = float(input(f"  Amount (charged: ${charged}, refunded: ${total_refunded}): ").strip())
            reason = input("  Reason: ").strip() or "Custom refund"
            do_refund(token, order, amt, reason=reason)
        elif choice == "4":
            do_line_refund(token, order)
        elif choice == "5":
            amt = float(input(f"  Grant amount: ").strip())
            reason = input("  Reason: ").strip() or "Manual grant"
            do_grant_only(token, order, amt, reason=reason)
        elif choice == "6":
            pass  # Just refresh below

        order = get_order_detail(token, order_number)
        if order:
            print_order_status(order)


# ─── Main ─────────────────────────────────────────────────────────────────────

SCENARIOS = {
    "1": ("Single partial refund ($5)", scenario_partial_refund),
    "2": ("Full refund (entire amount)", scenario_full_refund),
    "3": ("Two partial refunds (cumulative)", scenario_two_partial_refunds),
    "4": ("Refund with reason text", scenario_refund_with_reason),
    "5": ("Line-level refund", scenario_line_refund),
    "6": ("Manual dashboard refund (grant only)", scenario_manual_refund),
    "7": ("PayPal order + refund (interactive)", scenario_paypal_refund),
}


def main():
    # Parse command-line args
    scenario_num = None
    order_num = None
    for i, arg in enumerate(sys.argv[1:], 1):
        if arg == "--scenario" and i < len(sys.argv) - 1:
            scenario_num = sys.argv[i + 1]
        elif arg == "--order" and i < len(sys.argv) - 1:
            order_num = sys.argv[i + 1]

    print("\n" + "=" * 60)
    print("  Refund Email Test Suite")
    print("  Tests all refund scenarios → ORDER_REFUNDED webhook → Email")
    print("=" * 60)

    token = get_token()

    if order_num:
        scenario_existing_order(token, order_num)
        return

    if scenario_num and scenario_num in SCENARIOS:
        _, fn = SCENARIOS[scenario_num]
        fn(token)
        return

    # Interactive menu
    while True:
        print("\n  Test Scenarios:")
        for num, (desc, _) in SCENARIOS.items():
            print(f"    {num}. {desc}")
        print(f"    8. Refund existing order")
        print(f"    a. Run ALL scenarios (1-6, skips PayPal)")
        print(f"    q. Quit")

        choice = input("\n  > ").strip().lower()

        if choice == "q":
            break
        elif choice == "a":
            for num in ["1", "2", "3", "4", "5", "6"]:
                _, fn = SCENARIOS[num]
                fn(token)
                print("\n  " + "·" * 50)
        elif choice == "8":
            order_num = input("  Order number: ").strip()
            scenario_existing_order(token, order_num)
        elif choice in SCENARIOS:
            _, fn = SCENARIOS[choice]
            fn(token)
        else:
            print("  Invalid choice!")

    print("\n  Done!\n")


if __name__ == "__main__":
    main()
