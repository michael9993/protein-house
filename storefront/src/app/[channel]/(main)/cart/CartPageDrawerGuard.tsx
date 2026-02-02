"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCartDisplayMode } from "@/providers/StoreConfigProvider";
import { useCartDrawerSafe } from "@/providers/CartDrawerProvider";

/**
 * When cart display mode is "drawer", visiting /cart should redirect to channel home
 * and open the cart drawer instead of showing the cart page.
 */
export function CartPageDrawerGuard({
  channel,
  children,
}: {
  channel: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const displayMode = useCartDisplayMode();
  const drawerContext = useCartDrawerSafe();

  useEffect(() => {
    if (displayMode !== "drawer") return;
    router.replace(`/${channel}`);
    drawerContext?.openDrawer();
  }, [displayMode, channel, router, drawerContext]);

  if (displayMode === "drawer") {
    return null;
  }

  return <>{children}</>;
}
