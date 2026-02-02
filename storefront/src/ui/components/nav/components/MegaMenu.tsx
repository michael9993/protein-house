"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { ChevronRightIcon } from "lucide-react";
import { LinkWithChannel } from "@/ui/atoms/LinkWithChannel";
import { useBranding } from "@/providers/StoreConfigProvider";
import { type CategoryWithChildren } from "./NavLinksClient";

interface MegaMenuProps {
  category: CategoryWithChildren;
  channel: string;
  isOpen: boolean;
  onClose: () => void;
}

export function MegaMenu({ category, channel, isOpen, onClose }: MegaMenuProps) {
  const [hoveredSubcategory, setHoveredSubcategory] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const branding = useBranding();

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  // Close on escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const hasSubcategories = category.children && category.children.length > 0;
  const hasImage = category.backgroundImage?.url;

  return (
    <div
      ref={menuRef}
      className="absolute left-0 top-full z-50 mt-2 w-full max-w-6xl rounded-xl bg-white shadow-xl ring-1 ring-black/5 opacity-0 translate-y-[-8px] transition-all duration-200"
      style={{
        opacity: isOpen ? 1 : 0,
        transform: isOpen ? 'translateY(0)' : 'translateY(-8px)',
        pointerEvents: isOpen ? 'auto' : 'none',
      }}
      onMouseLeave={onClose}
    >

      <div className={`grid gap-0 ${hasImage ? "grid-cols-1 lg:grid-cols-4" : "grid-cols-1"}`}>
        {/* Category Image/Header Section */}
        {hasImage && (
          <div className="relative hidden lg:block lg:col-span-1">
            <div className="relative h-full min-h-[300px] overflow-hidden rounded-l-xl">
              <Image
                src={category.backgroundImage!.url}
                alt={category.backgroundImage!.alt || category.name}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 0px, 300px"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                <h3 className="text-xl font-bold">{category.name}</h3>
                {category.description && (
                  <p className="mt-2 text-sm text-white/90 line-clamp-2">
                    {category.description}
                  </p>
                )}
                <LinkWithChannel
                  href={`/categories/${category.slug}`}
                  onClick={onClose}
                  className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-white hover:text-white/80 transition-colors"
                >
                  Shop All
                  <ChevronRightIcon className="h-4 w-4" />
                </LinkWithChannel>
              </div>
            </div>
          </div>
        )}

        {/* Subcategories Grid */}
        <div className={`p-6 ${hasImage ? "lg:col-span-3" : "lg:col-span-1"}`}>
          {hasSubcategories ? (
            <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
              {(category.children ?? []).map((subcategory) => (
                <div
                  key={subcategory.id}
                  className="group"
                  onMouseEnter={() => setHoveredSubcategory(subcategory.id)}
                  onMouseLeave={() => setHoveredSubcategory(null)}
                >
                  <LinkWithChannel
                    href={`/categories/${subcategory.slug}`}
                    onClick={onClose}
                    className="block rounded-lg p-3 transition-all hover:bg-neutral-50"
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className="text-sm font-medium text-neutral-900 transition-colors group-hover:text-neutral-700"
                        style={
                          hoveredSubcategory === subcategory.id
                            ? { color: branding.colors.primary }
                            : undefined
                        }
                      >
                        {subcategory.name}
                      </span>
                      <ChevronRightIcon
                        className={`h-4 w-4 text-neutral-400 transition-all ${
                          hoveredSubcategory === subcategory.id
                            ? "translate-x-0 opacity-100"
                            : "translate-x-[-4px] opacity-0 group-hover:translate-x-0 group-hover:opacity-100"
                        }`}
                      />
                    </div>
                    {subcategory.productCount !== undefined && (
                      <p className="mt-1 text-xs text-neutral-500">
                        {subcategory.productCount} {subcategory.productCount === 1 ? "product" : "products"}
                      </p>
                    )}
                  </LinkWithChannel>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-sm text-neutral-500">No subcategories available</p>
              <LinkWithChannel
                href={`/categories/${category.slug}`}
                onClick={onClose}
                className="mt-4 inline-flex items-center gap-2 text-sm font-medium transition-colors"
                style={{ color: branding.colors.primary }}
              >
                View all products
                <ChevronRightIcon className="h-4 w-4" />
              </LinkWithChannel>
            </div>
          )}

          {/* Shop All Link */}
          <div className="mt-6 border-t border-neutral-100 pt-4">
            <LinkWithChannel
              href={`/categories/${category.slug}`}
              onClick={onClose}
              className="inline-flex items-center gap-2 text-sm font-semibold transition-colors"
              style={{ color: branding.colors.primary }}
            >
              Shop All {category.name}
              <ChevronRightIcon className="h-4 w-4" />
            </LinkWithChannel>
          </div>
        </div>
      </div>
    </div>
  );
}
