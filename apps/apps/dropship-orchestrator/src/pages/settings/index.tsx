import { useAppBridge } from "@saleor/app-sdk/app-bridge";
import { useState, useEffect } from "react";

import { trpcClient } from "@/modules/trpc/trpc-client";
import { NavBar } from "@/components/ui/NavBar";

type SettingsTab = "general" | "fraud" | "ip-whitelist" | "blacklist" | "returns";

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
    return <p className="text-sm">Loading general settings...</p>;
  }

  if (error) {
    return <p className="text-sm text-red-600">Error: {error.message}</p>;
  }

  return (
    <div className="flex flex-col gap-5">
      <h2 className="text-base font-semibold text-text-primary">General Configuration</h2>

      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center p-4 rounded-lg border border-border">
          <div>
            <span className="font-semibold block">Dropship Orchestrator Enabled</span>
            <span className="text-xs text-text-muted">Master switch for all dropshipping operations</span>
          </div>
          <button
            className={`px-2.5 py-1 text-sm font-medium rounded-md transition-colors ${
              enabled
                ? "text-white bg-brand hover:bg-brand-light"
                : "border border-border hover:bg-gray-50"
            }`}
            onClick={() => setEnabled(!enabled)}
          >
            {enabled ? "Enabled" : "Disabled"}
          </button>
        </div>

        <div className="flex justify-between items-center p-4 rounded-lg border border-border">
          <div>
            <span className="font-semibold block">Auto-Forward Orders</span>
            <span className="text-xs text-text-muted">
              Automatically forward orders to suppliers when payment is confirmed
            </span>
          </div>
          <button
            className={`px-2.5 py-1 text-sm font-medium rounded-md transition-colors ${
              autoForward
                ? "text-white bg-brand hover:bg-brand-light"
                : "border border-border hover:bg-gray-50"
            }`}
            onClick={() => setAutoForward(!autoForward)}
          >
            {autoForward ? "Auto" : "Manual"}
          </button>
        </div>

        <div className="flex justify-between items-center p-4 rounded-lg border border-border">
          <div>
            <span className="font-semibold block">Fraud Checks Enabled</span>
            <span className="text-xs text-text-muted">
              Run fraud detection rules before forwarding orders
            </span>
          </div>
          <button
            className={`px-2.5 py-1 text-sm font-medium rounded-md transition-colors ${
              fraudChecksEnabled
                ? "text-white bg-brand hover:bg-brand-light"
                : "border border-border hover:bg-gray-50"
            }`}
            onClick={() => setFraudChecksEnabled(!fraudChecksEnabled)}
          >
            {fraudChecksEnabled ? "Enabled" : "Disabled"}
          </button>
        </div>

        <div className="p-4 rounded-lg border border-border">
          <span className="font-semibold block mb-2">Cost Ceiling (%)</span>
          <span className="text-xs text-text-muted block mb-2">
            Maximum supplier cost as a percentage of the selling price.
            Orders exceeding this create an exception for review.
          </span>
          <input
            type="number"
            className="w-full px-2.5 py-1.5 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-brand/20"
            value={String(costCeilingPercent)}
            onChange={(e) => setCostCeilingPercent(Number(e.target.value))}
          />
        </div>

        <div className="p-4 rounded-lg border border-border">
          <span className="font-semibold block mb-2">Daily Spend Limit ($)</span>
          <span className="text-xs text-text-muted block mb-2">
            Maximum total spend on supplier orders per day. Pauses forwarding when exceeded.
          </span>
          <input
            type="number"
            className="w-full px-2.5 py-1.5 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-brand/20"
            value={String(dailySpendLimit)}
            onChange={(e) => setDailySpendLimit(Number(e.target.value))}
          />
        </div>
      </div>

      {saveMessage && (
        <div
          className={`p-3 rounded-lg text-sm ${
            saveMessage.type === "success"
              ? "bg-green-50 text-green-800"
              : "bg-red-50 text-red-800"
          }`}
        >
          {saveMessage.text}
        </div>
      )}

      <button
        className="px-3 py-1.5 text-sm font-medium text-white bg-brand rounded-md hover:bg-brand-light disabled:opacity-50 transition-colors"
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
      </button>
    </div>
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
    return <p className="text-sm">Loading fraud settings...</p>;
  }

  if (error) {
    return <p className="text-sm text-red-600">Error: {error.message}</p>;
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
    <div className="flex flex-col gap-5">
      <h2 className="text-base font-semibold text-text-primary">Fraud Detection Rules</h2>

      {/* Rule toggles */}
      <div className="flex flex-col gap-2">
        {allRules.map((rule) => (
          <div
            key={rule}
            className="flex justify-between items-center p-4 rounded-lg border border-border"
          >
            <span className="text-sm">{FRAUD_RULE_LABELS[rule] ?? rule}</span>
            <button
              className={`px-2.5 py-1 text-sm font-medium rounded-md transition-colors ${
                enabledRules.includes(rule)
                  ? "text-white bg-brand hover:bg-brand-light"
                  : "border border-border hover:bg-gray-50"
              }`}
              onClick={() => toggleRule(rule)}
            >
              {enabledRules.includes(rule) ? "On" : "Off"}
            </button>
          </div>
        ))}
      </div>

      {/* Thresholds */}
      <h2 className="text-base font-semibold text-text-primary">Thresholds</h2>
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 rounded-lg border border-border">
          <span className="font-semibold block mb-2">Max Orders Per Hour</span>
          <input
            type="number"
            className="w-full px-2.5 py-1.5 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-brand/20"
            value={String(maxOrdersPerHour)}
            onChange={(e) => setMaxOrdersPerHour(Number(e.target.value))}
          />
        </div>
        <div className="p-4 rounded-lg border border-border">
          <span className="font-semibold block mb-2">Max Spend Per 24h ($)</span>
          <input
            type="number"
            className="w-full px-2.5 py-1.5 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-brand/20"
            value={String(maxSpendPer24h)}
            onChange={(e) => setMaxSpendPer24h(Number(e.target.value))}
          />
        </div>
        <div className="p-4 rounded-lg border border-border">
          <span className="font-semibold block mb-2">High Value Threshold ($)</span>
          <input
            type="number"
            className="w-full px-2.5 py-1.5 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-brand/20"
            value={String(highValueThreshold)}
            onChange={(e) => setHighValueThreshold(Number(e.target.value))}
          />
        </div>
        <div className="p-4 rounded-lg border border-border">
          <span className="font-semibold block mb-2">New Customer High Value ($)</span>
          <input
            type="number"
            className="w-full px-2.5 py-1.5 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-brand/20"
            value={String(newCustomerHighValueThreshold)}
            onChange={(e) => setNewCustomerHighValueThreshold(Number(e.target.value))}
          />
        </div>
      </div>

      <div className="flex justify-between items-center p-4 rounded-lg border border-border">
        <div>
          <span className="font-semibold block">Billing/Shipping Mismatch Blocking</span>
          <span className="text-xs text-text-muted">
            Block orders (not just flag) when billing and shipping addresses differ
          </span>
        </div>
        <button
          className={`px-2.5 py-1 text-sm font-medium rounded-md transition-colors ${
            billingShippingMismatchBlocking
              ? "text-white bg-brand hover:bg-brand-light"
              : "border border-border hover:bg-gray-50"
          }`}
          onClick={() => setBillingShippingMismatchBlocking(!billingShippingMismatchBlocking)}
        >
          {billingShippingMismatchBlocking ? "Blocking" : "Flag Only"}
        </button>
      </div>

      {saveMessage && (
        <div
          className={`p-3 rounded-lg text-sm ${
            saveMessage.type === "success"
              ? "bg-green-50 text-green-800"
              : "bg-red-50 text-red-800"
          }`}
        >
          {saveMessage.text}
        </div>
      )}

      <button
        className="px-3 py-1.5 text-sm font-medium text-white bg-brand rounded-md hover:bg-brand-light disabled:opacity-50 transition-colors"
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
      </button>
    </div>
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
    return <p className="text-sm">Loading IP whitelist...</p>;
  }

  if (error) {
    return <p className="text-sm text-red-600">Error: {error.message}</p>;
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
    <div className="flex flex-col gap-5">
      <h2 className="text-base font-semibold text-text-primary">IP Whitelist for CJ Webhooks</h2>
      <p className="text-sm text-text-muted">
        When enabled, only requests from these IP addresses will be accepted for CJ webhook endpoints.
      </p>

      <div className="flex justify-between items-center p-4 rounded-lg border border-border">
        <span className="font-semibold">IP Whitelist Enabled</span>
        <button
          className={`px-2.5 py-1 text-sm font-medium rounded-md transition-colors ${
            whitelistEnabled
              ? "text-white bg-brand hover:bg-brand-light"
              : "border border-border hover:bg-gray-50"
          }`}
          onClick={() => setWhitelistEnabled(!whitelistEnabled)}
        >
          {whitelistEnabled ? "Enabled" : "Disabled"}
        </button>
      </div>

      {/* Add IP */}
      <div className="flex gap-2 items-end">
        <div className="flex-1">
          <span className="text-xs text-text-muted block mb-1">Add IP Address</span>
          <input
            className="w-full px-2.5 py-1.5 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-brand/20"
            value={newIp}
            onChange={(e) => setNewIp(e.target.value)}
            placeholder="e.g. 203.0.113.50"
            onKeyDown={(e) => {
              if (e.key === "Enter") addIp();
            }}
          />
        </div>
        <button
          className="px-2.5 py-1 text-sm font-medium border border-border rounded-md hover:bg-gray-50 disabled:opacity-50 transition-colors"
          onClick={addIp}
        >
          Add
        </button>
      </div>

      {/* IP List */}
      <div className="flex flex-col gap-1">
        {ips.map((ip) => (
          <div
            key={ip}
            className="flex justify-between items-center p-3 rounded-lg border border-border"
          >
            <span className="text-xs">{ip}</span>
            <button
              className="px-2.5 py-1 text-sm font-medium text-text-muted hover:text-text-primary disabled:opacity-50 transition-colors"
              onClick={() => removeIp(ip)}
            >
              Remove
            </button>
          </div>
        ))}
        {ips.length === 0 && (
          <span className="text-xs text-text-muted">
            No IPs whitelisted. All webhook requests will be accepted.
          </span>
        )}
      </div>

      {saveMessage && (
        <div
          className={`p-3 rounded-lg text-sm ${
            saveMessage.type === "success"
              ? "bg-green-50 text-green-800"
              : "bg-red-50 text-red-800"
          }`}
        >
          {saveMessage.text}
        </div>
      )}

      <button
        className="px-3 py-1.5 text-sm font-medium text-white bg-brand rounded-md hover:bg-brand-light disabled:opacity-50 transition-colors"
        disabled={updateMutation.isLoading}
        onClick={() =>
          updateMutation.mutate({
            enabled: whitelistEnabled,
            allowedIps: ips,
          })
        }
      >
        {updateMutation.isLoading ? "Saving..." : "Save IP Whitelist"}
      </button>
    </div>
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
    return <p className="text-sm">Loading blacklist...</p>;
  }

  if (error) {
    return <p className="text-sm text-red-600">Error: {error.message}</p>;
  }

  const typeOptions = [
    { value: "email" as const, label: "Email" },
    { value: "address" as const, label: "Address" },
    { value: "phone" as const, label: "Phone" },
    { value: "ip" as const, label: "IP" },
  ];

  return (
    <div className="flex flex-col gap-5">
      <h2 className="text-base font-semibold text-text-primary">Blacklist Management</h2>
      <p className="text-sm text-text-muted">
        Orders matching blacklisted entries will be flagged for review.
      </p>

      {/* Add entry */}
      <div className="p-4 rounded-lg border border-border flex flex-col gap-3">
        <span className="font-semibold">Add Entry</span>
        <div className="flex gap-2 flex-wrap">
          {typeOptions.map((opt) => (
            <button
              key={opt.value}
              className={`px-2.5 py-1 text-sm font-medium rounded-md transition-colors ${
                newType === opt.value
                  ? "text-white bg-brand hover:bg-brand-light"
                  : "text-text-muted hover:text-text-primary"
              }`}
              onClick={() => setNewType(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <input
          className="w-full px-2.5 py-1.5 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-brand/20"
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          placeholder={`Enter ${newType} to blacklist`}
        />
        <input
          className="w-full px-2.5 py-1.5 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-brand/20"
          value={newReason}
          onChange={(e) => setNewReason(e.target.value)}
          placeholder="Reason for blacklisting"
        />
        <button
          className="px-2.5 py-1 text-sm font-medium text-white bg-brand rounded-md hover:bg-brand-light disabled:opacity-50 transition-colors"
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
        </button>
      </div>

      {/* Blacklist table */}
      <div className="flex flex-col gap-1">
        {/* Header */}
        <div
          className="grid gap-2 px-4 py-2 bg-gray-50 rounded-lg"
          style={{ gridTemplateColumns: "80px 1fr 1fr 140px 80px" }}
        >
          <span className="text-xs text-text-muted">Type</span>
          <span className="text-xs text-text-muted">Value</span>
          <span className="text-xs text-text-muted">Reason</span>
          <span className="text-xs text-text-muted">Added</span>
          <span className="text-xs text-text-muted">Action</span>
        </div>

        {blacklist?.map((entry, idx) => (
          <div
            key={`${entry.type}-${entry.value}-${idx}`}
            className="grid gap-2 px-4 py-3 border border-border rounded-lg items-center"
            style={{ gridTemplateColumns: "80px 1fr 1fr 140px 80px" }}
          >
            <span className="inline-block px-2 py-1 rounded-lg bg-gray-100 text-xs">
              {entry.type.toUpperCase()}
            </span>
            <span className="text-xs break-all">{entry.value}</span>
            <span className="text-xs text-text-muted">{entry.reason}</span>
            <span className="text-xs text-text-muted">
              {new Date(entry.addedAt).toLocaleDateString()}
            </span>
            <button
              className="px-2.5 py-1 text-sm font-medium text-text-muted hover:text-text-primary disabled:opacity-50 transition-colors"
              disabled={removeMutation.isLoading}
              onClick={() =>
                removeMutation.mutate({ type: entry.type, value: entry.value })
              }
            >
              Remove
            </button>
          </div>
        ))}

        {(!blacklist || blacklist.length === 0) && (
          <div className="p-6 flex justify-center">
            <span className="text-sm text-text-muted">No blacklist entries.</span>
          </div>
        )}
      </div>
    </div>
  );
}

function ReturnsSettings() {
  const { data, isLoading, error, refetch } = trpcClient.settings.getReturnsConfig.useQuery();
  const updateMutation = trpcClient.settings.updateReturnsConfig.useMutation({
    onSuccess: () => {
      setSaveMessage({ type: "success", text: "Returns settings saved" });
      refetch();
      setTimeout(() => setSaveMessage(null), 3000);
    },
    onError: (err) => {
      setSaveMessage({ type: "error", text: err.message });
    },
  });

  const [enabled, setEnabled] = useState(true);
  const [autoCreateFromRefund, setAutoCreateFromRefund] = useState(false);
  const [autoRefundOnReceipt, setAutoRefundOnReceipt] = useState(false);
  const [autoCancelSupplierOnApproval, setAutoCancelSupplierOnApproval] = useState(false);
  const [autoCreateSaleorRefund, setAutoCreateSaleorRefund] = useState(false);
  const [cjWindow, setCjWindow] = useState(15);
  const [aliexpressWindow, setAliexpressWindow] = useState(30);
  const [reasons, setReasons] = useState("");
  const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (data) {
      setEnabled(data.enabled);
      setAutoCreateFromRefund(data.autoCreateFromRefund);
      setAutoRefundOnReceipt(data.autoRefundOnReceipt);
      setAutoCancelSupplierOnApproval(data.autoCancelSupplierOnApproval);
      setAutoCreateSaleorRefund(data.autoCreateSaleorRefund);
      setCjWindow(data.returnWindowDays?.cj ?? 15);
      setAliexpressWindow(data.returnWindowDays?.aliexpress ?? 30);
      setReasons((data.allowedReasons ?? []).join(", "));
    }
  }, [data]);

  if (isLoading) return <p className="text-sm">Loading returns settings...</p>;
  if (error) return <p className="text-sm text-red-600">Error: {error.message}</p>;

  const toggleBtn = (value: boolean, setter: (v: boolean) => void, onLabel = "Enabled", offLabel = "Disabled") => (
    <button
      className={`px-2.5 py-1 text-sm font-medium rounded-md transition-colors ${
        value ? "text-white bg-brand hover:bg-brand-light" : "border border-border hover:bg-gray-50"
      }`}
      onClick={() => setter(!value)}
    >
      {value ? onLabel : offLabel}
    </button>
  );

  const toggleRow = (label: string, description: string, value: boolean, setter: (v: boolean) => void) => (
    <div className="flex justify-between items-center p-4 rounded-lg border border-border">
      <div>
        <span className="font-semibold block">{label}</span>
        <span className="text-xs text-text-muted">{description}</span>
      </div>
      {toggleBtn(value, setter)}
    </div>
  );

  return (
    <div className="flex flex-col gap-5">
      <h2 className="text-base font-semibold text-text-primary">Returns Configuration</h2>

      <div className="flex flex-col gap-4">
        {toggleRow("Returns Enabled", "Master switch for the returns system", enabled, setEnabled)}
        {toggleRow("Auto-Create from Refund", "Auto-create return when order is refunded in Saleor", autoCreateFromRefund, setAutoCreateFromRefund)}
        {toggleRow("Auto-Refund on Receipt", "Auto-mark as refunded when shipped back", autoRefundOnReceipt, setAutoRefundOnReceipt)}
        {toggleRow("Auto-Cancel Supplier on Approval", "Auto-cancel supplier order when return approved", autoCancelSupplierOnApproval, setAutoCancelSupplierOnApproval)}
        {toggleRow("Auto-Create Saleor Refund", "Create Saleor refund when marking return as refunded", autoCreateSaleorRefund, setAutoCreateSaleorRefund)}
      </div>

      <h2 className="text-base font-semibold text-text-primary">Return Windows</h2>
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 rounded-lg border border-border">
          <span className="font-semibold block mb-2">CJ Dropshipping (days)</span>
          <span className="text-xs text-text-muted block mb-2">0 = unlimited</span>
          <input
            type="number"
            min="0"
            className="w-full px-2.5 py-1.5 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-brand/20"
            value={String(cjWindow)}
            onChange={(e) => setCjWindow(Number(e.target.value))}
          />
        </div>
        <div className="p-4 rounded-lg border border-border">
          <span className="font-semibold block mb-2">AliExpress (days)</span>
          <span className="text-xs text-text-muted block mb-2">0 = unlimited</span>
          <input
            type="number"
            min="0"
            className="w-full px-2.5 py-1.5 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-brand/20"
            value={String(aliexpressWindow)}
            onChange={(e) => setAliexpressWindow(Number(e.target.value))}
          />
        </div>
      </div>

      <h2 className="text-base font-semibold text-text-primary">Allowed Reasons</h2>
      <div className="p-4 rounded-lg border border-border">
        <span className="text-xs text-text-muted block mb-2">Comma-separated list. Leave empty for freeform.</span>
        <input
          className="w-full px-2.5 py-1.5 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-brand/20"
          value={reasons}
          onChange={(e) => setReasons(e.target.value)}
          placeholder="Defective/damaged, Wrong item, ..."
        />
      </div>

      {saveMessage && (
        <div className={`p-3 rounded-lg text-sm ${saveMessage.type === "success" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}>
          {saveMessage.text}
        </div>
      )}

      <button
        className="px-3 py-1.5 text-sm font-medium text-white bg-brand rounded-md hover:bg-brand-light disabled:opacity-50 transition-colors"
        disabled={updateMutation.isLoading}
        onClick={() =>
          updateMutation.mutate({
            enabled,
            autoCreateFromRefund,
            autoRefundOnReceipt,
            autoCancelSupplierOnApproval,
            autoCreateSaleorRefund,
            returnWindowDays: { cj: cjWindow, aliexpress: aliexpressWindow },
            allowedReasons: reasons
              .split(",")
              .map((r) => r.trim())
              .filter(Boolean),
          })
        }
      >
        {updateMutation.isLoading ? "Saving..." : "Save Returns Settings"}
      </button>
    </div>
  );
}

function SettingsContent() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("general");

  const tabs: Array<{ value: SettingsTab; label: string }> = [
    { value: "general", label: "General" },
    { value: "fraud", label: "Fraud Detection" },
    { value: "ip-whitelist", label: "IP Whitelist" },
    { value: "blacklist", label: "Blacklist" },
    { value: "returns", label: "Returns" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <NavBar />

      <div>
        <h1 className="text-xl font-semibold text-text-primary">Settings</h1>
        <p className="text-sm text-text-muted">Configure dropshipping rules, fraud detection, and security</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors duration-150 ${
              activeTab === tab.value
                ? "border-brand text-brand"
                : "border-transparent text-text-muted hover:text-text-primary hover:border-gray-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "general" && <GeneralSettings />}
      {activeTab === "fraud" && <FraudSettings />}
      {activeTab === "ip-whitelist" && <IpWhitelistSettings />}
      {activeTab === "blacklist" && <BlacklistSettings />}
      {activeTab === "returns" && <ReturnsSettings />}
    </div>
  );
}

export default function SettingsPage() {
  const { appBridgeState } = useAppBridge();

  if (!appBridgeState?.ready) {
    return (
      <div className="p-8">
        <p className="text-sm">Connecting to Saleor Dashboard...</p>
      </div>
    );
  }

  return <SettingsContent />;
}
