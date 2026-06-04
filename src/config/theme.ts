// Design tokens. Keep in sync with tailwind.config.js and docs/UI_UX.md §2.
export const tokens = {
  color: {
    bg: "#0A0A0A",
    surface: "#141414",
    text: "#FAFAFA",
    muted: "#A1A1AA",
    border: "#262626",
    primary: "#E11D48",
    primaryFg: "#FFFFFF",
    success: "#22C55E",
    warning: "#F59E0B",
    danger: "#EF4444",
    info: "#3B82F6",
  },
  spacing: [4, 8, 12, 16, 20, 24, 32, 40, 48],
  radius: { sm: 8, md: 12, lg: 16, pill: 999 },
  motion: { fast: 150, base: 250 },
} as const;
