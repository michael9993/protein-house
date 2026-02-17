import { cn } from "@dashboard/utils/cn";
import { Tooltip } from "@saleor/macaw-ui-next";
import * as React from "react";

import { useOverflow } from "./useOverflow";

interface OverflowTooltipProps {
  children: React.ReactNode;
  title?: React.ReactNode;
  header?: string;
  checkHorizontal?: boolean;
  checkVertical?: boolean;
  className?: string;
}

const OverflowTooltip = ({
  checkHorizontal = true,
  checkVertical = true,
  title,
  header,
  className,
  children,
}: OverflowTooltipProps) => {
  const { ref, isOverflow } = useOverflow<HTMLDivElement>({
    horizontal: checkHorizontal,
    vertical: checkVertical,
  });

  if (!isOverflow) {
    return (
      <div ref={ref} className={cn("overflow-hidden text-ellipsis", className)}>
        {children}
      </div>
    );
  }

  return (
    <Tooltip>
      <Tooltip.Trigger>
        <div ref={ref} className={cn("overflow-hidden text-ellipsis", className)}>
          {children}
        </div>
      </Tooltip.Trigger>
      <Tooltip.Content side="top">
        <Tooltip.Arrow />
        <Tooltip.ContentHeading>{header}</Tooltip.ContentHeading>
        <div className="overflow-hidden text-ellipsis max-w-[80vw] break-words">{title ?? children}</div>
      </Tooltip.Content>
    </Tooltip>
  );
};

export default OverflowTooltip;
