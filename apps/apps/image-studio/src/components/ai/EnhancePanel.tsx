import { useState, useCallback } from "react";
import { trpcClient } from "@/modules/trpc/trpc-client";
import { AIProcessingOverlay } from "./AIProcessingOverlay";

interface EnhancePanelProps {
  getSelectedImageBase64: () => string | null;
  onResult: (resultBase64: string) => void;
}

export function EnhancePanel({
  getSelectedImageBase64,
  onResult,
}: EnhancePanelProps) {
  const [brightness, setBrightness] = useState(1);
  const [saturation, setSaturation] = useState(1);
  const [contrast, setContrast] = useState(1);
  const [sharpness, setSharpness] = useState(0);
  const [hue, setHue] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const mutation = trpcClient.enhance.adjustColors.useMutation({
    onSuccess: (data) => {
      if (data.resultBase64) {
        onResult(data.resultBase64);
      }
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const handleApply = useCallback(() => {
    setError(null);
    const base64 = getSelectedImageBase64();
    if (!base64) {
      setError("Select an image on the canvas first");
      return;
    }
    mutation.mutate({
      imageBase64: base64,
      brightness,
      saturation,
      hue,
      contrast,
      sharpness,
    });
  }, [getSelectedImageBase64, brightness, saturation, contrast, sharpness, hue, mutation]);

  const handleReset = useCallback(() => {
    setBrightness(1);
    setSaturation(1);
    setContrast(1);
    setSharpness(0);
    setHue(0);
  }, []);

  return (
    <div className="space-y-3">
      <div>
        <h4 className="text-xs font-semibold uppercase text-muted-foreground">Enhance</h4>
        <p className="text-[10px] text-muted-foreground mt-0.5">
          Adjust image properties (server-side processing)
        </p>
      </div>

      {/* Brightness */}
      <div>
        <label className="text-[10px] text-muted-foreground flex justify-between">
          <span>Brightness</span>
          <span>{Math.round(brightness * 100)}%</span>
        </label>
        <input
          type="range"
          min="0.2"
          max="2"
          step="0.05"
          value={brightness}
          onChange={(e) => setBrightness(parseFloat(e.target.value))}
          className="w-full h-1.5 mt-1"
        />
      </div>

      {/* Contrast */}
      <div>
        <label className="text-[10px] text-muted-foreground flex justify-between">
          <span>Contrast</span>
          <span>{Math.round(contrast * 100)}%</span>
        </label>
        <input
          type="range"
          min="0.1"
          max="3"
          step="0.05"
          value={contrast}
          onChange={(e) => setContrast(parseFloat(e.target.value))}
          className="w-full h-1.5 mt-1"
        />
      </div>

      {/* Saturation */}
      <div>
        <label className="text-[10px] text-muted-foreground flex justify-between">
          <span>Saturation</span>
          <span>{Math.round(saturation * 100)}%</span>
        </label>
        <input
          type="range"
          min="0"
          max="2"
          step="0.05"
          value={saturation}
          onChange={(e) => setSaturation(parseFloat(e.target.value))}
          className="w-full h-1.5 mt-1"
        />
      </div>

      {/* Sharpness */}
      <div>
        <label className="text-[10px] text-muted-foreground flex justify-between">
          <span>Sharpness</span>
          <span>{sharpness > 0 ? `+${sharpness.toFixed(1)}` : "Off"}</span>
        </label>
        <input
          type="range"
          min="0"
          max="10"
          step="0.5"
          value={sharpness}
          onChange={(e) => setSharpness(parseFloat(e.target.value))}
          className="w-full h-1.5 mt-1"
        />
      </div>

      {/* Hue Rotation */}
      <div>
        <label className="text-[10px] text-muted-foreground flex justify-between">
          <span>Hue Rotation</span>
          <span>{hue}°</span>
        </label>
        <input
          type="range"
          min="0"
          max="360"
          step="5"
          value={hue}
          onChange={(e) => setHue(parseInt(e.target.value))}
          className="w-full h-1.5 mt-1"
        />
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleReset}
          className="flex-1 px-3 py-1.5 text-xs rounded-md border hover:bg-accent"
        >
          Reset
        </button>
        <button
          onClick={handleApply}
          disabled={mutation.isLoading}
          className="flex-1 px-3 py-1.5 text-xs rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {mutation.isLoading ? "..." : "Apply"}
        </button>
      </div>

      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}

      {mutation.isLoading && (
        <AIProcessingOverlay message="Enhancing image..." />
      )}
    </div>
  );
}
