import { useRef, useCallback, useState, useEffect } from "react";

interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface CropOverlayProps {
  cropRect: CropRect;
  onUpdate: (update: Partial<CropRect>) => void;
  onApply: () => void;
  onCancel: () => void;
  containerRect: DOMRect | null;
  viewportTransform: number[];
}

type Handle = "nw" | "ne" | "sw" | "se" | "n" | "s" | "e" | "w";

export function CropOverlay({
  cropRect,
  onUpdate,
  onApply,
  onCancel,
  containerRect,
  viewportTransform,
}: CropOverlayProps) {
  const [dragging, setDragging] = useState<{ type: "move" | Handle; startX: number; startY: number; startRect: CropRect } | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Convert scene coords to screen coords
  const vpt = viewportTransform;
  const screenX = cropRect.x * vpt[0] + vpt[4];
  const screenY = cropRect.y * vpt[3] + vpt[5];
  const screenW = cropRect.width * vpt[0];
  const screenH = cropRect.height * vpt[3];

  const handleMouseDown = useCallback(
    (type: "move" | Handle, e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragging({ type, startX: e.clientX, startY: e.clientY, startRect: { ...cropRect } });
    },
    [cropRect]
  );

  useEffect(() => {
    if (!dragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const dx = (e.clientX - dragging.startX) / vpt[0];
      const dy = (e.clientY - dragging.startY) / vpt[3];
      const sr = dragging.startRect;

      if (dragging.type === "move") {
        onUpdate({ x: sr.x + dx, y: sr.y + dy });
      } else {
        let { x, y, width, height } = sr;

        if (dragging.type.includes("w")) {
          x = sr.x + dx;
          width = sr.width - dx;
        }
        if (dragging.type.includes("e")) {
          width = sr.width + dx;
        }
        if (dragging.type.includes("n")) {
          y = sr.y + dy;
          height = sr.height - dy;
        }
        if (dragging.type.includes("s")) {
          height = sr.height + dy;
        }

        // Enforce minimum size
        if (width < 20) { width = 20; if (dragging.type.includes("w")) x = sr.x + sr.width - 20; }
        if (height < 20) { height = 20; if (dragging.type.includes("n")) y = sr.y + sr.height - 20; }

        onUpdate({ x, y, width, height });
      }
    };

    const handleMouseUp = () => setDragging(null);

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragging, vpt, onUpdate]);

  // Handle keyboard
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Enter") { e.preventDefault(); onApply(); }
      if (e.key === "Escape") { e.preventDefault(); onCancel(); }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onApply, onCancel]);

  const handleCursor: Record<Handle, string> = {
    nw: "nwse-resize", ne: "nesw-resize", sw: "nesw-resize", se: "nwse-resize",
    n: "ns-resize", s: "ns-resize", e: "ew-resize", w: "ew-resize",
  };

  const handles: { pos: Handle; style: React.CSSProperties }[] = [
    { pos: "nw", style: { left: -4, top: -4 } },
    { pos: "ne", style: { right: -4, top: -4 } },
    { pos: "sw", style: { left: -4, bottom: -4 } },
    { pos: "se", style: { right: -4, bottom: -4 } },
    { pos: "n", style: { left: "50%", top: -4, transform: "translateX(-50%)" } },
    { pos: "s", style: { left: "50%", bottom: -4, transform: "translateX(-50%)" } },
    { pos: "w", style: { left: -4, top: "50%", transform: "translateY(-50%)" } },
    { pos: "e", style: { right: -4, top: "50%", transform: "translateY(-50%)" } },
  ];

  return (
    <div ref={overlayRef} className="absolute inset-0 z-30 pointer-events-none">
      {/* Dimmed overlay */}
      <div
        className="absolute inset-0 pointer-events-auto"
        style={{ background: "rgba(0,0,0,0.4)" }}
        onClick={onCancel}
      />

      {/* Crop region (clear hole) */}
      <div
        className="absolute border-2 border-white pointer-events-auto cursor-move"
        style={{
          left: screenX,
          top: screenY,
          width: screenW,
          height: screenH,
          boxShadow: "0 0 0 9999px rgba(0,0,0,0.4)",
          background: "transparent",
        }}
        onMouseDown={(e) => handleMouseDown("move", e)}
      >
        {/* Grid lines (rule of thirds) */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute left-1/3 top-0 bottom-0 w-px bg-white/30" />
          <div className="absolute left-2/3 top-0 bottom-0 w-px bg-white/30" />
          <div className="absolute top-1/3 left-0 right-0 h-px bg-white/30" />
          <div className="absolute top-2/3 left-0 right-0 h-px bg-white/30" />
        </div>

        {/* Resize handles */}
        {handles.map(({ pos, style }) => (
          <div
            key={pos}
            className="absolute w-3 h-3 bg-white border border-gray-400 rounded-sm pointer-events-auto"
            style={{ ...style, cursor: handleCursor[pos] }}
            onMouseDown={(e) => handleMouseDown(pos, e)}
          />
        ))}
      </div>

      {/* Action buttons */}
      <div
        className="absolute flex gap-1.5 pointer-events-auto"
        style={{ left: screenX, top: screenY + screenH + 8 }}
      >
        <button
          onClick={onCancel}
          className="px-2.5 py-1 text-[10px] rounded bg-background border shadow hover:bg-accent"
        >
          Cancel
        </button>
        <button
          onClick={onApply}
          className="px-2.5 py-1 text-[10px] rounded bg-primary text-primary-foreground shadow hover:bg-primary/90"
        >
          Apply Crop
        </button>
      </div>
    </div>
  );
}
