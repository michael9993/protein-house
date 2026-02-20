/**
 * Plain HTML drop-in replacements for macaw-ui Box, Text, Button, Input.
 * These avoid the vanilla-extract Sprinkles issue that crashes in iframes.
 */
import { forwardRef, CSSProperties, ReactNode, ButtonHTMLAttributes, InputHTMLAttributes } from "react";

// ── Color tokens (approximate macaw-ui defaultLight theme) ──
const COLORS: Record<string, string> = {
  default1: "#f6f6f7",
  default2: "#9a9a9d",
  default3: "#1a1a1f",
  success1: "#d4edda",
  critical1: "#f8d7da",
  warning1: "#fff3cd",
  info1: "#3b82f6",
  transparent: "transparent",
};

const TEXT_COLORS: Record<string, string> = {
  default1: "#6b6b6f",
  default2: "#9a9a9d",
  default3: "#1a1a1f",
  success1: "#155724",
  critical1: "#721c24",
  warning1: "#856404",
  info1: "#3b82f6",
};

// ── Spacing (macaw-ui uses 8px grid) ──
function sp(n: number | undefined): string | undefined {
  if (n === undefined) return undefined;
  return `${n * 4}px`;
}

// ── Box ──
interface BoxProps {
  children?: ReactNode;
  display?: CSSProperties["display"];
  flexDirection?: CSSProperties["flexDirection"];
  flexWrap?: CSSProperties["flexWrap"];
  justifyContent?: CSSProperties["justifyContent"];
  alignItems?: CSSProperties["alignItems"];
  gap?: number;
  padding?: number;
  paddingX?: number;
  paddingY?: number;
  margin?: number;
  marginTop?: number;
  marginBottom?: number;
  marginX?: number;
  marginY?: number;
  borderRadius?: number;
  borderWidth?: number;
  borderBottomWidth?: number;
  borderStyle?: CSSProperties["borderStyle"];
  borderBottomStyle?: CSSProperties["borderStyle"];
  borderColor?: string;
  backgroundColor?: string;
  cursor?: CSSProperties["cursor"];
  onClick?: () => void;
  className?: string;
  title?: string;
  // pass-through for custom CSS
  __gridTemplateColumns?: string;
  __display?: string;
  __flex?: string;
  __wordBreak?: string;
  __width?: string;
}

export function Box({
  children,
  display,
  flexDirection,
  flexWrap,
  justifyContent,
  alignItems,
  gap,
  padding,
  paddingX,
  paddingY,
  margin,
  marginTop,
  marginBottom,
  marginX,
  marginY,
  borderRadius,
  borderWidth,
  borderBottomWidth,
  borderStyle,
  borderBottomStyle,
  borderColor,
  backgroundColor,
  cursor,
  onClick,
  className,
  title,
  __gridTemplateColumns,
  __display,
  __flex,
  __wordBreak,
  __width,
}: BoxProps) {
  const style: CSSProperties = {};

  if (display) style.display = display;
  if (__display) style.display = __display as any;
  if (display === "grid" && __gridTemplateColumns) {
    style.gridTemplateColumns = __gridTemplateColumns;
  }
  if (flexDirection) style.flexDirection = flexDirection;
  if (flexWrap) style.flexWrap = flexWrap;
  if (justifyContent) style.justifyContent = justifyContent;
  if (alignItems) style.alignItems = alignItems;
  if (gap !== undefined) style.gap = sp(gap);
  if (padding !== undefined) {
    style.padding = sp(padding);
  }
  if (paddingX !== undefined) {
    style.paddingLeft = sp(paddingX);
    style.paddingRight = sp(paddingX);
  }
  if (paddingY !== undefined) {
    style.paddingTop = sp(paddingY);
    style.paddingBottom = sp(paddingY);
  }
  if (margin !== undefined) style.margin = sp(margin);
  if (marginTop !== undefined) style.marginTop = sp(marginTop);
  if (marginBottom !== undefined) style.marginBottom = sp(marginBottom);
  if (marginX !== undefined) {
    style.marginLeft = sp(marginX);
    style.marginRight = sp(marginX);
  }
  if (marginY !== undefined) {
    style.marginTop = sp(marginY);
    style.marginBottom = sp(marginY);
  }
  if (borderRadius !== undefined) style.borderRadius = `${borderRadius * 2}px`;
  if (borderWidth !== undefined) style.borderWidth = `${borderWidth}px`;
  if (borderBottomWidth !== undefined) style.borderBottomWidth = `${borderBottomWidth}px`;
  if (borderStyle) style.borderStyle = borderStyle;
  if (borderBottomStyle) style.borderBottomStyle = borderBottomStyle;
  if (borderColor) style.borderColor = COLORS[borderColor] ?? borderColor;
  if (backgroundColor) style.backgroundColor = COLORS[backgroundColor] ?? backgroundColor;
  if (cursor) style.cursor = cursor;
  if (__flex) style.flex = __flex;
  if (__wordBreak) style.wordBreak = __wordBreak as any;
  if (__width) style.width = __width;

  return (
    <div style={style} onClick={onClick} className={className} title={title}>
      {children}
    </div>
  );
}

