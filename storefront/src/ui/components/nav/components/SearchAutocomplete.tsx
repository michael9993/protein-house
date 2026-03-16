"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { SearchIcon, ClockIcon, FolderIcon, TagIcon } from "lucide-react";
import { LinkWithChannel } from "@/ui/atoms/LinkWithChannel";
import { useContentConfig, useBranding } from "@/providers/StoreConfigProvider";
import { buildProductUrl, buildProductsUrl, buildCategoryUrl, buildCollectionUrl, withChannel } from "@/lib/urls";
import { formatMoneyRange } from "@/lib/utils";

interface SearchAutocompleteProps {
  query: string;
  channel: string;
  isOpen: boolean;
  onClose: () => void;
  onSelect: (query: string) => void;
}

interface SearchSuggestion {
  type: "product" | "category" | "collection" | "recent";
  id: string;
  title: string;
  subtitle?: string;
  image?: string;
  href: string;
}

interface SearchApiResponse {
  products?: Array<{
    id: string;
    name: string;
    slug: string;
    thumbnail?: { url: string };
    pricing?: {
      priceRange?: {
        start?: { gross: { amount: number; currency: string } };
        stop?: { gross: { amount: number; currency: string } };
      };
    };
  }>;
  categories?: Array<{ name: string; slug: string; score: number }>;
  collections?: Array<{ name: string; slug: string; score: number }>;
  didYouMean?: string | null;
}

const RECENT_SEARCHES_KEY = "storefront_recent_searches";
const MAX_RECENT_SEARCHES = 5;

