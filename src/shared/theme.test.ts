import {
  applyInitialTheme,
  resolveTheme,
  subscribeSystemTheme,
  systemTheme,
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

  test("notifies subscribers of OS changes and unsubscribes", () => {
    const media = installMatchMedia(true);
    const seen: string[] = [];
    const unsubscribe = subscribeSystemTheme((theme) => seen.push(theme));

    expect(media.listenerCount()).toBe(1);
    media.setMatches(false);
    expect(seen).toEqual(["light"]);

    unsubscribe();
    expect(media.listenerCount()).toBe(0);
  });

  test("subscribe is a no-op when matchMedia is unavailable", () => {
    const unsubscribe = subscribeSystemTheme(() => undefined);
    expect(typeof unsubscribe).toBe("function");
    expect(() => unsubscribe()).not.toThrow();
  });

  test("applies the initial OS theme to the document", () => {
    installMatchMedia(true);
    applyInitialTheme();
    expect(document.documentElement.dataset.theme).toBe("dark");
  });
});
