"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronRightIcon } from "lucide-react";
import { LinkWithChannel } from "@/ui/atoms/LinkWithChannel";
import { useBranding, useContentConfig } from "@/providers/StoreConfigProvider";
import { useInMobileMenu } from "./MobileMenuContext";
import { type CategoryWithChildren } from "./NavLinksClient";

interface ShopAllDropdownProps {
  categories: CategoryWithChildren[];
  collections?: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
  brands?: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
  channel: string;
}

const HOVER_LEAVE_DELAY_MS = 400;

/** True if hoveredId is this item or any descendant (so parent flyouts stay open when hovering a child). */
function isItemOrDescendantHovered(item: CategoryWithChildren, hoveredId: string | null): boolean {
  if (!hoveredId) return false;
  if (item.id === hoveredId) return true;
  return !!(item.children?.some((c) => isItemOrDescendantHovered(c, hoveredId)));
}

/** Returns CSS transform string for ChevronRightIcon when expanded. */
function getArrowExpandedTransform(dir: "up" | "down" | "left" | "right" | "auto"): string {
  if (dir === "right") return "rotate(0deg)";
  if (dir === "left") return "rotate(180deg)";
  if (dir === "up") return "rotate(-90deg)";
  if (dir === "down") return "rotate(90deg)";
  return "rotate(90deg)"; // auto = down
}

/** Returns CSS transform string for ChevronRightIcon when collapsed. Inline style overrides classes, so we need this. */
function getArrowCollapsedTransform(
  dir: "up" | "down" | "left" | "right" | "auto",
  isRtl?: boolean,
): string {
  if (dir === "right") return "rotate(0deg)";
  if (dir === "left") return "rotate(180deg)";
  if (dir === "up") return "rotate(-90deg)";
  if (dir === "down") return "rotate(90deg)";
  // auto: LTR → left (180deg), RTL → right (0deg)
  return isRtl ? "rotate(0deg)" : "rotate(180deg)";
}

