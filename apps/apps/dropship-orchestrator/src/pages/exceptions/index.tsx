import { useAppBridge } from "@saleor/app-sdk/app-bridge";
import { useState } from "react";

import { trpcClient } from "@/modules/trpc/trpc-client";
import { NavBar } from "@/components/ui/NavBar";

type ExceptionStatus = "pending_review" | "approved" | "rejected" | "auto_resolved";

const STATUS_OPTIONS: Array<{ value: ExceptionStatus | "all"; label: string }> = [
  { value: "all", label: "All" },
  { value: "pending_review", label: "Pending Review" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "auto_resolved", label: "Auto Resolved" },
];

function exceptionStatusBadgeCls(status: string): string {
  switch (status) {
    case "approved":
    case "auto_resolved":
      return "bg-green-50 text-green-800";
    case "rejected":
      return "bg-red-50 text-red-800";
    case "pending_review":
      return "bg-yellow-50 text-yellow-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

function ExceptionQueue() {
  const [statusFilter, setStatusFilter] = useState<ExceptionStatus | "all">("pending_review");
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const { data, isLoading, error, refetch } = trpcClient.exceptions.list.useQuery({
    status: statusFilter === "all" ? undefined : statusFilter,
    limit: 50,
  });

  const { data: stats } = trpcClient.exceptions.getStats.useQuery();

  const approveMutation = trpcClient.exceptions.approve.useMutation({
    onSuccess: () => refetch(),
  });

  const rejectMutation = trpcClient.exceptions.reject.useMutation({
    onSuccess: () => {
      setRejectingId(null);
      setRejectReason("");
      refetch();
    },
  });

  if (isLoading) {
    return (
      <div className="p-8">
        <h1 className="text-xl font-semibold text-text-primary">Loading exceptions...</h1>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-xl font-semibold text-red-600">Error loading exceptions</h1>
        <p className="text-sm text-text-primary">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <NavBar />

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">Exception Queue</h1>
          <p className="text-sm text-text-muted">
            Review flagged orders requiring manual approval
          </p>
        </div>
        {stats && stats.pending > 0 && (
          <div className="px-4 py-2 rounded-lg bg-yellow-50 text-yellow-800">
            <span className="font-semibold">{stats.pending} pending</span>
          </div>
        )}
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-4 gap-3">
          <div className="p-3 rounded-lg border border-border">
            <span className="text-xs text-text-muted block">Total</span>
            <h2 className="text-base font-semibold text-text-primary">{stats.total}</h2>
          </div>
          <div className="p-3 rounded-lg border border-border">
            <span className="text-xs text-text-muted block">Pending</span>
            <h2 className={`text-base font-semibold ${stats.pending > 0 ? "text-red-600" : "text-text-primary"}`}>
              {stats.pending}
            </h2>
          </div>
          <div className="p-3 rounded-lg border border-border">
            <span className="text-xs text-text-muted block">Approved</span>
            <h2 className="text-base font-semibold text-text-primary">{stats.approved}</h2>
          </div>
          <div className="p-3 rounded-lg border border-border">
            <span className="text-xs text-text-muted block">Rejected</span>
            <h2 className="text-base font-semibold text-text-primary">{stats.rejected}</h2>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-1 flex-wrap">
        {STATUS_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            className={
              statusFilter === opt.value
                ? "px-2.5 py-1 text-sm font-medium text-white bg-brand rounded-md hover:bg-brand-light transition-colors"
                : "px-2.5 py-1 text-sm font-medium text-text-muted hover:text-text-primary transition-colors"
            }
            onClick={() => setStatusFilter(opt.value as ExceptionStatus | "all")}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Exception Cards */}
      <div className="flex flex-col gap-3">
        {data?.exceptions.map((exception) => (
          <div
            key={exception.id}
            className={`p-5 rounded-lg border ${
              exception.status === "pending_review" ? "border-yellow-300" : "border-border"
            }`}
          >
            <div className="flex justify-between items-start mb-3">
              <div className="flex gap-3 items-center">
                <span className="font-semibold">Order #{exception.orderNumber}</span>
                <span className={`inline-block px-2 py-1 rounded-lg text-xs ${exceptionStatusBadgeCls(exception.status)}`}>
                  {exception.status.replace("_", " ").toUpperCase()}
                </span>
              </div>
              <span className="text-xs text-text-muted">
                {new Date(exception.createdAt).toLocaleString()}
              </span>
            </div>

            <div className="mb-3">
              <span className="font-semibold block mb-1">
                Reason: {exception.reason.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
              </span>
              <p className="text-sm text-text-muted">{exception.details}</p>
            </div>

            {exception.resolvedAt && (
              <div className="mb-3">
                <span className="text-xs text-text-muted">
                  Resolved: {new Date(exception.resolvedAt).toLocaleString()}
                  {exception.resolvedBy && ` by ${exception.resolvedBy}`}
                </span>
              </div>
            )}

            {/* Actions for pending exceptions */}
            {exception.status === "pending_review" && (
              <div className="flex gap-2 items-center flex-wrap">
                <button
                  className="px-2.5 py-1 text-sm font-medium text-white bg-brand rounded-md hover:bg-brand-light disabled:opacity-50 transition-colors"
                  disabled={approveMutation.isLoading}
                  onClick={() => approveMutation.mutate({ exceptionId: exception.id })}
                >
                  {approveMutation.isLoading ? "Approving..." : "Approve & Forward"}
                </button>

                {rejectingId === exception.id ? (
                  <div className="flex gap-2 items-center">
                    <input
                      type="text"
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="Rejection reason (optional)"
                      className="w-[250px] px-2.5 py-1.5 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-brand/20"
                    />
                    <button
                      className="px-2.5 py-1 text-sm font-medium border border-border rounded-md hover:bg-gray-50 disabled:opacity-50 transition-colors"
                      disabled={rejectMutation.isLoading}
                      onClick={() =>
                        rejectMutation.mutate({
                          exceptionId: exception.id,
                          reason: rejectReason || undefined,
                        })
                      }
                    >
                      Confirm Reject
                    </button>
                    <button
                      className="px-2.5 py-1 text-sm font-medium text-text-muted hover:text-text-primary disabled:opacity-50 transition-colors"
                      onClick={() => {
                        setRejectingId(null);
                        setRejectReason("");
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    className="px-2.5 py-1 text-sm font-medium border border-border rounded-md hover:bg-gray-50 disabled:opacity-50 transition-colors"
                    onClick={() => setRejectingId(exception.id)}
                  >
                    Reject
                  </button>
                )}
              </div>
            )}
          </div>
        ))}

        {data?.exceptions.length === 0 && (
          <div className="p-8 flex justify-center">
            <p className="text-sm text-text-muted">
              {statusFilter === "pending_review"
                ? "No pending exceptions. All clear!"
                : "No exceptions found matching the current filter."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ExceptionsPage() {
  const { appBridgeState } = useAppBridge();

  if (!appBridgeState?.ready) {
    return (
      <div className="p-8">
        <p className="text-sm text-text-primary">Connecting to Saleor Dashboard...</p>
      </div>
    );
  }

  return <ExceptionQueue />;
}
