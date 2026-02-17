import { List } from "@mui/material";
import * as React from "react";

interface ScrollableContentProps {
  children: React.ReactNode | React.ReactNode[];
}

export const ScrollableContent = ({ children }: ScrollableContentProps) => {
  return (
    <div className="max-h-[450px] overflow-auto">
      <List>{children}</List>
    </div>
  );
};
