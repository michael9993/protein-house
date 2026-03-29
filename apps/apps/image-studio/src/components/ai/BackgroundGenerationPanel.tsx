import { useState, useCallback } from "react";
import { trpcClient } from "@/modules/trpc/trpc-client";
import { AIProcessingOverlay } from "./AIProcessingOverlay";
import { ModelSelector } from "./ModelSelector";
import { ThinkingLevelControl } from "./ThinkingLevelControl";
import { AdvancedOptionsPanel } from "./AdvancedOptionsPanel";
import type { ThinkingLevel } from "@/modules/ai/types";

interface BackgroundGenerationPanelProps {
  onResult: (resultBase64: string) => void;
  canvasWidth: number;
  canvasHeight: number;
}

const PROMPT_SUGGESTIONS = [
  "Clean white studio background with soft shadows",
  "Marble surface with natural daylight",
  "Wooden table with blurred lifestyle background",
  "Gradient pastel background, minimalist",
  "Outdoor scene with soft bokeh, golden hour",
  "Modern interior with neutral tones",
  "Dark moody texture, product spotlight",
  "Concrete surface, industrial minimalism",
];

export function BackgroundGenerationPanel({
  onResult,
  canvasWidth,
  canvasHeight,
}: BackgroundGenerationPanelProps) {
  const [prompt, setPrompt] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [modelId, setModelId] = useState("");
  const [thinkingLevel, setThinkingLevel] = useState<ThinkingLevel>("none");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [seed, setSeed] = useState("");
  const [stylePreset, setStylePreset] = useState("");
  const [aspectRatio, setAspectRatio] = useState("");

  const { data: modelsData } = trpcClient.ai.getAvailableModels.useQuery();
  const selectedModel = modelsData?.models.find((m) => m.id === modelId) ?? modelsData?.models[0] ?? null;

  const mutation = trpcClient.ai.generateBackground.useMutation({
    onSuccess: (data) => {
      if (data.resultBase64) {
        onResult(data.resultBase64);
      }
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const handleGenerate = useCallback(() => {
    if (!prompt.trim()) return;
    setError(null);
    mutation.mutate({
      prompt: prompt.trim(),
      width: Math.min(canvasWidth, 1440),
      height: Math.min(canvasHeight, 1440),
      modelId: modelId || undefined,
      options: {
        negativePrompt: negativePrompt || undefined,
        seed: seed ? parseInt(seed) : undefined,
        stylePreset: stylePreset || undefined,
        thinkingLevel: thinkingLevel !== "none" ? thinkingLevel : undefined,
        aspectRatio: aspectRatio || undefined,
      },
    });
  }, [prompt, canvasWidth, canvasHeight, modelId, negativePrompt, seed, stylePreset, thinkingLevel, aspectRatio, mutation]);

  return (
    <div className="space-y-3">
      <div>
        <h4 className="text-xs font-semibold uppercase text-muted-foreground">AI Background</h4>
        <p className="text-[10px] text-muted-foreground mt-0.5">
          Generate a background from a text description
        </p>
      </div>

      <ModelSelector
        value={modelId}
        onChange={setModelId}
        disabled={mutation.isLoading}
      />

      {selectedModel?.capabilities.supportsThinking && (
        <ThinkingLevelControl
          value={thinkingLevel}
          onChange={setThinkingLevel}
          disabled={mutation.isLoading}
        />
      )}

      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Describe the background..."
        rows={3}
        className="w-full px-2.5 py-2 text-xs rounded-md border bg-background resize-none"
      />

      <AdvancedOptionsPanel
        capabilities={selectedModel?.capabilities ?? null}
        negativePrompt={negativePrompt}
        onNegativePromptChange={setNegativePrompt}
        seed={seed}
        onSeedChange={setSeed}
        stylePreset={stylePreset}
        onStylePresetChange={setStylePreset}
        aspectRatio={aspectRatio}
        onAspectRatioChange={setAspectRatio}
        disabled={mutation.isLoading}
      />

      <button
        onClick={handleGenerate}
        disabled={mutation.isLoading || !prompt.trim()}
        className="w-full px-3 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        {mutation.isLoading ? "Generating..." : "Generate Background"}
      </button>

      {/* Quick suggestions */}
      <div>
        <p className="text-[10px] text-muted-foreground mb-1.5">Suggestions:</p>
        <div className="flex flex-wrap gap-1">
          {PROMPT_SUGGESTIONS.map((suggestion) => (
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
        <AIProcessingOverlay message="Generating background..." />
      )}
    </div>
  );
}
