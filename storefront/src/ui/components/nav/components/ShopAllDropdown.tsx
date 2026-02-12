"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { ChevronRightIcon } from "lucide-react";
import Image from "next/image";
import { LinkWithChannel } from "@/ui/atoms/LinkWithChannel";
import { useBranding, useContentConfig } from "@/providers/StoreConfigProvider";
import { buildCategoryUrl, buildCollectionUrl, buildBrandUrl } from "@/lib/urls";
import { useInMobileMenu } from "./MobileMenuContext";
import { type CategoryWithChildren } from "./NavLinksClient";
import { parseDescription } from "@/components/home/utils";

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
const CATEGORY_HOVER_DEBOUNCE_MS = 80;

/** Returns CSS transform string for ChevronRightIcon when expanded. */
function getArrowExpandedTransform(dir: "up" | "down" | "left" | "right" | "auto"): string {
  if (dir === "right") return "rotate(0deg)";
  if (dir === "left") return "rotate(180deg)";
  if (dir === "up") return "rotate(-90deg)";
  if (dir === "down") return "rotate(90deg)";
  return "rotate(90deg)"; // auto = down
}

/** Returns CSS transform string for ChevronRightIcon when collapsed. */
function getArrowCollapsedTransform(
  dir: "up" | "down" | "left" | "right" | "auto",
  isRtl?: boolean,
): string {
  if (dir === "right") return "rotate(0deg)";
  if (dir === "left") return "rotate(180deg)";
  if (dir === "up") return "rotate(-90deg)";
  if (dir === "down") return "rotate(90deg)";
  return isRtl ? "rotate(0deg)" : "rotate(180deg)";
}

// ============================================
// MEGA MENU SUB-COMPONENTS (Desktop only)
// ============================================

/** Single category row in the left nav with active accent bar.
 *  Touch behaviour: first tap selects (shows subcategories), second tap navigates. */
function CategoryNavItem({
  category,
  isActive,
  primaryColor,
  channel,
  onHover,
  onClose,
  isTouchDevice,
}: {
  category: CategoryWithChildren;
  isActive: boolean;
  primaryColor: string;
  channel: string;
  onHover: (id: string) => void;
  onClose: () => void;
  isTouchDevice: boolean;
}) {
  const childCount = category.children?.length ?? 0;

  const handleClick = (e: React.MouseEvent) => {
    // Touch devices: first tap selects the category (shows subcategories);
    // second tap on the already-active category navigates.
    if (isTouchDevice && !isActive) {
      e.preventDefault();
      onHover(category.id);
      return;
    }
    // Desktop or already-active: navigate (default link behavior) and close menu
    onClose();
  };

  return (
    <LinkWithChannel
      href={buildCategoryUrl(category.slug)}
      onClick={handleClick}
      className="group/cat flex w-full items-center gap-2 rounded-e-lg py-3 pe-4 ps-5 text-[15px] transition-all duration-150 cursor-pointer"
      style={{
        borderInlineStart: isActive ? `3px solid ${primaryColor}` : "3px solid transparent",
        paddingInlineStart: isActive ? "calc(1.25rem - 3px)" : "calc(1.25rem)",
        backgroundColor: isActive ? `${primaryColor}06` : "transparent",
        color: isActive ? "#111827" : "#404040",
        fontWeight: isActive ? 600 : 500,
      }}
      onMouseEnter={() => onHover(category.id)}
    >
      <span className="flex-1 truncate">{category.name}</span>
      {childCount > 0 && (
        <span
          className="text-sm tabular-nums transition-colors duration-150"
          style={{ color: isActive ? primaryColor : "#a3a3a3" }}
        >
          {childCount}
        </span>
      )}
    </LinkWithChannel>
  );
}

