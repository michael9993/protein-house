import { cn } from "@dashboard/utils/cn";
import { HTMLAttributes, ReactNode } from "react";

import Link from "../Link";

interface ListItemLinkProps extends HTMLAttributes<HTMLDivElement> {
  href?: string;
  children?: ReactNode;
  linkClassName?: string;
}

const ListItemLink = ({ href, children, linkClassName, className, ...props }: ListItemLinkProps) => {
  if (!href) {
    return (
      <div className={cn("relative", className)} {...props}>
        {children}
      </div>
    );
  }

  return (
    <div className={cn("relative", className)} {...props}>
      <Link className={cn("[all:inherit] contents", linkClassName)} href={href}>
        {children}
      </Link>
    </div>
  );
};

export default ListItemLink;
