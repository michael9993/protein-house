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

function AliExpressConfig() {
  const router = useRouter();
  const { data: config, isLoading, error, refetch } = trpcClient.suppliers.getConfig.useQuery({
    supplierId: "aliexpress",
  });

  const [appKey, setAppKey] = useState("");
  const [appSecret, setAppSecret] = useState("");
  const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [testResult, setTestResult] = useState<{ success: boolean; message?: string; error?: string } | null>(null);

  const saveMutation = trpcClient.suppliers.saveCredentials.useMutation({
    onSuccess: () => {
      setSaveMessage({ type: "success", text: "Credentials saved successfully" });
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
        <h1 className="text-xl font-semibold text-text-primary">Loading AliExpress configuration...</h1>
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

  const oauthUrl = appKey
    ? `https://oauth.aliexpress.com/authorize?response_type=code&client_id=${appKey}&redirect_uri=${encodeURIComponent(window.location.origin + "/api/suppliers/aliexpress/callback")}&sp=ae`
    : null;

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
          <h1 className="text-xl font-semibold text-text-primary">AliExpress Configuration</h1>
          <p className="text-sm text-text-muted">Manage AliExpress API credentials and OAuth connection</p>
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

      {/* Credentials Form */}
      <div className="p-5 rounded-lg border border-border">
        <h2 className="block text-base font-semibold text-text-primary mb-4">API Credentials</h2>
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-xs text-text-muted mb-1">App Key</label>
            <input
              className="w-full px-2.5 py-1.5 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-brand/20"
              value={appKey}
              onChange={(e) => setAppKey(e.target.value)}
              placeholder="Enter AliExpress App Key"
            />
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1">App Secret</label>
            <input
              className="w-full px-2.5 py-1.5 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-brand/20"
              type="password"
              value={appSecret}
              onChange={(e) => setAppSecret(e.target.value)}
              placeholder="Enter AliExpress App Secret"
            />
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
              disabled={!appKey || !appSecret || saveMutation.isLoading}
              onClick={() =>
                saveMutation.mutate({
                  supplierId: "aliexpress",
                  credentials: { appKey, appSecret },
                })
              }
            >
              {saveMutation.isLoading ? "Saving..." : "Save Credentials"}
            </button>
          </div>
        </div>
      </div>

      {/* OAuth Flow */}
      <div className="p-5 rounded-lg border border-border">
        <h2 className="block text-base font-semibold text-text-primary mb-3">OAuth Authorization</h2>
        <p className="block text-sm text-text-muted mb-4">
          After saving your App Key and Secret, use the OAuth URL below to authorize this app with AliExpress.
          The authorization will grant access to the AliExpress API for order forwarding and product data.
        </p>

        {oauthUrl ? (
          <div className="flex flex-col gap-3">
            <div className="p-3 rounded-lg bg-gray-50 break-all">
              <span className="text-xs">{oauthUrl}</span>
            </div>
            <button
              className="px-3 py-1.5 text-sm font-medium border border-border rounded-md hover:bg-gray-50 disabled:opacity-50 transition-colors"
              onClick={() => window.open(oauthUrl, "_blank")}
            >
              Open OAuth Authorization Page
            </button>
          </div>
        ) : (
          <p className="text-sm text-text-muted">Enter your App Key above to generate the OAuth URL.</p>
        )}
      </div>

      {/* Test Connection */}
      <div className="p-5 rounded-lg border border-border">
        <h2 className="block text-base font-semibold text-text-primary mb-3">Test Connection</h2>
        <p className="block text-sm text-text-muted mb-4">
          Verify that the stored credentials are valid and the API is reachable.
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
          onClick={() => testMutation.mutate({ supplierId: "aliexpress" })}
        >
          {testMutation.isLoading ? "Testing..." : "Test Connection"}
        </button>
      </div>
    </div>
  );
}

export default function AliExpressPage() {
  const { appBridgeState } = useAppBridge();

  if (!appBridgeState?.ready) {
    return (
      <div className="p-8">
        <p className="text-sm">Connecting to Saleor Dashboard...</p>
      </div>
    );
  }

  return <AliExpressConfig />;
}
