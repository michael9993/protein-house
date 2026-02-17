import * as React from "react";

interface ScrollableContentProps {
  children: React.ReactNode | React.ReactNode[];
}

export const ScrollableContent = ({ children }: ScrollableContentProps) => {
  return (
    <div className="max-h-[450px] overflow-auto">
      <ul className="list-none p-0 m-0">{children}</ul>
    </div>
  );
};
