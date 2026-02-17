import { Tabs } from "@mui/material";
import * as React from "react";

interface FilterTabsProps {
  children?: React.ReactNode;
  currentTab: number | undefined;
}

const FilterTabs = (props: FilterTabsProps) => {
  const { children, currentTab } = props;

  return (
    <Tabs className="border-b border-divider pl-8" value={currentTab} indicatorColor={"primary"}>
      {children}
    </Tabs>
  );
};

export default FilterTabs;
