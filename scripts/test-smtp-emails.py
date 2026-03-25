"""
SMTP Email Test Suite — Tests ALL email types against production Saleor.

Creates real orders (via PayPal), triggers account events, and verifies
that the SMTP app sends the correct emails for each event type.

Usage:
  python scripts/test-smtp-emails.py                    # Interactive menu
  python scripts/test-smtp-emails.py --scenario 1       # Run specific scenario
  python scripts/test-smtp-emails.py --all              # Run all scenarios
  python scripts/test-smtp-emails.py --order-only       # Order scenarios only (1-5)

Prerequisites:
  - Saleor API reachable at API_URL
  - PayPal sandbox configured (for order scenarios)
  - SMTP app configured with valid SMTP credentials
  - At least one published product in the channel
"""

import json
import os
import sys
import time
import webbrowser
import urllib.request

# ═══════════════════════════════════════════════════════════════════════════════
# CONFIGURATION — Edit these for your environment
# ═══════════════════════════════════════════════════════════════════════════════

API_URL = os.environ.get("AURA_API_URL", "https://api.pawzenpets.shop/graphql/")
ADMIN_EMAIL = os.environ.get("AURA_ADMIN_EMAIL", "admin@example.com")
ADMIN_PASSWORD = os.environ.get("AURA_ADMIN_PASSWORD", "")
CHANNEL = os.environ.get("AURA_CHANNEL", "usd")
RECIPIENT_EMAIL = os.environ.get("AURA_RECIPIENT_EMAIL", "alarzsite@gmail.com")
STOREFRONT_URL = os.environ.get("AURA_STOREFRONT_URL", "https://pawzenpets.shop")
PRODUCT_SEARCH = os.environ.get("AURA_PRODUCT_SEARCH", "test product")

# Payment gateway — "paypal" (default) or "stripe"
PAYMENT_GATEWAY = os.environ.get("AURA_PAYMENT_GATEWAY", "paypal")
STRIPE_PM_ID = os.environ.get("AURA_STRIPE_PM_ID", "pm_card_visa")

HELP_TEXT = """
SMTP Email Test Suite — Tests ALL email types against Saleor.

USAGE:
  python scripts/test-smtp-emails.py                    # Interactive menu
  python scripts/test-smtp-emails.py --scenario 1       # Run specific scenario
  python scripts/test-smtp-emails.py --all              # Run all scenarios
  python scripts/test-smtp-emails.py --order-only       # Order scenarios only (1-5)
  python scripts/test-smtp-emails.py --help             # Show this help

ENVIRONMENT VARIABLES (required):
  AURA_ADMIN_PASSWORD       Admin password (REQUIRED — no default)

ENVIRONMENT VARIABLES (optional):
  AURA_API_URL              Saleor GraphQL endpoint      (default: http://localhost:8000/graphql/)
  AURA_ADMIN_EMAIL          Admin email for auth          (default: admin@example.com)
  AURA_CHANNEL              Channel slug                  (default: usd)
  AURA_RECIPIENT_EMAIL      Where test emails are sent    (default: alarzsite@gmail.com)
  AURA_STOREFRONT_URL       Storefront URL for links      (default: https://pawzenpets.shop)
  AURA_PRODUCT_SEARCH       Product name to search for    (default: test product)
  AURA_PAYMENT_GATEWAY      Payment gateway: paypal|stripe (default: paypal)
  AURA_STRIPE_PM_ID         Stripe payment method ID      (default: pm_card_visa)

EXAMPLE (production):
  export AURA_API_URL=https://api.yourstore.com/graphql/
  export AURA_ADMIN_EMAIL=admin@yourstore.com
  export AURA_ADMIN_PASSWORD=YourPassword
  export AURA_RECIPIENT_EMAIL=test@gmail.com
  export AURA_STOREFRONT_URL=https://yourstore.com
  python scripts/test-smtp-emails.py

SCENARIOS:
  ORDER LIFECYCLE:
    1. Full order lifecycle (CREATED → CONFIRMED → PAID → FULFILLED → TRACKING)
    2. Order cancellation (CREATED → PAID → CANCELLED)
    3. Partial refund ($5)
    4. Full refund
    5. Multiple partial refunds (cumulative totals)

  ACCOUNT:
    6. Account confirmation (register new account)
    7. Password reset request
    8. Account deletion request
    9. Email change request

  SPECIAL:
    10. Invoice (create order → fulfill → invoice PDF)
    11. Abandoned checkout (recovery email sent by Celery after ~1h)
"""

