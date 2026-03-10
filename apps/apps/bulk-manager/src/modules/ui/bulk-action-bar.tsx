import { Box, Text, Button } from "@saleor/macaw-ui";
import { colors } from "@/modules/ui/app-layout";

interface BulkActionBarProps {
  selectedCount: number;
  onDelete?: () => void;
  onDeselect: () => void;
  isDeleting?: boolean;
  entityLabel: string;
}

export function BulkActionBar({
  selectedCount,
  onDelete,
  onDeselect,
  isDeleting = false,
  entityLabel,
}: BulkActionBarProps) {
  if (selectedCount === 0) return null;

  return (
    <Box
      display="flex"
      alignItems="center"
      gap={4}
      padding={3}
      borderRadius={4}
      __backgroundColor={colors.accentBg}
      __border={`1px solid ${colors.border}`}
      marginBottom={4}
    >
      <Text size={3} __fontWeight="500" __color={colors.brand}>
        {selectedCount} {entityLabel.toLowerCase()} selected
      </Text>

      <Box __flex="1" />

      <Button onClick={onDeselect} variant="secondary" size="small">
        Deselect All
      </Button>

      {onDelete && (
        <Button
          onClick={onDelete}
          variant="error"
          size="small"
          disabled={isDeleting}
        >
          {isDeleting ? "Deleting..." : `Delete Selected`}
        </Button>
      )}
    </Box>
  );
}
