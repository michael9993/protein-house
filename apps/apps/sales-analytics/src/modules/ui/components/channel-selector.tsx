import { Select, SelectItem, Text } from "@tremor/react";

interface Channel {
  id: string;
  slug: string;
  name: string;
  currencyCode: string;
  isActive: boolean;
}

interface ChannelSelectorProps {
  channels: Channel[];
  value: string | undefined;
  onChange: (channelSlug: string) => void;
  isLoading?: boolean;
}

export function ChannelSelector({
  channels,
  value,
  onChange,
  isLoading,
}: ChannelSelectorProps) {
  if (isLoading) {
    return (
      <div className="w-48 h-10 bg-gray-100 rounded animate-pulse" />
    );
  }

  if (channels.length === 0) {
    return (
      <Text color="gray" className="text-sm">
        No channels available
      </Text>
    );
  }

  const handleChange = (newValue: string) => {
    onChange(newValue);
  };

  // Default to first active channel if no value is set
  const activeChannels = channels.filter((c) => c.isActive);
  const defaultValue = activeChannels[0]?.slug ?? "";

  return (
    <Select
      value={value ?? defaultValue}
      onValueChange={handleChange}
      placeholder="Select channel"
      className="w-48"
    >
      {activeChannels.map((channel) => (
        <SelectItem key={channel.slug} value={channel.slug}>
          {channel.name} ({channel.currencyCode})
        </SelectItem>
      ))}
    </Select>
  );
}