/** Renders a category tree at any depth; each level with children gets a flyout. */
function CategoryTreeLevel({
  items,
  channel,
  hoveredId,
  setHoveredId,
  onClose,
  dropdownSide,
  branding,
  leaveTimeoutRef,
  hoverDelayMs = HOVER_LEAVE_DELAY_MS,
  arrowBaseClass = "ltr:rotate-180",
  arrowExpandedTransform = "rotate(90deg)",
  arrowCollapsedTransform = "rotate(0deg)",
}: {
  items: CategoryWithChildren[];
  channel: string;
  hoveredId: string | null;
  setHoveredId: (id: string | null) => void;
  onClose: () => void;
  dropdownSide: "left" | "right";
  branding: { colors: { primary: string } };
  leaveTimeoutRef?: React.MutableRefObject<NodeJS.Timeout | null>;
  hoverDelayMs?: number;
  arrowBaseClass?: string;
  arrowExpandedTransform?: string;
  arrowCollapsedTransform?: string;
}) {
  if (items.length === 0) return null;

  // Overlap flyout onto row by 12px so there is no gap – cursor stays in hover zone when moving row → flyout
  const flyoutClass = dropdownSide === "right" ? "start-full -ms-3" : "end-full -me-3";
  const flyoutStyles = {
    boxShadow: "0 20px 40px -10px rgba(0, 0, 0, 0.15), 0 10px 20px -5px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(0, 0, 0, 0.05)",
    border: `1px solid ${branding.colors.primary}08`,
  };

  const scheduleClear = () => {
    if (!leaveTimeoutRef) {
      setHoveredId(null);
      return;
    }
    if (leaveTimeoutRef.current) clearTimeout(leaveTimeoutRef.current);
    leaveTimeoutRef.current = setTimeout(() => setHoveredId(null), hoverDelayMs);
  };

  const cancelClearAndSet = (itemId: string) => {
    if (leaveTimeoutRef?.current) {
      clearTimeout(leaveTimeoutRef.current);
      leaveTimeoutRef.current = null;
    }
    setHoveredId(itemId);
  };

  if (items.length === 0) return null;

  return (
    <ul className="space-y-1">
      {items.map((item) => {
        const hasChildren = item.children && item.children.length > 0;
        const isHovered = hoveredId === item.id;
        const flyoutOpen = hasChildren && isItemOrDescendantHovered(item, hoveredId);

        return (
          <li key={item.id} className="relative">
            <div className="group/item relative">
              <LinkWithChannel
                href={`/products?categories=${item.slug}`}
                onClick={onClose}
                className={`flex items-center rounded-lg px-3 py-2.5 text-sm transition-all duration-200 ${hasChildren ? "justify-between gap-2" : ""} hover:bg-neutral-50 active:bg-neutral-100`}
                style={{
                  backgroundColor: isHovered ? `${branding.colors.primary}12` : undefined,
                  color: isHovered ? branding.colors.primary : "#000000",
                  transform: isHovered ? "translateX(2px)" : "translateX(0)",
                }}
                onMouseEnter={() => cancelClearAndSet(item.id)}
                onMouseLeave={() => scheduleClear()}
              >
                <span className="font-medium">{item.name}</span>
                {hasChildren && (
                  <ChevronRightIcon
                    className={`h-3.5 w-3.5 shrink-0 transition-transform duration-200 ${arrowBaseClass}`}
                    style={{
                      color: isHovered ? branding.colors.primary : undefined,
                      transform: flyoutOpen ? arrowExpandedTransform : arrowCollapsedTransform,
                    }}
                  />
                )}
              </LinkWithChannel>

              {flyoutOpen && item.children && (
                <div
                  className={`absolute top-0 z-[60] w-64 rounded-2xl bg-gradient-to-br from-white via-white to-neutral-50/50 shadow-2xl backdrop-blur-sm ${flyoutClass}`}
                  style={flyoutStyles}
                  onMouseEnter={() => cancelClearAndSet(item.id)}
                  onMouseLeave={() => scheduleClear()}
                >
                  <div className="p-5">
                    <CategoryTreeLevel
                      items={item.children}
                      channel={channel}
                      hoveredId={hoveredId}
                      setHoveredId={setHoveredId}
                      onClose={onClose}
                      dropdownSide={dropdownSide}
                      branding={branding}
                      leaveTimeoutRef={leaveTimeoutRef}
                      hoverDelayMs={hoverDelayMs}
                      arrowBaseClass={arrowBaseClass}
                      arrowExpandedTransform={arrowExpandedTransform}
                      arrowCollapsedTransform={arrowCollapsedTransform}
                    />
                  </div>
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/** Mobile: render category tree with accordion expand/collapse at every level (same as top-level dropdown). */
function MobileCategoryTree({
  items,
  channel,
  onClose,
  expandedIds,
  onToggleExpanded,
  branding,
  depth = 0,
  arrowBaseClass = "ltr:rotate-180",
  arrowExpandedTransform = "rotate(90deg)",
  arrowCollapsedTransform = "rotate(0deg)",
}: {
  items: CategoryWithChildren[];
  channel: string;
  onClose: () => void;
  expandedIds: Set<string>;
  onToggleExpanded: (id: string) => void;
  branding: { colors: { primary: string } };
  depth?: number;
  arrowBaseClass?: string;
  arrowExpandedTransform?: string;
  arrowCollapsedTransform?: string;
}) {
  if (items.length === 0) return null;

  const nestedClass = depth > 0 ? "ms-4 mt-1 space-y-0.5 border-s border-neutral-200 ps-3" : "space-y-0.5";
  return (
    <ul className={nestedClass}>
      {items.map((item) => {
        const hasChildren = item.children && item.children.length > 0;
        const isExpanded = expandedIds.has(item.id);

        if (!hasChildren) {
          return (
            <li key={item.id}>
              <LinkWithChannel
                href={`/products?categories=${item.slug}`}
                onClick={onClose}
                className="block rounded-lg px-3 py-2.5 text-sm font-medium text-neutral-700 transition-colors duration-200 hover:bg-neutral-100 hover:text-neutral-900 active:bg-neutral-200"
              >
                {item.name}
              </LinkWithChannel>
            </li>
          );
        }

        return (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => onToggleExpanded(item.id)}
              className="flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-all duration-200 hover:bg-neutral-100 hover:text-neutral-900 active:bg-neutral-200"
              style={{
                backgroundColor: isExpanded ? `${branding.colors.primary}12` : undefined,
                color: isExpanded ? branding.colors.primary : undefined,
              }}
              aria-expanded={isExpanded}
              aria-controls={`mobile-cat-${item.id}`}
            >
              <span>{item.name}</span>
              <ChevronRightIcon
                className={`h-4 w-4 shrink-0 transition-transform duration-200 ${arrowBaseClass}`}
                style={{
                  color: branding.colors.primary,
                  transform: isExpanded ? arrowExpandedTransform : arrowCollapsedTransform,
                }}
              />
            </button>
            <div
              id={`mobile-cat-${item.id}`}
              role="region"
              aria-hidden={!isExpanded}
              className="overflow-hidden transition-all duration-200"
              style={{ maxHeight: isExpanded ? "2000px" : "0", opacity: isExpanded ? 1 : 0 }}
            >
              <MobileCategoryTree
                items={item.children!}
                channel={channel}
                onClose={onClose}
                expandedIds={expandedIds}
                onToggleExpanded={onToggleExpanded}
                branding={branding}
                depth={depth + 1}
                arrowBaseClass={arrowBaseClass}
                arrowExpandedTransform={arrowExpandedTransform}
                arrowCollapsedTransform={arrowCollapsedTransform}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function ShopAllDropdown({ categories, collections, brands, channel }: ShopAllDropdownProps) {
  const inMobileMenu = useInMobileMenu();
  const [isOpen, setIsOpen] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState(false);
  const [mobileExpandedCategoryIds, setMobileExpandedCategoryIds] = useState<Set<string>>(new Set());
  const [hoveredCategoryId, setHoveredCategoryId] = useState<string | null>(null);
  const [hoveredCollection, setHoveredCollection] = useState<string | null>(null);
  const [hoveredBrand, setHoveredBrand] = useState<string | null>(null);
  const [hoveredSection, setHoveredSection] = useState<"categories" | "collections" | "brands" | null>(null);
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const categoryLeaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const branding = useBranding();
  const content = useContentConfig();
  const shopAllText = content.navbar?.shopAllButton || content.filters?.shopAllButton || "Shop All";
  const dropdownArrowDir = content.navbar?.dropdownArrowDirection ?? "auto";
  const arrowBaseClass =
    dropdownArrowDir === "left"
      ? "rotate-180"
      : dropdownArrowDir === "up"
        ? "-rotate-90"
        : dropdownArrowDir === "down"
          ? "rotate-90"
          : dropdownArrowDir === "auto"
            ? "ltr:rotate-180"
            : ""; // right = ChevronRightIcon default
  const arrowExpandedTransform = getArrowExpandedTransform(
    content.navbar?.dropdownArrowDirectionExpanded ?? "down",
  );

  // Detect RTL direction dynamically (used for "auto" collapsed arrow)
  const [isRtl, setIsRtl] = useState(false);
  useEffect(() => {
    const checkRtl = () => {
      setIsRtl(document.documentElement.dir === 'rtl');
    };
    checkRtl();
    const observer = new MutationObserver(checkRtl);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['dir'],
    });
    return () => observer.disconnect();
  }, []);

  const arrowCollapsedTransform = getArrowCollapsedTransform(
    dropdownArrowDir as "up" | "down" | "left" | "right" | "auto",
    isRtl,
  );

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

  // Clear category hover state, section hover, and any pending leave timeout when dropdown closes
  useEffect(() => {
    if (!isOpen) {
      setHoveredCategoryId(null);
      setHoveredSection(null);
      if (categoryLeaveTimeoutRef.current) {
        clearTimeout(categoryLeaveTimeoutRef.current);
        categoryLeaveTimeoutRef.current = null;
      }
    }
  }, [isOpen]);

  const handleMouseEnter = () => {
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
      setHoverTimeout(null);
    }
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    // Delay to allow moving from button to dropdown or into category flyouts
    const timeout = setTimeout(() => {
      setIsOpen(false);
    }, 280);
    setHoverTimeout(timeout);
  };

  // Mobile menu: accordion-style expand/collapse (tap only), including deeper category levels
  if (inMobileMenu) {
    const toggleCategoryExpanded = (id: string) => {
      setMobileExpandedCategoryIds((prev: Set<string>) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
    };
    const closeMobile = () => {
      setMobileExpanded(false);
      setMobileExpandedCategoryIds(new Set());
    };
    return (
      <div className="w-full">
        <button
          type="button"
          onClick={() => setMobileExpanded((v: boolean) => !v)}
          className="flex w-full items-center justify-between py-3 text-left text-sm font-semibold text-neutral-900"
          aria-expanded={mobileExpanded}
          aria-controls="mobile-shop-all-content"
        >
          <span>{shopAllText}</span>
          <ChevronRightIcon
            className={`h-4 w-4 shrink-0 transition-transform duration-200 ${arrowBaseClass}`}
            style={{
              color: branding.colors.primary,
              transform: mobileExpanded ? arrowExpandedTransform : arrowCollapsedTransform,
            }}
          />
        </button>
        {mobileExpanded && (
          <div id="mobile-shop-all-content" className="pb-4 space-y-4">
            {categories.length > 0 && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-widest text-neutral-500 mb-2">
                  {content.navbar?.categoriesLabel || "Categories"}
                </h4>
                <MobileCategoryTree
                  items={categories}
                  channel={channel}
                  onClose={closeMobile}
                  expandedIds={mobileExpandedCategoryIds}
                  onToggleExpanded={toggleCategoryExpanded}
                  branding={branding}
                  arrowBaseClass={arrowBaseClass}
                />
              </div>
            )}
            {collections && collections.length > 0 && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-widest text-neutral-500 mb-2">
                  {content.navbar?.collectionsLabel || "Collections"}
                </h4>
                <ul className="space-y-0.5">
                  {collections.map((c) => (
                    <li key={c.id}>
                      <LinkWithChannel
                        href={`/products?collections=${c.slug}`}
                        onClick={closeMobile}
                        className="block py-2 text-sm font-medium text-neutral-700 hover:text-neutral-900"
                      >
                        {c.name}
                      </LinkWithChannel>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {brands && brands.length > 0 && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-widest text-neutral-500 mb-2">
                  {content.navbar?.brandsLabel || "Brands"}
                </h4>
                <ul className="space-y-0.5">
                  {brands.map((b) => (
                    <li key={b.id}>
                      <LinkWithChannel
                        href={`/products?brands=${b.slug}`}
                        onClick={closeMobile}
                        className="block py-2 text-sm font-medium text-neutral-700 hover:text-neutral-900"
                      >
                        {b.name}
                      </LinkWithChannel>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="pt-2 border-t border-neutral-200">
              <LinkWithChannel
                href="/products"
                onClick={closeMobile}
                className="inline-flex items-center gap-2 py-2 text-sm font-semibold"
                style={{ color: branding.colors.primary }}
              >
                <span>{content.navbar?.viewAllProducts || "View All Products"}</span>
                <ChevronRightIcon className="h-4 w-4 ltr:rotate-180" />
              </LinkWithChannel>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative flex items-stretch"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Shop All trigger — no wrapper, transparent until hover, fits edges */}
      <LinkWithChannel
        href="/products"
        className="group relative flex flex-1 items-center justify-center gap-1.5 py-2 px-3 text-sm font-semibold transition-all duration-200"
        style={{
          backgroundColor: "transparent",
          color: isOpen ? branding.colors.primary : "inherit",
          textDecoration: "none",
          border: "none",
          boxShadow: "none",
        }}
        onMouseEnter={() => setIsOpen(true)}
      >
        <span className="font-semibold">{shopAllText}</span>
        <ChevronRightIcon
          className={`h-4 w-4 transition-transform duration-200 ${arrowBaseClass}`}
          style={{
            color: isOpen ? branding.colors.primary : undefined,
            transform: isOpen ? arrowExpandedTransform : arrowCollapsedTransform,
          }}
        />
      </LinkWithChannel>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="absolute start-0 top-full z-50 mt-2 w-[600px] rounded-2xl bg-gradient-to-br from-white via-white to-neutral-50/50 shadow-2xl backdrop-blur-sm"
          style={{
            opacity: isOpen ? 1 : 0,
            transform: isOpen ? 'translateY(0)' : 'translateY(-8px)',
            pointerEvents: isOpen ? 'auto' : 'none',
            transition: 'opacity 200ms ease-out, transform 200ms ease-out',
            boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.15), 0 10px 20px -5px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(0, 0, 0, 0.05)',
            border: `1px solid ${branding.colors.primary}08`,
          }}
          onMouseEnter={() => setIsOpen(true)}
          onMouseLeave={() => setIsOpen(false)}
        >
          <div className="p-6">
            {/* Grid Layout: Categories | Collections | Brands */}
            <div className={`grid gap-4 ${
              categories.length > 0 && collections && collections.length > 0 && brands && brands.length > 0
                ? "grid-cols-3"
                : (categories.length > 0 && collections && collections.length > 0) ||
                  (categories.length > 0 && brands && brands.length > 0) ||
                  (collections && collections.length > 0 && brands && brands.length > 0)
                ? "grid-cols-2"
                : "grid-cols-1"
            }`}>
              {/* Categories Section — recursive tree; only categories have hierarchy (collections/brands are flat) */}
              {categories.length > 0 && (() => {
                const subcategoriesSide = content.navbar?.subcategoriesSide || "auto";
                const dropdownSide: "left" | "right" = subcategoriesSide === "auto" ? (isRtl ? "right" : "left") : (subcategoriesSide === "left" ? "left" : "right");
                const isHovered = hoveredSection === "categories";
                return (
                  <div
                    className="rounded-lg py-4 px-3 transition-all duration-200"
                    style={{
                      backgroundColor: isHovered ? `${branding.colors.primary}06` : "transparent",
                      boxShadow: isHovered ? `inset 0 1px 4px ${branding.colors.primary}12` : undefined,
                    }}
                    onMouseEnter={() => setHoveredSection("categories")}
                    onMouseLeave={() => setHoveredSection(null)}
                  >
                    <div className="mb-4 flex items-center gap-2">
                      <div
                        className="h-1 w-8 rounded-full"
                        style={{ backgroundColor: branding.colors.primary }}
                      />
                      <h3 className="text-sm font-bold uppercase tracking-widest text-neutral-700">
                        {content.navbar?.categoriesLabel || "Categories"}
                      </h3>
                    </div>
                    <CategoryTreeLevel
                      items={categories}
                      channel={channel}
                      hoveredId={hoveredCategoryId}
                      setHoveredId={setHoveredCategoryId}
                      onClose={() => setIsOpen(false)}
                      dropdownSide={dropdownSide}
                      branding={branding}
                      leaveTimeoutRef={categoryLeaveTimeoutRef}
                      hoverDelayMs={HOVER_LEAVE_DELAY_MS}
                      arrowBaseClass={arrowBaseClass}
                      arrowExpandedTransform={arrowExpandedTransform}
                      arrowCollapsedTransform={arrowCollapsedTransform}
                    />
                  </div>
                );
              })()}

              {/* Collections Section */}
              {collections && collections.length > 0 && (
                <div
                  className="rounded-lg py-4 px-3 transition-all duration-200"
                  style={{
                    backgroundColor: hoveredSection === "collections" ? `${branding.colors.primary}06` : "transparent",
                    boxShadow: hoveredSection === "collections" ? `inset 0 1px 4px ${branding.colors.primary}12` : undefined,
                  }}
                  onMouseEnter={() => setHoveredSection("collections")}
                  onMouseLeave={() => setHoveredSection(null)}
                >
                  <div className="mb-4 flex items-center gap-2">
                    <div 
                      className="h-1 w-8 rounded-full"
                      style={{ backgroundColor: branding.colors.primary }}
                    />
                    <h3 className="text-sm font-bold uppercase tracking-widest text-neutral-700">
                      {content.navbar?.collectionsLabel || "Collections"}
                    </h3>
                  </div>
                  <ul className="space-y-1">
                    {collections.map((collection) => (
                      <li key={collection.id}>
                        <LinkWithChannel
                          href={`/products?collections=${collection.slug}`}
                          onClick={() => setIsOpen(false)}
                          className="group/item flex items-center rounded-lg px-3 py-2.5 text-sm transition-all duration-200"
                          style={{
                            backgroundColor: hoveredCollection === collection.id ? `${branding.colors.primary}08` : 'transparent',
                            color: hoveredCollection === collection.id ? branding.colors.primary : '#000000',
                            transform: hoveredCollection === collection.id ? 'translateX(2px)' : 'translateX(0)',
                          }}
                          onMouseEnter={() => {
                            setHoveredCollection(collection.id);
                          }}
                          onMouseLeave={() => {
                            setHoveredCollection(null);
                          }}
                        >
                          <span className="font-medium transition-all duration-200">
                            {collection.name}
                          </span>
                        </LinkWithChannel>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Brands Section */}
              {brands && brands.length > 0 && (
                <div
                  className="rounded-lg py-4 px-3 transition-all duration-200"
                  style={{
                    backgroundColor: hoveredSection === "brands" ? `${branding.colors.primary}06` : "transparent",
                    boxShadow: hoveredSection === "brands" ? `inset 0 1px 4px ${branding.colors.primary}12` : undefined,
                  }}
                  onMouseEnter={() => setHoveredSection("brands")}
                  onMouseLeave={() => setHoveredSection(null)}
                >
                  <div className="mb-4 flex items-center gap-2">
                    <div 
                      className="h-1 w-8 rounded-full"
                      style={{ backgroundColor: branding.colors.primary }}
                    />
                    <h3 className="text-sm font-bold uppercase tracking-widest text-neutral-700">
                      {content.navbar?.brandsLabel || "Brands"}
                    </h3>
                  </div>
                  <ul className="space-y-1">
                    {brands.map((brand) => (
                      <li key={brand.id}>
                        <LinkWithChannel
                          href={`/products?brands=${brand.slug}`}
                          onClick={() => setIsOpen(false)}
                          className="group/item flex items-center rounded-lg px-3 py-2.5 text-sm transition-all duration-200"
                          style={{
                            backgroundColor: hoveredBrand === brand.id ? `${branding.colors.primary}08` : 'transparent',
                            color: hoveredBrand === brand.id ? branding.colors.primary : '#000000',
                            transform: hoveredBrand === brand.id ? 'translateX(2px)' : 'translateX(0)',
                          }}
                          onMouseEnter={() => {
                            setHoveredBrand(brand.id);
                          }}
                          onMouseLeave={() => {
                            setHoveredBrand(null);
                          }}
                        >
                          <span className="font-medium transition-all duration-200">
                            {brand.name}
                          </span>
                        </LinkWithChannel>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* View All Products Link */}
            <div className="mt-6 pt-5 border-t border-neutral-200">
              <LinkWithChannel
                href="/products"
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-semibold transition-all duration-200"
                style={{
                  color: branding.colors.primary,
                  backgroundColor: `${branding.colors.primary}08`,
                  border: `1px solid ${branding.colors.primary}15`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = `${branding.colors.primary}15`;
                  e.currentTarget.style.transform = 'scale(1.02)';
                  e.currentTarget.style.boxShadow = `0 4px 12px ${branding.colors.primary}20`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = `${branding.colors.primary}08`;
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <span>{content.navbar?.viewAllProducts || "View All Products"}</span>
                <ChevronRightIcon className={`h-4 w-4 ${arrowBaseClass} transition-transform duration-200 group-hover:translate-x-1 ltr:group-hover:-translate-x-1`} />
              </LinkWithChannel>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
