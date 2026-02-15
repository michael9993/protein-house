import { useState, useMemo, useCallback } from "react";
import type * as fabric from "fabric";
import type { ExportCodeFormat } from "@/modules/components/types";
import { canvasToHtmlCss, canvasToReactTailwind, canvasToSvg } from "@/modules/export/code-generators";

interface CodeExportDialogProps {
  canvas: fabric.Canvas;
  onClose: () => void;
}

const FORMATS: { id: ExportCodeFormat; label: string; ext: string }[] = [
  { id: "html-css", label: "HTML / CSS", ext: "html" },
  { id: "react-tailwind", label: "React + Tailwind", ext: "tsx" },
  { id: "svg", label: "SVG", ext: "svg" },
];

export function CodeExportDialog({ canvas, onClose }: CodeExportDialogProps) {
  const [format, setFormat] = useState<ExportCodeFormat>("html-css");
  const [copied, setCopied] = useState(false);

  const code = useMemo(() => {
    switch (format) {
      case "html-css":
        return canvasToHtmlCss(canvas);
      case "react-tailwind":
        return canvasToReactTailwind(canvas);
      case "svg":
        return canvasToSvg(canvas);
    }
  }, [canvas, format]);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [code]);

  const handleDownload = useCallback(() => {
    const formatInfo = FORMATS.find((f) => f.id === format)!;
    const mimeTypes: Record<string, string> = {
      html: "text/html",
      tsx: "text/plain",
      svg: "image/svg+xml",
    };
    const blob = new Blob([code], { type: mimeTypes[formatInfo.ext] });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `image-studio-export.${formatInfo.ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [code, format]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background rounded-lg w-[600px] max-h-[80vh] shadow-xl flex flex-col">
        <div className="p-4 border-b">
          <h3 className="text-sm font-semibold">Export as Code</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Generate production-ready code from your canvas design
          </p>
        </div>

        {/* Format selector */}
        <div className="flex border-b">
          {FORMATS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFormat(f.id)}
              className={`flex-1 px-3 py-2.5 text-xs font-medium transition-colors ${
                format === f.id
                  ? "text-primary border-b-2 border-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Code preview */}
        <div className="flex-1 overflow-auto p-4">
          <pre className="text-[11px] leading-relaxed bg-muted/50 rounded-md p-4 overflow-x-auto font-mono">
            <code>{code}</code>
          </pre>
        </div>

        {/* Actions */}
        <div className="p-4 border-t flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-1.5 text-sm rounded-md border hover:bg-accent">
            Close
          </button>
          <button
            onClick={handleDownload}
            className="px-3 py-1.5 text-sm rounded-md border hover:bg-accent"
          >
            Download .{FORMATS.find((f) => f.id === format)!.ext}
          </button>
          <button
            onClick={handleCopy}
            className="px-3 py-1.5 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {copied ? "Copied!" : "Copy to Clipboard"}
          </button>
        </div>
      </div>
    </div>
  );
}