/** Single subcategory tile in the center panel. */
function SubcategoryCard({
  subcategory,
  channel,
  primaryColor,
  animationDelay,
  labels,
  onClose,
}: {
  subcategory: CategoryWithChildren;
  channel: string;
  primaryColor: string;
  animationDelay: number;
  labels: { productLabel: string; productsLabel: string };
  onClose: () => void;
}) {
  return (
    <LinkWithChannel
      href={buildCategoryUrl(subcategory.slug)}
      onClick={onClose}
      className="group/sub mega-menu-crossfade flex flex-col rounded-lg border border-neutral-100 bg-neutral-50/50 px-4 py-4 transition-all duration-150 hover:border-neutral-200 hover:-translate-y-0.5 cursor-pointer"
      style={{
        animationDelay: `${animationDelay}ms`,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = `${primaryColor}30`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "";
      }}
    >
      <span
        className="text-[15px] font-medium text-neutral-800 transition-colors duration-150 group-hover/sub:text-neutral-900"
        style={{}}
      >
        {subcategory.name}
      </span>
      {subcategory.productCount !== undefined && subcategory.productCount > 0 && (
        <span className="mt-1 text-sm text-neutral-400">
          {subcategory.productCount} {subcategory.productCount === 1 ? labels.productLabel : labels.productsLabel}
        </span>
      )}
    </LinkWithChannel>
  );
}

/** Brand pill/tag button. */
function BrandPill({
  brand,
  channel,
  primaryColor,
  onClose,
}: {
  brand: { id: string; name: string; slug: string };
  channel: string;
  primaryColor: string;
  onClose: () => void;
}) {
  return (
    <LinkWithChannel
      href={buildBrandUrl(brand.slug)}
      onClick={onClose}
      className="inline-flex rounded-full border border-neutral-200 bg-white px-3.5 py-2 text-sm font-medium text-neutral-600 transition-all duration-150 hover:text-neutral-900 cursor-pointer"
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = `${primaryColor}40`;
        e.currentTarget.style.color = primaryColor;
        e.currentTarget.style.backgroundColor = `${primaryColor}06`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "";
        e.currentTarget.style.color = "";
        e.currentTarget.style.backgroundColor = "";
      }}
    >
      {brand.name}
    </LinkWithChannel>
  );
}

