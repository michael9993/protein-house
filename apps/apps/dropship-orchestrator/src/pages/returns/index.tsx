import { useAppBridge } from "@saleor/app-sdk/app-bridge";
import { useState } from "react";

import { trpcClient } from "@/modules/trpc/trpc-client";
import { NavBar } from "@/components/ui/NavBar";

type StatusFilter = "all" | "requested" | "approved" | "shipped_back" | "refunded" | "rejected";

const STATUS_LABELS: Record<string, string> = {
  requested: "Requested",
  approved: "Approved",
  shipped_back: "Shipped Back",
  refunded: "Refunded",
  rejected: "Rejected",
};

function returnStatusBadgeCls(status: string): string {
  switch (status) {
    case "refunded":
      return "bg-green-50 text-green-800";
    case "approved":
      return "bg-blue-50 text-blue-800";
    case "shipped_back":
      return "bg-indigo-50 text-indigo-800";
    case "rejected":
      return "bg-red-50 text-red-800";
    case "requested":
      return "bg-yellow-50 text-yellow-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

// ---------------------------------------------------------------------------
// Create Return from Order Lookup
// ---------------------------------------------------------------------------

function CreateFromOrderForm({ onSuccess }: { onSuccess: () => void }) {
  const [orderId, setOrderId] = useState("");
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [fetched, setFetched] = useState(false);

  const lookupQuery = trpcClient.returns.lookupOrder.useQuery(
    { orderId: orderId.trim() },
    { enabled: false },
  );

  const createMutation = trpcClient.returns.createFromOrder.useMutation({
    onSuccess: () => {
      onSuccess();
      setMessage({ type: "success", text: "Return request created" });
      setOrderId("");
      setReason("");
      setFetched(false);
      setTimeout(() => setMessage(null), 3000);
    },
    onError: (err) => {
      setMessage({ type: "error", text: err.message });
    },
  });

  const orderData = lookupQuery.data;

  async function handleFetch() {
    if (!orderId.trim()) return;
    setMessage(null);
    const result = await lookupQuery.refetch();
    if (result.error) {
      setMessage({ type: "error", text: result.error.message });
      setFetched(false);
    } else {
      setFetched(true);
      if (result.data?.allowedReasons?.length && !reason) {
        setReason(result.data.allowedReasons[0]);
      }
    }
  }

  return (
    <div className="p-4 rounded-lg border border-border flex flex-col gap-3">
      <h2 className="text-sm font-semibold text-text-primary">Create Return from Order</h2>

      {/* Order ID input + Fetch */}
      <div className="flex gap-2 items-end">
        <div className="flex-1">
          <span className="text-xs text-text-muted block mb-1">Saleor Order ID</span>
          <input
            className="w-full px-2.5 py-1.5 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-brand/20"
            value={orderId}
            onChange={(e) => { setOrderId(e.target.value); setFetched(false); }}
            placeholder="T3JkZXI6..."
            onKeyDown={(e) => { if (e.key === "Enter") handleFetch(); }}
          />
        </div>
        <button
          className="px-2.5 py-1.5 text-sm font-medium border border-border rounded-md hover:bg-gray-50 disabled:opacity-50 transition-colors"
          disabled={!orderId.trim() || lookupQuery.isFetching}
          onClick={handleFetch}
        >
          {lookupQuery.isFetching ? "Fetching..." : "Fetch Order"}
        </button>
      </div>

      {/* Order details */}
      {fetched && orderData && (
        <div className="p-3 rounded-lg bg-gray-50 flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <span className="font-semibold text-sm">Order #{orderData.orderNumber}</span>
            <div className="flex gap-2 items-center">
              <span className="text-xs text-text-muted">{orderData.supplier.toUpperCase()}</span>
              {orderData.windowExpired ? (
                <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold bg-red-50 text-red-800">
                  Window expired
                </span>
              ) : orderData.daysRemaining !== null ? (
                <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold bg-green-50 text-green-800">
                  {orderData.daysRemaining} days remaining
                </span>
              ) : null}
            </div>
          </div>
          <span className="text-xs text-text-muted">{orderData.customerEmail}</span>
          {orderData.total && (
            <span className="text-xs">
              Total: {orderData.total.currency} {orderData.total.amount.toFixed(2)}
            </span>
          )}

          {/* Lines */}
          <div className="flex flex-col gap-1 mt-1">
            {orderData.lines.map((line) => (
              <div key={line.id} className="flex justify-between text-xs">
                <span>{line.productName}{line.variantName ? ` (${line.variantName})` : ""}</span>
                <span className="text-text-muted">x{line.quantity}</span>
              </div>
            ))}
          </div>

          {/* Reason */}
          <div className="mt-2">
            <span className="text-xs text-text-muted block mb-1">Reason</span>
            {orderData.allowedReasons.length > 0 ? (
              <select
                className="w-full px-2.5 py-1.5 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-brand/20"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              >
                {orderData.allowedReasons.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            ) : (
              <input
                className="w-full px-2.5 py-1.5 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-brand/20"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Enter reason for return"
              />
            )}
          </div>

          <button
            className="px-2.5 py-1 text-sm font-medium text-white bg-brand rounded-md hover:bg-brand-light disabled:opacity-50 transition-colors self-start mt-1"
            disabled={
              !reason.trim() ||
              orderData.windowExpired ||
              createMutation.isLoading
            }
            onClick={() =>
              createMutation.mutate({
                orderId: orderId.trim(),
                reason: reason.trim(),
              })
            }
          >
            {createMutation.isLoading ? "Creating..." : "Submit Return"}
          </button>
        </div>
      )}

      {message && (
        <div className={`p-3 rounded-lg ${message.type === "success" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}>
          <p className="text-sm">{message.text}</p>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Manual Entry Form (collapsible)
// ---------------------------------------------------------------------------

function ManualCreateForm({ onSuccess }: { onSuccess: () => void }) {
  const createMutation = trpcClient.returns.create.useMutation({
    onSuccess: () => {
      onSuccess();
      setMessage({ type: "success", text: "Return request created" });
      setOrderId(""); setOrderNumber(""); setCustomerEmail("");
      setReason(""); setSupplier("cj"); setItemName(""); setItemQty(1);
      setTimeout(() => setMessage(null), 3000);
    },
    onError: (err) => {
      setMessage({ type: "error", text: err.message });
    },
  });

  const [orderId, setOrderId] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [reason, setReason] = useState("");
  const [supplier, setSupplier] = useState("cj");
  const [itemName, setItemName] = useState("");
  const [itemQty, setItemQty] = useState(1);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-lg border border-border">
      <button
        className="w-full p-3 flex justify-between items-center text-sm text-text-muted hover:text-text-primary transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <span>Advanced: Manual Entry</span>
        <span>{expanded ? "-" : "+"}</span>
      </button>

      {expanded && (
        <div className="px-4 pb-4 flex flex-col gap-3">
          <div className="flex gap-3 flex-wrap">
            <div className="w-[140px]">
              <span className="text-xs text-text-muted block">Order ID</span>
              <input className="w-full px-2.5 py-1.5 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-brand/20" value={orderId} onChange={(e) => setOrderId(e.target.value)} placeholder="T3JkZXI6..." />
            </div>
            <div className="w-[100px]">
              <span className="text-xs text-text-muted block">Order #</span>
              <input className="w-full px-2.5 py-1.5 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-brand/20" value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)} placeholder="1234" />
            </div>
            <div className="w-[180px]">
              <span className="text-xs text-text-muted block">Customer Email</span>
              <input className="w-full px-2.5 py-1.5 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-brand/20" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} placeholder="email@example.com" />
            </div>
            <div className="w-[100px]">
              <span className="text-xs text-text-muted block">Supplier</span>
              <select value={supplier} onChange={(e) => setSupplier(e.target.value)} className="w-full px-2.5 py-1.5 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-brand/20">
                <option value="cj">CJ</option>
                <option value="aliexpress">AliExpress</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3 flex-wrap">
            <div className="w-[200px]">
              <span className="text-xs text-text-muted block">Product Name</span>
              <input className="w-full px-2.5 py-1.5 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-brand/20" value={itemName} onChange={(e) => setItemName(e.target.value)} placeholder="Product name" />
            </div>
            <div className="w-[80px]">
              <span className="text-xs text-text-muted block">Qty</span>
              <input type="number" min="1" className="w-full px-2.5 py-1.5 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-brand/20" value={String(itemQty)} onChange={(e) => setItemQty(parseInt(e.target.value) || 1)} />
            </div>
            <div className="flex-1">
              <span className="text-xs text-text-muted block">Reason</span>
              <input className="w-full px-2.5 py-1.5 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-brand/20" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Defective, wrong size, etc." />
            </div>
          </div>
          {message && (
            <div className={`p-3 rounded-lg ${message.type === "success" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}>
              <p className="text-sm">{message.text}</p>
            </div>
          )}
          <button
            className="px-2.5 py-1 text-sm font-medium text-white bg-brand rounded-md hover:bg-brand-light disabled:opacity-50 transition-colors self-start"
            disabled={!orderId.trim() || !orderNumber.trim() || !reason.trim() || !itemName.trim() || createMutation.isLoading}
            onClick={() =>
              createMutation.mutate({
                orderId: orderId.trim(), orderNumber: orderNumber.trim(),
                customerEmail: customerEmail.trim(), reason: reason.trim(),
                supplier, items: [{ productName: itemName.trim(), quantity: itemQty }],
              })
            }
          >
            {createMutation.isLoading ? "Creating..." : "Create Return"}
          </button>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Timeline Display
// ---------------------------------------------------------------------------

function ReturnTimeline({ timeline }: { timeline: Array<{ action: string; at: string; by?: string }> }) {
  if (!timeline || timeline.length === 0) return null;

  return (
    <div className="flex flex-col gap-1 mt-2 ps-3 border-s-2 border-gray-200">
      {timeline.map((entry, idx) => (
        <div key={idx} className="flex gap-2 items-start text-xs">
          <span className="text-text-muted whitespace-nowrap">
            {new Date(entry.at).toLocaleString()}
          </span>
          <span>
            {entry.action}
            {entry.by && <span className="text-text-muted"> ({entry.by})</span>}
          </span>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Status Transition with Notes
// ---------------------------------------------------------------------------

function StatusAction({
  label,
  returnId,
  status,
  onDone,
  showRefundInput,
  defaultRefundAmount,
}: {
  label: string;
  returnId: string;
  status: string;
  onDone: () => void;
  showRefundInput?: boolean;
  defaultRefundAmount?: number;
}) {
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState("");
  const [refundAmount, setRefundAmount] = useState(defaultRefundAmount ?? 0);

  const updateMutation = trpcClient.returns.updateStatus.useMutation({
    onSuccess: () => {
      onDone();
      setShowNotes(false);
      setNotes("");
    },
  });

  if (!showNotes) {
    return (
      <button
        className="px-2.5 py-1 text-sm font-medium text-white bg-brand rounded-md hover:bg-brand-light disabled:opacity-50 transition-colors"
        disabled={updateMutation.isLoading}
        onClick={() => setShowNotes(true)}
      >
        {label}
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-1.5 p-2 rounded-lg border border-border bg-gray-50">
      <input
        className="w-full px-2 py-1 text-xs border border-border rounded-md"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Optional notes..."
      />
      {showRefundInput && (
        <div className="flex gap-2 items-center">
          <span className="text-xs text-text-muted">Refund amount:</span>
          <input
            type="number"
            min="0"
            step="0.01"
            className="w-24 px-2 py-1 text-xs border border-border rounded-md"
            value={String(refundAmount)}
            onChange={(e) => setRefundAmount(Number(e.target.value))}
          />
        </div>
      )}
      <div className="flex gap-2">
        <button
          className="px-2 py-0.5 text-xs font-medium text-white bg-brand rounded-md hover:bg-brand-light disabled:opacity-50 transition-colors"
          disabled={updateMutation.isLoading}
          onClick={() =>
            updateMutation.mutate({
              id: returnId,
              status: status as any,
              notes: notes || undefined,
              ...(showRefundInput ? { refundAmount } : {}),
            })
          }
        >
          {updateMutation.isLoading ? "..." : "Confirm"}
        </button>
        <button
          className="px-2 py-0.5 text-xs text-text-muted hover:text-text-primary transition-colors"
          onClick={() => setShowNotes(false)}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Return Window Badge
// ---------------------------------------------------------------------------

function ReturnWindowBadge({ ret }: { ret: any }) {
  // Use order creation date (not return creation date) for window calculation
  const refDate = ret.orderCreated ?? ret.createdAt;
  if (!ret.returnWindow || !refDate) return null;

  const orderDate = new Date(refDate);
  const daysSince = (Date.now() - orderDate.getTime()) / (1000 * 60 * 60 * 24);
  const daysRemaining = Math.max(0, Math.ceil(ret.returnWindow - daysSince));
  const expired = daysSince > ret.returnWindow;

  if (ret.status === "refunded" || ret.status === "rejected") return null;

  return expired ? (
    <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold bg-red-50 text-red-800">
      Window expired
    </span>
  ) : (
    <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold bg-green-50 text-green-800">
      {daysRemaining}d remaining
    </span>
  );
}

// ---------------------------------------------------------------------------
// Returns List
// ---------------------------------------------------------------------------

function ReturnsContent() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [showCreateForm, setShowCreateForm] = useState(false);

  const queryInput = statusFilter === "all" ? undefined : { status: statusFilter as any };
  const { data, isLoading, error, refetch } = trpcClient.returns.list.useQuery(queryInput);

  const deleteMutation = trpcClient.returns.delete.useMutation({
    onSuccess: () => refetch(),
  });

  if (isLoading) return <p className="text-sm text-text-primary">Loading returns...</p>;
  if (error) return <p className="text-sm text-red-600">Error: {error.message}</p>;

  const returns = data?.returns ?? [];
  const counts = data?.counts ?? { total: 0, requested: 0, approved: 0, shipped_back: 0, refunded: 0, rejected: 0 };

  const statusFilters: Array<{ value: StatusFilter; label: string; count: number }> = [
    { value: "all", label: "All", count: counts.total },
    { value: "requested", label: "Requested", count: counts.requested },
    { value: "approved", label: "Approved", count: counts.approved },
    { value: "shipped_back", label: "Shipped Back", count: counts.shipped_back },
    { value: "refunded", label: "Refunded", count: counts.refunded },
    { value: "rejected", label: "Rejected", count: counts.rejected },
  ];

  return (
    <div className="flex flex-col gap-6">
      <NavBar />

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">Returns</h1>
          <p className="text-sm text-text-muted">Manage return requests from customers</p>
        </div>
        <button
          className={
            showCreateForm
              ? "px-2.5 py-1 text-sm font-medium border border-border rounded-md hover:bg-gray-50 transition-colors"
              : "px-2.5 py-1 text-sm font-medium text-white bg-brand rounded-md hover:bg-brand-light transition-colors"
          }
          onClick={() => setShowCreateForm(!showCreateForm)}
        >
          {showCreateForm ? "Cancel" : "+ New Return"}
        </button>
      </div>

      {showCreateForm && (
        <div className="flex flex-col gap-3">
          <CreateFromOrderForm onSuccess={() => { refetch(); setShowCreateForm(false); }} />
          <ManualCreateForm onSuccess={() => { refetch(); setShowCreateForm(false); }} />
        </div>
      )}

      {/* Status filter tabs */}
      <div className="flex gap-1 flex-wrap">
        {statusFilters.map((f) => (
          <button
            key={f.value}
            className={
              statusFilter === f.value
                ? "px-2.5 py-1 text-sm font-medium text-white bg-brand rounded-md hover:bg-brand-light transition-colors"
                : "px-2.5 py-1 text-sm font-medium text-text-muted hover:text-text-primary transition-colors"
            }
            onClick={() => setStatusFilter(f.value)}
          >
            {f.label} ({f.count})
          </button>
        ))}
      </div>

      {/* Returns list */}
      {returns.length === 0 ? (
        <div className="p-6 rounded-lg border border-dashed border-gray-300 flex justify-center">
          <p className="text-sm text-text-muted">No return requests found.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {returns.map((ret) => (
            <div key={ret.id} className="p-4 rounded-lg border border-border flex flex-col gap-2">
              {/* Header row */}
              <div className="flex justify-between items-center flex-wrap gap-2">
                <div className="flex gap-3 items-center">
                  <span className="font-semibold">Order #{ret.orderNumber}</span>
                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${returnStatusBadgeCls(ret.status)}`}>
                    {STATUS_LABELS[ret.status] ?? ret.status}
                  </span>
                  <span className="text-xs text-text-muted">{ret.supplier.toUpperCase()}</span>
                  <ReturnWindowBadge ret={ret} />
                </div>
                <span className="text-xs text-text-muted">{new Date(ret.createdAt).toLocaleDateString()}</span>
              </div>

              {/* Items */}
              <div className="flex gap-2 flex-wrap">
                {ret.items.map((item, idx) => (
                  <span key={idx} className="text-xs">
                    {item.productName} x{item.quantity}
                    {item.variantName ? ` (${item.variantName})` : ""}
                  </span>
                ))}
              </div>

              {/* Reason + Notes + Refund info */}
              <span className="text-xs text-text-muted">Reason: {ret.reason}</span>
              {ret.notes && <span className="text-xs text-text-muted">Notes: {ret.notes}</span>}
              {ret.refundAmount != null && (
                <span className="text-xs text-text-muted">
                  Refund: {ret.refundCurrency ?? ""} {ret.refundAmount.toFixed(2)}
                  {ret.saleorRefundId && ` (Saleor: ${ret.saleorRefundId})`}
                </span>
              )}
              {ret.supplierOrderId && (
                <span className="text-xs text-text-muted">
                  Supplier Order: {ret.supplierOrderId}
                </span>
              )}

              {/* Timeline */}
              <ReturnTimeline timeline={ret.timeline ?? []} />

              {/* Actions */}
              <div className="flex gap-2 flex-wrap mt-1">
                {ret.status === "requested" && (
                  <>
                    <StatusAction label="Approve" returnId={ret.id} status="approved" onDone={refetch} />
                    <StatusAction label="Reject" returnId={ret.id} status="rejected" onDone={refetch} />
                  </>
                )}
                {ret.status === "approved" && (
                  <StatusAction label="Mark Shipped Back" returnId={ret.id} status="shipped_back" onDone={refetch} />
                )}
                {ret.status === "shipped_back" && (
                  <StatusAction
                    label="Mark Refunded"
                    returnId={ret.id}
                    status="refunded"
                    onDone={refetch}
                    showRefundInput
                    defaultRefundAmount={ret.refundAmount}
                  />
                )}
                <button
                  className="px-2.5 py-1 text-sm font-medium text-text-muted hover:text-text-primary disabled:opacity-50 transition-colors"
                  disabled={deleteMutation.isLoading}
                  onClick={() => {
                    if (confirm(`Delete return request for Order #${ret.orderNumber}?`)) {
                      deleteMutation.mutate({ id: ret.id });
                    }
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ReturnsPage() {
  const { appBridgeState } = useAppBridge();

  if (!appBridgeState?.ready) {
    return (
      <div className="p-8">
        <p className="text-sm text-text-primary">Connecting to Saleor Dashboard...</p>
      </div>
    );
  }

  return <ReturnsContent />;
}
