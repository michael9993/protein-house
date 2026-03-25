"""
PayPal Order + Refund Test Tool

Creates a full checkout with PayPal payment, then offers refund options.
Run: python scripts/test-paypal-refunds.py

Flow:
  1. Creates checkout with a product
  2. Sets shipping address + delivery method
  3. Initializes PayPal payment
  4. Opens PayPal in browser for approval
  5. After approval, captures payment and creates order
  6. Offers refund options (full, partial, check status)
"""

import json
import os
import sys
import time
import webbrowser
import urllib.request

API = os.environ.get("AURA_API_URL", "http://localhost:8000/graphql/")
EMAIL = os.environ.get("AURA_ADMIN_EMAIL", "admin@example.com")
PASSWORD = os.environ.get("AURA_ADMIN_PASSWORD", "")
if not PASSWORD:
    print("ERROR: Set AURA_ADMIN_PASSWORD environment variable (see infra/.env.self-hosted)")
    sys.exit(1)
CHANNEL = "usd"

TEST_ADDRESS = {
    "firstName": "Test",
    "lastName": "Refund",
    "streetAddress1": "123 Test St",
    "city": "New York",
    "postalCode": "10001",
    "country": "US",
    "countryArea": "NY",
}


def gql(query, token=None, variables=None):
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
        print(f"  GQL Error: {data['errors'][0]['message'][:120]}")
    return data


def get_token():
    r = gql(
        'mutation { tokenCreate(email: "%s", password: "%s") { token errors { message } } }'
        % (EMAIL, PASSWORD)
    )
    t = r["data"]["tokenCreate"]["token"]
    print(f"  [OK] Authenticated")
    return t


def find_variant(token):
    r = gql(
        """query {
          products(channel: "%s", first: 10, filter: { isPublished: true, search: "test product" }) {
            edges { node {
              name
              variants {
                id name
                pricing(address: {country: US}) { price { gross { amount currency } } }
              }
            } }
          }
        }"""
        % CHANNEL,
        token,
    )
    products = r["data"]["products"]["edges"]
    if not products:
        # Fallback to any product if "test product" not found
        print("  'Test Product' not found, using first available product...")
        r = gql(
            """query {
              products(channel: "%s", first: 1, filter: { isPublished: true }) {
                edges { node {
                  name
                  variants {
                    id name
                    pricing(address: {country: US}) { price { gross { amount currency } } }
                  }
                } }
              }
            }"""
            % CHANNEL,
            token,
        )
        products = r["data"]["products"]["edges"]
    if not products:
        print("  No products found!")
        sys.exit(1)
    product = products[0]["node"]
    variant = product["variants"][0]
    price = variant.get("pricing", {}).get("price", {}).get("gross", {})
    print(f"  [OK] Product: {product['name'][:40]}")
    print(f"       Variant: {variant['name']} - {price.get('currency', '?')} {price.get('amount', '?')}")
    return variant["id"], price.get("amount", 10)


def create_checkout(token, variant_id):
    r = gql(
        """mutation CheckoutCreate($input: CheckoutCreateInput!) {
          checkoutCreate(input: $input) {
            checkout {
              id
              totalPrice { gross { amount currency } }
              availablePaymentGateways { id name }
              shippingMethods { id name price { amount currency } }
            }
            errors { message code field }
          }
        }""",
        token,
        {
            "input": {
                "channel": CHANNEL,
                "lines": [{"variantId": variant_id, "quantity": 1}],
                "email": "alarzsite@gmail.com",
                "shippingAddress": TEST_ADDRESS,
                "billingAddress": TEST_ADDRESS,
            }
        },
    )
    errs = r["data"]["checkoutCreate"].get("errors", [])
    if errs:
        print(f"  Checkout errors: {errs}")
        return None, None, None, None

    checkout = r["data"]["checkoutCreate"]["checkout"]
    total = checkout["totalPrice"]["gross"]
    gateways = checkout.get("availablePaymentGateways", [])
    shipping = checkout.get("shippingMethods", [])

    print(f"  [OK] Checkout created - Total: {total['currency']} {total['amount']}")
    print(f"       Gateways: {', '.join(g['name'] for g in gateways) or 'none'}")
    print(f"       Shipping: {', '.join(s['name'] for s in shipping) or 'none'}")

    return checkout["id"], total["amount"], gateways, shipping


