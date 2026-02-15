import { useState, useCallback } from "react";

import {
  CANVAS_PRESETS,
  PRESET_CATEGORIES,
  getAspectRatioLabel,
} from "./utils/canvasPresets";

interface CanvasResizeDialogProps {
  currentWidth: number;
  currentHeight: number;
  onResize: (width: number, height: number) => void;
  onClose: () => void;
}

export function CanvasResizeDialog({
  currentWidth,
  currentHeight,
  onResize,
  onClose,
}: CanvasResizeDialogProps) {
  const [width, setWidth] = useState(currentWidth);
  const [height, setHeight] = useState(currentHeight);
  const [lockAspect, setLockAspect] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>("social");
  const aspectRatio = currentWidth / currentHeight;

  const handleWidthChange = useCallback(
    (newWidth: number) => {
      setWidth(newWidth);
      if (lockAspect) {
        setHeight(Math.round(newWidth / aspectRatio));
      }
    },
    [lockAspect, aspectRatio],
  );

  const handleHeightChange = useCallback(
    (newHeight: number) => {
      setHeight(newHeight);
      if (lockAspect) {
        setWidth(Math.round(newHeight * aspectRatio));
      }
    },
    [lockAspect, aspectRatio],
  );

  const handleApply = useCallback(() => {
    if (width > 0 && height > 0) {
      onResize(width, height);
      onClose();
    }
  }, [width, height, onResize, onClose]);

  const filteredPresets = CANVAS_PRESETS.filter(
    (p) => p.category === categoryFilter,
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background rounded-lg p-6 w-[440px] shadow-xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-sm font-semibold mb-4">Canvas Size</h3>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="text-[10px] text-muted-foreground uppercase">
              Width
            </label>
            <input
              type="number"
              value={width}
              min={1}
              max={4096}
              onChange={(e) =>
                handleWidthChange(parseInt(e.target.value) || 1)
              }
              className="w-full px-2 py-1.5 text-xs rounded-md border bg-background mt-1"
            />
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground uppercase">
              Height
            </label>
            <input
              type="number"
              value={height}
              min={1}
              max={4096}
              onChange={(e) =>
                handleHeightChange(parseInt(e.target.value) || 1)
              }
              className="w-full px-2 py-1.5 text-xs rounded-md border bg-background mt-1"
            />
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={lockAspect}
              onChange={(e) => setLockAspect(e.target.checked)}
              className="rounded"
            />
            <span className="text-xs text-muted-foreground">
              Lock aspect ratio
            </span>
          </label>
          <span className="text-[10px] text-muted-foreground">
            {width}x{height} ({getAspectRatioLabel(width, height)})
          </span>
        </div>

        {/* Category tabs */}
        <div className="mb-3">
          <label className="text-[10px] text-muted-foreground uppercase mb-1.5 block">
            Presets
          </label>
          <div className="flex gap-1">
            {PRESET_CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setCategoryFilter(cat.value)}
                className={`px-2.5 py-1 text-[10px] rounded-full border transition-colors ${
                  categoryFilter === cat.value
                    ? "border-primary bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:bg-accent"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Preset grid */}
        <div className="grid grid-cols-2 gap-1.5 mb-4">
          {filteredPresets.map((p) => {
            const isActive = width === p.width && height === p.height;
            return (
              <button
                key={p.id}
                onClick={() => {
                  setWidth(p.width);
                  setHeight(p.height);
                }}
                className={`px-2.5 py-2 text-left rounded border transition-colors ${
                  isActive
                    ? "border-primary bg-primary/5"
                    : "hover:bg-accent"
                }`}
              >
                <div className="text-[11px] font-medium">{p.label}</div>
                <div className="text-[10px] text-muted-foreground">
                  {p.width}x{p.height}{" "}
                  <span className="opacity-70">
                    ({getAspectRatioLabel(p.width, p.height)})
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-sm rounded-md border hover:bg-accent"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            className="px-3 py-1.5 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
