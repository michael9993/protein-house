import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import {
  Type,
  ToggleLeft,
  Palette,
  Hash,
  List,
  Zap,
  ChevronRight,
  Search,
  LayoutDashboard,
  ShoppingCart,
  CreditCard,
  UserCircle,
  FileText,
  Globe,
  Home,
  Package,
  PackageSearch,
  PanelTop,
  KeyRound,
  Settings,
} from "lucide-react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { getSearchIndex, type SearchEntry } from "@/lib/search";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  channelSlug: string;
}

/** Icon component based on field type */
function FieldTypeIcon({ type }: { type: SearchEntry["fieldType"] }) {
  const iconClass = "h-4 w-4 shrink-0 text-muted-foreground";

  switch (type) {
    case "boolean":
      return <ToggleLeft className={iconClass} />;
    case "color":
      return <Palette className={iconClass} />;
    case "number":
      return <Hash className={iconClass} />;
    case "enum":
      return <List className={iconClass} />;
    case "action":
      return <Zap className={iconClass} />;
    case "array":
      return <List className={iconClass} />;
    default:
      return <Type className={iconClass} />;
  }
}

/** Page icon based on page route */
function PageIcon({ page }: { page: string }) {
  const iconClass = "h-4 w-4 shrink-0";
  switch (page) {
    case "global": return <Globe className={iconClass} />;
    case "homepage": return <Home className={iconClass} />;
    case "product-listing": return <PackageSearch className={iconClass} />;
    case "product-detail": return <Package className={iconClass} />;
    case "cart": return <ShoppingCart className={iconClass} />;
    case "checkout": return <CreditCard className={iconClass} />;
    case "account": return <UserCircle className={iconClass} />;
    case "auth-pages": return <KeyRound className={iconClass} />;
    case "layout-config": return <PanelTop className={iconClass} />;
    case "static-pages": return <FileText className={iconClass} />;
    default: return <Settings className={iconClass} />;
  }
}

/** Builds a navigation URL for a search entry */
function buildEntryUrl(
  channelSlug: string,
  entry: SearchEntry,
): string {
  // Actions navigate to dashboard
  if (entry.page === "index") {
    return `/${channelSlug}`;
  }

  let url = `/${channelSlug}/${entry.page}`;

  const params = new URLSearchParams();
  if (entry.tab) params.set("tab", entry.tab);
  if (entry.formFieldName && entry.fieldType !== "action") params.set("highlight", entry.formFieldName);

  const qs = params.toString();
  if (qs) url += `?${qs}`;
  if (entry.sectionId) url += `#${entry.sectionId}`;

  return url;
}

