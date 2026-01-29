"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SearchIcon, XIcon } from "lucide-react";
import { SearchAutocomplete } from "./SearchAutocomplete";
import { useContentConfig } from "@/providers/StoreConfigProvider";

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
      router.push(`/${encodeURIComponent(channel)}/products?search=${encodeURIComponent(query)}`);
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
            className="h-9 w-full rounded-lg border border-neutral-300 bg-white px-3 py-1.5 pr-9 text-sm text-neutral-900 placeholder:text-neutral-500 focus:border-black focus:outline-none focus:ring-2 focus:ring-black/10 transition-all"
          />
          {query && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute inset-y-0 end-9 flex items-center justify-center text-neutral-400 hover:text-neutral-600 transition-colors"
              aria-label={searchClearAriaLabel}
            >
              <XIcon className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            type="submit"
            className="absolute inset-y-0 end-0 flex items-center justify-center rounded-r-lg px-2.5 text-neutral-500 hover:text-neutral-700 focus:text-neutral-700 transition-colors"
            aria-label={searchInputAriaLabel}
          >
            <SearchIcon className="h-4 w-4" />
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
