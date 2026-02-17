import { vars } from "@saleor/macaw-ui-next";
import * as React from "react";

interface CardTitleProps {
  children?: React.ReactNode;
  className?: string;
  title: string | React.ReactNode;
  subtitle?: string | React.ReactNode;
  toolbar?: React.ReactNode;
  onClick?: (event: React.MouseEvent<any>) => void;
  onClose?: () => void;
  backgroundColor?: keyof typeof vars.colors.background;
}

export const CardTitle = ({
  className,
  children,
  title,
  subtitle,
  toolbar,
  backgroundColor = "default1",
  ...rest
}: CardTitleProps) => (
  <div
    className={className}
    style={{
      backgroundColor: vars.colors.background[backgroundColor],
      paddingBottom: "13px",
    }}
    {...rest}
  >
    <div className="flex items-start justify-between px-6 pt-6">
      <div>
        {typeof title === "string" ? (
          <span className="text-base font-semibold">{title}</span>
        ) : (
          title
        )}
        {subtitle && (
          <div className="text-sm text-[var(--mu-colors-text-default2)] mt-1">{subtitle}</div>
        )}
      </div>
      {toolbar && <div>{toolbar}</div>}
    </div>
    {children}
  </div>
);
