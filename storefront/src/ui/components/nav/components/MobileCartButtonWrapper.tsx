"use client";

import { MobileCartButtonContent } from "./MobileCartButtonContent";
import { useContentConfig } from "@/providers/StoreConfigProvider";

export function MobileCartButtonWrapper({ isActive, channel }: { isActive: boolean; channel: string }) {
  const content = useContentConfig();
  const navbarText = content.navbar;

  return (
    <div className="flex flex-col items-center justify-center">
      <MobileCartButtonContent isActive={isActive} channel={channel} />
    </div>
  );
}

