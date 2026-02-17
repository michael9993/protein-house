import { cn } from "@dashboard/utils/cn";
import { isExternalURL } from "@dashboard/utils/urls";
import { TableRow, TableRowTypeMap } from "@mui/material";
import { forwardRef } from "react";
import * as React from "react";
import { Link, LinkProps } from "react-router";

type MaterialTableRowPropsType = TableRowTypeMap["props"];

/** Extends react-router's `To` to also accept an inline `state` property. */
type LocationDescriptor = LinkProps["to"] | { pathname: string; state?: unknown; search?: string; hash?: string };

export interface TableRowLinkProps extends MaterialTableRowPropsType {
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
  let to: LinkProps["to"];
  let state: unknown;

  if (typeof href === "object" && "state" in href) {
    const { state: hrefState, ...rest } = href;
    to = rest;
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
