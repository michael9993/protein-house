import { cn } from "@dashboard/utils/cn";
import { isExternalURL } from "@dashboard/utils/urls";
import { ArrowLeft } from "lucide-react";
import * as React from "react";
import { Link } from "react-router";

export interface BacklinkProps {
  href?: string;
  children?: React.ReactNode;
  disabled?: boolean;
  className?: string;
  onClick?: (event: React.MouseEvent) => void;
}

export const Backlink = ({ href, children, disabled, className, onClick, ...props }: BacklinkProps) => {
  const baseClassName = cn(
    "inline-flex items-center gap-1 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] cursor-pointer transition-colors no-underline border-none bg-transparent p-0",
    disabled && "opacity-50 pointer-events-none",
    className,
  );

  const content = (
    <>
      <ArrowLeft size={16} />
      {children}
    </>
  );

  if (href && !isExternalURL(href)) {
    return (
      <Link to={href} className={baseClassName} onClick={onClick} {...props}>
        {content}
      </Link>
    );
  }

  if (href) {
    return (
      <a href={href} className={baseClassName} onClick={onClick} {...props}>
        {content}
      </a>
    );
  }

  return (
    <button type="button" className={baseClassName} onClick={onClick} disabled={disabled} {...props}>
      {content}
    </button>
  );
};
