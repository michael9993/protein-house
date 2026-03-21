import { useState } from "react";
import { useRouter } from "next/router";

import { trpcClient } from "@/modules/trpc/trpc-client";

export function ChannelConfigSection() {
  const router = useRouter();
  const utils = trpcClient.useUtils();
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const { data, isLoading } = trpcClient.appConfig.getPayPalConfigsList.useQuery();
  const { mutate: removeConfig } = trpcClient.appConfig.removePayPalConfig.useMutation({
    onSuccess: async () => {
      await utils.appConfig.getPayPalConfigsList.refetch();
      setRemovingId(null);
    },
    onError: () => {
      setRemovingId(null);
    },
  });

  const configs = data?.configs;

  if (isLoading) {
    return <p style={{ color: "#6b7280" }}>Loading configurations...</p>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {configs && configs.length > 0 ? (
        configs.map((config) => (
          <div
            key={config.id}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "12px 16px",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
            }}
          >
            <div>
              <p style={{ fontWeight: 600, fontSize: "14px" }}>{config.name}</p>
              <p style={{ fontSize: "12px", color: "#6b7280", fontFamily: "monospace" }}>
                Client ID: {config.clientId.slice(0, 20)}...
              </p>
              <p style={{ fontSize: "12px", color: "#6b7280" }}>
                Secret: {config.maskedClientSecret}
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              {confirmingId === config.id ? (
                <>
                  <span style={{ fontSize: "12px", color: "#dc2626" }}>Delete?</span>
                  <button
                    onClick={() => {
                      setConfirmingId(null);
                      setRemovingId(config.id);
                      removeConfig({ configId: config.id });
                    }}
                    style={{
                      padding: "4px 10px",
                      background: "#dc2626",
                      border: "none",
                      borderRadius: "4px",
                      color: "white",
                      fontSize: "12px",
                      cursor: "pointer",
                    }}
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => setConfirmingId(null)}
                    style={{
                      padding: "4px 10px",
                      background: "transparent",
                      border: "1px solid #d1d5db",
                      borderRadius: "4px",
                      color: "#6b7280",
                      fontSize: "12px",
                      cursor: "pointer",
                    }}
                  >
                    No
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setConfirmingId(config.id)}
                  disabled={removingId === config.id}
                  style={{
                    padding: "6px 12px",
                    background: "transparent",
                    border: `1px solid ${removingId === config.id ? "#9ca3af" : "#dc2626"}`,
                    borderRadius: "4px",
                    color: removingId === config.id ? "#9ca3af" : "#dc2626",
                    fontSize: "12px",
                    cursor: removingId === config.id ? "not-allowed" : "pointer",
                  }}
                >
                  {removingId === config.id ? "Removing..." : "Remove"}
                </button>
              )}
            </div>
          </div>
        ))
      ) : (
        <p style={{ color: "#6b7280", fontSize: "14px" }}>
          No PayPal configurations yet.
        </p>
      )}

      <button
        onClick={() => router.push("/config/new")}
        style={{
          padding: "10px 20px",
          background: "#0070ba",
          color: "white",
          border: "none",
          borderRadius: "6px",
          fontSize: "14px",
          fontWeight: 600,
          cursor: "pointer",
          alignSelf: "flex-start",
        }}
      >
        + Add PayPal Configuration
      </button>
    </div>
  );
}
