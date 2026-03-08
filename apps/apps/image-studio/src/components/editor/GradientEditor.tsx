import { useState, useCallback } from "react";
import * as fabric from "fabric";

interface ColorStop {
  offset: number;
  color: string;
}

interface GradientEditorProps {
  type: "linear" | "radial";
  stops: ColorStop[];
  angle: number;
  onChange: (gradient: fabric.Gradient<"linear"> | fabric.Gradient<"radial">) => void;
  objectWidth: number;
  objectHeight: number;
}

export function GradientEditor({
  type,
  stops: initialStops,
  angle: initialAngle,
  onChange,
  objectWidth,
  objectHeight,
}: GradientEditorProps) {
  const [stops, setStops] = useState<ColorStop[]>(
    initialStops.length >= 2
      ? initialStops
      : [
          { offset: 0, color: "#3b82f6" },
          { offset: 1, color: "#8b5cf6" },
        ]
  );
  const [angle, setAngle] = useState(initialAngle);
  const [selectedStopIdx, setSelectedStopIdx] = useState(0);

  const buildGradient = useCallback(
    (currentStops: ColorStop[], currentAngle: number) => {
      const colorStops = currentStops.map((s) => ({
        offset: s.offset,
        color: s.color,
      }));

      if (type === "linear") {
        const rad = (currentAngle * Math.PI) / 180;
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);
        return new fabric.Gradient({
          type: "linear",
          coords: {
            x1: objectWidth / 2 - (cos * objectWidth) / 2,
            y1: objectHeight / 2 - (sin * objectHeight) / 2,
            x2: objectWidth / 2 + (cos * objectWidth) / 2,
            y2: objectHeight / 2 + (sin * objectHeight) / 2,
          },
          colorStops,
        });
      } else {
        return new fabric.Gradient({
          type: "radial",
          coords: {
            x1: objectWidth / 2,
            y1: objectHeight / 2,
            x2: objectWidth / 2,
            y2: objectHeight / 2,
            r1: 0,
            r2: Math.max(objectWidth, objectHeight) / 2,
          },
          colorStops,
        });
      }
    },
    [type, objectWidth, objectHeight]
  );

  const applyGradient = useCallback(
    (newStops: ColorStop[], newAngle: number) => {
      onChange(buildGradient(newStops, newAngle));
    },
    [buildGradient, onChange]
  );

  const handleStopColorChange = useCallback(
    (idx: number, color: string) => {
      const newStops = stops.map((s, i) => (i === idx ? { ...s, color } : s));
      setStops(newStops);
      applyGradient(newStops, angle);
    },
    [stops, angle, applyGradient]
  );

  const handleStopOffsetChange = useCallback(
    (idx: number, offset: number) => {
      const clamped = Math.max(0, Math.min(1, offset));
      const newStops = stops.map((s, i) => (i === idx ? { ...s, offset: clamped } : s));
      newStops.sort((a, b) => a.offset - b.offset);
      setStops(newStops);
      // Recalculate selected index after sort
      const newIdx = newStops.findIndex(
        (s) => s.offset === clamped && s.color === stops[idx].color
      );
      setSelectedStopIdx(newIdx >= 0 ? newIdx : 0);
      applyGradient(newStops, angle);
    },
    [stops, angle, applyGradient]
  );

  const handleAngleChange = useCallback(
    (newAngle: number) => {
      setAngle(newAngle);
      applyGradient(stops, newAngle);
    },
    [stops, applyGradient]
  );

  const addStop = useCallback(() => {
    if (stops.length >= 6) return;
    const newStop: ColorStop = { offset: 0.5, color: "#ffffff" };
    const newStops = [...stops, newStop].sort((a, b) => a.offset - b.offset);
    setStops(newStops);
    setSelectedStopIdx(newStops.indexOf(newStop));
    applyGradient(newStops, angle);
  }, [stops, angle, applyGradient]);

  const removeStop = useCallback(
    (idx: number) => {
      if (stops.length <= 2) return;
      const newStops = stops.filter((_, i) => i !== idx);
      setStops(newStops);
      setSelectedStopIdx(Math.min(selectedStopIdx, newStops.length - 1));
      applyGradient(newStops, angle);
    },
    [stops, selectedStopIdx, angle, applyGradient]
  );

  // Build CSS gradient for preview
  const previewGradient =
    type === "linear"
      ? `linear-gradient(${angle}deg, ${stops.map((s) => `${s.color} ${Math.round(s.offset * 100)}%`).join(", ")})`
      : `radial-gradient(circle, ${stops.map((s) => `${s.color} ${Math.round(s.offset * 100)}%`).join(", ")})`;

  return (
    <div className="space-y-2">
      {/* Gradient preview bar */}
      <div
        className="h-6 rounded border cursor-pointer"
        style={{ background: previewGradient }}
      />

      {/* Color stops */}
      <div className="space-y-1">
        {stops.map((stop, idx) => (
          <div
            key={idx}
            className={`flex items-center gap-1.5 px-1.5 py-1 rounded text-[10px] cursor-pointer ${
              selectedStopIdx === idx ? "bg-primary/10" : "hover:bg-accent"
            }`}
            onClick={() => setSelectedStopIdx(idx)}
          >
            <input
              type="color"
              value={stop.color}
              onChange={(e) => handleStopColorChange(idx, e.target.value)}
              className="h-5 w-5 rounded border cursor-pointer"
            />
            <input
              type="number"
              min="0"
              max="100"
              value={Math.round(stop.offset * 100)}
              onChange={(e) => handleStopOffsetChange(idx, parseInt(e.target.value) / 100)}
              className="w-12 px-1 py-0.5 text-[10px] rounded border bg-background"
            />
            <span className="text-muted-foreground">%</span>
            {stops.length > 2 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeStop(idx);
                }}
                className="text-muted-foreground hover:text-destructive ms-auto"
                title="Remove stop"
              >
                &times;
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Add stop button */}
      {stops.length < 6 && (
        <button
          onClick={addStop}
          className="w-full px-2 py-1 text-[10px] rounded border hover:bg-accent"
        >
          + Add Color Stop
        </button>
      )}

      {/* Angle slider (linear only) */}
      {type === "linear" && (
        <div>
          <label className="text-[10px] text-muted-foreground">Angle: {angle}°</label>
          <input
            type="range"
            min="0"
            max="360"
            value={angle}
            onChange={(e) => handleAngleChange(parseInt(e.target.value))}
            className="w-full h-1.5"
          />
        </div>
      )}
    </div>
  );
}

/** Parse a fabric.Gradient into editable parts */
export function parseGradient(fill: unknown): {
  type: "linear" | "radial";
  stops: ColorStop[];
  angle: number;
} | null {
  if (!fill || typeof fill === "string") return null;
  const g = fill as any;
  if (!g.type || !g.colorStops) return null;

  const stops: ColorStop[] = (g.colorStops as any[]).map((cs) => ({
    offset: cs.offset ?? 0,
    color: cs.color ?? "#000000",
  }));

  let angle = 0;
  if (g.type === "linear" && g.coords) {
    const dx = (g.coords.x2 ?? 0) - (g.coords.x1 ?? 0);
    const dy = (g.coords.y2 ?? 0) - (g.coords.y1 ?? 0);
    angle = Math.round((Math.atan2(dy, dx) * 180) / Math.PI);
    if (angle < 0) angle += 360;
  }

  return { type: g.type as "linear" | "radial", stops, angle };
}
