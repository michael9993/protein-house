import { useState, useCallback } from "react";
import { trpcClient } from "@/modules/trpc/trpc-client";
import { AIProcessingOverlay } from "./AIProcessingOverlay";

interface BackgroundRemovalPanelProps {
  getSelectedImageBase64: () => string | null;
  onResult: (resultBase64: string) => void;
}

export function BackgroundRemovalPanel({
  getSelectedImageBase64,
  onResult,
}: BackgroundRemovalPanelProps) {
  const [error, setError] = useState<string | null>(null);

  const mutation = trpcClient.ai.removeBackground.useMutation({
    onSuccess: (data) => {
      if (data.resultBase64) {
        onResult(data.resultBase64);
      }
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const handleRemove = useCallback(() => {
    setError(null);
    const base64 = getSelectedImageBase64();
    if (!base64) {
      setError("Select an image on the canvas first");
      return;
    }
    mutation.mutate({ imageBase64: base64 });
  }, [getSelectedImageBase64, mutation]);

  return (
    <div className="space-y-3">
      <div>
        <h4 className="text-xs font-semibold uppercase text-muted-foreground">Background Removal</h4>
        <p className="text-[10px] text-muted-foreground mt-0.5">
          Remove the background from the selected image using AI
        </p>
      </div>

      <button
        onClick={handleRemove}
        disabled={mutation.isLoading}
        className="w-full px-3 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        {mutation.isLoading ? "Processing..." : "Remove Background"}
      </button>

      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}

      {mutation.isLoading && (
        <AIProcessingOverlay message="Removing background..." />
      )}
    </div>
  );
}
