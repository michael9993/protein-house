import { useState, useCallback } from "react";
import { trpcClient } from "@/modules/trpc/trpc-client";
import { AIProcessingOverlay } from "./AIProcessingOverlay";

interface UpscalePanelProps {
  getSelectedImageBase64: () => string | null;
  onResult: (resultBase64: string) => void;
}

export function UpscalePanel({
  getSelectedImageBase64,
  onResult,
}: UpscalePanelProps) {
  const [scale, setScale] = useState<"2" | "3" | "4">("2");
  const [error, setError] = useState<string | null>(null);

  const mutation = trpcClient.ai.upscale.useMutation({
    onSuccess: (data) => {
      if (data.resultBase64) {
        onResult(data.resultBase64);
      }
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const handleUpscale = useCallback(() => {
    setError(null);
    const base64 = getSelectedImageBase64();
    if (!base64) {
      setError("Select an image on the canvas first");
      return;
    }
    mutation.mutate({ imageBase64: base64, scale });
  }, [getSelectedImageBase64, scale, mutation]);

  return (
    <div className="space-y-3">
      <div>
        <h4 className="text-xs font-semibold uppercase text-muted-foreground">Upscale</h4>
        <p className="text-[10px] text-muted-foreground mt-0.5">
          Increase image resolution using AI
        </p>
      </div>

      <div>
        <label className="text-[10px] text-muted-foreground">Scale Factor</label>
        <div className="flex gap-1.5 mt-1">
          {(["2", "3", "4"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setScale(s)}
              className={`flex-1 py-1.5 text-xs rounded-md border transition-colors ${
                scale === s
                  ? "border-primary bg-primary/5 font-medium"
                  : "hover:bg-accent"
              }`}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={handleUpscale}
        disabled={mutation.isLoading}
        className="w-full px-3 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        {mutation.isLoading ? "Upscaling..." : `Upscale ${scale}x`}
      </button>

      <p className="text-[10px] text-muted-foreground">
        {scale === "2" ? "~30s" : scale === "3" ? "~60s" : "~120s"} on CPU
      </p>

      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}

      {mutation.isLoading && (
        <AIProcessingOverlay message={`Upscaling ${scale}x — this may take a while...`} />
      )}
    </div>
  );
}
