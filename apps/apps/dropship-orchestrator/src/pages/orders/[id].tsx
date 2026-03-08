import { useAppBridge } from "@saleor/app-sdk/app-bridge";
import { useRouter } from "next/router";

import { trpcClient } from "@/modules/trpc/trpc-client";
import { NavBar } from "@/components/ui/NavBar";

function statusBadgeCls(status: string): string {
  switch (status) {
    case "delivered":
    case "shipped":
    case "FULFILLED":
      return "bg-green-50 text-green-800";
    case "failed":
    case "cancelled":
    case "supplier_cancelled":
    case "CANCELED":
      return "bg-red-50 text-red-800";
    case "exception":
    case "pending":
    case "UNCONFIRMED":
      return "bg-yellow-50 text-yellow-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

function returnStatusBadgeClsLocal(status: string): string {
  switch (status) {
    case "refunded": return "bg-green-50 text-green-800";
    case "approved": return "bg-blue-50 text-blue-800";
    case "shipped_back": return "bg-indigo-50 text-indigo-800";
    case "rejected": return "bg-red-50 text-red-800";
    case "requested": return "bg-yellow-50 text-yellow-800";
    default: return "bg-gray-100 text-gray-800";
  }
}

const RETURN_STATUS_LABELS: Record<string, string> = {
  requested: "Requested",
  approved: "Approved",
  shipped_back: "Shipped Back",
  refunded: "Refunded",
  rejected: "Rejected",
};

function OrderReturnsSection({ orderId, orderNumber }: { orderId: string; orderNumber: string }) {
  const router = useRouter();
  const { data } = trpcClient.returns.list.useQuery(undefined);

  const returns = (data?.returns ?? []).filter((r) => r.orderId === orderId);

  if (returns.length === 0) {
    return (
      <div className="p-5 rounded-lg border border-border">
        <div className="flex justify-between items-center">
          <h2 className="text-base font-semibold text-text-primary">Returns</h2>
          <button
            className="px-2.5 py-1 text-sm font-medium text-white bg-brand rounded-md hover:bg-brand-light transition-colors"
            onClick={() => router.push("/returns")}
          >
            Create Return
          </button>
        </div>
        <p className="text-sm text-text-muted mt-2">No return requests for this order.</p>
      </div>
    );
  }

  return (
    <div className="p-5 rounded-lg border border-border">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-base font-semibold text-text-primary">Returns ({returns.length})</h2>
        <button
          className="px-2.5 py-1 text-sm font-medium border border-border rounded-md hover:bg-gray-50 transition-colors"
          onClick={() => router.push("/returns")}
        >
          View All Returns
        </button>
      </div>
      <div className="flex flex-col gap-2">
        {returns.map((ret) => (
          <div key={ret.id} className="p-3 rounded-lg border border-border flex flex-col gap-1">
            <div className="flex justify-between items-center">
              <div className="flex gap-2 items-center">
                <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${returnStatusBadgeClsLocal(ret.status)}`}>
                  {RETURN_STATUS_LABELS[ret.status] ?? ret.status}
                </span>
                <span className="text-xs text-text-muted">{ret.supplier.toUpperCase()}</span>
              </div>
              <span className="text-xs text-text-muted">{new Date(ret.createdAt).toLocaleDateString()}</span>
            </div>
            <span className="text-xs text-text-muted">Reason: {ret.reason}</span>
            <div className="flex gap-2 flex-wrap">
              {ret.items.map((item, idx) => (
                <span key={idx} className="text-xs">
                  {item.productName} x{item.quantity}
                </span>
              ))}
            </div>
            {(ret.timeline ?? []).length > 0 && (
              <div className="flex flex-col gap-0.5 mt-1 ps-2 border-s-2 border-gray-200">
                {ret.timeline.slice(-3).map((entry, idx) => (
                  <span key={idx} className="text-xs text-text-muted">
                    {new Date(entry.at).toLocaleString()} — {entry.action}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function OrderDetail() {
  const router = useRouter();
  const orderId = router.query.id as string;
  const { data, isLoading, error } = trpcClient.orders.getDetail.useQuery(
    { orderId },
    { enabled: !!orderId },
  );

  if (isLoading) {
    return (
      <div className="p-8">
        <h1 className="text-xl font-semibold text-text-primary">Loading order...</h1>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-xl font-semibold text-red-600">Error loading order</h1>
        <p className="text-sm text-text-primary">{error.message}</p>
      </div>
    );
  }

  if (!data) return null;

  const order = data;
  const dropship = order.dropship;

  return (
    <div className="flex flex-col gap-6">
      <NavBar />

      {/* Back button */}
      <div>
        <button
          className="text-sm text-text-muted hover:text-text-primary transition-colors"
          onClick={() => router.push("/orders")}
        >
          &larr; Back to Orders
        </button>
      </div>

      {/* Order header */}
      <div className="flex justify-between items-start">
        <div className="flex gap-3 items-center">
          <h1 className="text-xl font-semibold text-text-primary">Order #{order.number}</h1>
          <span className={`inline-block px-2 py-1 rounded-lg text-xs ${statusBadgeCls(order.status)}`}>
            {order.status}
          </span>
          {dropship && (
            <span className={`inline-block px-2 py-1 rounded-lg text-xs ${statusBadgeCls(dropship.status)}`}>
              {dropship.status.replace("_", " ").toUpperCase()}
            </span>
          )}
        </div>
        <span className="text-sm text-text-muted">
          Created: {new Date(order.created).toLocaleString()}
        </span>
      </div>

      {/* Dropship info + Shipping address */}
      <div className="grid gap-4" style={{ gridTemplateColumns: "1fr 1fr" }}>
        {/* Dropship Info */}
        {dropship && (
          <div className="p-5 rounded-lg border border-border">
            <h2 className="text-base font-semibold text-text-primary mb-3">Dropship Info</h2>
            <div className="flex flex-col gap-2">
              <div className="flex justify-between">
                <span className="text-sm text-text-muted">Supplier</span>
                <span className="text-sm font-medium">
                  {dropship.supplier === "aliexpress" ? "AliExpress" : dropship.supplier === "cj" ? "CJ Dropshipping" : dropship.supplier || "--"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-text-muted">Supplier Order ID</span>
                <span className="text-sm font-medium">{dropship.supplierOrderId || "--"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-text-muted">Tracking Number</span>
                <span className="text-sm font-medium">{dropship.trackingNumber || "--"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-text-muted">Supplier Cost</span>
                <span className="text-sm font-medium">
                  {dropship.cost != null ? `$${dropship.cost.toFixed(2)}` : "--"}
                </span>
              </div>
              {dropship.forwardedAt && (
                <div className="flex justify-between">
                  <span className="text-sm text-text-muted">Forwarded</span>
                  <span className="text-sm">{new Date(dropship.forwardedAt).toLocaleString()}</span>
                </div>
              )}
              {dropship.shippedAt && (
                <div className="flex justify-between">
                  <span className="text-sm text-text-muted">Shipped</span>
                  <span className="text-sm">{new Date(dropship.shippedAt).toLocaleString()}</span>
                </div>
              )}
              {dropship.cancelledAt && (
                <div className="flex justify-between">
                  <span className="text-sm text-text-muted">Cancelled</span>
                  <span className="text-sm">{new Date(dropship.cancelledAt).toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Shipping Address */}
        {order.shippingAddress && (
          <div className="p-5 rounded-lg border border-border">
            <h2 className="text-base font-semibold text-text-primary mb-3">Shipping Address</h2>
            <div className="flex flex-col gap-1 text-sm">
              <span className="font-medium">
                {order.shippingAddress.firstName} {order.shippingAddress.lastName}
              </span>
              <span>{order.shippingAddress.streetAddress1}</span>
              {order.shippingAddress.streetAddress2 && (
                <span>{order.shippingAddress.streetAddress2}</span>
              )}
              <span>
                {order.shippingAddress.city}
                {order.shippingAddress.postalCode && `, ${order.shippingAddress.postalCode}`}
              </span>
              <span>{order.shippingAddress.country?.country}</span>
              {order.shippingAddress.phone && (
                <span className="text-text-muted">{order.shippingAddress.phone}</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Order Total */}
      <div className="flex justify-end">
        <div className="p-4 rounded-lg border border-border">
          <span className="text-sm text-text-muted">Order Total: </span>
          <span className="text-base font-semibold">
            {order.total.gross.currency} {order.total.gross.amount.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Order Lines */}
      <div className="p-5 rounded-lg border border-border">
        <h2 className="text-base font-semibold text-text-primary mb-3">Order Lines</h2>
        <div className="flex flex-col gap-1">
          {/* Header */}
          <div
            className="grid gap-2 px-4 py-2 bg-gray-50 rounded-lg"
            style={{ gridTemplateColumns: "1fr 120px 100px 80px 100px 100px" }}
          >
            <span className="text-xs text-text-muted">Product</span>
            <span className="text-xs text-text-muted">Variant</span>
            <span className="text-xs text-text-muted">SKU</span>
            <span className="text-xs text-text-muted">Qty</span>
            <span className="text-xs text-text-muted">Unit Price</span>
            <span className="text-xs text-text-muted">Total</span>
          </div>

          {/* Rows */}
          {order.lines.map((line: any) => (
            <div
              key={line.id}
              className="grid gap-2 px-4 py-3 border border-border rounded-lg items-center"
              style={{ gridTemplateColumns: "1fr 120px 100px 80px 100px 100px" }}
            >
              <span className="text-sm font-medium">{line.productName}</span>
              <span className="text-xs text-text-muted">{line.variantName || "--"}</span>
              <span className="text-xs text-text-muted">{line.productSku || "--"}</span>
              <span className="text-sm">{line.quantity}</span>
              <span className="text-xs">
                {line.unitPrice.gross.currency} {line.unitPrice.gross.amount.toFixed(2)}
              </span>
              <span className="text-xs font-medium">
                {line.totalPrice.gross.currency} {line.totalPrice.gross.amount.toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Returns */}
      <OrderReturnsSection orderId={orderId} orderNumber={order.number} />

      {/* Fulfillments */}
      {order.fulfillments && order.fulfillments.length > 0 && (
        <div className="p-5 rounded-lg border border-border">
          <h2 className="text-base font-semibold text-text-primary mb-3">Fulfillments</h2>
          <div className="flex flex-col gap-3">
            {order.fulfillments.map((ful: any) => (
              <div key={ful.id} className="p-4 rounded-lg border border-border">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex gap-2 items-center">
                    <span className={`inline-block px-2 py-1 rounded-lg text-xs ${statusBadgeCls(ful.status)}`}>
                      {ful.status}
                    </span>
                    {ful.trackingNumber && (
                      <span className="text-xs text-text-muted">Tracking: {ful.trackingNumber}</span>
                    )}
                  </div>
                  <span className="text-xs text-text-muted">
                    {new Date(ful.created).toLocaleString()}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  {ful.lines.map((fl: any) => (
                    <div key={fl.id} className="flex justify-between text-sm">
                      <span>{fl.orderLine?.productName}</span>
                      <span className="text-text-muted">x{fl.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function OrderDetailPage() {
  const { appBridgeState } = useAppBridge();

  if (!appBridgeState?.ready) {
    return (
      <div className="p-8">
        <p className="text-sm text-text-primary">Connecting to Saleor Dashboard...</p>
      </div>
    );
  }

  return <OrderDetail />;
}
