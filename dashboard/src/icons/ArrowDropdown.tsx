import { type SVGProps } from "react";

export default function ArrowDropdown(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" {...props}>
      <g style={{ fillRule: "evenodd" }}>
        <path d="M7 10l5 5 5-5z" />
      </g>
    </svg>
  );
}
