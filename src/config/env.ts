import Constants from "expo-constants";

type Extra = {
  supabaseUrl: string;
  supabaseAnonKey: string;
  sentryDsn: string;
  webUrl: string;
};

const extra = (Constants.expoConfig?.extra ?? {}) as Partial<Extra>;

function required(value: string | undefined, name: string): string {
  if (!value) {
    // Fail loud in dev; in prod this surfaces a clear config error at startup.
    if (__DEV__) console.warn(`[env] Missing ${name}. Set it in .env (see .env.example).`);
  }
  return value ?? "";
}

// Prefer `process.env.EXPO_PUBLIC_*` — Metro statically inlines these into the bundle
// on every platform (including web, where `Constants.expoConfig.extra` is empty).
// Fall back to the app.config `extra` block for safety on native.
export const env = {
  supabaseUrl: required(
    process.env.EXPO_PUBLIC_SUPABASE_URL ?? extra.supabaseUrl,
    "EXPO_PUBLIC_SUPABASE_URL",
  ),
  supabaseAnonKey: required(
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? extra.supabaseAnonKey,
    "EXPO_PUBLIC_SUPABASE_ANON_KEY",
  ),
  sentryDsn: process.env.EXPO_PUBLIC_SENTRY_DSN ?? extra.sentryDsn ?? "",
  // Base URL of the web app — used to resolve relative image paths (e.g. /products/x.jpg)
  // stored by the web app. Strip any trailing slash.
  webUrl: (process.env.EXPO_PUBLIC_WEB_URL ?? extra.webUrl ?? "").replace(/\/+$/, ""),
};