if "--help" in sys.argv or "-h" in sys.argv:
    print(HELP_TEXT)
    sys.exit(0)

if not ADMIN_PASSWORD:
    print("ERROR: Set AURA_ADMIN_PASSWORD environment variable")
    print("       Run with --help for full configuration guide")
    sys.exit(1)

TEST_ADDRESS = {
    "firstName": "Test",
    "lastName": "EmailSuite",
    "streetAddress1": "123 Test St",
    "city": "New York",
    "postalCode": "10001",
    "country": "US",
    "countryArea": "NY",
}


# ═══════════════════════════════════════════════════════════════════════════════
# GRAPHQL HELPER
# ═══════════════════════════════════════════════════════════════════════════════

def gql(query, token=None, variables=None):
    """Execute a GraphQL query against the Saleor API."""
    payload = {"query": query}
    if variables:
        payload["variables"] = variables
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(
        API_URL, data=json.dumps(payload).encode(), headers=headers
    )
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


# ═══════════════════════════════════════════════════════════════════════════════
# AUTH
# ═══════════════════════════════════════════════════════════════════════════════

def get_admin_token():
    """Authenticate as admin and return JWT token."""
    r = gql(
        'mutation { tokenCreate(email: "%s", password: "%s") { token errors { message } } }'
        % (ADMIN_EMAIL, ADMIN_PASSWORD)
    )
    t = r["data"]["tokenCreate"]["token"]
    if not t:
        print(f"  Auth failed: {r['data']['tokenCreate']['errors']}")
        sys.exit(1)
    print(f"  [OK] Authenticated as {ADMIN_EMAIL}")
    return t


# ═══════════════════════════════════════════════════════════════════════════════
# PRODUCT SEARCH
# ═══════════════════════════════════════════════════════════════════════════════

