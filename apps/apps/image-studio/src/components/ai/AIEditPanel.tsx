import { useState, useCallback } from "react";
import { trpcClient } from "@/modules/trpc/trpc-client";
import { AIProcessingOverlay } from "./AIProcessingOverlay";
import { ModelSelector } from "./ModelSelector";
import { ThinkingLevelControl } from "./ThinkingLevelControl";
import { AdvancedOptionsPanel } from "./AdvancedOptionsPanel";
import type { ThinkingLevel } from "@/modules/ai/types";

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

type EditMode = "general" | "inpaint" | "style-transfer";

export function AIEditPanel({
  getSelectedImageBase64,
  onResult,
}: AIEditPanelProps) {
  const [prompt, setPrompt] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [modelId, setModelId] = useState("");
  const [thinkingLevel, setThinkingLevel] = useState<ThinkingLevel>("none");
  const [editMode, setEditMode] = useState<EditMode>("general");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [seed, setSeed] = useState("");
  const [stylePreset, setStylePreset] = useState("");
  const [aspectRatio, setAspectRatio] = useState("");
  const [strength, setStrength] = useState(0.65);

  const { data: modelsData } = trpcClient.ai.getAvailableModels.useQuery();
  const selectedModel = modelsData?.models.find((m) => m.id === modelId) ?? modelsData?.models[0] ?? null;

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
      modelId: modelId || undefined,
      editType: editMode,
      strength: selectedModel?.capabilities.supportsStrength ? strength : undefined,
      options: {
        negativePrompt: negativePrompt || undefined,
        seed: seed ? parseInt(seed) : undefined,
        stylePreset: stylePreset || undefined,
        thinkingLevel: thinkingLevel !== "none" ? thinkingLevel : undefined,
        aspectRatio: aspectRatio || undefined,
      },
    });
  }, [getSelectedImageBase64, prompt, modelId, editMode, strength, selectedModel, negativePrompt, seed, stylePreset, thinkingLevel, aspectRatio, mutation]);

  return (
    <div className="space-y-3">
      <div>
        <h4 className="text-xs font-semibold uppercase text-muted-foreground">AI Edit</h4>
        <p className="text-[10px] text-muted-foreground mt-0.5">
          Describe how to modify the selected image
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

      {/* Edit Mode */}
      <div>
        <label className="text-[10px] text-muted-foreground">Edit Mode</label>
        <div className="flex gap-1 mt-0.5">
          {(["general", "inpaint", "style-transfer"] as const).map((mode) => {
            const isDisabled = mode === "inpaint" && !selectedModel?.capabilities.supportsInpainting;
            return (
              <button
                key={mode}
                onClick={() => !isDisabled && setEditMode(mode)}
                disabled={mutation.isLoading || isDisabled}
                title={isDisabled ? "Selected model doesn't support inpainting" : undefined}
                className={`flex-1 py-1 text-[10px] rounded-md border transition-colors ${
                  editMode === mode
                    ? "border-primary bg-primary/5 font-medium"
                    : isDisabled
                      ? "opacity-30 cursor-not-allowed"
                      : "hover:bg-accent"
                } disabled:opacity-50`}
              >
                {mode === "general" ? "General" : mode === "inpaint" ? "Inpaint" : "Style"}
              </button>
            );
          })}
        </div>
      </div>

      {/* Strength slider — controls how much AI deviates from the input */}
      {selectedModel?.capabilities.supportsStrength && (
        <div>
          <label className="text-[10px] text-muted-foreground">
            Creativity: {Math.round(strength * 100)}%
            <span className="ml-1 text-[9px]">
              ({strength <= 0.3 ? "faithful to sketch" : strength <= 0.6 ? "balanced" : strength <= 0.8 ? "creative" : "fully reimagined"})
            </span>
          </label>
          <input
            type="range"
            min="0.1"
            max="1"
            step="0.05"
            value={strength}
            onChange={(e) => setStrength(parseFloat(e.target.value))}
            disabled={mutation.isLoading}
            className="w-full h-1.5 mt-1"
          />
          <div className="flex justify-between text-[9px] text-muted-foreground">
            <span>Sketch-faithful</span>
            <span>Fully reimagined</span>
          </div>
        </div>
      )}

      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder={
          editMode === "inpaint"
            ? "Describe what should fill the masked area..."
            : editMode === "style-transfer"
              ? "Describe the target style..."
              : "e.g. Make the background a sunset scene..."
        }
        rows={4}
        maxLength={1000}
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