export function SearchAutocomplete({
  query,
  channel,
  isOpen,
  onClose,
  onSelect
}: SearchAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [didYouMean, setDidYouMean] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const content = useContentConfig();
  const branding = useBranding();

  // Get recent searches from localStorage
  const getRecentSearches = useCallback((): string[] => {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      return (stored ? JSON.parse(stored) : []) as string[];
    } catch {
      return [];
    }
  }, []);

  // Save search to recent searches
  const saveRecentSearch = useCallback((searchQuery: string) => {
    if (typeof window === "undefined" || !searchQuery.trim()) return;
    try {
      const recent = getRecentSearches();
      const filtered = recent.filter((s) => s.toLowerCase() !== searchQuery.toLowerCase());
      const updated = [searchQuery, ...filtered].slice(0, MAX_RECENT_SEARCHES);
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    } catch {
      // Ignore localStorage errors
    }
  }, [getRecentSearches]);

  // Fetch search suggestions
  useEffect(() => {
    if (!isOpen || !query.trim() || query.length < 2) {
      setSuggestions([]);
      setDidYouMean(null);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    const fetchSuggestions = async () => {
      try {
        const response = await fetch(`/api/search-suggestions?query=${encodeURIComponent(query)}&channel=${encodeURIComponent(channel)}&limit=5`);

        if (!response.ok) {
          throw new Error("Failed to fetch suggestions");
        }

        const data = (await response.json()) as SearchApiResponse;

        if (cancelled) return;

        setDidYouMean(data.didYouMean ?? null);

        const allSuggestions: SearchSuggestion[] = [];

        // Add category matches first (they're high-signal navigational suggestions)
        for (const cat of data.categories || []) {
          allSuggestions.push({
            type: "category",
            id: `cat-${cat.slug}`,
            title: cat.name,
            href: buildCategoryUrl(cat.slug),
          });
        }

        // Add collection matches
        for (const col of data.collections || []) {
          allSuggestions.push({
            type: "collection",
            id: `col-${col.slug}`,
            title: col.name,
            href: buildCollectionUrl(col.slug),
          });
        }

        // Add product matches
        for (const product of data.products || []) {
          let subtitle: string | undefined;
          if (product.pricing?.priceRange?.start?.gross && product.pricing?.priceRange?.stop?.gross) {
            try {
              subtitle = formatMoneyRange({
                start: product.pricing.priceRange.start.gross,
                stop: product.pricing.priceRange.stop.gross,
              }) ?? undefined;
            } catch {
              // Skip subtitle if currency is missing
            }
          }

          allSuggestions.push({
            type: "product",
            id: product.id,
            title: product.name,
            subtitle,
            image: product.thumbnail?.url,
            href: buildProductUrl(product.slug),
          });
        }

        setSuggestions(allSuggestions);
      } catch (error) {
        console.error("Failed to fetch search suggestions:", error);
        if (!cancelled) {
          setSuggestions([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    const debounceTimer = setTimeout(fetchSuggestions, 300);
    return () => {
      cancelled = true;
      clearTimeout(debounceTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- content.navbar is stable config, not a reactive dep
  }, [query, channel, isOpen]);

  // Show recent searches when query is empty
  useEffect(() => {
    if (isOpen && !query.trim()) {
      const recent = getRecentSearches();
      const recentSuggestions: SearchSuggestion[] = recent.map((search) => ({
        type: "recent" as const,
        id: `recent-${search}`,
        title: search,
        href: buildProductsUrl({ search }),
      }));
      setSuggestions(recentSuggestions);
    }
  }, [isOpen, query, getRecentSearches]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
      } else if (e.key === "Enter" && selectedIndex >= 0) {
        e.preventDefault();
        const suggestion = suggestions[selectedIndex];
        if (suggestion) {
          handleSelect(suggestion);
        }
      } else if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, suggestions, selectedIndex, onClose]);

  // Reset selected index when suggestions change
  useEffect(() => {
    setSelectedIndex(-1);
  }, [suggestions]);

  // Click outside to close
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  const handleSelect = (suggestion: SearchSuggestion) => {
    if (suggestion.type === "recent" || suggestion.type === "product") {
      saveRecentSearch(query);
    }
    const fullHref = withChannel(channel, suggestion.href);
    onSelect(fullHref);
    router.push(fullHref);
    onClose();
  };

  const clearRecentSearches = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(RECENT_SEARCHES_KEY);
      setSuggestions([]);
    }
  };

  if (!isOpen) return null;

  const hasSuggestions = suggestions.length > 0;
  const showRecentSearches = !query.trim() && hasSuggestions;

  // Group suggestions by type for rendering
  const categorySuggestions = suggestions.filter((s) => s.type === "category" || s.type === "collection");
  const productSuggestions = suggestions.filter((s) => s.type === "product");
  const recentSuggestions = suggestions.filter((s) => s.type === "recent");

  // Flat list for keyboard navigation index mapping
  const flatSuggestions = [...categorySuggestions, ...productSuggestions, ...recentSuggestions];

  return (
    <div
      ref={containerRef}
      className="absolute top-full z-50 mt-2 w-full rounded-xl bg-white shadow-xl ring-1 ring-black/5"
      style={{ maxHeight: "400px", overflowY: "auto" }}
    >
      {isLoading && (
        <div className="flex items-center justify-center p-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-600" />
        </div>
      )}

      {!isLoading && !hasSuggestions && query.trim().length >= 2 && (
        <div className="p-8 text-center text-sm text-neutral-500">
          {(content.filters?.noResultsMessage ?? "No products found").replace(/\{query\}/gi, query.trim())}
        </div>
      )}

      {/* "Did you mean?" suggestion */}
      {!isLoading && didYouMean && query.trim().length >= 2 && (
        <div className="border-b border-neutral-100 px-4 py-2.5">
          <button
            onClick={() => {
              const searchUrl = withChannel(channel, buildProductsUrl({ search: didYouMean }));
              saveRecentSearch(didYouMean);
              onSelect(searchUrl);
              router.push(searchUrl);
              onClose();
            }}
            className="text-sm text-neutral-600 hover:text-neutral-900"
          >
            Did you mean{" "}
            <span className="font-semibold" style={{ color: branding.colors.primary }}>
              {didYouMean}
            </span>
            ?
          </button>
        </div>
      )}

      {!isLoading && hasSuggestions && (
        <div className="py-2">
          {/* Recent searches header */}
          {showRecentSearches && (
            <div className="mb-2 flex items-center justify-between border-b border-neutral-100 px-4 py-2">
              <div className="flex items-center gap-2 text-xs font-medium text-neutral-500">
                <ClockIcon className="h-4 w-4" />
                {content.navbar?.recentlySearchedLabel ?? "Recent Searches"}
              </div>
              <button
                onClick={clearRecentSearches}
                className="text-xs text-neutral-400 hover:text-neutral-600"
              >
                {content.navbar?.recentSearchesClearLabel ?? "Clear"}
              </button>
            </div>
          )}

          {/* Category & Collection suggestions */}
          {categorySuggestions.length > 0 && (
            <div>
              <div className="px-4 pb-1 pt-2 text-xs font-medium uppercase tracking-wider text-neutral-400">
                {content.navbar?.categoriesLabel ?? "Categories"}
              </div>
              <ul>
                {categorySuggestions.map((suggestion) => {
                  const flatIndex = flatSuggestions.indexOf(suggestion);
                  return (
                    <li key={suggestion.id}>
                      <button
                        onClick={() => handleSelect(suggestion)}
                        className={`w-full px-4 py-2.5 text-left transition-colors ${
                          flatIndex === selectedIndex ? "bg-neutral-50" : "hover:bg-neutral-50"
                        }`}
                        style={flatIndex === selectedIndex ? { backgroundColor: `${branding.colors.primary}10` } : undefined}
                      >
                        <div className="flex items-center gap-3">
                          {suggestion.type === "category" ? (
                            <FolderIcon className="h-4 w-4 flex-shrink-0 text-neutral-400" />
                          ) : (
                            <TagIcon className="h-4 w-4 flex-shrink-0 text-neutral-400" />
                          )}
                          <div className="min-w-0 flex-1">
                            <span className="text-sm font-medium text-neutral-900">{suggestion.title}</span>
                            <span className="ms-2 text-xs text-neutral-400">
                              {suggestion.type === "category"
                                ? (content.navbar?.categoriesLabel ?? "Category")
                                : (content.navbar?.collectionsLabel ?? "Collection")}
                            </span>
                          </div>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* Product suggestions */}
          {productSuggestions.length > 0 && (
            <div>
              {categorySuggestions.length > 0 && (
                <div className="px-4 pb-1 pt-2 text-xs font-medium uppercase tracking-wider text-neutral-400">
                  {"Products"}
                </div>
              )}
              <ul className="divide-y divide-neutral-100">
                {productSuggestions.map((suggestion) => {
                  const flatIndex = flatSuggestions.indexOf(suggestion);
                  return (
                    <li key={suggestion.id}>
                      <button
                        onClick={() => handleSelect(suggestion)}
                        className={`w-full px-4 py-3 text-left transition-colors ${
                          flatIndex === selectedIndex ? "bg-neutral-50" : "hover:bg-neutral-50"
                        }`}
                        style={flatIndex === selectedIndex ? { backgroundColor: `${branding.colors.primary}10` } : undefined}
                      >
                        <div className="flex items-center gap-3">
                          {suggestion.image && (
                            <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-md bg-neutral-100">
                              <Image
                                src={suggestion.image}
                                alt={suggestion.title}
                                fill
                                className="object-cover"
                                sizes="48px"
                              />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-medium text-neutral-900">{suggestion.title}</div>
                            {suggestion.subtitle && (
                              <div className="mt-0.5 text-xs text-neutral-500">{suggestion.subtitle}</div>
                            )}
                          </div>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* Recent searches */}
          {recentSuggestions.length > 0 && (
            <ul className="divide-y divide-neutral-100">
              {recentSuggestions.map((suggestion) => {
                const flatIndex = flatSuggestions.indexOf(suggestion);
                return (
                  <li key={suggestion.id}>
                    <button
                      onClick={() => handleSelect(suggestion)}
                      className={`w-full px-4 py-3 text-left transition-colors ${
                        flatIndex === selectedIndex ? "bg-neutral-50" : "hover:bg-neutral-50"
                      }`}
                      style={flatIndex === selectedIndex ? { backgroundColor: `${branding.colors.primary}10` } : undefined}
                    >
                      <div className="flex items-center gap-3">
                        <ClockIcon className="h-5 w-5 flex-shrink-0 text-neutral-400" />
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium text-neutral-900">{suggestion.title}</div>
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          {query.trim().length >= 2 && (
            <div className="border-t border-neutral-100 px-4 py-3">
              <LinkWithChannel
                href={buildProductsUrl({ search: query })}
                onClick={() => {
                  saveRecentSearch(query);
                  onClose();
                }}
                className="flex items-center justify-center gap-2 text-sm font-medium transition-colors"
                style={{ color: branding.colors.primary }}
              >
                <span>{content.navbar?.viewAllResultsFor ?? "View all results for"} &quot;{query}&quot;</span>
                <SearchIcon className="h-4 w-4" />
              </LinkWithChannel>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
