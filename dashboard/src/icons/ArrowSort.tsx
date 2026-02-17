import { type SVGProps } from "react";

export default function ArrowSort(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" {...props}>
      <rect width="24" height="24" fill="transparent" />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M11.0328 17.1401V4H12.9672V17.1401L14.6322 15.4751L16 16.8429L12 20.8429L8 16.8429L9.36782 15.4751L11.0328 17.1401Z"
        fill="currentColor"
      />
    </svg>
  );
}
