"use client";

import Link from "next/link";
import { useWishlist } from "@/lib/wishlist";
import { storeConfig } from "@/config";
import { useContentConfig } from "@/providers/StoreConfigProvider";

interface AccountSectionsProps {
  channel: string;
  ordersCount: number;
  addressesCount: number;
}

export function AccountSections({ channel, ordersCount, addressesCount }: AccountSectionsProps) {
  const { items: wishlistItems } = useWishlist();
  const wishlistCount = wishlistItems.length;
  const { branding } = storeConfig;
  const content = useContentConfig();
  const ordersText = content.orders!;
  const wishlistText = content.wishlist!;
  const addressesText = content.addresses!;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 animate-fade-in-up" style={{ animationDelay: "200ms", animationFillMode: "both" }}>
      {/* Orders Section */}
      <Link
        href={`/${channel}/account/orders`}
        className="group relative overflow-hidden rounded-xl bg-white p-6 shadow-sm ring-1 ring-neutral-100 transition-all hover:shadow-md hover:ring-neutral-200"
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div 
              className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg text-white transition-transform group-hover:scale-110"
              style={{ backgroundColor: branding.colors.primary }}
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-neutral-900">{content.account.ordersTitle}</h3>
            <p className="mt-1 text-sm text-neutral-500">
              {ordersText.ordersPlacedCount.replace("{count}", ordersCount.toString())}
            </p>
          </div>
          <svg className="h-5 w-5 text-neutral-400 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </Link>

      {/* Wishlist Section */}
      <Link
        href={`/${channel}/account/wishlist`}
        className="group relative overflow-hidden rounded-xl bg-white p-6 shadow-sm ring-1 ring-neutral-100 transition-all hover:shadow-md hover:ring-neutral-200"
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-red-100 text-red-600 transition-transform group-hover:scale-110">
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-neutral-900">{content.account.wishlistTitle}</h3>
            <p className="mt-1 text-sm text-neutral-500">
              {wishlistText.itemsCount.replace("{count}", wishlistCount.toString())}
            </p>
          </div>
          <svg className="h-5 w-5 text-neutral-400 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </Link>

      {/* Addresses Section */}
      <Link
        href={`/${channel}/account/addresses`}
        className="group relative overflow-hidden rounded-xl bg-white p-6 shadow-sm ring-1 ring-neutral-100 transition-all hover:shadow-md hover:ring-neutral-200"
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 text-blue-600 transition-transform group-hover:scale-110">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-neutral-900">{content.account.addressesTitle}</h3>
            <p className="mt-1 text-sm text-neutral-500">
              {addressesText.addressesCount.replace("{count}", addressesCount.toString())}
            </p>
          </div>
          <svg className="h-5 w-5 text-neutral-400 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </Link>
    </div>
  );
}

