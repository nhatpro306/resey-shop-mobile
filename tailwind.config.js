/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        bg: "#0A0A0A",
        surface: "#141414",
        text: "#FAFAFA",
        muted: "#A1A1AA",
        border: "#262626",
        primary: { DEFAULT: "#6E0F11", fg: "#FFFFFF" },
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
