import { useAppBridge } from "@saleor/app-sdk/app-bridge";
import { useTheme } from "@saleor/macaw-ui";
import { useEffect } from "react";

export function ThemeSynchronizer() {
  const { appBridge } = useAppBridge();
  const { setTheme } = useTheme();

  useEffect(() => {
    if (!appBridge) return;

    const handleThemeChange = (theme: { theme: "light" | "dark" }) => {
      setTheme(theme.theme === "dark" ? "defaultDark" : "defaultLight");
    };

    appBridge.subscribe("theme", handleThemeChange);
  }, [appBridge, setTheme]);

  return null;
}
