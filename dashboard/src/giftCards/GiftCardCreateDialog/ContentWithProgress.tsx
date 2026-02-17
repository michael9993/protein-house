import { SaleorThrobber } from "@dashboard/components/Throbber";
import { cn } from "@dashboard/utils/cn";
import { PropsWithChildren } from "react";

interface ContentWithProgressProps {
  containerClassName?: string;
}

const ContentWithProgress = ({
  containerClassName,
  children,
}: PropsWithChildren<ContentWithProgressProps>) => {
  return children ? (
    <>{children}</>
  ) : (
    <div className={cn("flex items-center justify-center h-full w-full p-6", containerClassName)}>
      <SaleorThrobber />
    </div>
  );
};

export default ContentWithProgress;
