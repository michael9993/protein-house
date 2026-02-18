import { TableRow, type TableRowProps } from "@dashboard/components/Table";
import { cn } from "@dashboard/utils/cn";
import { isExternalURL } from "@dashboard/utils/urls";
import { forwardRef } from "react";
import * as React from "react";
import { Link, LinkProps } from "react-router";

/** Extends react-router's `To` to also accept an inline `state` property. */
type LocationDescriptor = LinkProps["to"] | { pathname: string; state?: unknown; search?: string; hash?: string };

export interface TableRowLinkProps extends TableRowProps {
  children: React.ReactNode;
  href?: string | LocationDescriptor;
  className?: string;
  linkClassName?: string;
  onClick?: () => void;
}

const TableRowLink = forwardRef<HTMLTableRowElement, TableRowLinkProps>((props, ref) => {
  const { href, children, linkClassName, onClick, ...restProps } = props;

  if (!href || (typeof href === "string" && isExternalURL(href))) {
    return (
      <TableRow ref={ref} hover={!!onClick} onClick={onClick} {...restProps}>
        {children}
      </TableRow>
    );
  }

  // Extract `state` from href object (react-router v7 requires state as separate prop)
  // Also split any embedded '?' from pathname → search (React Router v7 rejects '?' in pathname)
  let to: LinkProps["to"];
  let state: unknown;

  if (typeof href === "object" && "state" in href) {
    const { state: hrefState, pathname, search, hash, ...rest } = href;
    let cleanPathname = pathname;
    let derivedSearch = search;
    if (pathname?.includes("?")) {
      const idx = pathname.indexOf("?");
      cleanPathname = pathname.slice(0, idx);
      derivedSearch = search ?? pathname.slice(idx);
    }
    to = { ...rest, pathname: cleanPathname, search: derivedSearch, hash };
    state = hrefState;
  } else {
    to = href;
  }

  return (
    <TableRow ref={ref} hover={true} onClick={onClick} {...restProps}>
      <Link className={cn("[all:inherit] contents", linkClassName)} to={to} state={state}>
        {children}
      </Link>
    </TableRow>
  );
});

TableRowLink.displayName = "TableRowLink";
export default TableRowLink;
