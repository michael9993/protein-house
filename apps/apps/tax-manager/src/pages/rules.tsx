import { useState } from "react";
import { NavBar } from "@/modules/ui/NavBar";
import { trpcClient } from "@/modules/trpc/trpc-client";
import { Plus, Trash2, Edit2, X, Check } from "lucide-react";
import type { TaxRule } from "@/modules/tax-engine/types";

export default function RulesPage() {
  const rules = trpcClient.rules.list.useQuery();
  const createRule = trpcClient.rules.create.useMutation({ onSuccess: () => { rules.refetch(); resetForm(); } });
  const updateRule = trpcClient.rules.update.useMutation({ onSuccess: () => { rules.refetch(); resetForm(); } });
  const deleteRule = trpcClient.rules.delete.useMutation({ onSuccess: () => rules.refetch() });
  const toggleRule = trpcClient.rules.toggleEnabled.useMutation({ onSuccess: () => rules.refetch() });

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    countryCode: "",
    countryArea: "",
    taxRate: "",
    shippingTaxRate: "",
    priority: "0",
  });

  function resetForm() {
    setForm({ name: "", countryCode: "", countryArea: "", taxRate: "", shippingTaxRate: "", priority: "0" });
    setShowForm(false);
    setEditingId(null);
  }

  function startEdit(rule: TaxRule) {
    setForm({
      name: rule.name,
      countryCode: rule.countryCode,
      countryArea: rule.countryArea ?? "",
      taxRate: String(rule.taxRate * 100),
      shippingTaxRate: rule.shippingTaxRate !== null ? String(rule.shippingTaxRate * 100) : "",
      priority: String(rule.priority),
    });
    setEditingId(rule.id);
    setShowForm(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const data = {
      name: form.name,
      countryCode: form.countryCode.toUpperCase(),
      countryArea: form.countryArea || undefined,
      taxRate: parseFloat(form.taxRate) / 100,
      shippingTaxRate: form.shippingTaxRate ? parseFloat(form.shippingTaxRate) / 100 : null,
      priority: parseInt(form.priority, 10),
      enabled: true,
    };

    if (editingId) {
      updateRule.mutate({ id: editingId, data });
    } else {
      createRule.mutate(data);
    }
  }

  return (
    <div>
      <NavBar />
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-text-primary">Tax Rules</h1>
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="flex items-center gap-2 px-3 py-2 bg-brand text-white rounded-lg text-sm font-medium hover:bg-brand-light transition-colors"
          >
            <Plus size={16} /> Add Rule
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="border border-border rounded-lg p-4 bg-white space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-border rounded px-3 py-1.5 text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">Country Code</label>
                <input
                  type="text"
                  value={form.countryCode}
                  onChange={(e) => setForm({ ...form, countryCode: e.target.value })}
                  className="w-full border border-border rounded px-3 py-1.5 text-sm uppercase"
                  maxLength={2}
                  placeholder="US"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">State/Area (optional)</label>
                <input
                  type="text"
                  value={form.countryArea}
                  onChange={(e) => setForm({ ...form, countryArea: e.target.value })}
                  className="w-full border border-border rounded px-3 py-1.5 text-sm uppercase"
                  maxLength={3}
                  placeholder="CA"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">Tax Rate (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.taxRate}
                  onChange={(e) => setForm({ ...form, taxRate: e.target.value })}
                  className="w-full border border-border rounded px-3 py-1.5 text-sm"
                  placeholder="17"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">Shipping Tax Rate (%, blank = same)</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.shippingTaxRate}
                  onChange={(e) => setForm({ ...form, shippingTaxRate: e.target.value })}
                  className="w-full border border-border rounded px-3 py-1.5 text-sm"
                  placeholder="Same as tax rate"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">Priority</label>
                <input
                  type="number"
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value })}
                  className="w-full border border-border rounded px-3 py-1.5 text-sm"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="flex items-center gap-1 px-3 py-1.5 bg-brand text-white rounded text-sm font-medium"
              >
                <Check size={14} /> {editingId ? "Update" : "Create"}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="flex items-center gap-1 px-3 py-1.5 border border-border rounded text-sm"
              >
                <X size={14} /> Cancel
              </button>
            </div>
          </form>
        )}

        {rules.isLoading ? (
          <p className="text-text-muted text-sm">Loading rules...</p>
        ) : rules.data && rules.data.length > 0 ? (
          <div className="border border-border rounded-lg bg-white overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-gray-50">
                  <th className="text-left px-4 py-2 font-medium text-text-muted">Name</th>
                  <th className="text-left px-4 py-2 font-medium text-text-muted">Country</th>
                  <th className="text-left px-4 py-2 font-medium text-text-muted">State</th>
                  <th className="text-left px-4 py-2 font-medium text-text-muted">Tax Rate</th>
                  <th className="text-left px-4 py-2 font-medium text-text-muted">Shipping Rate</th>
                  <th className="text-left px-4 py-2 font-medium text-text-muted">Priority</th>
                  <th className="text-left px-4 py-2 font-medium text-text-muted">Status</th>
                  <th className="text-right px-4 py-2 font-medium text-text-muted">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rules.data.map((rule) => (
                  <tr key={rule.id} className="border-b border-border last:border-0 hover:bg-gray-50">
                    <td className="px-4 py-2 text-text-primary font-medium">{rule.name}</td>
                    <td className="px-4 py-2">{rule.countryCode}</td>
                    <td className="px-4 py-2 text-text-muted">{rule.countryArea ?? "—"}</td>
                    <td className="px-4 py-2">{(rule.taxRate * 100).toFixed(2)}%</td>
                    <td className="px-4 py-2 text-text-muted">
                      {rule.shippingTaxRate !== null ? `${(rule.shippingTaxRate * 100).toFixed(2)}%` : "Same"}
                    </td>
                    <td className="px-4 py-2">{rule.priority}</td>
                    <td className="px-4 py-2">
                      <button
                        onClick={() => toggleRule.mutate({ id: rule.id, enabled: !rule.enabled })}
                        className={`px-2 py-0.5 rounded text-xs font-medium cursor-pointer ${
                          rule.enabled ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {rule.enabled ? "Active" : "Disabled"}
                      </button>
                    </td>
                    <td className="px-4 py-2 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => startEdit(rule)}
                          className="p-1 hover:bg-gray-100 rounded"
                          title="Edit"
                        >
                          <Edit2 size={14} className="text-text-muted" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Delete rule "${rule.name}"?`)) {
                              deleteRule.mutate({ id: rule.id });
                            }
                          }}
                          className="p-1 hover:bg-red-50 rounded"
                          title="Delete"
                        >
                          <Trash2 size={14} className="text-error" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="border border-dashed border-border rounded-lg p-8 text-center">
            <p className="text-text-muted text-sm">No tax rules yet. Add rules manually or import a preset.</p>
          </div>
        )}
      </div>
    </div>
  );
}
