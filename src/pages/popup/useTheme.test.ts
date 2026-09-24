import { act, renderHook } from "@testing-library/react";
import { useResolvedTheme } from "./useTheme";
import type { ThemeMode } from "@src/shared/settings";
import type { ThemeMediaQuery } from "@src/shared/theme";

type ChangeListener = () => void;

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

describe("useResolvedTheme", () => {
  afterEach(() => {
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      writable: true,
      value: undefined,
    });
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

  test("switches to an explicit mode and drops the OS subscription", () => {
    const media = installMatchMedia(false);
    const { result, rerender } = renderHook(
      ({ mode }: { mode: ThemeMode }) => useResolvedTheme(mode),
      { initialProps: { mode: "system" as ThemeMode } }
    );

    expect(result.current).toBe("light");
    expect(media.listenerCount()).toBe(1);

    rerender({ mode: "dark" });
    expect(result.current).toBe("dark");
    expect(media.listenerCount()).toBe(0);
  });
});
