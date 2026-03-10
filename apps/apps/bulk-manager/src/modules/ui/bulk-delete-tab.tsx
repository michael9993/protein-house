import { Box, Text, Button } from "@saleor/macaw-ui";
import { useState, useCallback } from "react";
import { colors } from "@/modules/ui/app-layout";

interface BulkDeleteTabProps {
  entityLabel: string;
  onDelete: (ids: string[]) => Promise<{ count: number }>;
}

export function BulkDeleteTab({ entityLabel, onDelete }: BulkDeleteTabProps) {
  const [idsText, setIdsText] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [result, setResult] = useState<{ count: number; error?: string } | null>(null);

  const ids = idsText
    .trim()
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const handleDelete = useCallback(async () => {
    if (ids.length === 0) return;
    setLoading(true);
    setResult(null);
    setConfirming(false);

    try {
      const res = await onDelete(ids);
      setResult({ count: res.count });
      setIdsText("");
    } catch (error) {
      setResult({
        count: 0,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setLoading(false);
    }
  }, [ids, onDelete]);

  return (
    <Box>
      <Box
        padding={4}
        borderRadius={4}
        __border="1px solid #fecaca"
        __backgroundColor="#fef2f2"
        marginBottom={4}
      >
        <Text size={2} __color="#991b1b" __fontWeight="500" __display="block" marginBottom={1}>
          Warning: Deletion is permanent
        </Text>
        <Text size={1} __color="#b91c1c">
          Deleted {entityLabel.toLowerCase()} cannot be recovered. Make sure you have a backup before proceeding.
        </Text>
      </Box>

      <Box marginBottom={4}>
        <Text size={2} __fontWeight="500" __display="block" marginBottom={2}>
          {entityLabel} IDs (one per line)
        </Text>
        <Text size={1} __color={colors.textLight} __display="block" marginBottom={2}>
          Paste the Saleor IDs of the {entityLabel.toLowerCase()} you want to delete.
          You can find IDs in the export data (first column).
        </Text>
        <textarea
          value={idsText}
          onChange={(e) => {
            setIdsText(e.target.value);
            setConfirming(false);
            setResult(null);
          }}
          placeholder={"Q2F0ZWdvcnk6MQ==\nQ2F0ZWdvcnk6Mg==\nQ2F0ZWdvcnk6Mw=="}
          rows={8}
          style={{
            width: "100%",
            padding: "12px",
            border: `1px solid ${colors.inputBorder}`,
            borderRadius: "6px",
            fontSize: "14px",
            fontFamily: "monospace",
            resize: "vertical",
          }}
        />
      </Box>

      <Box display="flex" gap={3} alignItems="center" marginBottom={4}>
        {!confirming ? (
          <Button
            onClick={() => setConfirming(true)}
            disabled={ids.length === 0 || loading}
            variant="error"
          >
            Delete {ids.length > 0 ? `${ids.length} ${entityLabel}` : entityLabel}
          </Button>
        ) : (
          <>
            <Button onClick={handleDelete} disabled={loading} variant="error">
              {loading ? "Deleting..." : `Confirm Delete ${ids.length} ${entityLabel}`}
            </Button>
            <Button
              onClick={() => setConfirming(false)}
              disabled={loading}
              variant="secondary"
            >
              Cancel
            </Button>
          </>
        )}
        {ids.length > 0 && !confirming && (
          <Text size={2} __color={colors.textMuted}>
            {ids.length} {ids.length === 1 ? "item" : "items"} selected
          </Text>
        )}
      </Box>

      {result && (
        <Box
          padding={4}
          borderRadius={4}
          __border={result.error ? "1px solid #fecaca" : "1px solid #bbf7d0"}
          __backgroundColor={result.error ? "#fef2f2" : "#f0fdf4"}
        >
          {result.error ? (
            <Text size={2} __color="#991b1b">
              Delete failed: {result.error}
            </Text>
          ) : (
            <Text size={2} __color="#166534">
              Successfully deleted {result.count} {entityLabel.toLowerCase()}.
            </Text>
          )}
        </Box>
      )}
    </Box>
  );
}
