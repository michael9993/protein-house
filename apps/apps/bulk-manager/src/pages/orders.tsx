import { Box, Text, Button } from "@saleor/macaw-ui";
import { useState, useCallback } from "react";

import { AppLayout, colors } from "@/modules/ui/app-layout";
import { ExportDialog } from "@/modules/ui/export-dialog";
import { trpcClient } from "@/modules/trpc/trpc-client";
import { trpcVanillaClient } from "@/modules/trpc/trpc-vanilla-client";
import { ChannelSelect } from "@/modules/ui/channel-select";
import { WarehouseSelect } from "@/modules/ui/warehouse-select";
import { downloadCSV } from "@/modules/export/csv-exporter";
import { downloadExcel } from "@/modules/export/excel-exporter";

type Tab = "export" | "fulfill" | "cancel";

const ORDER_STATUSES = [
  "UNFULFILLED",
  "PARTIALLY_FULFILLED",
  "FULFILLED",
  "DELIVERED",
  "RETURNED",
  "CANCELED",
  "UNCONFIRMED",
  "PARTIALLY_RETURNED",
];

export default function OrdersPage() {
  const [tab, setTab] = useState<Tab>("export");
  const [channelSlug, setChannelSlug] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [statusFilter, setStatusFilter] = useState<string[]>([]);

  // Bulk fulfill state
  const [fulfillText, setFulfillText] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [notifyCustomer, setNotifyCustomer] = useState(true);
  const [fulfillLoading, setFulfillLoading] = useState(false);
  const [fulfillResult, setFulfillResult] = useState<{ total: number; successful: number; failed: number; results: any[] } | null>(null);

  // Bulk cancel state
  const [cancelText, setCancelText] = useState("");
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelConfirming, setCancelConfirming] = useState(false);
  const [cancelResult, setCancelResult] = useState<{ total: number; successful: number; failed: number; results: any[] } | null>(null);

  const bulkFulfill = trpcClient.orders.bulkFulfill.useMutation();
  const bulkCancel = trpcClient.orders.bulkCancel.useMutation();

  const toggleStatus = (status: string) => {
    setStatusFilter((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
    );
  };

  const handleExport = useCallback(
    async (format: "csv" | "xlsx") => {
      const result = await trpcVanillaClient.orders.export.query({
        channelSlug,
        format,
        first: 500,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        statusFilter: statusFilter.length > 0 ? statusFilter : undefined,
      });

      if (format === "csv") {
        downloadCSV(result.data, `orders-export-${Date.now()}.csv`);
      } else {
        downloadExcel(result.data, `orders-export-${Date.now()}.xlsx`);
      }
    },
    [channelSlug, dateFrom, dateTo, statusFilter]
  );

  const handleBulkFulfill = useCallback(async () => {
    if (!fulfillText.trim() || !warehouseId) return;

    setFulfillLoading(true);
    setFulfillResult(null);

    try {
      const lines = fulfillText.trim().split("\n").filter((l) => l.trim());
      const fulfillments = lines.map((line) => {
        const parts = line.split(",").map((p) => p.trim());
        return {
          orderId: parts[0],
          trackingNumber: parts[1] || undefined,
          notifyCustomer,
        };
      });

      const result = await bulkFulfill.mutateAsync({ fulfillments, warehouseId });
      setFulfillResult(result);
    } catch (error) {
      setFulfillResult({
        total: 0,
        successful: 0,
        failed: 1,
        results: [{ orderId: "N/A", success: false, error: error instanceof Error ? error.message : "Unknown error" }],
      });
    } finally {
      setFulfillLoading(false);
    }
  }, [fulfillText, warehouseId, notifyCustomer, bulkFulfill]);

  const handleBulkCancel = useCallback(async () => {
    const ids = cancelText.trim().split("\n").map((l) => l.trim()).filter(Boolean);
    if (ids.length === 0) return;

    setCancelLoading(true);
    setCancelResult(null);
    setCancelConfirming(false);

    try {
      const result = await bulkCancel.mutateAsync({ ids });
      setCancelResult(result);
      setCancelText("");
    } catch (error) {
      setCancelResult({
        total: 0,
        successful: 0,
        failed: 1,
        results: [{ orderId: "N/A", success: false, error: error instanceof Error ? error.message : "Unknown error" }],
      });
    } finally {
      setCancelLoading(false);
    }
  }, [cancelText, bulkCancel]);

  const cancelIds = cancelText.trim().split("\n").map((l) => l.trim()).filter(Boolean);

  return (
    <AppLayout>
      <Box>
        <Text variant="heading" size={6} __fontWeight="700" __display="block" marginBottom={2}>
          Orders
        </Text>
        <Text size={3} __color={colors.textMuted} __display="block" marginBottom={6}>
          Export order data, bulk fulfill, and bulk cancel orders
        </Text>

        <Box display="flex" gap={1} marginBottom={6} __borderBottom={`2px solid ${colors.border}`}>
          {(["export", "fulfill", "cancel"] as Tab[]).map((t) => (
            <Box
              key={t}
              padding={3}
              cursor="pointer"
              onClick={() => setTab(t)}
              __borderBottom={tab === t ? `2px solid ${colors.brand}` : "2px solid transparent"}
              __marginBottom="-2px"
            >
              <Text
                size={3}
                __fontWeight={tab === t ? "600" : "400"}
                __color={tab === t ? colors.text : colors.textLight}
              >
                {t === "fulfill" ? "Bulk Fulfill" : t === "cancel" ? "Bulk Cancel" : "Export"}
              </Text>
            </Box>
          ))}
        </Box>

        {tab === "export" && (
          <Box>
            <Box
              display="flex"
              gap={4}
              marginBottom={6}
              padding={4}
              borderRadius={4}
              __backgroundColor={colors.surface}
              __border={`1px solid ${colors.border}`}
              __flexWrap="wrap"
            >
              <ChannelSelect value={channelSlug} onChange={setChannelSlug} />
              <Box __flex="1" __minWidth="200px">
                <Text size={2} __fontWeight="500" __display="block" marginBottom={1}>
                  Date From
                </Text>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: `1px solid ${colors.inputBorder}`,
                    borderRadius: "6px",
                    fontSize: "14px",
                  }}
                />
              </Box>
              <Box __flex="1" __minWidth="200px">
                <Text size={2} __fontWeight="500" __display="block" marginBottom={1}>
                  Date To
                </Text>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: `1px solid ${colors.inputBorder}`,
                    borderRadius: "6px",
                    fontSize: "14px",
                  }}
                />
              </Box>
            </Box>

            {/* Status Filter */}
            <Box marginBottom={6}>
              <Text size={2} __fontWeight="500" __display="block" marginBottom={2}>
                Filter by Status
              </Text>
              <Box display="flex" gap={2} __flexWrap="wrap">
                {ORDER_STATUSES.map((status) => (
                  <Box
                    key={status}
                    padding={2}
                    paddingLeft={3}
                    paddingRight={3}
                    borderRadius={4}
                    cursor="pointer"
                    onClick={() => toggleStatus(status)}
                    __border={statusFilter.includes(status) ? `1px solid ${colors.brand}` : `1px solid ${colors.border}`}
                    __backgroundColor={statusFilter.includes(status) ? colors.accentBg : "transparent"}
                  >
                    <Text
                      size={1}
                      __fontWeight={statusFilter.includes(status) ? "600" : "400"}
                      __color={statusFilter.includes(status) ? colors.brand : colors.textMuted}
                    >
                      {status.replace(/_/g, " ")}
                    </Text>
                  </Box>
                ))}
              </Box>
              {statusFilter.length > 0 && (
                <Text
                  size={1}
                  __color={colors.textLight}
                  __display="block"
                  __marginTop="8px"
                  cursor="pointer"
                  onClick={() => setStatusFilter([])}
                >
                  Clear filters ({statusFilter.length} selected)
                </Text>
              )}
            </Box>

            <ExportDialog entityLabel="Orders" onExport={handleExport} />
          </Box>
        )}

        {tab === "fulfill" && (
          <Box>
            <Box
              padding={4}
              borderRadius={4}
              __border={`1px solid ${colors.border}`}
              __backgroundColor={colors.surface}
              marginBottom={4}
            >
              <Text size={2} __fontWeight="500" __display="block" marginBottom={2}>
                Fulfillment Source Warehouse
              </Text>
              <Box __maxWidth="300px" marginBottom={4}>
                <WarehouseSelect value={warehouseId} onChange={setWarehouseId} label="Warehouse" />
              </Box>

              <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "14px" }}>
                <input
                  type="checkbox"
                  checked={notifyCustomer}
                  onChange={(e) => setNotifyCustomer(e.target.checked)}
                  style={{ width: "16px", height: "16px" }}
                />
                <span>Notify customers via email</span>
              </label>
            </Box>

            <Box marginBottom={4}>
              <Text size={2} __fontWeight="500" __display="block" marginBottom={2}>
                Order IDs (one per line, optionally with tracking number)
              </Text>
              <Text size={1} __color={colors.textLight} __display="block" marginBottom={2}>
                Format: ORDER_ID or ORDER_ID,TRACKING_NUMBER
              </Text>
              <textarea
                value={fulfillText}
                onChange={(e) => setFulfillText(e.target.value)}
                placeholder={"T3JkZXI6MQ==\nT3JkZXI6Mg==,TRACK123\nT3JkZXI6Mw==,TRACK456"}
                rows={8}
                style={{
                  width: "100%",
                  padding: "12px",
                  border: `1px solid ${colors.inputBorder}`,
                  borderRadius: "6px",
                  fontSize: "14px",
                  fontFamily: "monospace",
                  resize: "vertical",
                }}
              />
            </Box>

            <Box display="flex" gap={3} alignItems="center" marginBottom={4}>
              <Button
                onClick={handleBulkFulfill}
                disabled={fulfillLoading || !fulfillText.trim() || !warehouseId}
                variant="primary"
              >
                {fulfillLoading ? "Fulfilling..." : "Fulfill Orders"}
              </Button>
              {fulfillText.trim() && (
                <Text size={2} __color={colors.textMuted}>
                  {fulfillText.trim().split("\n").filter((l) => l.trim()).length} orders
                </Text>
              )}
            </Box>

            {fulfillResult && (
              <Box padding={4} borderRadius={4} __border={`1px solid ${colors.border}`} marginBottom={4}>
                <Text size={3} __fontWeight="600" __display="block" marginBottom={2}>
                  Fulfillment Results
                </Text>
                <Box display="flex" gap={4} marginBottom={3}>
                  <Text size={2}>
                    Total: <strong>{fulfillResult.total}</strong>
                  </Text>
                  <Text size={2} __color="#22c55e">
                    Successful: <strong>{fulfillResult.successful}</strong>
                  </Text>
                  {fulfillResult.failed > 0 && (
                    <Text size={2} __color="#ef4444">
                      Failed: <strong>{fulfillResult.failed}</strong>
                    </Text>
                  )}
                </Box>
                {fulfillResult.results.filter((r: any) => !r.success).length > 0 && (
                  <Box __maxHeight="200px" __overflow="auto">
                    {fulfillResult.results
                      .filter((r: any) => !r.success)
                      .map((r: any, idx: number) => (
                        <Text key={idx} size={1} __color="#ef4444" __display="block" marginBottom={1}>
                          {r.orderId}: {r.error}
                        </Text>
                      ))}
                  </Box>
                )}
              </Box>
            )}
          </Box>
        )}

        {tab === "cancel" && (
          <Box>
            <Box
              padding={4}
              borderRadius={4}
              __border="1px solid #fecaca"
              __backgroundColor="#fef2f2"
              marginBottom={4}
            >
              <Text size={2} __color="#991b1b" __fontWeight="500" __display="block" marginBottom={1}>
                Warning: Cancellation is permanent
              </Text>
              <Text size={1} __color="#b91c1c">
                Cancelled orders cannot be restored. Inventory will be restocked and payment refunds may be triggered.
              </Text>
            </Box>

            <Box marginBottom={4}>
              <Text size={2} __fontWeight="500" __display="block" marginBottom={2}>
                Order IDs (one per line)
              </Text>
              <Text size={1} __color={colors.textLight} __display="block" marginBottom={2}>
                Paste the Saleor order IDs to cancel. You can find IDs in the export data.
              </Text>
              <textarea
                value={cancelText}
                onChange={(e) => {
                  setCancelText(e.target.value);
                  setCancelConfirming(false);
                  setCancelResult(null);
                }}
                placeholder={"T3JkZXI6MQ==\nT3JkZXI6Mg==\nT3JkZXI6Mw=="}
                rows={8}
                style={{
                  width: "100%",
                  padding: "12px",
                  border: `1px solid ${colors.inputBorder}`,
                  borderRadius: "6px",
                  fontSize: "14px",
                  fontFamily: "monospace",
                  resize: "vertical",
                }}
              />
            </Box>

            <Box display="flex" gap={3} alignItems="center" marginBottom={4}>
              {!cancelConfirming ? (
                <Button
                  onClick={() => setCancelConfirming(true)}
                  disabled={cancelIds.length === 0 || cancelLoading}
                  variant="error"
                >
                  Cancel {cancelIds.length > 0 ? `${cancelIds.length} Orders` : "Orders"}
                </Button>
              ) : (
                <>
                  <Button onClick={handleBulkCancel} disabled={cancelLoading} variant="error">
                    {cancelLoading ? "Cancelling..." : `Confirm Cancel ${cancelIds.length} Orders`}
                  </Button>
                  <Button onClick={() => setCancelConfirming(false)} disabled={cancelLoading} variant="secondary">
                    Go Back
                  </Button>
                </>
              )}
              {cancelIds.length > 0 && !cancelConfirming && (
                <Text size={2} __color={colors.textMuted}>
                  {cancelIds.length} {cancelIds.length === 1 ? "order" : "orders"} selected
                </Text>
              )}
            </Box>

            {cancelResult && (
              <Box padding={4} borderRadius={4} __border={`1px solid ${colors.border}`} marginBottom={4}>
                <Text size={3} __fontWeight="600" __display="block" marginBottom={2}>
                  Cancellation Results
                </Text>
                <Box display="flex" gap={4} marginBottom={3}>
                  <Text size={2}>
                    Total: <strong>{cancelResult.total}</strong>
                  </Text>
                  <Text size={2} __color="#22c55e">
                    Cancelled: <strong>{cancelResult.successful}</strong>
                  </Text>
                  {cancelResult.failed > 0 && (
                    <Text size={2} __color="#ef4444">
                      Failed: <strong>{cancelResult.failed}</strong>
                    </Text>
                  )}
                </Box>
                {cancelResult.results.filter((r: any) => !r.success).length > 0 && (
                  <Box __maxHeight="200px" __overflow="auto">
                    {cancelResult.results
                      .filter((r: any) => !r.success)
                      .map((r: any, idx: number) => (
                        <Text key={idx} size={1} __color="#ef4444" __display="block" marginBottom={1}>
                          {r.orderId}: {r.error}
                        </Text>
                      ))}
                  </Box>
                )}
              </Box>
            )}
          </Box>
        )}
      </Box>
    </AppLayout>
  );
}
