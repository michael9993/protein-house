import { isExternalURL } from "@dashboard/utils/urls";
import { Button as MacawNextButton } from "@saleor/macaw-ui-next";
import { forwardRef } from "react";
import { Link } from "react-router";

const _Button = forwardRef<HTMLButtonElement, any>(({ href, ...props }, ref) => {
  if (href && !isExternalURL(href)) {
    return (
      <Link to={href}>
        <MacawNextButton {...props} ref={ref} />
      </Link>
    );
  }

  if (href) {
    return (
      <a href={href}>
        <MacawNextButton {...props} ref={ref} />
      </a>
    );
  }

  return <MacawNextButton {...props} ref={ref} />;
});

_Button.displayName = "Button";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const Button = _Button as any;
