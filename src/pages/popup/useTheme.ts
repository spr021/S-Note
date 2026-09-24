import { useEffect, useState } from "react";
import type { ThemeMode } from "@src/shared/settings";
import {
  resolveTheme,
  subscribeSystemTheme,
  type ResolvedTheme,
} from "@src/shared/theme";

/**
 * Resolves the effective theme for the given mode and keeps it in sync with
 * `prefers-color-scheme` while the popup is open. Only subscribes to OS changes
 * when the mode is `"system"`; explicit light/dark modes never change.
 */
export function useResolvedTheme(mode: ThemeMode): ResolvedTheme {
  const [theme, setTheme] = useState<ResolvedTheme>(() => resolveTheme(mode));

  useEffect(() => {
    setTheme(resolveTheme(mode));
    if (mode !== "system") return;
    return subscribeSystemTheme(setTheme);
  }, [mode]);

  return theme;
}
