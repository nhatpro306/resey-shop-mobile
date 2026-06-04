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
        primary: { DEFAULT: "#E11D48", fg: "#FFFFFF" },
        success: "#22C55E",
        warning: "#F59E0B",
        danger: "#EF4444",
        info: "#3B82F6",
      },
      borderRadius: { sm: "8px", md: "12px", lg: "16px", pill: "999px" },
    },
  },
  plugins: [],
};
