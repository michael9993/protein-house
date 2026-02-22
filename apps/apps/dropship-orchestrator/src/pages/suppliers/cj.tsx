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
        <h2 className="block text-base font-semibold text-text-primary mb-3">Webhook Registration</h2>
        <p className="block text-sm text-text-muted mb-4">
          CJ sends tracking updates and order status changes via webhooks.
          Configure your CJ dashboard to send webhooks to the URL below.
        </p>

        <div className="flex flex-col gap-3">
          <div>
            <label className="block text-xs text-text-muted mb-1">Webhook URL</label>
            <div className="p-3 rounded-lg bg-gray-50 break-all">
              <span className="text-xs">
                {typeof window !== "undefined"
                  ? `${window.location.origin}/api/webhooks/cj/tracking`
                  : "/api/webhooks/cj/tracking"}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs text-text-muted mb-1">Webhook Status</label>
            <span
              className={`inline-block px-3 py-1 rounded-lg text-xs ${
                config.status === "connected" ? "bg-green-50 text-green-800" : "bg-gray-100 text-gray-800"
              }`}
            >
              {config.status === "connected" ? "Registered" : "Not registered"}
            </span>
          </div>
          <span className="text-xs text-text-muted">
            Note: You can restrict which IPs can call this webhook in the Settings page under IP Whitelist.
          </span>
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
