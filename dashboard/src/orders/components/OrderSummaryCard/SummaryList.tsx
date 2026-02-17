import { cn } from "@dashboard/utils/cn";
import { PropsWithChildren } from "react";

export const SummaryList = ({ children, className }: PropsWithChildren<{ className?: string }>) => {
  return (
    <ul
      className={cn(
        "list-none m-0 p-0 flex flex-col gap-2 text-base leading-[1.9] w-full [&_dl]:m-0 [&_dd]:m-0",
        className,
      )}
    >
      {children}
    </ul>
  );
};
