import { LinkWithChannel } from "@/ui/atoms/LinkWithChannel";
import { storeConfig } from "@/config";
import * as Checkout from "@/lib/checkout";
import clsx from "clsx";

export async function MobileCartButtonContent({ isActive, channel }: { isActive: boolean; channel: string }) {
  const { branding } = storeConfig;
  const checkoutId = await Checkout.getIdFromCookies(channel);
  const checkout = checkoutId ? await Checkout.find(checkoutId) : null;
  const lineCount = checkout ? checkout.lines.reduce((result, line) => result + line.quantity, 0) : 0;

  return (
    <LinkWithChannel
      href="/cart"
      className="relative flex flex-col items-center justify-center gap-1 rounded-lg px-3 py-2 transition-all duration-200"
      style={{
        backgroundColor: isActive ? branding.colors.primary : "transparent",
        color: isActive ? "#ffffff" : "var(--store-text-muted)",
      }}
    >
      <svg 
        className="h-6 w-6" 
        fill="none" 
        viewBox="0 0 24 24" 
        stroke="currentColor" 
        strokeWidth={2}
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" 
        />
      </svg>
      {/* Cart Badge */}
      {lineCount > 0 && (
        <div
          className={clsx(
            "absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white shadow-sm",
            lineCount > 9 && "h-5 w-6",
          )}
          style={{ backgroundColor: branding.colors.primary }}
        >
          {lineCount > 99 ? "99+" : lineCount}
        </div>
      )}
      <span className="text-[10px] font-medium">Cart</span>
    </LinkWithChannel>
  );
}

