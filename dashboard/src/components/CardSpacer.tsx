import { vars } from "@saleor/macaw-ui-next";
import * as React from "react";

interface CardSpacerProps {
  children?: React.ReactNode;
  backgroundColor?: keyof typeof vars.colors.background;
}

export const CardSpacer = ({ children, backgroundColor = "default1" }: CardSpacerProps) => {
  return (
    <div
      className="mt-8 max-md:mt-4"
      style={{
        backgroundColor: vars.colors.background[backgroundColor],
      }}
    >
      {children}
    </div>
  );
};
CardSpacer.displayName = "CardSpacer";
export default CardSpacer;
