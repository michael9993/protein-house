import type { ResolutionPreset, BatchPreset, FormatInfo, ExportFormat } from "./types";

export const RESOLUTION_PRESETS: ResolutionPreset[] = [
  { id: "web", label: "Web (72 DPI, 1x)", multiplier: 1, dpi: 72 },
  { id: "retina", label: "Retina (144 DPI, 2x)", multiplier: 2, dpi: 144 },
  { id: "print", label: "Print (300 DPI, 1x)", multiplier: 1, dpi: 300 },
  { id: "hidpi", label: "HiDPI (216 DPI, 3x)", multiplier: 3, dpi: 216 },
  { id: "print-hq", label: "Print HQ (300 DPI, 2x)", multiplier: 2, dpi: 300 },
];

export const FORMAT_INFO: Record<ExportFormat, FormatInfo> = {
  png: { label: "PNG", description: "Lossless, transparent", supportsTransparency: true, supportsQuality: false },
  jpeg: { label: "JPEG", description: "Smaller file size", supportsTransparency: false, supportsQuality: true },
  webp: { label: "WebP", description: "Modern, small + transparent", supportsTransparency: true, supportsQuality: true },
  avif: { label: "AVIF", description: "Best compression, modern", supportsTransparency: true, supportsQuality: true },
};

export const BATCH_PRESETS: BatchPreset[] = [
  {
    id: "web-bundle",
    label: "Web Bundle",
    description: "1x + 2x + thumbnail",
    specs: [
      { label: "Web 1x", suffix: "", format: "png", quality: 92 },
      { label: "Web 2x", suffix: "@2x", format: "png", quality: 92 },
      { label: "Thumbnail", suffix: "-thumb", format: "jpeg", quality: 80, width: 200, height: 200 },
    ],
  },
  {
    id: "social-pack",
    label: "Social Pack",
    description: "Instagram + Story + Facebook",
    specs: [
      { label: "Instagram Square", suffix: "-ig", format: "jpeg", quality: 92, width: 1080, height: 1080 },
      { label: "Instagram Story", suffix: "-story", format: "jpeg", quality: 92, width: 1080, height: 1920 },
      { label: "Facebook Post", suffix: "-fb", format: "jpeg", quality: 92, width: 1200, height: 630 },
    ],
  },
  {
    id: "ecommerce",
    label: "E-Commerce",
    description: "Product square + portrait + card",
    specs: [
      { label: "Product Square", suffix: "-sq", format: "png", quality: 92, width: 1000, height: 1000 },
      { label: "Product Portrait", suffix: "-port", format: "png", quality: 92, width: 800, height: 1200 },
      { label: "Collection Card", suffix: "-card", format: "jpeg", quality: 90, width: 600, height: 400 },
    ],
  },
];

export const DPI_PRESETS = [
  { label: "Screen (72)", value: 72 },
  { label: "Retina (144)", value: 144 },
  { label: "Print (300)", value: 300 },
  { label: "High Print (600)", value: 600 },
];

export const MAX_EXPORT_DIMENSION = 16384;
