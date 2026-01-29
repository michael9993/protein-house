"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { SearchIcon, XIcon, ClockIcon } from "lucide-react";
import { LinkWithChannel } from "@/ui/atoms/LinkWithChannel";
import { useContentConfig, useBranding } from "@/providers/StoreConfigProvider";
import { formatMoneyRange } from "@/lib/utils";
import { type ProductListItemFragment } from "@/gql/graphql";

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
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const content = useContentConfig();
  const branding = useBranding();

  // Get recent searches from localStorage
  const getRecentSearches = useCallback((): string[] => {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      return stored ? JSON.parse(stored) : [];
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
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    const fetchSuggestions = async () => {
      try {
        // Use API route for client-side search
        const response = await fetch(`/api/search-suggestions?query=${encodeURIComponent(query)}&channel=${encodeURIComponent(channel)}&limit=5`);
        
        if (!response.ok) {
          throw new Error("Failed to fetch suggestions");
        }

        const data = await response.json();

        if (cancelled) return;

        const productSuggestions: SearchSuggestion[] = (data.products || []).map((product: any) => {
          // Safely format price range - handle missing currency
          // Pricing structure: pricing.priceRange.start.gross and pricing.priceRange.stop.gross
          let subtitle: string | undefined;
          if (product.pricing?.priceRange?.start?.gross && product.pricing?.priceRange?.stop?.gross) {
            try {
              subtitle = formatMoneyRange({
                start: product.pricing.priceRange.start.gross,
                stop: product.pricing.priceRange.stop.gross,
              });
            } catch (error) {
              // If currency is missing, skip subtitle
              console.warn("Failed to format price range:", error);
            }
          }

          return {
            type: "product" as const,
            id: product.id,
            title: product.name,
            subtitle,
            image: product.thumbnail?.url,
            href: `/products/${product.slug}`, // LinkWithChannel will add channel automatically
          };
        });

        setSuggestions(productSuggestions);
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
  }, [query, channel, isOpen]);

  // Show recent searches when query is empty
  useEffect(() => {
    if (isOpen && !query.trim()) {
      const recent = getRecentSearches();
      const recentSuggestions: SearchSuggestion[] = recent.map((search) => ({
        type: "recent" as const,
        id: `recent-${search}`,
        title: search,
        href: `/products?search=${encodeURIComponent(search)}`, // products page with search filter
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
    // Include channel in the URL for router.push
    const hrefWithChannel = `/${encodeURIComponent(channel)}${suggestion.href}`;
    onSelect(hrefWithChannel);
    router.push(hrefWithChannel);
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

      {!isLoading && hasSuggestions && (
        <div className="py-2">
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

          <ul className="divide-y divide-neutral-100">
            {suggestions.map((suggestion, index) => (
              <li key={suggestion.id}>
                <button
                  onClick={() => handleSelect(suggestion)}
                  className={`w-full px-4 py-3 text-left transition-colors ${
                    index === selectedIndex
                      ? "bg-neutral-50"
                      : "hover:bg-neutral-50"
                  }`}
                  style={
                    index === selectedIndex
                      ? { backgroundColor: `${branding.colors.primary}10` }
                      : undefined
                  }
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
                    {suggestion.type === "recent" && !suggestion.image && (
                      <ClockIcon className="h-5 w-5 flex-shrink-0 text-neutral-400" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-neutral-900">
                        {suggestion.title}
                      </div>
                      {suggestion.subtitle && (
                        <div className="mt-0.5 text-xs text-neutral-500">
                          {suggestion.subtitle}
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>

          {query.trim().length >= 2 && (
            <div className="border-t border-neutral-100 px-4 py-3">
              <LinkWithChannel
                href={`/products?search=${encodeURIComponent(query)}`}
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
