import { useAppBridge } from "@saleor/app-sdk/app-bridge";
import { Box, Text, Button, Input } from "@/components/ui/primitives";
import { useState, useEffect } from "react";

import { trpcClient } from "@/modules/trpc/trpc-client";
import { NavBar } from "@/components/ui/NavBar";

type SettingsTab = "general" | "fraud" | "ip-whitelist" | "blacklist";

const FRAUD_RULE_LABELS: Record<string, string> = {
  velocity_check: "Velocity Check (orders per hour)",
  address_mismatch: "Billing/Shipping Address Mismatch",
  value_threshold: "High Value Order Threshold",
  blacklist_match: "Blacklist Match",
  new_customer_high_value: "New Customer High Value",
};

function GeneralSettings() {
  const { data, isLoading, error, refetch } = trpcClient.settings.getDropshipConfig.useQuery();
  const updateMutation = trpcClient.settings.updateDropshipConfig.useMutation({
    onSuccess: () => {
      setSaveMessage({ type: "success", text: "Settings saved" });
      refetch();
      setTimeout(() => setSaveMessage(null), 3000);
    },
    onError: (err) => {
      setSaveMessage({ type: "error", text: err.message });
    },
  });

  const [enabled, setEnabled] = useState(true);
  const [autoForward, setAutoForward] = useState(true);
  const [costCeilingPercent, setCostCeilingPercent] = useState(70);
  const [dailySpendLimit, setDailySpendLimit] = useState(1000);
  const [fraudChecksEnabled, setFraudChecksEnabled] = useState(true);
  const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (data) {
      setEnabled(data.enabled);
      setAutoForward(data.autoForward);
      setCostCeilingPercent(data.costCeilingPercent);
      setDailySpendLimit(data.dailySpendLimit);
      setFraudChecksEnabled(data.fraudChecksEnabled);
    }
  }, [data]);

  if (isLoading) {
    return <Text>Loading general settings...</Text>;
  }

  if (error) {
    return <Text color="critical1">Error: {error.message}</Text>;
  }

  return (
    <Box display="flex" flexDirection="column" gap={5}>
      <Text variant="heading" size="medium">General Configuration</Text>

      <Box display="flex" flexDirection="column" gap={4}>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          padding={4}
          borderRadius={4}
          borderWidth={1}
          borderStyle="solid"
          borderColor="default1"
        >
          <Box>
            <Text variant="bodyStrong" __display="block">Dropship Orchestrator Enabled</Text>
            <Text color="default2" variant="caption">Master switch for all dropshipping operations</Text>
          </Box>
          <Button
            variant={enabled ? "primary" : "secondary"}
            size="small"
            onClick={() => setEnabled(!enabled)}
          >
            {enabled ? "Enabled" : "Disabled"}
          </Button>
        </Box>

        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          padding={4}
          borderRadius={4}
          borderWidth={1}
          borderStyle="solid"
          borderColor="default1"
        >
          <Box>
            <Text variant="bodyStrong" __display="block">Auto-Forward Orders</Text>
            <Text color="default2" variant="caption">
              Automatically forward orders to suppliers when payment is confirmed
            </Text>
          </Box>
          <Button
            variant={autoForward ? "primary" : "secondary"}
            size="small"
            onClick={() => setAutoForward(!autoForward)}
          >
            {autoForward ? "Auto" : "Manual"}
          </Button>
        </Box>

        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          padding={4}
          borderRadius={4}
          borderWidth={1}
          borderStyle="solid"
          borderColor="default1"
        >
          <Box>
            <Text variant="bodyStrong" __display="block">Fraud Checks Enabled</Text>
            <Text color="default2" variant="caption">
              Run fraud detection rules before forwarding orders
            </Text>
          </Box>
          <Button
            variant={fraudChecksEnabled ? "primary" : "secondary"}
            size="small"
            onClick={() => setFraudChecksEnabled(!fraudChecksEnabled)}
          >
            {fraudChecksEnabled ? "Enabled" : "Disabled"}
          </Button>
        </Box>

        <Box padding={4} borderRadius={4} borderWidth={1} borderStyle="solid" borderColor="default1">
          <Text variant="bodyStrong" __display="block" marginBottom={2}>
            Cost Ceiling (%)
          </Text>
          <Text color="default2" variant="caption" __display="block" marginBottom={2}>
            Maximum supplier cost as a percentage of the selling price.
            Orders exceeding this create an exception for review.
          </Text>
          <Input
            type="number"
            value={String(costCeilingPercent)}
            onChange={(e) => setCostCeilingPercent(Number(e.target.value))}
            size="small"
          />
        </Box>

        <Box padding={4} borderRadius={4} borderWidth={1} borderStyle="solid" borderColor="default1">
          <Text variant="bodyStrong" __display="block" marginBottom={2}>
            Daily Spend Limit ($)
          </Text>
          <Text color="default2" variant="caption" __display="block" marginBottom={2}>
            Maximum total spend on supplier orders per day. Pauses forwarding when exceeded.
          </Text>
          <Input
            type="number"
            value={String(dailySpendLimit)}
            onChange={(e) => setDailySpendLimit(Number(e.target.value))}
            size="small"
          />
        </Box>
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

      <Button
        variant="primary"
        disabled={updateMutation.isLoading}
        onClick={() =>
          updateMutation.mutate({
            enabled,
            autoForward,
            costCeilingPercent,
            dailySpendLimit,
            fraudChecksEnabled,
          })
        }
      >
        {updateMutation.isLoading ? "Saving..." : "Save General Settings"}
      </Button>
    </Box>
  );
}

