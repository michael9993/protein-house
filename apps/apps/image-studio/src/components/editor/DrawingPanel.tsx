import type { BrushType } from "./hooks/useDrawing";

interface DrawingPanelProps {
  brushType: BrushType;
  brushColor: string;
  brushWidth: number;
  brushOpacity: number;
  sprayDensity?: number;
  onBrushTypeChange: (type: BrushType) => void;
  onBrushColorChange: (color: string) => void;
  onBrushWidthChange: (width: number) => void;
  onBrushOpacityChange: (opacity: number) => void;
  onSprayDensityChange?: (density: number) => void;
  onDone: () => void;
}

const BRUSH_OPTIONS: { type: BrushType; label: string; icon: string }[] = [
  { type: "pencil", label: "Pencil", icon: "✏️" },
  { type: "spray", label: "Spray", icon: "🔫" },
  { type: "circles", label: "Circles", icon: "⭕" },
  { type: "eraser", label: "Eraser", icon: "🧹" },
];

export function DrawingPanel({
  brushType,
  brushColor,
  brushWidth,
  brushOpacity,
  sprayDensity = 20,
  onBrushTypeChange,
  onBrushColorChange,
  onBrushWidthChange,
  onBrushOpacityChange,
  onSprayDensityChange,
  onDone,
}: DrawingPanelProps) {
  const showColor = brushType !== "eraser";
  const showOpacity = brushType !== "eraser";

  return (
    <div className="space-y-3">
      <div>
        <h4 className="text-xs font-semibold uppercase text-muted-foreground">Drawing</h4>
        <p className="text-[10px] text-muted-foreground mt-0.5">
          Draw freely on the canvas
        </p>
      </div>

      {/* Brush Type — 2x2 grid */}
      <div className="grid grid-cols-2 gap-1">
        {BRUSH_OPTIONS.map(({ type, label }) => (
          <button
            key={type}
            onClick={() => onBrushTypeChange(type)}
            className={`px-3 py-1.5 text-xs rounded-md border transition-colors ${
              brushType === type ? "bg-primary/10 text-primary border-primary" : "hover:bg-accent"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Color */}
      {showColor && (
        <div>
          <label className="text-[10px] text-muted-foreground uppercase">Color</label>
          <div className="flex items-center gap-2 mt-1">
            <input
              type="color"
              value={brushColor}
              onChange={(e) => onBrushColorChange(e.target.value)}
              className="h-7 w-7 rounded border cursor-pointer"
            />
            <span className="text-xs text-muted-foreground">{brushColor}</span>
          </div>
        </div>
      )}

      {/* Width */}
      <div>
        <label className="text-[10px] text-muted-foreground flex justify-between">
          <span>Width</span>
          <span>{brushWidth}px</span>
        </label>
        <input
          type="range"
          min="1"
          max="50"
          step="1"
          value={brushWidth}
          onChange={(e) => onBrushWidthChange(parseInt(e.target.value))}
          className="w-full h-1.5 mt-1"
        />
      </div>

      {/* Spray Density (spray brush only) */}
      {brushType === "spray" && onSprayDensityChange && (
        <div>
          <label className="text-[10px] text-muted-foreground flex justify-between">
            <span>Density</span>
            <span>{sprayDensity}</span>
          </label>
          <input
            type="range"
            min="5"
            max="70"
            step="5"
            value={sprayDensity}
            onChange={(e) => onSprayDensityChange(parseInt(e.target.value))}
            className="w-full h-1.5 mt-1"
          />
        </div>
      )}

      {/* Opacity */}
      {showOpacity && (
        <div>
          <label className="text-[10px] text-muted-foreground flex justify-between">
            <span>Opacity</span>
            <span>{Math.round(brushOpacity * 100)}%</span>
          </label>
          <input
            type="range"
            min="0.1"
            max="1"
            step="0.05"
            value={brushOpacity}
            onChange={(e) => onBrushOpacityChange(parseFloat(e.target.value))}
            className="w-full h-1.5 mt-1"
          />
        </div>
      )}

      <button
        onClick={onDone}
        className="w-full px-3 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
      >
        Done Drawing
      </button>
    </div>
  );
}