def find_variant(token):
    """Find a purchasable product variant."""
    for search in [PRODUCT_SEARCH, ""]:
        filter_str = 'filter: { isPublished: true'
        if search:
            filter_str += f', search: "{search}"'
        filter_str += " }"
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
            }"""
            % (CHANNEL, filter_str),
            token,
        )
        products = r["data"]["products"]["edges"]
        if products:
            for p in products:
                for v in p["node"]["variants"]:
                    price = (
                        v.get("pricing", {}).get("price", {}).get("gross", {})
                    )
                    if price.get("amount"):
                        print(f"  [OK] Product: {p['node']['name']}")
                        print(
                            f"       Variant: {v['name']} — {price['currency']} {price['amount']}"
                        )
                        return v["id"], price["amount"]

    print("  ERROR: No purchasable products found!")
    sys.exit(1)


# ═══════════════════════════════════════════════════════════════════════════════
# CHECKOUT + PAYPAL FLOW
# ═══════════════════════════════════════════════════════════════════════════════

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
    print(
        f"  [OK] Shipping: {method['name']} — New total: {total['currency']} {total['amount']}"
    )
    return True


def initialize_paypal(token, checkout_id, gateways):
    """Initialize PayPal payment and return transaction details."""
    paypal_gw = None
    for gw in gateways:
        if "paypal" in gw["name"].lower() or "paypal" in gw["id"].lower():
            paypal_gw = gw
            break
    if not paypal_gw:
        print(f"  PayPal gateway not found! Available: {[g['name'] for g in gateways]}")
        return None, None, None

    print(f"  Using gateway: {paypal_gw['name']} ({paypal_gw['id']})")
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
        {"id": checkout_id, "gw": {"id": paypal_gw["id"], "data": None}},
    )
    if not r.get("data") or not r["data"].get("transactionInitialize"):
        print("  Transaction init failed")
        return None, None, None
    result = r["data"]["transactionInitialize"]
    if result.get("errors") and result["errors"]:
        print(f"  Init error: {result['errors']}")
        return None, None, None

    txn = result["transaction"]
    data = result.get("data")
    if isinstance(data, str):
        data = json.loads(data)

    paypal_order_id = (
        data.get("paypalOrderId") if data else txn.get("pspReference")
    )
    environment = (data.get("paypalEnvironment") or "SANDBOX").upper()

    print(f"  [OK] PayPal order: {paypal_order_id} ({environment})")
    print(f"       Transaction: {txn['id'][:40]}...")
    return txn["id"], paypal_order_id, environment


def open_paypal_approval(paypal_order_id, environment):
    """Open PayPal approval page in browser."""
    base = (
        "www.sandbox.paypal.com" if environment == "SANDBOX" else "www.paypal.com"
    )
    url = f"https://{base}/checkoutnow?token={paypal_order_id}"
    print(f"\n  Opening PayPal approval page...")
    print(f"  URL: {url}")
    webbrowser.open(url)
    print(f"\n  >>> Approve the payment in PayPal, then press ENTER <<<")
    input()


def process_paypal(token, transaction_id, paypal_order_id):
    """Process the PayPal payment after approval."""
    r = gql(
        """mutation ($id: ID!, $data: JSON) {
          transactionProcess(id: $id, data: $data) {
            transaction { id pspReference actions }
            transactionEvent { message type }
            errors { message code }
          }
        }""",
        token,
        {"id": transaction_id, "data": {"paypalOrderId": paypal_order_id}},
    )
    if not r.get("data") or not r["data"].get("transactionProcess"):
        print("  Process failed — no data returned")
        return False
    result = r["data"]["transactionProcess"]
    if result.get("errors") and result["errors"]:
        print(f"  Process error: {result['errors']}")
        return False
    event = result.get("transactionEvent", {})
    print(
        f"  [OK] Payment processed: {event.get('type', '?')} — {event.get('message', '?')}"
    )
    return True


def complete_checkout(token, checkout_id):
    """Complete the checkout and return the order."""
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
    print(f"       📧 ORDER_CREATED email should be sent")
    return order


def create_paid_order(token):
    """Full PayPal flow: product → checkout → pay → complete. Returns order."""
    print("\n--- Finding product ---")
    variant_id, price = find_variant(token)

    print("\n--- Creating checkout ---")
    checkout = create_checkout(token, variant_id)
    if not checkout:
        return None

    print("\n--- Selecting shipping ---")
    if not select_shipping(
        token, checkout["id"], checkout.get("shippingMethods", [])
    ):
        return None

    print("\n--- Initializing PayPal ---")
    txn_id, paypal_order_id, env = initialize_paypal(
        token, checkout["id"], checkout.get("availablePaymentGateways", [])
    )
    if not txn_id:
        return None

    print("\n--- PayPal Approval ---")
    open_paypal_approval(paypal_order_id, env)

    print("--- Processing Payment ---")
    if not process_paypal(token, txn_id, paypal_order_id):
        return None

    print("\n--- Completing Checkout ---")
    order = complete_checkout(token, checkout["id"])
    if not order:
        return None

    print("\n  Waiting 3s for webhooks...")
    time.sleep(3)
    print(f"       📧 ORDER_FULLY_PAID email should be sent")

    return get_order_detail(token, order["number"])


# ═══════════════════════════════════════════════════════════════════════════════
# ORDER ADMIN MUTATIONS
# ═══════════════════════════════════════════════════════════════════════════════

def confirm_order(token, order_id):
    """Confirm an unconfirmed order."""
    r = gql(
        """mutation ($id: ID!) {
          orderConfirm(id: $id) {
            order { id number status }
            errors { message code }
          }
        }""",
        token,
        {"id": order_id},
    )
    result = r["data"]["orderConfirm"]
    if result.get("errors") and result["errors"]:
        print(f"  Confirm error: {result['errors']}")
        return False
    print(f"  [OK] Order confirmed (status: {result['order']['status']})")
    print(f"       📧 ORDER_CONFIRMED email should be sent")
    return True


def fulfill_order(token, order_id, order_lines):
    """Fulfill all lines in the order."""
    lines = []
    for line in order_lines:
        lines.append(
            {
                "orderLineId": line["id"],
                "stocks": [{"warehouse": None, "quantity": line["quantity"]}],
            }
        )

    # First get warehouse ID
    r = gql(
        """query { warehouses(first: 1) { edges { node { id name } } } }""",
        token,
    )
    warehouses = r["data"]["warehouses"]["edges"]
    if not warehouses:
        print("  ERROR: No warehouses found!")
        return None
    warehouse_id = warehouses[0]["node"]["id"]

    fulfill_lines = []
    for line in order_lines:
        fulfill_lines.append(
            {
                "orderLineId": line["id"],
                "stocks": [{"warehouse": warehouse_id, "quantity": line["quantity"]}],
            }
        )

    r = gql(
        """mutation ($order: ID!, $input: OrderFulfillInput!) {
          orderFulfill(order: $order, input: $input) {
            fulfillments { id status trackingNumber }
            errors { message code field warehouse orderLines }
          }
        }""",
        token,
        {
            "order": order_id,
            "input": {
                "lines": fulfill_lines,
                "notifyCustomer": True,
                "allowStockToBeExceeded": True,
            },
        },
    )
    result = r["data"]["orderFulfill"]
    if result.get("errors") and result["errors"]:
        print(f"  Fulfill error: {result['errors']}")
        return None
    fulfillment = result["fulfillments"][0] if result["fulfillments"] else None
    if fulfillment:
        print(f"  [OK] Order fulfilled (fulfillment: {fulfillment['id'][:30]}...)")
        print(f"       📧 ORDER_FULFILLED email should be sent")
    return fulfillment


def update_fulfillment_tracking(token, fulfillment_id, tracking_number="TEST-TRACK-123456"):
    """Update tracking number on a fulfillment."""
    r = gql(
        """mutation ($id: ID!, $input: FulfillmentUpdateTrackingInput!) {
          orderFulfillmentUpdateTracking(id: $id, input: $input) {
            fulfillment { id trackingNumber }
            errors { message code }
          }
        }""",
        token,
        {
            "id": fulfillment_id,
            "input": {
                "trackingNumber": tracking_number,
                "notifyCustomer": True,
            },
        },
    )
    result = r["data"]["orderFulfillmentUpdateTracking"]
    if result.get("errors") and result["errors"]:
        print(f"  Tracking error: {result['errors']}")
        return False
    print(f"  [OK] Tracking updated: {tracking_number}")
    print(f"       📧 ORDER_FULFILLMENT_UPDATE email should be sent")
    return True


def cancel_order(token, order_id):
    """Cancel an order."""
    r = gql(
        """mutation ($id: ID!) {
          orderCancel(id: $id) {
            order { id number status }
            errors { message code }
          }
        }""",
        token,
        {"id": order_id},
    )
    result = r["data"]["orderCancel"]
    if result.get("errors") and result["errors"]:
        print(f"  Cancel error: {result['errors']}")
        return False
    print(f"  [OK] Order cancelled (status: {result['order']['status']})")
    print(f"       📧 ORDER_CANCELLED email should be sent")
    return True


def grant_and_send_refund(token, order, amount, reason="Test refund"):
    """Grant a refund and send it to the payment gateway."""
    txns = order.get("transactions", [])
    if not txns:
        print("  ERROR: No transactions on this order!")
        return False
    txn_id = txns[0]["id"]

    print(f"  Granting refund of {amount}...")
    r = gql(
        """mutation ($id: ID!, $input: OrderGrantRefundCreateInput!) {
          orderGrantRefundCreate(id: $id, input: $input) {
            grantedRefund { id status amount { amount currency } }
            errors { message code }
          }
        }""",
        token,
        {
            "id": order["id"],
            "input": {"amount": amount, "reason": reason, "transactionId": txn_id},
        },
    )
    if r["data"]["orderGrantRefundCreate"].get("errors"):
        print(
            f"  Grant error: {r['data']['orderGrantRefundCreate']['errors'][0]['message']}"
        )
        return False
    print(f"  [OK] Refund granted")

    print(f"  Sending refund to payment gateway...")
    r = gql(
        """mutation ($id: ID!, $actionType: TransactionActionEnum!, $amount: PositiveDecimal) {
          transactionRequestAction(id: $id, actionType: $actionType, amount: $amount) {
            transaction { id }
            errors { message code }
          }
        }""",
        token,
        {"id": txn_id, "actionType": "REFUND", "amount": amount},
    )
    if r["data"]["transactionRequestAction"].get("errors"):
        print(
            f"  Refund send error: {r['data']['transactionRequestAction']['errors'][0]['message']}"
        )
        return False
    print(f"  [OK] Refund of {amount} sent to gateway")
    print(f"       📧 ORDER_REFUNDED email should be sent")
    time.sleep(3)
    return True


def request_invoice(token, order_id):
    """Request an invoice for an order."""
    r = gql(
        """mutation ($orderId: ID!) {
          invoiceRequest(orderId: $orderId) {
            invoice { id number url status }
            errors { message code }
          }
        }""",
        token,
        {"orderId": order_id},
    )
    result = r["data"]["invoiceRequest"]
    if result.get("errors") and result["errors"]:
        print(f"  Invoice error: {result['errors']}")
        return False
    invoice = result.get("invoice")
    if invoice:
        print(f"  [OK] Invoice requested: #{invoice.get('number', '?')} (status: {invoice.get('status', '?')})")
        print(f"       📧 INVOICE_SENT email should be sent")
    return True


# ═══════════════════════════════════════════════════════════════════════════════
# ACCOUNT MUTATIONS
# ═══════════════════════════════════════════════════════════════════════════════

def register_account(email=None):
    """Register a new account — triggers ACCOUNT_CONFIRMATION email."""
    if not email:
        email = f"test-{int(time.time())}@test.local"
    redirect_url = f"{STOREFRONT_URL}/{CHANNEL}/account/confirm"
    r = gql(
        """mutation ($input: AccountRegisterInput!) {
          accountRegister(input: $input) {
            user { id email }
            errors { message code field }
          }
        }""",
        variables={
            "input": {
                "email": email,
                "password": "TestPass123!",
                "channel": CHANNEL,
                "redirectUrl": redirect_url,
            }
        },
    )
    result = r["data"]["accountRegister"]
    if result.get("errors") and result["errors"]:
        print(f"  Register error: {result['errors']}")
        return False
    print(f"  [OK] Account registered: {email}")
    print(f"       📧 ACCOUNT_CONFIRMATION email sent to {email}")
    return True


def request_password_reset(email=None):
    """Request a password reset — triggers ACCOUNT_PASSWORD_RESET email."""
    if not email:
        email = RECIPIENT_EMAIL
    redirect_url = f"{STOREFRONT_URL}/{CHANNEL}/account/reset-password"
    r = gql(
        """mutation ($email: String!, $redirectUrl: String!, $channel: String!) {
          requestPasswordReset(email: $email, redirectUrl: $redirectUrl, channel: $channel) {
            errors { message code field }
          }
        }""",
        variables={
            "email": email,
            "redirectUrl": redirect_url,
            "channel": CHANNEL,
        },
    )
    result = r["data"]["requestPasswordReset"]
    if result.get("errors") and result["errors"]:
        print(f"  Password reset error: {result['errors']}")
        return False
    print(f"  [OK] Password reset requested for {email}")
    print(f"       📧 ACCOUNT_PASSWORD_RESET email sent to {email}")
    return True


def request_account_deletion(token):
    """Request account deletion — triggers ACCOUNT_DELETE email."""
    redirect_url = f"{STOREFRONT_URL}/{CHANNEL}/account/delete-confirm"
    r = gql(
        """mutation ($redirectUrl: String!, $channel: String!) {
          accountRequestDeletion(redirectUrl: $redirectUrl, channel: $channel) {
            errors { message code field }
          }
        }""",
        token,
        {"redirectUrl": redirect_url, "channel": CHANNEL},
    )
    result = r["data"]["accountRequestDeletion"]
    if result.get("errors") and result["errors"]:
        print(f"  Deletion request error: {result['errors']}")
        return False
    print(f"  [OK] Account deletion requested")
    print(f"       📧 ACCOUNT_DELETE email sent to {ADMIN_EMAIL}")
    return True


def request_email_change(token, new_email=None):
    """Request email change — triggers ACCOUNT_CHANGE_EMAIL_REQUEST email."""
    if not new_email:
        new_email = f"new-email-{int(time.time())}@test.local"
    redirect_url = f"{STOREFRONT_URL}/{CHANNEL}/account/email-confirm"
    r = gql(
        """mutation ($newEmail: String!, $password: String!, $redirectUrl: String!, $channel: String!) {
          requestEmailChange(newEmail: $newEmail, password: $password, redirectUrl: $redirectUrl, channel: $channel) {
            user { id email }
            errors { message code field }
          }
        }""",
        token,
        {
            "newEmail": new_email,
            "password": ADMIN_PASSWORD,
            "redirectUrl": redirect_url,
            "channel": CHANNEL,
        },
    )
    result = r["data"]["requestEmailChange"]
    if result.get("errors") and result["errors"]:
        print(f"  Email change error: {result['errors']}")
        return False
    print(f"  [OK] Email change requested → {new_email}")
    print(f"       📧 ACCOUNT_CHANGE_EMAIL_REQUEST email sent to {new_email}")
    return True


# ═══════════════════════════════════════════════════════════════════════════════
# ABANDONED CHECKOUT
# ═══════════════════════════════════════════════════════════════════════════════

def create_abandoned_checkout(token):
    """Create a checkout but don't complete it — Celery will send recovery email."""
    print("\n--- Finding product ---")
    variant_id, price = find_variant(token)

    print("\n--- Creating abandoned checkout ---")
    checkout = create_checkout(token, variant_id)
    if not checkout:
        return False

    print("\n--- Selecting shipping (so checkout has a total) ---")
    select_shipping(token, checkout["id"], checkout.get("shippingMethods", []))

    print(f"\n  [OK] Abandoned checkout created: {checkout['id'][:30]}...")
    print(f"       Email: {RECIPIENT_EMAIL}")
    print(f"       The Celery beat task 'check_abandoned_checkouts' runs every 30 min.")
    print(f"       📧 ABANDONED_CHECKOUT email will be sent after ~1 hour delay.")
    print(f"       (Configured in settings.ABANDONED_CHECKOUT_EMAIL_DELAYS)")
    return True


