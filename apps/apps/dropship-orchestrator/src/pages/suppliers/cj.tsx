import { useAppBridge } from "@saleor/app-sdk/app-bridge";
import { Box, Text, Button, Input } from "@/components/ui/primitives";
import { useRouter } from "next/router";
import { useState } from "react";

import { trpcClient } from "@/modules/trpc/trpc-client";
import { NavBar } from "@/components/ui/NavBar";

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
      <Box padding={8}>
        <Text variant="heading" size="large">Loading CJ configuration...</Text>
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

  return (
    <Box display="flex" flexDirection="column" gap={6}>
      <NavBar />

      {/* Header with back */}
      <Box display="flex" alignItems="center" gap={3}>
        <Button variant="tertiary" size="small" onClick={() => router.push("/suppliers")}>
          Back
        </Button>
        <Box>
          <Text variant="heading" size="large">CJ Dropshipping Configuration</Text>
          <Text color="default2">Manage CJ API key and webhook settings</Text>
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

      {/* API Key Form */}
      <Box
        padding={5}
        borderRadius={4}
        borderWidth={1}
        borderStyle="solid"
        borderColor="default1"
      >
        <Text variant="heading" size="medium" __display="block" marginBottom={4}>
          API Key
        </Text>
        <Box display="flex" flexDirection="column" gap={4}>
          <Box>
            <Text variant="caption" color="default2" __display="block" marginBottom={1}>
              CJ Dropshipping API Key
            </Text>
            <Input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter CJ API Key"
              size="small"
            />
            <Text variant="caption" color="default2" __display="block" marginTop={1}>
              Obtain your API key from the CJ Dropshipping developer portal.
              The key is stored encrypted in Saleor private metadata.
            </Text>
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
              disabled={!apiKey || saveMutation.isLoading}
              onClick={() =>
                saveMutation.mutate({
                  supplierId: "cj",
                  credentials: { apiKey },
                })
              }
            >
              {saveMutation.isLoading ? "Saving..." : "Save API Key"}
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Webhook Registration */}
      <Box
        padding={5}
        borderRadius={4}
        borderWidth={1}
        borderStyle="solid"
        borderColor="default1"
      >
        <Text variant="heading" size="medium" __display="block" marginBottom={3}>
          Webhook Registration
        </Text>
        <Text color="default2" __display="block" marginBottom={4}>
          CJ sends tracking updates and order status changes via webhooks.
          Configure your CJ dashboard to send webhooks to the URL below.
        </Text>

        <Box display="flex" flexDirection="column" gap={3}>
          <Box>
            <Text variant="caption" color="default2" __display="block" marginBottom={1}>
              Webhook URL
            </Text>
            <Box
              padding={3}
              borderRadius={4}
              backgroundColor="default1"
              __wordBreak="break-all"
            >
              <Text variant="caption">
                {typeof window !== "undefined"
                  ? `${window.location.origin}/api/webhooks/cj/tracking`
                  : "/api/webhooks/cj/tracking"}
              </Text>
            </Box>
          </Box>

          <Box>
            <Text variant="caption" color="default2" __display="block" marginBottom={1}>
              Webhook Status
            </Text>
            <Box
              paddingX={3}
              paddingY={1}
              borderRadius={4}
              backgroundColor={config.status === "connected" ? "success1" : "default2"}
              __display="inline-block"
            >
              <Text variant="caption">
                {config.status === "connected" ? "Registered" : "Not registered"}
              </Text>
            </Box>
          </Box>
          <Text variant="caption" color="default2">
            Note: You can restrict which IPs can call this webhook in the Settings page under IP Whitelist.
          </Text>
        </Box>
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
          Verify that the API key is valid and the CJ API is reachable.
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
          onClick={() => testMutation.mutate({ supplierId: "cj" })}
        >
          {testMutation.isLoading ? "Testing..." : "Test Connection"}
        </Button>
      </Box>
    </Box>
  );
}

export default function CJPage() {
  const { appBridgeState } = useAppBridge();

  if (!appBridgeState?.ready) {
    return (
      <Box padding={8}>
        <Text>Connecting to Saleor Dashboard...</Text>
      </Box>
    );
  }

  return <CJConfig />;
}
