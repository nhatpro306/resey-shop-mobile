// Flat config (ESLint 9+/10). Extends Expo and enforces layering boundaries.
const expoConfig = require("eslint-config-expo/flat");

module.exports = [
  ...expoConfig,
  {
    ignores: ["node_modules/**", ".expo/**", "dist/**", "babel.config.js"],
  },
  {
    // AuthContext is the one legitimate place that touches Supabase outside of services.
    files: [
      "app/**/*.{ts,tsx}",
      "src/ui/**/*.{ts,tsx}",
      "src/features/**/*.{ts,tsx}",
    ],
    ignores: ["src/features/auth/AuthContext.tsx"],
    rules: {
      // UI must not import the supabase client directly — go through hooks/services.
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@supabase/supabase-js",
              message: "UI must not import supabase-js. Use a hook -> service.",
            },
          ],
          patterns: [
            {
              group: ["@/data/supabase", "**/data/supabase"],
              message: "UI must not import the supabase client. Use a hook -> service.",
            },
          ],
        },
      ],
    },
  },
];
