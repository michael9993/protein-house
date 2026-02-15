// Component categories
export const COMPONENT_CATEGORIES = [
  { value: "badges", label: "Badges" },
  { value: "text-styles", label: "Text Styles" },
  { value: "shapes", label: "Shapes" },
  { value: "layouts", label: "Layouts" },
  { value: "custom", label: "Custom" },
] as const;

export type ComponentCategory = (typeof COMPONENT_CATEGORIES)[number]["value"];

// Saved design component
export interface SavedComponent {
  id: string;
  name: string;
  category: ComponentCategory;
  fabricJson: object; // serialized Fabric object(s)
  thumbnail: string; // data URL (120px max)
  createdAt: number;
}

// Placeholder types for mockups
export type PlaceholderType =
  | "product-image"
  | "product-name"
  | "product-price"
  | "product-description";

// Brand kit for social media
export interface BrandKit {
  id: string;
  name: string;
  logoBase64?: string; // data URL
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  primaryFont: string;
  secondaryFont: string;
  createdAt: number;
}

// Social media dimension presets
export const SOCIAL_PRESETS = [
  { id: "ig-square", label: "Instagram Post", width: 1080, height: 1080, icon: "instagram" },
  { id: "ig-story", label: "Instagram Story", width: 1080, height: 1920, icon: "instagram" },
  { id: "fb-cover", label: "Facebook Cover", width: 820, height: 312, icon: "facebook" },
  { id: "fb-post", label: "Facebook Post", width: 1200, height: 630, icon: "facebook" },
  { id: "pinterest", label: "Pinterest Pin", width: 1000, height: 1500, icon: "pinterest" },
  { id: "twitter", label: "Twitter/X Post", width: 1200, height: 675, icon: "twitter" },
  { id: "linkedin", label: "LinkedIn Post", width: 1200, height: 627, icon: "linkedin" },
  { id: "youtube", label: "YouTube Thumbnail", width: 1280, height: 720, icon: "youtube" },
] as const;

export type SocialPresetId = (typeof SOCIAL_PRESETS)[number]["id"];

// Code export formats
export type ExportCodeFormat = "html-css" | "react-tailwind" | "svg";
