import { useEffect, useState, useCallback } from "react";
import type * as fabric from "fabric";

interface LayerItem {
  id: number;
  name: string;
  type: string;
  visible: boolean;
  locked: boolean;
  object: fabric.FabricObject;
}

interface LayersPanelProps {
  canvas: fabric.Canvas | null;
  selectedObject: fabric.FabricObject | null;
  onSelectObject: (obj: fabric.FabricObject) => void;
}

export function LayersPanel({ canvas, selectedObject, onSelectObject }: LayersPanelProps) {
  const [layers, setLayers] = useState<LayerItem[]>([]);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const refreshLayers = useCallback(() => {
    if (!canvas) return;
    const objects = canvas.getObjects();
    const items: LayerItem[] = objects.map((obj, i) => ({
      id: i,
      name: getObjectName(obj, i),
      type: obj.type ?? "object",
      visible: obj.visible !== false,
      locked: !obj.selectable,
      object: obj,
    }));
    // Show top layers first
    setLayers(items.reverse());
  }, [canvas]);

  useEffect(() => {
    if (!canvas) return;
    refreshLayers();

    const events = [
      "object:added",
      "object:removed",
      "object:modified",
      "selection:created",
      "selection:updated",
      "selection:cleared",
    ] as const;
    events.forEach((evt) => canvas.on(evt, refreshLayers));
    return () => {
      events.forEach((evt) => canvas.off(evt, refreshLayers));
    };
  }, [canvas, refreshLayers]);

  const toggleVisibility = useCallback(
    (layer: LayerItem) => {
      if (!canvas) return;
      layer.object.set("visible", !layer.visible);
      canvas.renderAll();
      refreshLayers();
    },
    [canvas, refreshLayers]
  );

  const toggleLock = useCallback(
    (layer: LayerItem) => {
      if (!canvas) return;
      const locked = layer.object.selectable !== false;
      layer.object.set({
        selectable: !locked,
        evented: !locked,
      });
      canvas.discardActiveObject();
      canvas.renderAll();
      refreshLayers();
    },
    [canvas, refreshLayers]
  );

  const handleDragStart = useCallback((idx: number) => {
    setDragIndex(idx);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, idx: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const handleDrop = useCallback(
    (targetIdx: number) => {
      if (!canvas || dragIndex === null || dragIndex === targetIdx) {
        setDragIndex(null);
        return;
      }

      const objects = canvas.getObjects();
      const totalObjects = objects.length;

      // Layers are reversed for display — convert back to canvas indices
      const fromCanvasIdx = totalObjects - 1 - dragIndex;
      const toCanvasIdx = totalObjects - 1 - targetIdx;

      const obj = objects[fromCanvasIdx];
      if (!obj) {
        setDragIndex(null);
        return;
      }

      canvas.remove(obj);
      canvas.insertAt(toCanvasIdx, obj);
      canvas.renderAll();
      setDragIndex(null);
      refreshLayers();
    },
    [canvas, dragIndex, refreshLayers]
  );

  if (layers.length === 0) {
    return (
      <div className="p-3">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Layers</h3>
        <p className="text-[10px] text-muted-foreground text-center py-4">
          No objects on canvas
        </p>
      </div>
    );
  }

  return (
    <div className="p-3">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-2">
        Layers ({layers.length})
      </h3>
      <div className="space-y-0.5">
        {layers.map((layer, idx) => {
          const isSelected = selectedObject === layer.object;
          return (
            <div
              key={`${layer.id}-${layer.name}`}
              draggable
              onDragStart={() => handleDragStart(idx)}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDrop={() => handleDrop(idx)}
              onClick={() => {
                if (!canvas || layer.locked) return;
                canvas.setActiveObject(layer.object);
                canvas.renderAll();
                onSelectObject(layer.object);
              }}
              className={`flex items-center gap-1.5 px-2 py-1.5 rounded text-[11px] cursor-pointer transition-colors ${
                isSelected
                  ? "bg-primary/10 text-primary"
                  : "hover:bg-accent"
              } ${dragIndex === idx ? "opacity-50" : ""}`}
            >
              {/* Drag handle */}
              <span className="cursor-grab text-muted-foreground" title="Drag to reorder">
                <GripIcon />
              </span>

              {/* Type icon */}
              <LayerTypeIcon type={layer.type} />

              {/* Name */}
              <span className={`flex-1 truncate ${!layer.visible ? "line-through opacity-50" : ""}`}>
                {layer.name}
              </span>

              {/* Visibility toggle */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleVisibility(layer);
                }}
                className="p-0.5 rounded hover:bg-accent/50"
                title={layer.visible ? "Hide" : "Show"}
              >
                {layer.visible ? <EyeIcon /> : <EyeOffIcon />}
              </button>

              {/* Lock toggle */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleLock(layer);
                }}
                className="p-0.5 rounded hover:bg-accent/50"
                title={layer.locked ? "Unlock" : "Lock"}
              >
                {layer.locked ? <LockIcon /> : <UnlockIcon />}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function getObjectName(obj: fabric.FabricObject, index: number): string {
  const type = obj.type ?? "object";
  switch (type) {
    case "i-text":
    case "textbox":
      return (obj as any).text?.slice(0, 20) || `Text ${index + 1}`;
    case "image":
      return `Image ${index + 1}`;
    case "rect":
      return `Rectangle ${index + 1}`;
    case "circle":
      return `Circle ${index + 1}`;
    default:
      return `${type} ${index + 1}`;
  }
}

function LayerTypeIcon({ type }: { type: string }) {
  const cls = "h-3 w-3 text-muted-foreground";
  switch (type) {
    case "i-text":
    case "textbox":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="4 7 4 4 20 4 20 7" />
          <line x1="9" x2="15" y1="20" y2="20" />
          <line x1="12" x2="12" y1="4" y2="20" />
        </svg>
      );
    case "image":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
          <circle cx="9" cy="9" r="2" />
          <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
        </svg>
      );
    case "rect":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect width="18" height="18" x="3" y="3" rx="2" />
        </svg>
      );
    case "circle":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
        </svg>
      );
    default:
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect width="18" height="18" x="3" y="3" rx="2" />
        </svg>
      );
  }
}

function GripIcon() {
  return (
    <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="9" cy="5" r="1" /><circle cx="15" cy="5" r="1" />
      <circle cx="9" cy="12" r="1" /><circle cx="15" cy="12" r="1" />
      <circle cx="9" cy="19" r="1" /><circle cx="15" cy="19" r="1" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49" />
      <path d="M14.084 14.158a3 3 0 0 1-4.242-4.242" />
      <path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143" />
      <path d="m2 2 20 20" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function UnlockIcon() {
  return (
    <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 9.9-1" />
    </svg>
  );
}
