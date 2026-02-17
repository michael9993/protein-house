import { cn } from "@dashboard/utils/cn";
import { Link, LinkProps } from "react-router";

export const InternalLink = ({ className, ...props }: LinkProps) => {
  return <Link className={cn("no-underline", className)} {...props} />;
};
