"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { useRouter, useParams } from "next/navigation";
import { useStoreConfig, useFiltersText, useNavbarText, useComponentStyle, useComponentClasses } from "@/providers/StoreConfigProvider";
import { buildComponentStyle } from "@/config";
import { buildProductUrl, buildSearchUrl, withChannel } from "@/lib/urls";

interface SearchResult {
  id: string;
  name: string;
  slug: string;
  thumbnail?: string;
  category?: string;
  price?: string;
}

interface SearchDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchDialog({ isOpen, onClose }: SearchDialogProps) {
  const { branding } = useStoreConfig();
  const filtersText = useFiltersText();
  const navbarText = useNavbarText();
  const cdStyle = useComponentStyle("layout.searchDialog");
  const cdClasses = useComponentClasses("layout.searchDialog");
  const router = useRouter();
  const params = useParams();
  const channel = params.channel as string;
  
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Focus input when dialog opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery("");
      setResults([]);
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Close on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  // Debounced search
  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        // In a real implementation, this would call the GraphQL API
        // For now, we'll simulate with placeholder data
        const mockResults: SearchResult[] = [
          { id: "1", name: `${query} Running Shoes`, slug: "running-shoes", category: "Shoes", price: "$129.99" },
          { id: "2", name: `${query} Training Gear`, slug: "training-gear", category: "Equipment", price: "$79.99" },
          { id: "3", name: `${query} Sportswear`, slug: "sportswear", category: "Apparel", price: "$49.99" },
        ];
        setResults(mockResults);
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (results[selectedIndex]) {
        handleResultClick(results[selectedIndex]);
      } else if (query) {
        handleSearch();
      }
    }
  }, [results, selectedIndex, query]);

  const handleResultClick = (result: SearchResult) => {
    router.push(withChannel(channel, buildProductUrl(result.slug)));
    onClose();
  };

  const handleSearch = () => {
    if (query) {
      router.push(withChannel(channel, buildSearchUrl(query)));
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div data-cd="layout-searchDialog" className={`fixed inset-0 z-50 overflow-y-auto ${cdClasses}`} style={{ ...buildComponentStyle("layout.searchDialog", cdStyle) }}>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="flex min-h-full items-start justify-center px-4 pt-20">
        <div 
          ref={dialogRef}
          className="relative w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl"
        >
          {/* Search Input */}
          <div className="relative border-b border-neutral-200">
            <svg 
              className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400"
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={filtersText.searchPlaceholder}
              className="w-full py-4 pl-12 pr-12 text-lg outline-none placeholder:text-neutral-400"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Results */}
          <div className="max-h-[60vh] overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <svg className="h-8 w-8 animate-spin text-neutral-400" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </div>
            ) : results.length > 0 ? (
              <ul className="py-2">
                {results.map((result, index) => (
                  <li key={result.id}>
                    <button
                      onClick={() => handleResultClick(result)}
                      className={`flex w-full items-center gap-4 px-4 py-3 text-left transition-colors ${
                        selectedIndex === index ? "bg-neutral-100" : "hover:bg-neutral-50"
                      }`}
                    >
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-neutral-100">
                        {result.thumbnail ? (
                          <Image
                            src={result.thumbnail}
                            alt={result.name}
                            width={48}
                            height={48}
                            className="rounded-lg object-cover"
                          />
                        ) : (
                          <svg className="h-6 w-6 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-neutral-900">{result.name}</p>
                        <p className="text-sm text-neutral-500">{result.category}</p>
                      </div>
                      {result.price && (
                        <span className="font-semibold text-neutral-900">{result.price}</span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            ) : query.length >= 2 ? (
              <div className="py-12 text-center">
                <svg className="mx-auto h-12 w-12 text-neutral-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="mt-3 text-neutral-600">{navbarText.noResultsText ?? "No products found"} "{query}"</p>
                <p className="mt-1 text-sm text-neutral-500">{navbarText.noResultsHint ?? "Try searching with different keywords"}</p>
              </div>
            ) : (
              <div className="p-6">
                <p className="mb-4 text-sm font-medium text-neutral-500">{navbarText.popularSearchesLabel ?? "Popular Searches"}</p>
                <div className="flex flex-wrap gap-2">
                  {(navbarText.popularSearchTerms ?? ["Shoes", "Bags", "New Arrivals", "Sale"]).map((term) => (
                    <button
                      key={term}
                      onClick={() => setQuery(term)}
                      className="rounded-full bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-200"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          {query && (
            <div className="border-t border-neutral-200 bg-neutral-50 px-4 py-3">
              <button
                onClick={handleSearch}
                className="flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium text-white transition-colors"
                style={{ backgroundColor: branding.colors.primary }}
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                {navbarText.searchForText ?? "Search for"} "{query}"
              </button>
            </div>
          )}

          {/* Keyboard hints */}
          <div className="flex items-center justify-between border-t border-neutral-200 bg-neutral-50 px-4 py-2 text-xs text-neutral-500">
            <div className="flex gap-4">
              <span className="flex items-center gap-1">
                <kbd className="rounded bg-neutral-200 px-1.5 py-0.5 font-mono">↑</kbd>
                <kbd className="rounded bg-neutral-200 px-1.5 py-0.5 font-mono">↓</kbd>
                Navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="rounded bg-neutral-200 px-1.5 py-0.5 font-mono">Enter</kbd>
                Select
              </span>
            </div>
            <span className="flex items-center gap-1">
              <kbd className="rounded bg-neutral-200 px-1.5 py-0.5 font-mono">Esc</kbd>
              Close
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

