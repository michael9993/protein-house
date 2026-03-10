import { NavBar } from "@/modules/ui/NavBar";
import { trpcClient } from "@/modules/trpc/trpc-client";
import { Package, Plus, Trash2, Check } from "lucide-react";
import { useState } from "react";

export default function PresetsPage() {
  const presets = trpcClient.presets.list.useQuery();
  const rules = trpcClient.rules.list.useQuery();
  const applyPreset = trpcClient.presets.apply.useMutation({
    onSuccess: () => rules.refetch(),
  });
  const removePreset = trpcClient.presets.removePreset.useMutation({
    onSuccess: () => rules.refetch(),
  });
  const [results, setResults] = useState<Record<string, string>>({});

  const presetDescriptions: Record<string, string> = {
    israel: "Standard 17% VAT rate for Israel, including shipping tax.",
    eu: "VAT rates for all 27 EU member states (2024 rates).",
    us: "State-level sales tax rates for all 50 US states + DC.",
    "zero-tax": "Zero-tax jurisdictions: UAE, Hong Kong, Bahrain, Bermuda.",
  };

  return (
    <div>
      <NavBar />
      <div className="space-y-4">
        <div>
          <h1 className="text-xl font-bold text-text-primary">Tax Rate Presets</h1>
          <p className="text-sm text-text-muted mt-1">
            One-click import of pre-configured tax rates for common jurisdictions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {presets.data?.map((preset) => (
            <div
              key={preset.id}
              className="border border-border rounded-lg p-4 bg-white space-y-3"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <Package size={20} className="text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-text-primary">{preset.name}</h3>
                    <p className="text-xs text-text-muted">{preset.count} rules</p>
                  </div>
                </div>
              </div>

              <p className="text-sm text-text-muted">
                {presetDescriptions[preset.id] ?? ""}
              </p>

              {results[preset.id] && (
                <div className="flex items-center gap-1 text-xs text-success">
                  <Check size={12} /> {results[preset.id]}
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={async () => {
                    const result = await applyPreset.mutateAsync({
                      presetId: preset.id as any,
                      mode: "merge",
                    });
                    setResults((prev) => ({
                      ...prev,
                      [preset.id]: `Added ${result.added} rules (${result.total} total)`,
                    }));
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 bg-brand text-white rounded text-xs font-medium hover:bg-brand-light transition-colors"
                  disabled={applyPreset.isLoading}
                >
                  <Plus size={12} /> Import (Merge)
                </button>
                <button
                  onClick={async () => {
                    if (confirm(`Remove all rules matching the ${preset.name} preset?`)) {
                      const result = await removePreset.mutateAsync({
                        presetId: preset.id as any,
                      });
                      setResults((prev) => ({
                        ...prev,
                        [preset.id]: `Removed ${result.removed} rules`,
                      }));
                    }
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 border border-border rounded text-xs font-medium hover:bg-red-50 transition-colors"
                  disabled={removePreset.isLoading}
                >
                  <Trash2 size={12} /> Remove
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="text-xs text-text-muted">
          <p>Total rules loaded: {rules.data?.length ?? 0}</p>
        </div>
      </div>
    </div>
  );
}
