import { act, renderHook } from "@testing-library/react";
import {
  applyInitialTheme,
  resolveTheme,
  systemTheme,
  useResolvedTheme,
  type ThemeMediaQuery,
} from "./theme";

type ChangeListener = () => void;

/** Installs a controllable `window.matchMedia` stub for the system-theme tests. */
function installMatchMedia(initialMatches: boolean) {
  const listeners = new Set<ChangeListener>();
  const media: ThemeMediaQuery = {
    matches: initialMatches,
    addEventListener: (_type, listener) => listeners.add(listener),
    removeEventListener: (_type, listener) => listeners.delete(listener),
  };

  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: jest.fn(() => media),
  });

  return {
    setMatches(matches: boolean) {
      media.matches = matches;
      listeners.forEach((listener) => listener());
    },
    listenerCount: () => listeners.size,
  };
}

function removeMatchMedia() {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: undefined,
  });
}

describe("theme resolution", () => {
  afterEach(() => {
    removeMatchMedia();
    delete document.documentElement.dataset.theme;
  });

  test("returns explicit modes unchanged", () => {
    expect(resolveTheme("light")).toBe("light");
    expect(resolveTheme("dark")).toBe("dark");
  });

  test("falls back to light when matchMedia is unavailable", () => {
    expect(systemTheme()).toBe("light");
    expect(resolveTheme("system")).toBe("light");
  });

  test("follows the OS colour scheme for the system mode", () => {
    const media = installMatchMedia(true);
    expect(resolveTheme("system")).toBe("dark");

    media.setMatches(false);
    expect(resolveTheme("system")).toBe("light");
  });

  test("re-resolves on OS changes and unsubscribes on unmount", () => {
    const media = installMatchMedia(true);
    const { result, unmount } = renderHook(() => useResolvedTheme("system"));

    expect(result.current).toBe("dark");
    expect(media.listenerCount()).toBe(1);

    act(() => media.setMatches(false));
    expect(result.current).toBe("light");

    unmount();
    expect(media.listenerCount()).toBe(0);
  });

  test("does not subscribe to OS changes for explicit modes", () => {
    const media = installMatchMedia(false);
    const { result } = renderHook(() => useResolvedTheme("dark"));

    expect(result.current).toBe("dark");
    expect(media.listenerCount()).toBe(0);
  });

  test("applies the initial OS theme to the document", () => {
    installMatchMedia(true);
    applyInitialTheme();
    expect(document.documentElement.dataset.theme).toBe("dark");
  });
});
