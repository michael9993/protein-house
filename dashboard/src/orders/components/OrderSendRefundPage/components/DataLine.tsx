import * as React from "react";

interface DataLineProps {
  label: React.ReactNode;
  children: React.ReactNode;
}

export const DataLine = ({ label, children }: DataLineProps) => {
  return (
    <li>
      <dl className="flex justify-between [&_dd]:m-0">
        <dt>{label}</dt>
        <dd>{children}</dd>
      </dl>
    </li>
  );
};
