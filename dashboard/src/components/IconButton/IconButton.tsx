import { cn } from "@dashboard/utils/cn";
import { isExternalURL } from "@dashboard/utils/urls";
import * as React from "react";
import { Link } from "react-router";

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  size?: "small" | "medium";
  state?: "active" | "default";
  hoverOutline?: boolean;
  error?: boolean;
  href?: string;
  color?: string;
}

const variantStyles: Record<string, string> = {
  primary:
    "border border-[var(--color-divider)] bg-[var(--color-background-paper)] hover:bg-[var(--color-generic-light)]",
  secondary:
    "border border-[var(--color-divider)] bg-transparent hover:bg-[var(--color-generic-light)]",
  ghost: "border-transparent bg-transparent hover:bg-[var(--color-generic-light)]",
};

const sizeStyles: Record<string, string> = {
  small: "h-[32px] w-[32px]",
  medium: "h-[36px] w-[36px]",
};

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      variant = "secondary",
      size = "medium",
      state,
      hoverOutline,
      error,
      href,
      color,
      className,
      disabled,
      children,
      ...rest
    },
    ref,
  ) => {
    const combinedClassName = cn(
      "inline-flex items-center justify-center rounded-md transition-colors cursor-pointer",
      "text-[var(--color-text-primary)] border",
      variantStyles[variant] ?? variantStyles.secondary,
      sizeStyles[size] ?? sizeStyles.medium,
      state === "active" && "bg-[var(--color-generic-light)]",
      disabled && "opacity-50 cursor-not-allowed pointer-events-none",
      className,
    );

    if (href && !isExternalURL(href)) {
      return (
        <Link
          to={href}
          ref={ref as React.Ref<HTMLAnchorElement>}
          className={combinedClassName}
          aria-disabled={disabled}
          {...(rest as any)}
        >
          {children}
        </Link>
      );
    }

    if (href) {
      return (
        <a
          href={href}
          ref={ref as React.Ref<HTMLAnchorElement>}
          className={combinedClassName}
          aria-disabled={disabled}
          {...(rest as any)}
        >
          {children}
        </a>
      );
    }

    return (
      <button
        ref={ref}
        type="button"
        className={combinedClassName}
        disabled={disabled}
        {...rest}
      >
        {children}
      </button>
    );
  },
);

IconButton.displayName = "IconButton";
