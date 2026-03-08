import { useState, useEffect, useCallback, useRef } from "react";
import type * as fabric from "fabric";

interface FloatingTextToolbarProps {
  selectedObject: fabric.FabricObject | null;
  canvas: fabric.Canvas | null;
}

export function FloatingTextToolbar({ selectedObject, canvas }: FloatingTextToolbarProps) {
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);

  const isText =
    selectedObject?.type === "i-text" || selectedObject?.type === "textbox";

  const updatePosition = useCallback(() => {
    if (!selectedObject || !canvas || !isText) {
      setPosition(null);
      return;
    }

    const bound = selectedObject.getBoundingRect();
    const vpt = canvas.viewportTransform;
    if (!vpt) return;

    // Transform scene-plane coords to viewport coords
    const screenLeft = bound.left * vpt[0] + vpt[4];
    const screenTop = bound.top * vpt[3] + vpt[5];
    const screenWidth = bound.width * vpt[0];

    const toolbarWidth = toolbarRef.current?.offsetWidth ?? 320;
    const left = Math.max(0, screenLeft + screenWidth / 2 - toolbarWidth / 2);
    const top = Math.max(0, screenTop - 44);

    setPosition({ top, left });
  }, [selectedObject, canvas, isText]);

  useEffect(() => {
    updatePosition();
  }, [updatePosition]);

  useEffect(() => {
    if (!canvas || !isText) return;

    const handler = () => updatePosition();
    canvas.on("object:moving", handler);
    canvas.on("object:scaling", handler);
    canvas.on("object:rotating", handler);
    canvas.on("object:modified", handler);

    return () => {
      canvas.off("object:moving", handler);
      canvas.off("object:scaling", handler);
      canvas.off("object:rotating", handler);
      canvas.off("object:modified", handler);
    };
  }, [canvas, isText, updatePosition]);

  if (!isText || !position || !selectedObject || !canvas) return null;

  const obj = selectedObject as any;
  const isBold = obj.fontWeight === "bold";
  const isItalic = obj.fontStyle === "italic";
  const isUnderline = obj.underline === true;
  const fontSize = obj.fontSize ?? 24;

  const update = (prop: string, value: unknown) => {
    selectedObject.set(prop as any, value);
    canvas.renderAll();
    canvas.fire("object:modified", { target: selectedObject });
  };

  return (
    <div
      ref={toolbarRef}
      className="absolute z-40 flex items-center gap-0.5 px-1.5 py-1 rounded-lg shadow-lg border bg-background"
      style={{ top: position.top, left: position.left }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {/* Bold */}
      <ToolbarBtn
        active={isBold}
        onClick={() => update("fontWeight", isBold ? "normal" : "bold")}
        title="Bold"
      >
        <span className="font-bold text-[11px]">B</span>
      </ToolbarBtn>

      {/* Italic */}
      <ToolbarBtn
        active={isItalic}
        onClick={() => update("fontStyle", isItalic ? "normal" : "italic")}
        title="Italic"
      >
        <span className="italic text-[11px]">I</span>
      </ToolbarBtn>

      {/* Underline */}
      <ToolbarBtn
        active={isUnderline}
        onClick={() => update("underline", !isUnderline)}
        title="Underline"
      >
        <span className="underline text-[11px]">U</span>
      </ToolbarBtn>

      <div className="w-px h-4 bg-border mx-0.5" />

      {/* Font Size */}
      <ToolbarBtn onClick={() => update("fontSize", Math.max(8, fontSize - 2))} title="Decrease font size">
        <span className="text-[10px]">A-</span>
      </ToolbarBtn>
      <span className="text-[10px] text-muted-foreground w-5 text-center">{fontSize}</span>
      <ToolbarBtn onClick={() => update("fontSize", Math.min(200, fontSize + 2))} title="Increase font size">
        <span className="text-[10px]">A+</span>
      </ToolbarBtn>

      <div className="w-px h-4 bg-border mx-0.5" />

      {/* Text Color */}
      <input
        type="color"
        value={typeof obj.fill === "string" ? obj.fill : "#000000"}
        onChange={(e) => update("fill", e.target.value)}
        className="h-5 w-5 rounded border cursor-pointer"
        title="Text color"
      />

      <div className="w-px h-4 bg-border mx-0.5" />

      {/* Alignment */}
      {(["left", "center", "right"] as const).map((align) => (
        <ToolbarBtn
          key={align}
          active={obj.textAlign === align}
          onClick={() => update("textAlign", align)}
          title={`Align ${align}`}
        >
          <AlignIcon align={align} />
        </ToolbarBtn>
      ))}
    </div>
  );
}

function ToolbarBtn({
  children,
  active,
  onClick,
  title,
}: {
  children: React.ReactNode;
  active?: boolean;
  onClick: () => void;
  title?: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`px-1.5 py-1 rounded transition-colors ${
        active ? "bg-primary/10 text-primary" : "hover:bg-accent"
      }`}
    >
      {children}
    </button>
  );
}

function AlignIcon({ align }: { align: "left" | "center" | "right" }) {
  return (
    <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      {align === "left" && (
        <>
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="15" y2="12" />
          <line x1="3" y1="18" x2="18" y2="18" />
        </>
      )}
      {align === "center" && (
        <>
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="6" y1="12" x2="18" y2="12" />
          <line x1="4" y1="18" x2="20" y2="18" />
        </>
      )}
      {align === "right" && (
        <>
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="9" y1="12" x2="21" y2="12" />
          <line x1="6" y1="18" x2="21" y2="18" />
        </>
      )}
    </svg>
  );
}