/** Left navigation panel: categories + collections + brands. */
function MegaMenuLeftPanel({
  categories,
  collections,
  brands,
  activeCategoryId,
  primaryColor,
  channel,
  labels,
  onCategoryHover,
  onClose,
  isTouchDevice,
}: {
  categories: CategoryWithChildren[];
  collections?: Array<{ id: string; name: string; slug: string }>;
  brands?: Array<{ id: string; name: string; slug: string }>;
  activeCategoryId: string | null;
  primaryColor: string;
  channel: string;
  labels: {
    categories: string;
    collections: string;
    brands: string;
  };
  onCategoryHover: (id: string) => void;
  onClose: () => void;
  isTouchDevice: boolean;
}) {
  return (
    <div className="flex flex-col overflow-y-auto border-e border-neutral-200/60 bg-neutral-50/80" style={{ scrollbarWidth: "thin" }}>
      {/* Categories section */}
      {categories.length > 0 && (
        <div className="py-5">
          <h3
            className="mb-3 px-5 text-sm font-semibold uppercase tracking-wider text-neutral-600"
          >
            {labels.categories}
          </h3>
          <nav>
            <ul className="space-y-0.5">
              {categories.map((cat, i) => (
                <li key={cat.id} className="animate-fade-in-up" style={{ animationDelay: `${i * 30}ms` }}>
                  <CategoryNavItem
                    category={cat}
                    isActive={activeCategoryId === cat.id}
                    primaryColor={primaryColor}
                    channel={channel}
                    onHover={onCategoryHover}
                    onClose={onClose}
                    isTouchDevice={isTouchDevice}
                  />
                </li>
              ))}
            </ul>
          </nav>
        </div>
      )}

      {/* Collections section */}
      {collections && collections.length > 0 && (
        <div className="border-t border-neutral-200/60 py-4">
          <h3
            className="mb-2 px-5 text-sm font-semibold uppercase tracking-wider text-neutral-600"
          >
            {labels.collections}
          </h3>
          <ul className="space-y-0.5">
            {collections.map((col) => (
              <li key={col.id}>
                <LinkWithChannel
                  href={buildCollectionUrl(col.slug)}
                  onClick={onClose}
                  className="block truncate px-5 py-2.5 text-sm font-normal text-neutral-600 transition-all duration-150 hover:text-neutral-900 hover:ps-6 cursor-pointer"
                >
                  {col.name}
                </LinkWithChannel>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Brands section */}
      {brands && brands.length > 0 && (
        <div className="border-t border-neutral-200/60 py-4">
          <h3
            className="mb-3 px-5 text-sm font-semibold uppercase tracking-wider text-neutral-600"
          >
            {labels.brands}
          </h3>
          <div className="flex flex-wrap gap-2 px-5">
            {brands.map((brand) => (
              <BrandPill
                key={brand.id}
                brand={brand}
                channel={channel}
                primaryColor={primaryColor}
                onClose={onClose}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/** Center content area: dynamic subcategory grid or empty state.
 *  On screens below lg, shows the category image as a subtle background
 *  since the dedicated right image column is hidden. */
function MegaMenuCenterPanel({
  activeCategory,
  primaryColor,
  channel,
  labels,
  onClose,
}: {
  activeCategory: CategoryWithChildren | undefined;
  primaryColor: string;
  channel: string;
  labels: {
    explore: string;
    browseSubcategories: string;
    viewAllProducts: string;
    productLabel: string;
    productsLabel: string;
    hoverPrompt: string;
  };
  onClose: () => void;
}) {
  const subcategories = activeCategory?.children ?? [];
  const hasSubcategories = subcategories.length > 0;
  const bgImageUrl = activeCategory?.backgroundImage?.url;

  if (!activeCategory) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-neutral-400 text-sm">
        {labels.hoverPrompt}
      </div>
    );
  }

  return (
    <div className="relative flex flex-1 flex-col overflow-y-auto" style={{ scrollbarWidth: "thin" }}>
      {/* Background image — visible only below lg where the right panel is hidden */}
      {bgImageUrl && (
        <div className="absolute inset-0 lg:hidden" aria-hidden>
          <Image
            src={bgImageUrl}
            alt=""
            fill
            className="object-cover opacity-[0.07] transition-opacity duration-300"
            sizes="(max-width: 1024px) 100vw, 0px"
          />
        </div>
      )}

      <div className="relative z-10 flex flex-1 flex-col p-6 sm:p-8">
        {/* Category header */}
        <div className="mb-6" key={activeCategory.id}>
          <h2 className="mega-menu-crossfade text-xl font-semibold text-neutral-900">
            {activeCategory.name}
          </h2>
          {hasSubcategories && (
            <p className="mega-menu-crossfade mt-1 text-sm text-neutral-500" style={{ animationDelay: "40ms" }}>
              {labels.browseSubcategories}
            </p>
          )}
        </div>

        {hasSubcategories ? (
          /* Subcategory grid */
          <div
            className={`grid gap-3 ${subcategories.length > 6 ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-2"}`}
            key={`grid-${activeCategory.id}`}
          >
            {subcategories.map((sub, i) => (
              <SubcategoryCard
                key={sub.id}
                subcategory={sub}
                channel={channel}
                primaryColor={primaryColor}
                animationDelay={i * 40}
                labels={{ productLabel: labels.productLabel, productsLabel: labels.productsLabel }}
                onClose={onClose}
              />
            ))}
          </div>
        ) : (
          /* No subcategories: show description + CTA */
          <div className="mega-menu-crossfade flex flex-1 flex-col items-center justify-center text-center" key={`empty-${activeCategory.id}`}>
            {activeCategory.description && parseDescription(activeCategory.description) && (
              <p className="mb-4 max-w-sm text-sm text-neutral-500 line-clamp-3">
                {parseDescription(activeCategory.description)}
              </p>
            )}
            {activeCategory.productCount !== undefined && activeCategory.productCount > 0 && (
              <p className="mb-4 text-xs text-neutral-400">
                {activeCategory.productCount} {activeCategory.productCount === 1 ? labels.productLabel : labels.productsLabel}
              </p>
            )}
            <LinkWithChannel
              href={buildCategoryUrl(activeCategory.slug)}
              onClick={onClose}
              className="inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 cursor-pointer"
              style={{ backgroundColor: primaryColor }}
            >
              {labels.explore} {activeCategory.name}
              <ChevronRightIcon className="h-4 w-4 rtl:rotate-180" />
            </LinkWithChannel>
          </div>
        )}
      </div>
    </div>
  );
}

/** Right visual area: category hero image with gradient overlay. */
function MegaMenuRightPanel({
  activeCategory,
  previousImageUrl,
  primaryColor,
  channel,
  labels,
  onClose,
}: {
  activeCategory: CategoryWithChildren | undefined;
  previousImageUrl: string | null;
  primaryColor: string;
  channel: string;
  labels: { explore: string };
  onClose: () => void;
}) {
  const imageUrl = activeCategory?.backgroundImage?.url;
  const imageAlt = activeCategory?.backgroundImage?.alt || activeCategory?.name || "";
  const hasImage = !!imageUrl;

  return (
    <div className="relative h-full overflow-hidden bg-neutral-900">
      {/* Previous image (fading out) */}
      {previousImageUrl && (
        <Image
          src={previousImageUrl}
          alt=""
          fill
          className="object-cover transition-opacity duration-300 opacity-0"
          sizes="320px"
          aria-hidden
        />
      )}

      {/* Current image (fading in) */}
      {hasImage ? (
        <Image
          src={imageUrl}
          alt={imageAlt}
          fill
          className="object-cover transition-opacity duration-300 opacity-100"
          sizes="320px"
        />
      ) : (
        /* No-image fallback: dark gradient */
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, ${primaryColor}20 0%, #171717 40%, #262626 100%)`,
          }}
        />
      )}

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

      {/* Content overlay */}
      {activeCategory && (
        <div className="absolute inset-x-0 bottom-0 p-6" key={activeCategory.id}>
          <h3 className="mega-menu-crossfade text-2xl font-bold text-white line-clamp-2">
            {activeCategory.name}
          </h3>
          {activeCategory.description && parseDescription(activeCategory.description) && (
            <p className="mega-menu-crossfade mt-2 text-sm text-white/80 line-clamp-3" style={{ animationDelay: "60ms" }}>
              {parseDescription(activeCategory.description)}
            </p>
          )}
          <LinkWithChannel
            href={buildCategoryUrl(activeCategory.slug)}
            onClick={onClose}
            className="mega-menu-crossfade mt-4 inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/15 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition-all duration-200 hover:bg-white/25 cursor-pointer"
            style={{ animationDelay: "100ms" }}
          >
            {labels.explore} {activeCategory.name}
            <ChevronRightIcon className="h-4 w-4 rtl:rotate-180" />
          </LinkWithChannel>
        </div>
      )}
    </div>
  );
}

// ============================================
// MOBILE CATEGORY TREE (kept untouched)
// ============================================

/** Mobile: render category tree with accordion expand/collapse at every level. */
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
                href={buildCategoryUrl(item.slug)}
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

// ============================================
// MAIN EXPORT
// ============================================

export function ShopAllDropdown({ categories, collections, brands, channel }: ShopAllDropdownProps) {
  const inMobileMenu = useInMobileMenu();
  const [isOpen, setIsOpen] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState(false);
  const [mobileExpandedCategoryIds, setMobileExpandedCategoryIds] = useState<Set<string>>(new Set());
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [previousImageUrl, setPreviousImageUrl] = useState<string | null>(null);
  const [menuMaxHeight, setMenuMaxHeight] = useState("480px");
  const [menuTopOffset, setMenuTopOffset] = useState(64);
  const [portalEl, setPortalEl] = useState<HTMLElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuPanelRef = useRef<HTMLDivElement>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const categoryDebounceRef = useRef<NodeJS.Timeout | null>(null);
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
            : "";
  const arrowExpandedTransform = getArrowExpandedTransform(
    content.navbar?.dropdownArrowDirectionExpanded ?? "down",
  );

  // Detect RTL
  const [isRtl, setIsRtl] = useState(false);
  useEffect(() => {
    const checkRtl = () => setIsRtl(document.documentElement.dir === "rtl");
    checkRtl();
    const observer = new MutationObserver(checkRtl);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["dir"] });
    return () => observer.disconnect();
  }, []);

  const arrowCollapsedTransform = getArrowCollapsedTransform(
    dropdownArrowDir as "up" | "down" | "left" | "right" | "auto",
    isRtl,
  );

  // Find the portal target in the DOM (client-side only)
  useEffect(() => {
    const el = document.getElementById("mega-menu-root");
    if (el) setPortalEl(el);
  }, []);

  // Derived: find the active category object
  const activeCategory = categories.find((c) => c.id === activeCategoryId);

  // Config labels
  const labels = {
    categories: content.navbar?.categoriesLabel || "Categories",
    collections: content.navbar?.collectionsLabel || "Collections",
    brands: content.navbar?.brandsLabel || "Brands",
    viewAllProducts: content.navbar?.viewAllProducts || "View All Products",
    explore: content.navbar?.exploreCategoryLabel || "Explore",
    browseSubcategories: content.navbar?.browseSubcategoriesLabel || "Browse subcategories",
    productLabel: content.navbar?.megaMenuProductLabel || "product",
    productsLabel: content.navbar?.megaMenuProductsLabel || "products",
    hoverPrompt: content.navbar?.megaMenuHoverPrompt || "Hover a category to explore",
  };

  // Compute fixed position + max height for the mega menu.
  // Recalculates on scroll so the panel stays attached when the navbar hides / sticky filters appear.
  useEffect(() => {
    if (!isOpen) return;

    const recalcPosition = () => {
      const stickyFilters = document.querySelector<HTMLElement>("[data-sticky-quick-filters]");
      let top: number;

      if (stickyFilters) {
        top = stickyFilters.getBoundingClientRect().bottom;
      } else {
        const scrollHideEl = document.querySelector<HTMLElement>('[data-scroll-hide="header"]');
        if (scrollHideEl && scrollHideEl.getBoundingClientRect().height > 0) {
          top = scrollHideEl.getBoundingClientRect().bottom;
        } else {
          top = 0;
        }
      }

      setMenuTopOffset(top);
      const available = window.innerHeight - top - 32;
      setMenuMaxHeight(`${Math.max(300, Math.min(520, available))}px`);
    };

    // Calculate immediately + on every scroll frame
    recalcPosition();
    window.addEventListener("scroll", recalcPosition, { passive: true });
    return () => window.removeEventListener("scroll", recalcPosition);
  }, [isOpen]);

  // Auto-select first category on open
  useEffect(() => {
    if (isOpen && categories.length > 0) {
      setActiveCategoryId(categories[0].id);
      setPreviousImageUrl(null);
    }
    if (!isOpen) {
      setActiveCategoryId(null);
      setPreviousImageUrl(null);
      if (categoryDebounceRef.current) {
        clearTimeout(categoryDebounceRef.current);
        categoryDebounceRef.current = null;
      }
    }
  }, [isOpen, categories]);

  // Close on click/touch outside (checks both trigger and portal menu panel)
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      const target = (e as TouchEvent).touches?.[0]?.target ?? e.target;
      const inTrigger = containerRef.current?.contains(target as Node);
      const inMenu = menuPanelRef.current?.contains(target as Node);
      if (!inTrigger && !inMenu) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside, { passive: true });
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isOpen]);

  // Close on escape
  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen]);

  const handleMouseEnter = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setIsOpen(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    hoverTimeoutRef.current = setTimeout(() => setIsOpen(false), HOVER_LEAVE_DELAY_MS);
  }, []);

  const handleCategoryHover = useCallback(
    (id: string) => {
      if (categoryDebounceRef.current) {
        clearTimeout(categoryDebounceRef.current);
      }
      categoryDebounceRef.current = setTimeout(() => {
        setActiveCategoryId((prev) => {
          if (prev !== id) {
            // Track previous image for crossfade
            const prevCat = categories.find((c) => c.id === prev);
            setPreviousImageUrl(prevCat?.backgroundImage?.url ?? null);
            // Clear previous image after crossfade completes
            setTimeout(() => setPreviousImageUrl(null), 350);
          }
          return id;
        });
      }, CATEGORY_HOVER_DEBOUNCE_MS);
    },
    [categories],
  );

  const closeMenu = useCallback(() => setIsOpen(false), []);

  // Touch device detection: on touch, first tap opens menu; second tap navigates.
  // On pointer (desktop), hover opens and click always navigates.
  const isTouchDeviceRef = useRef(false);
  useEffect(() => {
    const onTouch = () => { isTouchDeviceRef.current = true; };
    window.addEventListener("touchstart", onTouch, { once: true, passive: true });
    return () => window.removeEventListener("touchstart", onTouch);
  }, []);

  const handleTriggerClick = useCallback(
    (e: React.MouseEvent) => {
      // On touch devices, first tap opens the menu instead of navigating
      if (isTouchDeviceRef.current && !isOpen) {
        e.preventDefault();
        setIsOpen(true);
        return;
      }
      // On desktop or if menu is already open, navigate (default link behavior)
      closeMenu();
    },
    [isOpen, closeMenu],
  );

  // ============================================
  // MOBILE MENU (accordion — kept untouched)
  // ============================================
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
                  {labels.categories}
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
                  {labels.collections}
                </h4>
                <ul className="space-y-0.5">
                  {collections.map((c) => (
                    <li key={c.id}>
                      <LinkWithChannel
                        href={buildCollectionUrl(c.slug)}
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
                  {labels.brands}
                </h4>
                <ul className="space-y-0.5">
                  {brands.map((b) => (
                    <li key={b.id}>
                      <LinkWithChannel
                        href={buildBrandUrl(b.slug)}
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
                <span>{labels.viewAllProducts}</span>
                <ChevronRightIcon className="h-4 w-4 ltr:rotate-180" />
              </LinkWithChannel>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ============================================
  // DESKTOP MEGA MENU (portal-based, attached to header)
  // ============================================
  return (
    <div
      ref={containerRef}
      className="relative flex items-stretch"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Trigger: click navigates to /products, hover opens mega menu.
           On touch devices, first tap opens menu; second tap (or link inside) navigates. */}
      <LinkWithChannel
        href="/products"
        onClick={handleTriggerClick}
        className="nav-link-btn group relative flex flex-1 items-center justify-center gap-1.5 rounded-full py-1.5 px-3.5 text-sm font-semibold transition-all duration-200"
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

      {/* Mega Menu Panel — rendered via portal into #mega-menu-root in Header,
           uses position:fixed so it stays visible when navbar hides or filters appear */}
      {isOpen && portalEl && createPortal(
        <div
          ref={menuPanelRef}
          className="fixed inset-x-0 z-[70] mx-auto max-w-[1200px] mega-menu-enter"
          style={{ top: `${menuTopOffset}px` }}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          role="menu"
          aria-label={shopAllText}
        >
          <div
            className="overflow-hidden rounded-xl bg-white border border-neutral-200/60"
            style={{
              maxHeight: menuMaxHeight,
              boxShadow: "0 16px 48px -8px rgba(0, 0, 0, 0.15), 0 4px 12px -2px rgba(0, 0, 0, 0.08)",
            }}
          >
            {/* Responsive 3-zone grid:
                md: 2-column (left nav + center, no right image)
                lg: 3-column with smaller dimensions
                xl: full 3-column layout */}
            <div
              className="grid grid-cols-[220px_1fr] lg:grid-cols-[240px_1fr_260px] xl:grid-cols-[280px_1fr_320px] h-80 lg:h-96 xl:h-[440px]"
              style={{ maxHeight: `calc(${menuMaxHeight} - 3.5rem)` }}
            >
              {/* Zone 1: Left Navigation */}
              <MegaMenuLeftPanel
                categories={categories}
                collections={collections}
                brands={brands}
                activeCategoryId={activeCategoryId}
                primaryColor={branding.colors.primary}
                channel={channel}
                labels={labels}
                onCategoryHover={handleCategoryHover}
                onClose={closeMenu}
                isTouchDevice={isTouchDeviceRef.current}
              />

              {/* Zone 2: Center Content */}
              <MegaMenuCenterPanel
                activeCategory={activeCategory}
                primaryColor={branding.colors.primary}
                channel={channel}
                labels={labels}
                onClose={closeMenu}
              />

              {/* Zone 3: Right Image (hidden below lg) */}
              <div className="hidden lg:block">
                <MegaMenuRightPanel
                  activeCategory={activeCategory}
                  previousImageUrl={previousImageUrl}
                  primaryColor={branding.colors.primary}
                  channel={channel}
                  labels={labels}
                  onClose={closeMenu}
                />
              </div>
            </div>

            {/* Footer: View All Products */}
            <div className="border-t border-neutral-100 bg-neutral-50/50 px-6 py-3">
              <LinkWithChannel
                href="/products"
                onClick={closeMenu}
                className="flex items-center justify-center gap-2 text-sm font-semibold transition-all duration-200 hover:opacity-80 cursor-pointer"
                style={{ color: branding.colors.primary }}
              >
                <span>{labels.viewAllProducts}</span>
                <ChevronRightIcon className="h-4 w-4 rtl:rotate-180" />
              </LinkWithChannel>
            </div>
          </div>
        </div>,
        portalEl,
      )}
    </div>
  );
}
