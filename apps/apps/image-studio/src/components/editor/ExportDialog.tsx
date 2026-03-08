import { useState } from "react";

interface ExportDialogProps {
  onExport: (format: "png" | "jpeg" | "webp", quality: number, transparentBg?: boolean) => void;
  onClose: () => void;
}

export function ExportDialog({ onExport, onClose }: ExportDialogProps) {
  const [format, setFormat] = useState<"png" | "jpeg" | "webp">("png");
  const [quality, setQuality] = useState(0.92);
  const [transparentBg, setTransparentBg] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background rounded-lg p-6 w-[360px] shadow-xl">
        <h3 className="text-sm font-semibold mb-4">Export Image</h3>

        {/* Format */}
        <div className="mb-4">
          <label className="text-xs text-muted-foreground">Format</label>
          <div className="flex gap-2 mt-1.5">
            <FormatButton
              label="PNG"
              description="Lossless, transparent"
              active={format === "png"}
              onClick={() => setFormat("png")}
            />
            <FormatButton
              label="JPEG"
              description="Smaller file size"
              active={format === "jpeg"}
              onClick={() => setFormat("jpeg")}
            />
            <FormatButton
              label="WEBP"
              description="Modern, small + transparent"
              active={format === "webp"}
              onClick={() => setFormat("webp")}
            />
          </div>
        </div>

        {/* Quality (JPEG/WEBP) */}
        {(format === "jpeg" || format === "webp") && (
          <div className="mb-4">
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

        {/* Transparent background (PNG/WEBP) */}
        {(format === "png" || format === "webp") && (
          <label className="flex items-center gap-2 mb-4 cursor-pointer">
            <input
              type="checkbox"
              checked={transparentBg}
              onChange={(e) => setTransparentBg(e.target.checked)}
              className="rounded border-border"
            />
            <span className="text-xs">Transparent background</span>
          </label>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-sm rounded-md border hover:bg-accent"
          >
            Cancel
          </button>
          <button
            onClick={() => onExport(format, quality, (format === "png" || format === "webp") ? transparentBg : false)}
            className="px-3 py-1.5 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Download
          </button>
        </div>
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
      className={`flex-1 p-3 rounded-md border text-left transition-colors ${
        active
          ? "border-primary bg-primary/5"
          : "border-border hover:bg-accent/50"
      }`}
    >
      <p className="text-sm font-medium">{label}</p>
      <p className="text-[10px] text-muted-foreground">{description}</p>
    </button>
  );
}
