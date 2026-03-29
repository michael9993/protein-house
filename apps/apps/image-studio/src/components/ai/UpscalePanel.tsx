import { useState, useCallback, useRef, useEffect } from "react";
import { trpcClient } from "@/modules/trpc/trpc-client";
import { AIProcessingOverlay } from "./AIProcessingOverlay";

interface UpscalePanelProps {
  getSelectedImageBase64: () => string | null;
  onResult: (resultBase64: string) => void;
}

const POLL_INTERVAL = 3000;

type QualityMode = "fast" | "standard" | "full";

const QUALITY_MODES: { id: QualityMode; label: string; maxSize: number | null; description: string }[] = [
  { id: "fast", label: "Fast", maxSize: 1024, description: "Max 1024px input, ~30s" },
  { id: "standard", label: "Standard", maxSize: 2048, description: "Max 2048px input, ~60s" },
  { id: "full", label: "Full Quality", maxSize: null, description: "Original resolution, 2-5 min" },
];

/**
 * Optionally downscale image before sending to ESRGAN.
 * In "full" quality mode, no downscaling occurs — the ESRGAN server handles
 * large images via 256px tile processing.
 */
function downscaleBase64(base64: string, maxSize: number | null): Promise<string> {
  if (maxSize === null) return Promise.resolve(base64);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const { width, height } = img;
      if (width <= maxSize && height <= maxSize) {
        resolve(base64);
        return;
      }
      const ratio = Math.min(maxSize / width, maxSize / height);
      const newW = Math.round(width * ratio);
      const newH = Math.round(height * ratio);
      const canvas = document.createElement("canvas");
      canvas.width = newW;
      canvas.height = newH;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(base64);
        return;
      }
      ctx.drawImage(img, 0, 0, newW, newH);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => reject(new Error("Failed to load image for downscaling"));
    img.src = base64;
  });
}

export function UpscalePanel({
  getSelectedImageBase64,
  onResult,
}: UpscalePanelProps) {
  const [scale, setScale] = useState<"2" | "3" | "4">("2");
  const [qualityMode, setQualityMode] = useState<QualityMode>("standard");
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState("");
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const jobIdRef = useRef<string | null>(null);

  const startMutation = trpcClient.ai.upscaleStart.useMutation();
  const utils = trpcClient.useContext();

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  const pollForResult = useCallback(
    (jobId: string) => {
      let elapsed = 0;
      pollingRef.current = setInterval(async () => {
        elapsed += POLL_INTERVAL;
        const mins = Math.floor(elapsed / 60000);
        const secs = Math.floor((elapsed % 60000) / 1000);
        setProgress(
          mins > 0 ? `Processing... ${mins}m ${secs}s` : `Processing... ${secs}s`
        );

        try {
          const result = await utils.ai.upscaleStatus.fetch({ jobId });

          if (result.status === "complete" && result.resultBase64) {
            if (pollingRef.current) clearInterval(pollingRef.current);
            pollingRef.current = null;
            jobIdRef.current = null;
            setIsProcessing(false);
            setProgress("");
            onResult(result.resultBase64);
          } else if (result.status === "error") {
            if (pollingRef.current) clearInterval(pollingRef.current);
            pollingRef.current = null;
            jobIdRef.current = null;
            setIsProcessing(false);
            setProgress("");
            setError(result.error ?? "Upscaling failed");
          }
          // "processing" → keep polling
        } catch (err) {
          // Network error during poll — keep trying unless too long
          if (elapsed > 5 * 60 * 1000) {
            if (pollingRef.current) clearInterval(pollingRef.current);
            pollingRef.current = null;
            jobIdRef.current = null;
            setIsProcessing(false);
            setProgress("");
            setError("Upscaling timed out after 5 minutes");
          }
        }
      }, POLL_INTERVAL);
    },
    [utils, onResult]
  );

  const handleUpscale = useCallback(async () => {
    setError(null);
    const base64 = getSelectedImageBase64();
    if (!base64) {
      setError("Select an image on the canvas first");
      return;
    }

    setIsProcessing(true);
    setProgress("Preparing image...");

    try {
      const selectedMode = QUALITY_MODES.find((m) => m.id === qualityMode)!;
      const optimized = await downscaleBase64(base64, selectedMode.maxSize);

      setProgress("Starting upscale...");
      const { jobId } = await startMutation.mutateAsync({
        imageBase64: optimized,
        scale,
      });

      jobIdRef.current = jobId;
      setProgress("Processing... 0s");
      pollForResult(jobId);
    } catch (err) {
      setIsProcessing(false);
      setProgress("");
      setError(err instanceof Error ? err.message : "Failed to start upscaling");
    }
  }, [getSelectedImageBase64, scale, startMutation, pollForResult]);

  const handleCancel = useCallback(() => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    pollingRef.current = null;
    jobIdRef.current = null;
    setIsProcessing(false);
    setProgress("");
  }, []);

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
              disabled={isProcessing}
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

      {/* Quality Mode */}
      <div>
        <label className="text-[10px] text-muted-foreground">Quality Mode</label>
        <div className="flex gap-1.5 mt-1">
          {QUALITY_MODES.map((mode) => (
            <button
              key={mode.id}
              onClick={() => setQualityMode(mode.id)}
              disabled={isProcessing}
              className={`flex-1 py-1.5 text-[10px] rounded-md border transition-colors ${
                qualityMode === mode.id
                  ? "border-primary bg-primary/5 font-medium"
                  : "hover:bg-accent"
              }`}
              title={mode.description}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>

      {qualityMode === "full" && (
        <p className="text-[10px] text-amber-500">
          Full Quality sends the original resolution to ESRGAN. Processing may take 2-5 minutes for large images.
        </p>
      )}

      <button
        onClick={isProcessing ? handleCancel : handleUpscale}
        className={`w-full px-3 py-2 text-sm rounded-md ${
          isProcessing
            ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
            : "bg-primary text-primary-foreground hover:bg-primary/90"
        }`}
      >
        {isProcessing ? "Cancel" : `Upscale ${scale}x`}
      </button>

      {progress && (
        <p className="text-[10px] text-muted-foreground text-center">{progress}</p>
      )}

      <p className="text-[10px] text-muted-foreground">
        {qualityMode === "full"
          ? "Original resolution preserved. Processing time depends on image size."
          : `Images pre-scaled to max ${QUALITY_MODES.find((m) => m.id === qualityMode)!.maxSize}px before processing.`}
        {qualityMode === "fast"
          ? scale === "2" ? " ~30s" : scale === "3" ? " ~60s" : " ~90s"
          : qualityMode === "standard"
            ? scale === "2" ? " ~60s" : scale === "3" ? " ~120s" : " ~180s"
            : ""}
        {" typical."}
      </p>

      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}

      {isProcessing && (
        <AIProcessingOverlay message={progress || `Upscaling ${scale}x — this may take a while...`} />
      )}
    </div>
  );
}
