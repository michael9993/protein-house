import { Box, Text } from "@saleor/macaw-ui";
import { useState, useEffect, useRef } from "react";

interface ProgressBarProps {
  progress: number;
  total?: number;
  label?: string;
  /** Number of items processed so far */
  processed?: number;
  /** Name of the item currently being processed */
  currentItem?: string;
}

function formatTime(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${mins}m ${secs}s`;
}

export function ProgressBar({ progress, total, label, processed, currentItem }: ProgressBarProps) {
  const percentage = Math.min(Math.max(progress, 0), 100);
  const startTimeRef = useRef<number>(Date.now());
  const [elapsed, setElapsed] = useState(0);

  // Reset start time when progress resets to 0
  useEffect(() => {
    if (progress === 0) {
      startTimeRef.current = Date.now();
      setElapsed(0);
    }
  }, [progress]);

  // Tick elapsed time every second while in progress
  useEffect(() => {
    if (percentage >= 100) return;
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [percentage]);

  // Estimate remaining time
  const eta =
    percentage > 5 && percentage < 100
      ? formatTime((elapsed / percentage) * (100 - percentage))
      : undefined;

  return (
    <Box>
      {label && (
        <Text size={2} __color="#64748b" __display="block" marginBottom={2}>
          {label}
        </Text>
      )}

      {/* Current item label */}
      {currentItem && percentage < 100 && (
        <Text size={2} __color="#475569" __display="block" marginBottom={2} __fontStyle="italic">
          Processing: {currentItem}
        </Text>
      )}

      <Box
        __width="100%"
        __height="10px"
        borderRadius={4}
        __backgroundColor="#e5e7eb"
        __overflow="hidden"
      >
        <Box
          __width={`${percentage}%`}
          __height="100%"
          borderRadius={4}
          __backgroundColor={percentage >= 100 ? "#22c55e" : "#3b82f6"}
          __transition="width 0.3s ease"
        />
      </Box>

      <Box display="flex" justifyContent="space-between" marginTop={1}>
        <Box display="flex" gap={3}>
          <Text size={2} __color="#1e293b" __fontWeight="600">
            {percentage.toFixed(0)}%
          </Text>
          {elapsed > 0 && (
            <Text size={2} __color="#94a3b8">
              {formatTime(elapsed)} elapsed
            </Text>
          )}
          {eta && (
            <Text size={2} __color="#94a3b8">
              ~{eta} remaining
            </Text>
          )}
        </Box>
        {total !== undefined && processed !== undefined ? (
          <Text size={2} __color="#64748b" __fontWeight="500">
            {processed} / {total} items
          </Text>
        ) : total !== undefined ? (
          <Text size={2} __color="#94a3b8">
            {Math.round((percentage / 100) * total)} / {total} rows
          </Text>
        ) : null}
      </Box>
    </Box>
  );
}
