import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useColorScheme } from "nativewind";

const STORAGE_KEY = "resey.theme";
type Mode = "light" | "dark";

interface ThemeState {
  mode: Mode;
  toggle: () => void;
  setMode: (m: Mode) => void;
}

const ThemeCtx = createContext<ThemeState>({ mode: "light", toggle: () => {}, setMode: () => {} });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { colorScheme, setColorScheme } = useColorScheme();
  const [ready, setReady] = useState(false);

  // Load saved preference once; default to light (design default).
  useEffect(() => {
    (async () => {
      const saved = (await AsyncStorage.getItem(STORAGE_KEY)) as Mode | null;
      setColorScheme(saved ?? "light");
      setReady(true);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const mode: Mode = colorScheme === "dark" ? "dark" : "light";

  function setMode(m: Mode) {
    setColorScheme(m);
    AsyncStorage.setItem(STORAGE_KEY, m);
  }
  function toggle() {
    setMode(mode === "dark" ? "light" : "dark");
  }

  // Avoid a flash before the stored preference is applied.
  if (!ready) return null;

  return <ThemeCtx.Provider value={{ mode, toggle, setMode }}>{children}</ThemeCtx.Provider>;
}

export const useTheme = () => useContext(ThemeCtx);
