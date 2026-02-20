import { useAppBridge } from "@saleor/app-sdk/app-bridge";
import { Box, Text, Button } from "@/components/ui/primitives";
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

function exceptionStatusColor(status: string): "success1" | "critical1" | "warning1" | "default2" {
  switch (status) {
    case "approved":
    case "auto_resolved":
      return "success1";
    case "rejected":
      return "critical1";
    case "pending_review":
      return "warning1";
    default:
      return "default2";
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
      <Box padding={8}>
        <Text variant="heading" size="large">Loading exceptions...</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box padding={8}>
        <Text variant="heading" size="large" color="critical1">Error loading exceptions</Text>
        <Text>{error.message}</Text>
      </Box>
    );
  }

  return (
    <Box display="flex" flexDirection="column" gap={6}>
      <NavBar />

      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Box>
          <Text variant="heading" size="large">Exception Queue</Text>
          <Text color="default2">
            Review flagged orders requiring manual approval
          </Text>
        </Box>
        {stats && stats.pending > 0 && (
          <Box
            paddingX={4}
            paddingY={2}
            borderRadius={4}
            backgroundColor="warning1"
          >
            <Text variant="bodyStrong">{stats.pending} pending</Text>
          </Box>
        )}
      </Box>

      {/* Stats */}
      {stats && (
        <Box display="grid" __gridTemplateColumns="repeat(4, 1fr)" gap={3}>
          <Box
            padding={3}
            borderRadius={4}
            borderWidth={1}
            borderStyle="solid"
            borderColor="default1"
          >
            <Text color="default2" variant="caption" __display="block">Total</Text>
            <Text variant="heading" size="medium">{stats.total}</Text>
          </Box>
          <Box
            padding={3}
            borderRadius={4}
            borderWidth={1}
            borderStyle="solid"
            borderColor="default1"
          >
            <Text color="default2" variant="caption" __display="block">Pending</Text>
            <Text variant="heading" size="medium" color={stats.pending > 0 ? "critical1" : undefined}>
              {stats.pending}
            </Text>
          </Box>
          <Box
            padding={3}
            borderRadius={4}
            borderWidth={1}
            borderStyle="solid"
            borderColor="default1"
          >
            <Text color="default2" variant="caption" __display="block">Approved</Text>
            <Text variant="heading" size="medium">{stats.approved}</Text>
          </Box>
          <Box
            padding={3}
            borderRadius={4}
            borderWidth={1}
            borderStyle="solid"
            borderColor="default1"
          >
            <Text color="default2" variant="caption" __display="block">Rejected</Text>
            <Text variant="heading" size="medium">{stats.rejected}</Text>
          </Box>
        </Box>
      )}

      {/* Filters */}
      <Box display="flex" gap={1} flexWrap="wrap">
        {STATUS_OPTIONS.map((opt) => (
          <Button
            key={opt.value}
            variant={statusFilter === opt.value ? "primary" : "tertiary"}
            size="small"
            onClick={() => setStatusFilter(opt.value as ExceptionStatus | "all")}
          >
            {opt.label}
          </Button>
        ))}
      </Box>

      {/* Exception Cards */}
      <Box display="flex" flexDirection="column" gap={3}>
        {data?.exceptions.map((exception) => (
          <Box
            key={exception.id}
            padding={5}
            borderRadius={4}
            borderWidth={1}
            borderStyle="solid"
            borderColor={exception.status === "pending_review" ? "warning1" : "default1"}
          >
            <Box display="flex" justifyContent="space-between" alignItems="flex-start" marginBottom={3}>
              <Box display="flex" gap={3} alignItems="center">
                <Text variant="bodyStrong">Order #{exception.orderNumber}</Text>
                <Box
                  paddingX={2}
                  paddingY={1}
                  borderRadius={4}
                  backgroundColor={exceptionStatusColor(exception.status)}
                  __display="inline-block"
                >
                  <Text variant="caption">
                    {exception.status.replace("_", " ").toUpperCase()}
                  </Text>
                </Box>
              </Box>
              <Text variant="caption" color="default2">
                {new Date(exception.createdAt).toLocaleString()}
              </Text>
            </Box>

            <Box marginBottom={3}>
              <Text variant="bodyStrong" __display="block" marginBottom={1}>
                Reason: {exception.reason.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
              </Text>
              <Text color="default2">{exception.details}</Text>
            </Box>

            {exception.resolvedAt && (
              <Box marginBottom={3}>
                <Text variant="caption" color="default2">
                  Resolved: {new Date(exception.resolvedAt).toLocaleString()}
                  {exception.resolvedBy && ` by ${exception.resolvedBy}`}
                </Text>
              </Box>
            )}

            {/* Actions for pending exceptions */}
            {exception.status === "pending_review" && (
              <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
                <Button
                  variant="primary"
                  size="small"
                  disabled={approveMutation.isLoading}
                  onClick={() => approveMutation.mutate({ exceptionId: exception.id })}
                >
                  {approveMutation.isLoading ? "Approving..." : "Approve & Forward"}
                </Button>

                {rejectingId === exception.id ? (
                  <Box display="flex" gap={2} alignItems="center">
                    <input
                      type="text"
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="Rejection reason (optional)"
                      style={{
                        padding: "6px 12px",
                        borderRadius: "4px",
                        border: "1px solid #ccc",
                        fontSize: "13px",
                        width: "250px",
                      }}
                    />
                    <Button
                      variant="secondary"
                      size="small"
                      disabled={rejectMutation.isLoading}
                      onClick={() =>
                        rejectMutation.mutate({
                          exceptionId: exception.id,
                          reason: rejectReason || undefined,
                        })
                      }
                    >
                      Confirm Reject
                    </Button>
                    <Button
                      variant="tertiary"
                      size="small"
                      onClick={() => {
                        setRejectingId(null);
                        setRejectReason("");
                      }}
                    >
                      Cancel
                    </Button>
                  </Box>
                ) : (
                  <Button
                    variant="secondary"
                    size="small"
                    onClick={() => setRejectingId(exception.id)}
                  >
                    Reject
                  </Button>
                )}
              </Box>
            )}
          </Box>
        ))}

        {data?.exceptions.length === 0 && (
          <Box padding={8} display="flex" justifyContent="center">
            <Text color="default2">
              {statusFilter === "pending_review"
                ? "No pending exceptions. All clear!"
                : "No exceptions found matching the current filter."}
            </Text>
          </Box>
        )}
      </Box>
    </Box>
  );
}

export default function ExceptionsPage() {
  const { appBridgeState } = useAppBridge();

  if (!appBridgeState?.ready) {
    return (
      <Box padding={8}>
        <Text>Connecting to Saleor Dashboard...</Text>
      </Box>
    );
  }

  return <ExceptionQueue />;
}
