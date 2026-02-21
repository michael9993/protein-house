import { z } from "zod";
import { BorderRadiusSchema, ButtonVariantSchema, ThemeColor } from "./primitives";

// ============================================
// BUTTONS
// ============================================

export const ButtonsSchema = z.object({
  borderRadius: BorderRadiusSchema,
  primary: ButtonVariantSchema,
  secondary: ButtonVariantSchema,
  outline: ButtonVariantSchema,
  danger: ButtonVariantSchema,
});

// ============================================
// BADGES
// ============================================

export const BadgeStyleSchema = z.object({
  backgroundColor: ThemeColor,
  textColor: ThemeColor,
  borderRadius: BorderRadiusSchema,
});

export const BadgesSchema = z.object({
  sale: BadgeStyleSchema,
  new: BadgeStyleSchema,
  outOfStock: BadgeStyleSchema,
  lowStock: BadgeStyleSchema,
  discount: BadgeStyleSchema,
  featured: BadgeStyleSchema,
});

// ============================================
// INPUTS
// ============================================

export const InputsSchema = z.object({
  borderRadius: z.enum(["none", "sm", "md", "lg"]),
  borderColor: ThemeColor,
  focusBorderColor: ThemeColor,
  focusRingColor: ThemeColor,
  backgroundColor: ThemeColor,
  placeholderColor: ThemeColor,
});

// ============================================
// CHECKBOX
// ============================================

export const CheckboxSchema = z.object({
  checkedBackgroundColor: ThemeColor,
  borderRadius: z.enum(["none", "sm", "md", "full"]),
});

// ============================================
// PRODUCT CARD
// ============================================

export const ProductCardTextStyleSchema = z.object({
  fontSize: z.enum(["xs", "sm", "base", "lg", "xl"]).optional(),
  fontWeight: z.enum(["normal", "medium", "semibold", "bold", "extrabold"]).optional(),
  color: z.string().nullable().optional(),
});

export const ProductCardSchema = z.object({
  borderRadius: z.enum(["none", "sm", "md", "lg", "xl"]),
  shadow: z.enum(["none", "sm", "md", "lg"]),
  hoverShadow: z.enum(["none", "sm", "md", "lg", "xl"]),
  showQuickView: z.boolean(),
  showWishlistButton: z.boolean(),
  showAddToCart: z.boolean(),
  imageAspectRatio: z.enum(["square", "portrait", "landscape"]),
  hoverEffect: z.enum(["lift", "glow", "border", "scale", "none"]).optional(),
  badgePosition: z.enum(["top-start", "top-end", "bottom-start", "bottom-end"]).optional(),
  showBrandLabel: z.boolean().optional(),
  showRating: z.boolean().optional(),
  imageFit: z.enum(["cover", "contain"]).optional(),
  textStyles: z.object({
    name: ProductCardTextStyleSchema.optional(),
    price: ProductCardTextStyleSchema.optional(),
    originalPrice: ProductCardTextStyleSchema.optional(),
    reviewCount: ProductCardTextStyleSchema.optional(),
  }).optional(),
});

// ============================================
// TOASTS
// ============================================

const ToastVariantSchema = z.object({
  backgroundColor: ThemeColor,
  textColor: ThemeColor,
  iconColor: ThemeColor,
});

export const ToastsSchema = z.object({
  position: z.enum(["top-right", "top-left", "bottom-right", "bottom-left", "top-center", "bottom-center"]),
  borderRadius: z.enum(["none", "sm", "md", "lg"]),
  success: ToastVariantSchema,
  error: ToastVariantSchema,
  warning: ToastVariantSchema,
  info: ToastVariantSchema,
});

// ============================================
// ICONS
// ============================================

export const IconsSchema = z.object({
  style: z.enum(["outline", "solid", "duotone"]),
  defaultColor: ThemeColor,
  activeColor: ThemeColor,
});

// ============================================
// ACTIVE FILTERS TAGS
// ============================================

