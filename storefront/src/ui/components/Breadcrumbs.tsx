"use client";

import { LinkWithChannel } from "@/ui/atoms/LinkWithChannel";
import { storeConfig } from "@/config";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  const { branding } = storeConfig;

  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      <ol className="flex flex-wrap items-center gap-2 text-sm">
        <li>
          <LinkWithChannel 
            href="/" 
            className="text-neutral-500 transition-colors hover:text-neutral-700"
          >
            Home
          </LinkWithChannel>
        </li>
        {items.map((item, index) => (
          <li key={index} className="flex items-center gap-2">
            <svg className="h-4 w-4 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            {item.href ? (
              <LinkWithChannel 
                href={item.href}
                className="text-neutral-500 transition-colors hover:text-neutral-700"
              >
                {item.label}
              </LinkWithChannel>
            ) : (
              <span 
                className="font-medium"
                style={{ color: branding.colors.text }}
              >
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

