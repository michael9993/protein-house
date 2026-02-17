import * as React from "react";

interface FilterTabsProps {
  children?: React.ReactNode;
  currentTab: number | undefined;
}

const FilterTabs = (props: FilterTabsProps) => {
  const { children } = props;

  return (
    <div className="border-b border-divider pl-8 flex" role="tablist">
      {children}
    </div>
  );
};

export default FilterTabs;