# ═══════════════════════════════════════════════════════════════════════════════
# ORDER STATUS DISPLAY
# ═══════════════════════════════════════════════════════════════════════════════

def get_order_detail(token, order_number):
    """Fetch full order details."""
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
                }
                lines {
                    id productName variantName quantity
                    totalPrice { gross { amount currency } }
                }
                fulfillments { id status trackingNumber }
            } }
        } }"""
        % order_number,
        token,
    )
    edges = r["data"]["orders"]["edges"]
    return edges[0]["node"] if edges else None


def print_order_status(order):
    """Pretty-print order status."""
    total = order["total"]["gross"]
    charged = order["totalCharged"]
    balance = order["totalBalance"]
    grants = order.get("grantedRefunds", [])

    print(f"\n  ┌─ Order #{order['number']} {'─' * 40}")
    print(f"  │ Status:       {order['status']}")
    print(f"  │ Charge:       {order['chargeStatus']}")
    print(f"  │ Total:        {total['currency']} {total['amount']}")
    print(f"  │ Charged:      {charged['currency']} {charged['amount']}")
    print(f"  │ Outstanding:  {balance['currency']} {balance['amount']}")

    if grants:
        total_refunded = sum(g["amount"]["amount"] for g in grants)
        print(f"  │")
        print(f"  │ Refunds ({len(grants)}) — Total: {total['currency']} {total_refunded:.2f}:")
        for i, g in enumerate(grants, 1):
            reason = g.get("reason") or "(no reason)"
            print(
                f"  │   {i}. {g['status']:10s} {g['amount']['amount']:>8.2f} {g['amount']['currency']}  {reason[:40]}"
            )

    fulfillments = order.get("fulfillments", [])
    if fulfillments:
        print(f"  │")
        for f in fulfillments:
            tracking = f.get("trackingNumber") or "none"
            print(f"  │ Fulfillment: {f['status']} — tracking: {tracking}")

    print(f"  └{'─' * 50}")


# ═══════════════════════════════════════════════════════════════════════════════
# SCENARIOS
# ═══════════════════════════════════════════════════════════════════════════════

def scenario_order_lifecycle(token):
    """Scenario 1: Full order lifecycle — 5 emails from 1 order.

    ORDER_CREATED → ORDER_CONFIRMED → ORDER_FULLY_PAID → ORDER_FULFILLED → ORDER_FULFILLMENT_UPDATE
    """
    print("\n" + "=" * 60)
    print("  SCENARIO 1: Full Order Lifecycle")
    print("  Emails: CREATED, CONFIRMED, FULLY_PAID, FULFILLED, FULFILLMENT_UPDATE")
    print("=" * 60)

    order = create_paid_order(token)
    if not order:
        return
    print_order_status(order)

    # Confirm
    print("\n--- Confirming order ---")
    time.sleep(2)
    confirm_order(token, order["id"])

    # Fulfill
    print("\n--- Fulfilling order ---")
    time.sleep(2)
    fulfillment = fulfill_order(token, order["id"], order["lines"])

    # Update tracking
    if fulfillment:
        print("\n--- Adding tracking number ---")
        time.sleep(2)
        update_fulfillment_tracking(token, fulfillment["id"])

    time.sleep(2)
    order = get_order_detail(token, order["number"])
    print_order_status(order)

    print(f"\n  ✓ Scenario complete — check {RECIPIENT_EMAIL} for 5 emails")


def scenario_order_cancel(token):
    """Scenario 2: Order cancellation — ORDER_CREATED + ORDER_CANCELLED."""
    print("\n" + "=" * 60)
    print("  SCENARIO 2: Order Cancellation")
    print("  Emails: CREATED, FULLY_PAID, CANCELLED")
    print("=" * 60)

    order = create_paid_order(token)
    if not order:
        return
    print_order_status(order)

    print("\n--- Cancelling order ---")
    time.sleep(2)
    cancel_order(token, order["id"])

    order = get_order_detail(token, order["number"])
    print_order_status(order)
    print(f"\n  ✓ Scenario complete — check {RECIPIENT_EMAIL} for 3 emails")


def scenario_refund_partial(token):
    """Scenario 3: Partial refund ($5)."""
    print("\n" + "=" * 60)
    print("  SCENARIO 3: Partial Refund ($5)")
    print("  Emails: CREATED, FULLY_PAID, REFUNDED (showing $5, not order total)")
    print("=" * 60)

    order = create_paid_order(token)
    if not order:
        return
    print_order_status(order)

    charged = order["totalCharged"]["amount"]
    amount = min(5.0, charged / 2)

    print(f"\n--- Issuing partial refund of ${amount} ---")
    if grant_and_send_refund(token, order, amount, reason="Partial refund — item damaged"):
        order = get_order_detail(token, order["number"])
        print_order_status(order)
    print(f"\n  ✓ Scenario complete — check {RECIPIENT_EMAIL}")


def scenario_refund_full(token):
    """Scenario 4: Full refund."""
    print("\n" + "=" * 60)
    print("  SCENARIO 4: Full Refund")
    print("  Emails: CREATED, FULLY_PAID, REFUNDED (no outstanding balance)")
    print("=" * 60)

    order = create_paid_order(token)
    if not order:
        return
    print_order_status(order)

    amount = order["totalCharged"]["amount"]

    print(f"\n--- Issuing full refund of ${amount} ---")
    if grant_and_send_refund(token, order, amount, reason="Full refund — order cancelled"):
        order = get_order_detail(token, order["number"])
        print_order_status(order)
    print(f"\n  ✓ Scenario complete — check {RECIPIENT_EMAIL}")


def scenario_refund_multiple(token):
    """Scenario 5: Two partial refunds (cumulative totals)."""
    print("\n" + "=" * 60)
    print("  SCENARIO 5: Two Partial Refunds (Cumulative)")
    print("  Emails: CREATED, FULLY_PAID, REFUNDED x2")
    print("  2nd refund email should show cumulative total = full refund")
    print("=" * 60)

    order = create_paid_order(token)
    if not order:
        return
    print_order_status(order)

    total = order["totalCharged"]["amount"]
    first_amount = round(total / 2, 2)
    second_amount = round(total - first_amount, 2)

    print(f"\n--- Refund 1 of 2: ${first_amount} ---")
    if not grant_and_send_refund(
        token, order, first_amount, reason="Partial refund #1 — wrong size"
    ):
        return
    order = get_order_detail(token, order["number"])
    print_order_status(order)

    print(f"\n--- Refund 2 of 2: ${second_amount} ---")
    if not grant_and_send_refund(
        token, order, second_amount, reason="Partial refund #2 — remaining balance"
    ):
        return
    order = get_order_detail(token, order["number"])
    print_order_status(order)
    print(f"\n  ✓ Scenario complete — check {RECIPIENT_EMAIL} for 2 refund emails")


def scenario_account_confirmation(token):
    """Scenario 6: Account registration confirmation."""
    print("\n" + "=" * 60)
    print("  SCENARIO 6: Account Confirmation")
    print(f"  Email: ACCOUNT_CONFIRMATION → {RECIPIENT_EMAIL}")
    print("=" * 60)

    register_account(email=RECIPIENT_EMAIL)
    print(f"\n  ✓ Scenario complete — check {RECIPIENT_EMAIL}")


def scenario_password_reset(token):
    """Scenario 7: Password reset request."""
    print("\n" + "=" * 60)
    print("  SCENARIO 7: Password Reset")
    print(f"  Email: ACCOUNT_PASSWORD_RESET → {RECIPIENT_EMAIL}")
    print("=" * 60)

    request_password_reset(email=RECIPIENT_EMAIL)
    print(f"\n  ✓ Scenario complete — check {RECIPIENT_EMAIL}")


def scenario_account_delete(token):
    """Scenario 8: Account deletion request."""
    print("\n" + "=" * 60)
    print("  SCENARIO 8: Account Deletion Request")
    print(f"  Email: ACCOUNT_DELETE → {ADMIN_EMAIL}")
    print("=" * 60)

    request_account_deletion(token)
    print(f"\n  ✓ Scenario complete — check {ADMIN_EMAIL}")


def scenario_email_change(token):
    """Scenario 9: Email change request."""
    print("\n" + "=" * 60)
    print("  SCENARIO 9: Email Change Request")
    print(f"  Email: ACCOUNT_CHANGE_EMAIL_REQUEST → new email")
    print("=" * 60)

    request_email_change(token, new_email=RECIPIENT_EMAIL)
    print(f"\n  ✓ Scenario complete — check {RECIPIENT_EMAIL}")


def scenario_invoice(token):
    """Scenario 10: Invoice — create order, fulfill, request invoice."""
    print("\n" + "=" * 60)
    print("  SCENARIO 10: Invoice")
    print("  Emails: CREATED, FULLY_PAID, FULFILLED, INVOICE_SENT")
    print("=" * 60)

    order = create_paid_order(token)
    if not order:
        return
    print_order_status(order)

    print("\n--- Fulfilling order (required for invoice) ---")
    time.sleep(2)
    fulfill_order(token, order["id"], order["lines"])

    print("\n--- Requesting invoice ---")
    time.sleep(2)
    request_invoice(token, order["id"])

    print(f"\n  ✓ Scenario complete — check {RECIPIENT_EMAIL} for invoice email + PDF")


def scenario_abandoned_checkout(token):
    """Scenario 11: Abandoned checkout recovery."""
    print("\n" + "=" * 60)
    print("  SCENARIO 11: Abandoned Checkout")
    print("  Email: ABANDONED_CHECKOUT (delayed — sent by Celery scheduler)")
    print("=" * 60)

    create_abandoned_checkout(token)
    print(f"\n  ✓ Checkout abandoned — recovery email will arrive in ~1 hour")


# ═══════════════════════════════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════════════════════════════

SCENARIOS = {
    "1": ("Full order lifecycle (5 emails)", scenario_order_lifecycle),
    "2": ("Order cancellation", scenario_order_cancel),
    "3": ("Partial refund ($5)", scenario_refund_partial),
    "4": ("Full refund", scenario_refund_full),
    "5": ("Multiple partial refunds", scenario_refund_multiple),
    "6": ("Account confirmation (register)", scenario_account_confirmation),
    "7": ("Password reset", scenario_password_reset),
    "8": ("Account deletion request", scenario_account_delete),
    "9": ("Email change request", scenario_email_change),
    "10": ("Invoice (order + fulfill + invoice)", scenario_invoice),
    "11": ("Abandoned checkout (delayed email)", scenario_abandoned_checkout),
}


def main():
    # Parse CLI args
    scenario_num = None
    run_all = False
    order_only = False
    for i, arg in enumerate(sys.argv[1:], 1):
        if arg == "--scenario" and i < len(sys.argv) - 1:
            scenario_num = sys.argv[i + 1]
        elif arg == "--all":
            run_all = True
        elif arg == "--order-only":
            order_only = True

    print("\n" + "=" * 60)
    print("  SMTP Email Test Suite (Production)")
    print(f"  API:       {API_URL}")
    print(f"  Channel:   {CHANNEL}")
    print(f"  Recipient: {RECIPIENT_EMAIL}")
    print(f"  Gateway:   {PAYMENT_GATEWAY}")
    print("=" * 60)

    token = get_admin_token()

    if run_all:
        for num, (_, fn) in SCENARIOS.items():
            fn(token)
            print("\n  " + "·" * 50)
        return

    if order_only:
        for num in ["1", "2", "3", "4", "5"]:
            _, fn = SCENARIOS[num]
            fn(token)
            print("\n  " + "·" * 50)
        return

    if scenario_num and scenario_num in SCENARIOS:
        _, fn = SCENARIOS[scenario_num]
        fn(token)
        return

    # Interactive menu
    while True:
        print("\n  ORDER LIFECYCLE:")
        for num in ["1", "2", "3", "4", "5"]:
            desc, _ = SCENARIOS[num]
            print(f"    {num:>2}. {desc}")

        print("\n  ACCOUNT:")
        for num in ["6", "7", "8", "9"]:
            desc, _ = SCENARIOS[num]
            print(f"    {num:>2}. {desc}")

        print("\n  SPECIAL:")
        for num in ["10", "11"]:
            desc, _ = SCENARIOS[num]
            print(f"    {num:>2}. {desc}")

        print(f"\n  BULK:")
        print(f"     a. Run ALL scenarios")
        print(f"     o. Order scenarios only (1-5)")
        print(f"     q. Quit")

        choice = input("\n  > ").strip().lower()

        if choice == "q":
            break
        elif choice == "a":
            for num, (_, fn) in SCENARIOS.items():
                fn(token)
                print("\n  " + "·" * 50)
        elif choice == "o":
            for num in ["1", "2", "3", "4", "5"]:
                _, fn = SCENARIOS[num]
                fn(token)
                print("\n  " + "·" * 50)
        elif choice in SCENARIOS:
            _, fn = SCENARIOS[choice]
            fn(token)
        else:
            print("  Invalid choice!")

    print("\n  Done!\n")


if __name__ == "__main__":
    main()