function FraudSettings() {
  const { data, isLoading, error, refetch } = trpcClient.settings.getFraudConfig.useQuery();
  const updateMutation = trpcClient.settings.updateFraudConfig.useMutation({
    onSuccess: () => {
      setSaveMessage({ type: "success", text: "Fraud settings saved" });
      refetch();
      setTimeout(() => setSaveMessage(null), 3000);
    },
    onError: (err) => {
      setSaveMessage({ type: "error", text: err.message });
    },
  });

  const [maxOrdersPerHour, setMaxOrdersPerHour] = useState(3);
  const [maxSpendPer24h, setMaxSpendPer24h] = useState(500);
  const [highValueThreshold, setHighValueThreshold] = useState(200);
  const [newCustomerHighValueThreshold, setNewCustomerHighValueThreshold] = useState(100);
  const [billingShippingMismatchBlocking, setBillingShippingMismatchBlocking] = useState(false);
  const [enabledRules, setEnabledRules] = useState<string[]>([]);
  const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (data) {
      setMaxOrdersPerHour(data.maxOrdersPerHour);
      setMaxSpendPer24h(data.maxSpendPer24h);
      setHighValueThreshold(data.highValueThreshold);
      setNewCustomerHighValueThreshold(data.newCustomerHighValueThreshold);
      setBillingShippingMismatchBlocking(data.billingShippingMismatchBlocking);
      setEnabledRules(data.enabledRules);
    }
  }, [data]);

  if (isLoading) {
    return <Text>Loading fraud settings...</Text>;
  }

  if (error) {
    return <Text color="critical1">Error: {error.message}</Text>;
  }

  const allRules = [
    "velocity_check",
    "address_mismatch",
    "value_threshold",
    "blacklist_match",
    "new_customer_high_value",
  ] as const;

  function toggleRule(rule: string) {
    setEnabledRules((prev) =>
      prev.includes(rule) ? prev.filter((r) => r !== rule) : [...prev, rule],
    );
  }

  return (
    <Box display="flex" flexDirection="column" gap={5}>
      <Text variant="heading" size="medium">Fraud Detection Rules</Text>

      {/* Rule toggles */}
      <Box display="flex" flexDirection="column" gap={2}>
        {allRules.map((rule) => (
          <Box
            key={rule}
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            padding={4}
            borderRadius={4}
            borderWidth={1}
            borderStyle="solid"
            borderColor="default1"
          >
            <Text>{FRAUD_RULE_LABELS[rule] ?? rule}</Text>
            <Button
              variant={enabledRules.includes(rule) ? "primary" : "secondary"}
              size="small"
              onClick={() => toggleRule(rule)}
            >
              {enabledRules.includes(rule) ? "On" : "Off"}
            </Button>
          </Box>
        ))}
      </Box>

      {/* Thresholds */}
      <Text variant="heading" size="medium">Thresholds</Text>
      <Box display="grid" __gridTemplateColumns="1fr 1fr" gap={4}>
        <Box padding={4} borderRadius={4} borderWidth={1} borderStyle="solid" borderColor="default1">
          <Text variant="bodyStrong" __display="block" marginBottom={2}>
            Max Orders Per Hour
          </Text>
          <Input
            type="number"
            value={String(maxOrdersPerHour)}
            onChange={(e) => setMaxOrdersPerHour(Number(e.target.value))}
            size="small"
          />
        </Box>
        <Box padding={4} borderRadius={4} borderWidth={1} borderStyle="solid" borderColor="default1">
          <Text variant="bodyStrong" __display="block" marginBottom={2}>
            Max Spend Per 24h ($)
          </Text>
          <Input
            type="number"
            value={String(maxSpendPer24h)}
            onChange={(e) => setMaxSpendPer24h(Number(e.target.value))}
            size="small"
          />
        </Box>
        <Box padding={4} borderRadius={4} borderWidth={1} borderStyle="solid" borderColor="default1">
          <Text variant="bodyStrong" __display="block" marginBottom={2}>
            High Value Threshold ($)
          </Text>
          <Input
            type="number"
            value={String(highValueThreshold)}
            onChange={(e) => setHighValueThreshold(Number(e.target.value))}
            size="small"
          />
        </Box>
        <Box padding={4} borderRadius={4} borderWidth={1} borderStyle="solid" borderColor="default1">
          <Text variant="bodyStrong" __display="block" marginBottom={2}>
            New Customer High Value ($)
          </Text>
          <Input
            type="number"
            value={String(newCustomerHighValueThreshold)}
            onChange={(e) => setNewCustomerHighValueThreshold(Number(e.target.value))}
            size="small"
          />
        </Box>
      </Box>

      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        padding={4}
        borderRadius={4}
        borderWidth={1}
        borderStyle="solid"
        borderColor="default1"
      >
        <Box>
          <Text variant="bodyStrong" __display="block">
            Billing/Shipping Mismatch Blocking
          </Text>
          <Text color="default2" variant="caption">
            Block orders (not just flag) when billing and shipping addresses differ
          </Text>
        </Box>
        <Button
          variant={billingShippingMismatchBlocking ? "primary" : "secondary"}
          size="small"
          onClick={() => setBillingShippingMismatchBlocking(!billingShippingMismatchBlocking)}
        >
          {billingShippingMismatchBlocking ? "Blocking" : "Flag Only"}
        </Button>
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

      <Button
        variant="primary"
        disabled={updateMutation.isLoading}
        onClick={() =>
          updateMutation.mutate({
            maxOrdersPerHour,
            maxSpendPer24h,
            highValueThreshold,
            newCustomerHighValueThreshold,
            billingShippingMismatchBlocking,
            enabledRules: enabledRules as any,
          })
        }
      >
        {updateMutation.isLoading ? "Saving..." : "Save Fraud Settings"}
      </Button>
    </Box>
  );
}

