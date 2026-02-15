import { useState, useCallback } from "react";
import * as fabric from "fabric";
import { SOCIAL_PRESETS } from "@/modules/components/types";
import type { BrandKit } from "@/modules/components/types";
import { BUILT_IN_TEMPLATES } from "@/modules/templates/built-in";
import { applyTemplateToCanvas } from "./utils/applyTemplate";

interface SocialPresetsPanelProps {
  canvas: fabric.Canvas | null;
  canvasWidth: number;
  canvasHeight: number;
  onResizeCanvas: (w: number, h: number) => void;
  brandKits: BrandKit[];
  onOpenBrandKit: () => void;
}

export function SocialPresetsPanel({
  canvas,
  canvasWidth,
  canvasHeight,
  onResizeCanvas,
  brandKits,
  onOpenBrandKit,
}: SocialPresetsPanelProps) {
  const [activeBrandKit, setActiveBrandKit] = useState<string>("");

  const activePreset = SOCIAL_PRESETS.find(
    (p) => p.width === canvasWidth && p.height === canvasHeight,
  );

  const handleSelectPreset = useCallback(
    (preset: (typeof SOCIAL_PRESETS)[number]) => {
      onResizeCanvas(preset.width, preset.height);
    },
    [onResizeCanvas],
  );

  const socialTemplates = BUILT_IN_TEMPLATES.filter(
    (t) => t.category === "social" || t.category === "banner",
  );

  const handleApplyBrand = useCallback(() => {
    if (!canvas || !activeBrandKit) return;
    const kit = brandKits.find((k) => k.id === activeBrandKit);
    if (!kit) return;

    canvas.getObjects().forEach((obj) => {
      if (obj.type === "i-text" || obj.type === "textbox") {
        (obj as any).set({
          fontFamily: kit.primaryFont,
          fill: kit.primaryColor,
        });
      }
    });
    canvas.renderAll();
    canvas.fire("object:modified", { target: canvas.getObjects()[0] });
  }, [canvas, activeBrandKit, brandKits]);

  return (
    <>
      <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-3">
        Social Media
      </h3>

      {/* Dimension Presets */}
      <p className="text-[10px] text-muted-foreground uppercase mb-1.5">Canvas Size</p>
      <div className="grid grid-cols-2 gap-1 mb-4">
        {SOCIAL_PRESETS.map((preset) => (
          <button
            key={preset.id}
            onClick={() => handleSelectPreset(preset)}
            className={`px-2 py-2 text-[10px] rounded-md border transition-colors text-left ${
              activePreset?.id === preset.id
                ? "border-primary bg-primary/10 text-primary"
                : "hover:bg-accent"
            }`}
          >
            <span className="font-medium block">{preset.label}</span>
            <span className="text-muted-foreground">
              {preset.width}x{preset.height}
            </span>
          </button>
        ))}
      </div>

      {/* Quick Templates */}
      {socialTemplates.length > 0 && (
        <>
          <p className="text-[10px] text-muted-foreground uppercase mb-1.5">Quick Templates</p>
          <div className="space-y-1 mb-4">
            {socialTemplates.map((tpl) => (
              <button
                key={tpl.id}
                onClick={() => canvas && applyTemplateToCanvas(canvas, tpl)}
                className="w-full px-2 py-2 text-[10px] rounded-md border hover:bg-accent text-left transition-colors"
              >
                <span className="font-medium">{tpl.name}</span>
                <span className="block text-muted-foreground">{tpl.width}x{tpl.height}</span>
              </button>
            ))}
          </div>
        </>
      )}

      {/* Brand Kit */}
      <div className="w-full h-px bg-border my-2" />
      <p className="text-[10px] text-muted-foreground uppercase mb-1.5">Brand Kit</p>

      {brandKits.length > 0 ? (
        <>
          <select
            value={activeBrandKit}
            onChange={(e) => setActiveBrandKit(e.target.value)}
            className="w-full px-2 py-1.5 text-xs rounded border bg-background mb-2"
          >
            <option value="">Select brand kit...</option>
            {brandKits.map((kit) => (
              <option key={kit.id} value={kit.id}>{kit.name}</option>
            ))}
          </select>

          {activeBrandKit && (
            <button
              onClick={handleApplyBrand}
              className="w-full px-2 py-1.5 text-[10px] rounded bg-primary text-primary-foreground hover:bg-primary/90 mb-2"
            >
              Apply Brand to Canvas
            </button>
          )}
        </>
      ) : (
        <p className="text-[10px] text-muted-foreground mb-2">No brand kits saved</p>
      )}

      <button
        onClick={onOpenBrandKit}
        className="w-full px-2 py-1.5 text-[10px] rounded border hover:bg-accent"
      >
        {brandKits.length > 0 ? "Manage Brand Kits" : "Create Brand Kit"}
      </button>
    </>
  );
}
