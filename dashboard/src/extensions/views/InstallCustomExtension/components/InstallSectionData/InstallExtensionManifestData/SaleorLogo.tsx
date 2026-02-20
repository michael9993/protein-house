import auraLogoDarkMode from "@assets/images/logo-sidebar-light.svg";
import auraLogoLightMode from "@assets/images/logo-sidebar-dark.svg";
import { useTheme } from "@dashboard/theme";
import { DefaultTheme } from "@saleor/macaw-ui-next";

const getAuraLogoUrl = (theme: DefaultTheme) => {
  switch (theme) {
    case "defaultLight":
      return auraLogoLightMode;
    case "defaultDark":
      return auraLogoDarkMode;
    default:
      throw new Error("Invalid theme mode, should not happen.");
  }
};

export const SaleorLogo = () => {
  const { theme } = useTheme();

  return <img src={getAuraLogoUrl(theme)} alt="Aura" />;
};
