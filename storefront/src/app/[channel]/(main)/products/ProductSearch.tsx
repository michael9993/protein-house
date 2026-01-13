"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { storeConfig } from "@/config";
import { Search, X } from "lucide-react";

interface ProductSearchProps {
  channel: string;
  initialSearch?: string;
}

export function ProductSearch({ channel, initialSearch }: ProductSearchProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(initialSearch || "");
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { branding } = storeConfig;

  // Update search query when URL changes
  useEffect(() => {
    const urlSearch = searchParams.get("search") || searchParams.get("q") || "";
    setSearchQuery(urlSearch);
  }, [searchParams]);

  const handleSearch = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (value.trim()) {
      params.set("search", value.trim());
    } else {
      params.delete("search");
      params.delete("q");
    }
    
    // Reset to first page when searching
    params.delete("after");
    
    router.push(`/${channel}/products?${params.toString()}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputRef.current) {
      handleSearch(inputRef.current.value);
    }
  };

  const handleClear = () => {
    setSearchQuery("");
    const params = new URLSearchParams(searchParams.toString());
    params.delete("search");
    params.delete("q");
    params.delete("after");
    router.push(`/${channel}/products?${params.toString()}`);
    inputRef.current?.focus();
  };

  return (
    <form onSubmit={handleSubmit} className="relative w-full">
      <div 
        className={`relative flex items-center rounded-md border transition-all duration-200 ${
          isFocused 
            ? "border-opacity-100 shadow-sm" 
            : "border-opacity-60"
        }`}
        style={{
          borderColor: isFocused ? branding.colors.primary : "#e5e7eb",
          backgroundColor: "white",
        }}
      >
        {/* Search Icon */}
        <div className="absolute left-3 flex items-center pointer-events-none">
          <Search 
            className="h-4 w-4"
            style={{ color: isFocused ? branding.colors.primary : "#9ca3af" }}
          />
        </div>

        {/* Input */}
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Search products..."
          className="w-full pl-9 pr-9 py-2 text-sm bg-transparent border-0 focus:outline-none focus:ring-0 placeholder:text-neutral-400"
          style={{ color: branding.colors.text }}
        />

        {/* Clear Button */}
        {searchQuery && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2 flex h-6 w-6 items-center justify-center rounded text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-all duration-200"
            aria-label="Clear search"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </form>
  );
}
