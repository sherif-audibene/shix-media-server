"use client";

import { createTheme } from "@mui/material/styles";

/**
 * App-wide MUI v7 theme. `cssVariables` enables CSS-variable theming which
 * plays well with SSR (no flash) and Emotion.
 */
export const theme = createTheme({
  cssVariables: true,
  palette: {
    mode: "light",
    primary: { main: "#1565c0" },
    secondary: { main: "#9c27b0" },
  },
  shape: { borderRadius: 8 },
  typography: {
    fontFamily: "var(--font-roboto), system-ui, sans-serif",
  },
});

export type AppTheme = typeof theme;