def select_shipping(token, checkout_id, shipping_methods):
    if not shipping_methods:
        print("  No shipping methods available!")
        return False

    method = shipping_methods[0]
    r = gql(
        """mutation DeliveryMethod($id: ID!, $deliveryMethodId: ID!) {
          checkoutDeliveryMethodUpdate(id: $id, deliveryMethodId: $deliveryMethodId) {
            checkout {
              id
              totalPrice { gross { amount currency } }
              shippingPrice { gross { amount currency } }
            }
            errors { message code }
          }
        }""",
        token,
        {"id": checkout_id, "deliveryMethodId": method["id"]},
    )
    result = r["data"]["checkoutDeliveryMethodUpdate"]
    if result.get("errors"):
        print(f"  Shipping error: {result['errors']}")
        return False

    total = result["checkout"]["totalPrice"]["gross"]
    ship = result["checkout"]["shippingPrice"]["gross"]
    print(f"  [OK] Shipping: {method['name']} ({ship['currency']} {ship['amount']})")
    print(f"       New total: {total['currency']} {total['amount']}")
    return True


def initialize_paypal(token, checkout_id, gateways):
    paypal_gw = None
    print(f"  Available gateways:")
    for gw in gateways:
        print(f"    - {gw['id']}: {gw['name']}")
        # Match by "PayPal Payment App" name or the app identifier
        if gw["name"] == "PayPal Payment App" or gw["id"] == "app:saleor.app.payment.paypal":
            paypal_gw = gw

    # Fallback: any gateway with "paypal" in name (but not Stripe)
    if not paypal_gw:
        for gw in gateways:
            if "paypal" in gw["name"].lower() and "stripe" not in gw["name"].lower():
                paypal_gw = gw
                break

    if not paypal_gw:
        print("  PayPal gateway not found!")
        return None, None, None

    print(f"  [OK] Using gateway: {paypal_gw['name']} ({paypal_gw['id']})")

    # Don't pass `action` — it requires app-level HANDLE_PAYMENTS permission.
    # The channel's defaultTransactionFlowStrategy will be used (usually CHARGE).
    r = gql(
        """mutation TransactionInit($id: ID!, $gw: PaymentGatewayToInitialize!) {
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
            "gw": {"id": paypal_gw["id"], "data": None},
        },
    )
    if not r.get("data") or not r["data"].get("transactionInitialize"):
        print(f"  Transaction init failed — check permissions")
        return None, None, None
    result = r["data"]["transactionInitialize"]
    if result.get("errors"):
        print(f"  Init error: {result['errors']}")
        return None, None, None

    txn = result["transaction"]
    data = result.get("data")
    if isinstance(data, str):
        data = json.loads(data)

    paypal_order_id = data.get("paypalOrderId") if data else txn.get("pspReference")
    environment = (data.get("paypalEnvironment") or "SANDBOX").upper()

    print(f"  [OK] PayPal order created: {paypal_order_id}")
    print(f"       Environment: {environment}")
    print(f"       Transaction ID: {txn['id']}")

    return txn["id"], paypal_order_id, environment


def open_paypal_approval(paypal_order_id, environment):
    if environment == "SANDBOX":
        url = f"https://www.sandbox.paypal.com/checkoutnow?token={paypal_order_id}"
    else:
        url = f"https://www.paypal.com/checkoutnow?token={paypal_order_id}"

    print(f"\n  Opening PayPal approval page...")
    print(f"  URL: {url}")
    webbrowser.open(url)
    print(f"\n  >>> Approve the payment in PayPal, then press ENTER <<<")
    input()


def process_transaction(token, transaction_id, paypal_order_id):
    print(f"  Processing payment...")
    r = gql(
        """mutation TransactionProcess($id: ID!, $data: JSON) {
          transactionProcess(id: $id, data: $data) {
            transaction { id pspReference actions }
            transactionEvent { message type }
            data
            errors { message code }
          }
        }""",
        token,
        {
            "id": transaction_id,
            "data": {"paypalOrderId": paypal_order_id},
        },
    )
    if not r.get("data") or not r["data"].get("transactionProcess"):
        print(f"  Process failed — no data returned")
        return False
    result = r["data"]["transactionProcess"]
    if result.get("errors"):
        print(f"  Process error: {result['errors']}")
        return False

    event = result.get("transactionEvent", {})
    print(f"  [OK] Payment processed: {event.get('type', '?')} - {event.get('message', '?')}")
    return True


def complete_checkout(token, checkout_id):
    r = gql(
        """mutation Complete($id: ID!) {
          checkoutComplete(id: $id) {
            order { id number }
            errors { message code }
          }
        }""",
        token,
        {"id": checkout_id},
    )
    result = r["data"]["checkoutComplete"]
    if result.get("errors"):
        print(f"  Complete error: {result['errors']}")
        return None
    order = result["order"]
    print(f"  [OK] Order created: #{order['number']} (ID: {order['id'][:30]}...)")
    return order


def get_order_status(token, order_number):
    r = gql(
        """query { orders(filter: { numbers: ["%s"] }, first: 1) {
            edges { node {
                id number status chargeStatus authorizeStatus
                total { gross { amount currency } }
                totalCharged { amount currency }
                totalBalance { amount currency }
                grantedRefunds { id amount { amount currency } status reason }
                transactions {
                    id pspReference
                    chargedAmount { amount currency }
                    refundedAmount { amount currency }
                    events { type amount { amount currency } pspReference message }
                }
            } }
        } }"""
        % order_number,
        token,
    )
    edges = r["data"]["orders"]["edges"]
    return edges[0]["node"] if edges else None


def print_status(order):
    total = order["total"]["gross"]
    charged = order["totalCharged"]
    balance = order["totalBalance"]
    grants = order.get("grantedRefunds", [])
    txns = order.get("transactions", [])

    print(f"\n  +-- Order #{order['number']} ---------------------------+")
    print(f"  | Status:      {order['status']:15s}                |")
    print(f"  | Charge:      {order['chargeStatus']:15s}                |")
    print(f"  | Auth:        {order['authorizeStatus']:15s}                |")
    print(f"  | Total:       {total['currency']} {total['amount']:>8.2f}                    |")
    print(f"  | Captured:    {charged['currency']} {charged['amount']:>8.2f}                    |")
    print(f"  | Outstanding: {balance['currency']} {balance['amount']:>8.2f}                    |")

    if grants:
        print(f"  |                                              |")
        for g in grants:
            print(f"  |  Grant: {g['status']:8s} {g['amount']['amount']:>6.2f} {(g.get('reason') or '')[:22]:22s} |")

    if txns:
        for txn in txns:
            ref = txn["refundedAmount"]["amount"]
            cap = txn["chargedAmount"]["amount"]
            print(f"  |                                              |")
            print(f"  |  Txn: {txn['pspReference'][:20]:20s}              |")
            print(f"  |    Captured: {cap:>6.2f}  Refunded: {ref:>6.2f}          |")
            events = txn.get("events", [])
            refund_events = [e for e in events if "refund" in e["type"].lower()]
            for e in refund_events:
                amt = e["amount"]["amount"] if e.get("amount") else 0
                print(f"  |    {e['type']:22s} {amt:>6.2f}             |")

    print(f"  +----------------------------------------------+")


def grant_and_send_refund(token, order_id, transaction_id, amount, reason="Test refund"):
    print(f"\n  Granting refund of ${amount}...")
    r = gql(
        """mutation Grant($id: ID!, $input: OrderGrantRefundCreateInput!) {
          orderGrantRefundCreate(id: $id, input: $input) {
            grantedRefund { id status }
            errors { message code }
          }
        }""",
        token,
        {"id": order_id, "input": {"amount": amount, "reason": reason, "transactionId": transaction_id}},
    )
    if r["data"]["orderGrantRefundCreate"].get("errors"):
        print(f"  Grant failed: {r['data']['orderGrantRefundCreate']['errors'][0]['message']}")
        return False
    print(f"  [OK] Grant created")

    print(f"  Sending refund to PayPal...")
    r = gql(
        """mutation Refund($id: ID!, $actionType: TransactionActionEnum!, $amount: PositiveDecimal) {
          transactionRequestAction(id: $id, actionType: $actionType, amount: $amount) {
            transaction { id }
            errors { message code }
          }
        }""",
        token,
        {"id": transaction_id, "actionType": "REFUND", "amount": amount},
    )
    if r["data"]["transactionRequestAction"].get("errors"):
        print(f"  Send failed: {r['data']['transactionRequestAction']['errors'][0]['message']}")
        return False
    print(f"  [OK] Refund sent to PayPal")
    time.sleep(3)
    return True


def main():
    print("\n" + "=" * 50)
    print("  PayPal Order + Refund Test Tool")
    print("=" * 50 + "\n")

    token = get_token()

    # Option: use existing order or create new
    print("\n  1. Create new PayPal order")
    print("  2. Use existing order number")
    choice = input("\n  > ").strip()

    order_number = None
    order = None

    if choice == "1":
        # === CREATE ORDER ===
        print("\n--- Step 1: Find product ---")
        variant_id, price = find_variant(token)

        print("\n--- Step 2: Create checkout ---")
        checkout_id, total, gateways, shipping = create_checkout(token, variant_id)
        if not checkout_id:
            return

        print("\n--- Step 3: Select shipping ---")
        if not select_shipping(token, checkout_id, shipping):
            return

        print("\n--- Step 4: Initialize PayPal ---")
        txn_id, paypal_order_id, environment = initialize_paypal(token, checkout_id, gateways)
        if not txn_id:
            return

        print("\n--- Step 5: Approve on PayPal ---")
        open_paypal_approval(paypal_order_id, environment)

        print("--- Step 6: Process payment ---")
        if not process_transaction(token, txn_id, paypal_order_id):
            return

        print("\n--- Step 7: Complete checkout ---")
        result = complete_checkout(token, checkout_id)
        if not result:
            return
        order_number = result["number"]

        time.sleep(2)
        order = get_order_status(token, order_number)
        if order:
            print_status(order)

    elif choice == "2":
        order_number = input("  Order number: ").strip()
        order = get_order_status(token, order_number)
        if order:
            print_status(order)
        else:
            print(f"  Order #{order_number} not found")
            return
    else:
        return

    # === REFUND MENU ===
    while True:
        print("\n  Refund Options:")
        print(f"    1. Full refund (${order['total']['gross']['amount']})")
        print("    2. Partial refund ($5)")
        print("    3. Custom amount refund")
        print("    4. Check order status")
        print("    5. Wait for PayPal webhook (poll every 5s)")
        print("    q. Quit")

        choice = input("\n  > ").strip().lower()

        if choice == "q":
            break

        elif choice in ("1", "2", "3"):
            order = get_order_status(token, order_number)
            txns = order.get("transactions", [])
            if not txns:
                print("  No transactions!")
                continue

            txn_id = txns[0]["id"]
            charged = txns[0]["chargedAmount"]["amount"]

            if choice == "1":
                amount = order["total"]["gross"]["amount"]
                reason = "Full refund test"
            elif choice == "2":
                amount = 5.0
                reason = "Partial refund test ($5)"
            else:
                amount = float(input(f"  Amount (captured: ${charged}): ").strip())
                reason = input("  Reason: ").strip() or "Custom refund"

            success = grant_and_send_refund(token, order["id"], txn_id, amount, reason)
            if success:
                time.sleep(2)
                order = get_order_status(token, order_number)
                if order:
                    print_status(order)

        elif choice == "4":
            order = get_order_status(token, order_number)
            if order:
                print_status(order)

        elif choice == "5":
            print("  Polling for status changes (Ctrl+C to stop)...")
            prev = order.get("chargeStatus", "")
            try:
                while True:
                    time.sleep(5)
                    order = get_order_status(token, order_number)
                    curr = order.get("chargeStatus", "")
                    txns = order.get("transactions", [])
                    refunded = txns[0]["refundedAmount"]["amount"] if txns else 0
                    charged = txns[0]["chargedAmount"]["amount"] if txns else 0
                    status_line = f"  charge={curr:12s} captured={charged} refunded={refunded}"
                    if curr != prev:
                        print(f"  CHANGED! {status_line}")
                        print_status(order)
                        prev = curr
                        break
                    else:
                        print(f"  ... {status_line}", end="\r")
            except KeyboardInterrupt:
                print("\n  Stopped polling.")
                order = get_order_status(token, order_number)
                if order:
                    print_status(order)

    print("\n  Done!\n")


if __name__ == "__main__":
    main()
