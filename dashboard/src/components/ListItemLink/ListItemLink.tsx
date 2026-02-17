import { BaseListItemProps, ListItem } from "@saleor/macaw-ui";
import { cn } from "@dashboard/utils/cn";

import Link from "../Link";

interface ListItemLinkProps extends Omit<BaseListItemProps, "onClick" | "classes"> {
  href?: string;
  className?: string;
  linkClassName?: string;
}

const ListItemLink = ({ href, children, linkClassName, ...props }: ListItemLinkProps) => {
  if (!href) {
    return <ListItem {...props}>{children}</ListItem>;
  }

  return (
    <ListItem {...props}>
      <Link className={cn("[all:inherit] contents", linkClassName)} href={href}>
        {children}
      </Link>
    </ListItem>
  );
};

export default ListItemLink;
