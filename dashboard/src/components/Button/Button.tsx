import { isExternalURL } from "@dashboard/utils/urls";
import { Button as MacawButton } from "@saleor/macaw-ui";
import { forwardRef } from "react";
import { Link } from "react-router";

const _Button = forwardRef<HTMLButtonElement, any>(({ href, ...props }, ref) => {
  if (href && !isExternalURL(href)) {
    // @ts-expect-error legacy macaw types
    return <MacawButton {...props} to={href} component={Link} ref={ref} />;
  }

  return <MacawButton href={href} {...props} ref={ref} />;
});

_Button.displayName = "Button";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const Button = _Button as any;
