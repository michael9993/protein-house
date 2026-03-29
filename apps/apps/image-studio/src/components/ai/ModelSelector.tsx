import { trpcClient } from "@/modules/trpc/trpc-client";
import type { ProviderType } from "@/modules/ai/types";

interface ModelSelectorProps {
  value: string;
  onChange: (modelId: string) => void;
  disabled?: boolean;
}

const PROVIDER_LABELS: Record<ProviderType, string> = {
  gemini: "Google",
  openai: "OpenAI",
  stability: "Stability",
};

const PROVIDER_COLORS: Record<ProviderType, string> = {
  gemini: "bg-blue-500/10 text-blue-600",
  openai: "bg-emerald-500/10 text-emerald-600",
  stability: "bg-purple-500/10 text-purple-600",
};

export function ModelSelector({ value, onChange, disabled }: ModelSelectorProps) {
  const { data, isLoading } = trpcClient.ai.getAvailableModels.useQuery();
  const models = data?.models ?? [];

  if (isLoading) {
    return (
      <div className="animate-pulse h-7 bg-muted rounded-md" />
    );
  }

  if (models.length === 0) {
    return (
      <p className="text-[10px] text-muted-foreground">
        No AI models configured. Set API keys in environment.
      </p>
    );
  }

  return (
    <div>
      <label className="text-[10px] text-muted-foreground">AI Model</label>
      <select
        value={value || models[0]?.id}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full mt-0.5 px-2 py-1.5 text-xs rounded-md border bg-background disabled:opacity-50"
      >
        {models.map((model) => (
          <option key={model.id} value={model.id}>
            {model.name} [{PROVIDER_LABELS[model.provider]}]
          </option>
        ))}
      </select>
      {value && models.length > 0 && (
        <div className="flex gap-1 mt-1 flex-wrap">
          {(() => {
            const model = models.find((m) => m.id === value) ?? models[0];
            if (!model) return null;
            const badges: string[] = [];
            if (model.capabilities.supportsThinking) badges.push("Thinking");
            if (model.capabilities.supportsInpainting) badges.push("Inpaint");
            if (model.capabilities.supportsStylePresets) badges.push("Styles");
            if (model.capabilities.supportsSeed) badges.push("Seed");
            return badges.map((b) => (
              <span
                key={b}
                className={`px-1.5 py-0.5 text-[9px] rounded-full ${PROVIDER_COLORS[model.provider]}`}
              >
                {b}
              </span>
            ));
          })()}
        </div>
      )}
    </div>
  );
}
