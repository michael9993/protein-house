"use client";

import Link from "next/link";
import { useWishlist } from "@/lib/wishlist";
import { useBranding, useContentConfig } from "@/providers/StoreConfigProvider";

interface AccountSectionsProps {
  channel: string;
  ordersCount: number;
  addressesCount: number;
}

export function AccountSections({ channel, ordersCount, addressesCount }: AccountSectionsProps) {
  const { items: wishlistItems } = useWishlist();
  const wishlistCount = wishlistItems.length;
  const branding = useBranding();
  const content = useContentConfig();
  const ordersText = content.orders!;
  const wishlistText = content.wishlist!;
  const addressesText = content.addresses!;

  const sections = [
    {
      href: `/${channel}/account/orders`,
      title: content.account.ordersTitle,
      description: ordersText.ordersPlacedCount.replace("{count}", ordersCount.toString()),
    },
    {
      href: `/${channel}/account/wishlist`,
      title: content.account.wishlistTitle,
      description: wishlistText.itemsCount.replace("{count}", wishlistCount.toString()),
    },
    {
      href: `/${channel}/account/addresses`,
      title: content.account.addressesTitle,
      description: addressesText.addressesCount.replace("{count}", addressesCount.toString()),
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {sections.map((section) => (
        <Link
          key={section.href}
          href={section.href}
          className="group rounded-lg border border-neutral-200 bg-white p-5 transition-all hover:border-neutral-300 hover:shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-neutral-900 group-hover:underline">{section.title}</h3>
              <p className="mt-1 text-sm text-neutral-500">{section.description}</p>
            </div>
            <svg
              className="h-4 w-4 flex-shrink-0 text-neutral-400 transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </Link>
      ))}
    </div>
  );
}
