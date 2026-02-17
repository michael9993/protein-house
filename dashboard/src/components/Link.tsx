// @ts-strict-ignore
import { cn } from "@dashboard/utils/cn";
import { isExternalURL } from "@dashboard/utils/urls";
import { TypographyProps } from "@mui/material/Typography";
import { Text } from "@saleor/macaw-ui-next";
import * as React from "react";
import { Link as RouterLink } from "react-router";

interface LinkState {
  from?: string;
}

// Note: we need to skip the `dangerouslySetInnerHTML` prop from the `React.AnchorHTMLAttributes`
// in order to match react-router Link props
interface LinkProps
  extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "dangerouslySetInnerHTML"> {
  href?: string;
  color?: "primary" | "secondary";
  inline?: boolean;
  underline?: boolean;
  typographyProps?: TypographyProps;
  onClick?: React.MouseEventHandler;
  disabled?: boolean;
  state?: LinkState;
}

const Link = (props: LinkProps) => {
  const {
    className,
    children,
    inline = true,
    color = "primary",
    underline = false,
    onClick,
    disabled,
    href,
    target,
    rel,
    state,
    ...linkProps
  } = props;
  const opensNewTab = target === "_blank";
  const commonLinkProps = {
    className: cn(
      inline && "cursor-pointer inline",
      color === "primary" && "text-text-highlighted",
      color === "secondary" && "text-primary",
      underline ? "underline" : "no-underline",
      disabled && "cursor-default text-text-highlighted-inactive",
      className,
    ),
    onClick: event => {
      if (disabled || !onClick) {
        return;
      }

      event.preventDefault();
      onClick(event);
    },
    target,
    rel: (rel ?? (opensNewTab && isExternalURL(href))) ? "noopener noreferer" : "",
    ...linkProps,
  };
  const urlObject = new URL(href, window.location.origin);

  return (
    <>
      {!!href && !isExternalURL(href) ? (
        <RouterLink
          to={
            disabled
              ? "#"
              : {
                  pathname: urlObject.pathname,
                  search: urlObject.search,
                  hash: urlObject.hash,
                }
          }
          state={disabled ? undefined : state}
          {...commonLinkProps}
        >
          {children}
        </RouterLink>
      ) : (
        // @ts-expect-error - wrong types
        (<Text as="a" href={disabled ? undefined : href} display="block" {...commonLinkProps}>
          {children}
        </Text>)
      )}
    </>
  );
};

Link.displayName = "Link";
export default Link;
