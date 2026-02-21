import { useAppBridge } from "@saleor/app-sdk/app-bridge";
import { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import { Loader2, BarChart3 } from "lucide-react";

/**
 * Force dynamic rendering to avoid Next.js 15 prerender bug where _document/Html
 * chunk is loaded in page context during static generation.
 */
export const getServerSideProps: GetServerSideProps = async () => ({
  props: {},
});

/**
 * Order Stats Widget
 * This is the WIDGET target for the ORDER_DETAILS_WIDGETS extension
 * It receives orderId from the URL query parameters
 */
export default function OrderStatsWidget() {
  const { appBridgeState } = useAppBridge();
  const router = useRouter();
  const { orderId } = router.query;

  if (!appBridgeState?.ready) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 size={20} className="animate-spin text-brand" />
      </div>
    );
  }

  if (!orderId) {
    return (
      <div className="p-4">
        <span className="text-sm text-text-muted">No order selected</span>
      </div>
    );
  }

  const displayId = typeof orderId === "string" ? orderId : orderId[0];

  return (
    <div className="p-3 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-text-primary text-sm">Order Analytics</h3>
        <span className="inline-flex items-center gap-1 rounded-full bg-brand/10 px-2 py-0.5 text-xs font-medium text-brand">
          <BarChart3 size={12} />
          Widget
        </span>
      </div>

      <div className="rounded-lg border border-border bg-white p-3">
        <p className="text-xs text-text-muted mb-1">Order ID</p>
        <p className="font-mono text-sm truncate text-text-primary">{displayId}</p>
      </div>

      <p className="text-xs text-text-muted text-center">
        Open Sales Analytics for full dashboard
      </p>
    </div>
  );
}
