import { useColorScheme } from "nativewind";

// Runtime color palettes (hex) for non-className consumers (icon colors, status bar,
// native props). Mirrors global.css CSS vars. Light is default; dark via toggle.
export const palettes = {
  light: {
    bg: "#FFFFFF",
    bgMuted: "#FAFAFA",
    surface: "#FFFFFF",
    surfaceSunken: "#F4F4F5",
    imgBg: "#F1F1F3",
    fg: "#09090B",
    fgMuted: "#52525B",
    fgSubtle: "#71717A",
    fgFaint: "#A1A1AA",
    fgInverse: "#FFFFFF",
    border: "#E4E4E7",
    borderStrong: "#09090B",
    accent: "#6E0F11",
    accentInk: "#4C0A0C",
    onAccent: "#FFFFFF",
    ink: "#09090B",
    onInk: "#FFFFFF",
    ok: "#047857",
    warn: "#B45309",
    sale: "#6E0F11",
  },
  dark: {
    bg: "#09090B",
    bgMuted: "#0E0E10",
    surface: "#131316",
    surfaceSunken: "#1A1A1D",
    imgBg: "#1A1A1D",
    fg: "#FAFAFA",
    fgMuted: "#A1A1AA",
    fgSubtle: "#8A8A93",
    fgFaint: "#52525B",
    fgInverse: "#09090B",
    border: "#27272A",
    borderStrong: "#FAFAFA",
    accent: "#E0595C",
    accentInk: "#C8484C",
    onAccent: "#FFFFFF",
    ink: "#FAFAFA",
    onInk: "#09090B",
    ok: "#34D399",
    warn: "#FBBF24",
    sale: "#E0595C",
  },
};

export type Palette = (typeof palettes)["light"];

/** Reactive palette for the current color scheme. */
export function useThemeColors(): Palette {
  const { colorScheme } = useColorScheme();
  return colorScheme === "dark" ? palettes.dark : palettes.light;
}

// Static tokens — defaults to LIGHT. Prefer useThemeColors() in components that
// must react to the toggle. Legacy keys kept for existing call sites.
const c = palettes.light;
export const tokens = {
  color: {
    bg: c.bg,
    surface: c.surface,
    surfaceSunken: c.surfaceSunken,
    imgBg: c.imgBg,
    text: c.fg,
    muted: c.fgMuted,
    subtle: c.fgSubtle,
    faint: c.fgFaint,
    border: c.border,
    borderStrong: c.borderStrong,
    ink: c.ink,
    onInk: c.onInk,
    primary: c.accent,
    primaryFg: c.onAccent,
    accent: c.accent,
    onAccent: c.onAccent,
    ok: c.ok,
    warn: c.warn,
    success: "#22C55E",
    warning: "#F59E0B",
    danger: "#EF4444",
    info: "#3B82F6",
  },
  spacing: [4, 8, 12, 16, 20, 24, 32, 40, 48],
  radius: { sm: 0, md: 0, lg: 0, pill: 999 },
  motion: { fast: 150, base: 250 },
} as const;
