import "react-native-url-polyfill/auto";
import * as SecureStore from "expo-secure-store";
import { AppState } from "react-native";
import { createClient } from "@supabase/supabase-js";
import { env } from "@/config/env";

// Auth tokens are sensitive — store them in the OS secure enclave (iOS Keychain /
// Android Keystore) rather than unencrypted AsyncStorage.
const SecureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

// Single Supabase client for the app. Anon key only — never the service-role key.
// NOTE: only files under src/domain/services may import this (see eslint boundaries).
export const supabase = createClient(env.supabaseUrl, env.supabaseAnonKey, {
  auth: {
    storage: SecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Keep the session fresh while the app is foregrounded; pause in background.
AppState.addEventListener("change", (state) => {
  if (state === "active") supabase.auth.startAutoRefresh();
  else supabase.auth.stopAutoRefresh();
});
