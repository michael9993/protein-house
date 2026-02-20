import { useAppBridge } from "@saleor/app-sdk/app-bridge";
import { Box, Text, Button, Input } from "@/components/ui/primitives";
import { useRouter } from "next/router";
import { useState } from "react";

import { trpcClient } from "@/modules/trpc/trpc-client";
import { NavBar } from "@/components/ui/NavBar";

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
      <Box padding={8}>
        <Text variant="heading" size="large">Loading AliExpress configuration...</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box padding={8}>
        <Text variant="heading" size="large" color="critical1">Error loading configuration</Text>
        <Text>{error.message}</Text>
      </Box>
    );
  }

  if (!config) return null;

  const oauthUrl = appKey
    ? `https://oauth.aliexpress.com/authorize?response_type=code&client_id=${appKey}&redirect_uri=${encodeURIComponent(window.location.origin + "/api/suppliers/aliexpress/callback")}&sp=ae`
    : null;

  return (
    <Box display="flex" flexDirection="column" gap={6}>
      <NavBar />

      {/* Header with back */}
      <Box display="flex" alignItems="center" gap={3}>
        <Button variant="tertiary" size="small" onClick={() => router.push("/suppliers")}>
          Back
        </Button>
        <Box>
          <Text variant="heading" size="large">AliExpress Configuration</Text>
          <Text color="default2">Manage AliExpress API credentials and OAuth connection</Text>
        </Box>
      </Box>

      {/* Status Card */}
      <Box
        padding={5}
        borderRadius={4}
        borderWidth={1}
        borderStyle="solid"
        borderColor="default1"
      >
        <Text variant="heading" size="medium" __display="block" marginBottom={3}>
          Connection Status
        </Text>
        <Box display="flex" gap={6} flexWrap="wrap">
          <Box>
            <Text color="default2" variant="caption" __display="block">Status</Text>
            <Box
              paddingX={3}
              paddingY={1}
              borderRadius={4}
              marginTop={1}
              backgroundColor={
                config.status === "connected"
                  ? "success1"
                  : config.status === "error"
                    ? "critical1"
                    : "default2"
              }
              __display="inline-block"
            >
              <Text variant="caption">
                {config.status.replace("_", " ").toUpperCase()}
              </Text>
            </Box>
          </Box>
          <Box>
            <Text color="default2" variant="caption" __display="block">Enabled</Text>
            <Text __display="block" marginTop={1}>{config.enabled ? "Yes" : "No"}</Text>
          </Box>
          <Box>
            <Text color="default2" variant="caption" __display="block">Last Connected</Text>
            <Text __display="block" marginTop={1}>
              {config.lastConnectedAt
                ? new Date(config.lastConnectedAt).toLocaleString()
                : "Never"}
            </Text>
          </Box>
          <Box>
            <Text color="default2" variant="caption" __display="block">Token Expires</Text>
            <Text __display="block" marginTop={1}>
              {config.tokenExpiresAt
                ? new Date(config.tokenExpiresAt).toLocaleString()
                : "N/A"}
            </Text>
          </Box>
        </Box>
      </Box>

      {/* Credentials Form */}
      <Box
        padding={5}
        borderRadius={4}
        borderWidth={1}
        borderStyle="solid"
        borderColor="default1"
      >
        <Text variant="heading" size="medium" __display="block" marginBottom={4}>
          API Credentials
        </Text>
        <Box display="flex" flexDirection="column" gap={4}>
          <Box>
            <Text variant="caption" color="default2" __display="block" marginBottom={1}>App Key</Text>
            <Input
              value={appKey}
              onChange={(e) => setAppKey(e.target.value)}
              placeholder="Enter AliExpress App Key"
              size="small"
            />
          </Box>
          <Box>
            <Text variant="caption" color="default2" __display="block" marginBottom={1}>App Secret</Text>
            <Input
              type="password"
              value={appSecret}
              onChange={(e) => setAppSecret(e.target.value)}
              placeholder="Enter AliExpress App Secret"
              size="small"
            />
          </Box>

          {saveMessage && (
            <Box
              padding={3}
              borderRadius={4}
              backgroundColor={saveMessage.type === "success" ? "success1" : "critical1"}
            >
              <Text>{saveMessage.text}</Text>
            </Box>
          )}

          <Box display="flex" gap={3}>
            <Button
              variant="primary"
              disabled={!appKey || !appSecret || saveMutation.isLoading}
              onClick={() =>
                saveMutation.mutate({
                  supplierId: "aliexpress",
                  credentials: { appKey, appSecret },
                })
              }
            >
              {saveMutation.isLoading ? "Saving..." : "Save Credentials"}
            </Button>
          </Box>
        </Box>
      </Box>

      {/* OAuth Flow */}
      <Box
        padding={5}
        borderRadius={4}
        borderWidth={1}
        borderStyle="solid"
        borderColor="default1"
      >
        <Text variant="heading" size="medium" __display="block" marginBottom={3}>
          OAuth Authorization
        </Text>
        <Text color="default2" __display="block" marginBottom={4}>
          After saving your App Key and Secret, use the OAuth URL below to authorize this app with AliExpress.
          The authorization will grant access to the AliExpress API for order forwarding and product data.
        </Text>

        {oauthUrl ? (
          <Box display="flex" flexDirection="column" gap={3}>
            <Box
              padding={3}
              borderRadius={4}
              backgroundColor="default1"
              __wordBreak="break-all"
            >
              <Text variant="caption">{oauthUrl}</Text>
            </Box>
            <Button
              variant="secondary"
              onClick={() => window.open(oauthUrl, "_blank")}
            >
              Open OAuth Authorization Page
            </Button>
          </Box>
        ) : (
          <Text color="default2">Enter your App Key above to generate the OAuth URL.</Text>
        )}
      </Box>

      {/* Test Connection */}
      <Box
        padding={5}
        borderRadius={4}
        borderWidth={1}
        borderStyle="solid"
        borderColor="default1"
      >
        <Text variant="heading" size="medium" __display="block" marginBottom={3}>
          Test Connection
        </Text>
        <Text color="default2" __display="block" marginBottom={4}>
          Verify that the stored credentials are valid and the API is reachable.
        </Text>

        {testResult && (
          <Box
            padding={3}
            borderRadius={4}
            marginBottom={3}
            backgroundColor={testResult.success ? "success1" : "critical1"}
          >
            <Text>{testResult.success ? testResult.message : testResult.error}</Text>
          </Box>
        )}

        <Button
          variant="secondary"
          disabled={testMutation.isLoading}
          onClick={() => testMutation.mutate({ supplierId: "aliexpress" })}
        >
          {testMutation.isLoading ? "Testing..." : "Test Connection"}
        </Button>
      </Box>
    </Box>
  );
}

export default function AliExpressPage() {
  const { appBridgeState } = useAppBridge();

  if (!appBridgeState?.ready) {
    return (
      <Box padding={8}>
        <Text>Connecting to Saleor Dashboard...</Text>
      </Box>
    );
  }

  return <AliExpressConfig />;
}
