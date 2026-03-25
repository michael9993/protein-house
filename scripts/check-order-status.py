"""
Check order payment status — quick diagnostic tool.

Usage: python scripts/check-order-status.py [order_number]
If no order number given, shows the 5 most recent orders.
"""

import json
import os
import sys
import urllib.request

API = os.environ.get("AURA_API_URL", "http://localhost:8000/graphql/")
EMAIL = os.environ.get("AURA_ADMIN_EMAIL", "admin@example.com")
PASSWORD = os.environ.get("AURA_ADMIN_PASSWORD", "")
if not PASSWORD:
    print("ERROR: Set AURA_ADMIN_PASSWORD environment variable (see infra/.env.self-hosted)")
    sys.exit(1)


def gql(query, token=None, variables=None):
    payload = {"query": query}
    if variables:
        payload["variables"] = variables
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(API, data=json.dumps(payload).encode(), headers=headers)
    resp = urllib.request.urlopen(req)
    data = json.loads(resp.read())
    if data.get("errors"):
        print(f"  GQL Error: {data['errors'][0]['message'][:120]}")
    return data


def get_token():
    r = gql(
        """mutation { tokenCreate(email: "%s", password: "%s") { token errors { message } } }"""
        % (EMAIL, PASSWORD)
    )
    return r["data"]["tokenCreate"]["token"]


ORDER_QUERY = """
query OrderByNumber($number: ID!) {
  order(id: $number) {
    id
    number
    status
    chargeStatus
    authorizeStatus
    total { gross { amount currency } }
    totalCharged { amount currency }
    totalAuthorized { amount currency }
    totalBalance { amount currency }
    grantedRefunds {
      id
      amount { amount currency }
      status
      reason
      createdAt
    }
    transactions {
      id
      pspReference
      chargedAmount { amount currency }
      refundedAmount { amount currency }
      authorizedAmount { amount currency }
      events {
        type
        amount { amount currency }
        pspReference
        message
        createdAt
      }
    }
  }
}
"""

ORDERS_LIST_QUERY = """
query RecentOrders {
  orders(first: 5, sortBy: { field: NUMBER, direction: DESC }) {
    edges {
      node {
        id
        number
        status
        chargeStatus
        authorizeStatus
        total { gross { amount currency } }
        totalCharged { amount currency }
        totalBalance { amount currency }
        grantedRefunds { id amount { amount } status reason }
      }
    }
  }
}
"""


def print_order(order):
    total = order["total"]["gross"]
    charged = order["totalCharged"]
    balance = order["totalBalance"]

    print(f"\n{'='*60}")
    print(f"Order #{order['number']}  (ID: {order['id']})")
    print(f"{'='*60}")
    print(f"  Status:           {order['status']}")
    print(f"  Charge Status:    {order['chargeStatus']}")
    print(f"  Authorize Status: {order['authorizeStatus']}")
    print(f"  Order Total:      {total['currency']} {total['amount']}")
    print(f"  Total Charged:    {charged['currency']} {charged['amount']}")
    print(f"  Outstanding:      {balance['currency']} {balance['amount']}")

    grants = order.get("grantedRefunds", [])
    if grants:
        print(f"\n  Granted Refunds ({len(grants)}):")
        for g in grants:
            print(
                f"    {g['status']:10s}  {g['amount']['amount']:>8.2f} {g['amount'].get('currency', '')}  "
                f"{g.get('reason', '')[:40]}  ({g.get('createdAt', '')[:19]})"
            )

    txns = order.get("transactions", [])
    if txns:
        for txn in txns:
            print(f"\n  Transaction: {txn['pspReference']}")
            print(f"    Charged:  {txn['chargedAmount']['amount']}")
            print(f"    Refunded: {txn['refundedAmount']['amount']}")
            print(f"    Auth:     {txn['authorizedAmount']['amount']}")
            events = txn.get("events", [])
            if events:
                print(f"    Events ({len(events)}):")
                for e in events:
                    amt = e["amount"]["amount"] if e.get("amount") else "?"
                    print(
                        f"      {e['type']:30s}  {amt:>8}  "
                        f"psp={e.get('pspReference', '-')[:20]:20s}  "
                        f"{(e.get('message') or '')[:40]}"
                    )
    print()


def main():
    token = get_token()

    if len(sys.argv) > 1:
        order_number = sys.argv[1]
        # Saleor expects the order ID, not number. Use filter instead.
        r = gql(
            """
            query { orders(filter: { numbers: ["%s"] }, first: 1) {
                edges { node {
                    id number status chargeStatus authorizeStatus
                    total { gross { amount currency } }
                    totalCharged { amount currency }
                    totalAuthorized { amount currency }
                    totalBalance { amount currency }
                    grantedRefunds { id amount { amount currency } status reason createdAt }
                    transactions {
                        id pspReference
                        chargedAmount { amount currency }
                        refundedAmount { amount currency }
                        authorizedAmount { amount currency }
                        events { type amount { amount currency } pspReference message createdAt }
                    }
                } }
            } }
            """
            % order_number,
            token,
        )
        edges = r["data"]["orders"]["edges"]
        if edges:
            print_order(edges[0]["node"])
        else:
            print(f"Order #{order_number} not found")
    else:
        r = gql(ORDERS_LIST_QUERY, token)
        edges = r["data"]["orders"]["edges"]
        print(f"\nRecent Orders ({len(edges)}):\n")
        print(f"  {'#':>4s}  {'Status':12s}  {'Charge':12s}  {'Auth':12s}  {'Total':>8s}  {'Charged':>8s}  {'Balance':>8s}  Grants")
        print(f"  {'-'*4}  {'-'*12}  {'-'*12}  {'-'*12}  {'-'*8}  {'-'*8}  {'-'*8}  {'-'*20}")
        for edge in edges:
            o = edge["node"]
            grants = o.get("grantedRefunds", [])
            grant_str = ", ".join(
                f"{g['amount']['amount']}({g['status']})" for g in grants
            ) or "none"
            print(
                f"  {o['number']:>4s}  {o['status']:12s}  {o['chargeStatus']:12s}  "
                f"{o['authorizeStatus']:12s}  {o['total']['gross']['amount']:>8.2f}  "
                f"{o['totalCharged']['amount']:>8.2f}  {o['totalBalance']['amount']:>8.2f}  "
                f"{grant_str}"
            )
        print(f"\nUse: python scripts/check-order-status.py <number> for details")


if __name__ == "__main__":
    main()
