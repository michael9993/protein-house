import auraLogo from "@assets/images/saleor-logo.svg";
import auraLogoWhite from "@assets/images/saleor-logo-white.svg";
import { useTheme } from "@saleor/macaw-ui-next";
import { ReactNode } from "react";
import SVG from "react-inlinesvg";

import { useUser } from "..";
import LoginLoading from "./LoginLoading";

const Layout = (props: { children: ReactNode }) => {
  const { children } = props;
  const { errors } = useUser();
  const { theme } = useTheme();
  const isDark = theme === "defaultDark";

  if (errors.some(item => item === "externalLoginError")) {
    return <LoginLoading />;
  }

  return (
    <div
      className="flex min-h-screen items-center justify-center px-4"
      style={{
        backgroundColor: "var(--mu-colors-background-default3)",
      }}
    >
      <div
        className="w-full max-w-[420px] rounded-xl p-10 sm:p-12"
        style={{
          backgroundColor: "var(--mu-colors-background-default1)",
          boxShadow: isDark
            ? "0 4px 24px rgba(0, 0, 0, 0.4)"
            : "0 4px 24px rgba(0, 0, 0, 0.06)",
        }}
      >
        <SVG
          className="mx-auto mb-10 block h-6"
          src={isDark ? auraLogoWhite : auraLogo}
        />
        {children}
      </div>
    </div>
  );
};

Layout.displayName = "Layout";
export default Layout;
