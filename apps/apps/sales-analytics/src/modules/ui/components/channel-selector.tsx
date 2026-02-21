import { ChevronDown } from "lucide-react";

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
    return <div className="w-48 h-10 bg-gray-100 rounded-lg animate-pulse" />;
  }

  if (channels.length === 0) {
    return <span className="text-sm text-text-muted">No channels available</span>;
  }

  const activeChannels = channels.filter((c) => c.isActive);
  const defaultValue = activeChannels[0]?.slug ?? "";

  return (
    <div className="relative">
      <select
        value={value ?? defaultValue}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none w-48 px-3 py-2 pr-8 text-sm border border-border rounded-lg bg-white text-text-primary hover:bg-surface focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-colors cursor-pointer"
      >
        {activeChannels.map((channel) => (
          <option key={channel.slug} value={channel.slug}>
            {channel.name} ({channel.currencyCode})
          </option>
        ))}
      </select>
      <ChevronDown
        size={16}
        className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
      />
    </div>
  );
}
