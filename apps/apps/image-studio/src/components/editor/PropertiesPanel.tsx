import { useEffect, useState, useCallback } from "react";
import * as fabric from "fabric";
import { AlignmentToolbar } from "./AlignmentToolbar";
import { GradientEditor, parseGradient } from "./GradientEditor";

const FONT_FAMILIES_GROUPED = {
  "Sans-serif": [
    "Arial", "Helvetica", "Verdana", "Trebuchet MS", "Segoe UI", "Tahoma",
    "Open Sans", "Roboto", "Lato", "Montserrat", "Poppins", "Inter", "Nunito",
  ],
  "Serif": [
    "Times New Roman", "Georgia", "Garamond", "Palatino", "Cambria",
    "Merriweather", "Playfair Display", "Lora",
  ],
  "Display": [
    "Impact", "Oswald", "Bebas Neue", "Anton", "Pacifico", "Lobster",
  ],
  "Monospace": [
    "Courier New", "Consolas", "Monaco", "Fira Code", "JetBrains Mono",
  ],
};

const FONT_FAMILIES = Object.values(FONT_FAMILIES_GROUPED).flat();

const BLEND_MODES = [
  { value: "source-over", label: "Normal" },
  { value: "multiply", label: "Multiply" },
  { value: "screen", label: "Screen" },
  { value: "overlay", label: "Overlay" },
  { value: "darken", label: "Darken" },
  { value: "lighten", label: "Lighten" },
  { value: "color-dodge", label: "Color Dodge" },
  { value: "color-burn", label: "Color Burn" },
  { value: "hard-light", label: "Hard Light" },
  { value: "soft-light", label: "Soft Light" },
  { value: "difference", label: "Difference" },
  { value: "exclusion", label: "Exclusion" },
];

const GOOGLE_FONTS = new Set([
  "Open Sans", "Roboto", "Lato", "Montserrat", "Poppins", "Inter", "Nunito",
  "Merriweather", "Playfair Display", "Lora",
  "Oswald", "Bebas Neue", "Anton", "Pacifico", "Lobster",
  "Fira Code", "JetBrains Mono",
]);

const loadedFonts = new Set<string>();

