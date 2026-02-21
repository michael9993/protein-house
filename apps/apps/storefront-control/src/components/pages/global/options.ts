// ---------------------------------------------------------------------------
// Reusable option arrays for design-related selects
// ---------------------------------------------------------------------------

export const FONT_SIZE_OPTIONS = [
  { value: "xs", label: "xs" },
  { value: "sm", label: "sm" },
  { value: "base", label: "base" },
  { value: "lg", label: "lg" },
  { value: "xl", label: "xl" },
  { value: "2xl", label: "2xl" },
  { value: "3xl", label: "3xl" },
  { value: "4xl", label: "4xl" },
  { value: "5xl", label: "5xl" },
  { value: "6xl", label: "6xl" },
  { value: "7xl", label: "7xl" },
  { value: "8xl", label: "8xl" },
  { value: "9xl", label: "9xl" },
];

export const CARD_FONT_SIZE_OPTIONS = [
  { value: "xs", label: "xs" },
  { value: "sm", label: "sm" },
  { value: "base", label: "base" },
  { value: "lg", label: "lg" },
  { value: "xl", label: "xl" },
];

export const FONT_WEIGHT_OPTIONS = [
  { value: "normal", label: "Normal" },
  { value: "medium", label: "Medium" },
  { value: "semibold", label: "Semibold" },
  { value: "bold", label: "Bold" },
  { value: "extrabold", label: "Extra Bold" },
];

export const BORDER_RADIUS_OPTIONS = [
  { value: "none", label: "None (0px)" },
  { value: "sm", label: "Small (4px)" },
  { value: "md", label: "Medium (8px)" },
  { value: "lg", label: "Large (16px)" },
  { value: "full", label: "Full (9999px)" },
];

export const BORDER_RADIUS_NO_FULL_OPTIONS = [
  { value: "none", label: "None" },
  { value: "sm", label: "Small" },
  { value: "md", label: "Medium" },
  { value: "lg", label: "Large" },
];

export const SHADOW_OPTIONS = [
  { value: "none", label: "None" },
  { value: "sm", label: "Small" },
  { value: "md", label: "Medium" },
  { value: "lg", label: "Large" },
];

export const PRODUCT_CARD_RADIUS_OPTIONS = [
  { value: "none", label: "None" },
  { value: "sm", label: "Small" },
  { value: "md", label: "Medium" },
  { value: "lg", label: "Large" },
  { value: "xl", label: "Extra Large" },
];

export const HOVER_SHADOW_OPTIONS = [
  { value: "none", label: "None" },
  { value: "sm", label: "Small" },
  { value: "md", label: "Medium" },
  { value: "lg", label: "Large" },
  { value: "xl", label: "Extra Large" },
];

export const TOAST_POSITION_OPTIONS = [
  { value: "top-right", label: "Top Right" },
  { value: "top-left", label: "Top Left" },
  { value: "top-center", label: "Top Center" },
  { value: "bottom-right", label: "Bottom Right" },
  { value: "bottom-left", label: "Bottom Left" },
  { value: "bottom-center", label: "Bottom Center" },
];

export const ICON_STYLE_OPTIONS = [
  { value: "outline", label: "Outline" },
  { value: "solid", label: "Solid" },
  { value: "duotone", label: "Duotone" },
];

export const BUTTON_STYLE_OPTIONS = [
  { value: "solid", label: "Solid" },
  { value: "outline", label: "Outline" },
  { value: "ghost", label: "Ghost" },
];

export const CART_DISPLAY_OPTIONS = [
  { value: "drawer", label: "Drawer (Slide-in)" },
  { value: "page", label: "Page (Full Cart Page)" },
];

export const CART_SIDE_OPTIONS = [
  { value: "left", label: "Left" },
  { value: "right", label: "Right" },
];

export const ANIMATION_PRESET_OPTIONS = [
  { value: "none", label: "None", description: "No animations or transitions" },
  { value: "subtle", label: "Subtle", description: "Minimal, fast transitions" },
  { value: "moderate", label: "Moderate", description: "Balanced feel (recommended)" },
  { value: "dramatic", label: "Dramatic", description: "Bold, expressive animations" },
];

export const SECTION_PADDING_OPTIONS = [
  { value: "compact", label: "Compact (3rem)" },
  { value: "normal", label: "Normal (5rem)" },
  { value: "spacious", label: "Spacious (7rem)" },
];

export const CONTAINER_PX_OPTIONS = [
  { value: "tight", label: "Tight (1rem)" },
  { value: "normal", label: "Normal (1.5rem)" },
  { value: "wide", label: "Wide (3rem)" },
];

export const CARD_GAP_OPTIONS = [
  { value: "tight", label: "Tight (0.75rem)" },
  { value: "normal", label: "Normal (1.5rem)" },
  { value: "spacious", label: "Spacious (2rem)" },
];

export const EASING_OPTIONS = [
  { value: "ease", label: "Ease" },
  { value: "ease-in", label: "Ease In" },
  { value: "ease-out", label: "Ease Out" },
  { value: "ease-in-out", label: "Ease In-Out" },
];

export const HOVER_EFFECT_OPTIONS = [
  { value: "lift", label: "Lift (translateY)" },
  { value: "glow", label: "Glow (box-shadow)" },
  { value: "border", label: "Border highlight" },
  { value: "scale", label: "Scale up" },
  { value: "none", label: "None" },
];

export const BADGE_POSITION_OPTIONS = [
  { value: "top-start", label: "Top Start" },
  { value: "top-end", label: "Top End" },
  { value: "bottom-start", label: "Bottom Start" },
  { value: "bottom-end", label: "Bottom End" },
];

export const IMAGE_FIT_OPTIONS = [
  { value: "cover", label: "Cover (crop to fill)" },
  { value: "contain", label: "Contain (show full image)" },
];
