import { useCallback, useState, useEffect } from "react";

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
  const [dragging, setDragging] = useState<{
    type: "move" | Handle;
    startX: number;
    startY: number;
    startRect: CropRect;
  } | null>(null);

  // Convert scene coords to screen coords
  const vpt = viewportTransform;
  const screenX = cropRect.x * vpt[0] + vpt[4];
  const screenY = cropRect.y * vpt[3] + vpt[5];
  const screenW = cropRect.width * vpt[0];
  const screenH = cropRect.height * vpt[3];

  const displayW = Math.round(cropRect.width);
  const displayH = Math.round(cropRect.height);

  const handleMouseDown = useCallback(
    (type: "move" | Handle, e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragging({
        type,
        startX: e.clientX,
        startY: e.clientY,
        startRect: { ...cropRect },
      });
    },
    [cropRect],
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
        if (dragging.type.includes("e")) width = sr.width + dx;
        if (dragging.type.includes("n")) {
          y = sr.y + dy;
          height = sr.height - dy;
        }
        if (dragging.type.includes("s")) height = sr.height + dy;

        if (width < 20) {
          width = 20;
          if (dragging.type.includes("w")) x = sr.x + sr.width - 20;
        }
        if (height < 20) {
          height = 20;
          if (dragging.type.includes("n")) y = sr.y + sr.height - 20;
        }

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

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        onApply();
      }
      if (e.key === "Escape") {
        e.preventDefault();
        onCancel();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onApply, onCancel]);

  const handleCursor: Record<Handle, string> = {
    nw: "nwse-resize",
    ne: "nesw-resize",
    sw: "nesw-resize",
    se: "nwse-resize",
    n: "ns-resize",
    s: "ns-resize",
    e: "ew-resize",
    w: "ew-resize",
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

  const handleWidthChange = (val: string) => {
    const n = parseInt(val, 10);
    if (!isNaN(n) && n >= 20) onUpdate({ width: n });
  };
  const handleHeightChange = (val: string) => {
    const n = parseInt(val, 10);
    if (!isNaN(n) && n >= 20) onUpdate({ height: n });
  };

  return (
    /*
     * Single overlay container — standard modal pattern.
     * Clicking the background (this div directly) cancels.
     * Children use stopPropagation so their clicks don't reach here.
     */
    <div
      className="absolute inset-0"
      style={{ zIndex: 50 }}
      onMouseDown={(e) => {
        // Only cancel when clicking the dimmed background directly
        if (e.target === e.currentTarget) {
          e.preventDefault();
          onCancel();
        }
      }}
    >
      {/* Crop region with dimming via box-shadow */}
      <div
        className="absolute border-2 border-white cursor-move"
        style={{
          left: screenX,
          top: screenY,
          width: screenW,
          height: screenH,
          boxShadow: "0 0 0 9999px rgba(0,0,0,0.65)",
          background: "transparent",
        }}
        onMouseDown={(e) => {
          e.stopPropagation();
          handleMouseDown("move", e);
        }}
      >
        {/* Rule of thirds grid */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute left-1/3 top-0 bottom-0 w-px bg-white/60" />
          <div className="absolute left-2/3 top-0 bottom-0 w-px bg-white/60" />
          <div className="absolute top-1/3 left-0 right-0 h-px bg-white/60" />
          <div className="absolute top-2/3 left-0 right-0 h-px bg-white/60" />
        </div>

        {/* Resize handles */}
        {handles.map(({ pos, style }) => (
          <div
            key={pos}
            className="absolute w-3 h-3 bg-white border border-gray-400 rounded-sm"
            style={{ ...style, cursor: handleCursor[pos] }}
            onMouseDown={(e) => {
              e.stopPropagation();
              handleMouseDown(pos, e);
            }}
          />
        ))}
      </div>

      {/* Toolbar: dimensions + buttons */}
      <div
        className="absolute flex items-center gap-2"
        style={{ left: screenX, top: screenY + screenH + 10 }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Dimension inputs */}
        <div className="flex items-center gap-1 px-2 py-1 rounded bg-black/80 text-white text-[10px] font-mono select-none">
          <span className="text-white/60">W</span>
          <input
            type="number"
            value={displayW}
            onChange={(e) => handleWidthChange(e.target.value)}
            onMouseDown={(e) => e.stopPropagation()}
            className="w-12 bg-white/10 border border-white/20 rounded px-1 py-0.5 text-[10px] text-white text-center font-mono outline-none focus:border-blue-400"
            min={20}
          />
          <span className="text-white/40 mx-0.5">&times;</span>
          <span className="text-white/60">H</span>
          <input
            type="number"
            value={displayH}
            onChange={(e) => handleHeightChange(e.target.value)}
            onMouseDown={(e) => e.stopPropagation()}
            className="w-12 bg-white/10 border border-white/20 rounded px-1 py-0.5 text-[10px] text-white text-center font-mono outline-none focus:border-blue-400"
            min={20}
          />
          <span className="text-white/50 ml-1">px</span>
        </div>

        <button
          onMouseDown={(e) => e.stopPropagation()}
          onClick={onCancel}
          className="px-2.5 py-1.5 text-[10px] font-medium rounded bg-white border border-gray-300 shadow-sm hover:bg-gray-100 text-gray-700"
        >
          Cancel
        </button>
        <button
          onMouseDown={(e) => e.stopPropagation()}
          onClick={onApply}
          className="px-2.5 py-1.5 text-[10px] font-medium rounded bg-blue-600 text-white shadow-sm hover:bg-blue-700"
        >
          Apply Crop
        </button>
      </div>
    </div>
  );
}
