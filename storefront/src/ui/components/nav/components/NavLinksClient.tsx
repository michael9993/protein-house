"use client";

import { NavLink } from "./NavLink";
import { NavLinkWithDropdown } from "./NavLinkWithDropdown";
import { ShopAllDropdown } from "./ShopAllDropdown";
import { SaleButton } from "./SaleButton";
import { useContentConfig } from "@/providers/StoreConfigProvider";

/** Recursive category type: supports sub-subcategories and deeper (Accessories > Homewares > Kitchen, etc.) */
export interface CategoryWithChildren {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  backgroundImage?: {
    url: string;
    alt: string | null;
  } | null;
  productCount?: number;
  children?: CategoryWithChildren[];
}

/** Shared shape for desktop nav and mobile menu (used by getNavData). */
export type MobileNavData = {
  categories: CategoryWithChildren[];
  collections: Array<{ id: string; name: string; slug: string }>;
  brands: Array<{ id: string; name: string; slug: string }>;
};

interface NavLinksClientProps {
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

export function NavLinksClient({ categories, collections, brands, channel }: NavLinksClientProps) {
  return (
    <>
      {/* Shop All Dropdown - static so fixed mega-menu can escape flex stacking */}
      <li className="inline-flex" style={{ position: "static" }}>
        <ShopAllDropdown
          categories={categories}
          collections={collections}
          brands={brands}
          channel={channel}
        />
      </li>

      {/* Sale Button - Next to Shop All */}
      <li className="inline-flex">
        <SaleButton channel={channel} />
      </li>
    </>
  );
}
