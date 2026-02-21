"use client";

import { useEffect } from "react";
import { trackSearch } from "@/lib/analytics";

export function TrackSearch({ query }: { query?: string }) {
  useEffect(() => {
    if (query) trackSearch(query);
  }, [query]);
  return null;
}
