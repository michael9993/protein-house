"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDownIcon } from "lucide-react";
import { NavLinkInner } from "./NavLink";
import { MegaMenu } from "./MegaMenu";
import { type CategoryWithChildren } from "./NavLinksClient";
import { useBranding } from "@/providers/StoreConfigProvider";

interface NavLinkWithDropdownProps {
  category: CategoryWithChildren;
  channel: string;
}

export function NavLinkWithDropdown({ category, channel }: NavLinkWithDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLLIElement>(null);
  const branding = useBranding();

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Close on escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen]);

  const handleMouseEnter = () => {
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
      setHoverTimeout(null);
    }
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    const timeout = setTimeout(() => {
      setIsOpen(false);
    }, 150); // Small delay to allow moving to mega menu
    setHoverTimeout(timeout);
  };

  const handleClose = () => {
    setIsOpen(false);
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
    }
  };

  return (
    <li
      ref={containerRef}
      className="relative inline-flex"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="flex items-center gap-1.5">
        <NavLinkInner 
          href={`/categories/${category.slug}`}
          onClick={() => handleClose()}
        >
          {category.name}
        </NavLinkInner>
        <ChevronDownIcon
          className={`h-4 w-4 text-neutral-500 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
          style={isOpen ? { color: branding.colors.primary } : undefined}
        />
      </div>
      <MegaMenu
        category={category}
        channel={channel}
        isOpen={isOpen}
        onClose={handleClose}
      />
    </li>
  );
}
