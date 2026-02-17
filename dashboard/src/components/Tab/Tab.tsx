import { cn } from "@dashboard/utils/cn";
import { Text } from "@saleor/macaw-ui-next";
import * as React from "react";

interface TabProps<T> {
  children?: React.ReactNode;
  isActive: boolean;
  changeTab: (index: T) => void;
  testId?: string;
}

export function Tab<T>(value: T) {
  const Component = (props: TabProps<T>) => {
    const { children, isActive, changeTab, testId } = props;

    return (
      <Text
        as="span"
        data-test-id={testId}
        className={cn(
          "border-b border-transparent text-text-secondary/60 cursor-pointer inline-block font-normal mr-4 min-w-[40px] p-2 transition-all duration-200",
          "hover:text-primary focus:text-primary",
          isActive && "border-b-primary text-text-secondary",
        )}
        onClick={() => changeTab(value)}
      >
        {children}
      </Text>
    );
  };

  return Component;
}
