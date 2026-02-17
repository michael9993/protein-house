import useLocalStorage from "@dashboard/hooks/useLocalStorage";
import { createTheme, ThemeProvider as MuiThemeProvider } from "@mui/material/styles";
import {
  DefaultTheme,
  ThemeProvider as MacawThemeProvider,
} from "@saleor/macaw-ui-next";
import * as React from "react";

import { defaultTheme, localStorageKey } from "./consts";

// MUI v7 theme matching macaw-ui-next design tokens
// Breakpoints match themeOverrides.ts
const muiLightTheme = createTheme({
  cssVariables: true,
  palette: {
    mode: "light",
  },
  breakpoints: {
    values: { xs: 0, sm: 600, md: 1280, lg: 1680, xl: 1920 },
  },
  typography: {
    fontFamily: "'Inter var', sans-serif",
    fontSize: 13,
    body2: { fontSize: "13px" },
    caption: { fontSize: "13px", fontWeight: 500 },
  },
});

const muiDarkTheme = createTheme({
  ...muiLightTheme,
  cssVariables: true,
  palette: { mode: "dark" },
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [activeTheme] = useLocalStorage<DefaultTheme>(localStorageKey, defaultTheme);
  const muiTheme = activeTheme === "defaultDark" ? muiDarkTheme : muiLightTheme;

  return (
    // Keep MacawThemeProvider during transition (removed in D6f)
    <MacawThemeProvider defaultTheme={activeTheme}>
      <MuiThemeProvider theme={muiTheme}>{children}</MuiThemeProvider>
    </MacawThemeProvider>
  );
};
