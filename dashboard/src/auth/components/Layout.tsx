import backgroundArt from "@assets/images/login-background.svg";
import saleorLogo from "@assets/images/saleor-logo.svg";
import saleorLogoWhite from "@assets/images/saleor-logo-white.svg";
import { useTheme } from "@saleor/macaw-ui";
import { ReactNode } from "react";
import SVG from "react-inlinesvg";

import { useUser } from "..";
import LoginLoading from "./LoginLoading";

const Layout = (props: { children: ReactNode }) => {
  const { children } = props;
  const { errors } = useUser();
  const { themeType } = useTheme();

  // show fullscreen loading when there is externalLoginError - we will redirect and
  // logout user in meantime
  if (errors.some(item => item === "externalLoginError")) {
    return <LoginLoading />;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[560px_1fr] min-[1440px]:grid-cols-[780px_1fr] gap-6 h-screen overflow-hidden relative w-screen">
      <div className="bg-background-paper flex flex-col h-screen justify-center pt-10 px-12 pb-8 w-full max-md:p-4">
        <SVG className="block h-10 mb-8" src={themeType === "dark" ? saleorLogoWhite : saleorLogo} />
        <div className="w-full sm:w-[328px] min-[1440px]:w-[380px] mx-auto">{children}</div>
      </div>
      <div className="hidden lg:flex lg:items-center">
        <SVG className="[&_svg]:w-full" src={backgroundArt} />
      </div>
    </div>
  );
};

Layout.displayName = "Layout";
export default Layout;
