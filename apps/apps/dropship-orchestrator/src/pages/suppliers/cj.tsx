import { useAppBridge } from "@saleor/app-sdk/app-bridge";
import { useRouter } from "next/router";
import { useState } from "react";

import { NavBar } from "@/components/ui/NavBar";
import { trpcClient } from "@/modules/trpc/trpc-client";

function connectionStatusCls(status: string): string {
  switch (status) {
    case "connected":
      return "bg-green-50 text-green-800";
    case "error":
      return "bg-red-50 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

function CJConfig() {
  const router = useRouter();
  const { data: config, isLoading, error, refetch } = trpcClient.suppliers.getConfig.useQuery({
    supplierId: "cj",
  });

  const [apiKey, setApiKey] = useState("");
  const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [testResult, setTestResult] = useState<{ success: boolean; message?: string; error?: string } | null>(null);
  const [webhookResult, setWebhookResult] = useState<{ success: boolean; message?: string; error?: string } | null>(null);

  const saveMutation = trpcClient.suppliers.saveCredentials.useMutation({
    onSuccess: () => {
      setSaveMessage({ type: "success", text: "API key saved successfully" });
      refetch();
      setTimeout(() => setSaveMessage(null), 3000);
    },
    onError: (err) => {
      setSaveMessage({ type: "error", text: err.message });
    },
  });

  const testMutation = trpcClient.suppliers.testConnection.useMutation({
    onSuccess: (result) => {
      setTestResult(result);
      setTimeout(() => setTestResult(null), 5000);
    },
    onError: (err) => {
      setTestResult({ success: false, error: err.message });
    },
  });

  const webhookMutation = trpcClient.suppliers.registerWebhooks.useMutation({
    onSuccess: (result) => {
      setWebhookResult(result);
      if (result.success) {
        setTimeout(() => setWebhookResult(null), 8000);
      }
    },
    onError: (err) => {
      setWebhookResult({ success: false, error: err.message });
    },
  });

  if (isLoading) {
    return (
      <div className="p-8">
        <h1 className="text-xl font-semibold text-text-primary">Loading CJ configuration...</h1>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-xl font-semibold text-red-700">Error loading configuration</h1>
        <p className="text-sm">{error.message}</p>
      </div>
    );
  }

  if (!config) return null;

  return (
    <div className="flex flex-col gap-6">
      <NavBar />

      {/* Header with back */}
      <div className="flex items-center gap-3">
        <button
          className="px-2.5 py-1 text-sm font-medium text-text-muted hover:text-text-primary disabled:opacity-50 transition-colors"
          onClick={() => router.push("/suppliers")}
        >
          Back
        </button>
        <div>
          <h1 className="text-xl font-semibold text-text-primary">CJ Dropshipping Configuration</h1>
          <p className="text-sm text-text-muted">Manage CJ API key and webhook settings</p>
        </div>
      </div>

      {/* Status Card */}
      <div className="p-5 rounded-lg border border-border">
        <h2 className="block text-base font-semibold text-text-primary mb-3">Connection Status</h2>
        <div className="flex gap-6 flex-wrap">
          <div>
            <span className="block text-xs text-text-muted">Status</span>
            <span
              className={`inline-block mt-1 px-3 py-1 rounded-lg text-xs ${connectionStatusCls(config.status)}`}
            >
              {config.status.replace("_", " ").toUpperCase()}
            </span>
          </div>
          <div>
            <span className="block text-xs text-text-muted">Enabled</span>
            <span className="block mt-1 text-sm">{config.enabled ? "Yes" : "No"}</span>
          </div>
          <div>
            <span className="block text-xs text-text-muted">Last Connected</span>
            <span className="block mt-1 text-sm">
              {config.lastConnectedAt
                ? new Date(config.lastConnectedAt).toLocaleString()
                : "Never"}
            </span>
          </div>
          <div>
            <span className="block text-xs text-text-muted">Token Expires</span>
            <span className="block mt-1 text-sm">
              {config.tokenExpiresAt
                ? new Date(config.tokenExpiresAt).toLocaleString()
                : "N/A"}
            </span>
          </div>
        </div>
      </div>

      {/* API Key Form */}
      <div className="p-5 rounded-lg border border-border">
        <h2 className="block text-base font-semibold text-text-primary mb-4">API Key</h2>
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-xs text-text-muted mb-1">CJ Dropshipping API Key</label>
            <input
              className="w-full px-2.5 py-1.5 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-brand/20"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter CJ API Key"
            />
            <span className="block text-xs text-text-muted mt-1">
              Obtain your API key from the CJ Dropshipping developer portal.
              The key is stored encrypted in Saleor private metadata.
            </span>
          </div>

          {saveMessage && (
            <div
              className={`p-3 rounded-lg text-sm ${
                saveMessage.type === "success" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
              }`}
            >
              {saveMessage.text}
            </div>
          )}

          <div className="flex gap-3">
            <button
              className="px-3 py-1.5 text-sm font-medium text-white bg-brand rounded-md hover:bg-brand-light disabled:opacity-50 transition-colors"
              disabled={!apiKey || saveMutation.isLoading}
              onClick={() =>
                saveMutation.mutate({
                  supplierId: "cj",
                  credentials: { apiKey },
                })
              }
            >
              {saveMutation.isLoading ? "Saving..." : "Save API Key"}
            </button>
          </div>
        </div>
      </div>

      {/* Webhook Registration */}
      <div className="p-5 rounded-lg border border-border">
        <div className="flex items-center justify-between mb-3">
          <h2 className="block text-base font-semibold text-text-primary">Webhook Registration</h2>
          {config.webhooks && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs bg-green-50 text-green-800">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              Registered {new Date(config.webhooks.registeredAt).toLocaleDateString()}
            </span>
          )}
        </div>

        {config.webhooks && (
          <div className="mb-4 p-3 rounded-lg bg-green-50 text-sm text-green-800">
            Webhooks are active at <strong>{config.webhooks.baseUrl}</strong>. CJ will push order status, tracking, and stock updates to your endpoints.
          </div>
        )}

        {!config.webhooks && (
          <p className="block text-sm text-text-muted mb-4">
            Register webhook URLs with CJ so they can push order status changes, shipping updates, and stock changes to your endpoints.
          </p>
        )}

        <div className="flex flex-col gap-3">
          {[
            { label: "Order Status", path: "/api/webhooks/cj/order", desc: "Receives order status changes (UNSHIPPED, SHIPPED, etc.)" },
            { label: "Logistics / Tracking", path: "/api/webhooks/cj/logistics", desc: "Receives tracking numbers — auto-creates fulfillments" },
            { label: "Stock Updates", path: "/api/webhooks/cj/stock", desc: "Receives inventory changes — updates variant stock" },
          ].map((wh) => {
            const baseUrl = typeof window !== "undefined"
              ? (process.env.NEXT_PUBLIC_APP_API_BASE_URL || window.location.origin)
              : "";
            return (
              <div key={wh.path}>
                <label className="block text-xs text-text-muted mb-1">{wh.label}</label>
                <div className="p-3 rounded-lg bg-gray-50 break-all">
                  <span className="text-xs font-mono">{baseUrl}{wh.path}</span>
                </div>
                <span className="block text-xs text-text-muted mt-0.5">{wh.desc}</span>
              </div>
            );
          })}

          <div className="mt-2 p-3 rounded-lg bg-amber-50 text-amber-800 text-xs">
            <strong>Important:</strong> These URLs must be publicly accessible for CJ to reach them.
            In development, use a tunnel (e.g. Cloudflare Tunnel) pointed at port 3009.
            The tunnel URL should be set as <code>APP_API_BASE_URL</code> in your environment.
          </div>

          <span className="text-xs text-text-muted">
            CJ authenticates webhooks via IP whitelist (pre-configured). You can manage allowed IPs in Settings &gt; IP Whitelist.
          </span>

          {webhookResult && (
            <div
              className={`p-3 rounded-lg text-sm ${
                webhookResult.success ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
              }`}
            >
              {webhookResult.success ? webhookResult.message : webhookResult.error}
            </div>
          )}

          <button
            className="mt-1 px-3 py-1.5 text-sm font-medium text-white bg-brand rounded-md hover:bg-brand-light disabled:opacity-50 transition-colors self-start"
            disabled={webhookMutation.isLoading || config.status !== "connected"}
            onClick={() => webhookMutation.mutate({ supplierId: "cj" })}
          >
            {webhookMutation.isLoading ? "Registering..." : "Register Webhooks at CJ"}
          </button>

          {config.status !== "connected" && (
            <span className="text-xs text-amber-600">
              Save your API key and test connection first before registering webhooks.
            </span>
          )}
        </div>
      </div>

      {/* Test Connection */}
      <div className="p-5 rounded-lg border border-border">
        <h2 className="block text-base font-semibold text-text-primary mb-3">Test Connection</h2>
        <p className="block text-sm text-text-muted mb-4">
          Verify that the API key is valid and the CJ API is reachable.
        </p>

        {testResult && (
          <div
            className={`p-3 rounded-lg mb-3 text-sm ${
              testResult.success ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
            }`}
          >
            {testResult.success ? testResult.message : testResult.error}
          </div>
        )}

        <button
          className="px-3 py-1.5 text-sm font-medium border border-border rounded-md hover:bg-gray-50 disabled:opacity-50 transition-colors"
          disabled={testMutation.isLoading}
          onClick={() => testMutation.mutate({ supplierId: "cj" })}
        >
          {testMutation.isLoading ? "Testing..." : "Test Connection"}
        </button>
      </div>
    </div>
  );
}

export default function CJPage() {
  const { appBridgeState } = useAppBridge();

  if (!appBridgeState?.ready) {
    return (
      <div className="p-8">
        <p className="text-sm">Connecting to Saleor Dashboard...</p>
      </div>
    );
  }

  return <CJConfig />;
}
