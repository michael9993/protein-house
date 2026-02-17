import { useDragResize, usePluginContext, useTheme as useGraphiQLTheme } from "@graphiql/react";
import { useTheme, vars } from "@saleor/macaw-ui-next";
import { useEffect } from "react";

import graphiqlStyles from "./styles.module.css";

export { graphiqlStyles };

export const useEditorStyles = () => {
  const pluginContext = usePluginContext();
  const pluginResize = useDragResize({
    defaultSizeRelation: 1 / 3,
    direction: "horizontal",
    initiallyHidden: pluginContext?.visiblePlugin ? undefined : "first",
    sizeThresholdSecond: 200,
    storageKey: "docExplorerFlex",
  });
  const editorResize = useDragResize({
    direction: "horizontal",
    storageKey: "editorFlex",
  });
  const editorToolsResize = useDragResize({
    defaultSizeRelation: 3,
    direction: "vertical",
    sizeThresholdSecond: 60,
    storageKey: "secondaryEditorFlex",
  });

  return {
    pluginResize,
    editorResize,
    editorToolsResize,
  };
};

export const useDashboardTheme = () => {
  const {
    themeValues: {
      colors: { background },
    },
  } = useTheme();
  const match = background.default1.match(/hsla\(([^)]+)\)/);
  const rootStyle = {
    "--font-size-body": vars.fontSize[4],
    "--font-size-h2": vars.fontSize[6],
    "--font-size-h3": vars.fontSize[5],
    "--font-size-h4": vars.fontSize[4],
    "--font-weight-regular": vars.fontWeight.regular,
    "--font-size-hint": vars.fontSize[5],
    "--font-size-inline-code": vars.fontSize[3],
    "--color-base": match ? match[1] : background.default1,
  } as React.CSSProperties;

  return { rootStyle };
};

export const useGraphiQLThemeSwitcher = () => {
  const theme = useTheme();
  const { setTheme: setGraphiQLTheme } = useGraphiQLTheme();

  useEffect(() => {
    setGraphiQLTheme(theme.theme === "defaultDark" ? "dark" : "light");
  });
};