export const ActiveFiltersTagsSchema = z.object({
  containerBackgroundColor: ThemeColor.optional(),
  containerBorderColor: ThemeColor.optional(),
  containerBorderRadius: z.enum(["none", "sm", "md", "lg"]).optional(),
  containerPadding: z.number().optional(),
  containerShadow: z.enum(["none", "sm", "md", "lg"]).optional(),
  titleFontSize: z.enum(["xs", "sm", "base", "lg"]).optional(),
  titleFontWeight: z.enum(["normal", "medium", "semibold", "bold"]).optional(),
  titleColor: ThemeColor.optional(),
  clearAllButtonFontSize: z.enum(["xs", "sm", "base"]).optional(),
  clearAllButtonFontWeight: z.enum(["normal", "medium", "semibold", "bold"]).optional(),
  clearAllButtonColor: ThemeColor.optional(),
  clearAllButtonHoverColor: ThemeColor.optional(),
  tagBackgroundColor: ThemeColor.optional(),
  tagBorderColor: ThemeColor.optional(),
  tagTextColor: ThemeColor.optional(),
  tagHoverBackgroundColor: ThemeColor.optional(),
  tagHoverBorderColor: ThemeColor.optional(),
  tagBorderRadius: BorderRadiusSchema.optional(),
  tagPaddingX: z.number().optional(),
  tagPaddingY: z.number().optional(),
  tagFontSize: z.enum(["xs", "sm", "base"]).optional(),
  tagFontWeight: z.enum(["normal", "medium", "semibold", "bold"]).optional(),
  tagGap: z.number().optional(),
  removeButtonSize: z.number().optional(),
  removeButtonColor: ThemeColor.optional(),
  removeButtonHoverBackgroundColor: ThemeColor.optional(),
  removeButtonHoverColor: ThemeColor.optional(),
  removeButtonBorderRadius: BorderRadiusSchema.optional(),
});

// ============================================
// CART UI
// ============================================

export const CartUiSchema = z.object({
  displayMode: z.enum(["drawer", "page"]).optional(),
  drawerSide: z.enum(["left", "right"]).optional(),
  showDeleteText: z.boolean().optional(),
  showSaveForLater: z.boolean().optional(),
});

// ============================================
// FILTER SIDEBAR
// ============================================

export const FilterSidebarSchema = z.object({
  checkboxAccentColor: ThemeColor.optional(),
  sectionTitleFontSize: z.enum(["xs", "sm", "base"]).optional(),
  sectionTitleFontWeight: z.enum(["normal", "medium", "semibold", "bold"]).optional(),
  sectionTitleColor: ThemeColor.optional(),
  sectionTitleHoverColor: ThemeColor.optional(),
  chevronColor: ThemeColor.optional(),
  chevronHoverColor: ThemeColor.optional(),
  itemTextFontSize: z.enum(["xs", "sm", "base"]).optional(),
  itemTextColor: ThemeColor.optional(),
  itemCountColor: ThemeColor.optional(),
  sizeChipSelectedBg: ThemeColor.optional(),
  sizeChipSelectedText: ThemeColor.optional(),
  sizeChipSelectedBorder: ThemeColor.optional(),
  clearAllButtonBg: ThemeColor.optional(),
  clearAllButtonText: ThemeColor.optional(),
  clearAllButtonBorder: ThemeColor.optional(),
  clearAllButtonHoverBg: ThemeColor.optional(),
  clearAllButtonHoverText: ThemeColor.optional(),
  priceInputFocusRingColor: ThemeColor.optional(),
  priceQuickButtonActiveBg: ThemeColor.optional(),
  priceQuickButtonActiveText: ThemeColor.optional(),
  mobileShowResultsBg: ThemeColor.optional(),
  mobileShowResultsText: ThemeColor.optional(),
});

// ============================================
// SECTION "VIEW ALL" BUTTON
// ============================================

export const SectionViewAllButtonSchema = z.object({
  style: z.enum(["pill", "text", "minimal"]),
  icon: z.enum(["chevron", "arrow", "none"]),
});

// ============================================
// FULL UI SCHEMA
// ============================================

export const UiSchema = z.object({
  buttons: ButtonsSchema,
  badges: BadgesSchema,
  inputs: InputsSchema,
  checkbox: CheckboxSchema,
  productCard: ProductCardSchema,
  toasts: ToastsSchema,
  icons: IconsSchema,
  activeFiltersTags: ActiveFiltersTagsSchema.optional(),
  filterSidebar: FilterSidebarSchema.optional(),
  cart: CartUiSchema,
  sectionViewAllButton: SectionViewAllButtonSchema,
});
