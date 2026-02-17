import * as React from "react";

interface PspRerefenceLinkProps {
  href: string | null;
  children: React.ReactChild;
}

export const PspReferenceLink = ({ href, children }: PspRerefenceLinkProps) => {
  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className="text-saleor-active-1">
        {children}
      </a>
    );
  }

  return <>{children}</>;
};
