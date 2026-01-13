"use client";

import { usePathname, useParams } from "next/navigation";
import { MobileBottomNavContent } from "./MobileBottomNavContent";

export function MobileBottomNavClient({ channel }: { channel: string }) {
  const pathname = usePathname();
  const params = useParams();
  
  // Get the channel from params or extract from pathname
  const currentChannel = params?.channel as string || pathname.split("/")[1] || channel;
  const homeUrl = `/${currentChannel}`;
  
  // Check if we're on the home page (just the channel path)
  const isHome = pathname === homeUrl || pathname === `/${currentChannel}` || pathname === "/";
  const isProducts = pathname?.includes("/products");
  const isCart = pathname?.includes("/cart");
  const isAccount = pathname?.includes("/account") || pathname?.includes("/login");
  
  return (
    <MobileBottomNavContent 
      channel={channel} 
      pathname={pathname}
      isHome={isHome}
      isProducts={isProducts}
      isCart={isCart}
      isAccount={isAccount}
    />
  );
}