/** Page navigation entries — top-level destinations */
const PAGE_ENTRIES: SearchEntry[] = [
  { fieldPath: "__page__global", label: "Global Settings", description: "Store identity, branding, colors, fonts, localization, SEO, integrations", fieldType: "action", page: "global", tab: "identity", sectionId: "", formFieldName: "", category: "Pages", keywords: ["store", "branding", "colors", "fonts", "seo", "integrations", "settings", "global", "identity"] },
  { fieldPath: "__page__homepage", label: "Homepage", description: "Hero, sections, marquee, trust strip, categories, trending, flash deals", fieldType: "action", page: "homepage", tab: "sections", sectionId: "", formFieldName: "", category: "Pages", keywords: ["homepage", "hero", "banner", "sections", "marquee", "categories", "trending"] },
  { fieldPath: "__page__layout", label: "Layout — Header & Footer", description: "Header banner, footer links, navigation text, copyright", fieldType: "action", page: "layout-config", tab: "header", sectionId: "", formFieldName: "", category: "Pages", keywords: ["layout", "header", "footer", "navigation", "navbar", "banner", "copyright", "menu"] },
  { fieldPath: "__page__plp", label: "Product Listing", description: "Filters, quick filters, sorting, product grid, search text", fieldType: "action", page: "product-listing", tab: "listing", sectionId: "", formFieldName: "", category: "Pages", keywords: ["products", "listing", "filters", "search", "catalog", "collection", "category", "grid"] },
  { fieldPath: "__page__pdp", label: "Product Detail", description: "Product page features, related products, reviews, PDP text", fieldType: "action", page: "product-detail", tab: "detail", sectionId: "", formFieldName: "", category: "Pages", keywords: ["product", "detail", "pdp", "reviews", "related", "wishlist", "share", "stock"] },
  { fieldPath: "__page__cart", label: "Cart & Shipping", description: "Cart text, shipping rules, promo popup, free shipping", fieldType: "action", page: "cart", tab: "shipping", sectionId: "", formFieldName: "", category: "Pages", keywords: ["cart", "shipping", "promo", "popup", "free shipping", "discount", "ecommerce"] },
  { fieldPath: "__page__checkout", label: "Checkout", description: "Checkout UI, accordion, progress bar, payment, confirmation text", fieldType: "action", page: "checkout", tab: "ui", sectionId: "", formFieldName: "", category: "Pages", keywords: ["checkout", "payment", "order", "confirmation", "accordion", "guest"] },
  { fieldPath: "__page__account", label: "Account & Orders", description: "Account dashboard, orders, addresses, wishlist, settings text", fieldType: "action", page: "account", tab: "features", sectionId: "", formFieldName: "", category: "Pages", keywords: ["account", "orders", "addresses", "wishlist", "settings", "dashboard", "profile"] },
  { fieldPath: "__page__auth", label: "Auth — Sign In / Sign Up", description: "Login, registration, forgot password, social login text", fieldType: "action", page: "auth-pages", tab: "", sectionId: "", formFieldName: "", category: "Pages", keywords: ["auth", "login", "sign in", "sign up", "register", "password", "forgot", "social"] },
  { fieldPath: "__page__static", label: "Static Pages", description: "Contact, FAQ, about us, legal pages, error pages", fieldType: "action", page: "static-pages", tab: "toggles", sectionId: "", formFieldName: "", category: "Pages", keywords: ["static", "contact", "faq", "about", "privacy", "terms", "return", "shipping", "error", "404"] },
  // Quick filter card styling
  { fieldPath: "quickFilters.style.cardBackgroundColor", label: "Quick Filter Card Background", description: "Card background when no product image", fieldType: "color", page: "product-listing", tab: "listing", sectionId: "quick-filter-styling", formFieldName: "quickFilters.style.cardBackgroundColor", category: "Product Listing", keywords: ["quick filter", "card", "background", "color"] },
  { fieldPath: "quickFilters.style.cardBorderColor", label: "Quick Filter Card Border", description: "Default border color for filter cards", fieldType: "color", page: "product-listing", tab: "listing", sectionId: "quick-filter-styling", formFieldName: "quickFilters.style.cardBorderColor", category: "Product Listing", keywords: ["quick filter", "card", "border", "color"] },
  { fieldPath: "quickFilters.style.cardActiveBorderColor", label: "Quick Filter Active Border", description: "Border color for active/selected filter cards", fieldType: "color", page: "product-listing", tab: "listing", sectionId: "quick-filter-styling", formFieldName: "quickFilters.style.cardActiveBorderColor", category: "Product Listing", keywords: ["quick filter", "active", "border", "selected"] },
  { fieldPath: "quickFilters.style.cardActiveBgColor", label: "Quick Filter Active Background", description: "Background for active state", fieldType: "color", page: "product-listing", tab: "listing", sectionId: "quick-filter-styling", formFieldName: "quickFilters.style.cardActiveBgColor", category: "Product Listing", keywords: ["quick filter", "active", "background"] },
  { fieldPath: "quickFilters.style.arrowBackgroundColor", label: "Quick Filter Arrow Background", description: "Scroll arrow background color", fieldType: "color", page: "product-listing", tab: "listing", sectionId: "quick-filter-styling", formFieldName: "quickFilters.style.arrowBackgroundColor", category: "Product Listing", keywords: ["quick filter", "arrow", "scroll", "background"] },
  { fieldPath: "quickFilters.style.sectionTitleColor", label: "Quick Filter Section Title", description: "Section heading color", fieldType: "color", page: "product-listing", tab: "listing", sectionId: "quick-filter-styling", formFieldName: "quickFilters.style.sectionTitleColor", category: "Product Listing", keywords: ["quick filter", "title", "heading", "section"] },
  // Checkbox styling
  { fieldPath: "ui.checkbox.checkedBackgroundColor", label: "Checkbox Checked Color", description: "Global checkbox checked state background", fieldType: "color", page: "product-listing", tab: "listing", sectionId: "filter-sidebar-styling", formFieldName: "ui.checkbox.checkedBackgroundColor", category: "Product Listing", keywords: ["checkbox", "checked", "color", "global"] },
  { fieldPath: "ui.checkbox.borderRadius", label: "Checkbox Border Radius", description: "Corner rounding for all checkboxes", fieldType: "enum", page: "product-listing", tab: "listing", sectionId: "filter-sidebar-styling", formFieldName: "ui.checkbox.borderRadius", category: "Product Listing", keywords: ["checkbox", "border", "radius", "rounding"] },
  // Component Designer — newly registered components
  { fieldPath: "__page__component-designer", label: "Recently Viewed Products", description: "Style overrides for recently viewed products section on PDP", fieldType: "action", page: "component-designer", tab: "", sectionId: "", formFieldName: "", category: "Component Designer", keywords: ["recently viewed", "products", "pdp", "history", "component"] },
  { fieldPath: "__page__component-designer", label: "Breadcrumbs", description: "Style overrides for breadcrumb navigation", fieldType: "action", page: "component-designer", tab: "", sectionId: "", formFieldName: "", category: "Component Designer", keywords: ["breadcrumbs", "navigation", "trail", "component"] },
  { fieldPath: "__page__component-designer", label: "Cookie Consent Banner", description: "Style overrides for GDPR cookie consent popup", fieldType: "action", page: "component-designer", tab: "", sectionId: "", formFieldName: "", category: "Component Designer", keywords: ["cookie", "consent", "gdpr", "privacy", "banner", "component"] },
  { fieldPath: "__page__component-designer", label: "Promo Popup", description: "Style overrides for promotional popup modal", fieldType: "action", page: "component-designer", tab: "", sectionId: "", formFieldName: "", category: "Component Designer", keywords: ["promo", "popup", "modal", "promotion", "sale", "component"] },
  { fieldPath: "__page__component-designer", label: "Wishlist Drawer", description: "Style overrides for wishlist side drawer", fieldType: "action", page: "component-designer", tab: "", sectionId: "", formFieldName: "", category: "Component Designer", keywords: ["wishlist", "drawer", "favorites", "component"] },
  { fieldPath: "__page__component-designer", label: "Recently Viewed Drawer", description: "Style overrides for recently viewed side drawer", fieldType: "action", page: "component-designer", tab: "", sectionId: "", formFieldName: "", category: "Component Designer", keywords: ["recently viewed", "drawer", "history", "component"] },
];