function IpWhitelistSettings() {
  const { data, isLoading, error, refetch } = trpcClient.settings.getIpWhitelist.useQuery();
  const updateMutation = trpcClient.settings.updateIpWhitelist.useMutation({
    onSuccess: () => {
      setSaveMessage({ type: "success", text: "IP whitelist saved" });
      refetch();
      setTimeout(() => setSaveMessage(null), 3000);
    },
    onError: (err) => {
      setSaveMessage({ type: "error", text: err.message });
    },
  });

  const [whitelistEnabled, setWhitelistEnabled] = useState(false);
  const [ips, setIps] = useState<string[]>([]);
  const [newIp, setNewIp] = useState("");
  const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (data) {
      setWhitelistEnabled(data.enabled);
      setIps(data.allowedIps);
    }
  }, [data]);

  if (isLoading) {
    return <Text>Loading IP whitelist...</Text>;
  }

  if (error) {
    return <Text color="critical1">Error: {error.message}</Text>;
  }

  function addIp() {
    const trimmed = newIp.trim();
    if (trimmed && !ips.includes(trimmed)) {
      setIps([...ips, trimmed]);
      setNewIp("");
    }
  }

  function removeIp(ip: string) {
    setIps(ips.filter((i) => i !== ip));
  }

  return (
    <Box display="flex" flexDirection="column" gap={5}>
      <Text variant="heading" size="medium">IP Whitelist for CJ Webhooks</Text>
      <Text color="default2">
        When enabled, only requests from these IP addresses will be accepted for CJ webhook endpoints.
      </Text>

      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        padding={4}
        borderRadius={4}
        borderWidth={1}
        borderStyle="solid"
        borderColor="default1"
      >
        <Text variant="bodyStrong">IP Whitelist Enabled</Text>
        <Button
          variant={whitelistEnabled ? "primary" : "secondary"}
          size="small"
          onClick={() => setWhitelistEnabled(!whitelistEnabled)}
        >
          {whitelistEnabled ? "Enabled" : "Disabled"}
        </Button>
      </Box>

      {/* Add IP */}
      <Box display="flex" gap={2} alignItems="flex-end">
        <Box __flex="1">
          <Text variant="caption" color="default2" __display="block" marginBottom={1}>
            Add IP Address
          </Text>
          <Input
            value={newIp}
            onChange={(e) => setNewIp(e.target.value)}
            placeholder="e.g. 203.0.113.50"
            size="small"
            onKeyDown={(e) => {
              if (e.key === "Enter") addIp();
            }}
          />
        </Box>
        <Button variant="secondary" size="small" onClick={addIp}>
          Add
        </Button>
      </Box>

      {/* IP List */}
      <Box display="flex" flexDirection="column" gap={1}>
        {ips.map((ip) => (
          <Box
            key={ip}
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            padding={3}
            borderRadius={4}
            borderWidth={1}
            borderStyle="solid"
            borderColor="default1"
          >
            <Text variant="caption">{ip}</Text>
            <Button variant="tertiary" size="small" onClick={() => removeIp(ip)}>
              Remove
            </Button>
          </Box>
        ))}
        {ips.length === 0 && (
          <Text color="default2" variant="caption">
            No IPs whitelisted. All webhook requests will be accepted.
          </Text>
        )}
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

      <Button
        variant="primary"
        disabled={updateMutation.isLoading}
        onClick={() =>
          updateMutation.mutate({
            enabled: whitelistEnabled,
            allowedIps: ips,
          })
        }
      >
        {updateMutation.isLoading ? "Saving..." : "Save IP Whitelist"}
      </Button>
    </Box>
  );
}

