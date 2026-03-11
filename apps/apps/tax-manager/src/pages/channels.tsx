import { useState } from "react";
import { NavBar } from "@/modules/ui/NavBar";
import { trpcClient } from "@/modules/trpc/trpc-client";
import { Save } from "lucide-react";

export default function ChannelsPage() {
  const channels = trpcClient.channels.list.useQuery();
  const updateChannel = trpcClient.channels.update.useMutation({
    onSuccess: () => channels.refetch(),
  });
  const [editSlug, setEditSlug] = useState<string | null>(null);
  const [form, setForm] = useState({
    enabled: false,
    pricesIncludeTax: false,
    defaultTaxRate: "0",
    exportZeroRatingEnabled: true,
    domesticCountryCode: "IL",
  });

  function startEdit(ch: any) {
    setEditSlug(ch.channelSlug);
    setForm({
      enabled: ch.config.enabled,
      pricesIncludeTax: ch.config.pricesIncludeTax,
      defaultTaxRate: String(ch.config.defaultTaxRate * 100),
      exportZeroRatingEnabled: ch.config.exportZeroRating?.enabled ?? true,
      domesticCountryCode: ch.config.exportZeroRating?.domesticCountryCode ?? "IL",
    });
  }

  function handleSave(slug: string) {
    updateChannel.mutate({
      channelSlug: slug,
      enabled: form.enabled,
      pricesIncludeTax: form.pricesIncludeTax,
      defaultTaxRate: parseFloat(form.defaultTaxRate) / 100,
      exportZeroRating: {
        enabled: form.exportZeroRatingEnabled,
        domesticCountryCode: form.domesticCountryCode,
      },
    });
    setEditSlug(null);
  }

  return (
    <div>
      <NavBar />
      <div className="space-y-4">
        <div>
          <h1 className="text-xl font-bold text-text-primary">Channel Configuration</h1>
          <p className="text-sm text-text-muted mt-1">
            Configure tax settings per sales channel.
          </p>
        </div>

        {channels.isLoading ? (
          <p className="text-sm text-text-muted">Loading channels...</p>
        ) : (
          <div className="space-y-4">
            {channels.data?.map((ch: any) => (
              <div key={ch.channelSlug} className="border border-border rounded-lg bg-white">
                <div className="flex items-center justify-between p-4 border-b border-border">
                  <div>
                    <h3 className="text-sm font-semibold text-text-primary">{ch.channelName}</h3>
                    <p className="text-xs text-text-muted">
                      {ch.channelSlug} · {ch.currencyCode}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${
                        ch.config.enabled
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {ch.config.enabled ? "Enabled" : "Disabled"}
                    </span>
                    {editSlug !== ch.channelSlug && (
                      <button
                        onClick={() => startEdit(ch)}
                        className="px-3 py-1 text-xs font-medium border border-border rounded hover:bg-gray-50"
                      >
                        Configure
                      </button>
                    )}
                  </div>
                </div>

                {editSlug === ch.channelSlug && (
                  <div className="p-4 space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={form.enabled}
                          onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
                          className="rounded"
                        />
                        Tax calculation enabled
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={form.pricesIncludeTax}
                          onChange={(e) => setForm({ ...form, pricesIncludeTax: e.target.checked })}
                          className="rounded"
                        />
                        Prices include tax
                      </label>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-text-muted mb-1">
                          Default Tax Rate (%)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={form.defaultTaxRate}
                          onChange={(e) => setForm({ ...form, defaultTaxRate: e.target.value })}
                          className="w-full border border-border rounded px-3 py-1.5 text-sm"
                        />
                      </div>
                      <label className="flex items-center gap-2 text-sm pt-5">
                        <input
                          type="checkbox"
                          checked={form.exportZeroRatingEnabled}
                          onChange={(e) =>
                            setForm({ ...form, exportZeroRatingEnabled: e.target.checked })
                          }
                          className="rounded"
                        />
                        Export zero-rating
                      </label>
                      <div>
                        <label className="block text-xs font-medium text-text-muted mb-1">
                          Domestic Country
                        </label>
                        <input
                          type="text"
                          value={form.domesticCountryCode}
                          onChange={(e) =>
                            setForm({ ...form, domesticCountryCode: e.target.value.toUpperCase() })
                          }
                          className="w-full border border-border rounded px-3 py-1.5 text-sm uppercase"
                          maxLength={2}
                        />
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSave(ch.channelSlug)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-brand text-white rounded text-sm font-medium"
                      >
                        <Save size={14} /> Save
                      </button>
                      <button
                        onClick={() => setEditSlug(null)}
                        className="px-3 py-1.5 border border-border rounded text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {editSlug !== ch.channelSlug && ch.config.enabled && (
                  <div className="px-4 py-2 text-xs text-text-muted grid grid-cols-3 gap-2">
                    <span>Default rate: {(ch.config.defaultTaxRate * 100).toFixed(1)}%</span>
                    <span>
                      Prices: {ch.config.pricesIncludeTax ? "Include tax" : "Exclude tax"}
                    </span>
                    <span>
                      Export zero-rating:{" "}
                      {ch.config.exportZeroRating?.enabled
                        ? `Yes (from ${ch.config.exportZeroRating.domesticCountryCode})`
                        : "No"}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
