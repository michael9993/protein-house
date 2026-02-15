import { useState, useCallback } from "react";
import type { BrandKit } from "@/modules/components/types";

const FONT_FAMILIES = [
  "Arial", "Helvetica", "Times New Roman", "Georgia",
  "Courier New", "Verdana", "Trebuchet MS", "Impact",
  "Roboto", "Open Sans", "Lato", "Montserrat",
];

interface BrandKitDialogProps {
  brandKits: BrandKit[];
  onSave: (kit: BrandKit) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onClose: () => void;
}

export function BrandKitDialog({ brandKits, onSave, onDelete, onClose }: BrandKitDialogProps) {
  const [editingKit, setEditingKit] = useState<BrandKit>({
    id: "",
    name: "",
    primaryColor: "#1a1a1a",
    secondaryColor: "#666666",
    accentColor: "#3b82f6",
    primaryFont: "Arial",
    secondaryFont: "Georgia",
    createdAt: 0,
  });
  const [saving, setSaving] = useState(false);

  const handleNew = useCallback(() => {
    setEditingKit({
      id: `kit-${Date.now()}`,
      name: "",
      primaryColor: "#1a1a1a",
      secondaryColor: "#666666",
      accentColor: "#3b82f6",
      primaryFont: "Arial",
      secondaryFont: "Georgia",
      createdAt: Date.now(),
    });
  }, []);

  const handleSelectExisting = useCallback((kit: BrandKit) => {
    setEditingKit({ ...kit });
  }, []);

  const handleSave = useCallback(async () => {
    if (!editingKit.name.trim()) return;
    setSaving(true);
    try {
      await onSave({
        ...editingKit,
        id: editingKit.id || `kit-${Date.now()}`,
        createdAt: editingKit.createdAt || Date.now(),
      });
    } finally {
      setSaving(false);
    }
  }, [editingKit, onSave]);

  const handleLogoUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setEditingKit((prev) => ({ ...prev, logoBase64: ev.target?.result as string }));
    };
    reader.readAsDataURL(file);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background rounded-lg w-[480px] max-h-[80vh] shadow-xl flex flex-col">
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="text-sm font-semibold">Brand Kits</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-lg">&times;</button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Kit list */}
          <div className="w-[140px] border-r p-2 overflow-y-auto space-y-1">
            <button
              onClick={handleNew}
              className="w-full px-2 py-1.5 text-[10px] rounded border border-dashed hover:bg-accent text-center"
            >
              + New Kit
            </button>
            {brandKits.map((kit) => (
              <button
                key={kit.id}
                onClick={() => handleSelectExisting(kit)}
                className={`w-full px-2 py-1.5 text-[10px] rounded border text-left transition-colors ${
                  editingKit.id === kit.id ? "border-primary bg-primary/5" : "hover:bg-accent"
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <div className="flex gap-0.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: kit.primaryColor }} />
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: kit.secondaryColor }} />
                  </div>
                  <span className="truncate">{kit.name}</span>
                </div>
              </button>
            ))}
          </div>

          {/* Edit form */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3">
            <div>
              <label className="text-[10px] text-muted-foreground uppercase block mb-1">Name</label>
              <input
                type="text"
                value={editingKit.name}
                onChange={(e) => setEditingKit((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Brand kit name..."
                className="w-full px-2 py-1.5 text-xs rounded border bg-background"
              />
            </div>

            {/* Logo */}
            <div>
              <label className="text-[10px] text-muted-foreground uppercase block mb-1">Logo</label>
              <div className="flex items-center gap-2">
                {editingKit.logoBase64 && (
                  <img src={editingKit.logoBase64} alt="Logo" className="h-8 w-8 object-contain rounded border" />
                )}
                <label className="px-2 py-1 text-[10px] rounded border cursor-pointer hover:bg-accent">
                  Upload Logo
                  <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                </label>
                {editingKit.logoBase64 && (
                  <button
                    onClick={() => setEditingKit((prev) => ({ ...prev, logoBase64: undefined }))}
                    className="text-[10px] text-destructive hover:underline"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>

            {/* Colors */}
            <div>
              <label className="text-[10px] text-muted-foreground uppercase block mb-1">Colors</label>
              <div className="grid grid-cols-3 gap-2">
                <ColorInput
                  label="Primary"
                  value={editingKit.primaryColor}
                  onChange={(v) => setEditingKit((prev) => ({ ...prev, primaryColor: v }))}
                />
                <ColorInput
                  label="Secondary"
                  value={editingKit.secondaryColor}
                  onChange={(v) => setEditingKit((prev) => ({ ...prev, secondaryColor: v }))}
                />
                <ColorInput
                  label="Accent"
                  value={editingKit.accentColor}
                  onChange={(v) => setEditingKit((prev) => ({ ...prev, accentColor: v }))}
                />
              </div>
            </div>

            {/* Fonts */}
            <div>
              <label className="text-[10px] text-muted-foreground uppercase block mb-1">Fonts</label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[9px] text-muted-foreground">Primary</span>
                  <select
                    value={editingKit.primaryFont}
                    onChange={(e) => setEditingKit((prev) => ({ ...prev, primaryFont: e.target.value }))}
                    className="w-full px-1.5 py-1 text-xs rounded border bg-background"
                  >
                    {FONT_FAMILIES.map((f) => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <span className="text-[9px] text-muted-foreground">Secondary</span>
                  <select
                    value={editingKit.secondaryFont}
                    onChange={(e) => setEditingKit((prev) => ({ ...prev, secondaryFont: e.target.value }))}
                    className="w-full px-1.5 py-1 text-xs rounded border bg-background"
                  >
                    {FONT_FAMILIES.map((f) => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t flex items-center justify-between">
          {editingKit.id && brandKits.some((k) => k.id === editingKit.id) && (
            <button
              onClick={() => onDelete(editingKit.id)}
              className="px-3 py-1.5 text-xs rounded-md border border-destructive text-destructive hover:bg-destructive/10"
            >
              Delete
            </button>
          )}
          <div className="flex gap-2 ml-auto">
            <button onClick={onClose} className="px-3 py-1.5 text-xs rounded-md border hover:bg-accent">
              Close
            </button>
            <button
              onClick={handleSave}
              disabled={!editingKit.name.trim() || saving}
              className="px-3 py-1.5 text-xs rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Kit"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ColorInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 w-8 rounded border cursor-pointer"
      />
      <span className="text-[9px] text-muted-foreground">{label}</span>
    </div>
  );
}
