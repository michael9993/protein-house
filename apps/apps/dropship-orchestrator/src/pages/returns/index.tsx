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
// Create Return Form
// ---------------------------------------------------------------------------

function CreateReturnForm({ onSuccess }: { onSuccess: () => void }) {
  const createMutation = trpcClient.returns.create.useMutation({
    onSuccess: () => {
      onSuccess();
      setMessage({ type: "success", text: "Return request created" });
      // Reset form
      setOrderId("");
      setOrderNumber("");
      setCustomerEmail("");
      setReason("");
      setSupplier("cj");
      setItemName("");
      setItemQty(1);
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

  return (
    <div className="p-4 rounded-lg border border-border flex flex-col gap-3">
      <h2 className="text-sm font-semibold text-text-primary">Create Return Request</h2>

      <div className="flex gap-3 flex-wrap">
        <div className="w-[140px]">
          <span className="text-xs text-text-muted block">Order ID</span>
          <input
            className="w-full px-2.5 py-1.5 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-brand/20"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            placeholder="T3JkZXI6..."
          />
        </div>
        <div className="w-[100px]">
          <span className="text-xs text-text-muted block">Order #</span>
          <input
            className="w-full px-2.5 py-1.5 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-brand/20"
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            placeholder="1234"
          />
        </div>
        <div className="w-[180px]">
          <span className="text-xs text-text-muted block">Customer Email</span>
          <input
            className="w-full px-2.5 py-1.5 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-brand/20"
            value={customerEmail}
            onChange={(e) => setCustomerEmail(e.target.value)}
            placeholder="email@example.com"
          />
        </div>
        <div className="w-[100px]">
          <span className="text-xs text-text-muted block">Supplier</span>
          <select
            value={supplier}
            onChange={(e) => setSupplier(e.target.value)}
            className="w-full px-2.5 py-1.5 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-brand/20"
          >
            <option value="cj">CJ</option>
            <option value="aliexpress">AliExpress</option>
          </select>
        </div>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="w-[200px]">
          <span className="text-xs text-text-muted block">Product Name</span>
          <input
            className="w-full px-2.5 py-1.5 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-brand/20"
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            placeholder="Product name"
          />
        </div>
        <div className="w-[80px]">
          <span className="text-xs text-text-muted block">Qty</span>
          <input
            type="number"
            min="1"
            className="w-full px-2.5 py-1.5 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-brand/20"
            value={String(itemQty)}
            onChange={(e) => setItemQty(parseInt(e.target.value) || 1)}
          />
        </div>
        <div className="flex-1">
          <span className="text-xs text-text-muted block">Reason</span>
          <input
            className="w-full px-2.5 py-1.5 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-brand/20"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Defective, wrong size, etc."
          />
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
            orderId: orderId.trim(),
            orderNumber: orderNumber.trim(),
            customerEmail: customerEmail.trim(),
            reason: reason.trim(),
            supplier,
            items: [{ productName: itemName.trim(), quantity: itemQty }],
          })
        }
      >
        {createMutation.isLoading ? "Creating..." : "Create Return"}
      </button>
    </div>
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

  const updateStatusMutation = trpcClient.returns.updateStatus.useMutation({
    onSuccess: () => refetch(),
  });

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
              ? "px-2.5 py-1 text-sm font-medium border border-border rounded-md hover:bg-gray-50 disabled:opacity-50 transition-colors"
              : "px-2.5 py-1 text-sm font-medium text-white bg-brand rounded-md hover:bg-brand-light disabled:opacity-50 transition-colors"
          }
          onClick={() => setShowCreateForm(!showCreateForm)}
        >
          {showCreateForm ? "Cancel" : "+ New Return"}
        </button>
      </div>

      {showCreateForm && (
        <CreateReturnForm onSuccess={() => { refetch(); setShowCreateForm(false); }} />
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
            <div
              key={ret.id}
              className="p-4 rounded-lg border border-border flex flex-col gap-2"
            >
              {/* Header row */}
              <div className="flex justify-between items-center flex-wrap gap-2">
                <div className="flex gap-3 items-center">
                  <span className="font-semibold">Order #{ret.orderNumber}</span>
                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${returnStatusBadgeCls(ret.status)}`}>
                    {STATUS_LABELS[ret.status] ?? ret.status}
                  </span>
                  <span className="text-xs text-text-muted">
                    {ret.supplier.toUpperCase()}
                  </span>
                </div>
                <span className="text-xs text-text-muted">
                  {new Date(ret.createdAt).toLocaleDateString()}
                </span>
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

              {/* Reason */}
              <span className="text-xs text-text-muted">
                Reason: {ret.reason}
              </span>

              {/* Notes */}
              {ret.notes && (
                <span className="text-xs text-text-muted">
                  Notes: {ret.notes}
                </span>
              )}

              {/* Actions */}
              <div className="flex gap-2 flex-wrap">
                {ret.status === "requested" && (
                  <>
                    <button
                      className="px-2.5 py-1 text-sm font-medium text-white bg-brand rounded-md hover:bg-brand-light disabled:opacity-50 transition-colors"
                      disabled={updateStatusMutation.isLoading}
                      onClick={() => updateStatusMutation.mutate({ id: ret.id, status: "approved" })}
                    >
                      Approve
                    </button>
                    <button
                      className="px-2.5 py-1 text-sm font-medium border border-border rounded-md hover:bg-gray-50 disabled:opacity-50 transition-colors"
                      disabled={updateStatusMutation.isLoading}
                      onClick={() => updateStatusMutation.mutate({ id: ret.id, status: "rejected", notes: "Rejected by admin" })}
                    >
                      Reject
                    </button>
                  </>
                )}
                {ret.status === "approved" && (
                  <button
                    className="px-2.5 py-1 text-sm font-medium text-white bg-brand rounded-md hover:bg-brand-light disabled:opacity-50 transition-colors"
                    disabled={updateStatusMutation.isLoading}
                    onClick={() => updateStatusMutation.mutate({ id: ret.id, status: "shipped_back" })}
                  >
                    Mark Shipped Back
                  </button>
                )}
                {ret.status === "shipped_back" && (
                  <button
                    className="px-2.5 py-1 text-sm font-medium text-white bg-brand rounded-md hover:bg-brand-light disabled:opacity-50 transition-colors"
                    disabled={updateStatusMutation.isLoading}
                    onClick={() => updateStatusMutation.mutate({ id: ret.id, status: "refunded" })}
                  >
                    Mark Refunded
                  </button>
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