function loadGoogleFont(fontFamily: string) {
  if (loadedFonts.has(fontFamily) || !GOOGLE_FONTS.has(fontFamily)) return;
  loadedFonts.add(fontFamily);
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontFamily)}:wght@400;700&display=swap`;
  document.head.appendChild(link);
}

interface PropertiesPanelProps {
  selectedObject: fabric.FabricObject | null;
  canvas: fabric.Canvas | null;
  onBringForward: () => void;
  onSendBackward: () => void;
  onDelete: () => void;
  onFlipHorizontal?: () => void;
  onFlipVertical?: () => void;
  onAlign?: (alignment: "left" | "centerH" | "right" | "top" | "centerV" | "bottom") => void;
  onDistribute?: (direction: "horizontal" | "vertical") => void;
  onGroup?: () => void;
  onUngroup?: () => void;
  hasMultipleSelected?: boolean;
  onEyedropper?: (target: "fill" | "stroke") => void;
  eyedropperTarget?: "fill" | "stroke" | null;
  onCrop?: () => void;
  onResetCrop?: () => void;
  isImage?: boolean;
  hasClipPath?: boolean;
}

export function PropertiesPanel({
  selectedObject,
  canvas,
  onBringForward,
  onSendBackward,
  onDelete,
  onFlipHorizontal,
  onFlipVertical,
  onAlign,
  onDistribute,
  onGroup,
  onUngroup,
  hasMultipleSelected,
  onEyedropper,
  eyedropperTarget,
  onCrop,
  onResetCrop,
  isImage,
  hasClipPath,
}: PropertiesPanelProps) {
  const [props, setProps] = useState({
    left: 0,
    top: 0,
    width: 0,
    height: 0,
    angle: 0,
    opacity: 1,
    fill: "#000000",
    fillType: "solid" as "solid" | "linear" | "radial",
    fontSize: 24,
    fontFamily: "Arial",
    fontWeight: "normal" as string,
    fontStyle: "normal" as string,
    underline: false,
    linethrough: false,
    textAlign: "left" as string,
    charSpacing: 0,
    lineHeight: 1.16,
    stroke: "",
    strokeWidth: 0,
    strokeDashArray: "" as string,
    blendMode: "source-over" as string,
    rx: 0,
    hasShadow: false,
    shadowColor: "#00000066",
    shadowOffsetX: 4,
    shadowOffsetY: 4,
    shadowBlur: 8,
  });

  const syncFromObject = useCallback((obj: fabric.FabricObject) => {
    const scaleX = obj.scaleX ?? 1;
    const scaleY = obj.scaleY ?? 1;
    const o = obj as any;
    const shadow = obj.shadow as any;

    setProps({
      left: Math.round(obj.left ?? 0),
      top: Math.round(obj.top ?? 0),
      width: Math.round((obj.width ?? 0) * scaleX),
      height: Math.round((obj.height ?? 0) * scaleY),
      angle: Math.round(obj.angle ?? 0),
      opacity: obj.opacity ?? 1,
      fill: (typeof obj.fill === "string" ? obj.fill : "#000000"),
      fillType: typeof obj.fill === "string" ? "solid" : (parseGradient(obj.fill)?.type ?? "solid"),
      fontSize: o.fontSize ?? 24,
      fontFamily: o.fontFamily ?? "Arial",
      fontWeight: o.fontWeight ?? "normal",
      fontStyle: o.fontStyle ?? "normal",
      underline: o.underline ?? false,
      linethrough: o.linethrough ?? false,
      textAlign: o.textAlign ?? "left",
      charSpacing: o.charSpacing ?? 0,
      lineHeight: o.lineHeight ?? 1.16,
      stroke: (typeof obj.stroke === "string" ? obj.stroke : ""),
      strokeWidth: obj.strokeWidth ?? 0,
      strokeDashArray: (obj.strokeDashArray ?? []).join(","),
      blendMode: (obj as any).globalCompositeOperation ?? "source-over",
      rx: o.rx ?? 0,
      hasShadow: !!shadow,
      shadowColor: shadow?.color ?? "#00000066",
      shadowOffsetX: shadow?.offsetX ?? 4,
      shadowOffsetY: shadow?.offsetY ?? 4,
      shadowBlur: shadow?.blur ?? 8,
    });
  }, []);

  // Sync props when selected object changes
  useEffect(() => {
    if (!selectedObject) return;
    syncFromObject(selectedObject);
  }, [selectedObject, syncFromObject]);

  // Sync props when object is moved/resized/rotated on canvas
  useEffect(() => {
    if (!canvas || !selectedObject) return;

    const onObjectChange = (e: any) => {
      const target = e.target ?? e.transform?.target;
      if (target === selectedObject) syncFromObject(target);
    };

    canvas.on("object:moving", onObjectChange);
    canvas.on("object:scaling", onObjectChange);
    canvas.on("object:rotating", onObjectChange);
    canvas.on("object:modified", onObjectChange);

    return () => {
      canvas.off("object:moving", onObjectChange);
      canvas.off("object:scaling", onObjectChange);
      canvas.off("object:rotating", onObjectChange);
      canvas.off("object:modified", onObjectChange);
    };
  }, [canvas, selectedObject, syncFromObject]);

  const updateProp = useCallback(
    (prop: string, value: number | string | boolean) => {
      if (!selectedObject || !canvas) return;

      if (prop === "width") {
        const currentWidth = selectedObject.width ?? 1;
        selectedObject.set("scaleX", (value as number) / currentWidth);
      } else if (prop === "height") {
        const currentHeight = selectedObject.height ?? 1;
        selectedObject.set("scaleY", (value as number) / currentHeight);
      } else {
        selectedObject.set(prop as any, value);
      }

      selectedObject.setCoords();
      setProps((p) => ({ ...p, [prop]: value }));
      canvas.renderAll();
      canvas.fire("object:modified", { target: selectedObject });
    },
    [selectedObject, canvas]
  );

  const updateShadow = useCallback(
    (enabled: boolean, shadowProps?: { color?: string; offsetX?: number; offsetY?: number; blur?: number }) => {
      if (!selectedObject || !canvas) return;

      if (!enabled) {
        selectedObject.set("shadow", null);
      } else {
        const current = (selectedObject.shadow as any) || {};
        // Dynamic import of fabric Shadow
        selectedObject.set("shadow", {
          color: shadowProps?.color ?? current.color ?? "#00000066",
          offsetX: shadowProps?.offsetX ?? current.offsetX ?? 4,
          offsetY: shadowProps?.offsetY ?? current.offsetY ?? 4,
          blur: shadowProps?.blur ?? current.blur ?? 8,
        } as any);
      }

      canvas.renderAll();
      canvas.fire("object:modified", { target: selectedObject });
    },
    [selectedObject, canvas]
  );

  if (!selectedObject) {
    return (
      <div className="p-4">
        <p className="text-xs text-muted-foreground text-center mt-10">
          Select an object to edit its properties
        </p>
      </div>
    );
  }

  const isText = selectedObject.type === "i-text" || selectedObject.type === "textbox";
  const isShape = ["rect", "circle", "triangle", "polygon", "line", "path"].includes(selectedObject.type ?? "");
  const isRect = selectedObject.type === "rect";

  return (
    <div className="p-3 space-y-3">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase">Properties</h3>

      {/* Position */}
      <Section label="Position">
        <div className="grid grid-cols-2 gap-1.5">
          <PropInput label="X" value={props.left} onChange={(v) => updateProp("left", v)} />
          <PropInput label="Y" value={props.top} onChange={(v) => updateProp("top", v)} />
        </div>
      </Section>

      {/* Size */}
      <Section label="Size">
        <div className="grid grid-cols-2 gap-1.5">
          <PropInput label="W" value={props.width} onChange={(v) => updateProp("width", v)} />
          <PropInput label="H" value={props.height} onChange={(v) => updateProp("height", v)} />
        </div>
      </Section>

      {/* Rotation */}
      <Section label="Rotation">
        <PropInput label="deg" value={props.angle} onChange={(v) => updateProp("angle", v)} />
      </Section>

      {/* Flip */}
      {(onFlipHorizontal || onFlipVertical) && (
        <Section label="Flip">
          <div className="flex gap-1">
            {onFlipHorizontal && (
              <button onClick={onFlipHorizontal} className="flex-1 px-2 py-1.5 text-[10px] rounded border hover:bg-accent">
                ↔ H
              </button>
            )}
            {onFlipVertical && (
              <button onClick={onFlipVertical} className="flex-1 px-2 py-1.5 text-[10px] rounded border hover:bg-accent">
                ↕ V
              </button>
            )}
          </div>
        </Section>
      )}

      {/* Opacity */}
      <Section label="Opacity">
        <div className="flex items-center gap-2">
          <input type="range" min="0" max="1" step="0.05" value={props.opacity}
            onChange={(e) => updateProp("opacity", parseFloat(e.target.value))}
            className="flex-1 h-1.5" />
          <span className="text-[10px] text-muted-foreground w-8 text-right">
            {Math.round(props.opacity * 100)}%
          </span>
        </div>
      </Section>

      {/* Blend Mode */}
      <Section label="Blend Mode">
        <select
          value={props.blendMode}
          onChange={(e) => {
            const mode = e.target.value;
            setProps((p) => ({ ...p, blendMode: mode }));
            if (!selectedObject || !canvas) return;
            (selectedObject as any).globalCompositeOperation = mode;
            canvas.renderAll();
            canvas.fire("object:modified", { target: selectedObject });
          }}
          className="w-full px-1.5 py-1 text-xs rounded border bg-background"
        >
          {BLEND_MODES.map((m) => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>
      </Section>

      {/* Fill */}
      <Section label={isText ? "Text Color" : "Fill"}>
        {/* Fill type selector (shapes/text only) */}
        {(isShape || isText) && !isText && (
          <div className="flex gap-0.5 mb-1.5">
            {(["solid", "linear", "radial"] as const).map((ft) => (
              <button
                key={ft}
                onClick={() => {
                  setProps((p) => ({ ...p, fillType: ft }));
                  if (ft === "solid") {
                    updateProp("fill", props.fill || "#3b82f6");
                  }
                }}
                className={`flex-1 px-1.5 py-1 text-[9px] rounded border transition-colors ${
                  props.fillType === ft ? "bg-primary/10 text-primary border-primary" : "hover:bg-accent"
                }`}
              >
                {ft.charAt(0).toUpperCase() + ft.slice(1)}
              </button>
            ))}
          </div>
        )}

        {props.fillType === "solid" || isText ? (
          <div className="flex items-center gap-2">
            <input type="color" value={props.fill}
              onChange={(e) => { setProps((p) => ({ ...p, fill: e.target.value })); updateProp("fill", e.target.value); }}
              className="h-7 w-7 rounded border cursor-pointer" />
            <span className="text-[10px] text-muted-foreground flex-1">{props.fill}</span>
            {onEyedropper && (
              <button
                onClick={() => onEyedropper("fill")}
                className={`p-1 rounded border text-[10px] ${
                  eyedropperTarget === "fill" ? "bg-primary/10 text-primary border-primary" : "hover:bg-accent"
                }`}
                title="Eyedropper — pick fill color from canvas"
              >
                <EyedropperIcon />
              </button>
            )}
          </div>
        ) : (
          <GradientEditor
            type={props.fillType}
            stops={parseGradient(selectedObject?.fill)?.stops ?? [{ offset: 0, color: "#3b82f6" }, { offset: 1, color: "#8b5cf6" }]}
            angle={parseGradient(selectedObject?.fill)?.angle ?? 0}
            objectWidth={(selectedObject?.width ?? 100) * (selectedObject?.scaleX ?? 1)}
            objectHeight={(selectedObject?.height ?? 100) * (selectedObject?.scaleY ?? 1)}
            onChange={(gradient) => {
              if (!selectedObject || !canvas) return;
              selectedObject.set("fill", gradient);
              canvas.renderAll();
              canvas.fire("object:modified", { target: selectedObject });
            }}
          />
        )}
      </Section>

      {/* ===== TEXT-SPECIFIC CONTROLS ===== */}
      {isText && (
        <>
          {/* Font Family */}
          <Section label="Font">
            <select
              value={props.fontFamily}
              onChange={(e) => {
                const font = e.target.value;
                loadGoogleFont(font);
                setProps((p) => ({ ...p, fontFamily: font }));
                updateProp("fontFamily", font);
              }}
              className="w-full px-1.5 py-1 text-xs rounded border bg-background"
            >
              {Object.entries(FONT_FAMILIES_GROUPED).map(([group, fonts]) => (
                <optgroup key={group} label={group}>
                  {fonts.map((f) => (
                    <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </Section>

          {/* Font Size */}
          <Section label="Size">
            <PropInput label="px" value={props.fontSize} onChange={(v) => updateProp("fontSize", v)} />
          </Section>

          {/* Text Style (B / I / U / S) */}
          <Section label="Style">
            <div className="flex gap-1">
              <StyleToggle label="B" active={props.fontWeight === "bold"}
                onClick={() => {
                  const v = props.fontWeight === "bold" ? "normal" : "bold";
                  setProps((p) => ({ ...p, fontWeight: v }));
                  updateProp("fontWeight", v);
                }} bold />
              <StyleToggle label="I" active={props.fontStyle === "italic"}
                onClick={() => {
                  const v = props.fontStyle === "italic" ? "normal" : "italic";
                  setProps((p) => ({ ...p, fontStyle: v }));
                  updateProp("fontStyle", v);
                }} italic />
              <StyleToggle label="U" active={props.underline}
                onClick={() => {
                  setProps((p) => ({ ...p, underline: !p.underline }));
                  updateProp("underline", !props.underline);
                }} underline />
              <StyleToggle label="S" active={props.linethrough}
                onClick={() => {
                  setProps((p) => ({ ...p, linethrough: !p.linethrough }));
                  updateProp("linethrough", !props.linethrough);
                }} strikethrough />
            </div>
          </Section>

          {/* Text Alignment */}
          <Section label="Align">
            <div className="flex gap-1">
              {(["left", "center", "right"] as const).map((align) => (
                <button key={align}
                  onClick={() => { setProps((p) => ({ ...p, textAlign: align })); updateProp("textAlign", align); }}
                  className={`flex-1 px-2 py-1.5 text-[10px] rounded border transition-colors ${
                    props.textAlign === align ? "bg-primary/10 text-primary border-primary" : "hover:bg-accent"
                  }`}>
                  {align.charAt(0).toUpperCase() + align.slice(1)}
                </button>
              ))}
            </div>
          </Section>

          {/* Case Transforms */}
          <Section label="Case">
            <div className="flex gap-1">
              <button
                onClick={() => {
                  const o = selectedObject as any;
                  if (o.text) {
                    updateProp("text", o.text.toUpperCase());
                  }
                }}
                className="flex-1 px-2 py-1.5 text-[10px] rounded border hover:bg-accent"
              >
                UPPER
              </button>
              <button
                onClick={() => {
                  const o = selectedObject as any;
                  if (o.text) {
                    updateProp("text", o.text.toLowerCase());
                  }
                }}
                className="flex-1 px-2 py-1.5 text-[10px] rounded border hover:bg-accent"
              >
                lower
              </button>
              <button
                onClick={() => {
                  const o = selectedObject as any;
                  if (o.text) {
                    updateProp(
                      "text",
                      o.text.replace(/\w\S*/g, (t: string) =>
                        t.charAt(0).toUpperCase() + t.slice(1).toLowerCase()
                      )
                    );
                  }
                }}
                className="flex-1 px-2 py-1.5 text-[10px] rounded border hover:bg-accent"
              >
                Title
              </button>
            </div>
          </Section>

          {/* Letter Spacing */}
          <Section label="Letter Spacing">
            <div className="flex items-center gap-2">
              <input type="range" min="0" max="1000" step="10" value={props.charSpacing}
                onChange={(e) => {
                  const v = parseInt(e.target.value);
                  setProps((p) => ({ ...p, charSpacing: v }));
                  updateProp("charSpacing", v);
                }}
                className="flex-1 h-1.5" />
              <span className="text-[10px] text-muted-foreground w-8 text-right">{props.charSpacing}</span>
            </div>
          </Section>

          {/* Line Height */}
          <Section label="Line Height">
            <div className="flex items-center gap-2">
              <input type="range" min="0.5" max="3" step="0.1" value={props.lineHeight}
                onChange={(e) => {
                  const v = parseFloat(e.target.value);
                  setProps((p) => ({ ...p, lineHeight: v }));
                  updateProp("lineHeight", v);
                }}
                className="flex-1 h-1.5" />
              <span className="text-[10px] text-muted-foreground w-8 text-right">{props.lineHeight.toFixed(1)}</span>
            </div>
          </Section>
        </>
      )}

      {/* ===== SHAPE-SPECIFIC CONTROLS ===== */}
      {(isShape || isText) && (
        <>
          {/* Stroke */}
          <Section label="Stroke">
            <div className="flex items-center gap-2">
              <input type="color" value={props.stroke || "#000000"}
                onChange={(e) => { setProps((p) => ({ ...p, stroke: e.target.value })); updateProp("stroke", e.target.value); }}
                className="h-6 w-6 rounded border cursor-pointer" />
              {onEyedropper && (
                <button
                  onClick={() => onEyedropper("stroke")}
                  className={`p-1 rounded border text-[10px] ${
                    eyedropperTarget === "stroke" ? "bg-primary/10 text-primary border-primary" : "hover:bg-accent"
                  }`}
                  title="Eyedropper — pick stroke color from canvas"
                >
                  <EyedropperIcon />
                </button>
              )}
              <input type="number" min="0" max="20" value={props.strokeWidth}
                onChange={(e) => {
                  const v = parseInt(e.target.value) || 0;
                  setProps((p) => ({ ...p, strokeWidth: v }));
                  updateProp("strokeWidth", v);
                }}
                className="w-14 px-1.5 py-1 text-xs rounded border bg-background" />
              <span className="text-[10px] text-muted-foreground">px</span>
            </div>
            {/* Dash pattern */}
            {props.strokeWidth > 0 && (
              <select
                value={props.strokeDashArray}
                onChange={(e) => {
                  const val = e.target.value;
                  setProps((p) => ({ ...p, strokeDashArray: val }));
                  if (!selectedObject || !canvas) return;
                  const arr = val ? val.split(",").map(Number) : [];
                  selectedObject.set("strokeDashArray", arr.length > 0 ? arr : undefined);
                  canvas.renderAll();
                  canvas.fire("object:modified", { target: selectedObject });
                }}
                className="w-full mt-1.5 px-1.5 py-1 text-xs rounded border bg-background"
              >
                <option value="">Solid</option>
                <option value="10,5">Dashed</option>
                <option value="2,5">Dotted</option>
                <option value="10,5,2,5">Dash-Dot</option>
                <option value="20,5">Long Dash</option>
              </select>
            )}
          </Section>

          {/* Corner Radius (rect only) */}
          {isRect && (
            <Section label="Corners">
              <div className="flex items-center gap-2">
                <input type="range" min="0" max="50" step="1" value={props.rx}
                  onChange={(e) => {
                    const v = parseInt(e.target.value);
                    setProps((p) => ({ ...p, rx: v }));
                    updateProp("rx", v);
                    updateProp("ry", v);
                  }}
                  className="flex-1 h-1.5" />
                <span className="text-[10px] text-muted-foreground w-8 text-right">{props.rx}px</span>
              </div>
            </Section>
          )}

          {/* Shadow */}
          <Section label="Shadow">
            <label className="flex items-center gap-2 cursor-pointer mb-1.5">
              <input type="checkbox" checked={props.hasShadow}
                onChange={(e) => {
                  const enabled = e.target.checked;
                  setProps((p) => ({ ...p, hasShadow: enabled }));
                  updateShadow(enabled);
                }}
                className="rounded" />
              <span className="text-[10px] text-muted-foreground">Drop Shadow</span>
            </label>
            {props.hasShadow && (
              <div className="space-y-1.5 pl-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground w-6">Color</span>
                  <input type="color" value={props.shadowColor.slice(0, 7)}
                    onChange={(e) => {
                      const c = e.target.value + "66";
                      setProps((p) => ({ ...p, shadowColor: c }));
                      updateShadow(true, { color: c });
                    }}
                    className="h-5 w-5 rounded border cursor-pointer" />
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-muted-foreground w-6">X</span>
                  <input type="range" min="-20" max="20" value={props.shadowOffsetX}
                    onChange={(e) => {
                      const v = parseInt(e.target.value);
                      setProps((p) => ({ ...p, shadowOffsetX: v }));
                      updateShadow(true, { offsetX: v });
                    }}
                    className="flex-1 h-1.5" />
                  <span className="text-[10px] text-muted-foreground w-5 text-right">{props.shadowOffsetX}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-muted-foreground w-6">Y</span>
                  <input type="range" min="-20" max="20" value={props.shadowOffsetY}
                    onChange={(e) => {
                      const v = parseInt(e.target.value);
                      setProps((p) => ({ ...p, shadowOffsetY: v }));
                      updateShadow(true, { offsetY: v });
                    }}
                    className="flex-1 h-1.5" />
                  <span className="text-[10px] text-muted-foreground w-5 text-right">{props.shadowOffsetY}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-muted-foreground w-6">Blur</span>
                  <input type="range" min="0" max="20" value={props.shadowBlur}
                    onChange={(e) => {
                      const v = parseInt(e.target.value);
                      setProps((p) => ({ ...p, shadowBlur: v }));
                      updateShadow(true, { blur: v });
                    }}
                    className="flex-1 h-1.5" />
                  <span className="text-[10px] text-muted-foreground w-5 text-right">{props.shadowBlur}</span>
                </div>
              </div>
            )}
          </Section>
        </>
      )}

      {/* Alignment */}
      {onAlign && onDistribute && (
        <>
          <div className="w-full h-px bg-border" />
          <AlignmentToolbar
            hasMultipleSelected={!!hasMultipleSelected}
            onAlign={onAlign}
            onDistribute={onDistribute}
          />
        </>
      )}

      <div className="w-full h-px bg-border" />

      {/* Layer Actions */}
      <div className="flex gap-1">
        <button onClick={onBringForward} className="flex-1 px-2 py-1.5 text-[10px] rounded border hover:bg-accent" title="Bring Forward">
          Forward
        </button>
        <button onClick={onSendBackward} className="flex-1 px-2 py-1.5 text-[10px] rounded border hover:bg-accent" title="Send Backward">
          Backward
        </button>
      </div>

      {/* Group/Ungroup */}
      {(onGroup || onUngroup) && (
        <div className="flex gap-1">
          {onGroup && hasMultipleSelected && (
            <button onClick={onGroup}
              className="flex-1 px-2 py-1.5 text-[10px] rounded border hover:bg-accent" title="Group (Ctrl+G)">
              Group
            </button>
          )}
          {onUngroup && selectedObject?.type === "group" && (
            <button onClick={onUngroup}
              className="flex-1 px-2 py-1.5 text-[10px] rounded border hover:bg-accent" title="Ungroup (Ctrl+Shift+G)">
              Ungroup
            </button>
          )}
        </div>
      )}

      {/* Image Tools — Crop */}
      {isImage && onCrop && (
        <Section label="Image Tools">
          <div className="flex gap-1">
            <button onClick={onCrop}
              className="flex-1 px-2 py-1.5 text-[10px] rounded border hover:bg-accent flex items-center justify-center gap-1"
              title="Crop image (non-destructive)">
              <CropIcon /> Crop
            </button>
            {hasClipPath && onResetCrop && (
              <button onClick={onResetCrop}
                className="flex-1 px-2 py-1.5 text-[10px] rounded border hover:bg-accent"
                title="Remove crop and show full image">
                Reset Crop
              </button>
            )}
          </div>
        </Section>
      )}

      <button onClick={onDelete}
        className="w-full px-2 py-1.5 text-[10px] rounded border border-destructive text-destructive hover:bg-destructive/10">
        Delete
      </button>
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[10px] text-muted-foreground uppercase block mb-1">{label}</label>
      {children}
    </div>
  );
}

function PropInput({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-[10px] text-muted-foreground w-3">{label}</span>
      <input type="number" value={value}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className="w-full px-1.5 py-1 text-xs rounded border bg-background" />
    </div>
  );
}

function CropIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2v14a2 2 0 0 0 2 2h14" />
      <path d="M18 22V8a2 2 0 0 0-2-2H2" />
    </svg>
  );
}

function EyedropperIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m2 22 1-1h3l9-9" />
      <path d="M3 21v-3l9-9" />
      <path d="m15 6 3.4-3.4a2.1 2.1 0 1 1 3 3L18 9l.4.4a2.1 2.1 0 1 1-3 3l-3.8-3.8a2.1 2.1 0 1 1 3-3l.4.4Z" />
    </svg>
  );
}

function StyleToggle({
  label,
  active,
  onClick,
  bold,
  italic,
  underline,
  strikethrough,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
}) {
  return (
    <button onClick={onClick}
      className={`flex-1 px-2 py-1.5 text-[10px] rounded border transition-colors ${
        active ? "bg-primary/10 text-primary border-primary" : "hover:bg-accent"
      } ${bold ? "font-bold" : ""} ${italic ? "italic" : ""} ${underline ? "underline" : ""} ${strikethrough ? "line-through" : ""}`}>
      {label}
    </button>
  );
}
