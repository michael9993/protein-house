export type ExportFormat = "png" | "jpeg" | "webp" | "avif";

export interface ExportOptions {
  format: ExportFormat;
  quality: number;
  transparentBg: boolean;
  multiplier: number;
  dpi?: number;
  customWidth?: number;
  customHeight?: number;
  fitMode?: "cover" | "contain" | "fill";
}

export interface BatchExportSpec {
  label: string;
  suffix: string;
  format: ExportFormat;
  quality: number;
  width?: number;
  height?: number;
  dpi?: number;
}

export interface ResolutionPreset {
  id: string;
  label: string;
  multiplier: number;
  dpi: number;
}

export interface BatchPreset {
  id: string;
  label: string;
  description: string;
  specs: BatchExportSpec[];
}

export interface FormatInfo {
  label: string;
  description: string;
  supportsTransparency: boolean;
  supportsQuality: boolean;
}
