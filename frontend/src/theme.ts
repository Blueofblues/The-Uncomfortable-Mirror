import { useMemo } from "react";
import { Appearance, StyleSheet, useColorScheme } from "react-native";

export type ColorScheme = "light" | "dark";

const dark = {
  surface: "#050505",       onSurface: "#F5F5F5",
  surfaceSecondary: "#141414", onSurfaceSecondary: "#D4D4D4",
  surfaceTertiary: "#222222",  onSurfaceTertiary: "#A3A3A3",
  surfaceInverse: "#EBEBEB",   onSurfaceInverse: "#050505",
  muted: "#7A7A7A",
  brand: "#C0C0C0",            onBrand: "#050505",
  brandPrimary: "#EBEBEB",     onBrandPrimary: "#050505",
  brandSecondary: "#333333",   onBrandSecondary: "#F5F5F5",
  brandTertiary: "#1A1A1A",    onBrandTertiary: "#D4D4D4",
  success: "#1E3329", onSuccess: "#82C9A0",
  warning: "#332B1E", onWarning: "#D4A373",
  error: "#331E1E",   onError: "#D47373",
  info: "#1E2933",    onInfo: "#73A3D4",
  border: "#262626",  borderStrong: "#404040", divider: "#1A1A1A",
};

export type ThemeColors = typeof dark;
export const defaultScheme = "dark" satisfies ColorScheme;
export const themes: { light?: ThemeColors; dark: ThemeColors } = { dark };

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48 };
export const radius  = { sm: 6, md: 12, lg: 20, pill: 999 };
export const fonts   = { display: "serif" as const, text: "System" as const };
export const colors  = dark;

export function setColorScheme(scheme: ColorScheme | null) {
  Appearance.setColorScheme?.(scheme ?? "unspecified");
}
setColorScheme?.("dark");

export function useTheme(): { scheme: ColorScheme; colors: ThemeColors } {
  const system = useColorScheme();
  const scheme: ColorScheme = system === "light" && themes.light ? "light" : "dark";
  return { scheme, colors: themes[scheme] ?? themes.dark };
}

export function makeStyles<T extends StyleSheet.NamedStyles<T> | StyleSheet.NamedStyles<any>>(
  factory: (c: ThemeColors) => T & StyleSheet.NamedStyles<any>,
): () => T {
  return function useStyles(): T {
    const { colors: c } = useTheme();
    return useMemo(() => StyleSheet.create(factory(c)), [c]);
  };
}
