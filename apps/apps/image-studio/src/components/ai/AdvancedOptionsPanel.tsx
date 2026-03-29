import { useState } from "react";
import type { AICapabilities } from "@/modules/ai/types";

interface AdvancedOptionsPanelProps {
  capabilities: AICapabilities | null;
  negativePrompt: string;
  onNegativePromptChange: (value: string) => void;
  seed: string;
  onSeedChange: (value: string) => void;
  stylePreset: string;
  onStylePresetChange: (value: string) => void;
  aspectRatio: string;
  onAspectRatioChange: (value: string) => void;
  disabled?: boolean;
}

const COMMON_ASPECT_RATIOS = ["1:1", "16:9", "9:16", "4:3", "3:4", "3:2", "2:3"];

export function AdvancedOptionsPanel({
  capabilities,
  negativePrompt,
  onNegativePromptChange,
  seed,
  onSeedChange,
  stylePreset,
  onStylePresetChange,
  aspectRatio,
  onAspectRatioChange,
  disabled,
}: AdvancedOptionsPanelProps) {
  const [expanded, setExpanded] = useState(false);

  if (!capabilities) return null;

  const hasAnyAdvanced =
    capabilities.supportsNegativePrompt ||
    capabilities.supportsSeed ||
    capabilities.supportsStylePresets ||
    capabilities.supportsAspectRatio;

  if (!hasAnyAdvanced) return null;

  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
      >
        <span className={`transition-transform ${expanded ? "rotate-90" : ""}`}>&#9654;</span>
        Advanced Options
      </button>

      {expanded && (
        <div className="mt-2 space-y-2.5 pl-2 border-l border-border">
          {capabilities.supportsNegativePrompt && (
            <div>
              <label className="text-[10px] text-muted-foreground">Negative Prompt</label>
              <textarea
                value={negativePrompt}
                onChange={(e) => onNegativePromptChange(e.target.value)}
                placeholder="What to avoid..."
                rows={2}
                maxLength={500}
                disabled={disabled}
                className="w-full mt-0.5 px-2 py-1.5 text-xs rounded-md border bg-background resize-none disabled:opacity-50"
              />
            </div>
          )}

          {capabilities.supportsSeed && (
            <div>
              <label className="text-[10px] text-muted-foreground">Seed (for reproducibility)</label>
              <input
                type="number"
                value={seed}
                onChange={(e) => onSeedChange(e.target.value)}
                placeholder="Random"
                disabled={disabled}
                className="w-full mt-0.5 px-2 py-1.5 text-xs rounded-md border bg-background disabled:opacity-50"
              />
            </div>
          )}

          {capabilities.supportsStylePresets && capabilities.supportedStylePresets && (
            <div>
              <label className="text-[10px] text-muted-foreground">Style Preset</label>
              <select
                value={stylePreset}
                onChange={(e) => onStylePresetChange(e.target.value)}
                disabled={disabled}
                className="w-full mt-0.5 px-2 py-1.5 text-xs rounded-md border bg-background disabled:opacity-50"
              >
                <option value="">Auto</option>
                {capabilities.supportedStylePresets.map((s) => (
                  <option key={s} value={s}>
                    {s.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                  </option>
                ))}
              </select>
            </div>
          )}

          {capabilities.supportsAspectRatio && (
            <div>
              <label className="text-[10px] text-muted-foreground">Aspect Ratio</label>
              <div className="flex flex-wrap gap-1 mt-0.5">
                <button
                  onClick={() => onAspectRatioChange("")}
                  disabled={disabled}
                  className={`px-2 py-0.5 text-[10px] rounded-md border ${
                    !aspectRatio ? "border-primary bg-primary/5" : "hover:bg-accent"
                  } disabled:opacity-50`}
                >
                  Auto
                </button>
                {(capabilities.supportedAspectRatios ?? COMMON_ASPECT_RATIOS).map((ar) => (
                  <button
                    key={ar}
                    onClick={() => onAspectRatioChange(ar)}
                    disabled={disabled}
                    className={`px-2 py-0.5 text-[10px] rounded-md border ${
                      aspectRatio === ar ? "border-primary bg-primary/5" : "hover:bg-accent"
                    } disabled:opacity-50`}
                  >
                    {ar}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
