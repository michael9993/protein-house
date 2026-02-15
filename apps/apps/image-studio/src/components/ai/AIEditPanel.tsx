import { useState, useCallback } from "react";
import { trpcClient } from "@/modules/trpc/trpc-client";
import { AIProcessingOverlay } from "./AIProcessingOverlay";

interface AIEditPanelProps {
  getSelectedImageBase64: () => string | null;
  onResult: (resultBase64: string) => void;
}

const EDIT_SUGGESTIONS = [
  "Make the background white",
  "Add warm studio lighting",
  "Make it look vintage/retro",
  "Increase contrast and vibrancy",
  "Add soft shadow underneath",
  "Change to outdoor/nature setting",
  "Make it brighter and cleaner",
  "Add bokeh/blurred background",
];

export function AIEditPanel({
  getSelectedImageBase64,
  onResult,
}: AIEditPanelProps) {
  const [prompt, setPrompt] = useState("");
  const [error, setError] = useState<string | null>(null);

  const mutation = trpcClient.ai.aiEdit.useMutation({
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
    if (!prompt.trim()) return;
    setError(null);
    const base64 = getSelectedImageBase64();
    if (!base64) {
      setError("Select an image on the canvas first");
      return;
    }
    mutation.mutate({
      imageBase64: base64,
      prompt: prompt.trim(),
    });
  }, [getSelectedImageBase64, prompt, mutation]);

  return (
    <div className="space-y-3">
      <div>
        <h4 className="text-xs font-semibold uppercase text-muted-foreground">AI Edit</h4>
        <p className="text-[10px] text-muted-foreground mt-0.5">
          Describe how to modify the selected image
        </p>
      </div>

      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="e.g. Make the background a sunset scene..."
        rows={4}
        maxLength={1000}
        className="w-full px-2.5 py-2 text-xs rounded-md border bg-background resize-none"
      />

      <button
        onClick={handleApply}
        disabled={mutation.isLoading || !prompt.trim()}
        className="w-full px-3 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        {mutation.isLoading ? "Editing..." : "Apply Edit"}
      </button>

      {/* Quick suggestions */}
      <div>
        <p className="text-[10px] text-muted-foreground mb-1.5">Suggestions:</p>
        <div className="flex flex-wrap gap-1">
          {EDIT_SUGGESTIONS.map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => setPrompt(suggestion)}
              className="px-2 py-0.5 text-[10px] rounded-full border hover:bg-accent truncate max-w-full"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}

      {mutation.isLoading && (
        <AIProcessingOverlay message="AI editing image..." />
      )}
    </div>
  );
}
