import { Box, Text } from "@saleor/macaw-ui";

interface NewsletterStats {
  total: number;
  active: number;
  inactive: number;
  bySource: Record<string, number>;
}

interface SubscriberStatsProps {
  stats: NewsletterStats | undefined;
  isLoading: boolean;
}

export const SubscriberStats = ({ stats, isLoading }: SubscriberStatsProps) => {
  if (isLoading) {
    return (
      <Box
        display="grid"
        gap={3}
        style={{
          gridTemplateColumns: "repeat(4, 1fr)",
        }}
      >
        <Box>
          <Text color="default2">Loading...</Text>
        </Box>
      </Box>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <Box
      display="grid"
      gap={3}
      style={{
        gridTemplateColumns: "repeat(4, 1fr)",
      }}
    >
      <Box padding={4} borderWidth={1} borderStyle="solid" borderColor="default1" borderRadius={2}>
        <Text size={1} color="default2">
          Total Subscribers
        </Text>
        <Text size={8} fontWeight="bold">
          {stats.total}
        </Text>
      </Box>
      <Box padding={4} borderWidth={1} borderStyle="solid" borderColor="default1" borderRadius={2}>
        <Text size={1} color="default2">
          Active
        </Text>
        <Text size={8} fontWeight="bold" color="success1">
          {stats.active}
        </Text>
      </Box>
      <Box padding={4} borderWidth={1} borderStyle="solid" borderColor="default1" borderRadius={2}>
        <Text size={1} color="default2">
          Inactive
        </Text>
        <Text size={8} fontWeight="bold" color="default2">
          {stats.inactive}
        </Text>
      </Box>
      <Box padding={4} borderWidth={1} borderStyle="solid" borderColor="default1" borderRadius={2}>
        <Text size={1} color="default2">
          Sources
        </Text>
        <Text size={8} fontWeight="bold">
          {Object.keys(stats.bySource).length}
        </Text>
      </Box>
    </Box>
  );
};
