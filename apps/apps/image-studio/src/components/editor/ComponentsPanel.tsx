import { useState, useCallback } from "react";
import * as fabric from "fabric";
import type { SavedComponent, ComponentCategory } from "@/modules/components/types";
import { COMPONENT_CATEGORIES } from "@/modules/components/types";
import { generateThumbnail } from "@/modules/components/generate-thumbnail";

interface ComponentsPanelProps {
  canvas: fabric.Canvas | null;
  selectedObject: fabric.FabricObject | null;
  components: SavedComponent[];
  onAddComponent: (comp: SavedComponent) => Promise<void>;
  onDeleteComponent: (id: string) => Promise<void>;
  onRenameComponent: (id: string, name: string) => Promise<void>;
  showSaveForm?: boolean;
}

export function ComponentsPanel({
  canvas,
  selectedObject,
  components,
  onAddComponent,
  onDeleteComponent,
  onRenameComponent,
  showSaveForm: initialShowSave,
}: ComponentsPanelProps) {
  const [activeCategory, setActiveCategory] = useState<ComponentCategory | "all">("all");
  const [showSave, setShowSave] = useState(initialShowSave ?? false);
  const [saveName, setSaveName] = useState("");
  const [saveCategory, setSaveCategory] = useState<ComponentCategory>("custom");
  const [saving, setSaving] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const filtered = activeCategory === "all"
    ? components
    : components.filter((c) => c.category === activeCategory);

  const handleSave = useCallback(async () => {
    if (!selectedObject || !canvas || !saveName.trim()) return;
    setSaving(true);
    try {
      const json = selectedObject.toJSON();
      const thumbnail = await generateThumbnail(selectedObject);
      const comp: SavedComponent = {
        id: `comp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: saveName.trim(),
        category: saveCategory,
        fabricJson: json,
        thumbnail,
        createdAt: Date.now(),
      };
      await onAddComponent(comp);
      setSaveName("");
      setShowSave(false);
    } finally {
      setSaving(false);
    }
  }, [selectedObject, canvas, saveName, saveCategory, onAddComponent]);

  const handleInsert = useCallback(
    async (comp: SavedComponent) => {
      if (!canvas) return;
      try {
        const objects = await fabric.util.enlivenObjects([comp.fabricJson]);
        for (const obj of objects) {
          obj.set({ left: (obj.left ?? 0) + 20, top: (obj.top ?? 0) + 20 });
          canvas.add(obj);
        }
        if (objects.length === 1) {
          canvas.setActiveObject(objects[0]);
        }
        canvas.renderAll();
        canvas.fire("object:modified", { target: objects[0] });
      } catch {
        // Fallback: try loading as full JSON
      }
    },
    [canvas],
  );

  const handleRename = useCallback(
    async (id: string) => {
      if (renameValue.trim()) {
        await onRenameComponent(id, renameValue.trim());
      }
      setRenamingId(null);
    },
    [renameValue, onRenameComponent],
  );

  return (
    <>
      <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-3">
        Components
      </h3>

      {/* Save Selection */}
      {selectedObject && !showSave && (
        <button
          onClick={() => setShowSave(true)}
          className="w-full mb-3 px-3 py-2 text-xs font-medium rounded-md border border-dashed border-primary text-primary hover:bg-primary/5 transition-colors"
        >
          + Save Selection
        </button>
      )}

      {showSave && (
        <div className="mb-3 p-2 rounded-md border bg-muted/30 space-y-2">
          <input
            type="text"
            value={saveName}
            onChange={(e) => setSaveName(e.target.value)}
            placeholder="Component name..."
            className="w-full px-2 py-1.5 text-xs rounded border bg-background"
            autoFocus
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
          />
          <select
            value={saveCategory}
            onChange={(e) => setSaveCategory(e.target.value as ComponentCategory)}
            className="w-full px-2 py-1.5 text-xs rounded border bg-background"
          >
            {COMPONENT_CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>
          <div className="flex gap-1.5">
            <button
              onClick={() => setShowSave(false)}
              className="flex-1 px-2 py-1.5 text-[10px] rounded border hover:bg-accent"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!saveName.trim() || saving}
              className="flex-1 px-2 py-1.5 text-[10px] rounded bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      )}

      {/* Category Filter */}
      <div className="flex flex-wrap gap-1 mb-3">
        <FilterTab
          label="All"
          active={activeCategory === "all"}
          onClick={() => setActiveCategory("all")}
          count={components.length}
        />
        {COMPONENT_CATEGORIES.map((cat) => {
          const count = components.filter((c) => c.category === cat.value).length;
          if (count === 0) return null;
          return (
            <FilterTab
              key={cat.value}
              label={cat.label}
              active={activeCategory === cat.value}
              onClick={() => setActiveCategory(cat.value)}
              count={count}
            />
          );
        })}
      </div>

      {/* Component Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-2 gap-1.5">
          {filtered.map((comp) => (
            <div
              key={comp.id}
              className="group relative rounded-md border hover:border-primary/50 cursor-pointer transition-colors overflow-hidden"
              onClick={() => handleInsert(comp)}
              title={`Insert "${comp.name}"`}
            >
              <div className="aspect-square bg-muted/30 flex items-center justify-center p-1">
                <img
                  src={comp.thumbnail}
                  alt={comp.name}
                  className="max-w-full max-h-full object-contain"
                />
              </div>
              {renamingId === comp.id ? (
                <div className="px-1.5 py-1" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="text"
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onBlur={() => handleRename(comp.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleRename(comp.id);
                      if (e.key === "Escape") setRenamingId(null);
                    }}
                    className="w-full px-1 py-0.5 text-[10px] rounded border bg-background"
                    autoFocus
                  />
                </div>
              ) : (
                <div className="px-1.5 py-1 flex items-center justify-between">
                  <span className="text-[10px] truncate">{comp.name}</span>
                  <div className="hidden group-hover:flex gap-0.5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setRenamingId(comp.id);
                        setRenameValue(comp.name);
                      }}
                      className="p-0.5 rounded hover:bg-accent"
                      title="Rename"
                    >
                      <EditIcon />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteComponent(comp.id);
                      }}
                      className="p-0.5 rounded hover:bg-destructive/10 text-destructive"
                      title="Delete"
                    >
                      <TrashIcon />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 border-2 border-dashed border-muted rounded-lg">
          <p className="text-[10px] text-muted-foreground">
            {components.length === 0
              ? "No saved components yet"
              : "No components in this category"}
          </p>
          <p className="text-[9px] text-muted-foreground/60 mt-1">
            Select objects on canvas and click "Save Selection"
          </p>
        </div>
      )}
    </>
  );
}

function FilterTab({
  label,
  active,
  onClick,
  count,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  count: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-2 py-1 text-[9px] rounded-full transition-colors ${
        active
          ? "bg-primary/10 text-primary font-medium"
          : "text-muted-foreground hover:bg-accent"
      }`}
    >
      {label} ({count})
    </button>
  );
}

function EditIcon() {
  return (
    <svg className="h-2.5 w-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg className="h-2.5 w-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    </svg>
  );
}
