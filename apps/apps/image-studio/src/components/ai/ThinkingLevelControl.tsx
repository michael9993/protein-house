import type { ThinkingLevel } from "@/modules/ai/types";

interface ThinkingLevelControlProps {
  value: ThinkingLevel;
  onChange: (level: ThinkingLevel) => void;
  disabled?: boolean;
}

const LEVELS: { id: ThinkingLevel; label: string; description: string }[] = [
  { id: "none", label: "None", description: "Fastest, no reasoning" },
  { id: "low", label: "Low", description: "Light reasoning, ~1K tokens" },
  { id: "medium", label: "Med", description: "Balanced, ~8K tokens" },
  { id: "high", label: "High", description: "Deep reasoning, ~32K tokens" },
];

export function ThinkingLevelControl({ value, onChange, disabled }: ThinkingLevelControlProps) {
  return (
    <div>
      <label className="text-[10px] text-muted-foreground">Thinking Level</label>
      <div className="flex gap-1 mt-0.5">
        {LEVELS.map((level) => (
          <button
            key={level.id}
            onClick={() => onChange(level.id)}
            disabled={disabled}
            title={level.description}
            className={`flex-1 py-1 text-[10px] rounded-md border transition-colors ${
              value === level.id
                ? "border-primary bg-primary/5 font-medium"
                : "hover:bg-accent"
            } disabled:opacity-50`}
          >
            {level.label}
          </button>
        ))}
      </div>
    </div>
  );
}
