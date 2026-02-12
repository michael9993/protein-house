"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SearchIcon, XIcon } from "lucide-react";
import { SearchAutocomplete } from "./SearchAutocomplete";
import { useContentConfig } from "@/providers/StoreConfigProvider";
import { buildProductsUrl, withChannel } from "@/lib/urls";

interface SearchBarProps {
  channel: string;
  /** When provided (e.g. on products page), pre-fills the input with current search from URL. */
  initialQuery?: string;
}

export function SearchBar({ channel, initialQuery = "" }: SearchBarProps) {
  const [query, setQuery] = useState(initialQuery);
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const content = useContentConfig();

  // Navbar search: all strings from content.navbar (translatable in Storefront Control > Content > Navbar)
  const searchPlaceholder = content.navbar?.searchPlaceholder ?? content.general?.searchPlaceholder ?? "Search...";
  const searchClearAriaLabel = content.navbar?.searchClearAriaLabel ?? content.filters?.searchClearAriaLabel ?? "Clear search";
  const searchInputAriaLabel = content.navbar?.searchInputAriaLabel ?? content.filters?.searchInputAriaLabel ?? "Search products";

  // Focus input when autocomplete opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim().length > 0) {
      router.push(withChannel(channel, buildProductsUrl({ search: query })));
      setIsOpen(false);
    }
  };

  const handleSelect = (href: string) => {
    setQuery("");
    setIsOpen(false);
  };

  const clearSearch = () => {
    setQuery("");
    setIsOpen(false);
    inputRef.current?.focus();
  };

  return (
    <div className="relative w-full max-w-[min(100%,20rem)] sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl">
      <form
        onSubmit={handleSubmit}
        className="group relative flex w-full items-center"
        onFocus={() => setIsOpen(true)}
      >
        <label className="sr-only" htmlFor="search-input">
          {searchInputAriaLabel}
        </label>
        <div className="relative flex-1">
          {/* Search icon on start side */}
          <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-3">
            <SearchIcon className="h-4 w-4 text-neutral-400 transition-colors group-focus-within:text-neutral-600" />
          </div>
          <input
            ref={inputRef}
            id="search-input"
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            placeholder={searchPlaceholder}
            autoComplete="off"
            className="search-input h-10 w-full rounded-full border border-neutral-200 bg-neutral-50 ps-9 pe-9 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 transition-all duration-200 focus:border-neutral-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900/5 hover:bg-neutral-100/80 hover:border-neutral-300"
          />
          {query && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute inset-y-0 end-8 flex items-center justify-center text-neutral-400 hover:text-neutral-600 transition-colors"
              aria-label={searchClearAriaLabel}
            >
              <XIcon className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            type="submit"
            className="absolute inset-y-0 end-0 flex items-center justify-center pe-3 text-neutral-400 hover:text-neutral-700 transition-colors"
            aria-label={searchInputAriaLabel}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </button>
        </div>
      </form>

      {isOpen && (
        <SearchAutocomplete
          query={query}
          channel={channel}
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          onSelect={handleSelect}
        />
      )}
    </div>
  );
}
