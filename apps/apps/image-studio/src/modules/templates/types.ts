export interface TemplateLayer {
  type: "image" | "rect" | "text" | "circle";
  /** Placeholder name — user maps their content to this */
  placeholder?: string;
  /** Placeholder type for mockup auto-fill (product data binding) */
  placeholderType?: "product-image" | "product-name" | "product-price" | "product-description";
  left: number;
  top: number;
  width: number;
  height: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  textAlign?: string;
  text?: string;
  opacity?: number;
  /** For image layers: default URL (can be replaced) */
  src?: string;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  category: "product" | "social" | "banner" | "lifestyle";
  width: number;
  height: number;
  backgroundColor: string;
  layers: TemplateLayer[];
  /** Preview thumbnail URL or data URI */
  preview?: string;
  /** Whether this template is a product mockup with fillable placeholders */
  isMockup?: boolean;
}

export type TemplateCategory = Template["category"];

export const TEMPLATE_CATEGORIES: { value: TemplateCategory; label: string }[] = [
  { value: "product", label: "Product" },
  { value: "social", label: "Social Media" },
  { value: "banner", label: "Banner" },
  { value: "lifestyle", label: "Lifestyle" },
];
