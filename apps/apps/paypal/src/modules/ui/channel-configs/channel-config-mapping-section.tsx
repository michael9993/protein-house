import { trpcClient } from "@/modules/trpc/trpc-client";

export function ChannelConfigMappingSection() {
  const utils = trpcClient.useUtils();
  const { data: channels, isLoading: channelsLoading } =
    trpcClient.appConfig.fetchChannels.useQuery();
  const { data, isLoading: configsLoading } =
    trpcClient.appConfig.getPayPalConfigsList.useQuery();
  const { mutate: updateMapping } = trpcClient.appConfig.updateMapping.useMutation({
    onSuccess: () => {
      void utils.appConfig.getPayPalConfigsList.invalidate();
    },
  });

  const configs = data?.configs;
  const channelMappings = data?.channelMappings ?? {};

  if (channelsLoading || configsLoading) {
    return <p style={{ color: "#6b7280" }}>Loading channels...</p>;
  }

  if (!channels || channels.length === 0) {
    return <p style={{ color: "#6b7280" }}>No channels found.</p>;
  }

  if (!configs || configs.length === 0) {
    return (
      <p style={{ color: "#6b7280" }}>
        Add a PayPal configuration first before mapping channels.
      </p>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {channels.map((channel) => (
        <div
          key={channel.id}
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
            <p style={{ fontWeight: 600, fontSize: "14px" }}>{channel.name}</p>
            <p style={{ fontSize: "12px", color: "#6b7280" }}>
              {channel.slug} — {channel.currencyCode}
            </p>
          </div>
          <select
            value={channelMappings[channel.id] ?? ""}
            onChange={(e) => {
              const configId = e.target.value;
              if (configId) {
                updateMapping({ configId, channelId: channel.id });
              }
            }}
            style={{
              padding: "6px 12px",
              border: "1px solid #d1d5db",
              borderRadius: "4px",
              fontSize: "14px",
              minWidth: "200px",
            }}
          >
            <option value="">Not configured</option>
            {configs.map((config) => (
              <option key={config.id} value={config.id}>
                {config.name}
              </option>
            ))}
          </select>
        </div>
      ))}
    </div>
  );
}