function BlacklistSettings() {
  const { data: blacklist, isLoading, error, refetch } = trpcClient.settings.getBlacklist.useQuery();
  const addMutation = trpcClient.settings.addToBlacklist.useMutation({
    onSuccess: () => {
      setNewValue("");
      setNewReason("");
      refetch();
    },
  });
  const removeMutation = trpcClient.settings.removeFromBlacklist.useMutation({
    onSuccess: () => refetch(),
  });

  const [newType, setNewType] = useState<"email" | "address" | "phone" | "ip">("email");
  const [newValue, setNewValue] = useState("");
  const [newReason, setNewReason] = useState("");

  if (isLoading) {
    return <Text>Loading blacklist...</Text>;
  }

  if (error) {
    return <Text color="critical1">Error: {error.message}</Text>;
  }

  const typeOptions = [
    { value: "email" as const, label: "Email" },
    { value: "address" as const, label: "Address" },
    { value: "phone" as const, label: "Phone" },
    { value: "ip" as const, label: "IP" },
  ];

  return (
    <Box display="flex" flexDirection="column" gap={5}>
      <Text variant="heading" size="medium">Blacklist Management</Text>
      <Text color="default2">
        Orders matching blacklisted entries will be flagged for review.
      </Text>

      {/* Add entry */}
      <Box
        padding={4}
        borderRadius={4}
        borderWidth={1}
        borderStyle="solid"
        borderColor="default1"
        display="flex"
        flexDirection="column"
        gap={3}
      >
        <Text variant="bodyStrong">Add Entry</Text>
        <Box display="flex" gap={2} flexWrap="wrap">
          {typeOptions.map((opt) => (
            <Button
              key={opt.value}
              variant={newType === opt.value ? "primary" : "tertiary"}
              size="small"
              onClick={() => setNewType(opt.value)}
            >
              {opt.label}
            </Button>
          ))}
        </Box>
        <Input
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          placeholder={`Enter ${newType} to blacklist`}
          size="small"
        />
        <Input
          value={newReason}
          onChange={(e) => setNewReason(e.target.value)}
          placeholder="Reason for blacklisting"
          size="small"
        />
        <Button
          variant="primary"
          size="small"
          disabled={!newValue.trim() || !newReason.trim() || addMutation.isLoading}
          onClick={() =>
            addMutation.mutate({
              type: newType,
              value: newValue.trim(),
              reason: newReason.trim(),
            })
          }
        >
          {addMutation.isLoading ? "Adding..." : "Add to Blacklist"}
        </Button>
      </Box>

      {/* Blacklist table */}
      <Box display="flex" flexDirection="column" gap={1}>
        {/* Header */}
        <Box
          display="grid"
          __gridTemplateColumns="80px 1fr 1fr 140px 80px"
          gap={2}
          paddingX={4}
          paddingY={2}
          backgroundColor="default1"
          borderRadius={4}
        >
          <Text variant="caption" color="default2">Type</Text>
          <Text variant="caption" color="default2">Value</Text>
          <Text variant="caption" color="default2">Reason</Text>
          <Text variant="caption" color="default2">Added</Text>
          <Text variant="caption" color="default2">Action</Text>
        </Box>

        {blacklist?.map((entry, idx) => (
          <Box
            key={`${entry.type}-${entry.value}-${idx}`}
            display="grid"
            __gridTemplateColumns="80px 1fr 1fr 140px 80px"
            gap={2}
            paddingX={4}
            paddingY={3}
            borderWidth={1}
            borderStyle="solid"
            borderColor="default1"
            borderRadius={4}
            alignItems="center"
          >
            <Box
              paddingX={2}
              paddingY={1}
              borderRadius={4}
              backgroundColor="default2"
              __display="inline-block"
            >
              <Text variant="caption">{entry.type.toUpperCase()}</Text>
            </Box>
            <Text variant="caption" __wordBreak="break-all">{entry.value}</Text>
            <Text variant="caption" color="default2">{entry.reason}</Text>
            <Text variant="caption" color="default2">
              {new Date(entry.addedAt).toLocaleDateString()}
            </Text>
            <Button
              variant="tertiary"
              size="small"
              disabled={removeMutation.isLoading}
              onClick={() =>
                removeMutation.mutate({ type: entry.type, value: entry.value })
              }
            >
              Remove
            </Button>
          </Box>
        ))}

        {(!blacklist || blacklist.length === 0) && (
          <Box padding={6} display="flex" justifyContent="center">
            <Text color="default2">No blacklist entries.</Text>
          </Box>
        )}
      </Box>
    </Box>
  );
}

