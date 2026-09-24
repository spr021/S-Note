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
 * Subscribes to OS colour-scheme changes and returns an unsubscribe function.
 * This module intentionally avoids React so the content-script bundle can use
 * it without pulling in a framework; the popup hook lives in `useTheme.ts`.
 */
export function subscribeSystemTheme(
  listener: (theme: ResolvedTheme) => void
): () => void {
  const media = getMediaQuery();
  if (!media) return () => undefined;

  const update = () => listener(media.matches ? "dark" : "light");
  if (media.addEventListener) {
    media.addEventListener("change", update);
    return () => media.removeEventListener?.("change", update);
  }
  // Fallback for environments without the modern MediaQueryList API.
  media.addListener?.(update);
  return () => media.removeListener?.(update);
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
