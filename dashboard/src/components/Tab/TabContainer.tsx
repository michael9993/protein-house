import { cn } from "@dashboard/utils/cn";
import * as React from "react";

interface TabContainerProps {
  children: React.ReactNode | React.ReactNodeArray;
  className?: string;
}

export const TabContainer = (props: TabContainerProps) => {
  const { children } = props;

  return <div className={cn("border-b border-divider", props.className)}>{children}</div>;
};

TabContainer.displayName = "TabContainer";