function SettingsContent() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("general");

  const tabs: Array<{ value: SettingsTab; label: string }> = [
    { value: "general", label: "General" },
    { value: "fraud", label: "Fraud Detection" },
    { value: "ip-whitelist", label: "IP Whitelist" },
    { value: "blacklist", label: "Blacklist" },
  ];

  return (
    <Box display="flex" flexDirection="column" gap={6}>
      <NavBar />

      <Box>
        <Text variant="heading" size="large">Settings</Text>
        <Text color="default2">Configure dropshipping rules, fraud detection, and security</Text>
      </Box>

      {/* Tabs */}
      <Box display="flex" gap={1} borderBottomWidth={1} borderBottomStyle="solid" borderColor="default1">
        {tabs.map((tab) => (
          <Box
            key={tab.value}
            paddingX={4}
            paddingY={2}
            cursor="pointer"
            borderBottomWidth={2}
            borderBottomStyle="solid"
            borderColor={activeTab === tab.value ? "info1" : "transparent"}
            onClick={() => setActiveTab(tab.value)}
          >
            <Text
              variant={activeTab === tab.value ? "bodyStrong" : "body"}
              color={activeTab === tab.value ? undefined : "default2"}
            >
              {tab.label}
            </Text>
          </Box>
        ))}
      </Box>

      {/* Tab Content */}
      {activeTab === "general" && <GeneralSettings />}
      {activeTab === "fraud" && <FraudSettings />}
      {activeTab === "ip-whitelist" && <IpWhitelistSettings />}
      {activeTab === "blacklist" && <BlacklistSettings />}
    </Box>
  );
}

export default function SettingsPage() {
  const { appBridgeState } = useAppBridge();

  if (!appBridgeState?.ready) {
    return (
      <Box padding={8}>
        <Text>Connecting to Saleor Dashboard...</Text>
      </Box>
    );
  }

  return <SettingsContent />;
}