// ── Text ──
interface TextProps {
  children?: ReactNode;
  variant?: "heading" | "body" | "bodyStrong" | "caption";
  size?: "small" | "medium" | "large";
  color?: string;
  title?: string;
  // pass-through
  __display?: string;
  __wordBreak?: string;
  marginBottom?: number;
  marginTop?: number;
}

export function Text({
  children,
  variant = "body",
  size,
  color,
  title,
  __display,
  __wordBreak,
  marginBottom,
  marginTop,
}: TextProps) {
  const style: CSSProperties = {
    margin: 0,
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  };

  // Variant styles
  switch (variant) {
    case "heading":
      style.fontWeight = 600;
      if (size === "large") style.fontSize = "24px";
      else if (size === "medium") style.fontSize = "18px";
      else style.fontSize = "16px";
      break;
    case "bodyStrong":
      style.fontWeight = 600;
      style.fontSize = "14px";
      break;
    case "caption":
      style.fontSize = "12px";
      break;
    default:
      style.fontSize = "14px";
  }

  if (color) style.color = TEXT_COLORS[color] ?? color;
  if (__display) style.display = __display as any;
  if (__wordBreak) style.wordBreak = __wordBreak as any;
  if (marginBottom !== undefined) style.marginBottom = sp(marginBottom);
  if (marginTop !== undefined) style.marginTop = sp(marginTop);

  const Tag = variant === "heading" ? "h3" : "span";
  return <Tag style={style} title={title}>{children}</Tag>;
}

// ── Button ──
interface BtnProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "style"> {
  variant?: "primary" | "secondary" | "tertiary";
  size?: "small" | "medium" | "large";
}

export function Button({ variant = "secondary", size = "medium", children, disabled, ...rest }: BtnProps) {
  const base: CSSProperties = {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    border: "none",
    borderRadius: "6px",
    cursor: disabled ? "not-allowed" : "pointer",
    fontWeight: 500,
    opacity: disabled ? 0.5 : 1,
    transition: "background-color 0.15s, opacity 0.15s",
  };

  // Size
  if (size === "small") {
    base.padding = "4px 12px";
    base.fontSize = "12px";
  } else {
    base.padding = "8px 16px";
    base.fontSize = "14px";
  }

  // Variant
  switch (variant) {
    case "primary":
      base.backgroundColor = "#1a1a1f";
      base.color = "#ffffff";
      break;
    case "tertiary":
      base.backgroundColor = "transparent";
      base.color = "#6b6b6f";
      base.border = "1px solid transparent";
      break;
    default: // secondary
      base.backgroundColor = "#f6f6f7";
      base.color = "#1a1a1f";
      base.border = "1px solid #dcdcde";
  }

  return (
    <button style={base} disabled={disabled} {...rest}>
      {children}
    </button>
  );
}

// ── Input ──
interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size" | "style"> {
  size?: "small" | "medium";
  __width?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ size = "medium", __width, ...rest }, ref) => {
    const style: CSSProperties = {
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      border: "1px solid #dcdcde",
      borderRadius: "6px",
      outline: "none",
      width: __width ?? "100%",
      boxSizing: "border-box",
      transition: "border-color 0.15s",
    };

    if (size === "small") {
      style.padding = "6px 10px";
      style.fontSize = "13px";
    } else {
      style.padding = "8px 12px";
      style.fontSize = "14px";
    }

    return <input ref={ref} style={style} {...rest} />;
  }
);
Input.displayName = "Input";
