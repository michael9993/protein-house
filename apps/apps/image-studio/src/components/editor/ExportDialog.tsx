import { useState, useMemo } from "react";
import type { ExportFormat } from "@/modules/export/types";
import {
  FORMAT_INFO,
  RESOLUTION_PRESETS,
  BATCH_PRESETS,
  DPI_PRESETS,
} from "@/modules/export/constants";

interface ExportDialogProps {
  canvasWidth: number;
  canvasHeight: number;
  onExport: (format: "png" | "jpeg" | "webp", quality: number, transparentBg?: boolean, multiplier?: number) => void;
  onServerExport?: (options: {
    format: ExportFormat;
    quality: number;
    multiplier: number;
    transparentBg: boolean;
    dpi?: number;
    customWidth?: number;
    customHeight?: number;
  }) => void;
  onBatchExport?: (specs: { label: string; suffix: string; format: ExportFormat; quality: number; width?: number; height?: number; dpi?: number }[]) => void;
  onClose: () => void;
}

type Tab = "quick" | "custom" | "batch";

export function ExportDialog({
  canvasWidth,
  canvasHeight,
  onExport,
  onServerExport,
  onBatchExport,
  onClose,
}: ExportDialogProps) {
  const [tab, setTab] = useState<Tab>("quick");
  const [format, setFormat] = useState<ExportFormat>("png");
  const [quality, setQuality] = useState(0.92);
  const [transparentBg, setTransparentBg] = useState(false);
  const [multiplier, setMultiplier] = useState(1);
  const [resolutionPreset, setResolutionPreset] = useState("");

  // Custom size tab
  const [customWidth, setCustomWidth] = useState(canvasWidth);
  const [customHeight, setCustomHeight] = useState(canvasHeight);
  const [lockAspect, setLockAspect] = useState(true);
  const [dpi, setDpi] = useState(72);

  // Batch tab
  const [selectedBatches, setSelectedBatches] = useState<Set<string>>(new Set());

  const formatInfo = FORMAT_INFO[format];

  const outputWidth = canvasWidth * multiplier;
  const outputHeight = canvasHeight * multiplier;

  const aspectRatio = useMemo(() => {
    const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
    const d = gcd(canvasWidth, canvasHeight);
    return `${canvasWidth / d}:${canvasHeight / d}`;
  }, [canvasWidth, canvasHeight]);

  const handleResolutionPreset = (presetId: string) => {
    setResolutionPreset(presetId);
    const preset = RESOLUTION_PRESETS.find((p) => p.id === presetId);
    if (preset) {
      setMultiplier(preset.multiplier);
      setDpi(preset.dpi);
    }
  };

  const handleCustomWidthChange = (w: number) => {
    setCustomWidth(w);
    if (lockAspect) {
      setCustomHeight(Math.round(w * (canvasHeight / canvasWidth)));
    }
  };

  const handleCustomHeightChange = (h: number) => {
    setCustomHeight(h);
    if (lockAspect) {
      setCustomWidth(Math.round(h * (canvasWidth / canvasHeight)));
    }
  };

  const handleQuickExport = () => {
    const needsServer = format === "avif" || dpi !== 72;
    if (needsServer && onServerExport) {
      onServerExport({ format, quality: Math.round(quality * 100), multiplier, transparentBg, dpi: dpi !== 72 ? dpi : undefined });
    } else {
      const clientFormat = format === "avif" ? "png" : format;
      onExport(clientFormat, quality, transparentBg, multiplier);
    }
  };

  const handleCustomExport = () => {
    if (onServerExport) {
      onServerExport({
        format,
        quality: Math.round(quality * 100),
        multiplier: 1,
        transparentBg,
        dpi: dpi !== 72 ? dpi : undefined,
        customWidth,
        customHeight,
      });
    }
  };

  const handleBatchExport = () => {
    if (!onBatchExport) return;
    const specs = BATCH_PRESETS
      .filter((p) => selectedBatches.has(p.id))
      .flatMap((p) => p.specs);
    if (specs.length > 0) {
      onBatchExport(specs);
    }
  };

  const toggleBatch = (id: string) => {
    setSelectedBatches((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background rounded-lg p-6 w-[520px] shadow-xl max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold">Export Image</h3>
          <span className="text-[10px] text-muted-foreground">
            Canvas: {canvasWidth} x {canvasHeight} ({aspectRatio})
          </span>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-4 p-0.5 bg-muted rounded-md">
          {(["quick", "custom", "batch"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-1.5 text-xs rounded transition-colors ${
                tab === t
                  ? "bg-background font-medium shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t === "quick" ? "Quick Export" : t === "custom" ? "Custom Size" : "Batch Export"}
            </button>
          ))}
        </div>

        {/* === QUICK EXPORT TAB === */}
        {tab === "quick" && (
          <div className="space-y-4">
            {/* Format */}
            <div>
              <label className="text-xs text-muted-foreground">Format</label>
              <div className="grid grid-cols-4 gap-1.5 mt-1.5">
                {(Object.keys(FORMAT_INFO) as ExportFormat[]).map((f) => (
                  <FormatButton
                    key={f}
                    label={FORMAT_INFO[f].label}
                    description={FORMAT_INFO[f].description}
                    active={format === f}
                    onClick={() => setFormat(f)}
                  />
                ))}
              </div>
            </div>

            {/* Quality */}
            {formatInfo.supportsQuality && (
              <div>
                <label className="text-xs text-muted-foreground">
                  Quality: {Math.round(quality * 100)}%
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.05"
                  value={quality}
                  onChange={(e) => setQuality(parseFloat(e.target.value))}
                  className="w-full h-1.5 mt-1.5"
                />
              </div>
            )}

            {/* Transparent bg */}
            {formatInfo.supportsTransparency && (
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={transparentBg}
                  onChange={(e) => setTransparentBg(e.target.checked)}
                  className="rounded border-border"
                />
                <span className="text-xs">Transparent background</span>
              </label>
            )}

            {/* Multiplier */}
            <div>
              <label className="text-xs text-muted-foreground">Resolution Multiplier</label>
              <div className="flex gap-1.5 mt-1.5">
                {[1, 2, 3, 4].map((m) => (
                  <button
                    key={m}
                    onClick={() => setMultiplier(m)}
                    className={`flex-1 py-1.5 text-xs rounded-md border transition-colors ${
                      multiplier === m
                        ? "border-primary bg-primary/5 font-medium"
                        : "hover:bg-accent"
                    }`}
                  >
                    {m}x
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">
                Output: {outputWidth} x {outputHeight} px
              </p>
            </div>

            {/* Resolution presets */}
            <div>
              <label className="text-xs text-muted-foreground">Preset</label>
              <select
                value={resolutionPreset}
                onChange={(e) => handleResolutionPreset(e.target.value)}
                className="w-full mt-1.5 px-2 py-1.5 text-xs rounded-md border bg-background"
              >
                <option value="">Custom</option>
                {RESOLUTION_PRESETS.map((p) => (
                  <option key={p.id} value={p.id}>{p.label}</option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={onClose} className="px-3 py-1.5 text-sm rounded-md border hover:bg-accent">
                Cancel
              </button>
              <button
                onClick={handleQuickExport}
                className="px-3 py-1.5 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Download
              </button>
            </div>
          </div>
        )}

        {/* === CUSTOM SIZE TAB === */}
        {tab === "custom" && (
          <div className="space-y-4">
            {/* Format (same row) */}
            <div>
              <label className="text-xs text-muted-foreground">Format</label>
              <div className="grid grid-cols-4 gap-1.5 mt-1.5">
                {(Object.keys(FORMAT_INFO) as ExportFormat[]).map((f) => (
                  <FormatButton
                    key={f}
                    label={FORMAT_INFO[f].label}
                    description={FORMAT_INFO[f].description}
                    active={format === f}
                    onClick={() => setFormat(f)}
                  />
                ))}
              </div>
            </div>

            {/* Dimensions */}
            <div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-muted-foreground">Dimensions</label>
                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={lockAspect}
                    onChange={(e) => setLockAspect(e.target.checked)}
                    className="rounded border-border h-3 w-3"
                  />
                  <span className="text-[10px] text-muted-foreground">Lock ratio</span>
                </label>
              </div>
              <div className="flex gap-2 mt-1.5">
                <div className="flex-1">
                  <label className="text-[10px] text-muted-foreground">Width</label>
                  <input
                    type="number"
                    value={customWidth}
                    onChange={(e) => handleCustomWidthChange(parseInt(e.target.value) || 0)}
                    min={1}
                    max={16384}
                    className="w-full px-2 py-1.5 text-xs rounded-md border bg-background"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-[10px] text-muted-foreground">Height</label>
                  <input
                    type="number"
                    value={customHeight}
                    onChange={(e) => handleCustomHeightChange(parseInt(e.target.value) || 0)}
                    min={1}
                    max={16384}
                    className="w-full px-2 py-1.5 text-xs rounded-md border bg-background"
                  />
                </div>
              </div>
            </div>

            {/* DPI */}
            <div>
              <label className="text-xs text-muted-foreground">DPI</label>
              <div className="flex gap-1.5 mt-1.5">
                {DPI_PRESETS.map((d) => (
                  <button
                    key={d.value}
                    onClick={() => setDpi(d.value)}
                    className={`flex-1 py-1.5 text-[10px] rounded-md border transition-colors ${
                      dpi === d.value
                        ? "border-primary bg-primary/5 font-medium"
                        : "hover:bg-accent"
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Quality */}
            {formatInfo.supportsQuality && (
              <div>
                <label className="text-xs text-muted-foreground">
                  Quality: {Math.round(quality * 100)}%
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.05"
                  value={quality}
                  onChange={(e) => setQuality(parseFloat(e.target.value))}
                  className="w-full h-1.5 mt-1.5"
                />
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={onClose} className="px-3 py-1.5 text-sm rounded-md border hover:bg-accent">
                Cancel
              </button>
              <button
                onClick={handleCustomExport}
                disabled={!onServerExport}
                className="px-3 py-1.5 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                Export {customWidth} x {customHeight}
              </button>
            </div>
          </div>
        )}

        {/* === BATCH EXPORT TAB === */}
        {tab === "batch" && (
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground">
              Export multiple sizes at once. Select presets below.
            </p>

            {BATCH_PRESETS.map((preset) => (
              <label
                key={preset.id}
                className={`flex items-start gap-3 p-3 rounded-md border cursor-pointer transition-colors ${
                  selectedBatches.has(preset.id)
                    ? "border-primary bg-primary/5"
                    : "hover:bg-accent/50"
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedBatches.has(preset.id)}
                  onChange={() => toggleBatch(preset.id)}
                  className="rounded border-border mt-0.5"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium">{preset.label}</p>
                  <p className="text-[10px] text-muted-foreground">{preset.description}</p>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {preset.specs.map((spec) => (
                      <span
                        key={spec.label}
                        className="px-1.5 py-0.5 text-[9px] rounded-full bg-muted text-muted-foreground"
                      >
                        {spec.label} ({spec.format.toUpperCase()}
                        {spec.width ? ` ${spec.width}x${spec.height}` : ""})
                      </span>
                    ))}
                  </div>
                </div>
              </label>
            ))}

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={onClose} className="px-3 py-1.5 text-sm rounded-md border hover:bg-accent">
                Cancel
              </button>
              <button
                onClick={handleBatchExport}
                disabled={selectedBatches.size === 0 || !onBatchExport}
                className="px-3 py-1.5 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                Export {selectedBatches.size > 0 ? `(${Array.from(selectedBatches).reduce((sum, id) => {
                  const preset = BATCH_PRESETS.find((p) => p.id === id);
                  return sum + (preset?.specs.length ?? 0);
                }, 0)} files)` : "All Selected"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function FormatButton({
  label,
  description,
  active,
  onClick,
}: {
  label: string;
  description: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`p-2.5 rounded-md border text-left transition-colors ${
        active
          ? "border-primary bg-primary/5"
          : "border-border hover:bg-accent/50"
      }`}
    >
      <p className="text-xs font-medium">{label}</p>
      <p className="text-[9px] text-muted-foreground leading-tight">{description}</p>
    </button>
  );
}
