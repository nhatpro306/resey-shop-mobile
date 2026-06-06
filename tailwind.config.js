/** @type {import('tailwindcss').Config} */
const v = (name) => `rgb(var(--${name}) / <alpha-value>)`;

module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // surfaces
        bg: v("bg"),
        "bg-muted": v("bg-muted"),
        surface: v("surface"),
        "surface-sunken": v("surface-sunken"),
        "img-bg": v("img-bg"),
        // text (legacy `text`/`muted` kept as aliases)
        fg: v("fg"),
        text: v("fg"),
        "fg-muted": v("fg-muted"),
        muted: v("fg-muted"),
        "fg-subtle": v("fg-subtle"),
        "fg-faint": v("fg-faint"),
        "fg-inverse": v("fg-inverse"),
        // borders
        border: v("border"),
        "border-strong": v("border-strong"),
        // brand
        ink: { DEFAULT: v("ink"), fg: v("on-ink") },
        accent: { DEFAULT: v("accent"), fg: v("on-accent"), ink: v("accent-ink") },
        primary: { DEFAULT: v("accent"), fg: v("on-accent") }, // legacy alias
        sale: v("sale"),
        ok: v("ok"),
        warn: v("warn"),
        // legacy status (fixed)
        success: "#22C55E",
        warning: "#F59E0B",
        danger: "#EF4444",
        info: "#3B82F6",
      },
      borderRadius: { sm: "0px", md: "0px", lg: "0px", pill: "999px" },
    },
  },
  plugins: [],
};
