import { Suspense } from "react";
import { MobileCartButtonContent } from "./MobileCartButtonContent";

export function MobileCartButtonWrapper({ isActive, channel }: { isActive: boolean; channel: string }) {
  return (
    <div className="flex flex-col items-center justify-center">
      <Suspense fallback={
        <div className={`flex flex-col items-center justify-center gap-1 rounded-lg px-3 py-2 ${
          isActive ? "text-white" : "text-neutral-600"
        }`}>
          <div className="h-6 w-6 animate-pulse rounded bg-neutral-200" />
          <span className="text-[10px] font-medium">Cart</span>
        </div>
      }>
        <MobileCartButtonContent isActive={isActive} channel={channel} />
      </Suspense>
    </div>
  );
}

