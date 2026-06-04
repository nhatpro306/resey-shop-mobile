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

export const env = {
  supabaseUrl: required(extra.supabaseUrl, "EXPO_PUBLIC_SUPABASE_URL"),
  supabaseAnonKey: required(extra.supabaseAnonKey, "EXPO_PUBLIC_SUPABASE_ANON_KEY"),
  sentryDsn: extra.sentryDsn ?? "",
  // Base URL of the web app — used to resolve relative image paths (e.g. /products/x.jpg)
  // stored by the web app. Strip any trailing slash.
  webUrl: (extra.webUrl ?? "").replace(/\/+$/, ""),
};
