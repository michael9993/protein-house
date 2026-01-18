/**
 * CHECKOUT THEME MAPPING
 * =======================
 * This file provides CSS variable mappings for all checkout components.
 * Use these values to theme the checkout consistently with the store config.
 * 
 * Usage:
 * - Import theme values in components
 * - Use CSS variables for dynamic theming
 * - Maintain print compatibility with explicit fallbacks
 */

// ============================================
// COLOR MAPPINGS
// ============================================

export const checkoutColors = {
  // Background colors
  bg: {
    page: "var(--store-bg)",
    surface: "var(--store-surface)",
    card: "var(--store-bg)",
    hover: "var(--store-hover-bg)",
  },
  
  // Text colors
  text: {
    primary: "var(--store-text)",
    secondary: "var(--store-text-muted)",
    muted: "var(--store-neutral-500)",
    inverse: "#ffffff",
  },
  
  // Border colors
  border: {
    default: "var(--store-neutral-200)",
    light: "var(--store-neutral-100)",
    hover: "var(--store-neutral-300)",
    focus: "var(--store-primary)",
  },
  
  // State colors
  success: {
    bg: "var(--store-success-bg)",
    text: "var(--store-success-text)",
    border: "var(--store-success-border)",
    icon: "var(--store-success)",
  },
  
  error: {
    bg: "var(--store-error-bg)",
    text: "var(--store-error-text)",
    border: "var(--store-error-border)",
  },
  
  info: {
    bg: "var(--store-info-bg)",
    text: "var(--store-info-text)",
    border: "var(--store-info-border)",
  },
  
  // Neutral palette
  neutral: {
    50: "var(--store-neutral-50)",
    100: "var(--store-neutral-100)",
    200: "var(--store-neutral-200)",
    300: "var(--store-neutral-300)",
    400: "var(--store-neutral-400)",
    500: "var(--store-neutral-500)",
    600: "var(--store-neutral-600)",
    700: "var(--store-neutral-700)",
    800: "var(--store-neutral-800)",
    900: "var(--store-neutral-900)",
  },
  
  // Primary action colors
  primary: {
    default: "var(--store-primary)",
    hover: "var(--store-primary-hover)",
    light: "var(--store-primary-light)",
  },
};

// ============================================
// COMPONENT STYLES
// ============================================

export const checkoutComponents = {
  // Button styles
  button: {
    primary: {
      background: checkoutColors.primary.default,
      backgroundHover: checkoutColors.primary.hover,
      text: checkoutColors.text.inverse,
      border: "transparent",
    },
    secondary: {
      background: "transparent",
      backgroundHover: checkoutColors.neutral[100],
      text: checkoutColors.text.primary,
      border: checkoutColors.border.default,
      borderHover: checkoutColors.border.hover,
    },
  },
  
  // Input styles
  input: {
    background: checkoutColors.bg.card,
    border: checkoutColors.border.default,
    borderFocus: checkoutColors.border.focus,
    text: checkoutColors.text.primary,
    placeholder: checkoutColors.neutral[400],
    label: checkoutColors.neutral[700],
    error: checkoutColors.error.text,
    errorBorder: checkoutColors.error.border,
  },
  
  // Card styles
  card: {
    background: checkoutColors.bg.card,
    border: checkoutColors.border.default,
    borderRadius: "var(--store-radius-lg)",
    shadow: "0 1px 3px 0 rgb(0 0 0 / 0.1)",
  },
  
  // Summary section
  summary: {
    background: checkoutColors.bg.card,
    border: checkoutColors.border.default,
    totalBackground: checkoutColors.neutral[50],
    itemHover: checkoutColors.bg.hover,
  },
  
  // Steps indicator
  steps: {
    active: {
      background: checkoutColors.primary.default,
      text: checkoutColors.text.inverse,
    },
    completed: {
      background: checkoutColors.success.bg,
      text: checkoutColors.success.text,
    },
    inactive: {
      background: checkoutColors.neutral[100],
      text: checkoutColors.neutral[600],
    },
  },
  
  // Order confirmation
  confirmation: {
    successBg: checkoutColors.success.bg,
    successBorder: checkoutColors.success.border,
    successIcon: checkoutColors.success.icon,
    successText: checkoutColors.success.text,
  },
};

// ============================================
// UTILITY CLASSES
// ============================================

export const checkoutClasses = {
  // Card container
  card: "rounded-xl border bg-white shadow-sm",
  cardStyle: {
    backgroundColor: checkoutColors.bg.card,
    borderColor: checkoutColors.border.default,
  },
  
  // Section header
  sectionHeader: "border-b px-6 py-4",
  sectionHeaderStyle: {
    borderColor: checkoutColors.border.light,
  },
  
  // Section title
  sectionTitle: "font-semibold",
  sectionTitleStyle: {
    color: checkoutColors.text.primary,
  },
  
  // Form label
  label: "text-xs font-medium",
  labelStyle: {
    color: checkoutColors.neutral[700],
  },
  
  // Form input
  input: "w-full rounded-md border px-4 py-3 transition-colors",
  inputStyle: {
    backgroundColor: checkoutColors.bg.card,
    borderColor: checkoutColors.border.default,
    color: checkoutColors.text.primary,
  },
  
  // Error text
  errorText: "text-sm",
  errorTextStyle: {
    color: checkoutColors.error.text,
  },
};

// ============================================
// PRINT STYLES (explicit colors for printing)
// ============================================

export const printColors = {
  text: "#111827",
  textMuted: "#6b7280",
  border: "#e5e5e5",
  background: "#ffffff",
  success: "#059669",
};
