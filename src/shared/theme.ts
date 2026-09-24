import { useEffect, useState } from "react";
import type { ThemeMode } from "./settings";

export type ResolvedTheme = "light" | "dark";

export const DARK_SCHEME_QUERY = "(prefers-color-scheme: dark)";

/** Media-query list abstraction so tests can inject a fake implementation. */
export interface ThemeMediaQuery {
  matches: boolean;
  addEventListener?: (type: "change", listener: () => void) => void;
  removeEventListener?: (type: "change", listener: () => void) => void;
  addListener?: (listener: () => void) => void;
  removeListener?: (listener: () => void) => void;
}

function getMediaQuery(): ThemeMediaQuery | null {
  if (
    typeof window === "undefined" ||
    typeof window.matchMedia !== "function"
  ) {
    return null;
  }
  return window.matchMedia(DARK_SCHEME_QUERY) as ThemeMediaQuery;
}

/** The colour scheme the operating system is currently requesting. */
export function systemTheme(): ResolvedTheme {
  return getMediaQuery()?.matches ? "dark" : "light";
}

/** Collapses a stored {@link ThemeMode} into the concrete scheme to render. */
export function resolveTheme(mode: ThemeMode): ResolvedTheme {
  return mode === "system" ? systemTheme() : mode;
}

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

    const media = getMediaQuery();
    if (!media) return;

    const update = () => setTheme(media.matches ? "dark" : "light");
    update();

    if (media.addEventListener) {
      media.addEventListener("change", update);
      return () => media.removeEventListener?.("change", update);
    }
    // Fallback for environments without the modern MediaQueryList API.
    media.addListener?.(update);
    return () => media.removeListener?.(update);
  }, [mode]);

  return theme;
}

/**
 * Applies the OS colour scheme to the document before React mounts. The popup
 * always renders with `theme: "system"` on first paint, so this avoids a flash
 * of the wrong theme while settings load from `chrome.storage`.
 */
export function applyInitialTheme(): void {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.theme = systemTheme();
}
