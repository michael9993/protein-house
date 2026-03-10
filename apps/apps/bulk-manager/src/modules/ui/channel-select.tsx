import { useEffect } from "react";
import { Box, Text } from "@saleor/macaw-ui";
import { trpcClient } from "@/modules/trpc/trpc-client";
import { colors } from "@/modules/ui/app-layout";

interface ChannelSelectProps {
  value: string;
  onChange: (slug: string) => void;
  label?: string;
  maxWidth?: string;
}

interface MultiChannelSelectProps {
  value: string[];
  onChange: (slugs: string[]) => void;
  label?: string;
}

export function MultiChannelSelect({
  value,
  onChange,
  label = "Channels",
}: MultiChannelSelectProps) {
  const { data, isLoading } = trpcClient.channels.list.useQuery();

  const channels = data?.channels || [];

  // Auto-select all active channels on first load
  useEffect(() => {
    if (channels.length > 0 && value.length === 0) {
      onChange(channels.filter((ch) => ch.isActive).map((ch) => ch.slug));
    }
  }, [channels, value.length, onChange]);

  const toggle = (slug: string) => {
    if (value.includes(slug)) {
      if (value.length > 1) onChange(value.filter((s) => s !== slug));
    } else {
      onChange([...value, slug]);
    }
  };

  return (
    <Box __flex="1" __minWidth="200px">
      <Text size={2} __fontWeight="500" __display="block" marginBottom={1}>
        {label}
      </Text>
      {isLoading ? (
        <Text size={2} __color={colors.textLight}>Loading channels...</Text>
      ) : channels.length === 0 ? (
        <Text size={2} __color={colors.textLight}>No channels found</Text>
      ) : (
        <Box
          display="flex"
          gap={2}
          __flexWrap="wrap"
        >
          {channels.map((ch) => {
            const selected = value.includes(ch.slug);
            return (
              <label
                key={ch.slug}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "6px 12px",
                  border: `1.5px solid ${selected ? colors.brand : colors.inputBorder}`,
                  borderRadius: "6px",
                  fontSize: "13px",
                  fontWeight: selected ? 600 : 400,
                  backgroundColor: selected ? colors.accentBg : "#fff",
                  color: selected ? colors.brand : colors.textSecondary,
                  cursor: "pointer",
                  transition: "all 0.15s",
                  userSelect: "none",
                }}
              >
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={() => toggle(ch.slug)}
                  style={{ accentColor: colors.brand, margin: 0 }}
                />
                {ch.name} ({ch.currencyCode})
                {!ch.isActive && (
                  <span style={{ fontSize: "10px", color: colors.textLight }}>[inactive]</span>
                )}
              </label>
            );
          })}
        </Box>
      )}
    </Box>
  );
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
          border: `1px solid ${colors.inputBorder}`,
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