/** Category display order — matches actual location rule categories */
const CATEGORY_ORDER = [
  "Pages",
  "Actions",
  "Global",
  "Homepage",
  "Layout",
  "Product Listing",
  "Product Detail",
  "Cart",
  "Checkout",
  "Account",
  "Auth Pages",
  "Static Pages",
];

/** Limit results per category to keep the list manageable */
const MAX_RESULTS_PER_CATEGORY = 8;

export function CommandPalette({
  open,
  onOpenChange,
  channelSlug,
}: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  // Reset query when closing
  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  // Full search index
  const searchIndex = useMemo(() => (open ? getSearchIndex() : []), [open]);

  // Combine pages + field index
  const allEntries = useMemo(() => {
    return [...PAGE_ENTRIES, ...searchIndex];
  }, [searchIndex]);

  // Group and limit
  const grouped = useMemo(() => {
    const groups: Record<string, SearchEntry[]> = {};
    for (const entry of allEntries) {
      if (!groups[entry.category]) {
        groups[entry.category] = [];
      }
      groups[entry.category].push(entry);
    }

    // Sort by category order
    const sorted: Record<string, SearchEntry[]> = {};
    for (const cat of CATEGORY_ORDER) {
      if (groups[cat]) sorted[cat] = groups[cat];
    }
    // Append remaining
    for (const [cat, entries] of Object.entries(groups)) {
      if (!sorted[cat]) sorted[cat] = entries;
    }
    return sorted;
  }, [allEntries]);

  // Whether we're searching or browsing
  const isSearching = query.length > 0;

  const handleSelect = useCallback(
    (entry: SearchEntry) => {
      onOpenChange(false);
      router.push(buildEntryUrl(channelSlug, entry));
    },
    [channelSlug, onOpenChange, router],
  );

  // Cmd+K / Ctrl+K keyboard shortcut
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        onOpenChange(!open);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange]);

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Search settings, pages, or type a keyword..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList className="max-h-[460px]">
        <CommandEmpty>
          <div className="py-6 text-center">
            <Search className="mx-auto h-8 w-8 text-muted-foreground/40" />
            <p className="mt-3 text-sm text-muted-foreground">No results found for &ldquo;{query}&rdquo;</p>
            <p className="mt-1 text-xs text-muted-foreground/70">
              Try searching for page names, field labels, or default values
            </p>
          </div>
        </CommandEmpty>

        {/* When not searching, show pages first as a quick-nav */}
        {!isSearching && (
          <>
            <CommandGroup heading="Quick Navigation">
              {PAGE_ENTRIES.map((entry) => (
                <CommandItem
                  key={entry.fieldPath}
                  value={buildSearchValue(entry)}
                  onSelect={() => handleSelect(entry)}
                  className="flex items-start gap-3 py-2.5"
                >
                  <PageIcon page={entry.page} />
                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-sm">{entry.label}</span>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {entry.description}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/40 self-center" />
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Actions">
              {searchIndex
                .filter((e) => e.category === "Actions")
                .map((entry) => (
                  <CommandItem
                    key={entry.fieldPath}
                    value={buildSearchValue(entry)}
                    onSelect={() => handleSelect(entry)}
                    className="flex items-start gap-3 py-2"
                  >
                    <FieldTypeIcon type={entry.fieldType} />
                    <span className="font-medium text-sm">{entry.label}</span>
                    <span className="text-xs text-muted-foreground ms-auto">{entry.description}</span>
                  </CommandItem>
                ))}
            </CommandGroup>
          </>
        )}

        {/* When searching, show all results grouped by category with limits */}
        {isSearching &&
          Object.entries(grouped)
            .filter(([cat]) => cat !== "Actions" || isSearching) // Show actions in search
            .map(([category, entries], groupIdx) => {
              // In search mode, cmdk filters automatically — but we cap per group visually
              const displayEntries = entries;
              return (
                <div key={category}>
                  {groupIdx > 0 && <CommandSeparator />}
                  <CommandGroup heading={category}>
                    {displayEntries.map((entry) => (
                      <CommandItem
                        key={entry.fieldPath}
                        value={buildSearchValue(entry)}
                        onSelect={() => handleSelect(entry)}
                        className="flex items-start gap-3 py-2"
                      >
                        {entry.fieldPath.startsWith("__page__") ? (
                          <PageIcon page={entry.page} />
                        ) : (
                          <FieldTypeIcon type={entry.fieldType} />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-medium text-sm truncate">
                              {entry.label}
                            </span>
                            {entry.fieldType === "boolean" && (
                              <span className="shrink-0 rounded bg-muted px-1 py-0.5 text-[10px] text-muted-foreground">
                                Toggle
                              </span>
                            )}
                            {entry.fieldType === "color" && (
                              <span className="shrink-0 rounded bg-muted px-1 py-0.5 text-[10px] text-muted-foreground">
                                Color
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                            <span className="truncate">{entry.description}</span>
                            {entry.defaultValue && (
                              <>
                                <ChevronRight className="h-3 w-3 shrink-0 opacity-50" />
                                <span className="truncate italic opacity-70">
                                  &ldquo;{entry.defaultValue}&rdquo;
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </div>
              );
            })}
      </CommandList>

      <div className="border-t px-3 py-2 text-xs text-muted-foreground flex items-center justify-between">
        <span>{searchIndex.length} settings · {PAGE_ENTRIES.length} pages</span>
        <span className="flex items-center gap-1">
          <kbd className="rounded border bg-muted px-1 py-0.5 text-[10px]">
            &uarr;&darr;
          </kbd>
          <span>navigate</span>
          <kbd className="rounded border bg-muted px-1 py-0.5 text-[10px] ms-1">
            &crarr;
          </kbd>
          <span>open</span>
          <kbd className="rounded border bg-muted px-1 py-0.5 text-[10px] ms-1">
            esc
          </kbd>
          <span>close</span>
        </span>
      </div>
    </CommandDialog>
  );
}

/**
 * Builds the cmdk search value string.
 * cmdk uses this for its built-in fuzzy matching.
 */
function buildSearchValue(entry: SearchEntry): string {
  const parts = [
    entry.label,
    entry.description,
    entry.defaultValue ?? "",
    ...entry.keywords,
  ];
  return parts.join(" ");
}
