import { useEffect } from "react";
import { Box, Text } from "@saleor/macaw-ui";
import { trpcClient } from "@/modules/trpc/trpc-client";

interface ChannelSelectProps {
  value: string;
  onChange: (slug: string) => void;
  label?: string;
  maxWidth?: string;
}

export function ChannelSelect({
  value,
  onChange,
  label = "Channel",
  maxWidth,
}: ChannelSelectProps) {
  const { data, isLoading } = trpcClient.channels.list.useQuery();

  const channels = data?.channels || [];

  // Auto-select the first channel when channels load and current value doesn't match any
  useEffect(() => {
    if (channels.length > 0 && !channels.some((ch) => ch.slug === value)) {
      onChange(channels[0].slug);
    }
  }, [channels, value, onChange]);

  return (
    <Box __flex="1" __minWidth="200px" __maxWidth={maxWidth}>
      <Text size={2} __fontWeight="500" __display="block" marginBottom={1}>
        {label}
      </Text>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={isLoading}
        style={{
          width: "100%",
          padding: "8px 12px",
          border: "1px solid #d1d5db",
          borderRadius: "6px",
          fontSize: "14px",
          backgroundColor: "#fff",
          cursor: isLoading ? "wait" : "pointer",
          appearance: "auto",
        }}
      >
        {isLoading && <option value={value}>Loading channels...</option>}
        {!isLoading && channels.length === 0 && (
          <option value={value}>No channels found</option>
        )}
        {channels.map((ch) => (
          <option key={ch.slug} value={ch.slug}>
            {ch.name} ({ch.currencyCode}){!ch.isActive ? " [inactive]" : ""}
          </option>
        ))}
      </select>
    </Box>
  );
}
